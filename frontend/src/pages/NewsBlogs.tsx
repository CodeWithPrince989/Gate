import { ExternalLink, Newspaper, ScrollText } from 'lucide-react'
import SEO from '../components/SEO'
import { dailyGateNews, featuredArticles } from '../data/articles'

export default function NewsBlogs() {
    return (
        <div className="space-y-8">
            <SEO
                title="GATE CSE News & Blogs — Latest Updates & Articles"
                description="Stay updated with the latest GATE CSE news, exam updates, preparation blogs, and curated articles. Separate from study resources for focused reading."
                path="/news-blogs"
                keywords="GATE CSE news, GATE 2027 updates, GATE exam news, GATE preparation blog, GATE articles"
                type="article"
            />

            <section className="glass-panel overflow-hidden">
                <div className="relative bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.16),_transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-6 md:p-8">
                    <p className="section-label mb-3">Separate Feed</p>
                    <h1 className="page-header-title flex items-center gap-3">
                        <Newspaper size={30} className="text-cyan-300" />
                        News & Blogs
                    </h1>
                    <p className="mt-3 max-w-3xl text-[14px] leading-7 text-white/60">
                        Updates, exam headlines, and external blog reads live here now, separate from the core study
                        resource library. Resources stays focused on lectures and subject playlists.
                    </p>
                </div>
            </section>

            <section className="glass-panel p-5 md:p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="section-label mb-2">Daily Gate News</p>
                        <h2 className="text-[22px] font-semibold tracking-tight">Recent GATE headlines from the Gateing roundup</h2>
                        <p className="mt-2 max-w-3xl text-[13px] leading-6 opacity-55">
                            This section links out to external coverage and keeps exact publication dates visible. It is a
                            curated roundup, not a republishing of third-party article bodies.
                        </p>
                    </div>
                    <a
                        href="https://gateing.com/"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-[13px] font-medium text-cyan-300 hover:text-cyan-200"
                    >
                        Open Gateing roundup <ExternalLink size={14} />
                    </a>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                    {dailyGateNews.map(item => (
                        <a
                            key={`${item.title}-${item.publishedOn}`}
                            href={item.href}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-2xl border border-white/[.08] bg-white/[.03] p-4 transition-all hover:border-cyan-400/30 hover:bg-white/[.05]"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <span className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-300">
                                    {item.source}
                                </span>
                                <span className="text-[11px] opacity-35">{item.publishedOn}</span>
                            </div>
                            <h3 className="mt-4 text-[15px] font-semibold leading-6">{item.title}</h3>
                            <p className="mt-3 text-[12px] leading-5 opacity-45">{item.note}</p>
                        </a>
                    ))}
                </div>
            </section>

            <section className="glass-panel p-5 md:p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="section-label mb-2">Featured Blogs</p>
                        <h2 className="text-[22px] font-semibold tracking-tight flex items-center gap-2">
                            <ScrollText size={22} className="text-emerald-300" />
                            Linked articles from Gateing
                        </h2>
                        <p className="mt-2 max-w-3xl text-[13px] leading-6 opacity-55">
                            These cards use original in-app summaries and send readers to the source site for the full article.
                        </p>
                    </div>
                    <a
                        href="https://gateing.com/articles/"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-[13px] font-medium text-emerald-300 hover:text-emerald-200"
                    >
                        Browse source articles <ExternalLink size={14} />
                    </a>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    {featuredArticles.map(article => (
                        <a
                            key={article.href}
                            href={article.href}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-2xl border border-white/[.08] bg-white/[.03] p-5 transition-all hover:border-emerald-400/25 hover:bg-white/[.05]"
                        >
                            <div className="flex flex-wrap items-center gap-2 text-[11px] opacity-45">
                                <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 font-semibold uppercase tracking-[0.14em] text-emerald-300">
                                    {article.category}
                                </span>
                                <span>{article.source}</span>
                                <span>•</span>
                                <span>{article.publishedOn}</span>
                            </div>
                            <h3 className="mt-4 text-[18px] font-semibold tracking-tight leading-7">{article.title}</h3>
                            <p className="mt-3 text-[13px] leading-6 opacity-65">{article.summary}</p>
                            <div className="mt-4 inline-flex items-center gap-2 text-[13px] font-medium text-cyan-300">
                                Read on source site <ExternalLink size={14} />
                            </div>
                        </a>
                    ))}
                </div>
            </section>
        </div>
    )
}
