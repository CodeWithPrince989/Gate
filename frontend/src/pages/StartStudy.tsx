import { useState, useRef, useCallback, useEffect } from 'react'
import { Play, Pause, Square, Check, Maximize, Minimize } from 'lucide-react'
import SEO from '../components/SEO'
import { saveSession } from '../api/api'

const SUBJECTS = [
    { code: 'DSA', name: 'Data Structures & Algorithms' },
    { code: 'OS', name: 'Operating Systems' },
    { code: 'COA', name: 'Computer Organization' },
    { code: 'DBMS', name: 'Database Management' },
    { code: 'DL', name: 'Digital Logic' },
    { code: 'MATHS', name: 'Engineering Mathematics' },
    { code: 'CN', name: 'Computer Networks' },
    { code: 'TOC', name: 'Theory of Computation' },
    { code: 'CD', name: 'Compiler Design' },
    { code: 'SE', name: 'Software Engineering' },
    { code: 'APT', name: 'Aptitude' },
]
const TYPES = ['Theory', 'Practice', 'Lecture', 'Revision']

function pad(n: number) { return String(n).padStart(2, '0') }

export default function StartStudy() {
    const [seconds, setSeconds] = useState(0)
    const [running, setRunning] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState('')
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const secondsRef = useRef(0)

    const [subject, setSubject] = useState('DSA')
    const [studyType, setStudyType] = useState('Theory')
    const [questions, setQuestions] = useState(0)
    const [lectureMin, setLectureMin] = useState(0)
    const [notes, setNotes] = useState(false)

    const containerRef = useRef<HTMLDivElement>(null)
    const [isFullscreen, setIsFullscreen] = useState(false)

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement)
        }
        document.addEventListener('fullscreenchange', handleFullscreenChange)
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }, [])

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`)
            })
        } else {
            document.exitFullscreen()
        }
    }

    const start = useCallback(() => {
        if (running) return
        setRunning(true)
        setShowForm(false)
        intervalRef.current = setInterval(() => {
            secondsRef.current += 1
            setSeconds(secondsRef.current)
        }, 1000)
    }, [running])

    const pause = useCallback(() => {
        if (!running) return
        setRunning(false)
        if (intervalRef.current) clearInterval(intervalRef.current)
    }, [running])

    const stop = useCallback(() => {
        if (secondsRef.current === 0) return
        setRunning(false)
        if (intervalRef.current) clearInterval(intervalRef.current)
        setShowForm(true)
    }, [])

    const handleSave = async () => {
        setSaving(true)
        try {
            await saveSession({
                subject,
                study_type: studyType,
                duration_seconds: secondsRef.current,
                questions_solved: questions,
                lecture_minutes: lectureMin,
                notes_created: notes,
            })
            setToast('Session saved ✓')
            secondsRef.current = 0; setSeconds(0); setShowForm(false)
            setQuestions(0); setLectureMin(0); setNotes(false)
            setTimeout(() => setToast(''), 3000)
        } catch {
            setToast('Error saving')
            setTimeout(() => setToast(''), 3000)
        } finally { setSaving(false) }
    }

    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60

    return (
        <div
            ref={containerRef}
            className={`${isFullscreen ? 'flex flex-col items-center justify-center p-6 space-y-10 h-screen w-screen max-w-none overflow-y-auto' : 'max-w-xl mx-auto space-y-10'}`}
            style={{ backgroundColor: isFullscreen ? 'var(--app-bg)' : 'transparent' }}
        >
            <SEO
                title="Study Timer — Log GATE CSE Sessions"
                description="Start a focused GATE CSE study session. Track time, questions solved, and notes for DSA, OS, DBMS, CN, TOC, Compiler Design & more subjects."
                path="/start-study"
                keywords="GATE study timer, GATE session tracker, GATE study log, GATE pomodoro timer"
            />
            {/* Header */}
            <div className={`text-center relative w-full ${isFullscreen ? 'max-w-xl' : ''}`}>
                <button
                    onClick={toggleFullscreen}
                    className={`absolute right-0 top-0 p-2 text-[var(--app-muted)] hover:text-[var(--app-text)] transition-colors ${isFullscreen ? 'right-4 top-4 fixed z-50' : ''}`}
                    title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                    {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                </button>
                <h1 className="page-header-title">Study Timer</h1>
                <p className="page-header-sub">Focus. Track. Grow</p>
            </div>

            {/* Timer */}
            <div className="relative mx-auto w-72 h-72 flex items-center justify-center mt-8 mb-12">
                {/* Glowing backdrop */}
                {running && <div className="absolute inset-0 rounded-full bg-emerald-500/10 blur-3xl animate-pulse-ring" />}

                {/* Outer glass ring */}
                <div className="absolute inset-0 rounded-full border-[6px] border-white/5 backdrop-blur-sm shadow-[inset_0_2px_24px_rgba(255,255,255,0.02)]" />

                {/* SVG Progress Ring */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 288 288">
                    <defs>
                        <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                    <circle cx="144" cy="144" r="134" fill="none"
                        stroke="rgba(0,0,0,0.2)" strokeWidth="6" />
                    {running && (
                        <circle cx="144" cy="144" r="134" fill="none"
                            stroke="url(#timerGrad)" strokeWidth="6"
                            strokeDasharray="842" strokeDashoffset={842 - (seconds % 60) / 60 * 842}
                            strokeLinecap="round"
                            filter="url(#glow)"
                            style={{ transition: 'stroke-dashoffset 1s linear', transform: 'rotate(-90deg)', transformOrigin: 'center' }} />
                    )}
                </svg>

                {/* Text Display */}
                <div className="relative flex flex-col items-center justify-center">
                    <span className="text-[64px] font-bold tracking-tighter tabular-nums font-mono text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 drop-shadow-sm leading-none">
                        {pad(h)}:{pad(m)}:{pad(s)}
                    </span>
                    {running && <span className="theme-soft text-[12px] font-semibold tracking-[0.25em] uppercase mt-3 animate-pulse">Focusing</span>}
                </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-4 relative z-10">
                {!running && seconds === 0 ? (
                    <button onClick={start}
                        className="glass-primary-button flex items-center justify-center gap-3 px-10 py-4 rounded-full text-[15px] font-medium text-white w-56 shadow-[0_12px_32px_rgba(16,185,129,0.3)] transition-all active:scale-[.96]">
                        <Play size={18} fill="currentColor" /> Start Session
                    </button>
                ) : (
                    <div className="flex items-center gap-2 p-1.5 rounded-full glass-segment shadow-xl">
                        <button onClick={running ? pause : start}
                            className={`flex items-center gap-2.5 px-8 py-3 rounded-full text-[14px] font-semibold transition-all ${running ? 'text-white hover:bg-white/10' : 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-white shadow-lg'}`}>
                            {running ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />} {running ? 'Pause' : 'Resume'}
                        </button>
                        <button onClick={stop}
                            className="flex items-center gap-2.5 px-8 py-3 rounded-full text-[14px] font-semibold text-red-400 hover:bg-red-500/10 transition-all">
                            <Square size={16} fill="currentColor" /> End
                        </button>
                    </div>
                )}
            </div>

            {/* Save form */}
            {showForm && (
                <div className="animate-slide-up glass-panel p-6 space-y-5 w-full max-w-md">
                    <div className="text-center">
                        <p className="text-[15px] font-semibold">Save Session</p>
                        <p className="text-[13px] opacity-25 mt-0.5">Duration: {pad(h)}:{pad(m)}:{pad(s)}</p>
                    </div>

                    <div>
                        <label className="section-label block mb-1.5">Subject</label>
                        <select value={subject} onChange={e => setSubject(e.target.value)} className="form-input">
                            {SUBJECTS.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="section-label block mb-1.5">Study Type</label>
                        <select value={studyType} onChange={e => setStudyType(e.target.value)} className="form-input">
                            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="section-label block mb-1.5">Questions Solved</label>
                            <input type="number" value={questions} onChange={e => setQuestions(+e.target.value)} min={0} className="form-input" />
                        </div>
                        <div>
                            <label className="section-label block mb-1.5">Lecture Minutes</label>
                            <input type="number" value={lectureMin} onChange={e => setLectureMin(+e.target.value)} min={0} className="form-input" />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <input type="checkbox" checked={notes} onChange={e => setNotes(e.target.checked)}
                            className="w-4 h-4 rounded bg-white/5 border-white/10 text-emerald-500" />
                        <label className="text-[13px] opacity-50">Notes created</label>
                    </div>

                    <button onClick={handleSave} disabled={saving}
                        className="w-full py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white text-[13px] font-medium transition-all disabled:opacity-50 active:scale-[.98]">
                        <Check size={14} className="inline mr-1.5" />
                        {saving ? 'Saving…' : 'Save Session'}
                    </button>
                </div>
            )}

            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 bg-emerald-500 text-white px-5 py-3 rounded-full text-[13px] font-medium shadow-xl animate-slide-up ${isFullscreen ? 'bottom-10 right-10' : ''}`}>
                    {toast}
                </div>
            )}
        </div>
    )
}
