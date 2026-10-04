import { useEffect, useState } from 'react'
import { ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { fetchWeeklyProgress, type WeeklyProgress as WPData } from '../api/api'
import { isDarkTheme } from '../utils/theme'

/**
 * Weekly progress section: 7-day bar chart + this vs last week comparison.
 */
export default function WeeklyProgress() {
    const [data, setData] = useState<WPData | null>(null)
    const dark = isDarkTheme()

    useEffect(() => {
        fetchWeeklyProgress().then(setData).catch(console.error)
    }, [])

    if (!data) return null

    const maxHours = Math.max(...data.days.map(d => d.hours), 1)

    // Week-over-week deltas
    const hoursDelta = data.this_week_hours - data.last_week_hours
    const qDelta = data.this_week_questions - data.last_week_questions

    function DeltaBadge({ value, suffix = '' }: { value: number; suffix?: string }) {
        if (value > 0) return (
            <span className="inline-flex items-center gap-0.5 text-xs text-emerald-400">
                <ArrowUp size={12} /> +{value.toFixed(1)}{suffix}
            </span>
        )
        if (value < 0) return (
            <span className="inline-flex items-center gap-0.5 text-xs text-red-400">
                <ArrowDown size={12} /> {value.toFixed(1)}{suffix}
            </span>
        )
        return (
            <span className="inline-flex items-center gap-0.5 text-xs opacity-30">
                <Minus size={12} /> 0{suffix}
            </span>
        )
    }

    return (
        <div className="chart-card">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <p className="section-label mb-1">Weekly Progress</p>
                    <p className="text-lg font-semibold tracking-tight">{data.week_label}</p>
                </div>
                <div className="flex gap-6 text-right">
                    <div>
                        <p className="text-xl font-bold tabular-nums">{data.this_week_hours}h</p>
                        <div className="flex items-center justify-end gap-1">
                            <span className="text-xs opacity-30">vs last wk</span>
                            <DeltaBadge value={hoursDelta} suffix="h" />
                        </div>
                    </div>
                    <div>
                        <p className="text-xl font-bold tabular-nums">{data.this_week_questions}</p>
                        <div className="flex items-center justify-end gap-1">
                            <span className="text-xs opacity-30">questions</span>
                            <DeltaBadge value={qDelta} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Bar chart */}
            <div className="flex items-end gap-3 h-40">
                {data.days.map(day => (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                        {/* Value label */}
                        <span className="text-[10px] tabular-nums opacity-40">
                            {day.hours > 0 ? `${day.hours}h` : ''}
                        </span>

                        {/* Bar */}
                        <div className="w-full relative" style={{ height: '100%' }}>
                            <div
                                className={`weekly-bar absolute bottom-0 left-0 right-0 transition-all duration-700 ${day.is_today
                                            ? 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                                        : day.is_future
                                            ? dark ? 'bg-white/[.03]' : 'bg-slate-200'
                                            : day.hours > 0
                                                ? dark ? 'bg-gradient-to-t from-white/10 to-white/20' : 'bg-gradient-to-t from-slate-300 to-slate-200'
                                                : dark ? 'bg-white/[.04]' : 'bg-slate-100'
                                    }`}
                                style={{
                                    height: day.is_future ? '100%' :
                                        day.hours > 0 ? `${Math.max((day.hours / maxHours) * 100, 8)}%` : '4%'
                                }}
                            />
                        </div>

                        {/* Day label */}
                        <span className={`text-[11px] font-medium ${day.is_today ? 'text-emerald-400' : 'opacity-30'
                            }`}>
                            {day.day}
                        </span>
                    </div>
                ))}
            </div>

            {/* Daily details row */}
            <div className="theme-divider flex gap-3 mt-4 pt-4 border-t">
                {data.days.filter(d => !d.is_future && d.sessions > 0).map(day => (
                    <div key={day.date} className="text-[10px] opacity-30">
                        <span className="font-medium">{day.day}:</span> {day.sessions} session{day.sessions !== 1 ? 's' : ''}, {day.questions} Q
                    </div>
                ))}
            </div>
        </div>
    )
}
