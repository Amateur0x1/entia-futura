# ENTIA FUTURA INSTITUT — 未来人研究所

## 项目概述

未来人研究所（Entia Futura Institut）官方网站。一个围绕"未来我们将如何存在？"这一核心问题展开工作的独立研究机构。网站以沉浸式全屏滚动体验为核心，融合 3D 视觉效果、GSAP 动画编排和深色科幻美学。

## 技术栈

- **框架**: Astro 6 (SSR mode, `output: 'server'`)
- **部署**: Cloudflare Workers (`@astrojs/cloudflare` adapter)
- **动画**: GSAP 3.15 (ScrollTrigger, ScrambleTextPlugin, SplitText)
- **3D**: Three.js (粒子星云背景), 纯 CSS 3D transforms (花朵装置)
- **平滑滚动**: Lenis
- **字体**: POIRETONE-REGULAR (品牌字体)
- **国际化**: 自定义 i18n 方案 (`src/i18n/`), 支持 `zh` / `en`
- **Node**: >=22.12.0

## 设计语言

- **配色**: 深色背景 `--color-background`, 青色主色 `--color-primary` (#00e5ff, hue 189), 紫色辅助 `--color-secondary` (#7b5cff, hue 252)
- **字体层级**: POIRETONE 用于标题/标签, Hiragino Sans GB / Noto Sans SC 用于中文正文
- **动效哲学**: scrub 驱动的面板推入转场 + 时间线驱动的元素显现, 强调仪式感和节奏感

## 项目结构

```
src/
├── components/home/          # 首页各面板组件
│   ├── HomeHeroScreen.astro  # 首屏 (视频 + 黑石碑 + slogan 揭秘)
│   ├── HomeOverviewPanel.astro # 概览面板
│   ├── HomeSecondPanel.astro  # 第二面板 (使命愿景价值观)
│   ├── HomeThirdPanel.astro   # 第三面板 (机构概览)
│   ├── HomeFourthPanel.astro  # 第四面板/最后一屏 (合作+加入+3D花朵)
│   ├── effects/               # 所有 JS 动画逻辑
│   │   ├── initAllPanelTransitions.ts  # 核心: 面板间 scrub 转场
│   │   ├── initHomeEffects.ts          # 入口: 初始化所有效果
│   │   └── ...
│   └── landing-hero/          # Hero 区域样式和交互
├── i18n/                      # 国际化配置
├── layouts/                   # 布局
└── pages/                     # 路由 ([locale]/index.astro)

public/
├── fonts/                     # 字体文件
├── videos/                    # 循环视频素材
└── brand/                     # Logo 等品牌资源

skills/
└── gsap-skills/               # GSAP 动画参考知识库
    └── skills/                # 各插件的详细使用说明
        ├── gsap-core/
        ├── gsap-scrolltrigger/
        ├── gsap-plugins/
        ├── gsap-timeline/
        └── ...
```

## 关键架构模式

### Astro 组件中的动画

- **scoped CSS 陷阱**: Astro `<style>` 中的选择器会被加上 `data-astro-cid-xxxx` 属性。通过 `document.createElement` 动态创建的元素不会获得该属性，因此必须使用 `:global()` 包裹动态元素的样式。
- **脚本执行**: `<script>` 标签中的代码在客户端执行，可以操作 DOM。GSAP 通过 ES module import 引入（非全局变量）。

### 面板转场系统

所有面板通过 `position: fixed; inset: 0` 叠放，由 GSAP ScrollTrigger scrub 驱动推入/推出。每个面板初始 `opacity: 0; yPercent: 100`，通过滚动逐步显现。转场逻辑集中在 `initAllPanelTransitions.ts`。

### 面板间滚动触发

页面通过不可见的 scroll-spacer `<div>` 提供滚动距离。面板本身固定定位不参与文档流。

## Skills 引用

- **GSAP 动画**: 参考 `skills/gsap-skills/skills/` 目录下的各 SKILL.md
  - 核心 API → `gsap-core/SKILL.md`
  - ScrollTrigger → `gsap-scrolltrigger/SKILL.md`
  - 插件 (ScrambleText, SplitText, DrawSVG, MorphSVG 等) → `gsap-plugins/SKILL.md`
  - Timeline 编排 → `gsap-timeline/SKILL.md`
  - 性能优化 → `gsap-performance/SKILL.md`
  - 工具函数 → `gsap-utils/SKILL.md`

## 常用命令

```bash
npm run dev          # 本地开发 (默认 :4321)
npm run build        # 构建
npm run cf:dev       # Cloudflare 本地模拟
npm run cf:deploy    # 部署到 Cloudflare
```

## 注意事项

- 所有动画效果尊重 `prefers-reduced-motion` 媒体查询
- 中文版路由 `/zh`, 英文版 `/en`, 根路径 `/` 重定向
- 3D CSS 花朵不使用 `perspective` 属性（纯正交 3D），添加 perspective 会破坏效果
- GSAP 在此项目中不是全局变量，通过 ES module 导入使用
