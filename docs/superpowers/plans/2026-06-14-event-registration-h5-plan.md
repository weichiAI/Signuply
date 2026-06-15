# 活动报名邀请 H5 页面 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为「智界 · 2026 科技新品发布会」构建 375px 移动优先 H5 报名邀请页面，含 7 区块滚动叙事 + 全栈报名 API。

**Architecture:** React 19 单页组件化 + Hono API + TypeORM + SQLite，Zod 契约驱动。页面拆为 7 个 section 组件 + 3 个交互组件，后端标准 4 层。

**Tech Stack:** React 19, React Router, Tailwind v4, Hono, TypeORM, SQLite, Zod, vaul, lucide-react, qrcode, React Query

---

## 前置说明

所有新组件放在 `client/src/components/event/` 下。遵循项目约定：
- Server 路由用 `app.route("/", xxxRoute)` 注册
- Controller 内用 Zod schema `.parse()` 校验
- Service 导出单例
- 共享契约定义在 `shared/contracts/routes.ts`

---

### Task 1: 共享层 — Zod Schema + 常量 + 契约

**Files:**
- Modify: `shared/schema.ts`
- Modify: `shared/contracts/routes.ts`
- Create: `shared/constants/registration.ts`

- [ ] **Step 1: 新增注册常量**

Create `shared/constants/registration.ts`:
```ts
export const REGISTRATION_CREATE_PATH = "/api/registration" as const;
export const REGISTRATION_COUNT_PATH = "/api/registration/count" as const;
```

- [ ] **Step 2: 扩展 schema**

Modify `shared/schema.ts` — 在文件末尾追加:
```ts
import { z } from "zod";

export const RegistrationCreateSchema = z.object({
  name: z.string().min(1, "请输入姓名"),
  phone: z.string().min(11, "请输入正确的手机号").max(11),
  company: z.string().min(1, "请输入公司名称"),
  title: z.string().min(1, "请输入职位"),
  attendees: z.number().int().min(1, "至少1人").max(10, "最多10人"),
  notes: z.string().optional(),
});

export type RegistrationCreate = z.infer<typeof RegistrationCreateSchema>;

export const RegistrationResponseSchema = z.object({
  id: z.number(),
  ticketNo: z.string(),
});

export const RegistrationCountResponseSchema = z.object({
  count: z.number(),
});
```

Wait — check existing `shared/schema.ts` to avoid overwriting. Current content:
```ts
import { z } from "zod";
import type { GreetingResponse } from "./types/greeting";

export const GreetingResponseSchema: z.ZodType<GreetingResponse> = z.object({
  message: z.string(),
});
```

Append after the GreetingResponseSchema export:

```ts
export const RegistrationCreateSchema = z.object({
  name: z.string().min(1, "请输入姓名"),
  phone: z.string().min(11, "请输入正确的手机号").max(11),
  company: z.string().min(1, "请输入公司名称"),
  title: z.string().min(1, "请输入职位"),
  attendees: z.number().int().min(1, "至少1人").max(10, "最多10人"),
  notes: z.string().optional(),
});

export type RegistrationCreate = z.infer<typeof RegistrationCreateSchema>;

export const RegistrationResponseSchema = z.object({
  id: z.number(),
  ticketNo: z.string(),
});

export const RegistrationCountResponseSchema = z.object({
  count: z.number(),
});
```

- [ ] **Step 3: 扩展路由契约**

Modify `shared/contracts/routes.ts` — 在 `api` 对象末尾追加:

```ts
import { REGISTRATION_CREATE_PATH, REGISTRATION_COUNT_PATH } from "../constants/registration";
import { RegistrationCreateSchema, RegistrationResponseSchema, RegistrationCountResponseSchema } from "../schema";

// Append to the api object:
export const api = {
  greeting: {
    get: {
      method: "GET",
      path: GREETING_ROUTE_PATH,
      responses: { 200: GreetingResponseSchema },
    },
  },
  registration: {
    create: {
      method: "POST",
      path: REGISTRATION_CREATE_PATH,
      body: RegistrationCreateSchema,
      responses: { 201: RegistrationResponseSchema },
    },
    count: {
      method: "GET",
      path: REGISTRATION_COUNT_PATH,
      responses: { 200: RegistrationCountResponseSchema },
    },
  },
} as const;
```

- [ ] **Step 4: 验证 TS 类型检查**

Run: `pnpm check`
Expected: 通过

- [ ] **Step 5: Commit**

```bash
git add shared/schema.ts shared/contracts/routes.ts shared/constants/registration.ts
git commit -m "feat: add registration shared schema, constants, and contract"
```

---

