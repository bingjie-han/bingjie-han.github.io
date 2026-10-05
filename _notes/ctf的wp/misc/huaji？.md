---
date: 2026-10-05 21:00
author: 冰冰洁
title: "huaji？：图片隐写分析"
permalink: /notes/ctf/misc/huaji/
tags:
  - "#图片隐写"
---

将图片放入010editor，发现文件开头如下：

![[Pasted image 20261005210154.png]]

`FF D8 FF E0`，是jpg文件的格式，因此将后缀改成`.jpg`

![[huaji？.jpg]]

得到如上的图片，没有什么信息

于是找找隐藏的压缩包

打开010editor，搜索压缩包的头`50 4B 03 04`

![[Pasted image 20261005210704.png]]

找到了。同时发现这里面的ASCII码中存在一个flag.txt

于是尝试使用7.zip提取压缩包，发现需要密码

![[Pasted image 20261005213656.png]]

继续去010editor寻找线索，发现以下部分比较可疑：

![[Pasted image 20261005213914.png]]

**右边的文本很像十六进制，并且没有超过`0x80`的十六进制数**

所以大胆猜想是ASCII码

解码，得到密码

然后得到flag.txt，得到flag
