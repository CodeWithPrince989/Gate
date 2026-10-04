import { NavLink } from 'react-router-dom'
import {
    LayoutDashboard, Timer, BarChart3, History, Download, X, LogOut, TrendingUp, BookOpen, MessageSquare, MessagesSquare, Newspaper, Video
} from 'lucide-react'
import { getExportUrl } from '../api/api'

interface User {
    id: number
    username: string
    email: string
}

interface Props {
    open: boolean
    onClose: () => void
    onLogout: () => void
    user: User
}

const links = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/start-study', label: 'Start Study', icon: Timer },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/progress', label: 'Progress', icon: TrendingUp },
    { to: '/journey', label: 'My Journey', icon: Video },
    { to: '/assistant', label: 'Vistra AI', icon: MessageSquare },
    { to: '/feedback', label: 'Feedback', icon: MessagesSquare },
    { to: '/resources', label: 'Resources', icon: BookOpen },
    { to: '/news-blogs', label: 'News & Blogs', icon: Newspaper },
    { to: '/history', label: 'History', icon: History },
]

export default function Sidebar({ open, onClose, onLogout, user }: Props) {
    const overlay = open ? 'fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden' : 'hidden'
    const sidebarCls = `app-sidebar fixed inset-y-0 left-0 z-50 w-[260px] flex flex-col border-r transition-transform duration-300 ease-out ${open ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`

    return (
        <>
            <div className={overlay} onClick={onClose} />

            <aside className={sidebarCls}>
                {/* Logo */}
                <div className="flex items-center justify-between px-6 py-6 border-b border-inherit">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <img src="/logo.png" alt="GateTracker Logo" className="w-9 h-9 rounded-xl shadow-sm" />
                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[var(--chrome-bg)]" />
                        </div>
                        <div>
                            <span className="text-[15px] font-semibold tracking-tight">GateTracker</span>
                            <span className="theme-soft block text-[10px] tracking-[0.15em] uppercase">
                                Study Intelligence
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} className="theme-ghost-button lg:hidden p-1.5 rounded-lg">
                        <X size={16} />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
                    <p className="section-label px-3 mb-3">Navigation</p>
                    {links.map((l, i) => (
                        <NavLink
                            key={l.to}
                            to={l.to}
                            onClick={onClose}
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                            style={{ animationDelay: `${i * 30}ms` }}
                        >
                            <l.icon size={16} strokeWidth={1.8} />
                            {l.label}
                        </NavLink>
                    ))}

                    <div className="theme-divider-bg h-px my-4 mx-3" />
                    <p className="section-label px-3 mb-3">Actions</p>

                    <a href={getExportUrl()} className="nav-link" target="_blank" rel="noopener noreferrer">
                        <Download size={16} strokeWidth={1.8} />
                        Export CSV
                    </a>
                </nav>

                {/* User + Logout */}
                <div className={`px-4 py-4 border-t border-inherit`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="user-avatar-ring">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold theme-muted">
                                    {user.username.charAt(0).toUpperCase()}
                                </div>
                            </div>
                            <div>
                                <p className="text-[13px] font-medium leading-tight">{user.username}</p>
                                <p className="theme-soft text-[11px]">{user.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={onLogout}
                            className="theme-ghost-button p-2 rounded-lg transition-all hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10"
                            title="Sign out"
                        >
                            <LogOut size={15} />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    )
}
