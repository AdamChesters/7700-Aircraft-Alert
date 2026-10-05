import { useEffect, useRef, useState } from 'react'
import { Send, X } from 'lucide-react'
import appIcon from '../assets/icon.png'
import githubMark from '../assets/donations/github.svg'
import coffeeMark from '../assets/donations/buymeacoffee.svg'
import paypalMark from '../assets/donations/paypal.svg'
import { bridge } from '../services/bridge.js'
import './SupportDialog.css'

const PAYPAL = "https://www.paypal.com/donate/?business=KLHSZPXTSVSAU&no_recurring=0&item_name=I%27ve+donated+to+lots+of+small+creators+for+their+useful+little+tools%2C+now+I+create+them.+Dig+one?+I%27d+love+your+support.&currency_code=AUD"

export default function SupportDialog({ onClose, version, updateStatus, updateBusy, updateAvailable, onUpdate }) {
  const dialog = useRef(null)
  const [feedback, setFeedback] = useState(false)
  const [contact] = useState(() => {
    try { return JSON.parse(localStorage.getItem('7700-feedback-contact-v1')) || {} } catch { return {} }
  })
  const [name, setName] = useState(contact.name || '')
  const [email, setEmail] = useState(contact.email || '')
  const [message, setMessage] = useState('')
  const [result, setResult] = useState('')
  const [sending, setSending] = useState(false)
  const valid = name.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && message.trim()

  useEffect(() => {
    const previous = document.activeElement
    dialog.current.showModal()
    return () => { dialog.current?.close(); previous?.focus() }
  }, [])

  async function visit(url) {
    setResult('')
    try { await bridge.openExternal(url) } catch { setResult('Could not open the link. Please try again.') }
  }

  async function send(event) {
    event.preventDefault()
    if (!valid || sending) return
    setSending(true)
    setResult('')
    try {
      const response = await bridge.sendFeedback({ name: name.trim(), email: email.trim(), message: message.trim() })
      if (!response.ok) throw new Error(response.error || 'Could not send feedback. Please try again.')
      try { localStorage.setItem('7700-feedback-contact-v1', JSON.stringify({ name: name.trim(), email: email.trim() })) } catch {}
      setMessage('')
      setResult('Thanks! Your feedback has been sent.')
    } catch (error) { setResult(error.message || 'Could not send feedback. Please try again.') }
    finally { setSending(false) }
  }

  return <dialog ref={dialog} className={`support-modal ${feedback ? 'feedback-modal' : ''}`} aria-labelledby="support-title"
    onCancel={event => { if (sending) event.preventDefault(); else onClose() }}>
    <div className="support-modal-header"><h2 id="support-title">{feedback ? 'Feedback / feature request' : 'About 7700 Aircraft Alert / Donate'}</h2>
      <button className="support-close" aria-label="Close dialog" disabled={sending} onClick={onClose}><X size={20} /></button></div>
    {feedback ? <>
      <p className="support-hint">Have an idea or found a problem? Send it to the 7700 Aircraft Alert team.</p>
      <form onSubmit={send}>
        <fieldset disabled={sending} className="feedback-fields"><div className="feedback-contact">
          <label>Name<input autoFocus name="name" autoComplete="name" required maxLength={100} value={name} onChange={event => setName(event.target.value)} /></label>
          <label>Email<input name="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} /></label>
        </div><p className="support-hint">Your name and email are remembered on this device after sending.</p>
        <label>Message<textarea name="message" required maxLength={4000} rows={5} placeholder="What would you like to improve?" value={message} onChange={event => setMessage(event.target.value)} /></label></fieldset>
        <p className="support-hint">Only these fields, the app name and app version are sent. No aircraft data or logs are attached.</p>
        <p className="support-message" role="status">{result}</p>
        <div className="support-form-actions"><button type="button" disabled={sending} onClick={() => { setFeedback(false); setResult('') }}>Back</button>
          <button type="submit" className="support-primary" disabled={!valid || sending}><Send size={16} />{sending ? 'Sending...' : 'Send feedback'}</button></div>
      </form>
    </> : <div className="support-dialog">
      <header><img className="support-logo" src={appIcon} alt="7700 Aircraft Alert" /><h3>7700 Aircraft Alert</h3>
        <p className="support-version-row" role="status"><strong>Version {version}</strong><span>{updateStatus}</span></p>
        <div className="support-actions"><button className="support-discord" onClick={() => visit('https://discord.gg/fs4WyaQPA')}>Join the Discord</button>
          <button disabled={updateBusy} onClick={onUpdate}>{updateAvailable ? `Download ${updateAvailable}` : 'Check for updates'}</button>
          <button onClick={() => { setFeedback(true); setResult('') }}>Feedback</button></div>
      </header>
      <div className="support-intro"><p>Thanks for using 7700 Aircraft Alert. Feedback is always welcome. The quickest way to get my attention is the Feedback button above. You can also open an issue on GitHub or join the Discord.</p>
        <p>In the meantime, I have a variety of other fun software projects. Check out: <a href="https://github.com/AdamChesters" onClick={event => { event.preventDefault(); visit(event.currentTarget.href) }}>GitHub</a><span aria-hidden="true"> | </span><a href="https://adamch.com" onClick={event => { event.preventDefault(); visit(event.currentTarget.href) }}>AdamCh.com</a></p></div>
      <section aria-label="Donate" className="support-donations"><h3>Donate</h3><p>I love making things. Anything I've ever built has been to have fun, share fun, and make life a bit easier. If you got value from one of these things, and you'd like to chuck us a coffee, a bottle, or a god damned Ferrari, go your hardest. Then hustle over to discord to claim your supporter role!</p>
        <div className="support-buttons">
          <div className="donation-option"><button className="donation-button github-button" onClick={() => visit('https://github.com/sponsors/AdamChesters')}><img src={githubMark} alt="" /><span>GitHub Sponsors</span></button><div className="donation-notes"><span>Account required</span><span title="GitHub personal-account sponsorships have no platform fees">0% fees to creator</span></div></div>
          <div className="donation-option"><button className="donation-button coffee-button" onClick={() => visit('https://buymeacoffee.com/adamch')}><img src={coffeeMark} alt="" /><span>Buy Me a Coffee</span></button><div className="donation-notes"><span>Guest checkout available</span></div></div>
          <div className="donation-option"><button className="donation-button paypal-button" onClick={() => visit(PAYPAL)}><span className="paypal-mark" style={{ '--paypal-mark': `url("${paypalMark}")` }} aria-hidden="true" /><span>Donate with <strong className="paypal-wordmark">Pay<span>Pal</span></strong></span></button><div className="donation-notes"><span>Guest checkout available</span><span>Least preferred option</span></div></div>
        </div>
      </section><p className="support-message" role="status">{result}</p>
    </div>}
  </dialog>
}
