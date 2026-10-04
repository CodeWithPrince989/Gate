import { useState, useEffect } from 'react'
import { Link, Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import BreakReminder from './BreakReminder'

interface User {
    id: number
    username: string
    email: string
}

interface Props {
    user: User
    onLogout: () => void
}

export default function Layout({ user, onLogout }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [dark, setDark] = useState(true)

    useEffect(() => {
        const saved = localStorage.getItem('gate-dark')
        if (saved !== null) setDark(saved === 'true')
    }, [])

    useEffect(() => {
        localStorage.setItem('gate-dark', String(dark))
        document.documentElement.className = dark ? 'dark' : 'light'
    }, [dark])

    return (
        <div className="app-shell min-h-screen flex overflow-x-hidden">
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={onLogout} user={user} />

            <div className="flex-1 min-w-0 flex flex-col lg:ml-[260px] min-h-screen">
                <TopBar
                    onMenuClick={() => setSidebarOpen(true)}
                    dark={dark}
                    onToggleDark={() => setDark(d => !d)}
                    user={user}
                />
                <main className="flex-1 min-w-0 px-4 py-6 md:px-10 md:py-10 mx-auto animate-page-enter max-w-[1400px] w-full">
                    <Outlet />
                </main>
                <footer className="app-footer border-t px-6 py-4 text-[11px]">
                    <div className="flex flex-col gap-2 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
                        <p className="theme-soft">
                            Made with ♥ by <span className="font-medium gradient-text">Satya Sarthak Manohari</span>
                        </p>
                        <div className="flex items-center justify-center gap-4 sm:justify-end theme-soft">
                            <Link to="/about" className="footer-link hover:opacity-70">About Us</Link>
                            <Link to="/contact" className="footer-link hover:opacity-70">Contact Us</Link>
                        </div>
                    </div>
                </footer>
            </div>

            <BreakReminder />
        </div>
    )
}
