import { useEffect, useState } from 'react'
import {
    Chart as ChartJS, CategoryScale, LinearScale, BarElement,
    Tooltip, Legend
} from 'chart.js'
import SEO from '../components/SEO'
import { Bar } from 'react-chartjs-2'
import {
    TrendingUp, TrendingDown, AlertTriangle, Zap, Target,
    Calendar, BookOpen, Award, ArrowUp, ArrowDown, Minus
} from 'lucide-react'
import {
    fetchMultiWeekProgress,
    type MultiWeekProgress,
    type WeekData,
    type ProgressAlert,
} from '../api/api'
import { getChartTheme, isDarkTheme } from '../utils/theme'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

export default function Progress() {
    const [data, setData] = useState<MultiWeekProgress | null>(null)
    const [selectedWeek, setSelectedWeek] = useState<WeekData | null>(null)
    const dark = isDarkTheme()
    const chartTheme = getChartTheme(dark)

    useEffect(() => {
        fetchMultiWeekProgress().then(d => {
            setData(d)
            // Select current week by default
            const current = d.weeks.find(w => w.is_current)
            if (current) setSelectedWeek(current)
        }).catch(console.error)
    }, [])

    if (!data) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="theme-spinner w-5 h-5 border-2 rounded-full animate-spin" />
            </div>
        )
    }

    const maxHours = Math.max(...data.weeks.map(w => w.hours), 1)

    return (
        <div className="space-y-10 animate-fade-in">
            <SEO
                title="Progress — GATE CSE Weekly Tracking"
                description="Track your weekly GATE CSE study patterns, momentum trends, and multi-week progress with visual charts and detailed breakdowns."
                path="/progress"
                keywords="GATE study progress, GATE weekly tracking, GATE preparation momentum"
            />
            {/* Header */}
            <div>
                <h1 className="page-header-title">Progress</h1>
                <p className="page-header-sub">Track your weekly study patterns and momentum</p>
            </div>

            {/* Overview cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="stat-card">
                    <div className="flex items-center justify-between mb-3">
                        <span className="section-label">8-Week Total</span>
                        <Calendar size={15} className="text-blue-400 opacity-50" />
                    </div>
                    <p className="text-[26px] font-semibold tracking-tight">{data.total_hours}h</p>
                    <p className="text-[11px] opacity-25 mt-1">{data.total_questions} questions</p>
                </div>

                <div className="stat-card">
                    <div className="flex items-center justify-between mb-3">
                        <span className="section-label">Weekly Avg</span>
                        <TrendingUp size={15} className="text-emerald-400 opacity-50" />
                    </div>
                    <p className="text-[26px] font-semibold tracking-tight">{data.avg_weekly_hours}h</p>
                    <p className="text-[11px] opacity-25 mt-1">per week average</p>
                </div>

                {/* Consistency Meter */}
                <div className="stat-card">
                    <div className="flex items-center justify-between mb-3">
                        <span className="section-label">Consistency</span>
                        <Target size={15} className="text-violet-400 opacity-50" />
                    </div>
                    <p className="text-[26px] font-semibold tracking-tight">{data.consistency_score}%</p>
                    <div className="theme-progress-track mt-2 h-1.5 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ${data.consistency_score >= 70 ? 'bg-emerald-500' :
                                data.consistency_score >= 40 ? 'bg-amber-500' : 'bg-red-500'
                                }`}
                            style={{ width: `${data.consistency_score}%` }}
                        />
                    </div>
                </div>

                <div className="stat-card">
                    <div className="flex items-center justify-between mb-3">
                        <span className="section-label">Alerts</span>
                        <Zap size={15} className="text-amber-400 opacity-50" />
                    </div>
                    <p className="text-[26px] font-semibold tracking-tight">{data.alerts.length}</p>
                    <p className="text-[11px] opacity-25 mt-1">insights generated</p>
                </div>
            </div>

            {/* ═══ MAIN HISTOGRAM ═══ */}
            <div className="chart-card">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <p className="section-label mb-1">Weekly Study Hours</p>
                        <p className="text-lg font-semibold tracking-tight">Last 8 Weeks</p>
                    </div>
                    {data.weeks.length >= 2 && (() => {
                        const curr = data.weeks[data.weeks.length - 1].hours
                        const prev = data.weeks[data.weeks.length - 2].hours
                        const delta = curr - prev
                        return (
                            <div className="text-right">
                                <div className="flex items-center gap-1">
                                    {delta > 0 ? (
                                        <span className="text-emerald-400 text-sm flex items-center gap-0.5">
                                            <ArrowUp size={14} /> +{delta.toFixed(1)}h
                                        </span>
                                    ) : delta < 0 ? (
                                        <span className="text-red-400 text-sm flex items-center gap-0.5">
                                            <ArrowDown size={14} /> {delta.toFixed(1)}h
                                        </span>
                                    ) : (
                                        <span className="theme-soft text-sm flex items-center gap-0.5">
                                            <Minus size={14} /> 0h
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] opacity-25">vs last week</p>
                            </div>
                        )
                    })()}
                </div>

                {/* Chart.js histogram */}
                <div style={{ height: 280 }}>
                    <Bar
                        data={{
                            labels: data.weeks.map(w => w.week_label),
                            datasets: [{
                                label: 'Study Hours',
                                data: data.weeks.map(w => w.hours),
                                backgroundColor: data.weeks.map((w, i) => {
                                    if (w.is_current) return 'rgba(34, 197, 94, 0.8)'
                                    if (i > 0 && w.hours < data.weeks[i - 1].hours) return 'rgba(239, 68, 68, 0.4)'
                                    return chartTheme.barNeutral
                                }),
                                borderColor: data.weeks.map((w, i) => {
                                    if (w.is_current) return 'rgba(34, 197, 94, 1)'
                                    if (i > 0 && w.hours < data.weeks[i - 1].hours) return 'rgba(239, 68, 68, 0.6)'
                                    return chartTheme.barNeutralBorder
                                }),
                                borderWidth: 1,
                                borderRadius: 8,
                                borderSkipped: false,
                            }]
                        }}
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            onClick: (_e, elements) => {
                                if (elements.length > 0) {
                                    const idx = elements[0].index
                                    setSelectedWeek(data.weeks[idx])
                                }
                            },
                            scales: {
                                x: {
                                    ticks: { color: chartTheme.tick, font: { size: 12 } },
                                    grid: { display: false },
                                    border: { display: false },
                                },
                                y: {
                                    ticks: { color: chartTheme.tick, font: { size: 11 }, callback: v => v + 'h' },
                                    grid: { color: chartTheme.grid },
                                    border: { display: false },
                                },
                            },
                            plugins: {
                                legend: { display: false }, tooltip: {
                                    backgroundColor: chartTheme.tooltipBg,
                                    borderColor: chartTheme.tooltipBorder,
                                    borderWidth: 1,
                                    titleColor: chartTheme.tooltipText,
                                    bodyColor: chartTheme.tooltipText,
                                    titleFont: { size: 13 },
                                    bodyFont: { size: 12 },
                                    padding: 12,
                                    cornerRadius: 10,
                                    callbacks: {
                                        title: ctx => data.weeks[ctx[0].dataIndex].week_range,
                                        label: ctx => `${(ctx.parsed.y ?? 0).toFixed(1)} hours studied`,
                                        afterLabel: ctx => {
                                            const w = data.weeks[ctx.dataIndex]
                                            return `${w.sessions} sessions · ${w.days_studied}/7 days`
                                        },
                                    },
                                }
                            },
                        }}
                    />
                </div>

                {/* Mini legend */}
                <div className="theme-divider flex items-center gap-5 mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2 text-[11px] opacity-30">
                        <div className="w-3 h-3 rounded bg-emerald-500/80" /> This week
                    </div>
                    <div className="flex items-center gap-2 text-[11px] opacity-30">
                        <div className={`w-3 h-3 rounded ${dark ? 'bg-white/12' : 'bg-slate-400/35'}`} /> Normal
                    </div>
                    <div className="flex items-center gap-2 text-[11px] opacity-30">
                        <div className="w-3 h-3 rounded bg-red-500/40" /> Declined
                    </div>
                    <div className="text-[11px] opacity-20 ml-auto">Click a bar for details</div>
                </div>
            </div>

            {/* ═══ WEEK DETAIL + ALERTS ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Selected week detail */}
                <div className="chart-card">
                    <p className="section-label mb-1">Week Detail</p>
                    <p className="text-lg font-semibold tracking-tight mb-5">
                        {selectedWeek?.week_range || 'Select a week'}
                    </p>

                    {selectedWeek ? (
                        <div className="space-y-4">
                            {/* Stats grid */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="theme-surface-soft rounded-xl p-4 text-center">
                                    <p className="text-[22px] font-semibold">{selectedWeek.hours}h</p>
                                    <p className="text-[10px] opacity-30 mt-1">Total Hours</p>
                                </div>
                                <div className="theme-surface-soft rounded-xl p-4 text-center">
                                    <p className="text-[22px] font-semibold">{selectedWeek.questions}</p>
                                    <p className="text-[10px] opacity-30 mt-1">Questions</p>
                                </div>
                                <div className="theme-surface-soft rounded-xl p-4 text-center">
                                    <p className="text-[22px] font-semibold">{selectedWeek.days_studied}/7</p>
                                    <p className="text-[10px] opacity-30 mt-1">Days Active</p>
                                </div>
                            </div>

                            {/* Days bar visualization */}
                            <div>
                                <p className="text-[11px] opacity-25 mb-2">Study days</p>
                                <div className="flex gap-1.5">
                                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                                        <div
                                            key={i}
                                            className={`flex-1 h-8 rounded-lg flex items-center justify-center text-[10px] font-medium transition-all ${i < selectedWeek.days_studied
                                                ? 'bg-emerald-500/20 text-emerald-400/80'
                                                : dark ? 'bg-white/[.03] text-white/15' : 'bg-slate-100 text-slate-400'
                                                }`}
                                        >
                                            {day}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Subject breakdown */}
                            {selectedWeek.subject_breakdown.length > 0 && (
                                <div>
                                    <p className="text-[11px] opacity-25 mb-2">Subject breakdown</p>
                                    <div className="space-y-2">
                                        {selectedWeek.subject_breakdown.map(s => (
                                            <div key={s.subject} className="flex items-center gap-3">
                                                <span className="text-[12px] w-24 truncate opacity-50">{s.subject}</span>
                                                <div className="theme-progress-track flex-1 h-2 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full bg-emerald-500/60"
                                                        style={{ width: `${Math.min((s.hours / selectedWeek.hours) * 100, 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-[11px] tabular-nums opacity-30 w-10 text-right">{s.hours}h</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Best day */}
                            {selectedWeek.best_day_hours > 0 && (
                                <div className="flex items-center gap-3 bg-amber-500/5 border border-amber-500/10 rounded-xl px-4 py-3">
                                    <Award size={16} className="text-amber-400/60" />
                                    <div>
                                        <p className="text-[12px] font-medium">Best day: {selectedWeek.best_day_hours}h</p>
                                        <p className="text-[11px] opacity-25">{selectedWeek.best_day_date}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-12 opacity-20 text-[13px]">
                            Click a bar in the histogram to see details
                        </div>
                    )}
                </div>

                {/* Alerts & Insights */}
                <div className="chart-card">
                    <p className="section-label mb-1">Insights & Alerts</p>
                    <p className="text-lg font-semibold tracking-tight mb-5">Smart Analysis</p>

                    {data.alerts.length > 0 ? (
                        <div className="space-y-3">
                            {data.alerts.map((alert, i) => (
                                <AlertCard key={i} alert={alert} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <BookOpen size={32} className="mx-auto opacity-10 mb-3" />
                            <p className="text-[14px] opacity-30">No alerts yet</p>
                            <p className="text-[12px] opacity-15 mt-1">Start studying to see weekly insights</p>
                        </div>
                    )}

                    {/* Motivational tips */}
                    <div className="theme-divider mt-6 pt-4 border-t">
                        <p className="text-[11px] opacity-20 mb-3">💡 Tips</p>
                        <div className="space-y-2">
                            {[
                                'Aim for 3+ hours daily for competitive GATE scores',
                                'Practice problems are weighted higher — solve daily',
                                'Consistent 5-day weeks beat sporadic marathon sessions',
                            ].map((tip, i) => (
                                <p key={i} className="theme-soft theme-divider text-[12px] pl-4 border-l-2">{tip}</p>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══ WEEK-OVER-WEEK COMPARISON TABLE ═══ */}
            <div className="chart-card overflow-x-auto">
                <p className="section-label mb-1">Comparison</p>
                <p className="text-lg font-semibold tracking-tight mb-5">Week over Week</p>

                <table className="w-full text-[13px]">
                    <thead>
                        <tr className="theme-table-head border-b">
                            <th className="px-4 py-2.5 text-left section-label font-semibold">Week</th>
                            <th className="px-4 py-2.5 text-right section-label font-semibold">Hours</th>
                            <th className="px-4 py-2.5 text-right section-label font-semibold">Change</th>
                            <th className="px-4 py-2.5 text-right section-label font-semibold">Questions</th>
                            <th className="px-4 py-2.5 text-right section-label font-semibold">Sessions</th>
                            <th className="px-4 py-2.5 text-right section-label font-semibold">Days</th>
                            <th className="px-4 py-2.5 text-left section-label font-semibold">Visual</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.weeks.map((w, i) => {
                            const prev = i > 0 ? data.weeks[i - 1].hours : 0
                            const delta = i > 0 ? w.hours - prev : 0
                            const pct = prev > 0 ? Math.round((delta / prev) * 100) : 0
                            return (
                                <tr
                                    key={w.week_label}
                                    className={`theme-table-row cursor-pointer border-b transition-colors last:border-b-0 ${selectedWeek?.week_label === w.week_label ? 'bg-emerald-500/5' : ''
                                        } ${w.is_current ? 'font-medium' : ''}`}
                                    onClick={() => setSelectedWeek(w)}
                                >
                                    <td className="px-4 py-3">
                                        <span className={w.is_current ? 'text-emerald-400' : 'opacity-50'}>
                                            {w.week_range}
                                        </span>
                                        {w.is_current && (
                                            <span className="ml-2 text-[9px] bg-emerald-500/15 text-emerald-400/80 px-1.5 py-0.5 rounded-full">NOW</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums opacity-70">{w.hours}h</td>
                                    <td className="px-4 py-3 text-right">
                                        {i > 0 ? (
                                            delta > 0 ? (
                                                <span className="text-emerald-400 text-[12px]">+{pct}%</span>
                                            ) : delta < 0 ? (
                                                <span className="text-red-400 text-[12px]">{pct}%</span>
                                            ) : (
                                                <span className="opacity-20 text-[12px]">—</span>
                                            )
                                        ) : <span className="opacity-20 text-[12px]">—</span>}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums opacity-50">{w.questions}</td>
                                    <td className="px-4 py-3 text-right tabular-nums opacity-50">{w.sessions}</td>
                                    <td className="px-4 py-3 text-right tabular-nums opacity-50">{w.days_studied}/7</td>
                                    <td className="px-4 py-3">
                                        <div className="theme-progress-track w-24 h-2 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${w.is_current ? 'bg-emerald-500/70' :
                                                    delta < 0 ? 'bg-red-500/40' : dark ? 'bg-white/15' : 'bg-slate-400/45'
                                                    }`}
                                                style={{ width: `${Math.min((w.hours / maxHours) * 100, 100)}%` }}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

/* Alert card component */
function AlertCard({ alert }: { alert: ProgressAlert }) {
    const styles = {
        critical: {
            bg: 'bg-red-500/5 border-red-500/15',
            icon: <AlertTriangle size={16} className="text-red-400" />,
        },
        warning: {
            bg: 'bg-amber-500/5 border-amber-500/15',
            icon: <TrendingDown size={16} className="text-amber-400" />,
        },
        success: {
            bg: 'bg-emerald-500/5 border-emerald-500/15',
            icon: <TrendingUp size={16} className="text-emerald-400" />,
        },
    }
    const s = styles[alert.type]

    return (
        <div className={`rounded-xl border px-4 py-3.5 ${s.bg}`}>
            <div className="flex items-start gap-3">
                <div className="mt-0.5">{s.icon}</div>
                <div>
                    <p className="text-[13px] font-medium">{alert.message}</p>
                    <p className="text-[12px] opacity-30 mt-0.5">{alert.week} · {alert.suggestion}</p>
                </div>
            </div>
        </div>
    )
}
