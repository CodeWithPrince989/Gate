/**
 * GATE Study Resources — Video data + channel recommendations.
 *
 * Video data is loaded dynamically from JSON files in /data/ folder.
 * Channels are hardcoded below.
 */

export interface Video {
    index: string
    thumbnailUrl: string
    videoTitle: string
    videoLink: string
    channelName: string
    views: string
    uploadedTime: string
    videoTime: string
    videoDurationInSeconds: number
}

export interface Subject {
    code: string
    name: string
    icon: string
    color: string
    dataFile: string
}

export interface Channel {
    name: string
    url: string
    thumbnail: string
    description: string
}

// ── Subjects ────────────────────────────────────
export const SUBJECTS: Subject[] = [
    { code: 'os', name: 'Operating Systems', icon: '🖥️', color: 'from-blue-500/20 to-blue-600/5', dataFile: 'os' },
    { code: 'dsa', name: 'Data Structures & Algorithms', icon: '🌲', color: 'from-emerald-500/20 to-emerald-600/5', dataFile: 'dsa' },
    { code: 'dbms', name: 'Database Management', icon: '🗃️', color: 'from-violet-500/20 to-violet-600/5', dataFile: 'dbms' },
    { code: 'cn', name: 'Computer Networks', icon: '🌐', color: 'from-cyan-500/20 to-cyan-600/5', dataFile: 'cn' },
    { code: 'toc', name: 'Theory of Computation', icon: '🤖', color: 'from-rose-500/20 to-rose-600/5', dataFile: 'toc' },
    { code: 'coa', name: 'Computer Organization', icon: '⚙️', color: 'from-amber-500/20 to-amber-600/5', dataFile: 'coa' },
    { code: 'dl', name: 'Digital Logic', icon: '🔌', color: 'from-yellow-500/20 to-yellow-600/5', dataFile: 'dl' },
    { code: 'cd', name: 'Compiler Design', icon: '📝', color: 'from-pink-500/20 to-pink-600/5', dataFile: 'cd' },
    { code: 'algo', name: 'Algorithms', icon: '📊', color: 'from-indigo-500/20 to-indigo-600/5', dataFile: 'algo' },
    { code: 'dm', name: 'Discrete Mathematics', icon: '🔢', color: 'from-teal-500/20 to-teal-600/5', dataFile: 'dm' },
    { code: 'em', name: 'Engineering Mathematics', icon: '📐', color: 'from-orange-500/20 to-orange-600/5', dataFile: 'em' },
    { code: 'ds', name: 'Data Structures', icon: '📦', color: 'from-lime-500/20 to-lime-600/5', dataFile: 'ds' },
    { code: 'cp', name: 'C Programming', icon: '💻', color: 'from-sky-500/20 to-sky-600/5', dataFile: 'cp' },
    { code: 'a', name: 'Aptitude', icon: '🧠', color: 'from-fuchsia-500/20 to-fuchsia-600/5', dataFile: 'a' },
]

// ── Recommended Channels ─────────────────────────
export const CHANNELS: Channel[] = [
    {
        name: 'Knowledge Gate',
        url: 'https://www.youtube.com/@KnowledgeGatee',
        thumbnail: 'https://yt3.googleusercontent.com/ytc/AOPolaQ8kQ4bVhg5IWnD-_3LD4D4qLqb6W-OXPaUDdIA=s176-c-k-c0x00ffffff-no-rj',
        description: 'Best for OS, DBMS, CN, TOC',
    },
    {
        name: 'Gate Wallah',
        url: 'https://www.youtube.com/@GateWallah',
        thumbnail: 'https://yt3.googleusercontent.com/Fz_E8QmUg0eDGqzMNJvQ5Y8F8R6RGNO4BJQY8m0RyX8BnR_DUQKNx_Dv-5TdBh7MiN8FgCiSQ=s176-c-k-c0x00ffffff-no-rj',
        description: 'Full GATE CS syllabus coverage',
    },
    {
        name: 'Unacademy CS',
        url: 'https://www.youtube.com/@UnacademyComputerScience',
        thumbnail: 'https://yt3.googleusercontent.com/hFfhPn08j076pFrXfmO3MBb_FRcb9pGLk73RixVz2kDT7ST7yDGPOGzqkh0XYCFwKADlLWjng=s176-c-k-c0x00ffffff-no-rj',
        description: 'Vishvadeep Gothi & more',
    },
    {
        name: 'Neso Academy',
        url: 'https://www.youtube.com/@nesoacademy',
        thumbnail: 'https://yt3.googleusercontent.com/pV2Y3wOqSA62pDnrJIX1v8lgZSAKG2nVCXfJMkNNk3LxjkXGpu-gmOL8-6fzrEjabW5sNVWJ=s176-c-k-c0x00ffffff-no-rj',
        description: 'Theory-focused lectures',
    },
    {
        name: 'Abdul Bari',
        url: 'https://www.youtube.com/@abdul_bari',
        thumbnail: 'https://yt3.googleusercontent.com/ytc/AOPolaSXIKoOAo3ncxQKJ67GFsPVaYnfaAyFMEI2sUMi=s176-c-k-c0x00ffffff-no-rj',
        description: 'Algorithms & DSA masterclass',
    },
    {
        name: 'Jenny\'s Lectures',
        url: 'https://www.youtube.com/@JennyslecturesCSIT',
        thumbnail: 'https://yt3.googleusercontent.com/ytc/AOPolaR_bYK-hrF4FtPKlIGYEEdVh-q5VjjJ-dN48_W0=s176-c-k-c0x00ffffff-no-rj',
        description: 'DSA, OS, DBMS, Networks',
    },
]

// ── Helpers ──────────────────────────────────────

/** Load video data for a subject. Imports the JSON file dynamically. */
export async function loadSubjectVideos(dataFile: string): Promise<Video[]> {
    const mod = await import(`../data/${dataFile}.json`)
    return mod.default as Video[]
}

/** Format seconds to "Xh Ym" string */
export function formatDuration(totalSeconds: number): string {
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    if (h === 0) return `${m}m`
    return `${h}h ${m}m`
}

/** Clean up video title (remove extra whitespace) */
export function cleanTitle(title: string): string {
    return title.replace(/\s+/g, ' ').trim()
}

/** Partition videos into days based on available seconds per day */
export function partitionIntoDays(videos: Video[], secondsPerDay: number): Video[][] {
    const days: Video[][] = []
    let currentDay: Video[] = []
    let currentDaySeconds = 0

    for (const video of videos) {
        if (currentDaySeconds + video.videoDurationInSeconds > secondsPerDay && currentDay.length > 0) {
            days.push(currentDay)
            currentDay = []
            currentDaySeconds = 0
        }
        currentDay.push(video)
        currentDaySeconds += video.videoDurationInSeconds
    }

    if (currentDay.length > 0) {
        days.push(currentDay)
    }

    return days
}

/** Get/set watched videos from localStorage */
export function getWatched(subjectCode: string): Set<string> {
    const raw = localStorage.getItem(`gate-watched-${subjectCode}`)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw))
}

export function setWatched(subjectCode: string, watched: Set<string>): void {
    localStorage.setItem(`gate-watched-${subjectCode}`, JSON.stringify([...watched]))
}
