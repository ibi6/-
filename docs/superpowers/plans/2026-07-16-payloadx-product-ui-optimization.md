# PayloadX Product UI Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 PayloadX 在桌面与移动端都具备统一、真实生效的专业设计系统，同时修复横向溢出、信息架构、可访问性和首包过大问题。

**Architecture:** 保持 React 页面 → `lib/api.ts` → FastAPI 的数据路径不变。新增纯导航配置与轻量前端契约测试，主题改为 CSS 变量驱动，页面使用路由懒加载，响应式问题在具体 Grid/表格边界修复。

**Tech Stack:** React 19、TypeScript 6、React Router 7、Tailwind CSS 4、Vite 8、Node 22.12+ 内置测试、FastAPI、pytest。

## Global Constraints

- 不修改数据库结构或 REST API。
- 不新增运行时依赖或全局状态库。
- 风险/成功/警告颜色保持稳定语义，不随强调色改变。
- 375px、768px、1440px 三档均不得出现页面级横向滚动。
- 所有图标按钮有可访问名称；移动端主要触控目标不小于 44px。

---

### Task 1: 导航与主题契约（RED → GREEN）

**Files:**
- Create: `src/config/navigation.test.ts`
- Create: `src/theme/themes.test.ts`
- Create: `src/config/navigation.ts`
- Modify: `src/theme/themes.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `NAV_ITEMS`, `getRouteMeta(pathname)`, `getThemeCssVars(id)`。
- Consumes: Node 22.12+ 原生 TypeScript type stripping，不新增测试依赖。

- [x] **Step 1: 写失败测试**

```ts
test('mobile and desktop navigation share all ten modules', () => {
  assert.deepEqual(NAV_ITEMS.map((item) => item.to), [
    '/', '/capture', '/payloads', '/protocols', '/stats',
    '/features', '/alerts', '/settings', '/logs', '/help',
  ])
})

test('every theme provides interactive CSS variables', () => {
  for (const theme of themes) {
    const vars = getThemeCssVars(theme.id)
    for (const key of ['--accent', '--accent-hover', '--accent-soft', '--accent-ring']) {
      assert.ok(vars[key])
    }
  }
})
```

- [x] **Step 2: 运行 `npm test`，确认因模块/接口不存在而失败。**
- [x] **Step 3: 实现纯配置模块和主题变量生成函数。**
- [x] **Step 4: 运行 `npm test`，确认契约通过。**

### Task 2: 应用外壳与真实强调色

**Files:**
- Modify: `src/index.css`
- Modify: `src/components/layout/AppShell.tsx`
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/components/ThemeSwitcher.tsx`
- Modify: `src/components/ui/Button.tsx`
- Create: `src/theme/theme-context.ts`
- Create: `src/theme/useTheme.ts`
- Modify: `src/theme/ThemeContext.tsx`

**Interfaces:**
- Consumes: `NAV_ITEMS`, `getRouteMeta`, `getThemeCssVars`。
- Produces: 统一桌面/移动导航、路由标题、Escape 关闭、变量驱动按钮/高亮/焦点状态。

- [x] **Step 1: 先扩展导航测试，要求 `/features` 出现在共享配置且详情路由返回正确父模块标题；确认失败。**
- [x] **Step 2: 用共享配置替换两份导航数组并实现路由标题。**
- [x] **Step 3: 将主按钮、品牌标记、导航激活态、焦点环改为 CSS 变量；拆分主题 Context 以消除 Fast Refresh 警告。**
- [x] **Step 4: 添加菜单和图标按钮可访问名称、Escape 关闭和运行时年份。**
- [x] **Step 5: 运行 `npm test && npm run lint`，确认无失败与警告。**

### Task 3: Dashboard 响应式与信息层级

**Files:**
- Modify: `src/pages/Dashboard.tsx`
- Modify: `src/components/ui/Card.tsx`
- Modify: `src/index.css`

**Interfaces:**
- Consumes: `ApiDashboard`。
- Produces: Bento 指标布局、窄屏载荷卡片、局部表格滚动、无页面横向溢出。

- [x] **Step 1: 在 375×812 记录失败基线：`scrollWidth=498 > innerWidth=375`。**
- [x] **Step 2: 给 Grid 和 Card 边界增加 `min-w-0`，把 Dashboard 载荷表格改为 `sm` 以上显示、移动端显示摘要列表。**
- [x] **Step 3: 重排指标卡层级并修正后端启动提示端口为 8001。**
- [x] **Step 4: 在 375、768、1440 三档复测 `scrollWidth <= innerWidth`。**

### Task 4: 列表、详情与设置交互质量

**Files:**
- Modify: `src/pages/Payloads.tsx`
- Modify: `src/pages/PayloadDetail.tsx`
- Modify: `src/pages/Capture.tsx`
- Modify: `src/pages/Settings.tsx`
- Modify: `src/components/ui/Loading.tsx`
- Modify: `src/components/ui/EmptyState.tsx`

**Interfaces:**
- Consumes: 现有 `api` 方法，不改变请求结构。
- Produces: 明确的筛选状态、表单标签、保存状态、统一空/错/载入反馈。

- [x] **Step 1: 为筛选与视图按钮补 `aria-pressed`，为搜索和上传动作补稳定标签。**
- [x] **Step 2: 用 `<label htmlFor>` 关联设置输入；加入 `saving` 状态并阻止重复提交。**
- [x] **Step 3: 统一加载、空状态和错误状态的视觉/按钮尺寸。**
- [x] **Step 4: 用键盘走查菜单、筛选、详情标签和设置表单。**

### Task 5: 路由分包与遗留清理

**Files:**
- Modify: `src/App.tsx`
- Delete: `src/data/mock.ts`
- Delete: `src/pages/Tasks.tsx`
- Delete: `src/pages/Sessions.tsx`
- Delete: `src/pages/Upload.tsx`

**Interfaces:**
- Produces: 每页独立动态 chunk，入口仅包含外壳与路由框架。

- [x] **Step 1: 用 `React.lazy(() => import(...).then(...))` 加载页面，`Suspense` 使用 `PageLoading`。**
- [x] **Step 2: 删除确认无引用的 Mock/兼容占位文件。**
- [x] **Step 3: 运行构建并确认不再出现单块超过 500 kB 警告。**

### Task 6: 全量验证与交付

**Files:**
- Modify: `README.md`（仅在运行说明与实际不一致时）

**Interfaces:**
- Produces: 可复现的测试、构建、浏览器和后端验收证据。

- [x] **Step 1: 运行 `npm test`、`npm run lint`、`npm run build`。**
- [x] **Step 2: 运行 `backend/.venv/Scripts/python.exe -m pytest -q`。**
- [x] **Step 3: 浏览器检查首页、捕获、载荷、详情、设置在 375×812、768×1024、1440×900 的布局与交互。**
- [x] **Step 4: 检查浏览器控制台错误、所有路由可达、主题色真实变化。**
- [x] **Step 5: 汇总完成项、运行命令、访问地址和剩余非本轮范围。**
