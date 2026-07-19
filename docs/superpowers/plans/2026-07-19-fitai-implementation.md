# FitAI V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 交付可运行、可演示、可持久化的 FitAI Expo RN 完整 V1 工程（Mock API，无真实后端）。

**Architecture:** Expo Router 文件路由 + Zustand 分域持久化 + `services/api` 与 `services/mock` 同接口切换；页面只做组合，业务在 store/utils/service。

**Tech Stack:** RN + Expo + TS strict + Expo Router + Zustand + AsyncStorage + RHF + Zod + Reanimated + Gesture Handler + SVG + Linear Gradient + Expo Image/Haptics + Victory Native XL + lucide-react-native + ESLint/Prettier

**Spec:** [docs/superpowers/specs/2026-07-19-fitai-design.md](../specs/2026-07-19-fitai-design.md)

## Global Constraints

- 唯一需求基准：执行书 + 本 spec；禁止占位页冒充完成
- `EXPO_PUBLIC_USE_MOCK_API=true` 默认
- 每阶段结束必须 `npm run typecheck && npm run lint` 通过
- 中文 UI 文案；主色 #6C5CE7；背景 #F7F8FC
- 不引入 WebView 图表；不写真实密钥
- 路径别名 `@/*` → `src/*`
- Windows 本地开发；工作区路径含空格：`C:\Users\33185\Desktop\fite  app`

---

## File Map（将创建）

```
package.json, app.json, tsconfig.json, babel.config.js, .eslintrc.js, .prettierrc, .env.example, README.md
app/_layout.tsx, app/index.tsx
app/(auth)/{login,register,onboarding}.tsx
app/(tabs)/{_layout,home,workout,nutrition,ai,profile}.tsx
app/workout/{plan,exercise/[id],session/[id],summary/[id]}.tsx
app/nutrition/{add,search,food/[id],recognition}.tsx
app/{analytics,body,settings,subscription}.tsx
src/theme/index.ts
src/constants/{colors,spacing,typography,radius,shadows}.ts
src/types/*.ts
src/utils/{id,date,nutrition,overload,errors,completeScore}.ts
src/validators/{auth,profile,meal}.ts
src/data/{exercises,foods,plans,healthHistory,subscriptionPlans}.ts
src/services/api/{client,authApi,userApi,workoutApi,nutritionApi,healthApi,aiApi}.ts
src/services/mock/{delay,mockAuthApi,mockUserApi,mockWorkoutApi,mockNutritionApi,mockHealthApi,mockAiApi}.ts
src/services/index.ts
src/stores/{auth,user,workout,nutrition,health,chat,settings,subscription,persist}.ts
src/components/common/*  src/components/{home,workout,nutrition,chat,analytics}/*
src/hooks/{useToday,useSessionTimer}.ts
```

---

### Task 1: 工程脚手架与质量基线

**Files:**
- Create: `package.json`, `app.json`, `tsconfig.json`, `babel.config.js`, `.eslintrc.js`, `.prettierrc`, `.env.example`, `app/_layout.tsx`, `app/index.tsx`, `app/(tabs)/_layout.tsx` + 五个 tab 占位后立即填真内容于后续任务
- Create: `src/constants/*`, `src/theme/index.ts`

**Interfaces:**
- Produces: 可 `npx expo start` 的空壳；`@/` 别名；`npm run typecheck` / `lint` scripts

- [ ] **Step 1:** 用 `npx create-expo-app@latest . --template tabs` 或手写最小 Expo Router TS 工程（目录非空时手写/合并，勿覆盖 docs/）
- [ ] **Step 2:** 安装依赖：zustand, @react-native-async-storage/async-storage, react-hook-form, zod, @hookform/resolvers, react-native-reanimated, react-native-gesture-handler, react-native-svg, expo-linear-gradient, expo-image, expo-haptics, lucide-react-native, victory-native, date-fns
- [ ] **Step 3:** 配置 tsconfig paths `@/*` → `src/*`；babel module-resolver 如需
- [ ] **Step 4:** 写入 colors/spacing/typography/radius/shadows + theme export
- [ ] **Step 5:** ESLint + Prettier + scripts：`typecheck`, `lint`, `format`
- [ ] **Step 6:** `.env.example` 五变量；app.json name FitAI
- [ ] **Step 7:** Run `npm run typecheck && npm run lint` — 期望通过
- [ ] **Step 8:** Commit `chore: init FitAI Expo Router TypeScript baseline`

