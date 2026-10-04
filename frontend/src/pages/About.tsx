import { BookOpenCheck, Sparkles } from 'lucide-react'
import SEO from '../components/SEO'
import PublicShell from '../components/PublicShell'

interface User {
    id: number
    username: string
    email: string
}

interface Props {
    user: User | null
}

const commitments = [
    {
        title: 'Original, relevant study data',
        body: 'Your dashboard is built from your own study sessions and progress history, not recycled content.',
    },
    {
        title: 'Clear public trust pages',
        body: 'Visitors can review the product context on the About Us and Contact Us pages before signing in.',
    },
    {
        title: 'Fresh improvements over time',
        body: 'Resources, feedback workflows, and product features are updated iteratively as the platform evolves.',
    },
]

const formats = [
    'Interactive dashboards for study hours, streaks, and weekly progress',
    'Curated lecture collections grouped by GATE CSE subjects',
    'Downloadable study history for personal review and planning',
    'Community feedback submission for bug reports, ideas, and content corrections',
]

export default function About({ user }: Props) {
    return (
        <PublicShell user={user}>
            <SEO
                title="About GateTracker — Free GATE CSE Study Intelligence Platform"
                description="Learn what GateTracker is — a free study intelligence tracker for GATE CSE 2027 aspirants. Track study hours, access curated resources, and monitor progress with analytics, heatmaps & growth tree."
                path="/about"
                keywords="about GateTracker, GATE CSE study platform, GATE preparation tool, GATE study intelligence"
            />

            <section className="feedback-hero-panel">
                <div>
                    <p className="section-label mb-3">About Us</p>
                    <h1 className="page-header-title flex items-center gap-3">
                        <BookOpenCheck size={30} className="text-emerald-400" />
                        About GateTracker
                    </h1>
                    <p className="mt-3 max-w-3xl text-[14px] leading-7 opacity-70">
                        GateTracker is a focused study companion for GATE CSE aspirants. It combines session tracking,
                        performance analytics, curated learning resources, and community feedback tools to make
                        preparation more structured and less overwhelming.
                    </p>
                </div>
                <div className="feedback-callout">
                    <Sparkles size={18} className="text-cyan-300" />
                    <div>
                        <p className="text-[13px] font-medium">Built for steady progress</p>
                        <p className="mt-1 text-[12px] opacity-45">Simple tracking, clear feedback loops, and practical study support.</p>
                    </div>
                </div>
            </section>

            <section className="mt-6 grid gap-4 md:grid-cols-3">
                {commitments.map(item => (
                    <article key={item.title} className="glass-panel p-6 hover-lift">
                        <h2 className="text-[20px] font-semibold tracking-tight">{item.title}</h2>
                        <p className="mt-3 text-[13px] leading-6 opacity-65">{item.body}</p>
                    </article>
                ))}
            </section>

            <section className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                <article className="glass-panel p-6">
                    <p className="section-label mb-3">What You’ll Find</p>
                    <h2 className="text-[24px] font-semibold tracking-tight">A study product centered on clarity and relevance</h2>
                    <p className="mt-3 max-w-2xl text-[13px] leading-6 opacity-65">
                        The platform focuses on exam-preparation workflows that are directly useful to the audience:
                        logging study sessions, reviewing trends, planning subject coverage, and discovering curated
                        video resources across core GATE CSE topics.
                    </p>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        {formats.map(item => (
                            <div key={item} className="rounded-2xl border border-white/[.08] bg-white/[.03] p-4 text-[13px] leading-6 text-white/75">
                                {item}
                            </div>
                        ))}
                    </div>
                </article>

                <article className="glass-panel p-6">
                    <p className="section-label mb-3">Quality Approach</p>
                    <h2 className="text-[24px] font-semibold tracking-tight">How GateTracker stays review-ready</h2>
                    <div className="mt-4 space-y-4 text-[13px] leading-6 opacity-70">
                        <p>The site is intended for educational use and keeps the public experience focused on study tools, curated learning support, and respectful community input.</p>
                        <p>Navigation is kept simple across desktop and mobile so visitors can find sign-in, product context, and contact information quickly.</p>
                        <p>Search signals such as canonical URLs, page descriptions, structured data, robots, and sitemap support are included to help search engines understand the site.</p>
                        <p>Content and product updates happen iteratively as new improvements, fixes, and resource refinements are added.</p>
                    </div>
                </article>
            </section>
        </PublicShell>
    )
}
