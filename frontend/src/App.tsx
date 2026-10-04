import { useState, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import StartStudy from './pages/StartStudy'
import Analytics from './pages/Analytics'
import History from './pages/History'
import Progress from './pages/Progress'
import Resources from './pages/Resources'
import NewsBlogs from './pages/NewsBlogs'
import Assistant from './pages/Assistant'
import Feedback from './pages/Feedback'
import Login from './pages/Login'
import OAuthCallback from './pages/OAuthCallback'
import About from './pages/About'
import Contact from './pages/Contact'
import Journey from './pages/Journey'
import CommandCenter from './features/command-center/CommandCenter'
import { clearCachedDashboard } from './utils/dashboardCache'
import { API_BASE, fetchWithCsrf } from './api/api'

interface User {
  id: number
  username: string
  email: string
}

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [checking, setChecking] = useState(true)

  // Check for stored user on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('gate-dark')
    document.documentElement.className = savedTheme === 'false' ? 'light' : 'dark'

    const stored = localStorage.getItem('gate-user')
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch { /* ignore */ }
    }
    setChecking(false)
  }, [])

  const handleLogin = (u: User) => {
    setUser(u)
    localStorage.setItem('gate-user', JSON.stringify(u))
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('gate-user')
    clearCachedDashboard()
    fetchWithCsrf(`${API_BASE}/api/auth/logout/`, { method: 'POST' }).catch(() => { })
  }

  if (checking) {
    return (
      <div className="app-shell min-h-screen flex items-center justify-center">
        <div className="theme-spinner w-5 h-5 border-2 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/oauth/callback" element={<OAuthCallback onLogin={handleLogin} />} />
        <Route path="/about" element={<About user={user} />} />
        <Route path="/contact" element={<Contact user={user} />} />
        <Route path="/journey" element={<Journey user={user} />} />

        {!user ? (
          <>
            <Route path="/" element={<Login onLogin={handleLogin} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          <>
            <Route path="/" element={<CommandCenter />} />
            <Route path="/planner" element={<CommandCenter />} />
            <Route path="/calendar" element={<CommandCenter />} />
            <Route path="/syllabus" element={<CommandCenter />} />
            <Route path="/pyqs" element={<CommandCenter />} />
            <Route path="/revision" element={<CommandCenter />} />
            <Route path="/mistakes" element={<CommandCenter />} />
            <Route path="/tests" element={<CommandCenter />} />
            <Route path="/timer" element={<CommandCenter />} />
            <Route path="/command-analytics" element={<CommandCenter />} />
            <Route path="/weekly-review" element={<CommandCenter />} />
            <Route path="/goals" element={<CommandCenter />} />
            <Route path="/settings" element={<CommandCenter />} />
            <Route element={<Layout user={user} onLogout={handleLogout} />}>
              <Route path="/start-study" element={<StartStudy />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/assistant" element={<Assistant />} />
              <Route path="/feedback" element={<Feedback />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/news-blogs" element={<NewsBlogs />} />
              <Route path="/history" element={<History />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  )
}
