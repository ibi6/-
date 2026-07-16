# PayloadX Second-Pass UI Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the application shell and highest-impact pages with PayloadX's teal network-forensics brand while improving mobile information density.

**Architecture:** Keep API models and routes unchanged. Introduce two focused shell components for brand identity and grouped navigation, extend existing theme helpers with an explicit default, and refine page markup through responsive Tailwind classes. Visual behavior remains dependency-free and uses existing React, Lucide, and Tailwind primitives.

**Tech Stack:** React 19, TypeScript 6, Tailwind CSS 4, Lucide React, Node test runner, Vite 8

## Global Constraints

- Preserve all existing routes, API contracts, upload behavior, and saved user theme choices.
- Use deep teal as the new-session default without removing other accent themes.
- Do not add frontend dependencies.
- Keep interactive targets at least 44px high and preserve semantic labels.
- Keep the document width equal to the viewport at 375px.
- Do not display controls that imply unavailable notification or authentication behavior.

---

### Task 1: Make the brand theme the explicit default

**Files:**
- Modify: `src/theme/themes.ts`
- Modify: `src/theme/themes.test.ts`
- Modify: `src/index.css`

**Interfaces:**
- Produces: `DEFAULT_THEME_ID: ThemeId` with value `cyan`.
- Produces: `loadStoredTheme(): ThemeId` that returns a valid stored theme or `DEFAULT_THEME_ID`.
- Consumes: existing `ThemeProvider` without signature changes.

- [ ] **Step 1: Add a failing default-theme test**

```ts
import { DEFAULT_THEME_ID, getThemeCssVars, loadStoredTheme, themes } from './themes.ts'

test('new sessions use the PayloadX brand theme', () => {
  assert.equal(DEFAULT_THEME_ID, 'cyan')
  assert.equal(loadStoredTheme(), 'cyan')
})
```

- [ ] **Step 2: Run the theme tests and confirm the new assertion fails**

Run: `node --test --experimental-strip-types src/theme/themes.test.ts`

Expected: failure because `DEFAULT_THEME_ID` is not exported and the current fallback is `blue`.

- [ ] **Step 3: Implement the explicit default and brand palette**

```ts
export const DEFAULT_THEME_ID: ThemeId = 'cyan'

export function getTheme(id: ThemeId): ThemeDef {
  return themes.find((theme) => theme.id === id) ?? themes.find((theme) => theme.id === DEFAULT_THEME_ID)!
}

export function loadStoredTheme(): ThemeId {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY) as ThemeId | null
    if (raw && themes.some((theme) => theme.id === raw)) return raw
  } catch {
    /* Storage can be unavailable during SSR and tests. */
  }
  return DEFAULT_THEME_ID
}
```

Set the cyan theme name to `深海青`, description to `PayloadX 品牌色`, and its accent tokens to `#14b8a6`, `#5eead4`, `#0f766e`, and `#0d9488`. Mirror those values in the initial `:root` tokens in `src/index.css`.

- [ ] **Step 4: Run theme tests**

Run: `node --test --experimental-strip-types src/theme/themes.test.ts`

Expected: all theme completeness, contrast, and default-theme tests pass.

### Task 2: Rebuild the application shell identity

**Files:**
- Create: `src/components/BrandMark.tsx`
- Create: `src/components/layout/SidebarNavigation.tsx`
- Modify: `src/config/navigation.ts`
- Modify: `src/config/navigation.test.ts`
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/components/layout/AppShell.tsx`
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/index.css`

**Interfaces:**
- Produces: `BrandMark({ className?: string }): ReactElement`.
- Produces: `SidebarNavigation({ onNavigate?: () => void }): ReactElement`.
- Produces: `NAV_GROUPS: Array<{ label: string; items: NavItem[] }>`.
- Consumes: existing `NAV_ITEMS`, `NavLink`, and `getRouteMeta()`.

- [ ] **Step 1: Add a failing navigation-group coverage test**

```ts
import { NAV_GROUPS, NAV_ITEMS, getRouteMeta } from './navigation.ts'

test('navigation groups cover every module exactly once', () => {
  assert.deepEqual(
    NAV_GROUPS.flatMap((group) => group.items.map((item) => item.to)),
    NAV_ITEMS.map((item) => item.to),
  )
})
```

- [ ] **Step 2: Run the navigation test and confirm it fails**

Run: `node --test --experimental-strip-types src/config/navigation.test.ts`

Expected: failure because `NAV_GROUPS` is not exported.

- [ ] **Step 3: Add explicit navigation groups**

```ts
export const NAV_GROUPS = [
  { label: '调查工作区', items: NAV_ITEMS.slice(0, 7) },
  { label: '系统与支持', items: NAV_ITEMS.slice(7) },
] as const
```

- [ ] **Step 4: Create the shared brand mark and grouped navigation**

`BrandMark` renders a 40px rounded brand tile containing Lucide `ScanLine` plus a small status dot. `SidebarNavigation` maps `NAV_GROUPS`, renders each label once, and preserves the existing active-route classes and `onNavigate` callback.

