---
tags:
date: 2026-09-15
author: 冰冰洁
---
![[Pasted image 20260915102711.png]]

# 信息收集

打靶机中的信息收集通常包括扫描端口、识别服务、查找入口

## 1. 扫描端口

```bash
nmap -p- -Pn -n 127.0.0.1
```

- `-p-`：扫描全部端口
- `-Pn`：跳过主机发现：不先通过 Ping 等主机发现方式判断目标是否在线，而是直接进行端口扫描。适用于靶机屏蔽 Ping，但实际仍然开放服务的情况。
- `-n`：不进行DNS解析，减少不必要的等待

得到的结果：

![[Pasted image 20260915103502.png]]

可以看到端口22和80开通了ssh和http服务，3306端口开通了mysql服务，总共开放了十个端口

猜测该靶机开放了一个有数据库的网页，后面需要从网页中得到ssh的密码

再使用以下命令进行扫描，该命令指定特定的端口，同时使用nmap的默认脚本去得到更多信息

```bash
nmap -p22,80,3306 -sVC -Pn -n 127.0.0.1
```

- `-p`：指定特定的端口
- `-sV`：服务版本探测
- `-C`：使用指定的脚本

得到的结果如下：

![[Pasted image 20260915104358.png]]

由于刚开始扫描到开放了十个端口，因此我们需要将其他所有端口也扫描了：

```bash
nmap -sVC -p 22,80,443,631,1514,3306,5000,33060,36269,51000 -Pn -n 127.0.0.1
```

![[Pasted image 20260915105114.png]]

可以得到其他的端口好像都没有扫描到能够确定的正在运行的服务。

80端口开放的服务是nginx，3306就是mysql服务，以及ssh服务。猜测该靶机要从这三个因素入手

从第一张截图可以得到开放接口`/apps`

于是尝试以下命令：

```bash
curl -i http://127.0.0.1/apps
```

得到了一大段返回内容：

![[Pasted image 20260915110543.png]]

这是一大段经过转义的json数据，大概如下：

```
"blocks.datasource-empty":"Empty Data Source"
"blocks.document-extractor":"Document Extractor"
"blocks.http-request":"HTTP Request"
"blocks.if-else":"IF/ELSE"
"blocks.iteration":"Iteration"
"blocks.knowledge-index":"Knowledge Base"
"blocks.knowledge-retrieval":"Knowledge Retrieval"
"blocks.llm":"LLM"
"blocks.tool":"Tool"
"blocks.trigger-webhook":"Webhook Trigger"
```

再使用以下命令查看响应头：

```bash
curl -sI http://127.0.0.1/apps
```

![[Pasted image 20260915111051.png]]

说明这个接口是真正可用的，因此我们再执行以下命令：

```bash
curl -sL http://127.0.0.1/apps > apps.html #将得到的结果输入html文件中，方便后续分析
grep -ioE 'dify|_next|nextjs|webpack|api|console|login|signin|version' apps.html | sort -u  #判断该网页是否是dify集成的
```

![[Pasted image 20260915140121.png]]

![[Pasted image 20260915140914.png]]

进一步发现许多js文件，尝试从前端js文件反推后端的api

## 寻找可用api

```bash
mkdir -p dify-js
grep -oE 'src="[^"]+\.js[^"]*"' apps.html \
| sed 's/^src="//;s/"$//' \
| sort -u \
| while read url; do
    file="dify-js/$(basename "$url")"
    echo "[+] $url"
    curl -s "http://127.0.0.1$url" -o "$file"
done
```