import { useState, useEffect, useCallback } from 'react'
import { ChevronDown, ChevronRight, BookOpen, Clock, Play, CheckCircle2, RotateCcw } from 'lucide-react'
import SEO from '../components/SEO'
import {
    type Video, type Subject,
    SUBJECTS,
    loadSubjectVideos, formatDuration, cleanTitle,
    partitionIntoDays, getWatched, setWatched,
} from '../data/resources'

const SPEEDS = [1, 1.25, 1.5, 1.75, 2]

export default function Resources() {
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
    const [videos, setVideos] = useState<Video[]>([])
    const [loading, setLoading] = useState(false)
    const [dailyHours, setDailyHours] = useState(2)
    const [speed, setSpeed] = useState(1.5)
    const [expandedDay, setExpandedDay] = useState<number | null>(0)
    const [watched, setWatchedState] = useState<Set<string>>(new Set())

    // Load videos when subject changes
    useEffect(() => {
        if (!selectedSubject) return
        setLoading(true)
        loadSubjectVideos(selectedSubject.dataFile)
            .then(vids => {
                setVideos(vids)
                setWatchedState(getWatched(selectedSubject.code))
                setExpandedDay(0)
            })
            .finally(() => setLoading(false))
    }, [selectedSubject])

    const toggleWatched = useCallback((videoIndex: string) => {
        if (!selectedSubject) return
        setWatchedState(prev => {
            const next = new Set(prev)
            if (next.has(videoIndex)) next.delete(videoIndex)
            else next.add(videoIndex)
            setWatched(selectedSubject.code, next)
            return next
        })
    }, [selectedSubject])

    const resetProgress = useCallback(() => {
        if (!selectedSubject) return
        const empty = new Set<string>()
        setWatchedState(empty)
        setWatched(selectedSubject.code, empty)
    }, [selectedSubject])

    // Compute days
    const effectiveSecondsPerDay = dailyHours * 3600 / speed
    const days = partitionIntoDays(videos, effectiveSecondsPerDay)
    const totalSeconds = videos.reduce((s, v) => s + v.videoDurationInSeconds, 0)
    const watchedCount = watched.size
    const totalCount = videos.length
    const progressPct = totalCount > 0 ? Math.round((watchedCount / totalCount) * 100) : 0

    return (
        <div className="space-y-8">
            <SEO
                title="GATE CSE Study Resources — Curated Lectures & Playlists"
                description="Curated YouTube lectures and subject playlists for GATE CSE 2027 — DSA, OS, DBMS, CN, TOC, Compiler Design & more. Organize into daily study plans with progress tracking."
                path="/resources"
                keywords="GATE CSE resources, GATE YouTube lectures, GATE DSA playlist, GATE OS videos, GATE study material free, GATE subject wise resources"
            />
            {/* Header */}
            <div>
                <h1 className="page-header-title flex items-center gap-3">
                    <BookOpen size={28} className="text-emerald-400" />
                    Study Resources
                </h1>
                <p className="page-header-sub">
                    Curated lectures, structured playlists, and recommended channels for your GATE workflow
                </p>
            </div>

            {/* Subject Grid */}
            <div>
                <p className="section-label mb-3">Choose a Subject</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {SUBJECTS.map(sub => (
                        <button
                            key={sub.code}
                            onClick={() => setSelectedSubject(sub)}
                            className={`
                text-left p-4 rounded-xl border transition-all duration-200
                hover:scale-[1.02] active:scale-[0.98]
                ${selectedSubject?.code === sub.code
                                    ? 'border-emerald-500/50 bg-emerald-500/10 shadow-lg shadow-emerald-500/5'
                                    : 'border-white/[.06] bg-white/[.02] hover:bg-white/[.04] hover:border-white/[.12]'
                                }
              `}
                        >

                            <p className="text-[13px] font-medium mt-2 leading-tight">{sub.name}</p>
                            {selectedSubject?.code === sub.code && (
                                <div className="mt-2 flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    <span className="text-[10px] text-emerald-400 font-medium">ACTIVE</span>
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Study Planner */}
            {selectedSubject && (
                <div className="animate-slide-up space-y-6">
                    {/* Planner Header */}
                    <div className="glass-panel p-5">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div>
                                <h2 className="text-[20px] font-semibold flex items-center gap-2">
                                    <span className="text-2xl">{selectedSubject.icon}</span>
                                    {selectedSubject.name}
                                </h2>
                                {loading ? (
                                    <p className="text-[12px] opacity-30 mt-1">Loading videos...</p>
                                ) : (
                                    <p className="text-[12px] opacity-30 mt-1">
                                        {totalCount} videos • {formatDuration(totalSeconds)} total at 1x
                                    </p>
                                )}
                            </div>

                            {/* Controls */}
                            <div className="flex flex-wrap items-center gap-4">
                                <div>
                                    <label className="text-[10px] uppercase tracking-wider opacity-30 block mb-1">Daily Hours</label>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5, 6].map(h => (
                                            <button
                                                key={h}
                                                onClick={() => setDailyHours(h)}
                                                className={`
                          w-8 h-8 rounded-lg text-[12px] font-medium transition-all
                          ${dailyHours === h
                                                        ? 'bg-emerald-500 text-white'
                                                        : 'bg-white/[.04] hover:bg-white/[.08] text-white/50'
                                                    }
                        `}
                                            >
                                                {h}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] uppercase tracking-wider opacity-30 block mb-1">Speed</label>
                                    <div className="flex gap-1">
                                        {SPEEDS.map(s => (
                                            <button
                                                key={s}
                                                onClick={() => setSpeed(s)}
                                                className={`
                          px-2.5 h-8 rounded-lg text-[11px] font-medium transition-all
                          ${speed === s
                                                        ? 'bg-violet-500 text-white'
                                                        : 'bg-white/[.04] hover:bg-white/[.08] text-white/50'
                                                    }
                        `}
                                            >
                                                {s}x
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats Row */}
                        {!loading && totalCount > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                                <div className="bg-white/[.03] rounded-lg p-3 text-center">
                                    <p className="text-[22px] font-semibold text-emerald-400">{days.length}</p>
                                    <p className="text-[10px] opacity-30 mt-0.5">Days to Complete</p>
                                </div>
                                <div className="bg-white/[.03] rounded-lg p-3 text-center">
                                    <p className="text-[22px] font-semibold text-violet-400">
                                        {formatDuration(Math.round(totalSeconds / speed))}
                                    </p>
                                    <p className="text-[10px] opacity-30 mt-0.5">At {speed}x Speed</p>
                                </div>
                                <div className="bg-white/[.03] rounded-lg p-3 text-center">
                                    <p className="text-[22px] font-semibold text-cyan-400">{watchedCount}/{totalCount}</p>
                                    <p className="text-[10px] opacity-30 mt-0.5">Videos Watched</p>
                                </div>
                                <div className="bg-white/[.03] rounded-lg p-3 text-center relative overflow-hidden">
                                    <p className="text-[22px] font-semibold">{progressPct}%</p>
                                    <p className="text-[10px] opacity-30 mt-0.5">Progress</p>
                                    <div
                                        className="absolute bottom-0 left-0 h-1 bg-emerald-500 transition-all duration-500"
                                        style={{ width: `${progressPct}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Reset */}
                        {watchedCount > 0 && (
                            <button
                                onClick={resetProgress}
                                className="mt-3 flex items-center gap-1.5 text-[11px] opacity-30 hover:opacity-60 transition-opacity"
                            >
                                <RotateCcw size={12} /> Reset progress
                            </button>
                        )}
                    </div>

                    {/* Day Accordions */}
                    {!loading && days.map((dayVideos, dayIndex) => {
                        const dayWatched = dayVideos.filter(v => watched.has(v.index)).length
                        const dayTotal = dayVideos.length
                        const dayPct = Math.round((dayWatched / dayTotal) * 100)
                        const daySeconds = dayVideos.reduce((s, v) => s + v.videoDurationInSeconds, 0)
                        const isOpen = expandedDay === dayIndex

                        return (
                            <div key={dayIndex} className="glass-panel overflow-hidden">
                                {/* Day Header */}
                                <button
                                    onClick={() => setExpandedDay(isOpen ? null : dayIndex)}
                                    className="w-full flex items-center justify-between p-4 hover:bg-white/[.02] transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        {isOpen ? <ChevronDown size={16} className="opacity-40" /> : <ChevronRight size={16} className="opacity-40" />}
                                        <span className="text-[14px] font-medium">Day {dayIndex + 1}</span>
                                        <span className="text-[11px] opacity-25">
                                            {dayTotal} videos • {formatDuration(Math.round(daySeconds / speed))}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {dayPct === 100 && (
                                            <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                                DONE ✓
                                            </span>
                                        )}
                                        <div className="w-24 h-1.5 bg-white/[.06] rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-300 ${dayPct === 100 ? 'bg-emerald-400' : 'bg-violet-400'
                                                    }`}
                                                style={{ width: `${dayPct}%` }}
                                            />
                                        </div>
                                        <span className="text-[11px] opacity-30 w-8 text-right">{dayPct}%</span>
                                    </div>
                                </button>

                                {/* Video List */}
                                {isOpen && (
                                    <div className="border-t border-white/[.04]">
                                        {dayVideos.map(video => {
                                            const isWatched = watched.has(video.index)
                                            return (
                                                <div
                                                    key={video.index}
                                                    className={`
                            flex items-center gap-4 p-3 px-5
                            border-b border-white/[.03] last:border-b-0
                            transition-all
                            ${isWatched ? 'opacity-40' : 'hover:bg-white/[.02]'}
                          `}
                                                >
                                                    {/* Checkbox */}
                                                    <button
                                                        onClick={() => toggleWatched(video.index)}
                                                        className="flex-shrink-0"
                                                    >
                                                        {isWatched ? (
                                                            <CheckCircle2 size={20} className="text-emerald-400" />
                                                        ) : (
                                                            <div className="w-5 h-5 rounded-full border-2 border-white/10 hover:border-emerald-400 transition-colors" />
                                                        )}
                                                    </button>

                                                    {/* Thumbnail */}
                                                    <a
                                                        href={video.videoLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="relative flex-shrink-0 w-28 h-16 rounded-lg overflow-hidden group"
                                                    >
                                                        <img
                                                            src={video.thumbnailUrl}
                                                            alt=""
                                                            className="w-full h-full object-cover"
                                                            loading="lazy"
                                                        />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                            <Play size={20} className="text-white" fill="white" />
                                                        </div>
                                                        <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] px-1 rounded">
                                                            {video.videoTime.trim()}
                                                        </span>
                                                    </a>

                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <a
                                                            href={video.videoLink}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={`text-[13px] font-medium leading-snug hover:text-emerald-400 transition-colors block truncate ${isWatched ? 'line-through' : ''
                                                                }`}
                                                        >
                                                            {cleanTitle(video.videoTitle)}
                                                        </a>
                                                        <p className="text-[11px] opacity-25 mt-0.5">
                                                            {video.channelName} • {video.views}
                                                        </p>
                                                    </div>

                                                    {/* Duration */}
                                                    <div className="flex-shrink-0 flex items-center gap-1 text-[11px] opacity-30">
                                                        <Clock size={12} />
                                                        {formatDuration(Math.round(video.videoDurationInSeconds / speed))}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}


        </div>
    )
}
