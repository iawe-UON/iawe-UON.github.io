---
title: python爬虫基础
date: 2026-03-18 15:28:25
tags: 基操备忘录
---

*爬虫作为一门互联网古老技艺,人人都有必要掌握*

<!--more-->

python由于提供了非常多的第三方库，所以在网页爬取等操作的实现会比JAVA和C++简单，这里简单记录一下一些常见网页爬取操作。

先将示例放在最前面

**爬虫样例**
```python
# -*- coding: utf-8 -*-
from bs4 import BeautifulSoup # 网页解析，获取数据
import re #正则表达式，执行文字匹配
import urllib.request, urllib.error
# import xlwt

baseurl = ""
root_url = ""

def main():
    baseurl = "https://ww2.mathworks.cn/help/releases/R2024a/sps/get-started-with-sps.html"
    # 1.爬取网页,获得子链接列表
    sub_url_list = get_sub_url(baseurl)
    for sub_url in sub_url_list:
        # 2.爬取网页,获得数据
        getData(root_url + sub_url['href'],sub_url['text'])

def getData(baseurl,text):
    """
    获得参数以及默认值
    """
    html =  askUrl(baseurl)
    soup = BeautifulSoup(html, "html.parser")
    if text == "AC Current Source":
        """拿到参数正文"""
        main_text = []
        links_with_blocks = soup.find_all("dd")
        for link in links_with_blocks:
            main_text.append(link.get_text(strip=True))
        """拿到参数名称"""
        main_name = []
        links_with_blocks = soup.find_all('dt')
        for link in links_with_blocks:
            span_block = link.find('strong', class_='guilabel')
            if span_block:
                main_name.append(span_block.get_text(strip=True))

        for i in range(len(main_name)):
            print(main_name[i] + ": " + main_text[i])
    # TODO: else 条件判断待完善
    # else:


def get_sub_url(baseurl):
    sub_url_list = []
    html = askUrl(baseurl)
    soup = BeautifulSoup(html, "html.parser")
    links_with_blocks = soup.find_all('a')
    for link in links_with_blocks:
        span_block = link.find('span', class_='block')
        if span_block:
            # 获得子链接
            href = link.get('href')
            text = span_block.get_text(strip=True)
            print(f"链接: {href}, 文本: {text}")
            sub_url_list.append({"text":text, "href":href})
    return sub_url_list

def askUrl(url):
    head = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36"
    }
    request = urllib.request.Request(url, headers=head)
    html = ""
    try:
        response = urllib.request.urlopen(request)
        html = response.read().decode("utf-8")
    except urllib.error.URLError as e:
        if hasattr(e, "code"):
            print(e.code)
        if hasattr(e, "reason"):
            print(e.reason)
    return html

if __name__ == "__main__":
    main()
```

## 1.请求网页并解析html

在做内容提取之前，首先应该要做的就是通过requests请求到前端界面，并且获得html代码，才能从代码进行内容定位和内容获取

先看一下这部分是如何实现的，实现在askUrl函数中:
```python
def askUrl(url):
	#定义head，模拟浏览器头部信息，防止被服务端判断为机器人或者被反爬虫机制制裁
    head = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36"
    }
	# User-Agent用户代理，表示告诉豆瓣服务器，我们是什么类型的机器、浏览器（本质上是告诉浏览器，我们可以接收什么水平的文件内容）
	#通过urllib来构建requests请求
    request = urllib.request.Request(url, headers=head)
    html = ""
    try:
        response = urllib.request.urlopen(request)
		#服务端返回的response已经拿到了前端展示，通过调用read方法获得html内容，同时为了防止编码混乱，需要显式指定decode为utf-8编码
        html = response.read().decode("utf-8")
    except urllib.error.URLError as e:
	# 异常处理
        if hasattr(e, "code"):
            print(e.code)
        if hasattr(e, "reason"):
            print(e.reason)
    return html
```

## 2.在获得html之后，使用BeautifulSoup库获取目标内容

BeautifulSoup是前端代码解析和爬虫中最为重要的一个库，可以通过指定头和class来获取内容;更进阶的话可以配合re库来进行正则表达式匹配，可以大大增加检索效率

```python
def get_sub_url(baseurl):
    sub_url_list = []
    html = askUrl(baseurl)
    soup = BeautifulSoup(html, "html.parser")
    links_with_blocks = soup.find_all('a')
    for link in links_with_blocks:
        span_block = link.find('span', class_='block')
        if span_block:
            # 获得子链接
            href = link.get('href')
            text = span_block.get_text(strip=True)
            print(f"链接: {href}, 文本: {text}")
            sub_url_list.append({"text":text, "href":href})
    return sub_url_list
```

这里先进行的是读取html代码，生成soup对象,之后可以直接对soup进行操作
```python
soup = BeautifulSoup(html, "html.parser")
```

调用find_all方法，确定筛选字段后可以直接筛选所有内容
```python
links_with_blocks = soup.find_all('a')
```
同样，对于筛选出来的对象，通过调用get方法可以拿到'<>'中的内容，调用get_text方法可以拿到主干中的文本内容。

基于上述，我们完成了请求-解析-定位-筛选全流程的爬虫基础操作的实现

