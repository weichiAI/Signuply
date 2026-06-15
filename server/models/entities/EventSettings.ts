import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("event_settings")
export class EventSettings {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", unique: true, default: "default" })
  slug!: string;

  @Column({ type: "varchar" })
  title!: string;

  @Column({ type: "varchar" })
  subtitle!: string;

  @Column({ type: "varchar" })
  date!: string;

  @Column({ type: "varchar" })
  time!: string;

  @Column({ type: "varchar" })
  location!: string;

  @Column({ type: "varchar" })
  address!: string;

  @Column({ type: "varchar", default: "" })
  trafficInfo!: string;

  @Column({ type: "varchar", default: "" })
  mapLink!: string;

  @Column({ type: "varchar", default: "#0B1121" })
  heroBgColor!: string;

  @Column({ type: "varchar", default: "" })
  heroBgImage!: string;

  @Column({ type: "text" })
  highlights!: string;

  @Column({ type: "text" })
  guests!: string;

  @Column({ type: "text" })
  timeline!: string;

  @Column({ type: "text" })
  audience!: string;

  @Column({ type: "text" })
  partners!: string;

  @Column({ type: "text" })
  requiredFields!: string;

  @Column({ type: "text" })
  formFields!: string;

  @Column({ type: "text" })
  sectionLabels!: string;

  @Column({ type: "text" })
  sectionSubtitles!: string;

  @Column({ type: "text" })
  enabledSections!: string;

  @Column({ type: "varchar", default: "" })
  adminPassword!: string;
}

export const DEFAULT_EVENT_SETTINGS = {
  slug: "default",
  title: "智界 · 2026 科技新品发布会",
  subtitle: "AI 定义下一个十年",
  date: "2026 年 7 月 18 日（周六）",
  time: "09:00 — 18:00",
  location: "上海中心大厦 5 层会议厅",
  address: "上海市浦东新区陆家嘴银城中路 501 号",
  trafficInfo: "地铁 2 号线陆家嘴站 6 号口出，步行 5 分钟。地下停车场 B2 层可停车。",
  mapLink: "https://uri.amap.com/marker?position=121.50638,31.23545&name=上海中心大厦",
  heroBgColor: "#0B1121",
  heroBgImage: "",
  requiredFields: JSON.stringify(["name", "phone", "company", "title"]),
  formFields: JSON.stringify([
    { key: "name", label: "姓名", type: "text", required: true },
    { key: "phone", label: "手机号", type: "tel", required: true },
    { key: "company", label: "公司", type: "text", required: true },
    { key: "title", label: "职位", type: "text", required: true },
    { key: "attendees", label: "参会人数", type: "select", options: ["1","2","3","4","5"], required: false },
    { key: "notes", label: "备注", type: "textarea", required: false },
  ]),
  sectionLabels: JSON.stringify({
    highlights: "活动亮点", guests: "嘉宾阵容", timeline: "详细议程",
    audience: "适合人群", venue: "场地信息", partners: "合作伙伴",
  }),
  sectionSubtitles: JSON.stringify({
    highlights: "不可错过的四大理由", guests: "行业顶尖人物齐聚", timeline: "2026 年 7 月 18 日",
    audience: "如果你属于以下任何一类", venue: "城市地标，科技与未来的交汇点", partners: "感谢以下品牌的支持",
  }),
  enabledSections: JSON.stringify(["highlights","guests","timeline","audience","venue","partners"]),
  adminPassword: "",
  highlights: JSON.stringify([
    { title: "新品首发", desc: "全球首次公开亮相最新 AI 硬件产品线" },
    { title: "大咖对话", desc: "行业领袖深度探讨 AI 趋势与商业落地" },
    { title: "沉浸体验", desc: "亲手试用新品，感受次世代交互方式" },
    { title: "限量伴手礼", desc: "到场嘉宾专属定制科技礼盒一份" },
  ]),
  guests: JSON.stringify([
    { name: "张晓峰", title: "CEO，未来智能科技", desc: "前 Google AI 研究员，15年AI领域经验" },
    { name: "李梦然", title: "CTO，星辰计算", desc: "开源框架 StarML 作者，GitHub 20k+ stars" },
    { name: "王思远", title: "VP of Product，远见资本", desc: "主导过 50+ 科技项目投资，总额超百亿" },
    { name: "陈明哲", title: "首席科学家，深度思维", desc: "NeurIPS/ICML 最佳论文奖获得者" },
  ]),
  timeline: JSON.stringify([
    { time: "09:00", title: "签到 & 欢迎咖啡", desc: "领取资料袋与伴手礼" },
    { time: "09:30", title: "开场致辞", desc: "CEO 主题演讲：AI 定义下一个十年" },
    { time: "10:15", title: "新品发布仪式", desc: "全球首发 · 沉浸式产品演示" },
    { time: "11:00", title: "圆桌对话", desc: "AI 与产业的深度融合路径" },
    { time: "12:00", title: "自助午餐 & 社交", desc: "自由交流 + 产品体验区开放" },
    { time: "14:00", title: "下午场分论坛", desc: "技术专场 / 商业专场 / 体验工坊" },
    { time: "17:30", title: "闭幕 & 抽奖", desc: "幸运嘉宾获得新品体验资格" },
  ]),
  audience: JSON.stringify([
    { label: "企业管理者", desc: "寻求 AI 驱动数字化转型的决策者" },
    { label: "技术开发者", desc: "关注前沿框架与工具的工程师" },
    { label: "投资人", desc: "布局AI赛道寻找下一个独角兽" },
    { label: "产品经理", desc: "探索AI产品化落地方案" },
  ]),
  partners: JSON.stringify([
    "星辰计算", "远见资本", "未来智能", "深度思维",
    "数智科技", "创想工场", "量子跃迁", "极光数据", "万象互联",
  ]),
};
