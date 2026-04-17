# Ice Blog

这是一个基于 Jekyll 的个人博客。页面结构、导航、首页文章列表、标签归档都会由 Jekyll 根据 Markdown 自动生成。

## 写文章

以后新增博客文章，请放到 `_posts` 目录，文件名使用：

```text
YYYY-MM-DD-title.md
```

例如：

```text
_posts/2026-01-22-fear-and-dreams.md
```

每篇文章开头需要 front matter：

```yaml
---
layout: post
title: "文章标题"
subtitle: "一句简短说明"
date: 2026-01-22 21:20:31 +0800
author: 韩冰洁
tags:
  - 生活
  - 梦想
---
```

正文直接写 Markdown。文章会自动出现在首页和 `Tags` 页面。

## 重要文件

- `_config.yml`: 站点配置、导航、头像、分页。
- `_layouts/`: Jekyll 页面模板。
- `_includes/`: head、导航、页脚。
- `_posts/`: Markdown 博客文章。
- `css/ice-blog.css`: 蓝色渐变主题样式。
- `img/1.jpg`: 首页头像。
- `img/2.png`: 浏览器标签图标和站点品牌图标。

## 本地预览

```powershell
bundle install
bundle exec jekyll serve
```

然后访问：

```text
http://127.0.0.1:4000/
```

不要直接双击 `index.html`，因为它是 Jekyll 模板源文件，需要先构建。