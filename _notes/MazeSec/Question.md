---
date: 2026-11-03 13:40
author: 冰冰洁
title: Question
---
# 信息收集

![[Pasted image 20261103135424.png]]

`80`端口开放`http`服务，于是先访问对应页面看一下

发现是一个对答界面，回答几个问题后得到以下信息：

![[Pasted image 20261103135931.png]]


```
ftasy / 9KCKpWmU4kSywIerez6l
```

尝试登录，成功

![[Pasted image 20261103140209.png]]


# root提权

首先查看该用户有哪些sudo权限，以及属于哪个组：

```bash
sudo -l #查看当前用户的sudo权限
id -ng #查看当前用户属于哪个组
```

![[Pasted image 20261103141222.png]]

得到以上结果，感觉没有可以利用的漏洞，于是回到网页寻找线索

## 信息收集

回到问答界面，发现第3、7轮的问答是简单可答的一些问题，但是偶数轮的问题是没有答案的问题，且点击奇数轮界面中的链接可以显示内容，而偶数轮中的链接无法跳转，会报错

![[Pasted image 20261103141908.png]]

![[Pasted image 20261103141742.png]]

该链接有效，仔细观察这些链接发现其get参数是token，猜测与token有关。

于是记下当前token：

```token
/join.php?token=c20cc707b0207faa6c8c5edc89b4e99c
```

在聊天室中发现另一个用户oranger的密码，尝试登录：

```bash
su oranger
```

没有找到可以用来提权的线索，于是尝试使用oranger的密码登录root，成功

![[Pasted image 20261103153039.png]]
