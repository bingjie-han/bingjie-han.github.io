---
tags:
  - "#flask"
  - "#代码审计"
  - "#web"
date: 2026-09-21 21:00
author: 冰冰洁
---
# 题目审查

![[Pasted image 20260921210921.png]]

打开题目查看源码得到提示（我这里是`dirsearh`发现的）

得到如下代码：

  
import flask

app = flask.Flask(__name__)

@app.route('/', methods=['GET'])
def index():
  return flask.send_file('index.html')

@app.route('/src', methods=['GET'])
def source():
  return flask.send_file('app.py')

@app.route('/super-secret-route-nobody-will-guess', methods=['PUT'])
def flag():
  return open('flag').read()

说是要将方法改成PUT且访问对应目录就能得到flag

# payload

直接按照说的去更改方式，得到flag

![[Pasted image 20260921210828.png]]


# 知识点

Flask 是一个基于 Python 的**轻量级 Web 开发框架**，本身提供了路由、请求处理、Cookie/Session、模板渲染等常见 Web 功能。在 CTF 中，Flask 经常被用来快速搭建靶场和 Web 题目，例如通过 `/login`、`/admin`、`/api` 等路由实现登录认证、权限控制和接口交互，再故意加入 SQL 注入、SSTI、任意文件读取、命令执行、Session/Cookie 伪造等漏洞，让选手分析代码或通过 Web 交互寻找 Flag。