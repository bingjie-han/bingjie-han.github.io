# Ice Blog

这是一个基于 Jekyll 的个人博客，已经整理为独立的 Ice Blog 主题。

## 本地运行

```bash
bundle install
bundle exec jekyll serve
```

打开 `http://127.0.0.1:4000/` 预览。

## 写文章

在 `_posts` 目录新增 Markdown 文件，文件名格式建议为：

```text
YYYY-MM-DD-title.md
```

文章头信息示例：

```yaml
---
layout: post
title: "文章标题"
subtitle: "一句简短说明"
date: 2026-04-16 21:00:00 +0800
author: 韩冰洁
tags:
  - 学习
  - 生活
---
```

## 主要文件

- `_config.yml`: 站点信息、头像、导航、分页和 PWA 配置。
- `_layouts/`: 页面和文章模板。
- `_includes/`: head、导航、页脚。
- `css/ice-blog.css`: 新主题样式。
- `_posts/`: 博客文章。
- `sw.js`: 离线缓存 service worker。