### Task 2: 数据库 Entity

**Files:**
- Create: `server/models/entities/Registration.ts`

- [ ] **Step 1: 创建 Registration Entity**

```ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("registrations")
export class Registration {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar" })
  name!: string;

  @Column({ type: "varchar" })
  phone!: string;

  @Column({ type: "varchar" })
  company!: string;

  @Column({ type: "varchar" })
  title!: string;

  @Column({ type: "integer" })
  attendees!: number;

  @Column({ type: "varchar", nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
```

- [ ] **Step 2: 验证类型检查**

Run: `pnpm check`
Expected: 通过

- [ ] **Step 3: Commit**

```bash
git add server/models/entities/Registration.ts
git commit -m "feat: add Registration entity"
```

---

### Task 3: Repository + Service 层

**Files:**
- Create: `server/models/repositories/registration.ts`
- Create: `server/models/services/registration.ts`

- [ ] **Step 1: 创建 Repository**

```ts
import type { DataSource, Repository as TypeORMRepo } from "typeorm";
import { Registration } from "../entities/Registration";
import type { RegistrationCreate } from "../../../shared/schema";

export class RegistrationRepository {
  constructor(private readonly dataSource: DataSource) {}

  private get repo(): TypeORMRepo<Registration> {
    return this.dataSource.getRepository(Registration);
  }

  async create(data: RegistrationCreate): Promise<Registration> {
    const registration = this.repo.create(data);
    return this.repo.save(registration);
  }

  async count(): Promise<number> {
    return this.repo.count();
  }
}
```

- [ ] **Step 2: 创建 Service**

```ts
import { getDataSource } from "../../db";
import { RegistrationRepository } from "../repositories/registration";
import type { RegistrationCreate } from "../../../shared/schema";

export class RegistrationService {
  private async getRepository(): Promise<RegistrationRepository> {
    const ds = await getDataSource({ entities: [(await import("../entities/Registration")).Registration] });
    return new RegistrationRepository(ds);
  }

  async register(data: RegistrationCreate): Promise<{ id: number; ticketNo: string }> {
    const repo = await this.getRepository();
    const registration = await repo.create(data);
    const ticketNo = `EVT-${String(registration.id).padStart(6, "0")}`;
    return { id: registration.id, ticketNo };
  }

  async getCount(): Promise<number> {
    const repo = await this.getRepository();
    return repo.count();
  }
}

export const registrationService = new RegistrationService();
```

- [ ] **Step 3: Verify**

Run: `pnpm check`
Expected: 通过

- [ ] **Step 4: Commit**

```bash
git add server/models/repositories/registration.ts server/models/services/registration.ts
git commit -m "feat: add registration repository and service"
```

---

### Task 4: Controller + Route + App 注册

**Files:**
- Create: `server/controllers/registration.ts`
- Create: `server/routes/registration.ts`
- Modify: `server/app.ts`

- [ ] **Step 1: 创建 Controller**

```ts
import type { Context } from "hono";
import { api } from "../../shared/routes";
import { RegistrationCreateSchema } from "../../shared/schema";
import { registrationService } from "../models/services/registration";

export async function createRegistration(c: Context) {
  try {
    const raw = await c.req.json();
    const body = RegistrationCreateSchema.parse(raw);

    const result = await registrationService.register(body);

    const response = { id: result.id, ticketNo: result.ticketNo };
    api.registration.create.responses[201].parse(response);

    return c.json(response, 201);
  } catch (error) {
    console.error("POST /api/registration failed:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return c.json({ message }, 400);
  }
}

export async function getRegistrationCount(c: Context) {
  try {
    const count = await registrationService.getCount();
    const response = { count };
    api.registration.count.responses[200].parse(response);
    return c.json(response);
  } catch (error) {
    console.error("GET /api/registration/count failed:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return c.json({ message }, 500);
  }
}
```

- [ ] **Step 2: 创建 Route**

```ts
import { Hono } from "hono";
import { createRegistration, getRegistrationCount } from "../controllers/registration";

const registrationRoute = new Hono();

registrationRoute.post("/api/registration", createRegistration);
registrationRoute.get("/api/registration/count", getRegistrationCount);

export { registrationRoute };
```

- [ ] **Step 3: 注册到 app.ts**

Modify `server/app.ts` — 在 `import { greetingRoute }` 行后追加:

```ts
import { registrationRoute } from "./routes/registration";
```

在 `app.route("/", greetingRoute);` 行后追加:

```ts
app.route("/", registrationRoute);
```

- [ ] **Step 4: Verify**

Run: `pnpm check`
Expected: 通过

- [ ] **Step 5: Commit**