---

### Task 2: 类型、工具函数、Mock 种子数据

**Files:**
- Create: `src/types/index.ts`（及按域拆分若过长）
- Create: `src/utils/{id,date,nutrition,overload,errors,completeScore}.ts`
- Create: `src/data/{exercises,foods,plans,healthHistory,subscriptionPlans}.ts`
- Test: 可对 nutrition/overload 用简单 node/ts 断言或 jest；无测试框架时先加 `src/utils/__tests__` 或纯函数手写验证脚本；优先 `npm` 加 `jest`/`ts-jest` 若成本低，否则阶段 7 补

**Interfaces:**
- Produces: 全部核心 type；`calcFoodNutrients(per100g, weightG)`；`calcDayProgress`；`suggestOverload`；`createId()`；≥20 exercises、≥30 foods、一周 plan、体重序列

- [ ] **Step 1:** 实现 types（对齐 spec §6）
- [ ] **Step 2:** 实现 nutrition utils + 手写 3 个用例验证（0g、100g、超标 progress 1.2）
- [ ] **Step 3:** 实现 overload 规则
- [ ] **Step 4:** 种子数据完整填入
- [ ] **Step 5:** typecheck
- [ ] **Step 6:** Commit `feat: add domain types, utils, and mock seed data`

---

### Task 3: Service 接口 + Mock 实现 + 工厂

**Files:**
- Create: `src/services/api/*.ts`, `src/services/mock/*.ts`, `src/services/index.ts`

**Interfaces:**
- Produces: `getApi(): { auth, user, workout, nutrition, health, ai }` 全部 Mock 可用

- [ ] **Step 1:** 定义 API interfaces
- [ ] **Step 2:** client 错误映射 AppError
- [ ] **Step 3:** mock 各域 + delay
- [ ] **Step 4:** AI 关键词路由（晚餐/火锅/蛋白质/膝盖/没动力/调整计划/默认）
- [ ] **Step 5:** typecheck + Commit `feat: mock API layer with shared interfaces`

---

### Task 4: Zustand Stores + Persist

**Files:**
- Create: `src/stores/*.ts`

**Interfaces:**
- Produces: 8 stores；persist version=1；session 可恢复

- [ ] **Step 1:** auth + user + settings + subscription
- [ ] **Step 2:** workout（plan/session 状态机 actions）
- [ ] **Step 3:** nutrition（CRUD meal 重算 summary）
- [ ] **Step 4:** health + chat
- [ ] **Step 5:** 根 layout hydrate persist
- [ ] **Step 6:** typecheck + Commit `feat: zustand stores with async-storage persistence`

---

### Task 5: 通用 UI 组件

**Files:**
- Create: `src/components/common/*`（spec 组件清单优先实现演示必需子集，其余按页面需要补齐）

**最低必须：**
SafeAreaPage, ScreenContainer, AppHeader, PrimaryButton, SecondaryButton, IconButton, ProgressBar, CircularProgress, StatCard, SectionHeader, EmptyState, LoadingState, ErrorState, SkeletonCard, Toast, SegmentedControl, Badge, Avatar, ConfirmDialog, BottomSheet(可用 modal 简化)

- [ ] **Step 1:** 实现基础布局与按钮
- [ ] **Step 2:** 进度与卡片
- [ ] **Step 3:** 状态组件 + Toast 上下文
- [ ] **Step 4:** typecheck + Commit `feat: core UI component library`

---

### Task 6: 路由壳、鉴权分流、底部 Tab

**Files:**
- Modify: `app/_layout.tsx`, `app/index.tsx`, `app/(tabs)/_layout.tsx`
- Create: `app/(auth)/*`

**Interfaces:**
- Produces: 登录/注册 UI（Mock）、onboarding 多步、Tab 五图标中文

- [ ] **Step 1:** 根布局 Provider（GestureHandler, SafeArea, Toast）
- [ ] **Step 2:** index 分流
- [ ] **Step 3:** login/register mock
- [ ] **Step 4:** onboarding 6 步 + 写 userStore + 生成 plan/targets
- [ ] **Step 5:** Tab 样式对齐主色
- [ ] **Step 6:** typecheck + Commit `feat: auth gate, onboarding, tab navigator`

