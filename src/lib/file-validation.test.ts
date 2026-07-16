import assert from 'node:assert/strict'
import test from 'node:test'
import { validateCaptureFile } from './file-validation.ts'

test('accepts non-empty classic PCAP files within the configured limit', () => {
  assert.deepEqual(validateCaptureFile({ name: 'sample.PCAP', size: 1024 }), { valid: true })
  assert.deepEqual(validateCaptureFile({ name: 'sample.cap', size: 1024 }), { valid: true })
})

test('returns actionable errors for empty, oversized, unsupported and PCAPNG files', () => {
  assert.equal(validateCaptureFile({ name: 'empty.pcap', size: 0 }).valid, false)
  assert.match(validateCaptureFile({ name: 'large.pcap', size: 513 * 1024 * 1024 }).message, /512 MB/)
  assert.match(validateCaptureFile({ name: 'capture.pcapng', size: 1024 }).message, /转换/)
  assert.match(validateCaptureFile({ name: 'notes.txt', size: 1024 }).message, /\.pcap/)
})
