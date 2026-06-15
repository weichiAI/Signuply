# h5-app Agent 指南

默认使用中文沟通与输出。主要面向非专业程序员/业务人员的移动端 H5 开发 Agent。你的核心目标是：将用户的业务话术转化为高质量、生产级别的移动端应用。你必须在后台默默闭环所有技术细节，严禁向业务用户暴露技术黑话，确保交付一个直观、美观、高可靠的移动端业务系统。

## 项目记忆

文件：`.imagicma/memory/memory.md`。记录用户确立的原则与约定（命名规范、设计偏好、架构决策、接口约束、禁止事项等），后续会话必须遵循。

**何时读：** 开始工作前、改动可能触及已有约定时、用户提到「之前说过」「按记忆来」时。

**如何用：** 记忆中的约定优先于自行推断；与当前需求冲突时先向用户确认是否废弃。

**何时写：** 用户明确要求记住某项原则或约定时，确认后写入。不写任务进度、密钥、可从代码直接读出的内容。

## 业务定位与红线

移动端业务 H5，移动优先、桌面端可预览即可。Hono + TypeORM，契约驱动。

**首页 = 验收入口：** `/` 落到 `home.tsx`，首屏须有真实业务语义与可交互入口。新功能先接入首页核心流程，再补二级页。

禁止：空/null 组件、纯 loading 占位、技术说明页、桌面缩放式布局（固定手机卡片、双栏、表格主视图）。

## 目录

| 路径 | 职责 |
|---|---|
| `client/src/pages/home.tsx` | `/` 首页入口 |
| `client/src/App.tsx` | 路由声明 |
| `client/src/theme.css` + `globals.css` | 主题变量与全局样式 |
| `client/src/lib/theme/default-theme.ts` | Design System token（颜色、圆角、阴影等基本规范） |
| `client/src/components/ui/` | ui 组件库，优先复用，避免重复造轮子 |
| `client/src/hooks/` | 客户端 hooks（基于 React Query + fetch 封装的 API 查询） |
| `client/src/lib/app-metadata.ts` | 应用名称与 Title，项目生成后优先修改此文件 |
| `shared/contracts/` | 前后端共享 API 契约（`routes.ts`，兼容 `shared/routes.ts` re-export） |
| `shared/types/` 、 `shared/constants/` | 前后端共享的纯 TypeScript 类型与常量 |
| `server/app.ts` | Hono 装配入口，仅负责注册 middleware、routes 与静态资源 |
| `server/routes/` | 路由绑定层，只做 URL 到 controller 的映射 |
| `server/controllers/` | HTTP 适配层，解析请求、Zod 校验并返回结构稳定的响应 |
| `server/middlewares/` | 日志、异常捕获等横切能力（由 `app.ts` 注册） |
| `server/models/services/` | 业务规则与编排中心。回答“为什么这么查、如何处理结果”，核心业务在此闭环 |
| `server/models/repositories/` | 数据访问实现，只回答“怎么查、怎么存”，不含业务逻辑 |
| `server/models/entities/` | TypeORM entity 持久化模型 |
| `server/db/` | DataSource 与数据库连接配置 |

## 技术栈

- **服务端：** Hono（Node）、TypeORM、默认 sqlite（`.data/app.db`）可选 postgres（`DATABASE_URL`）
- **客户端：** React 19、React Router、Tailwind v4、shadcn/ui、React Query + fetch
- **共享：** Zod 契约（`shared/contracts/routes.ts`）
- **图标/动效：** lucide-react、framer-motion
- **开发：** Vite 单进程 dev

## 请求链路与安全底线

```
client hook ⇄ shared/contracts (Zod契约) ⇄ server/routes ⇄ controllers ⇄ services ⇄ repositories ⇄ entities
```

> ⚠️ **数据安全红线**：TypeORM entity、Hono Context、DB 连接、密钥等敏感内容**绝对禁止**进入 `shared/` 和 `client/` 目录。`shared/` 仅存放浏览器与 Node 均安全的纯净内容。

## 移动端规则

**必须：** 全宽流式布局；底部区处理 `safe-area-inset-bottom`；点击区 ≥ 44px、主 CTA ≥ 48px；固定底栏时正文预留 `padding-bottom`；首屏单一主目标；自测 `390×844` 与 `360×800`。

**推荐：** 高频操作靠下；单列流；标题 1–2 行、说明 2–3 行、按钮 4–6 字；单核心操作用粘底 CTA，多入口再考虑底 Tab。

**组件选择：** 底部弹出用 `drawer`（不用 `dialog`/`sheet`）；选择器用原生 `select`；临时反馈 `toast`，页内 `alert`，危险确认 `alert-dialog`。

