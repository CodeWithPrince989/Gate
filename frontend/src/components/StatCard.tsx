import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'

interface Props {
    label: string
    value: string | number
    sub?: string
    icon: ReactNode
    iconBg: string
}

/** Animate a number counting up from 0 */
function useCountUp(target: number, duration = 800) {
    const [current, setCurrent] = useState(0)
    const prevTarget = useRef(target)

    useEffect(() => {
        if (target === prevTarget.current && current !== 0) return
        prevTarget.current = target

        const start = performance.now()
        const from = 0

        function tick(now: number) {
            const elapsed = now - start
            const progress = Math.min(elapsed / duration, 1)
            // Ease out cubic
            const ease = 1 - Math.pow(1 - progress, 3)
            setCurrent(Math.round(from + (target - from) * ease))
            if (progress < 1) requestAnimationFrame(tick)
        }

        requestAnimationFrame(tick)
    }, [target, duration])

    return current
}

export default function StatCard({ label, value, sub, icon, iconBg }: Props) {
    // Extract numeric part for count-up animation
    const numericMatch = String(value).match(/^([\d.]+)(.*)$/)
    const numericValue = numericMatch ? parseFloat(numericMatch[1]) : 0
    const suffix = numericMatch ? numericMatch[2] : String(value)
    const isNumeric = numericMatch !== null && !isNaN(numericValue)
    const animatedValue = useCountUp(isNumeric ? numericValue : 0)

    // Display logic: use animated value for numbers, raw value for strings
    const displayValue = isNumeric
        ? `${numericValue % 1 !== 0 ? (animatedValue / 1).toFixed(1) : animatedValue}${suffix}`
        : value

    return (
        <div className="stat-card group animate-fade-in">
            {/* Shimmer sweep layer */}
            <div className="stat-card-shimmer" />
            {/* Top highlight */}
            <div className="stat-card-highlight" />

            <div className="flex items-center justify-between mb-4">
                <span className="section-label">{label}</span>
                <div className={`stat-card-icon-ring w-9 h-9 rounded-xl flex items-center justify-center ${iconBg} transition-all duration-300 group-hover:scale-110 group-hover:rotate-[-8deg] group-hover:shadow-lg`}>
                    {icon}
                </div>
            </div>
            <p className="text-[28px] font-semibold tracking-tight leading-none tabular-nums transition-all duration-300">
                {displayValue}
            </p>
            {sub && (
                <p className="text-[12px] theme-soft mt-1.5 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 rounded-full bg-emerald-400/50" />
                    {sub}
                </p>
            )}
        </div>
    )
}
