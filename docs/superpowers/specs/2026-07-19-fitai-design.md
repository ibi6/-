# FitAI V1 设计规格

**日期：** 2026-07-19  
**状态：** 用户授权直接执行（跳过分段审批）  
**需求基准：** `FitAI_健身饮食管理App_Codex开发执行书_最终版.docx`（唯一权威）  
**实现路径：** 方案 A — 严格按执行书 Expo RN + Mock + 本地持久化完整演示版  

---

## 1. 产品范围

### 1.1 定位
FitAI：AI 私人健身教练 + AI 营养师 + 训练日志 + 饮食记录 + 身体数据分析。移动端健康管理工具，**不是**医疗器械。

### 1.2 V1 必须完成
- 可运行 Expo TypeScript 工程（iOS / Android / Expo Go / Web 开发）
- 六核心页高保真可交互：首页、训练计划、动作详情、饮食、AI 助手、数据分析
- 完整闭环：初始化问卷→计划、训练执行状态机、饮食增删改联动、AI Mock 对话、图表范围切换、资料/设置/对话持久化
- Mock Service 与真实 API 同接口；`EXPO_PUBLIC_USE_MOCK_API=true`
- `typecheck` + `lint` 通过；README + `.env.example`

### 1.3 明确非目标
- 真支付、医疗诊断、精准识图分量、姿态纠错、完整社区
- 真实后端 / 健康平台同步（仅预留接口）

### 1.4 成功标准
| 维度 | 标准 |
|------|------|
| 可运行 | `npm install` / `npx expo start` 成功 |
| 流程 | 训练一场、饮食一餐、AI 一轮、图表切换均可演示 |
| 质量 | `npm run typecheck` / `npm run lint` 通过 |
| 持久化 | 杀进程再开，资料/对话/进行中训练可恢复 |
| 交付物 | 完整代码、README、env 示例、已完成/未接入清单 |

---

## 2. 技术栈（锁定）

| 领域 | 技术 |
|------|------|
| 移动端 | React Native + Expo + TypeScript (strict) |
| 路由 | Expo Router |
| 状态 | Zustand + AsyncStorage（persist + version + migrate） |
| 表单 | React Hook Form + Zod |
| 动画 | Reanimated + Gesture Handler |
| 图片/反馈 | Expo Image, Expo Haptics |
| 视觉 | Expo Linear Gradient, React Native SVG |
| 图表 | Victory Native XL 或稳定 RN 图表库（禁止 WebView 图表） |
| 图标 | lucide-react-native |
| 质量 | ESLint + Prettier + `tsc --noEmit` |

---

## 3. 信息架构与路由

### 3.1 五 Tab
首页 / 训练 / 饮食 / AI / 我的

### 3.2 路由树

```
app/
  _layout.tsx
  index.tsx
  (auth)/login.tsx | register.tsx | onboarding.tsx
  (tabs)/_layout.tsx | home | workout | nutrition | ai | profile
  workout/plan | exercise/[id] | session/[id] | summary/[id]
  nutrition/add | search | food/[id] | recognition
  analytics.tsx | body.tsx | settings.tsx | subscription.tsx
```

### 3.3 鉴权门控
冷启动读 persist → 未登录 login → 未 onboarding → onboarding → tabs/home。  
训练 session 中途离开：store 保留，再进可续训。

---

## 4. 目录结构

```
src/
  components/{common,home,workout,nutrition,chat,analytics}/
  constants/   # colors, spacing, typography, radius, shadows
  hooks/
  data/        # mock seeds
  services/
    api/       # interfaces + client
    mock/      # same interfaces
    index.ts   # factory by EXPO_PUBLIC_USE_MOCK_API
  stores/      # auth, user, workout, nutrition, health, chat, settings, subscription
  types/
  utils/       # nutrition math, progressive overload, date, errors
  validators/
  theme/
```

路径别名：`@/` → `src/`

---

## 5. 设计系统

### 5.1 色板
| Token | 值 |
|-------|-----|
| primary | #6C5CE7 |
| primaryLight | #8B7CF6 |
| primarySoft | #EEEAFE |
| background | #F7F8FC |
| surface | #FFFFFF |
| textPrimary | #15161A |
| textSecondary | #747987 |
| textMuted | #A4A8B2 |
| success | #34C88A |
| warning | #FFB44A |
| danger | #FF647C |
| blue | #5B9BFF |
| orange | #FF9A5A |
| border | #ECEEF3 |

### 5.2 间距与圆角
页边距 16–20；卡片间距 12–16；大卡圆角 22、普卡 18；按钮 16–18；触摸区 ≥44；软阴影。

