// Only the public feedback relay URL belongs in the application. Webhook secrets stay on the server.
const FEEDBACK_ENDPOINT = 'https://adamch-app-feedback.adam-chesters.workers.dev/feedback'
const APP_ID = '7700-Aircraft-Alert'

function feedbackPayload(fields, version) {
  if (!fields || typeof fields !== 'object') throw new Error('Please fill in your name, email and message.')
  const limits = { name: 100, email: 254, message: 4000 }
  const clean = {}
  for (const [key, limit] of Object.entries(limits)) {
    if (typeof fields[key] !== 'string' || !fields[key].trim() || fields[key].trim().length > limit) {
      throw new Error(`Please check your ${key}.`)
    }
    clean[key] = fields[key].trim()
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.email)) throw new Error('Please enter a valid email address.')
  return { app: APP_ID, ...clean, version }
}

async function sendFeedback(fields, version, endpoint = FEEDBACK_ENDPOINT, request = fetch) {
  let payload
  try { payload = feedbackPayload(fields, version) } catch (error) { return { ok: false, error: error.message } }
  if (!endpoint) return { ok: false, error: 'Feedback delivery is not configured yet. Please use Discord for now.' }
  try {
    const response = await request(endpoint, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    })
    if (!response.ok) throw new Error('delivery failed')
    const result = await response.json()
    if (result?.ok !== true) throw new Error('delivery not confirmed')
    return { ok: true }
  } catch { return { ok: false, error: 'Could not send feedback. Please try again, or use Discord.' } }
}

module.exports = { feedbackPayload, sendFeedback }
