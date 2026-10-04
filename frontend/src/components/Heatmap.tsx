import { useMemo, useState, useRef, useCallback } from 'react'
import { isDarkTheme } from '../utils/theme'

interface Props {
    data: Record<string, number>
}

/* ─── intensity → colour band ─── */
const BANDS = [
    { min: 0, max: 0, label: 'Rest day' },
    { min: 1, max: 29, label: 'Light' },
    { min: 30, max: 59, label: 'Moderate' },
    { min: 60, max: 119, label: 'Focused' },
    { min: 120, max: Infinity, label: 'Beast mode 🔥' },
]

function bandIndex(mins: number) {
    if (mins === 0) return 0
    if (mins < 30) return 1
    if (mins < 60) return 2
    if (mins < 120) return 3
    return 4
}

function formatMins(m: number) {
    if (m === 0) return 'No study'
    const h = Math.floor(m / 60)
    const mins = Math.round(m % 60)
    if (h === 0) return `${mins}m`
    return mins > 0 ? `${h}h ${mins}m` : `${h}h`
}

function formatDate(dateStr: string) {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function Heatmap({ data }: Props) {
    const dark = isDarkTheme()
    const containerRef = useRef<HTMLDivElement>(null)
    const [tooltip, setTooltip] = useState<{
        x: number; y: number; date: string; mins: number
    } | null>(null)

    const { weeks, months, stats } = useMemo(() => {
        const today = new Date()
        const cells: { date: string; mins: number; dayOfWeek: number }[] = []

        for (let i = 363; i >= 0; i--) {
            const d = new Date(today)
            d.setDate(d.getDate() - i)
            const key = d.toISOString().slice(0, 10)
            cells.push({ date: key, mins: data[key] || 0, dayOfWeek: d.getDay() })
        }

        const weeks: typeof cells[] = []
        let currentWeek: typeof cells = []
        for (const cell of cells) {
            if (cell.dayOfWeek === 0 && currentWeek.length > 0) {
                weeks.push(currentWeek)
                currentWeek = []
            }
            currentWeek.push(cell)
        }
        if (currentWeek.length > 0) weeks.push(currentWeek)

        const monthLabels: { label: string; col: number }[] = []
        const seen = new Set<string>()
        weeks.forEach((week, wi) => {
            const first = week[0]
            const m = first.date.slice(0, 7)
            if (!seen.has(m)) {
                seen.add(m)
                monthLabels.push({
                    label: new Date(first.date + 'T00:00:00').toLocaleString('en', { month: 'short' }),
                    col: wi,
                })
            }
        })

        /* stats */
        let activeDays = 0, totalMins = 0, currentStreak = 0, maxStreak = 0, tempStreak = 0
        for (const c of cells) {
            if (c.mins > 0) {
                activeDays++
                totalMins += c.mins
                tempStreak++
                if (tempStreak > maxStreak) maxStreak = tempStreak
            } else {
                tempStreak = 0
            }
        }
        /* current streak (from today backwards) */
        for (let i = cells.length - 1; i >= 0; i--) {
            if (cells[i].mins > 0) currentStreak++
            else break
        }

        return { weeks, months: monthLabels, stats: { activeDays, totalMins, currentStreak, maxStreak } }
    }, [data])

    /* colour palette based on intensity band */
    const palette = dark
        ? [
            'heatmap-lvl-0-dark',
            'heatmap-lvl-1-dark',
            'heatmap-lvl-2-dark',
            'heatmap-lvl-3-dark',
            'heatmap-lvl-4-dark',
        ]
        : [
            'heatmap-lvl-0-light',
            'heatmap-lvl-1-light',
            'heatmap-lvl-2-light',
            'heatmap-lvl-3-light',
            'heatmap-lvl-4-light',
        ]

    const handleMouseEnter = useCallback((e: React.MouseEvent, date: string, mins: number) => {
        const rect = containerRef.current?.getBoundingClientRect()
        const cellRect = (e.target as HTMLElement).getBoundingClientRect()
        if (!rect) return
        setTooltip({
            x: cellRect.left - rect.left + cellRect.width / 2,
            y: cellRect.top - rect.top - 8,
            date,
            mins,
        })
    }, [])

    const handleMouseLeave = useCallback(() => setTooltip(null), [])

    return (
        <div className="heatmap-wrapper" ref={containerRef}>
            {/* Header with inline stats */}
            <div className="heatmap-header">
                <div>
                    <p className="section-label mb-1">Activity</p>
                    <p className="text-lg font-semibold tracking-tight">Study Heatmap</p>
                </div>
                <div className="heatmap-stats">
                    <div className="heatmap-stat">
                        <span className="heatmap-stat-value">{stats.activeDays}</span>
                        <span className="heatmap-stat-label">Active days</span>
                    </div>
                    <div className="heatmap-stat-divider" />
                    <div className="heatmap-stat">
                        <span className="heatmap-stat-value">{formatMins(stats.totalMins)}</span>
                        <span className="heatmap-stat-label">Total study</span>
                    </div>
                    <div className="heatmap-stat-divider" />
                    <div className="heatmap-stat">
                        <span className="heatmap-stat-value">{stats.currentStreak}d</span>
                        <span className="heatmap-stat-label">Current streak</span>
                    </div>
                </div>
            </div>

            {/* Month labels */}
            <div className="heatmap-months" style={{ paddingLeft: 32 }}>
                {months.map((m, i) => (
                    <span
                        key={i}
                        className="heatmap-month-label"
                        style={{ gridColumnStart: m.col + 1 }}
                    >
                        {m.label}
                    </span>
                ))}
            </div>

            {/* Grid */}
            <div className="heatmap-scroll">
                {/* Day labels */}
                <div className="heatmap-day-labels">
                    {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((d, i) => (
                        <div key={i} className="heatmap-day-label">{d}</div>
                    ))}
                </div>

                <div className="heatmap-grid">
                    {weeks.map((week, wi) => (
                        <div key={wi} className="heatmap-col">
                            {wi === 0 && week[0].dayOfWeek > 0 &&
                                Array.from({ length: week[0].dayOfWeek }).map((_, i) => (
                                    <div key={`pad-${i}`} className="heatmap-cell-new heatmap-pad" />
                                ))
                            }
                            {week.map(cell => {
                                const bi = bandIndex(cell.mins)
                                return (
                                    <div
                                        key={cell.date}
                                        className={`heatmap-cell-new ${palette[bi]}`}
                                        data-level={bi}
                                        onMouseEnter={e => handleMouseEnter(e, cell.date, cell.mins)}
                                        onMouseLeave={handleMouseLeave}
                                    />
                                )
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Tooltip */}
            {tooltip && (
                <div
                    className="heatmap-tooltip"
                    style={{
                        left: tooltip.x,
                        top: tooltip.y,
                    }}
                >
                    <span className="heatmap-tooltip-date">{formatDate(tooltip.date)}</span>
                    <span className="heatmap-tooltip-value">{formatMins(tooltip.mins)}</span>
                    <span className="heatmap-tooltip-band">{BANDS[bandIndex(tooltip.mins)].label}</span>
                </div>
            )}

            {/* Legend */}
            <div className="heatmap-legend">
                <span className="heatmap-legend-text">Less</span>
                {palette.map((cls, i) => (
                    <div key={i} className={`heatmap-cell-new heatmap-legend-cell ${cls}`} />
                ))}
                <span className="heatmap-legend-text">More</span>
            </div>
        </div>
    )
}
