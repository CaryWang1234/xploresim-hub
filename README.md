# XploreSim · 中心页

GitHub Pages 站点，绑定 `xploresim.salmoncat0304.xyz`。只有一页：两个赛季推演台的入口。

模拟器本体不在这里。它们是纯静态的 Qoder Sites 站点，本页只外链：

| 赛季 | 入口 |
| --- | --- |
| 2026 REBUILT | https://frc-rebuilt-tactics-0ssdesrlvzc.qoder.zone/ |
| 2025 REEFSCAPE | https://frc-reefscape-tactics-0ssdesrlvzc.qoder.zone/ |

## 文件

```
index.html   单文件页面，内联 CSS 与 SVG，零 JS、零外部字体、零构建
CNAME        xploresim.salmoncat0304.xyz，GitHub Pages 读它来绑定自定义域名
.nojekyll    跳过 Jekyll 处理
404.html     Pages 的 404 页，复用同一主题
```

## 域名

`salmoncat0304.xyz` 解析在阿里云云解析。绑定这条只需要一条记录，无需备案：

```
类型 CNAME  主机记录 xploresim  记录值 CaryWang1234.github.io
```

GitHub 看到 CNAME 文件后自动签发 HTTPS 证书。仓库设置里 Enforce HTTPS 需要手动勾上。

## 内容的事实来源

页面上的每个数字都来自源码仓库，改动时要一起核对：

- 2026：`CaryWang1234/XploreSim_dev` 的 `README.md`（校准锚 `2026cmptx`、镜像 615.7、AI 79.7% n=96）
- 2025：XploreSim_dev 仓库内 gitignore 掉的 `reefscape/` 同目录项目，其 `README.md` 与 `web/index.html` 的 Stage 1 说明
