import { useEffect } from 'react'
import { TreePine } from 'lucide-react'

interface Props {
    onLogin: (user: { id: number; username: string; email: string }) => void
}

export default function OAuthCallback({ onLogin }: Props) {
    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const oauth = params.get('oauth')

        if (oauth === 'success') {
            const user = {
                id: Number(params.get('id')),
                username: params.get('username') || '',
                email: params.get('email') || '',
            }
            localStorage.setItem('gate-user', JSON.stringify(user))
            onLogin(user)
            // Clean URL
            window.history.replaceState({}, '', '/')
        } else {
            // OAuth failed — redirect to login
            const error = params.get('error') || 'unknown'
            console.error('OAuth failed:', error)
            window.location.href = '/'
        }
    }, [onLogin])

    return (
        <div className="app-shell min-h-screen flex flex-col items-center justify-center gap-4">
            <div className="glass-primary-button flex h-14 w-14 items-center justify-center rounded-[22px] text-white">
                <TreePine size={24} className="text-white" />
            </div>
            <div className="theme-spinner w-5 h-5 border-2 rounded-full animate-spin" />
            <p className="theme-soft text-sm">Signing you in…</p>
        </div>
    )
}