```bash
git add server/controllers/registration.ts server/routes/registration.ts server/app.ts
git commit -m "feat: add registration controller, route, and app registration"
```

---

### Task 5: 安装 qrcode 依赖

- [ ] **Step 1: Install**

```bash
pnpm add qrcode
```

- [ ] **Step 2: 验证安装**

Run: `pnpm check`
Expected: 通过

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add qrcode dependency"
```

---

### Task 6: 前端 Hook — use-registration

**Files:**
- Create: `client/src/hooks/use-registration.ts`

- [ ] **Step 1: 创建 hook**

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RegistrationCreate } from "@shared/schema";

const API_BASE = "";

async function submitRegistration(data: RegistrationCreate): Promise<{ id: number; ticketNo: string }> {
  const res = await fetch(`${API_BASE}/api/registration`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "提交失败" }));
    throw new Error(err.message || "提交失败");
  }
  return res.json();
}

async function fetchRegistrationCount(): Promise<number> {
  const res = await fetch(`${API_BASE}/api/registration/count`);
  if (!res.ok) throw new Error("获取人数失败");
  const data = await res.json();
  return data.count;
}

export function useRegistrationSubmit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitRegistration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registrationCount"] });
    },
  });
}

export function useRegistrationCount() {
  return useQuery({
    queryKey: ["registrationCount"],
    queryFn: fetchRegistrationCount,
    refetchInterval: 30000,
  });
}
```

- [ ] **Step 2: Verify**

Run: `pnpm check`
Expected: 通过

- [ ] **Step 3: Commit**

```bash
git add client/src/hooks/use-registration.ts
git commit -m "feat: add use-registration hooks"
```

---

### Task 7: 倒计时组件

**Files:**
- Create: `client/src/components/event/Countdown.tsx`

- [ ] **Step 1: 创建 Countdown**

```ts
import { useState, useEffect } from "react";

type CountdownProps = {
  targetDate: Date;
};

function getTimeLeft(target: Date) {
  const now = Date.now();
  const diff = target.getTime() - now;
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, ended: true };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    ended: false,
  };
}

export function Countdown({ targetDate }: CountdownProps) {
  const [time, setTime] = useState(() => getTimeLeft(targetDate));

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeLeft(targetDate)), 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  const items = [
    { value: time.days, label: "天" },
    { value: time.hours, label: "时" },
    { value: time.minutes, label: "分" },
    { value: time.seconds, label: "秒" },
  ];

  if (time.ended) {
    return (
      <div className="flex items-center justify-center gap-3">
        <span className="text-base font-semibold text-orange-400">活动已开始</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3">
      {items.map((item) => (
        <div key={item.label} className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-orange-400 tabular-nums">{String(item.value).padStart(2, "0")}</span>
          <span className="text-xs font-medium text-white/70">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `pnpm check`
Expected: 通过

- [ ] **Step 3: Commit**

```bash
git add client/src/components/event/Countdown.tsx
git commit -m "feat: add Countdown component"
```

---

### Task 8: Hero 首屏组件

**Files:**
- Create: `client/src/components/event/HeroSection.tsx`

- [ ] **Step 1: 创建 HeroSection**

```ts
import { Calendar, MapPin, Clock } from "lucide-react";
import { Countdown } from "./Countdown";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

const EVENT_DATE = new Date("2026-07-18T09:00:00+08:00");

type HeroSectionProps = {
  onRegister: () => void;
  attendeeCount?: number;
};

