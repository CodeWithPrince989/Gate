import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'

/**
 * Break Reminder: shows a toast notification every 50 minutes
 * reminding the user to take a break.
 */
export default function BreakReminder() {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const interval = setInterval(() => {
            setVisible(true)
            // Auto-hide after 15 seconds
            setTimeout(() => setVisible(false), 15000)
        }, 50 * 60 * 1000) // 50 minutes

        return () => clearInterval(interval)
    }, [])

    if (!visible) return null

    return (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
            <div className="glass-toast flex max-w-sm items-center gap-3 rounded-[22px] px-6 py-4">
                <div className="glass-primary-button flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl text-white">
                    <AlertTriangle size={20} className="flex-shrink-0" />
                </div>
                <div>
                    <p className="font-bold">Time for a break! ☕</p>
                    <p className="theme-soft text-sm">You've been studying for 50 minutes. Rest for 10 min.</p>
                </div>
                <button
                    onClick={() => setVisible(false)}
                    className="theme-ghost-button ml-3 rounded-full px-2 text-xl leading-none"
                >
                    ×
                </button>
            </div>
        </div>
    )
}