- [ ] **Step 5: Replace duplicated desktop/mobile navigation**

Use `BrandMark` and `SidebarNavigation` in both `Sidebar` and the mobile drawer. Display `PayloadX` with `NETWORK FORENSICS`, add a compact version label, and retain the parser status panel.

- [ ] **Step 6: Remove misleading header controls**

Remove the notification button and `admin` avatar. Keep the forensic clock, theme switcher, and upload action. Add a non-interactive local-mode pill with `ShieldCheck` and the text `本地模式`.

- [ ] **Step 7: Refine shell surfaces**

Update `sidebar-shell`, `nav-active`, `card-surface`, and header styles in `src/index.css`; add a subtle sidebar grid/glow, a teal active rail, more restrained card shadows, and a `chip-scroll` utility that hides only the internal scrollbar.

- [ ] **Step 8: Run navigation and theme tests**

Run: `npm test`

Expected: all tests pass, including exact group coverage.

### Task 3: Increase dashboard information density

**Files:**
- Modify: `src/pages/Dashboard.tsx`

**Interfaces:**
- Consumes: unchanged `ApiDashboard`.
- Produces: the same links and semantic headings with a denser responsive metric grid.

- [ ] **Step 1: Replace identity-dependent copy**

Set the page title to `调查工作台` and the subtitle to `监看解析引擎、协议分布与风险载荷的实时状态`.

- [ ] **Step 2: Change the mobile metric layout**

Use `grid-cols-2`; keep the first metric `col-span-2`; render the remaining four metrics as two columns below it. Preserve the existing six-column desktop mapping.

- [ ] **Step 3: Tighten metric presentation**

Use responsive padding (`p-4 sm:p-5`), smaller mobile icons, tabular numeric values, and a minimum height that keeps two-column cards aligned without truncating `运行中`.

- [ ] **Step 4: Verify dashboard semantics**

At 375px, confirm the main heading is `调查工作台`, five metric labels remain present, and the document has no horizontal overflow.

### Task 4: Enrich the capture workflow

**Files:**
- Modify: `src/pages/Capture.tsx`

**Interfaces:**
- Consumes: existing `ApiTask` fields `packet_count`, `session_count`, and `payload_count`.
- Produces: unchanged upload and task navigation behavior.

- [ ] **Step 1: Refine the upload drop zone**

Use `py-10 sm:py-14`, a subtle accent gradient, and add three truthful capability labels: `本地处理`, `流式上传`, and `文件校验`.

- [ ] **Step 2: Add task evidence metrics**

Under every recent task, render a three-column strip showing packet, session, and payload counts with tabular numbers. Keep protocol badges and progress indicators unchanged.

- [ ] **Step 3: Verify responsive capture layout**

At 375px, confirm the upload CTA remains 44px high, the task metrics fit without horizontal scrolling, and the page reaches recent tasks sooner than before.

### Task 5: Compact the payload filter workspace

**Files:**
- Modify: `src/pages/Payloads.tsx`

**Interfaces:**
- Consumes: unchanged payload type, query, and view state.
- Produces: the same filter behavior and table/card views.

- [ ] **Step 1: Add view icons and labels**

Import `LayoutGrid` and `Table2`. Keep `表格` and `卡片` text for accessible names and visual clarity.

- [ ] **Step 2: Separate search, view mode, and type filters**

On mobile, render a compact `载荷类型` label with the view toggle, followed by a single horizontally scrollable row of type chips. On desktop, keep all controls in one horizontal toolbar when space allows.

- [ ] **Step 3: Preserve page width**

Apply `min-w-0`, `shrink-0`, and `chip-scroll overflow-x-auto` only to the filter row. Do not allow the document itself to exceed 375px.

- [ ] **Step 4: Verify filter semantics**

Confirm every type button retains `aria-pressed`, the view group retains `aria-label="载荷显示方式"`, and card view remains the initial mobile mode.

### Task 6: Full verification and delivery

**Files:**
- Test: `src/theme/themes.test.ts`
- Test: `src/config/navigation.test.ts`
- Test: all modified frontend files

**Interfaces:**
- Produces: a verified branch `codex/ui-overall-optimization`.

- [ ] **Step 1: Run automated verification**

Run: `npm test`, `npm run lint`, `npm run build`, `backend/.venv/Scripts/python.exe -m pytest -q`, `backend/.venv/Scripts/python.exe -m ruff check backend`, and `git diff --check`.

Expected: all frontend tests and 11 backend tests pass; lint, build, Ruff, and diff checks exit `0`.

- [ ] **Step 2: Run desktop visual regression**

At 1440 × 900 inspect `/`, `/capture`, `/payloads`, and `/settings`. Confirm shell identity, teal defaults, task metrics, filter layout, and no clipping.

- [ ] **Step 3: Run mobile visual regression**

At 375 × 812 inspect `/`, `/capture`, and `/payloads`. Confirm document `scrollWidth === clientWidth`, the dashboard 2-column metrics, and the single-row payload type scroller.

- [ ] **Step 4: Commit and push**

Create focused Conventional Commits for theme/shell and page refinements, then push the current branch without force.
