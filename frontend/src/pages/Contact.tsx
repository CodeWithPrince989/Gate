import { useState, useRef } from 'react'
import type { FormEvent } from 'react'
import { ExternalLink, MessageCircleMore, Send } from 'lucide-react'
import SEO from '../components/SEO'
import PublicShell from '../components/PublicShell'
import emailjs from '@emailjs/browser'

interface User {
    id: number
    username: string
    email: string
}

interface Props {
    user: User | null
}

const initialForm = { name: '', email: '', message: '' }

const contactOptions = [
    {
        title: 'Product questions or bug reports',
        body: 'Use the form on this page to send feedback, corrections, or usability issues directly through the site.',
    },
    {
        title: 'Feature requests and roadmap ideas',
        body: 'Signed-in users can also use the in-app Feedback board to submit suggestions and vote on improvements.',
    },
    {
        title: 'Project updates and repository',
        body: 'For code context and release history, the public project repository is available on GitHub.',
    },
]

export default function Contact({ user }: Props) {
    const [form, setForm] = useState(initialForm)
    const [submitting, setSubmitting] = useState(false)
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')
    const formRef = useRef<HTMLFormElement>(null)

    const onSubmit = async (event: FormEvent) => {
        event.preventDefault()
        if (!form.message.trim() || submitting) return

        setSubmitting(true)
        setSuccess('')
        setError('')

        try {
            if (!formRef.current) return;
            await emailjs.sendForm(
                'service_wo6vi4x',
                'template_9ymhn58',
                formRef.current,
                '4IKEq1MPOxpHut2ra'
            )
            setSuccess('Message sent successfully!')
            setForm(initialForm)
        } catch (err) {
            console.error('EmailJS Error:', err)
            setError(err instanceof Error ? err.message : 'Unable to submit your message right now.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <PublicShell user={user}>
            <SEO
                title="Contact GateTracker — GATE CSE Study Tracker Support"
                description="Contact the GateTracker team for support, bug reports, feedback, feature requests, or questions about the free GATE CSE 2027 study tracker."
                path="/contact"
                keywords="contact GateTracker, GATE tracker support, GATE study tracker feedback"
            />

            <section className="feedback-hero-panel">
                <div>
                    <p className="section-label mb-3">Contact Us</p>
                    <h1 className="page-header-title flex items-center gap-3">
                        <MessageCircleMore size={30} className="text-cyan-400" />
                        Reach the GateTracker team
                    </h1>
                    <p className="mt-3 max-w-3xl text-[14px] leading-7 opacity-70">
                        Questions, content corrections, feature ideas, and bug reports are welcome. The fastest way to
                        reach the project is through the message form below.
                    </p>
                </div>
                <a
                    href="https://github.com/Satya37x1112/GATE_Tracker"
                    target="_blank"
                    rel="noreferrer"
                    className="feedback-callout transition-colors hover:border-white/[.14] hover:bg-white/[.06]"
                >
                    <ExternalLink size={18} className="text-emerald-300" />
                    <div>
                        <p className="text-[13px] font-medium">View the project on GitHub</p>
                        <p className="mt-1 text-[12px] opacity-45">Browse the repository and follow public development.</p>
                    </div>
                </a>
            </section>

            <section className="mt-6 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
                <article className="glass-panel p-6">
                    <div className="mb-5">
                        <h2 className="text-[24px] font-semibold tracking-tight">Send a message</h2>
                        <p className="mt-2 text-[13px] opacity-55">Share enough detail for us to understand the issue or idea clearly.</p>
                    </div>

                    {success && <div className="feedback-alert feedback-alert-success">{success}</div>}
                    {error && <div className="feedback-alert feedback-alert-error">{error}</div>}

                    <form ref={formRef} onSubmit={onSubmit} className="mt-4 space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <label className="block">
                                <span className="mb-2 block text-[13px] opacity-70">Name <span className="opacity-35">(optional)</span></span>
                                <input
                                    name="name"
                                    className="form-input"
                                    value={form.name}
                                    onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Your name"
                                />
                            </label>
                            <label className="block">
                                <span className="mb-2 block text-[13px] opacity-70">Email <span className="opacity-35">(optional)</span></span>
                                <input
                                    type="email"
                                    name="email"
                                    className="form-input"
                                    value={form.email}
                                    onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="you@example.com"
                                />
                            </label>
                        </div>

                        <label className="block">
                            <span className="mb-2 block text-[13px] opacity-70">Message</span>
                            <textarea
                                name="message"
                                className="form-input min-h-[180px] resize-y"
                                value={form.message}
                                onChange={e => setForm(prev => ({ ...prev, message: e.target.value }))}
                                placeholder="Tell us what you noticed, what should change, or how we can help."
                            />
                        </label>

                        <div className="flex flex-wrap items-center gap-3">
                            <button type="submit" disabled={submitting || !form.message.trim()} className="feedback-submit-btn">
                                <Send size={14} />
                                {submitting ? 'Sending...' : 'Send Message'}
                            </button>
                            <p className="text-[12px] opacity-35">Optional contact details help if a follow-up is needed.</p>
                        </div>
                    </form>
                </article>

                <article className="glass-panel p-6">
                    <p className="section-label mb-3">Best Routes</p>
                    <h2 className="text-[24px] font-semibold tracking-tight">How to contact us effectively</h2>
                    <div className="mt-5 space-y-4">
                        {contactOptions.map(item => (
                            <div key={item.title} className="rounded-2xl border border-white/[.08] bg-white/[.03] p-4 hover-lift">
                                <h3 className="text-[15px] font-semibold">{item.title}</h3>
                                <p className="mt-2 text-[13px] leading-6 opacity-65">{item.body}</p>
                            </div>
                        ))}
                    </div>
                </article>
            </section>
        </PublicShell>
    )
}