### 5.3 字体
Display 28–34 / H1 24–28 / H2 18–22 / H3 15–17 / Body 14–16 / Caption 11–13

### 5.4 核心组件（必须可复用）
AppHeader, ScreenContainer, SafeAreaPage, PrimaryButton, SecondaryButton, IconButton, ProgressBar, CircularProgress, StatCard, MetricCard, SectionHeader, EmptyState, LoadingState, ErrorState, WorkoutCard, ExerciseCard, ExerciseSetRow, NutritionProgress, MealCard, FoodItemRow, QuickAction, ChatBubble, AIRecommendationCard, ChartCard, BottomSheet, ConfirmDialog, DateSelector, WeekCalendar, SegmentedControl, Avatar, Badge, Toast, SkeletonCard

每个组件：明确 Props、loading/disabled、无障碍 label、文本溢出处理。

---

## 6. 数据模型（核心）

```typescript
type ID = string;

type FitnessGoal = 'fat_loss' | 'muscle_gain' | 'shape' | 'performance' | 'health';
type ExperienceLevel = 'none' | 'beginner' | 'intermediate' | 'advanced';
type Equipment = 'none' | 'dumbbells' | 'barbell' | 'machines' | 'bands' | 'full_gym';
type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
type SessionPhase =
  | 'idle' | 'preparing' | 'activeSet' | 'resting'
  | 'paused' | 'nextExercise' | 'completed' | 'summary';

type UserProfile = {
  nickname: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  age?: number;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg?: number;
  bodyFatPercent?: number;
  fitnessGoal: FitnessGoal;
  experienceLevel: ExperienceLevel;
  trainingDaysPerWeek: number;
  sessionDurationMinutes: number;
  availableEquipment: Equipment[];
  dietaryPreferences: string[];
  allergies: string[];
};

type User = {
  id: ID;
  email?: string;
  profile: UserProfile;
  subscription: SubscriptionStatus;
  createdAt: string;
  onboardingCompleted: boolean;
};

// Workout
type Exercise = {
  id: ID;
  name: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: Equipment[];
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'compound' | 'isolation' | 'cardio' | 'mobility';
  cues: string[];
  commonMistakes: string[];
  safetyNotes: string[];
  mediaPlaceholder?: string;
};

type ExerciseSet = {
  id: ID;
  setIndex: number;
  targetReps: number;
  actualReps?: number;
  targetWeightKg?: number;
  actualWeightKg?: number;
  rpe?: number;
  completed: boolean;
  completedAt?: string;
};

type WorkoutExercise = {
  exerciseId: ID;
  order: number;
  sets: ExerciseSet[];
  restSeconds: number;
  notes?: string;
};

type WorkoutPlan = {
  id: ID;
  weekStart: string; // YYYY-MM-DD
  days: WorkoutDay[];
};

type WorkoutDay = {
  date: string;
  name: string;
  durationMinutes: number;
  exerciseCount: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'rest' | 'optional';
  targetMuscles: string[];
  exercises: WorkoutExercise[];
};

type WorkoutSession = {
  id: ID;
  planDayDate: string;
  planName: string;
  startedAt: string;
  endedAt?: string;
  phase: SessionPhase;
  currentExerciseIndex: number;
  currentSetIndex: number;
  exercises: WorkoutExercise[];
  totalVolumeKg?: number;
  estimatedCalories?: number;
  newPRs?: PersonalRecord[];
};

type PersonalRecord = {
  exerciseId: ID;
  type: 'weight' | 'reps' | 'volume';
  value: number;
  achievedAt: string;
};

// Nutrition
type FoodItem = {
  id: ID;
  name: string;
  brand?: string;
  per100g: { kcal: number; protein: number; carbs: number; fat: number };
  defaultServingG: number;
  tags?: string[];
};

type MealFood = {
  id: ID;
  foodId?: ID;
  name: string;
  weightG: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  isEstimate?: boolean;
};

type Meal = {
  id: ID;
  date: string;
  mealType: MealType;
  time: string;
  foods: MealFood[];
  totals: { kcal: number; protein: number; carbs: number; fat: number };
};

type NutritionTarget = {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
};

type NutritionSummary = {
  date: string;
  target: NutritionTarget;
  consumed: NutritionTarget;
  remaining: NutritionTarget;
  meals: Meal[];
  progress: { kcal: number; protein: number; carbs: number; fat: number }; // 0–1.2
};

// Health / AI / Settings
type BodyMeasurement = {
  id: ID;
  date: string;
  weightKg: number;
  bodyFatPercent?: number;
  note?: string;
};

type ChatMessage = {
  id: ID;
  role: 'user' | 'assistant' | 'system';
  text: string;
  createdAt: string;
  category?: 'general' | 'nutrition' | 'workout' | 'safety';
  cards?: AIRecommendationCardData[];
  actions?: AIAction[];
  disclaimer?: string;
};

type AIContext = {
  userProfile: UserProfile;
  todayWorkout?: WorkoutSession;
  nutritionSummary: NutritionSummary;
  recentMeasurements: BodyMeasurement[];
};

type AIResponse = {
  id: string;
  text: string;
  category: 'general' | 'nutrition' | 'workout' | 'safety';
  cards?: AIRecommendationCardData[];
  actions?: AIAction[];
  disclaimer?: string;
};

type AIRecommendationCardData = {
  id: ID;
  title: string;
  subtitle?: string;
  kind: 'meal' | 'workout_adjust' | 'safety' | 'motivation' | 'protein';
  payload: Record<string, unknown>;
};

type AIAction = {
  id: ID;
  label: string;
  type: 'navigate' | 'apply_plan' | 'add_food' | 'dismiss';
  payload?: Record<string, unknown>;
};

type AppSettings = {
  theme: 'system' | 'light' | 'dark';
  units: { weight: 'kg' | 'lb'; height: 'cm' | 'in' };
  language: 'zh-CN' | 'en';
  notifications: { workout: boolean; water: boolean; meal: boolean };
};

type SubscriptionStatus = {
  planId: 'free' | 'pro_monthly' | 'pro_yearly';
  isPro: boolean;
  expiresAt?: string;
};

type AppError = {
  code: 'NETWORK' | 'TIMEOUT' | 'UNAUTHORIZED' | 'VALIDATION' | 'NOT_FOUND' | 'UNKNOWN';
  message: string;
  retryable: boolean;
  details?: unknown;
};
```

