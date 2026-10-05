---
tags:
  - "#ssti"
  - "#web"
date: 2026-09-21 19:00
author: 冰冰洁
---

# 题目分析

首先进入题目看到以下提示：

![[Pasted image 20260921185735.png]]
smarty是ctf中常见有`ssti`漏洞的一个引擎。

猜测此题目与`ssti`有关

且上面有提示`XFF`

# 寻找可用点

尝试抓包将`X-Forward-For`的值改成`{7*7}`

仔细查看返回页面，发现有变化：

![[Pasted image 20260921190630.png]]

![[Pasted image 20260921190651.png]]这是原来的界面

因此尝试得到flag:

![[Pasted image 20260921191526.png]]

结果发现无论是`ls`还是`cat`，都只要一涉及这个就请求异常

查看`nssctf`里的wp发现payload差不多，可能是平台问题。故不再尝试