---

### Task 7: 首页 + 训练 Tab 列表 UI

**Files:**
- Create/Modify: `app/(tabs)/home.tsx`, `workout.tsx`
- Create: `src/components/home/*`, `src/components/workout/WorkoutCard.tsx` 等

- [ ] **Step 1:** 首页：问候、完成度、训练卡、饮食卡、健康三列、AI 建议、骨架
- [ ] **Step 2:** 训练 Tab：分段、周历、计划卡状态
- [ ] **Step 3:** 导航到 plan/exercise/session
- [ ] **Step 4:** typecheck + Commit `feat: home and workout tab screens`

---

### Task 8: 训练闭环（详情 / session / summary）

**Files:**
- Create: `app/workout/*`, `src/components/workout/*`, `src/hooks/useSessionTimer.ts`

- [ ] **Step 1:** exercise/[id] 详情 + tabs + fallback
- [ ] **Step 2:** session 状态机 UI + 休息计时 + 保存 set
- [ ] **Step 3:** 暂停/跳过/确认结束
- [ ] **Step 4:** summary 容量 PR
- [ ] **Step 5:** 恢复进行中 session
- [ ] **Step 6:** typecheck + Commit `feat: full workout execution loop`

---

### Task 9: 饮食闭环

**Files:**
- Create: `app/(tabs)/nutrition.tsx`, `app/nutrition/*`, `src/components/nutrition/*`

- [ ] **Step 1:** 日摘要 UI + 餐次列表
- [ ] **Step 2:** search + add 表单 Zod
- [ ] **Step 3:** food/[id] 分量
- [ ] **Step 4:** recognition mock 流程
- [ ] **Step 5:** 删除/编辑重算
- [ ] **Step 6:** typecheck + Commit `feat: nutrition logging loop`

---

### Task 10: AI 助手页

**Files:**
- Create: `app/(tabs)/ai.tsx`, `src/components/chat/*`

- [ ] **Step 1:** 消息列表 + 气泡
- [ ] **Step 2:** 发送 + thinking 600–1200ms + 关键词卡
- [ ] **Step 3:** 快捷问题、键盘、历史恢复
- [ ] **Step 4:** 安全 disclaimer
- [ ] **Step 5:** typecheck + Commit `feat: AI chat with structured mock replies`

---

### Task 11: 数据分析 + 身体数据

**Files:**
- Create: `app/analytics.tsx`, `app/body.tsx`, `src/components/analytics/*`

- [ ] **Step 1:** 分段 + 时间范围
- [ ] **Step 2:** 体重折线、热量柱、训练完成度（Victory）
- [ ] **Step 3:** 空状态
- [ ] **Step 4:** body 录入 measurement
- [ ] **Step 5:** typecheck + Commit `feat: analytics charts and body metrics`

---

### Task 12: 我的 / 设置 / 会员

**Files:**
- Create: `app/(tabs)/profile.tsx`, `settings.tsx`, `subscription.tsx`

- [ ] **Step 1:** profile 统计与入口
- [ ] **Step 2:** settings 单位/通知/清除数据
- [ ] **Step 3:** subscription 模拟购买
- [ ] **Step 4:** typecheck + Commit `feat: profile settings subscription`

---

### Task 13: 质量收敛 + README

**Files:**
- Modify: 全局修 TS/lint/安全区/键盘
- Create: `README.md`, 更新 `.env.example`

- [ ] **Step 1:** 全量 typecheck/lint 清零
- [ ] **Step 2:** 边界：空计划、超热量、AI 空消息禁用、图表无数据
- [ ] **Step 3:** README（简介、栈、安装、目录、Mock、API 接入、已完成/未接入）
- [ ] **Step 4:** 对照 spec 验收清单自检
- [ ] **Step 5:** Commit `docs: README and final quality pass`

---

## Execution Notes

- 用户要求「中途不要问」：实现中默认方案 A 与 spec，仅不可逆破坏时暂停
- 优先可演示路径：onboarding → home → session → nutrition → AI → analytics
- 图表库若 victory-native 安装失败，改用 `react-native-gifted-charts` 或 SVG 手绘简易图，仍禁止 WebView
- 大文件 >300 行拆分
- 提交信息中文或英文均可，保持 conventional：`feat|fix|chore|docs|refactor`
