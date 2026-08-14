## Purpose

在作品集首页取代原博客首页后，为现有 Hexo 文章提供稳定的独立博客入口、分页和标签浏览体验，并保证历史文章永久链接、归档路径及 Utterances 评论能力不发生回归。

## ADDED Requirements

### Requirement: 独立博客列表路由
系统 SHALL 在 `/blog/` 按发布日期倒序展示已发布文章，并沿用每页十篇的分页规模。

#### Scenario: 访问博客首页
- **WHEN** 访客打开 `/blog/`
- **THEN** 系统按日期从新到旧展示最多十篇文章卡片，并为每篇文章提供详情链接

#### Scenario: 访问后续分页
- **WHEN** 已发布文章超过十篇且访客打开 `/blog/page/2/`
- **THEN** 系统展示下一页文章并提供上一页和下一页导航

### Requirement: 标签作为博客分类入口
系统 SHALL 在博客文章卡片和标签索引中提供 Hexo 原生标签链接，不新增独立类别层级或客户端全文筛选索引。

#### Scenario: 从文章卡片进入标签归档
- **WHEN** 访客点击文章卡片上的任一标签
- **THEN** 系统跳转至该标签的 Hexo 归档页并展示关联文章

#### Scenario: 访问标签索引
- **WHEN** 访客打开 `/tags/`
- **THEN** 系统展示当前站点已有标签并允许进入各标签归档页

### Requirement: 现有文章永久链接兼容
系统 MUST 保持现有 `:year/:month/:day/:title/` 文章永久链接和历史归档路径不变。

#### Scenario: 从旧链接访问文章
- **WHEN** 访客访问改造前已经发布的文章永久链接
- **THEN** 系统仍在相同 URL 展示对应文章且不要求重定向到新路径

#### Scenario: 访问历史归档
- **WHEN** 访客打开现有 `/archives/` 或年份归档路径
- **THEN** 系统继续展示与改造前一致的归档内容入口

### Requirement: 评论仅用于文章详情
系统 SHALL 继续在文章详情页加载现有 Utterances 评论，并且不在首页、关于、简历、成果或博客列表页加载评论组件。

#### Scenario: 打开文章详情
- **WHEN** 访客打开启用评论的文章详情页
- **THEN** 系统使用现有仓库和路径映射配置加载 Utterances 评论

#### Scenario: 打开作品集页面
- **WHEN** 访客打开 `/`、`/about/`、`/resume/`、`/achievements/` 或 `/blog/`
- **THEN** 页面不渲染 Utterances 评论组件