## 工作路线

**页面：** 读 Design System → 改 `home.tsx` / `App.tsx` / 组件 → 验首屏与主操作 → 覆盖 loading / error / empty 状态。

**API：** 默认静态 mock；需真实接口时先写 `shared/contracts/routes.ts`（Zod schema）→ 实现 server 各层 → 客户端通过 hooks 调用。所有 path 经契约引用，不硬编码。持久化/数据库仅当用户明确要求。

**数据库：** 新增 entity 同步创建 repository 和 service；选型、连接与 SQL 约束见「执行硬规则」。

## 执行硬规则

- 数据库 entity 与运行时连接配置必须保持一致，禁止手写临时 SQL 与 ORM entity 并行漂移。
- 当任务涉及数据库选型且用户未明确指定时，必须优先使用 `question` tool 询问使用什么数据库；仅在无法询问或未获得明确答复时，才按默认 `sqlite`（`DB_TYPE=sqlite` + `./.data/app.db`）处理。
- 禁止修改 `scripts/` 下的受保护启动文件：`imagicma-common.mjs`、`imagicma-guard.mjs`、`imagicma-dev.mjs`、`imagicma-start.mjs`、`imagicma-runtime-logs.mjs`。
- 禁止修改 `package.json` 中 `scripts.dev` 与 `scripts.start`（以及对应 `predev`、`prestart`）命令。
- 禁止直接执行 `vite` 或 `node dist/server/index.js` 或 `pnpm dev` 或 `pnpm start` 启动项目；只能通过 `restart_workflow` 启动。
- 禁止主动注入环境变量到 `process.env`。

## Design System

开发 UI 前必读并落实 `docs/designer/style_guide/DESIGN.md`（如存在）和 `docs/designer/style_guide/theme.json`（如存在）。

若 `theme.json` 包含 `designTokens` 或 `tokensCss`，必须先把 token 映射到项目主题层，再写业务页面：
- 在 `client/src/globals.css` 或 `client/src/theme.css` 中设置 `--theme-color-*`、`--background`、`--foreground`、`--primary`、`--font-*`、`--radius` 等全局变量，必要时从 `tokensCss` 中的 `--od-*` 转换。
- 在 `tailwind.config.mjs` 中复用现有语义 token，不新建第二套命名体系；缺少的语义 token 只做最小扩展。
- 业务组件优先使用语义类（`bg-primary`、`text-on-background`、`font-headline`、`rounded-xl`、`shadow-theme-raised` 等），避免直接散落品牌 hex、随意字体和默认 shadcn 黑白风。
- 首页首屏、主 CTA、表单/卡片、底部操作、toast/drawer/弹层状态都要体现选中的 Design System。

新页面至少在色彩、字体、圆角/间距/阴影三方面受 Design System 约束；如果实现结果看起来像未选择设计体系，必须先回到主题变量层修正，而不是只在单个组件上补颜色。

## 数据安全

参数与响应均用 Zod 校验。错误响应结构稳定，不暴露堆栈与密钥。

## 运维约束

| 命令 | 用途 |
|---|---|
| `pnpm build` | 构建 + release |
| `pnpm check` | 类型检查 |
| `pnpm lint` | ESLint |

开发与生产进程的启动方式见「执行硬规则」（`restart_workflow`）；勿用 `pnpm dev` / `pnpm start` 自行拉起服务。

端口只用 `PORT`（`PORT` → `.imagicma/runtime.env`），预览地址: `https://{PORT}.preview.imagicma.cn`。向用户展示结果时输出此格式，**禁用** `http://127.0.0.1` 或 `http://localhost`。

**勿改：** 单个项目内不要新增 `preview-runtime/` 副本；预览通信与反馈 runtime 的唯一源头在 `imagicma-template/preview-runtime/`，项目默认使用 CDN runtime。启动脚本与 `package.json` 的 `dev`/`start`/`predev`/`prestart` 见「执行硬规则」。

**`docs/project_state.json`：** 写入前先读；`quality_gates.typecheck` 仅 `pnpm check` 通过后设 true；`quality_gates.build` 仅 `pnpm build` 通过后设 true。

## 验收

`/` 可访问可交互；核心流程从首页可完成（允许 mock 闭环）；`pnpm run check:delivery` 通过；关键移动视口无溢出与遮挡；按钮/表单/弹层有点击反馈。

按改动范围追加：TS 改动 → `pnpm check`；UI → 本地 `/` + 移动端视口验证；API → 契约 + 校验 + 客户端调用；数据库 → entity/repository/service 与 sqlite 可跑；发布 → `pnpm build`。
