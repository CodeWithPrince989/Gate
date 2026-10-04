import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Lightbulb, MessageCircleMore, Send, ThumbsUp } from 'lucide-react'
import SEO from '../components/SEO'
import { fetchFeedback, submitFeedback, upvoteFeedback, type FeedbackItem } from '../api/api'

const initialForm = { name: '', email: '', message: '' }

export default function Feedback() {
    const [form, setForm] = useState(initialForm)
    const [items, setItems] = useState<FeedbackItem[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')
    const [upvotingId, setUpvotingId] = useState<number | null>(null)

    useEffect(() => {
        fetchFeedback()
            .then(setItems)
            .catch(err => {
                const message = err instanceof Error ? err.message : 'Failed to load feedback'
                setError(message)
            })
            .finally(() => setLoading(false))
    }, [])

    const onSubmit = async (e: FormEvent) => {
        e.preventDefault()
        if (!form.message.trim() || submitting) return

        setSubmitting(true)
        setError('')
        setSuccess('')
        try {
            const response = await submitFeedback(form)
            setItems(prev => [response.feedback, ...prev].slice(0, 12))
            setForm(initialForm)
            setSuccess(response.message)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to submit feedback')
        } finally {
            setSubmitting(false)
        }
    }

    const handleUpvote = async (id: number) => {
        if (upvotingId) return
        setUpvotingId(id)
        setError('')
        try {
            const data = await upvoteFeedback(id)
            setItems(prev => prev.map(item => item.id === id ? { ...item, upvotes: data.upvotes } : item))
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to upvote right now')
        } finally {
            setUpvotingId(null)
        }
    }

    return (
        <div className="space-y-8">
            <SEO
                title="Community Feedback — Help Improve GateTracker"
                description="Share suggestions, report issues, and pitch ideas to improve GateTracker — the free GATE CSE 2027 study tracker. Vote on community ideas and shape the roadmap."
                path="/feedback"
                keywords="GateTracker feedback, GATE tracker suggestions, GATE study tool improvement"
            />

            <section className="feedback-hero-panel">
                <div>
                    <p className="section-label mb-3">Community Feedback</p>
                    <h1 className="page-header-title flex items-center gap-3">
                        <MessageCircleMore size={30} className="text-cyan-400" />
                        Help shape GateTracker
                    </h1>
                    <p className="text-[14px] opacity-60 mt-3 max-w-2xl">
                        Share suggestions, report issues, or pitch ideas that would make the platform more useful for everyone.
                    </p>
                </div>
                <div className="feedback-callout">
                    <Lightbulb size={18} className="text-amber-300" />
                    <div>
                        <p className="text-[13px] font-medium">Community-driven roadmap</p>
                        <p className="text-[12px] opacity-45 mt-1">Good ideas here can turn into the next release.</p>
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-5">
                <section className="glass-panel p-5 md:p-6">
                    <div className="mb-5">
                        <h2 className="text-[22px] font-semibold tracking-tight">Community Feedback</h2>
                        <p className="text-[13px] opacity-35 mt-1">Suggestions, bug reports, and improvement ideas are all welcome.</p>
                    </div>

                    {success && <div className="feedback-alert feedback-alert-success">{success}</div>}
                    {error && <div className="feedback-alert feedback-alert-error">{error}</div>}

                    <form onSubmit={onSubmit} className="space-y-4 mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className="block">
                                <span className="text-[13px] opacity-70 block mb-2">Name <span className="opacity-35">(optional)</span></span>
                                <input
                                    className="form-input"
                                    value={form.name}
                                    onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Your name"
                                />
                            </label>
                            <label className="block">
                                <span className="text-[13px] opacity-70 block mb-2">Email <span className="opacity-35">(optional)</span></span>
                                <input
                                    type="email"
                                    className="form-input"
                                    value={form.email}
                                    onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="you@example.com"
                                />
                            </label>
                        </div>

                        <label className="block">
                            <span className="text-[13px] opacity-70 block mb-2">Feedback message</span>
                            <textarea
                                className="form-input min-h-[180px] resize-y"
                                value={form.message}
                                onChange={e => setForm(prev => ({ ...prev, message: e.target.value }))}
                                placeholder="Tell us what should be improved, fixed, or added next..."
                            />
                        </label>

                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                type="submit"
                                disabled={submitting || !form.message.trim()}
                                className="feedback-submit-btn"
                            >
                                <Send size={14} />
                                {submitting ? 'Submitting...' : 'Submit Feedback'}
                            </button>
                            <p className="text-[12px] opacity-35">Optional contact info helps if we need clarification.</p>
                        </div>
                    </form>
                </section>

                <section className="glass-panel p-5 md:p-6">
                    <div className="flex items-center justify-between gap-3 mb-5">
                        <div>
                            <p className="section-label mb-1">Community Board</p>
                            <h2 className="text-[22px] font-semibold tracking-tight">Recent Ideas</h2>
                        </div>
                        <span className="text-[11px] opacity-25 uppercase tracking-[0.18em]">Live</span>
                    </div>

                    {loading ? (
                        <div className="text-[13px] opacity-35">Loading feedback...</div>
                    ) : items.length > 0 ? (
                        <div className="space-y-3">
                            {items.map(item => (
                                <article key={item.id} className="feedback-card">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-[14px] font-medium">{item.name}</p>
                                            <p className="text-[11px] opacity-30 mt-1">{formatFeedbackTime(item.created_at)}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => void handleUpvote(item.id)}
                                            disabled={upvotingId === item.id}
                                            className="feedback-like-chip"
                                        >
                                            <ThumbsUp size={13} />
                                            {item.upvotes}
                                        </button>
                                    </div>
                                    <p className="text-[13px] leading-relaxed opacity-75 mt-3 whitespace-pre-wrap">{item.message}</p>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="border border-dashed border-white/[.08] rounded-2xl p-6 text-[13px] opacity-35">
                            No feedback yet. Be the first to suggest an improvement.
                        </div>
                    )}
                </section>
            </div>
        </div>
    )
}

function formatFeedbackTime(value: string) {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'Just now'
    return new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(date)
}
