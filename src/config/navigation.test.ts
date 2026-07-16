import assert from 'node:assert/strict'
import test from 'node:test'
import { NAV_GROUPS, NAV_ITEMS, getRouteMeta } from './navigation.ts'

test('desktop and mobile navigation share all product modules', () => {
  assert.deepEqual(
    NAV_ITEMS.map((item) => item.to),
    [
      '/',
      '/capture',
      '/payloads',
      '/protocols',
      '/stats',
      '/features',
      '/alerts',
      '/settings',
      '/logs',
      '/help',
    ],
  )
})

test('navigation groups cover every module exactly once', () => {
  assert.deepEqual(
    NAV_GROUPS.flatMap((group) => group.items.map((item) => item.to)),
    NAV_ITEMS.map((item) => item.to),
  )
})

test('detail routes resolve to useful contextual titles', () => {
  assert.equal(getRouteMeta('/payloads/42').title, '载荷详情')
  assert.equal(getRouteMeta('/tasks/8').title, '任务详情')
  assert.equal(getRouteMeta('/unknown').title, '页面未找到')
})
