# 活动报名邀请 H5 页面 — 技术设计文档

**日期**：2026-06-14  
**状态**：待审核

---

## 1. 概述

为「智界 · 2026 科技新品发布会」创建一个 375px 移动优先的活动报名邀请 H5 页面。全栈实现：前端 React 单页组件化，后端 Hono + TypeORM + SQLite，Zod 契约驱动。

---

## 2. 页面结构（7 区块滚动叙事）

| 序号 | 区块 | 内容 |
|------|------|------|
| 1 | Hero 首屏 | 深色科技渐变 + nebula 动效，主标题"智界 · 2026 科技新品发布会"，副标题"AI 定义下一个十年"，时间/地点 icon+文字，倒计时，CTA"立即报名"，动态报名人数角标 |
| 2 | 活动亮点 | 2×2 网格：新品首发 / 大咖对话 / 沉浸体验 / 限量伴手礼 |
| 3 | 嘉宾阵容 | 横向滑动卡片（snap-x），每人圆形头像 + 姓名 + 头衔 + 简介 |
| 4 | 详细议程 | 垂直时间轴（左侧竖线+圆点+右侧内容），6 个时间节点 |
| 5 | 适合人群 | 4 项 icon+标签+描述 |
| 6 | 场地信息 | 场地名称、地址、交通指引 |
| 7 | 合作伙伴 | Logo 网格（3 列灰度） |

**交互层**：
- **顶部吸附报名条**：滚动越过 Hero 后出现在顶部，点击打开报名 drawer
- **底部分享引导条**：固定在底部
- **页面内锚点导航**：Hero CTA 旁快速导航链接
- **报名 Drawer**：半屏弹层，表单（姓名/手机/公司/职位/人数/备注）→ 提交后切换成功态（电子票二维码+报名编号）

---

## 3. 视觉方案

- **主色**：深蓝黑 `#0B1121` → `#1E3A5F` 渐变（Hero、CTA）
- **强调色**：亮橙 `#F97316`（按钮、倒计时、时间轴激活点）
- **底色**：白 `#FFFFFF`（内容区）
- **辅色**：浅灰蓝 `#F1F5F9`（卡片底）
- **排版**：Poppins + 中文 fallback，Hero 标题 28px/700，正文 15px/400
- **动效**：nebula-orb 炫光、showcase-rise 淡入、倒计时计数、报名人数递增
- **主题**：默认 nomad 风格不做全局改动，事件页通过自定义 CSS 类定向覆盖

---

## 4. 数据流 & API 设计

### 4.1 请求链路

```
client hook ⇄ shared/contracts/routes.ts (Zod) ⇄ server/routes ⇄ controllers ⇄ services ⇄ repositories ⇄ entities
```

### 4.2 API 端点

| 端点 | 方法 | 请求体 | 响应 | 说明 |
|------|------|--------|------|------|
| `/api/registration` | POST | `name, phone, company, title, attendees, notes` | `{ id, ticketNo }` | 提交报名 |
| `/api/registration/count` | GET | - | `{ count: number }` | 查询总报名人数 |

### 4.3 数据模型

**Registration Entity**：
- `id` (int, PK, auto)
- `name` (string)
- `phone` (string)
- `company` (string)
- `title` (string)
- `attendees` (int)
- `notes` (string, nullable)
- `createdAt` (datetime, auto)

### 4.4 电子票二维码

前端用 `qrcode` 库根据 `ticketNo` 生成，不依赖后端生成图片。

---

## 5. 文件清单

### 前端

| 文件 | 职责 |
|------|------|
| `client/src/pages/home.tsx` | 页面组装：7 区块 + sticky bar + share bar + drawer 状态管理 + 锚点滚动 |
| `client/src/components/event/HeroSection.tsx` | 首屏：渐变背景、nebula 动效、标题、时间地点、倒计时、CTA、报名人数 |
| `client/src/components/event/HighlightsSection.tsx` | 亮点 2×2 卡片 grid |
| `client/src/components/event/GuestsSection.tsx` | 嘉宾横向 snap-scroll 卡片 |
| `client/src/components/event/TimelineSection.tsx` | 垂直时间轴 |
| `client/src/components/event/AudienceSection.tsx` | 适合人群列表 |
| `client/src/components/event/VenueSection.tsx` | 场地信息卡片 |
| `client/src/components/event/PartnersSection.tsx` | 合作伙伴 Logo 网格 |
| `client/src/components/event/RegistrationDrawer.tsx` | 报名 drawer：表单态 + 成功态（含二维码） |
| `client/src/components/event/Countdown.tsx` | 倒计时组件 |
| `client/src/components/event/StickyBar.tsx` | 顶部吸附报名条 |
| `client/src/components/event/ShareBar.tsx` | 底部分享引导条 |
| `client/src/hooks/use-registration.ts` | React Query hooks（submit + count） |

### 共享层

| 文件 | 职责 |
|------|------|
| `shared/contracts/routes.ts` | 追加 registration 路由定义 |
| `shared/schema.ts` | 追加 registration Zod schema |

### 服务端

| 文件 | 职责 |
|------|------|
| `server/routes/registration.ts` | 路由绑定 |
| `server/controllers/registration.ts` | Zod 校验 + 响应 |
| `server/models/services/registration.ts` | 业务逻辑 |
| `server/models/repositories/registration.ts` | 数据访问 |
| `server/models/entities/Registration.ts` | TypeORM entity |

### 依赖新增

- 前端：`qrcode`（电子票二维码生成）
- 后端：无额外依赖，复用已有 TypeORM + SQLite

---

## 6. 状态处理

| 状态 | 处理方式 |
|------|----------|
| 页面加载 | Hero 区即时渲染（纯静态），报名人数异步获取显示 |
| 报名提交中 | 按钮 disabled + loading 文案 |
| 报名成功 | drawer 内切换到成功态，显示电子票二维码 |
| 报名失败 | toast 提示错误信息 |
| 网络异常 | 报名人数降级显示占位符 |

---

## 7. 验收标准

1. `/` 可访问，首屏呈现实质性内容
2. 7 个区块完整可滚动
3. 倒计时实时更新
4. 嘉宾卡片可横向滑动
5. 报名 drawer 可打开，表单校验，提交成功后显示二维码
6. 顶部吸附条在滚动越过 Hero 后出现
7. 390×844 和 360×800 视口无溢出遮挡
8. `pnpm check` 通过
9. `pnpm build` 通过
