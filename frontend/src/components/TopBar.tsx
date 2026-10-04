import { useEffect, useState } from 'react'
import { Menu, Sun, Moon, Flame, Zap } from 'lucide-react'
import { DASHBOARD_UPDATED_EVENT, readCachedDashboard } from '../utils/dashboardCache'

interface User {
    id: number
    username: string
    email: string
}

interface Props {
    onMenuClick: () => void
    dark: boolean
    onToggleDark: () => void
    user: User
}

function getGreeting(): string {
    const h = new Date().getHours()
    if (h < 5) return 'Burning the midnight oil'
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    if (h < 21) return 'Good evening'
    return 'Night owl mode'
}

function getMotivation(): string {
    const motivations = [
        'Keep the streak alive 🔥',
        'Consistency is key 🗝️',
        'One step closer to GATE 🎯',
        'Focus. Learn. Repeat 📚',
        'Your future self will thank you 💪',
    ]
    return motivations[new Date().getDate() % motivations.length]
}

export default function TopBar({ onMenuClick, dark, onToggleDark, user }: Props) {
    const [streak, setStreak] = useState(() => readCachedDashboard()?.current_streak ?? 0)
    const [dateStr, setDateStr] = useState('')
    const [greeting, setGreeting] = useState(getGreeting)
    const [motivation, setMotivation] = useState(getMotivation)

    useEffect(() => {
        setDateStr(new Date().toLocaleDateString('en-IN', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        }))
        setGreeting(getGreeting())
        setMotivation(getMotivation())
    }, [])

    useEffect(() => {
        const handleDashboardUpdate = (event: Event) => {
            const detail = (event as CustomEvent<{ current_streak?: number }>).detail
            if (typeof detail?.current_streak === 'number') {
                setStreak(detail.current_streak)
            }
        }

        window.addEventListener(DASHBOARD_UPDATED_EVENT, handleDashboardUpdate)
        return () => window.removeEventListener(DASHBOARD_UPDATED_EVENT, handleDashboardUpdate)
    }, [])

    return (
        <header className="app-topbar sticky top-0 z-30 border-b px-4 py-3 md:px-6 md:py-3.5 flex items-center justify-between">
            {/* Subtle gradient line at bottom */}
            <div className="topbar-gradient-line" />

            <div className="flex items-center gap-4">
                <button onClick={onMenuClick} className="theme-ghost-button lg:hidden p-2 rounded-lg active:scale-90 transition-transform">
                    <Menu size={18} />
                </button>
                <div className="hidden md:block">
                    <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium">{greeting}, <span className="gradient-text font-semibold">{user.username}</span></span>
                        <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/8 text-[10px] text-emerald-400/70">
                            <Zap size={9} />
                            {motivation}
                        </span>
                    </div>
                    <span className="theme-soft block text-[11px] mt-0.5 flex items-center gap-1.5">
                        <span className="live-dot" />
                        {dateStr}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
                {/* Streak */}
                <div className={`streak-badge ${streak > 0 ? 'has-streak' : ''} flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${dark ? 'bg-orange-500/8 text-orange-400/80' : 'bg-orange-50 text-orange-600'
                    }`}>
                    <Flame size={13} className={`${streak > 0 ? 'text-orange-400' : ''} transition-transform`} />
                    <span className="tabular-nums">{streak} day{streak !== 1 ? 's' : ''}</span>
                </div>

                {/* Dark/Light toggle */}
                <button
                    onClick={onToggleDark}
                    className="theme-toggle-btn theme-ghost-button p-2 rounded-full relative overflow-hidden"
                    title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                    <div className={`transition-all duration-500 ${dark ? 'rotate-0 scale-100' : 'rotate-180 scale-0 absolute'}`}>
                        {dark && <Sun size={16} />}
                    </div>
                    <div className={`transition-all duration-500 ${!dark ? 'rotate-0 scale-100' : '-rotate-180 scale-0 absolute'}`}>
                        {!dark && <Moon size={16} />}
                    </div>
                </button>
            </div>
        </header>
    )
}
