const { test } = require('node:test')
const assert = require('node:assert/strict')
const { feedbackPayload, sendFeedback } = require('../electron/feedback')
const fields = { name: ' Test ', email: 'test@example.invalid', message: ' Test feedback ' }

test('feedback identifies the app and trusted version and excludes unrelated fields', () => {
  assert.deepEqual(feedbackPayload({ ...fields, app: 'other', version: 'other', aircraft: ['secret'] }, '1.1.0'), {
    app: '7700-Aircraft-Alert', name: 'Test', email: 'test@example.invalid', message: 'Test feedback', version: '1.1.0',
  })
})
test('invalid, blank and oversized fields never make a request', async () => {
  for (const input of [null, { ...fields, name: ' ' }, { ...fields, email: 'invalid' }, { ...fields, message: 'x'.repeat(4001) }]) {
    let calls = 0
    const result = await sendFeedback(input, '1.1.0', 'https://example.invalid', () => { calls++; throw new Error('must not send') })
    assert.equal(result.ok, false)
    assert.equal(calls, 0)
  }
})
test('submission sends only validated app, version and contact/message fields', async () => {
  let captured
  const result = await sendFeedback(fields, '1.1.0', 'https://example.invalid/feedback', async (url, options) => {
    captured = { url, options }; return { ok: true, json: async () => ({ ok: true }) }
  })
  assert.equal(result.ok, true)
  assert.equal(captured.options.method, 'POST')
  assert.deepEqual(JSON.parse(captured.options.body), feedbackPayload(fields, '1.1.0'))
})
test('HTTP and connection failures report failure without leaking request details', async () => {
  for (const request of [async () => ({ ok: false }), async () => ({ ok: true, json: async () => ({ ok: false }) }), async () => ({ ok: true, json: async () => ({}) }), async () => { throw new Error('secret transport detail') }]) {
    assert.deepEqual(await sendFeedback(fields, '1.1.0', 'https://example.invalid', request), {
      ok: false, error: 'Could not send feedback. Please try again, or use Discord.',
    })
  }
})
