import assert from 'node:assert/strict'
import test from 'node:test'

import { api, ApiError } from './api.ts'

test('API module loads outside the Vite runtime', async () => {
  const module = await import('./api.ts')

  assert.equal(typeof module.api.health, 'function')
})

test('surfaces FastAPI validation messages without dumping JSON', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ detail: [{ msg: 'Input should be greater than 0' }] }), {
      status: 422,
      headers: { 'content-type': 'application/json' },
    })

  try {
    await assert.rejects(api.health(), (error: unknown) => {
      assert.ok(error instanceof ApiError)
      assert.equal(error.status, 422)
      assert.equal(error.message, 'Input should be greater than 0')
      return true
    })
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('omits blank search parameters', async () => {
  const originalFetch = globalThis.fetch
  let requested = ''
  globalThis.fetch = async (input) => {
    requested = String(input)
    return Response.json([])
  }

  try {
    await api.tasks({ q: '   ' })
    assert.equal(requested, '/api/v1/tasks')
  } finally {
    globalThis.fetch = originalFetch
  }
})
