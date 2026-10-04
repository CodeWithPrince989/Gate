import { useEffect, useState } from 'react'
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement,
    LineElement, BarElement, ArcElement, Tooltip, Legend, Filler
} from 'chart.js'
import SEO from '../components/SEO'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import { TrendingUp, BookOpen, AlertCircle, Flame } from 'lucide-react'
import StatCard from '../components/StatCard'
import WeeklyProgress from '../components/WeeklyProgress'
import { fetchAnalytics, fetchChartData, type AnalyticsData, type ChartData } from '../api/api'
import { getChartTheme, isDarkTheme } from '../utils/theme'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler)

export default function Analytics() {
    const [a, setA] = useState<AnalyticsData | null>(null)
    const [c, setC] = useState<ChartData | null>(null)
    const dark = isDarkTheme()
    const chartTheme = getChartTheme(dark)

    useEffect(() => {
        fetchAnalytics().then(setA).catch(console.error)
        fetchChartData().then(setC).catch(console.error)
    }, [])

    if (!a || !c) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="theme-spinner w-5 h-5 border-2 rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-10">
            <SEO
                title="Analytics — GATE CSE Study Insights"
                description="Deep dive into your GATE CSE preparation patterns — study trends, subject breakdown, streaks, and performance insights with visual charts."
                path="/analytics"
                keywords="GATE study analytics, GATE preparation insights, GATE study patterns"
            />
            <div>
                <h1 className="page-header-title">Analytics</h1>
                <p className="page-header-sub">Deep dive into your preparation patterns</p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard label="Avg Daily" value={`${a.avg_daily_hours}h`}
                    icon={<TrendingUp size={16} strokeWidth={1.8} />} iconBg="bg-blue-500/10 text-blue-400" />
                <StatCard label="Strongest" value={a.most_studied}
                    icon={<BookOpen size={16} strokeWidth={1.8} />} iconBg="bg-emerald-500/10 text-emerald-400" />
                <StatCard label="Weakest" value={a.least_studied}
                    icon={<AlertCircle size={16} strokeWidth={1.8} />} iconBg="bg-amber-500/10 text-amber-400" />
                <StatCard label="Best Streak" value={`${a.longest_streak}d`}
                    icon={<Flame size={16} strokeWidth={1.8} />} iconBg="bg-orange-500/10 text-orange-400" />
            </div>

            {/* Weekly progress */}
            <WeeklyProgress />

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="chart-card">
                    <p className="section-label mb-1">Trend</p>
                    <p className="text-lg font-semibold tracking-tight mb-4">Study Hours</p>
                    <div style={{ height: 260 }}>
                        <Line
                            data={{
                                labels: c.daily_labels,
                                datasets: [{
                                    label: 'Hours',
                                    data: c.daily_hours,
                                    borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,.06)',
                                    fill: true, tension: 0.4, pointRadius: 3,
                                    pointBackgroundColor: '#22c55e', borderWidth: 2,
                                }]
                            }}
                            options={chartOpts(dark)}
                        />
                    </div>
                </div>

                <div className="chart-card">
                    <p className="section-label mb-1">Comparison</p>
                    <p className="text-lg font-semibold tracking-tight mb-4">Study Types</p>
                    <div style={{ height: 260 }}>
                        <Bar
                            data={{
                                labels: c.type_labels,
                                datasets: [{
                                    label: 'Hours',
                                    data: c.type_values,
                                    backgroundColor: ['#3b82f6', '#f59e0b', '#22c55e', '#a855f7'],
                                    borderRadius: 8, borderSkipped: false,
                                }]
                            }}
                            options={chartOpts(dark)}
                        />
                    </div>
                </div>

                <div className="chart-card lg:col-span-2">
                    <p className="section-label mb-1">Distribution</p>
                    <p className="text-lg font-semibold tracking-tight mb-4">Subject Time</p>
                    <div style={{ height: 300 }} className="max-w-md mx-auto">
                        <Doughnut
                            data={{
                                labels: c.subject_labels,
                                datasets: [{
                                    data: c.subject_values,
                                    backgroundColor: [
                                        '#22c55e', '#3b82f6', '#a855f7', '#f59e0b',
                                        '#ef4444', '#06b6d4', '#ec4899', '#84cc16',
                                        '#f97316', '#6366f1', '#14b8a6'
                                    ],
                                    borderWidth: 0, hoverOffset: 4,
                                }]
                            }}
                            options={{
                                responsive: true, maintainAspectRatio: false,
                                cutout: '72%',
                                plugins: {
                                    legend: {
                                        position: 'right',
                                        labels: { color: chartTheme.legend, font: { size: 12 }, padding: 10, usePointStyle: true, pointStyleWidth: 8, },
                                    },
                                },
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

function chartOpts(dark: boolean) {
    const theme = getChartTheme(dark)
    return {
        responsive: true, maintainAspectRatio: false,
        scales: {
            x: { ticks: { color: theme.tick, font: { size: 11 } }, grid: { color: theme.grid }, border: { display: false } },
            y: { ticks: { color: theme.tick, font: { size: 11 } }, grid: { color: theme.grid }, border: { display: false } },
        },
        plugins: { legend: { display: false } },
    } as const
}
