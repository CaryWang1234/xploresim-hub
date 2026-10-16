# XploreSim · 中心页

GitHub Pages 站点，绑定 `xploresim.salmoncat0304.xyz`。只有一页：两个赛季推演台的入口。

模拟器本体不在这里。它们是纯静态的 Qoder Sites 站点，本页只外链：

| 赛季 | 入口 |
| --- | --- |
| 2026 REBUILT | https://frc-rebuilt-tactics-0ssdesrlvzc.qoder.zone/ |
| 2025 REEFSCAPE | https://frc-reefscape-tactics-0ssdesrlvzc.qoder.zone/ |

## 文件

```
index.html   单文件页面：标题顶栏 + 两个横条入口，背景是纯 CSS 动画，零 JS、零外部字体、零构建
CNAME        xploresim.salmoncat0304.xyz，GitHub Pages 读它来绑定自定义域名
.nojekyll    跳过 Jekyll 处理
404.html     Pages 的 404 页，复用同一主题
scripts/     check.mjs（链接、结构、CNAME、可达性）与 check_style.mjs（样式表与类名互查）
```

```
npm run check    # 全部静态守卫 + 两个赛季站点的 200 检查
SKIP_NET=1 npm run check   # 只跑静态部分
```

## 域名

`salmoncat0304.xyz` 解析在阿里云云解析。绑定这条只需要一条记录，无需备案：

```
类型 CNAME  主机记录 xploresim  记录值 CaryWang1234.github.io
```

GitHub 看到 CNAME 文件后自动签发 HTTPS 证书。仓库设置里 Enforce HTTPS 需要手动勾上。

## 页面只放入口

中心页不抄任何测量数字：真实比分锚、镜像、AI 胜率这些一律留在两个源码仓库自己的 README 里（2026 是
`CaryWang1234/XploreSim_dev`，2025 是 dev 仓库内被 gitignore 掉的 `reefscape/` 同目录项目），本页只把人送到
两个赛季站点。`check.mjs` 里对应一条「页面保持指路牌」的守卫：出现 `<article>`／`<details>`／`<svg>`／
`class="card"`／`class="num"` 就报错，防止带数字的卡片被重新搬回首页。

页面正文只写英文，`npm run check` 里有一条 CJK 守卫盯这件事。背景全部用 CSS 画：底部的透视网格是赛场地毯，
左上与右上的两团辉光分别取两个赛季的颜色（2026 土黄 `#c9a45c`、2025 青 `#5ccfd0`），这两个是全页仅有的强调色，
`prefers-reduced-motion` 下所有动画一律关掉。
