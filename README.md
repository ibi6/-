# FitAI V2（第二版）

FitAI 是一个 Expo React Native 健身与饮食管理 App。第二版完成了核心页面升级、训练与饮食闭环、数据分析、本地持久化和系统化 Debug 验收。

当前项目是可交互的本地 Mock 演示：没有真实后端、支付、医疗诊断、健康设备同步或真实 AI 服务。

## 第二版内容

- 5 个底部 Tab：首页、训练、饮食、AI、我的。
- 训练：周计划、动作详情、训练状态机、休息计时、训练总结与历史记录。
- 饮食：日期隔离、营养汇总、搜索、快捷添加、食物详情、份量计算、删除与 AI 图片识别 Mock。
- AI：结构化训练/饮食建议、Free/Pro 配额、失败重试、可执行的饮食与计划调整动作。
- 数据分析：总览、训练、饮食、身体、习惯；周/月/三个月/年/全部范围；原生 SVG 图表。
- 隐私：资料、训练、饮食、身体和对话持久化；支持清除活动数据，以及退出并清除全部本机数据。
- UI：紫靛蓝渐变、大圆角、柔和阴影，并完成 320/375/390/414/430px 响应式巡检。

## 技术栈

| 层 | 技术 |
|---|---|
| App | React Native 0.76 + Expo 52 + Expo Router |
| 语言 | TypeScript strict |
| 状态 | Zustand + AsyncStorage |
| 表单 | React Hook Form + Zod |
| UI | lucide-react-native + LinearGradient + React Native SVG |
| 测试 | Jest + jest-expo |

## 快速开始

```bash
npm install
copy .env.example .env
npm run web
```

打开 `http://localhost:8081`（若端口占用，以 Expo 输出地址为准）。登录页可直接点击“一键体验 Demo 账号”。

常用命令：

```bash
npm run typecheck
npm run lint
npm test -- --runInBand
npx expo-doctor
npx expo export
```

## 环境变量

| 变量 | 作用 | 当前默认 |
|---|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | 真实 API 地址预留 | `https://api.example.com` |
| `EXPO_PUBLIC_USE_MOCK_API` | 使用本地 Mock 服务 | `true` |
| `EXPO_PUBLIC_AI_PROVIDER` | AI 提供方标识 | `mock` |
| `EXPO_PUBLIC_ENABLE_FOOD_RECOGNITION` | 显示食物识别流程 | `true` |
| `EXPO_PUBLIC_ENABLE_HEALTH_SYNC` | 健康设备同步开关 | `false` |

不要在 `EXPO_PUBLIC_*` 中写入密钥；这些值会进入客户端包。

## 目录

```text
app/
  (auth)/                 登录 / 注册
  (tabs)/                 首页 / 训练 / 饮食 / AI / 我的
  workout/                动作详情 / Session / Summary
  nutrition/              搜索 / 快捷添加 / 食物详情 / 图片识别
  analytics.tsx           多维数据分析
  body.tsx                身体数据
  settings.tsx            版本信息与本地数据清理
src/
  components/             通用组件与图表
  data/                   动作、食物与演示种子
  services/api/           API 接口契约
  services/mock/          持久化 Mock 实现
  stores/                 Zustand 业务状态
  utils/                  营养、日期、分析与训练计算
  validators/             Zod 校验
```

## Mock 与未接入项

- 登录 Token、用户资料、训练、饮食和身体数据均为本机 Mock。
- AI 对话与食物图片识别是确定性演示，不代表真实识别精度。
- Pro 订阅只模拟开通、恢复和取消，不会发生真实扣款。
- HealthKit、Google Fit、推送通知、真实相机设备链路和真实后端尚未接入。
- 健康建议仅供一般信息参考，不替代医生或专业教练。

## 验收

提交前至少执行：

```bash
npm install
npx expo-doctor
npm run typecheck
npm run lint
npm test -- --runInBand
npx expo export
git diff --check
```

真机仍需人工复核 iOS Safe Area、Android 物理返回键、相机权限、键盘遮挡和不同设备字体缩放。

需求基准位于：

- `docs/superpowers/specs/2026-07-19-fitai-design.md`
- `docs/superpowers/plans/2026-07-19-fitai-implementation.md`