---

## 7. Stores

| Store | 职责 | Persist |
|-------|------|---------|
| authStore | isAuthenticated, token?, onboardingCompleted | 是 |
| userStore | User / profile | 是 |
| workoutStore | weeklyPlan, currentSession, history, PRs, library | 是 |
| nutritionStore | targets, mealsByDate, favorites | 是 |
| healthStore | measurements, water, steps, sleep | 是 |
| chatStore | messages, isThinking, quickPrompts | 是 |
| settingsStore | AppSettings | 是 |
| subscriptionStore | plans, status, mockPurchase | 是 |

原则：
- UI 局部状态不进 store
- 只暴露 action，禁止页面深层 mutate
- 派生数据用 selector / utils
- persist 带 `version` + `migrate`

---

## 8. Service 层

```
src/services/
  api/client.ts          # baseURL, timeout, token, error map
  api/authApi.ts
  api/userApi.ts
  api/workoutApi.ts
  api/nutritionApi.ts
  api/healthApi.ts
  api/aiApi.ts
  mock/mock*.ts
  index.ts               # export const api = useMock ? mock : real
```

接口契约（节选）：

```typescript
interface WorkoutApi {
  getWeeklyPlan(date: string): Promise<WorkoutPlan>;
  getExercise(id: string): Promise<Exercise>;
  startWorkout(planDayDate: string): Promise<WorkoutSession>;
  saveExerciseSet(sessionId: string, exerciseId: string, set: ExerciseSet): Promise<void>;
  completeWorkout(sessionId: string): Promise<WorkoutSession>;
}

interface NutritionApi {
  getDailySummary(date: string): Promise<NutritionSummary>;
  searchFoods(query: string): Promise<FoodItem[]>;
  addMeal(meal: Meal): Promise<Meal>;
  updateMeal(meal: Meal): Promise<Meal>;
  deleteMeal(mealId: string): Promise<void>;
}

interface AIApi {
  sendMessage(input: string, context: AIContext): Promise<AIResponse>;
  recognizeFood(imageUri: string): Promise<FoodRecognitionResult>;
  adjustWorkout(request: WorkoutAdjustmentRequest): Promise<WorkoutPlan>;
}
```

Mock 延迟 300–800ms（AI 600–1200ms）以模拟真实感。

---

## 9. 核心业务规则

### 9.1 训练状态机
```
idle → preparing → activeSet ⇄ resting → … → completed → summary
                     ↕ paused
```
- 完成组 → 自动 rest → 保存 set
- 支持暂停、跳过休息、+15/+30s、跳过/替换动作（危险操作 ConfirmDialog）
- 退出再进恢复 session
- 完成：时长、组数、容量 Σ(w×reps)、估算消耗、新 PR

