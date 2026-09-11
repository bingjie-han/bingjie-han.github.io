---
author: 冰冰洁
tags:
  - bash
date: 2026-09-10
---
# lab1

题目内容是找到用户隐藏的密码文件，于是使用以下命令：

```bash
ls -a
```

得到了隐藏的密码文件，cat获得用户sophia密码

# lab2

题目描述：

![[Pasted image 20260910120611.png]]

于是使用以下命令：

```bash
find / -name "whereismypazz.txt" 2>/dev/null
```

得到用户angela的密码，进入下一关

# lab3

题目描述：

![[Pasted image 20260910120848.png]]

于是使用以下命令：

```bash
sed -n '4069p' findme.txt
```

- **`sed`**：Linux 中的文本流编辑工具，可以按行查找、打印、替换、删除文本。
- **`-n`**：关闭 `sed` 默认的自动输出。否则 `sed` 会把整个文件都打印出来。
- **`'4069p'`**：
    - `4069`：指定第 4069 行。
    - `p`：print，打印这一行。
    - 所以合起来就是：**打印第 4069 行**

得到用户密码，进入下一关

# lab4

题目描述：

![[Pasted image 20260910121106.png]]


由于文件名称叫“-”，如果不对他进行特别处理则Linux会认为他是参数，于是使用单引号将他包裹：

```bash
find . -name '-'
```

得到密码，进入下一关

# lab5

题目描述：

![[Pasted image 20260910121823.png]]

于是使用这个命令：

```bash
find / -type d -name "hereiam" 2>/dev/null

cd /opt/hereiam/

ls -a
```

# lab6

题目描述：

![[Pasted image 20260910122427.png]]

luna将他的密码放在muack这个文件夹中，所以先找到这个文件夹：

```bash
find / -type d -name "muack" 2>/dev/null
```

找到后发现文件夹中有很多文件，因此再做一遍筛选：

```bash
find . -type f -printf '%s %p\n' | sort -n
```

这样找到了最小的文件，得到密码

```
j3vkuoKQwvbhkMc
```

# lab7

题目描述：

![[Pasted image 20260910132706.png]]

直接寻找大小为6969bytes的文件：

```bash
find / -type f -size 6969c 2>/dev/null
```

进入下一关

# lab8

题目描述：

![[Pasted image 20260910133332.png]]

直接寻找属于violin的文件：

```bash
find / -type f -user violin 2>/dev/null
```

得到密码，进入下一关

# lab9

题目描述：

![[Pasted image 20260910133606.png]]

说这个用户的密码在一个压缩包里，因此尝试使用unzip去解压，但是报错了。于是想到先创建一个tmp文件夹，然后将文件解压到临时文件夹中：

```bash
mkdir -p /temp/
unzip passw0rd.zip -d /tmp/
```

但是这样查看unzip的文件时依旧报错，因此我直接使用命令行zip文件的内容输出到终端：

```bash
unzip -p passw0rd.zip
```

- `-p` = pipe，把解压后的内容直接输出到标准输出，不创建文件

得到密码，进入下一关

# lab10

查看题目描述：

![[Pasted image 20260910134448.png]]

于是使用以下命令查找：

```bash
grep '^a9HFX' passy
```

- `grep`：在文本中搜索符合条件的行
- `^`：正则表达式中的**行首**
- `ipa`：要匹配的字符串
- `'^ipa'`：因此表示**以 `ipa` 开头**

# lab11

题目描述：

![[Pasted image 20260910134817.png]]

使用命令：

```bash
grep '0JuAZ$' end
```

- `$`:正则表达式中表示行结尾

# lab12

![[Pasted image 20260910135052.png]]

所以使用以下命令：

```bash
grep 'fu.*ck' file.yo
```

- `.*`：中间可以有任意数量的字符
- `fu`:前面的字符
- `ck`：后面的字符

# lab13

题目描述：

![[Pasted image 20260910135457.png]]

这个说alice的密码在环境变量里，因此我们使用命令

```bash
env
```

查看环境变量，得到了alice的密码

