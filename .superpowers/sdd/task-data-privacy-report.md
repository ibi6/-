# FitAI V1 本地数据清除、退出隔离与中文设置收敛报告

## 结果

- 新增集中式本地数据管理模块，显式列出 7 个活动数据 key 与 13 个 FitAI 全量 key。
- `clearActivityData` 清除训练、饮食、身体、AI 对话及对应 Mock 数据，同时保留 auth、user、settings、Mock profile/token 与范围外 key。
- `clearLocalData` 重置 auth、user、workout、nutrition、health、chat、subscription、settings 和 Mock auth 内存状态，再删除全部 13 个账号相关 key；范围外 key 不受影响。
- 两条清除路径都等待 Zustand 持久化重置完成后再精确 `multiRemove`，避免空初始状态重新写回已删除 key。
- 设置页只展示“简体中文 / 公制 / 浅色界面”，提供本机存储、不可恢复、无真实云同步说明，以及活动数据清除二次确认、执行中禁用、中文成功/失败反馈。
- 个人页改为“退出并清除本机数据”，先调用 Mock 退出，再完全清除并回登录页；执行中禁用并显示中文进度，失败时不跳转、不报告成功。

## 精确 storage key 清单

活动清除允许删除：

1. `fitai-workout`
2. `fitai-nutrition`
3. `fitai-health`
4. `fitai-chat`
5. `fitai-mock-workout-sessions`
6. `fitai-mock-meals`
7. `fitai-mock-measurements`

完全清除额外允许删除：

8. `fitai-auth`
9. `fitai-user`
10. `fitai-settings`
11. `fitai-subscription`
12. `fitai-mock-profile`
13. `fitai-mock-token`

生产实现没有使用 `startsWith`、`getAllKeys` 或 `AsyncStorage.clear()`。

## TDD 记录

### 初始检查

接手时已有 4 条测试和部分实现。首次运行聚焦测试为 4/4 PASS，说明现有测试没有覆盖简报要求的完整删除语义，因此先扩充行为断言再继续生产实现。

### RED

命令：

```text
npm test -- --runInBand src/stores/__tests__/localData.test.ts
```

结果：1 suite failed，4 tests failed。失败原因均符合预期：

- 精确 key 清单没有导出。
- 活动清除后 4 个 Zustand key 与 3 个 Mock key 被空状态重新写回，而不是删除。
- 完全清除后 8 个 Zustand key 被空状态重新写回，而不是删除。
- `multiRemove` 失败没有被测试路径触发，因此异常断言失败。

### GREEN

最小修复：导出只读精确 key 清单；先等待内存 Store 重置及其持久化写入，再直接对明确白名单调用 `multiRemove`；不捕获存储异常，让调用方收到失败。

聚焦结果：1 suite passed，4 tests passed。

覆盖行为：

- 精确白名单选择且不删除未知 FitAI key 或其他 App key。
- 活动清除保留登录、资料、设置并重置活动 Store。
- 完全清除重置所有账号敏感 Store 与设置。
- 两种范围对应的 storage key 最终均为 `null`。
- `multiRemove` 异常向调用方抛出。

## 验证

- `npm test -- --runInBand src/stores/__tests__/localData.test.ts`：PASS，1 suite / 4 tests。
- `npm run typecheck`：PASS，0 errors。
- `npm run lint`：PASS，0 warnings / 0 errors。
- `npm test -- --runInBand`：PASS，15 suites / 70 tests / 0 snapshots。

## 自审

- 数据边界：活动清除不包含 `fitai-auth`、`fitai-user`、`fitai-settings`、`fitai-subscription`、Mock profile/token；完全清除包含全部账号敏感 key。
- 隔离：完全清除同步重置当前内存 Store，防止旧账号数据在换账号后继续显示或再次持久化。
- 失败语义：原始 `AsyncStorage.multiRemove` 异常直接抛出；两个 UI 调用方都显示失败反馈，不执行成功跳转。
- 交互：两条路径都有二次确认；设置按钮通过 `loading` 自动禁用，退出菜单通过 `loggingOut` 禁用并防重入。
- 中文收敛：设置页不再提供 English、英制或深色模式选择，也没有数据导出占位按钮。
- 工作区保护：没有改动或暂存范围外 `ai.ts`、`aiActions.test.ts` 等并发文件；提交时仅选择本任务文件及相关 hunk。

## Concerns

- 本次未做真机端手动点击验证；交互由类型检查、Lint 和现有 Jest 全量回归保障。
- 工作区仍有大量其他任务的未提交改动，已保持原样并从本任务提交中排除。
