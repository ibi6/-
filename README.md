# FitAI

AI 健身饮食管理 App — Expo React Native V1 高保真可交互演示。

本地 Mock + AsyncStorage 持久化，无真实后端 / 支付 / 医疗诊断 / 姿态 AI。API 接口已预留，可切换真实服务。

## 技术栈

| 层 | 选型 |
|---|---|
| 框架 | React Native + Expo ~52 |
| 语言 | TypeScript strict |
| 路由 | Expo Router (file-based) |
| 状态 | Zustand + AsyncStorage |
| 表单 | React Hook Form + Zod |
| 动画 | Reanimated + Gesture Handler |
| 图标 | lucide-react-native |
| 日期 | date-fns |

主色 `#6C5CE7`，背景 `#F7F8FC`，紫靛蓝软 UI。

## 快速开始

```bash
# 依赖
npm install

# 环境变量（可选，默认已走 Mock）
cp .env.example .env

# 类型检查 / Lint
npm run typecheck
npm run lint

# 启动
npm start          # Expo Dev Server
npm run android
npm run ios
npm run web
```

演示账号：任意邮箱 + 密码（Mock 鉴权，本地生成用户）。首次登录会走 Onboarding 建档。

## 环境变量

见 [`.env.example`](.env.example)：

| 变量 | 说明 | 默认 |
|---|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | 真实后端地址（预留） | `https://api.example.com` |
| `EXPO_PUBLIC_USE_MOCK_API` | 是否使用 Mock | `true` |
| `EXPO_PUBLIC_AI_PROVIDER` | AI 提供方 | `mock` |
| `EXPO_PUBLIC_ENABLE_FOOD_RECOGNITION` | 食物识别开关（UI 预留） | `true` |
| `EXPO_PUBLIC_ENABLE_HEALTH_SYNC` | 健康同步（预留） | `false` |

## 目录结构

```
app/                      # Expo Router 页面
  (auth)/                 # 登录 / 注册
  (tabs)/                 # 首页 / 训练 / 饮食 / AI / 我的
  workout/                # 训练会话 + 总结
  nutrition/              # 快捷添加 + 搜索
  body.tsx                # 身体数据
  settings.tsx            # 设置
  subscription.tsx        # 订阅（Mock）
  onboarding.tsx          # 建档向导
src/
  components/common/      # Button / Card / Screen / TextField …
  constants/              # 颜色 / 间距 / 字体
  data/                   # 动作库 / 食物库 / 种子
  hooks/                  # useToday / useSessionTimer
  services/
    api/                  # 接口定义 + 工厂（预留真实 HTTP）
    mock/                 # Mock 实现
  stores/                 # auth / user / workout / nutrition / health / chat / settings / subscription
  theme/                  # 主题 re-export
  types/                  # 领域类型
  utils/                  # 营养计算 / 渐进超负荷 / 日期
  validators/             # Zod schemas
docs/superpowers/         # 设计与实现计划
```

## 已实现（V1 演示范围）

- 登录 / 注册 / Onboarding 建档
- 首页：今日训练、热量进度、快捷入口
- 训练：周计划、会话 FSM（准备 → 组间 → 休息 → 完成 → 总结）、渐进超负荷建议、RPE / 疼痛标记
- 饮食：按餐记录、搜索、快捷添加、宏量进度
- AI：结构化 Mock 对话（训练 / 饮食 / 恢复），非医疗声明
- 身体数据：体重录入与历史
- 设置：语言 / 单位；订阅：Mock 开通 / 恢复 / 取消
- 本地持久化（AsyncStorage）

## 未接入 / 后续

- 真实后端 HTTP（`services/api` 工厂已预留，`EXPO_PUBLIC_USE_MOCK_API=false` 时需接实现）
- 真实支付 / 应用内购
- 食物拍照识别、姿态 AI
- 健康 App 同步（HealthKit / Google Fit）
- 推送通知、社交 / 社区
- Victory Native 图表（计划中有，当前身体页用列表展示）

## 接入真实 API

1. 在 `src/services/api/interfaces.ts` 对齐后端契约
2. 实现 `src/services/api/*` HTTP 客户端（替换 `createApi` 中非 Mock 分支）
3. `.env` 设置 `EXPO_PUBLIC_USE_MOCK_API=false` 与 `EXPO_PUBLIC_API_BASE_URL`
4. AI 侧将 `EXPO_PUBLIC_AI_PROVIDER` 改为真实提供方并实现 `ai` 服务

页面与 Store 不直接依赖 Mock，只依赖 `api` 工厂，切换成本低。

## 验收自检（对照设计）

| 项 | 状态 |
|---|---|
| 5 Tab 可导航，中文 UI | ✅ |
| 登录 → Onboarding → 首页闭环 | ✅ |
| 训练会话 FSM 可完整走通 | ✅ |
| 饮食添加 / 搜索可记入当日 | ✅ |
| AI 可对话并有 disclaimer | ✅ |
| 身体 / 设置 / 订阅可交互 | ✅ |
| AsyncStorage 重启后保留 | ✅ |
| `npm run typecheck` 通过 | ✅ |
| `npm run lint` 通过 | ✅ |
| 无真实密钥 / 无伪医疗诊断 | ✅ |

## 需求基准

- 执行书：`FitAI_健身饮食管理App_Codex开发执行书_最终版.docx`
- 设计：[`docs/superpowers/specs/2026-07-19-fitai-design.md`](docs/superpowers/specs/2026-07-19-fitai-design.md)
- 计划：[`docs/superpowers/plans/2026-07-19-fitai-implementation.md`](docs/superpowers/plans/2026-07-19-fitai-implementation.md)

## 许可

私有项目，仅供演示与本地开发。
