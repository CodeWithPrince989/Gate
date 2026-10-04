import { NavLink } from 'react-router-dom'
import {
    LayoutDashboard, Timer, BarChart3, History, Download, X, LogOut, TrendingUp, BookOpen, MessageSquare, MessagesSquare, Newspaper, Video, Sparkles
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
    { to: '/assistant', label: 'Vistra AI', icon: MessageSquare, badge: 'AI' },
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
                    <div className="flex items-center gap-3 group cursor-default">
                        <div className="relative">
                            <img src="/logo.png" alt="GateTracker Logo" className="w-9 h-9 rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-4deg]" />
                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[var(--chrome-bg)]" />
                        </div>
                        <div>
                            <span className="text-[15px] font-semibold tracking-tight">GateTracker</span>
                            <span className="theme-soft block text-[10px] tracking-[0.15em] uppercase flex items-center gap-1">
                                <Sparkles size={8} className="text-emerald-400" />
                                Study Intelligence
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} className="theme-ghost-button lg:hidden p-1.5 rounded-lg hover:rotate-90 transition-transform duration-300">
                        <X size={16} />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto sidebar-nav-scroll">
                    <p className="section-label px-3 mb-3 flex items-center gap-2">
                        <span>Navigation</span>
                        <div className="flex-1 h-px bg-gradient-to-r from-[var(--divider)] to-transparent" />
                    </p>
                    {links.map((l, i) => (
                        <NavLink
                            key={l.to}
                            to={l.to}
                            onClick={onClose}
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                            style={{ animationDelay: `${i * 30}ms` }}
                        >
                            <l.icon size={16} strokeWidth={1.8} />
                            <span className="flex-1">{l.label}</span>
                            {'badge' in l && l.badge && (
                                <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-400 border border-emerald-500/20">
                                    {l.badge}
                                </span>
                            )}
                        </NavLink>
                    ))}

                    <div className="relative h-px my-4 mx-3">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--divider)] to-transparent" />
                    </div>
                    <p className="section-label px-3 mb-3 flex items-center gap-2">
                        <span>Actions</span>
                        <div className="flex-1 h-px bg-gradient-to-r from-[var(--divider)] to-transparent" />
                    </p>

                    <a href={getExportUrl()} className="nav-link group" target="_blank" rel="noopener noreferrer">
                        <Download size={16} strokeWidth={1.8} />
                        <span className="flex-1">Export CSV</span>
                        <span className="text-[10px] opacity-0 group-hover:opacity-30 transition-opacity">↗</span>
                    </a>
                </nav>

                {/* User + Logout */}
                <div className={`px-4 py-4 border-t border-inherit`}>
                    <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="user-avatar-ring flex-shrink-0">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold theme-muted">
                                    {user.username.charAt(0).toUpperCase()}
                                </div>
                            </div>
                            <div className="min-w-0">
                                <p className="text-[13px] font-medium leading-tight truncate">{user.username}</p>
                                <p className="theme-soft text-[11px] truncate max-w-[140px]" title={user.email}>{user.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={onLogout}
                            className="theme-ghost-button p-2 rounded-lg transition-all hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 hover:scale-110 active:scale-95"
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
