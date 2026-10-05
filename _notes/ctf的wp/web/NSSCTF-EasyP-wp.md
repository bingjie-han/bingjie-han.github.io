---
tags:
  - "#php"
  - "#绕过"
  - "#超全局变量"
date: 2026-09-17 19:00
author: 冰冰洁
---

首先进入题目环境得到以下的代码：

```php
<?php  
include 'utils.php';  
  
if (isset($_POST['guess'])) {    $guess = (string) $_POST['guess'];  
    if ($guess === $secret) {        $message = 'Congratulations! The flag is: ' . $flag;  
    } else {        $message = 'Wrong. Try Again';  
    }  
}  
  
if (preg_match('/utils\.php\/*$/i', $_SERVER['PHP_SELF'])) {  
    exit("hacker :)");  
}  
  
if (preg_match('/show_source/', $_SERVER['REQUEST_URI'])){  
    exit("hacker :)");  
}  
  
if (isset($_GET['show_source'])) {    highlight_file(basename($_SERVER['PHP_SELF']));  
    exit();  
}else{    show_source(__FILE__);  
}  
?>
```

对代码分析一波：

第一个说是如果post的内容里面有guess这个变量，且guess能与变量secret的值相同，那就给我flag

第二个是从两个地方对我们输入的url进行了字符禁止

第一个正则：

```php
if (preg_match('/utils\.php\/*$/i')

#禁止输入utils.php//加上若干个斜杠
```

第二个很直接，禁止了后面的show_source。

但是第三行代码又说只要通过get传入一个show_source的参数，那么就能够得到后面的全局变量的内容

由于：`$_SERVER['PHP_SELF']`表示**当前正在执行的 PHP 脚本路径**。

因此我们先绕过第一个ban：

```php
/index.php/utils.php/%a0
#basename只取最后一个文件名
#使用utils.php 后面并不是只有绕过
```

绕过第二个使用的点是PHP 对 GET 参数名的规范化：

```
/index.php/utils.php/%a0?show+source=1
```

原理如下：

1. 在 `application/x-www-form-urlencoded` 风格的查询参数解析中，`+` 会被解码为空格，所以 PHP 解析时首先相当于看到：`show source=1`
2. PHP 在创建 `$_GET` 数组时，会把参数名中的某些字符转换成 `_`。其中就包括空格和点号。

所以：

```
show source     
↓
show_source
```