### 9.2 渐进超负荷
```
if 最近3次目标组全完成 and RPE<=8 → 建议 +2.5%~5% 重量
elif 连续2次未达最低次数 → 建议 -5% 或减一组
elif 疼痛反馈 → 不加重量，替换动作 + 安全提示
```

### 9.3 营养计算
```
foodNutrient = per100g × weightG / 100
mealTotal = sum(foods)
dayTotal = sum(meals)
remaining = target - consumed
progress = clamp(consumed/target, 0, 1.2)
```
超目标：中性文案，禁止羞辱。未来日期不可记「已食用」。

### 9.4 AI Mock 关键词
| 关键词 | 卡片类型 |
|--------|----------|
| 晚餐/吃什么 | 餐单推荐 |
| 火锅 | 外食策略 |
| 蛋白质 | 补充建议 |
| 膝盖疼/疼痛 | 安全建议 + 就医 |
| 没动力 | 20 分钟缩短方案 |
| 调整计划 | 前后对比 + 一键采用 |

安全：估算 disclaimer；伤病/疾病保守；改计划需用户确认。

---

## 10. Mock 数据最低量
- ≥20 动作（执行书附录列表）
- ≥30 食物
- 一周计划样例（一胸三头 … 日休息）
- 多日期体重（如 4/17–5/15 曲线）与热量/训练历史
- 会员方案 free / pro_monthly / pro_yearly

---

## 11. 页面规格摘要

| 页面 | 关键交互 |
|------|----------|
| 首页 | 问候、完成度、今日训练/饮食卡、饮水步数睡眠、AI 建议；骨架→内容 |
| 训练 Tab | 计划/动作库/记录分段；周历；状态色卡 |
| 动作详情 | 媒体 fallback、Tab、底部开始组 |
| Session | 当前组 UI、计时、完成组、休息控制 |
| Summary | 指标 + PR + 回首页 |
| 饮食 | 日导航、热量环、宏量、餐次、快捷添加 BottomSheet |
| AI | 气泡、思考态、结构化卡、历史恢复、键盘适配 |
| Analytics | 总览/训练/饮食/身体；周月季年；空状态 |
| Profile/Settings/Sub | 编辑、单位、清除数据二次确认、模拟订阅 |

---

## 12. 错误、加载、安全

- 全局：LoadingState / EmptyState / ErrorState（带 retry）/ Skeleton / Toast
- AppError 统一映射；Mock 模式无网仍可用
- 健康安全文案：非医疗；疼痛停止+就医；极端目标风险提示
- 隐私：清除本地数据、导出预留；不写密钥进仓

---

## 13. 实施阶段与门禁

1. 工程初始化（Expo TS、Router、alias、lint、prettier、主题、Tab）
2. 通用组件
3. 核心六页 UI + 导航
4. 训练闭环
5. 饮食闭环
6. 用户 / 设置 / 会员 / onboarding
7. 质量修复（TS、lint、布局、持久化、边界）
8. README、.env.example、清单

每阶段：`npm run typecheck && npm run lint` 必须通过。禁止占位页冒充完成。

---

## 14. 验收清单（摘要）

功能：启动分流、五 Tab、六页演示级、一场训练、一餐饮食、AI 消息、图表切换、持久化。  
视觉：边距圆角一致、安全区、键盘、状态色、加载/空/错。  
工程：install/start/typecheck/lint、README、env、类型完整。

---

## 15. 环境

```
EXPO_PUBLIC_API_BASE_URL=https://api.example.com
EXPO_PUBLIC_USE_MOCK_API=true
EXPO_PUBLIC_AI_PROVIDER=mock
EXPO_PUBLIC_ENABLE_FOOD_RECOGNITION=true
EXPO_PUBLIC_ENABLE_HEALTH_SYNC=false
```

Scripts：`start` `android` `ios` `web` `lint` `typecheck` `format`

---

## 16. 自检（Spec Self-Review）

| 检查项 | 结果 |
|--------|------|
| 无 TBD/TODO 占位需求 | 通过 — 规则与接口已闭合 |
| 架构与功能一致 | 通过 — Mock 同接口 + 8 store + 路由对齐执行书 |
| 范围单一可执行 | 通过 — 单应用 V1 演示版，不拆子项目 |
| 歧义已消解 | 通过 — 选方案 A；图表用 RN 原生库；深色主题 V1 主做浅色 |

**用户指令：** 「直接开干，中途不要问」— 本规格视为已批准，进入实施计划与编码。
