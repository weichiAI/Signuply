# h5-app

基于 **Hono + Vite + React** 的移动端 H5 全栈模板。默认只保留最小可运行入口和一个可替换的后端 API 示例，生成项目后从空首页开始实现真实内容。

## 技术栈

- 前端：React 19、React Router、Tailwind CSS v4、shadcn/ui、React Query、Framer Motion
- 后端：Hono（Node runtime）
- 契约校验：Zod（`shared/contracts/routes.ts`，兼容 `shared/routes.ts` re-export）

## 默认 UI 基建

该模板默认只保留移动端 H5 高频场景真正需要的最小 UI 基建，不提供 shadcn/ui “全家桶”。

默认预装并建议优先复用的组件：

- `button`
- `badge`
- `card`
- `input`
- `textarea`
- `label`
- `form`
- `toast` / `toaster`
- `alert`
- `alert-dialog`
- `drawer`

默认策略：

- 需要移动端底部弹出层时，优先 `drawer`
- 需要轻反馈时，优先 `toast`
- 需要页内提示时，优先 `alert`
- 需要危险确认时，优先 `alert-dialog`
- 需要选择器时，优先原生 `select` 或移动端友好的原生封装，而不是默认引入自定义 `select`

不默认预装的组件，按需补装即可；尤其不要先把桌面倾向更强的 menu、command、sidebar、chart、carousel 组件整批带进模板。

## 目录结构

```text
.
├── .imagicma/
│   ├── AGENTS.md                 # 运行/修改约束补充说明
│   └── runtime.env               # 项目运行端口契约，仅使用大写 PORT
├── client/
│   ├── index.html                # Vite 前端入口 HTML
│   ├── public/                   # 前端静态资源
│   └── src/
│       ├── App.tsx               # 前端应用根组件
│       ├── main.tsx              # 前端挂载入口
│       ├── globals.css           # 全局样式与设计 token
│       ├── components/           # 基础组件
│       │   └── ui/               # shadcn/ui 组件
│       ├── hooks/                # 客户端 hooks
│       ├── lib/                  # 前端通用工具与预览桥接逻辑
│       └── pages/                # 路由页面，默认仅首页与 404
├── server/
│   ├── app.ts                    # Hono 装配入口，仅注册 middleware、routes 与静态资源
│   ├── dev-app.ts                # 开发态 server 入口
│   ├── index.ts                  # 生产态 server 入口
│   ├── controllers/             # HTTP 适配层，解析请求并返回响应
│   ├── middlewares/             # 日志、异常等横切能力
│   ├── models/
│   │   └── services/            # 默认轻量业务编排，可替换成真实服务
│   └── routes/                  # 路由绑定层，只做 URL 到 controller 的映射
├── shared/
│   ├── constants/               # 前后端共享纯常量
│   ├── contracts/               # 前后端共享 API path 与 Zod 契约
│   ├── routes.ts                # contracts 的兼容 re-export
│   ├── schema.ts                # 共享 schema 聚合导出
│   └── types/                   # 前后端共享纯 TypeScript 类型
├── scripts/                     # 受保护的启动/守卫脚本
├── .env.example                 # 环境变量示例
├── package.json
├── tsconfig.json
├── tsconfig.server.json
└── vite.config.ts
```

## 分层约束

- 默认提供 `GET /api/greeting` 作为最小后端示例；真实业务接入时可按同样分层替换或扩展。
- `server/routes` 只能依赖 `controllers`。
- `server/controllers` 只负责 HTTP 适配，依赖 `models` 与 `shared`。
- `server/models/services` 负责轻量业务编排，不接触 Hono `Context`。
- `shared/` 只能放前后端都能安全复用的契约、常量和纯类型，禁止放 TypeORM entity、Node API、Hono 运行时代码。

## 常用命令

```bash
pnpm install
pnpm dev
pnpm build
pnpm start
pnpm check
pnpm lint
```

- `pnpm dev`：本地开发，使用受保护脚本拉起 Vite + Hono
- `pnpm build`：构建前端并编译服务端
- `pnpm start`：以生产模式启动构建产物
- `pnpm check`：执行前后端 TypeScript 类型检查
- `pnpm lint`：执行 ESLint

如果你是在 imagicma 的 agent/workflow 环境中维护该模板，请继续遵循 [`AGENTS.md`](/Users/alexliu/Project/imagicma-all/imagicma-template/h5-app/AGENTS.md) 的约束，通过工作流提供的启动入口执行，不要绕过 `scripts/` 里的受保护脚本。

## 端口与运行时文件

启动时按以下顺序解析端口：

1. 显式环境变量 `PORT`
2. 项目内 `.imagicma/runtime.env`

如果两者都不存在，启动会直接失败。`.imagicma/runtime.env` 示例：

```bash
PORT=6424
```

## 构建产物

- 前端产物：`dist/client`
- 后端产物：`dist/server`
- 发布产物：`artifacts/release`

生产启动时由 Hono 同时承载 API、静态资源与 SPA fallback。

## 发布目录

执行 `pnpm build` 后，除了常规 `dist/` 编译产物，还会生成可分发目录 `artifacts/release`。

该目录包含：

- `dist/client`、`dist/server`、`dist/shared`
- `.data/app.db`
- 所有 `.env*` 文件
- 初始化脚本：`init.sh`
- 启动脚本：`start.sh`

建议的发布用法：

```bash
cd artifacts/release
./init.sh 5011
npm start
```

## 验证路径

- `GET /api/greeting`
- `/`
- 任意未定义路径应进入 404
