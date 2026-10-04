import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement,
    LineElement, BarElement, ArcElement, Tooltip, Legend, Filler
} from 'chart.js'
import { Line, Doughnut } from 'react-chartjs-2'
import { Clock, HelpCircle, GraduationCap, Flame, ArrowRight, BookOpen } from 'lucide-react'
import StatCard from '../components/StatCard'
import Heatmap from '../components/Heatmap'
import GrowthTree from '../components/GrowthTree'
import WeeklyProgress from '../components/WeeklyProgress'
import { fetchDashboard, fetchChartData, fetchHeatmapData, type DashboardData, type ChartData } from '../api/api'
import { readCachedDashboard, writeCachedDashboard } from '../utils/dashboardCache'
import { getChartTheme, isDarkTheme } from '../utils/theme'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler)

export default function Dashboard() {
    const [dash, setDash] = useState<DashboardData | null>(() => readCachedDashboard())
    const [charts, setCharts] = useState<ChartData | null>(null)
    const [heatmap, setHeatmap] = useState<Record<string, number>>({})
    const dark = isDarkTheme()
    const chartTheme = getChartTheme(dark)

    useEffect(() => {
        fetchDashboard()
            .then(data => {
                setDash(data)
                writeCachedDashboard(data)
            })
            .catch(console.error)
        fetchChartData().then(setCharts).catch(console.error)
        fetchHeatmapData().then(setHeatmap).catch(console.error)
    }, [])

    return (
        <>
            <div className="space-y-6 md:space-y-10">
                <SEO
                    title="Dashboard — GATE CSE Study Overview"
                    description="Track your GATE CSE 2027 preparation at a glance — daily study hours, questions solved, streaks, progress heatmap, and growth tree overview."
                    path="/"
                    keywords="GATE dashboard, GATE study overview, GATE preparation progress"
                />
                {/* Header */}
                <div className="flex items-end justify-between">
                    <div>
                        <h1 className="page-header-title">Dashboard</h1>
                        <p className="page-header-sub">Your GATE preparation at a glance</p>
                    </div>
                    <Link
                        to="/start-study"
                        className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-primary-button text-white text-[13px] font-medium transition-all active:scale-[.97]"
                    >
                        Start Studying <ArrowRight size={14} />
                    </Link>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {dash ? (
                        <>
                            <StatCard
                                label="Study Hours" value={`${dash.today_hours}h`} sub="Today"
                                icon={<Clock size={16} strokeWidth={1.8} />}
                                iconBg="bg-blue-500/10 text-blue-400"
                            />
                            <StatCard
                                label="Questions" value={dash.today_questions} sub="Solved today"
                                icon={<HelpCircle size={16} strokeWidth={1.8} />}
                                iconBg="bg-emerald-500/10 text-emerald-400"
                            />
                            <StatCard
                                label="Lectures" value={`${dash.today_lectures}m`} sub="Today"
                                icon={<GraduationCap size={16} strokeWidth={1.8} />}
                                iconBg="bg-violet-500/10 text-violet-400"
                            />
                            <StatCard
                                label="Streak" value={`${dash.current_streak}d`}
                                sub={`Best: ${dash.longest_streak} days`}
                                icon={<Flame size={16} strokeWidth={1.8} />}
                                iconBg="bg-orange-500/10 text-orange-400"
                            />
                        </>
                    ) : (
                        Array.from({ length: 4 }).map((_, index) => <StatCardSkeleton key={index} />)
                    )}
                </div>

                {/* Growth Tree + Weekly Progress (side by side) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <GrowthTree />
                    <WeeklyProgress />
                </div>

                {/* Study hours trend */}
                {charts && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Line chart — 2 cols */}
                        <div className="chart-card lg:col-span-2">
                            <p className="section-label mb-1">Study Hours</p>
                            <p className="text-lg font-semibold tracking-tight mb-4">Last 14 Days</p>
                            <div style={{ height: 240 }}>
                                <Line
                                    data={{
                                        labels: charts.daily_labels,
                                        datasets: [{
                                            label: 'Hours',
                                            data: charts.daily_hours,
                                            borderColor: '#22c55e',
                                            backgroundColor: dark
                                                ? 'rgba(34,197,94,.08)'
                                                : 'rgba(34,197,94,.12)',
                                            fill: true,
                                            tension: 0.4,
                                            pointRadius: 3,
                                            pointHoverRadius: 6,
                                            pointBackgroundColor: '#22c55e',
                                            pointBorderColor: dark ? '#09090b' : '#f5f7fb',
                                            pointBorderWidth: 2,
                                            borderWidth: 2.5,
                                        }]
                                    }}
                                    options={lineOpts(dark)}
                                />
                            </div>
                        </div>

                        {/* Subject distribution — 1 col */}
                        <div className="chart-card">
                            <p className="section-label mb-1">Distribution</p>
                            <p className="text-lg font-semibold tracking-tight mb-4">By Subject</p>
                            <div style={{ height: 240 }}>
                                <Doughnut
                                    data={{
                                        labels: charts.subject_labels,
                                        datasets: [{
                                            data: charts.subject_values,
                                            backgroundColor: [
                                                '#22c55e', '#3b82f6', '#a855f7', '#f59e0b',
                                                '#ef4444', '#06b6d4', '#ec4899', '#84cc16',
                                                '#f97316', '#6366f1', '#14b8a6'
                                            ],
                                            borderWidth: 0,
                                            hoverOffset: 6,
                                        }]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        cutout: '72%',
                                        plugins: {
                                            legend: {
                                                position: 'bottom',
                                                labels: {
                                                    color: chartTheme.legend,
                                                    font: { size: 11, family: 'var(--font-sans)' },
                                                    padding: 8,
                                                    usePointStyle: true,
                                                    pointStyleWidth: 8,
                                                }
                                            }
                                        },
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Heatmap */}
                <Heatmap data={heatmap} />

                {/* Recent sessions */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="section-label mb-1">Sessions</p>
                            <p className="text-lg font-semibold tracking-tight">Recent Activity</p>
                        </div>
                        <Link to="/history" className="text-[13px] theme-soft hover:text-[var(--app-text)] transition-colors flex items-center gap-1">
                            View all <ArrowRight size={12} />
                        </Link>
                    </div>

                    {dash ? (
                        dash.recent_sessions.length > 0 ? (
                            <div className="theme-table overflow-x-auto rounded-xl">
                                <table className="w-full text-[13px]">
                                    <thead>
                                        <tr className="theme-table-head border-b">
                                            <th className="px-5 py-3 text-left section-label font-semibold">Date</th>
                                            <th className="px-5 py-3 text-left section-label font-semibold">Subject</th>
                                            <th className="px-5 py-3 text-left section-label font-semibold">Type</th>
                                            <th className="px-5 py-3 text-right section-label font-semibold">Duration</th>
                                            <th className="px-5 py-3 text-right section-label font-semibold">Questions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dash.recent_sessions.map(s => (
                                            <tr key={s.id} className="theme-table-row border-b transition-colors last:border-b-0">
                                                <td className="theme-soft px-5 py-3">{s.date}</td>
                                                <td className="px-5 py-3">
                                                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/8 text-emerald-400/80 text-[12px] font-medium">
                                                        {s.subject_display}
                                                    </span>
                                                </td>
                                                <td className="theme-soft px-5 py-3">{s.study_type}</td>
                                                <td className="theme-muted px-5 py-3 text-right font-mono tabular-nums">
                                                    {Math.round(s.duration_minutes)}m
                                                </td>
                                                <td className="theme-muted px-5 py-3 text-right font-mono tabular-nums">
                                                    {s.questions_solved}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="theme-empty-state text-center py-20 rounded-xl">
                                <BookOpen size={40} className="mx-auto theme-soft animate-float mb-4" />
                                <p className="text-[15px] theme-soft font-medium">No sessions yet</p>
                                <p className="text-[13px] theme-soft mt-1">Start studying to see your progress grow.</p>
                                <Link
                                    to="/start-study"
                                    className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-full glass-primary-button text-white text-[13px] font-medium"
                                >
                                    Start a session <ArrowRight size={13} />
                                </Link>
                            </div>
                        )
                    ) : (
                        <RecentActivitySkeleton />
                    )}
                </div>
            </div>

            <Link
                to="/feedback"
                className="fixed right-5 bottom-5 z-30 inline-flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 text-white text-[13px] font-medium shadow-[0_18px_42px_rgba(10,16,32,0.45)] hover:translate-y-[-2px] hover:shadow-[0_22px_52px_rgba(10,16,32,0.55)] transition-all"
            >
                <span className="text-[16px]">💬</span>
                Share Feedback
            </Link>
        </>
    )
}

function StatCardSkeleton() {
    return (
        <div className="stat-card">
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-3">
                    <div className="theme-skeleton h-3 w-20 rounded-lg" />
                    <div className="theme-skeleton h-8 w-24 rounded-lg" />
                    <div className="theme-skeleton h-3 w-16 rounded-lg" />
                </div>
                <div className="theme-skeleton h-10 w-10 rounded-2xl" />
            </div>
        </div>
    )
}

function RecentActivitySkeleton() {
    return (
        <div className="theme-table overflow-hidden rounded-xl">
            <div className="theme-table-head border-b px-5 py-3">
                <div className="theme-skeleton h-3 w-40 rounded-lg" />
            </div>
            <div>
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="theme-table-row grid grid-cols-5 gap-4 border-b px-5 py-4 last:border-b-0">
                        <div className="theme-skeleton h-3 w-20 rounded-lg" />
                        <div className="theme-skeleton h-6 w-24 rounded-lg" />
                        <div className="theme-skeleton h-3 w-16 rounded-lg" />
                        <div className="theme-skeleton ml-auto h-3 w-12 rounded-lg" />
                        <div className="theme-skeleton ml-auto h-3 w-10 rounded-lg" />
                    </div>
                ))}
            </div>
        </div>
    )
}

function lineOpts(dark: boolean) {
    const theme = getChartTheme(dark)
    return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            intersect: false,
            mode: 'index' as const,
        },
        scales: {
            x: {
                ticks: { color: theme.tick, font: { size: 11 } },
                grid: { color: theme.grid },
                border: { display: false },
            },
            y: {
                ticks: { color: theme.tick, font: { size: 11 } },
                grid: { color: theme.grid },
                border: { display: false },
            },
        },
        plugins: { legend: { display: false } },
    } as const
}
