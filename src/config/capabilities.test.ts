import assert from 'node:assert/strict'
import test from 'node:test'

import { PRODUCT_BOUNDARIES, V1_PROTOCOLS } from './capabilities.ts'

test('v1 capability copy exposes only implemented protocols and formats', () => {
  assert.deepEqual(V1_PROTOCOLS, ['HTTP', 'HTTPS', 'TLS', 'DNS', 'TCP', 'UDP'])
  assert.deepEqual(PRODUCT_BOUNDARIES.captureFormats, ['PCAP', 'CAP'])
  assert.equal(PRODUCT_BOUNDARIES.pcapng, false)
  assert.equal(PRODUCT_BOUNDARIES.authentication, false)
  assert.equal(PRODUCT_BOUNDARIES.parserEngine, 'Python 标准库 PCAP 引擎')
})
