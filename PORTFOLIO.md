# 作品集内容与部署

首版内容集中在 `source/_data/portfolio.yml`。正式发布前，请替换其中明确标注的示例姓名、联系方式、经历、项目与成果；未配置头像、简历 PDF 或成果外链时，对应入口会自动隐藏。

本地验证与生成仍使用原有 Hexo 流程：

```powershell
npm run test:portfolio
npm run build
```

生成结果位于 `public/`，部署命令和现有 GitHub Pages 配置无需调整。根路径为作品集首页，博客列表位于 `/blog/`，既有文章永久链接保持不变。
