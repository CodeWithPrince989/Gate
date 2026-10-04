import { useEffect, useState } from 'react'
import { Search, Filter, X } from 'lucide-react'
import SEO from '../components/SEO'
import { fetchHistory, type StudySession } from '../api/api'

const SUBJECTS = [
    { code: 'DSA', name: 'DSA' },
    { code: 'OS', name: 'OS' },
    { code: 'COA', name: 'COA' },
    { code: 'DBMS', name: 'DBMS' },
    { code: 'DL', name: 'Digital Logic' },
    { code: 'MATHS', name: 'Maths' },
    { code: 'CN', name: 'CN' },
    { code: 'TOC', name: 'TOC' },
    { code: 'CD', name: 'Compiler Design' },
    { code: 'SE', name: 'Software Engg' },
    { code: 'APT', name: 'Aptitude' },
]

export default function History() {
    const [sessions, setSessions] = useState<StudySession[]>([])
    const [loading, setLoading] = useState(true)
    const [subject, setSubject] = useState('')
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    const [search, setSearch] = useState('')

    const load = () => {
        setLoading(true)
        fetchHistory({ subject, date_from: dateFrom, date_to: dateTo, search })
            .then(data => { setSessions(data); setLoading(false) })
            .catch(() => setLoading(false))
    }

    useEffect(() => { load() }, [])

    const clearFilters = () => {
        setSubject(''); setDateFrom(''); setDateTo(''); setSearch('')
        setLoading(true)
        fetchHistory({}).then(d => { setSessions(d); setLoading(false) }).catch(() => setLoading(false))
    }

    return (
        <div className="space-y-10">
            <SEO
                title="Study History — GATE CSE Session Log"
                description="Review and filter all your GATE CSE study sessions — search by subject, study type, and date. Download as CSV for personal review."
                path="/history"
                keywords="GATE study history, GATE session log, GATE study records"
            />
            <div>
                <h1 className="page-header-title">History</h1>
                <p className="page-header-sub">Review and filter all study sessions</p>
            </div>

            {/* Filters */}
            <div className="glass-panel p-5 flex flex-wrap items-end gap-4">
                <div className="flex-1 min-w-[200px]">
                    <label className="section-label block mb-1.5">Search</label>
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-25" />
                        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search…" className="form-input pl-9" />
                    </div>
                </div>
                <div>
                    <label className="section-label block mb-1.5">Subject</label>
                    <select value={subject} onChange={e => setSubject(e.target.value)} className="form-input w-40">
                        <option value="">All</option>
                        {SUBJECTS.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="section-label block mb-1.5">From</label>
                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="form-input w-36" />
                </div>
                <div>
                    <label className="section-label block mb-1.5">To</label>
                    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="form-input w-36" />
                </div>
                <button onClick={load}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white text-[13px] font-medium transition-all">
                    <Filter size={13} /> Apply
                </button>
                <button onClick={clearFilters}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white/[.04] hover:bg-white/[.08] text-[13px] opacity-40 transition-all">
                    <X size={13} /> Clear
                </button>
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                </div>
            ) : sessions.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-white/[.06]">
                    <table className="w-full text-[13px]">
                        <thead>
                            <tr className="border-b border-white/[.04]">
                                <th className="px-5 py-3 text-left section-label font-semibold">Date</th>
                                <th className="px-5 py-3 text-left section-label font-semibold">Subject</th>
                                <th className="px-5 py-3 text-left section-label font-semibold">Type</th>
                                <th className="px-5 py-3 text-right section-label font-semibold">Duration</th>
                                <th className="px-5 py-3 text-right section-label font-semibold">Questions</th>
                                <th className="px-5 py-3 text-right section-label font-semibold">Lectures</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[.03]">
                            {sessions.map(s => (
                                <tr key={s.id} className="hover:bg-white/[.02] transition-colors">
                                    <td className="px-5 py-3 opacity-50">{s.date}</td>
                                    <td className="px-5 py-3">
                                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/8 text-emerald-400/80 text-[12px] font-medium">
                                            {s.subject_display || s.subject}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 opacity-40">{s.study_type}</td>
                                    <td className="px-5 py-3 text-right font-mono tabular-nums opacity-60">{Math.round(s.duration_minutes)}m</td>
                                    <td className="px-5 py-3 text-right font-mono tabular-nums opacity-60">{s.questions_solved}</td>
                                    <td className="px-5 py-3 text-right font-mono tabular-nums opacity-60">{s.lecture_minutes}m</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-20 rounded-xl border border-dashed border-white/[.08]">
                    <p className="text-[15px] opacity-30">No sessions found.</p>
                    <p className="text-[13px] opacity-20 mt-1">Start studying or adjust filters.</p>
                </div>
            )}
        </div>
    )
}