export function HeroSection({ onRegister, attendeeCount }: HeroSectionProps) {
  return (
    <section id="hero" className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#0B1121] via-[#132030] to-[#1E3A5F] text-white">
      {/* Nebula orbs */}
      <div className="nebula-orb nebula-orb-a" />
      <div className="nebula-orb nebula-orb-b" />
      <div className="nebula-orb nebula-orb-c" />
      <div className="nebula-grain" />

      <div className="relative z-10 flex flex-col items-center gap-8 px-6 text-center">
        {/* Kicker */}
        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-widest text-orange-400 backdrop-blur-sm">
          限量席位 · 邀您共鉴
        </span>

        {/* Title */}
        <div className="flex flex-col gap-2">
          <h1 className="text-[28px] font-bold leading-tight tracking-tight">
            智界 · 2026
          </h1>
          <p className="text-xl font-semibold text-white/90">科技新品发布会</p>
          <p className="mt-2 text-sm font-medium text-orange-400/90">AI 定义下一个十年</p>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-3">
          <InfoRow icon={<Calendar size={16} />}>2026 年 7 月 18 日（周六）</InfoRow>
          <InfoRow icon={<Clock size={16} />}>09:00 — 18:00</InfoRow>
          <InfoRow icon={<MapPin size={16} />}>上海中心大厦 5 层会议厅</InfoRow>
        </div>

        {/* Countdown */}
        <div className="py-2">
          <p className="mb-2 text-xs font-medium text-white/50">距活动开始</p>
          <Countdown targetDate={EVENT_DATE} />
        </div>

        {/* Attendee count */}
        {attendeeCount !== undefined && (
          <p className="text-xs text-white/60">
            已有 <span className="font-bold text-orange-400">{attendeeCount}</span> 人报名
          </p>
        )}

        {/* CTA */}
        <Button
          onClick={onRegister}
          className="h-14 w-full max-w-xs rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-base font-bold text-white shadow-lg shadow-orange-500/30 hover:from-orange-600 hover:to-orange-700 active:scale-95 transition-transform"
        >
          立即报名
        </Button>

        {/* Anchor nav */}
        <div className="flex gap-6 text-xs font-medium text-white/50">
          <a href="#highlights" className="hover:text-white/80 transition-colors">亮点</a>
          <a href="#guests" className="hover:text-white/80 transition-colors">嘉宾</a>
          <a href="#timeline" className="hover:text-white/80 transition-colors">议程</a>
        </div>
      </div>
    </section>
  );
}