# lab14

![[Pasted image 20260910140242.png]]


这个题目描述说管理员把用户 `anna` 的密码作为一条注释（comment），留在了 `passwd` 文件中。因此我们要寻找passwd的注释

我先后执行了以下三个命令行，都没有想要的输出：

```bash
grep '^#' /etc/passwd
grep '^[[:space:]]*#' /etc/passwd
grep -ni 'anna' /etc/passwd/
```

- `-n`：显示行号
- `-i`：忽略大小写

于是尝试查看anna的前后三行：

```bash
grep -ni -B 3 -A 3 'anna' /etc/passwd
```

- `-B 3` 表示显示匹配行之前 3 行，`-A 3` 表示之后 3 行。

得到密码

# lab15

题目描述：

![[Pasted image 20260910141448.png]]

第一反应是使用sudo用natalia登录，但是报错了

如果要一条一条的试的话会浪费时间，因此我们直接使用以下命令看我们现在的用户有什么权力：

```bash
sudo -l 
```

得到结果：

![[Pasted image 20260910143119.png]]

anna可以run这个用户的命令行，因此使用以下命令进入natalia的命令行：

```bash
sudo -u natalia /usr/bin/bash
```

# lab16

题目描述：

![[Pasted image 20260910143325.png]]

使用以下命令：

```bash
base64 -d base64.txt
```

# lab17

题目描述：

![[Pasted image 20260910143557.png]]

因此我们要寻找在很久之前创建的命令，使用以下命令：

```bash
find / -mtime +20075 -type f 2>/dev/null | xargs cat
```

- `-mtime +20075`:筛选更新时间距今20075天的文件
- `xargs cat` ：将前面的答案通过管道符传到后面，然后作为cat命令的参数

得到下一关的密码

# lab18 

题目描述：

![[Pasted image 20260911112339.png]]

要得到这个压缩包的密码需要用rockyou.txt来破解，然而发现机子上没有rockyou这个文件，因此将其传到本地后用自己机器上的rock破解：

```bash
scp -p 5000  clara@venus.hackmyvm.eu:~/protected.zip .

zip2john protected.zip > protected.hash

john --wordlist=/usr/share/wordlists/rockyou.txt protected.hash

john --show protected.hash
```

得到密码pass123

但是回到机子上解压的时候报错说没有权限，因此还是使用之前的将压缩包中的内容直接输出到终端的命令，得到结果：

![[Pasted image 20260911112709.png]]

# lab19

题目描述：

![[Pasted image 20260911113422.png]]

一开始以为是找唯一重复的，搜索后没有结果，又以为是找唯一不重复的，还是没有结果（英语不好的锅），用了以下两个命令，记录一下：

```bash
sort repeated.txt | uniq -d # 找到重复过的行
sort repeated.txt | uniq -u # 找到没有重复过的行
```

- `sort` ：排序命令，会把相同的行排在一起
- `uniq`：会合并连续重复的行
- `-d`：--repeated，只显示重复出现过的行

仔细阅读题意发现是在没有排序的时候唯一重复的行，因此使用以下命令：

```bash
 uniq -d repeated.txt
```

得到密码，进入下一关

# lab20

![[Pasted image 20260911114301.png]]

这个提示看得人懵懵的 第一反应是iris的key藏在本地环境的某个地方

先`ls -la`一下，看到了有一个iris_key的文件

查看发现是iris的私钥，于是猜测可以直接用ssh连iris用户的这台机子

```bash
ssh -i ./.iris_key iris@venus
```

- `-i` ：指定私钥文件

得到密码，进入下一关

# lab21

![[Pasted image 20260911121628.png]]

查看目录下的用户同名文件发现这个是base64编码的图片数据，因此将内容赋值到自己的机子解码，得到密码

进入下一关

# lab22

![[Pasted image 20260911122709.png]]

查看目录下的`hi`文件，发现其格式符合16进制的转储格式，解密得到密码：

```
uvMwFDQrQWPMeGP
```

# lab23

![[Pasted image 20260911123307.png]]

