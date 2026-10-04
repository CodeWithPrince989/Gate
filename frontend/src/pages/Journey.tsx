import { useEffect, useState } from 'react'
import { Plus, Video, Trash2 } from 'lucide-react'
import SEO from '../components/SEO'
import PublicShell from '../components/PublicShell'
import { API_BASE, fetchWithCsrf } from '../api/api'

interface User {
    id: number
    username: string
    email: string
}

interface Vlog {
    id: number
    title: string
    content: string
    date: string
    youtube_url: string | null
    author: string
    created_at: string
}

interface Props {
    user?: User | null
}

export default function Journey({ user }: Props) {
    const [vlogs, setVlogs] = useState<Vlog[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    // Form state
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [youtubeUrl, setYoutubeUrl] = useState('')
    const [error, setError] = useState('')

    useEffect(() => {
        fetchVlogs()
    }, [])

    const fetchVlogs = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/vlogs/`)
            const data = await res.json()
            setVlogs(data)
        } catch (e) {
            console.error('Failed to fetch vlogs', e)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim() || !content.trim()) {
            setError('Title and content are required')
            return
        }
        setError('')
        setSubmitting(true)
        try {
            const res = await fetchWithCsrf(`${API_BASE}/api/vlogs/create/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    content,
                    youtube_url: youtubeUrl
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to craft vlog entry')

            // Success
            setTitle('')
            setContent('')
            setYoutubeUrl('')
            setShowForm(false)
            fetchVlogs() // refresh the list
        } catch (e: any) {
            setError(e.message)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (vlogId: number) => {
        if (!confirm('Are you sure you want to delete this entry?')) return
        try {
            const res = await fetchWithCsrf(`${API_BASE}/api/vlogs/${vlogId}/delete/`, {
                method: 'POST',
            })
            if (!res.ok) {
                const data = await res.json()
                alert(data.error || 'Failed to delete')
                return
            }
            setVlogs(vlogs.filter(v => v.id !== vlogId))
        } catch (e) {
            console.error('Failed to delete vlog', e)
            alert('Failed to delete entry')
        }
    }

    // Embed ID extractor for YouTube
    const getYouTubeEmbedId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
        const match = url.match(regExp)
        return (match && match[2].length === 11) ? match[2] : null
    }

    // We can render Journey inside PublicShell if it's accessed without login.
    // If the user is logged in, they already see a sidebar, but since this route renders at top-level OR inside layout,
    // wait – in App.tsx we mounted `<Route path="/journey" element={<Journey user={user} />} />` at the root!
    // So it does not get the Sidebar wrapper automatically. That's fine, we pass the user into PublicShell!

    return (
        <PublicShell user={user}>
            <SEO
                title="My GATE Journey — Daily Study Vlog & Journal"
                description="A daily vlog and journal tracking GATE CSE preparation progress. Share updates, milestones, and insights from your study journey."
                path="/journey"
                keywords="GATE preparation journal, GATE study vlog, GATE daily log, GATE journey tracker"
            />

            <div className="max-w-3xl mx-auto space-y-10 animate-page-enter pb-20">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-white/10 pb-6">
                    <div>
                        <h1 className="page-header-title">My GATE Journey</h1>
                        <p className="page-header-sub">Tracking daily progress, struggles, and growth toward GATE CSE 2027</p>
                    </div>
                    {user && (
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="glass-primary-button flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-[13px] font-semibold text-white shadow-lg shrink-0"
                        >
                            {showForm ? <span className="px-2">Cancel</span> : <><Plus size={16} /> New Entry</>}
                        </button>
                    )}
                </div>

                {/* Form Section */}
                {showForm && user && (
                    <div className="auth-panel p-6 animate-slide-up bg-white/[0.02]">
                        <h2 className="text-xl font-semibold mb-4">Create Daily Vlog</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="section-label block mb-1">Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="Day 42: Mastering Pointers in C"
                                    className="form-input"
                                    required
                                />
                            </div>
                            <div>
                                <label className="section-label block mb-1">Content (Journal)</label>
                                <textarea
                                    value={content}
                                    onChange={e => setContent(e.target.value)}
                                    placeholder="Today was a tough day. I spent 4 hours on trees but finally understood AVL rotations..."
                                    className="form-input min-h-[120px] resize-y"
                                    required
                                />
                            </div>
                            <div>
                                <label className="section-label block mb-1">YouTube URL (Optional)</label>
                                <div className="relative">
                                    <Video className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                                    <input
                                        type="url"
                                        value={youtubeUrl}
                                        onChange={e => setYoutubeUrl(e.target.value)}
                                        placeholder="https://youtube.com/watch?v=..."
                                        className="form-input pl-10"
                                    />
                                </div>
                            </div>

                            {error && <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">{error}</div>}

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="glass-primary-button w-full py-3 rounded-2xl text-[14px] font-bold text-white disabled:opacity-50"
                                >
                                    {submitting ? 'Posting...' : 'Publish Vlog'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Timeline Section */}
                <div className="space-y-8">
                    {loading ? (
                        <div className="py-20 text-center theme-soft animate-pulse">Loading journey entries...</div>
                    ) : vlogs.length === 0 ? (
                        <div className="py-20 text-center theme-soft border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                            <p>No entries yet. The journey begins soon.</p>
                        </div>
                    ) : (
                        <div className="relative pl-4 sm:pl-8 border-l border-white/10 space-y-12">
                            {vlogs.map((vlog) => {
                                const embedId = vlog.youtube_url ? getYouTubeEmbedId(vlog.youtube_url) : null

                                return (
                                    <article key={vlog.id} className="relative">
                                        {/* Timeline Dot */}
                                        <div className="absolute -left-[21px] sm:-left-[37px] top-6 w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]" />

                                        <div className="glass-panel p-5 sm:p-7">
                                            <div className="mb-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <span className="text-[12px] font-bold uppercase tracking-wider text-emerald-400">
                                                            {new Date(vlog.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                                        </span>
                                                        <span className="theme-divider-bg w-1.5 h-1.5 rounded-full" />
                                                        <span className="text-[12px] theme-soft">by {vlog.author}</span>
                                                    </div>
                                                    {user && (user.username === vlog.author) && (
                                                        <button
                                                            onClick={() => handleDelete(vlog.id)}
                                                            className="text-red-400/60 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10"
                                                            title="Delete entry"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    )}
                                                </div>
                                                <h3 className="text-2xl font-bold tracking-tight">{vlog.title}</h3>
                                            </div>

                                            {embedId && (
                                                <div className="mb-6 rounded-2xl overflow-hidden border border-white/10 shadow-lg aspect-video">
                                                    <iframe
                                                        width="100%"
                                                        height="100%"
                                                        src={`https://www.youtube.com/embed/${embedId}`}
                                                        title="YouTube video player"
                                                        frameBorder="0"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                        allowFullScreen
                                                    ></iframe>
                                                </div>
                                            )}

                                            <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-p:text-[15px] theme-soft whitespace-pre-wrap">
                                                {vlog.content}
                                            </div>
                                        </div>
                                    </article>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </PublicShell>
    )
}