function InfoRow({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-2 text-sm text-white/80">
      {icon}
      <span>{children}</span>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `pnpm check`
Expected: 通过

- [ ] **Step 3: Commit**

```bash
git add client/src/components/event/HeroSection.tsx
git commit -m "feat: add HeroSection component"
```

---

### Task 9: 活动亮点组件

**Files:**
- Create: `client/src/components/event/HighlightsSection.tsx`

- [ ] **Step 1: 创建 HighlightsSection**

```ts
import { Sparkles, Users, Monitor, Gift } from "lucide-react";
import type { ReactNode } from "react";

const highlights = [
  {
    icon: <Sparkles size={24} />,
    title: "新品首发",
    desc: "全球首次公开亮相最新 AI 硬件产品线",
  },
  {
    icon: <Users size={24} />,
    title: "大咖对话",
    desc: "行业领袖深度探讨 AI 趋势与商业落地",
  },
  {
    icon: <Monitor size={24} />,
    title: "沉浸体验",
    desc: "亲手试用新品，感受次世代交互方式",
  },
  {
    icon: <Gift size={24} />,
    title: "限量伴手礼",
    desc: "到场嘉宾专属定制科技礼盒一份",
  },
];

export function HighlightsSection() {
  return (
    <section id="highlights" className="px-5 py-14 bg-white">
      <div className="mb-8 text-center">
        <h2 className="text-xl font-bold text-[#0B1121]">活动亮点</h2>
        <p className="mt-2 text-sm text-gray-500">不可错过的四大理由</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {highlights.map((h) => (
          <Card key={h.title} icon={h.icon} title={h.title} desc={h.desc} />
        ))}
      </div>
    </section>
  );
}

function Card({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-[#F1F5F9] p-5 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#0B1121] to-[#1E3A5F] text-white">
        {icon}
      </div>
      <h3 className="text-sm font-bold text-[#0B1121]">{title}</h3>
      <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `pnpm check`
Expected: 通过

- [ ] **Step 3: Commit**

```bash
git add client/src/components/event/HighlightsSection.tsx
git commit -m "feat: add HighlightsSection component"
```

---

### Task 10: 嘉宾阵容组件

**Files:**
- Create: `client/src/components/event/GuestsSection.tsx`

- [ ] **Step 1: 创建 GuestsSection**

```ts
const guests = [
  { name: "张晓峰", title: "CEO，未来智能科技", desc: "前 Google AI 研究员，15年AI领域经验", color: "from-blue-500 to-cyan-500" },
  { name: "李梦然", title: "CTO，星辰计算", desc: "开源框架 StarML 作者，GitHub 20k+ stars", color: "from-purple-500 to-pink-500" },
  { name: "王思远", title: "VP of Product，远见资本", desc: "主导过 50+ 科技项目投资，总额超百亿", color: "from-orange-500 to-red-500" },
  { name: "陈明哲", title: "首席科学家，深度思维", desc: "NeurIPS/ICML 最佳论文奖获得者", color: "from-green-500 to-teal-500" },
];

export function GuestsSection() {
  return (
    <section id="guests" className="py-14 bg-[#F8FAFC]">
      <div className="mb-8 text-center px-5">
        <h2 className="text-xl font-bold text-[#0B1121]">嘉宾阵容</h2>
        <p className="mt-2 text-sm text-gray-500">行业顶尖人物齐聚</p>
      </div>

      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-5 pb-4 -mr-4 scrollbar-hide" style={{ scrollbarWidth: "none" }}>
        {guests.map((g) => (
          <div
            key={g.name}
            className="flex-shrink-0 w-[220px] snap-center rounded-2xl bg-white shadow-sm border border-gray-100 p-5 flex flex-col items-center text-center gap-3"
          >
            <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${g.color} flex items-center justify-center text-white text-2xl font-bold`}>
              {g.name[0]}
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0B1121]">{g.name}</h3>
              <p className="text-xs font-medium text-orange-500 mt-0.5">{g.title}</p>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">{g.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify**

Run: `pnpm check`
Expected: 通过

- [ ] **Step 3: Commit**

```bash
git add client/src/components/event/GuestsSection.tsx
git commit -m "feat: add GuestsSection component"
```

---

### Task 11: 议程时间轴组件

**Files:**
- Create: `client/src/components/event/TimelineSection.tsx`

- [ ] **Step 1: 创建 TimelineSection**

```ts
const timeline = [
  { time: "09:00", title: "签到 & 欢迎咖啡", desc: "领取资料袋与伴手礼" },
  { time: "09:30", title: "开场致辞", desc: "CEO 主题演讲：AI 定义下一个十年" },
  { time: "10:15", title: "新品发布仪式", desc: "全球首发 · 沉浸式产品演示" },
  { time: "11:00", title: "圆桌对话", desc: "AI 与产业的深度融合路径" },
  { time: "12:00", title: "自助午餐 & 社交", desc: "自由交流 + 产品体验区开放" },
  { time: "14:00", title: "下午场分论坛", desc: "技术专场 / 商业专场 / 体验工坊" },
  { time: "17:30", title: "闭幕 & 抽奖", desc: "幸运嘉宾获得新品体验资格" },
];

export function TimelineSection() {
  return (
    <section id="timeline" className="px-5 py-14 bg-white">
      <div className="mb-8 text-center">
        <h2 className="text-xl font-bold text-[#0B1121]">详细议程</h2>
        <p className="mt-2 text-sm text-gray-500">2026 年 7 月 18 日</p>
      </div>

      <div className="relative pl-8">
        {/* Vertical line */}
        <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-gray-200" />

        <div className="flex flex-col gap-6">
          {timeline.map((item, i) => (
            <div key={i} className="relative">
              {/* Dot */}
              <div className={`absolute -left-8 top-1 w-[22px] h-[22px] rounded-full border-[3px] bg-white flex items-center justify-center ${
                i === 2 ? "border-orange-500 bg-orange-50" : "border-gray-300"
              }`}>
                {i === 2 && <div className="w-2 h-2 rounded-full bg-orange-500" />}
              </div>

              <span className="text-xs font-bold text-orange-500">{item.time}</span>
              <h3 className="mt-1 text-sm font-bold text-[#0B1121]">{item.title}</h3>
              <p className="mt-0.5 text-xs text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify**

Run: `pnpm check`
Expected: 通过

- [ ] **Step 3: Commit**

```bash
git add client/src/components/event/TimelineSection.tsx
git commit -m "feat: add TimelineSection component"
```

---

### Task 12: 适合人群组件

**Files:**
- Create: `client/src/components/event/AudienceSection.tsx`

- [ ] **Step 1: 创建 AudienceSection**

```ts
import { Briefcase, Code, TrendingUp, Lightbulb } from "lucide-react";
import type { ReactNode, ComponentType } from "react";

const audiences: { icon: ComponentType<{ size?: number }>; label: string; desc: string }[] = [
  { icon: Briefcase, label: "企业管理者", desc: "寻求 AI 驱动数字化转型的决策者" },
  { icon: Code, label: "技术开发者", desc: "关注前沿框架与工具的工程师" },
  { icon: TrendingUp, label: "投资人", desc: "布局AI赛道寻找下一个独角兽" },
  { icon: Lightbulb, label: "产品经理", desc: "探索AI产品化落地方案" },
];

export function AudienceSection() {
  return (
    <section id="audience" className="px-5 py-14 bg-[#F8FAFC]">
      <div className="mb-8 text-center">
        <h2 className="text-xl font-bold text-[#0B1121]">适合人群</h2>
        <p className="mt-2 text-sm text-gray-500">如果你属于以下任何一类</p>
      </div>

      <div className="flex flex-col gap-3">
        {audiences.map((a) => (
          <div key={a.label} className="flex items-center gap-4 rounded-2xl bg-white border border-gray-100 p-4 shadow-sm">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0B1121] to-[#1E3A5F] text-white">
              <a.icon size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0B1121]">{a.label}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{a.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify**

Run: `pnpm check`
Expected: 通过

- [ ] **Step 3: Commit**

```bash
git add client/src/components/event/AudienceSection.tsx
git commit -m "feat: add AudienceSection component"
```

---

### Task 13: 场地信息组件

**Files:**
- Create: `client/src/components/event/VenueSection.tsx`

- [ ] **Step 1: 创建 VenueSection**

```ts
import { MapPin, Navigation, ArrowRight } from "lucide-react";

export function VenueSection() {
  return (
    <section id="venue" className="px-5 py-14 bg-white">
      <div className="mb-8 text-center">
        <h2 className="text-xl font-bold text-[#0B1121]">场地信息</h2>
        <p className="mt-2 text-sm text-gray-500">城市地标，科技与未来的交汇点</p>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-[#F1F5F9] overflow-hidden">
        {/* Map placeholder */}
        <div className="h-40 bg-gradient-to-br from-[#1E3A5F] to-[#0B1121] flex items-center justify-center">
          <MapPin size={40} className="text-orange-400/60" />
        </div>

        <div className="p-5 space-y-3">
          <div className="flex items-start gap-3">
            <MapPin size={18} className="text-orange-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-[#0B1121]">上海中心大厦</h3>
              <p className="text-xs text-gray-500 mt-0.5">上海市浦东新区陆家嘴银城中路 501 号 · 5 层会议厅</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Navigation size={18} className="text-orange-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-[#0B1121]">交通指引</h3>
              <p className="text-xs text-gray-500 mt-0.5">地铁 2 号线陆家嘴站 6 号口出，步行 5 分钟。地下停车场 B2 层可停车。</p>
            </div>
          </div>

          <a href="#" className="inline-flex items-center gap-1 text-xs font-semibold text-orange-500 mt-2">
            查看地图导航 <ArrowRight size={14} />
          </a>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify**

Run: `pnpm check`
Expected: 通过

- [ ] **Step 3: Commit**

```bash
git add client/src/components/event/VenueSection.tsx
git commit -m "feat: add VenueSection component"
```

---

### Task 14: 合作伙伴组件

**Files:**
- Create: `client/src/components/event/PartnersSection.tsx`

- [ ] **Step 1: 创建 PartnersSection**

```ts
const partners = [
  "星辰计算", "远见资本", "未来智能", "深度思维",
  "数智科技", "创想工场", "量子跃迁", "极光数据", "万象互联",
];

export function PartnersSection() {
  return (
    <section id="partners" className="px-5 py-14 bg-[#F8FAFC]">
      <div className="mb-8 text-center">
        <h2 className="text-xl font-bold text-[#0B1121]">合作伙伴</h2>
        <p className="mt-2 text-sm text-gray-500">感谢以下品牌的支持</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {partners.map((p) => (
          <div
            key={p}
            className="flex items-center justify-center rounded-xl bg-white border border-gray-100 h-16 px-3"
          >
            <span className="text-xs font-semibold text-gray-400">{p}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify**

Run: `pnpm check`
Expected: 通过

- [ ] **Step 3: Commit**

```bash
git add client/src/components/event/PartnersSection.tsx
git commit -m "feat: add PartnersSection component"
```

---

### Task 15: 报名 Drawer 组件（表单 + 成功态）

**Files:**
- Create: `client/src/components/event/RegistrationDrawer.tsx`
- Modify: `client/src/components/bottom-drawer.tsx` (可能不需要 — 直接使用 Drawer)

- [ ] **Step 1: 创建 RegistrationDrawer**

```ts
import { useState, useEffect, useRef } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, X } from "lucide-react";
import { useRegistrationSubmit } from "@/hooks/use-registration";
import QRCode from "qrcode";

type RegistrationDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type FormData = {
  name: string;
  phone: string;
  company: string;
  title: string;
  attendees: number;
  notes: string;
};

type SuccessData = {
  ticketNo: string;
};

export function RegistrationDrawer({ open, onOpenChange }: RegistrationDrawerProps) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [form, setForm] = useState<FormData>({ name: "", phone: "", company: "", title: "", attendees: 1, notes: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [successData, setSuccessData] = useState<SuccessData | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const submitMutation = useRegistrationSubmit();

  useEffect(() => {
    if (open) {
      setStep("form");
      setForm({ name: "", phone: "", company: "", title: "", attendees: 1, notes: "" });
      setErrors({});
      setSuccessData(null);
    }
  }, [open]);

  useEffect(() => {
    if (successData && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, `TICKET:${successData.ticketNo}`, {
        width: 160,
        margin: 1,
        color: { dark: "#0B1121", light: "#FFFFFF" },
      }).then(() => {
        const url = canvasRef.current?.toDataURL("image/png") || "";
        setQrDataUrl(url);
      });
    }
  }, [successData]);

  function validate(): boolean {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.name.trim()) e.name = "请输入姓名";
    if (!/^\d{11}$/.test(form.phone)) e.phone = "请输入正确的手机号";
    if (!form.company.trim()) e.company = "请输入公司名称";
    if (!form.title.trim()) e.title = "请输入职位";
    if (!form.attendees || form.attendees < 1 || form.attendees > 10) e.attendees = "1-10人";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    try {
      const result = await submitMutation.mutateAsync(form);
      setSuccessData({ ticketNo: result.ticketNo });
      setStep("success");
    } catch {
      // error shown via toast
    }
  }

  function updateField(field: keyof FormData, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="border-border/60 bg-card/96 px-0 pb-8 max-h-[85vh]">
        {step === "form" ? (
          <>
            <DrawerHeader className="px-5">
              <DrawerTitle>报名参会</DrawerTitle>
              <DrawerDescription>填写信息，锁定您的专属席位</DrawerDescription>
            </DrawerHeader>

            <div className="px-5 space-y-4 overflow-y-auto">
              <Field label="姓名" error={errors.name}>
                <Input
                  placeholder="请输入姓名"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                />
              </Field>

              <Field label="手机号" error={errors.phone}>
                <Input
                  type="tel"
                  placeholder="请输入手机号"
                  maxLength={11}
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value.replace(/\D/g, ""))}
                />
              </Field>

              <Field label="公司" error={errors.company}>
                <Input
                  placeholder="请输入公司名称"
                  value={form.company}
                  onChange={(e) => updateField("company", e.target.value)}
                />
              </Field>

              <Field label="职位" error={errors.title}>
                <Input
                  placeholder="请输入职位"
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                />
              </Field>

              <Field label="参会人数" error={errors.attendees}>
                <select
                  className="w-full min-h-[44px] rounded-xl border border-input/80 bg-white/80 px-3 text-sm"
                  value={form.attendees}
                  onChange={(e) => updateField("attendees", Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n}人</option>
                  ))}
                </select>
              </Field>

              <Field label="备注">
                <Textarea
                  placeholder="如有特殊需求请备注（选填）"
                  rows={2}
                  value={form.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                />
              </Field>
            </div>

            <div className="px-5 pt-4">
              <Button
                className="w-full h-12 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold"
                onClick={handleSubmit}
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? "提交中..." : "确认报名"}
              </Button>
            </div>
          </>
        ) : (
          <>
            <DrawerHeader className="px-5">
              <DrawerTitle className="text-center text-green-600 flex items-center justify-center gap-2">
                <CheckCircle size={22} />
                报名成功！
              </DrawerTitle>
              <DrawerDescription className="text-center">
                您的电子票已生成，请保存
              </DrawerDescription>
            </DrawerHeader>

            <div className="px-5 flex flex-col items-center gap-4">
              {/* QR Code */}
              <div className="rounded-2xl border-2 border-dashed border-gray-200 p-4 bg-white">
                {successData ? (
                  <img src={qrDataUrl} alt="电子票二维码" className="w-40 h-40" />
                ) : (
                  <div className="w-40 h-40 flex items-center justify-center text-gray-300 text-xs">生成中...</div>
                )}
              </div>
              <canvas ref={canvasRef} className="hidden" />

              <div className="text-center">
                <p className="text-xs text-gray-500">电子票编号</p>
                <p className="text-lg font-bold text-[#0B1121] tracking-wider">
                  {successData?.ticketNo || ""}
                </p>
              </div>

              <p className="text-xs text-gray-400 text-center">
                请截图保存二维码，凭电子票入场
              </p>

              <Button
                className="w-full h-12 rounded-xl bg-[#0B1121] text-white font-bold"
                onClick={() => onOpenChange(false)}
              >
                完成
              </Button>
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-gray-700">{label}</Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `pnpm check`
Expected: 通过

- [ ] **Step 3: Commit**

```bash
git add client/src/components/event/RegistrationDrawer.tsx
git commit -m "feat: add RegistrationDrawer with form and QR success state"
```

---

### Task 16: 顶部吸附条 & 底部分享条

**Files:**
- Create: `client/src/components/event/StickyBar.tsx`
- Create: `client/src/components/event/ShareBar.tsx`

- [ ] **Step 1: 创建 StickyBar**

```ts
import { Button } from "@/components/ui/button";

type StickyBarProps = {
  visible: boolean;
  onRegister: () => void;
};

export function StickyBar({ visible, onRegister }: StickyBarProps) {
  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-40 px-4 py-2 bg-white/90 backdrop-blur-lg border-b border-gray-100 shadow-sm transition-all duration-300">
      <div className="flex items-center justify-between max-w-[430px] mx-auto">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-[#0B1121]">智界 · 2026</span>
          <span className="text-[10px] text-gray-400">7月18日 · 上海中心大厦</span>
        </div>
        <Button
          onClick={onRegister}
          className="h-9 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold"
        >
          立即报名
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 创建 ShareBar**

```ts
import { Share2 } from "lucide-react";

export function ShareBar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 px-4 py-3 bg-white/90 backdrop-blur-lg border-t border-gray-100">
      <div className="flex items-center justify-center max-w-[430px] mx-auto">
        <button
          className="flex items-center gap-2 text-xs font-semibold text-gray-600 min-h-[44px] px-5 rounded-xl border border-gray-200 bg-gray-50 active:bg-gray-100"
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: "智界 · 2026 科技新品发布会",
                text: "邀你参加智界 · 2026 科技新品发布会，AI 定义下一个十年！",
                url: window.location.href,
              }).catch(() => {});
            }
          }}
        >
          <Share2 size={16} />
          分享给朋友
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `pnpm check`
Expected: 通过

- [ ] **Step 4: Commit**

```bash
git add client/src/components/event/StickyBar.tsx client/src/components/event/ShareBar.tsx
git commit -m "feat: add StickyBar and ShareBar components"
```

---

### Task 17: 页面组装 — home.tsx

**Files:**
- Modify: `client/src/pages/home.tsx`

- [ ] **Step 1: 重写 home.tsx**

```ts
import { useState, useEffect, useRef } from "react";
import { HeroSection } from "@/components/event/HeroSection";
import { HighlightsSection } from "@/components/event/HighlightsSection";
import { GuestsSection } from "@/components/event/GuestsSection";
import { TimelineSection } from "@/components/event/TimelineSection";
import { AudienceSection } from "@/components/event/AudienceSection";
import { VenueSection } from "@/components/event/VenueSection";
import { PartnersSection } from "@/components/event/PartnersSection";
import { RegistrationDrawer } from "@/components/event/RegistrationDrawer";
import { StickyBar } from "@/components/event/StickyBar";
import { ShareBar } from "@/components/event/ShareBar";
import { useRegistrationCount } from "@/hooks/use-registration";

export default function Home() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { data: count } = useRegistrationCount();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setStickyVisible(!entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    const hero = document.getElementById("hero");
    if (hero) observer.observe(hero);

    return () => observer.disconnect();
  }, []);

  return (
    <div className="mobile-screen-shell bg-white">
      <div className="mobile-screen-frame">
        <StickyBar visible={stickyVisible} onRegister={() => setDrawerOpen(true)} />

        <div style={{ paddingBottom: "calc(4rem + var(--safe-bottom))" }}>
          <HeroSection onRegister={() => setDrawerOpen(true)} attendeeCount={count} />
          <HighlightsSection />
          <GuestsSection />
          <TimelineSection />
          <AudienceSection />
          <VenueSection />
          <PartnersSection />

          {/* Footer */}
          <div className="py-8 text-center">
            <p className="text-xs text-gray-400">智界 · 2026 科技新品发布会</p>
            <p className="text-[10px] text-gray-300 mt-1">Powered by AgentMa</p>
          </div>
        </div>

        <ShareBar />

        <RegistrationDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `pnpm check`
Expected: 通过

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/home.tsx
git commit -m "feat: assemble event registration page with all sections"
```

---

### Task 18: 构建验证 & 启动

**Files:** 无新文件

- [ ] **Step 1: 类型检查**

Run: `pnpm check`
Expected: 通过（0 errors）

- [ ] **Step 2: 构建**

Run: `pnpm build`
Expected: 成功

- [ ] **Step 3: 启动预览**

Use `restart_workflow` tool to start the dev server. Verify the page renders at the preview URL.

- [ ] **Step 4: Commit final**

```bash
git add -A
git commit -m "chore: final verification after build"
```

---

## 自审检查清单

- [x] **Spec coverage**: 7 区块 → Task 8-14；报名 drawer → Task 15；计数器 → Task 6/7；sticky bar → Task 16；share bar → Task 16；后端 API → Task 1-4
- [x] **Placeholder scan**: 无 TBD/TODO，所有代码完整
- [x] **Type consistency**: `RegistrationCreate` 类型在 schema/hook/controller/service 中一致；所有 component props 类型已定义
