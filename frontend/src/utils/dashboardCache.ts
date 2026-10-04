import type { DashboardData } from '../api/api'

const DASHBOARD_CACHE_KEY = 'gate-dashboard-cache'
export const DASHBOARD_UPDATED_EVENT = 'gate-dashboard-updated'

export function readCachedDashboard(): DashboardData | null {
    if (typeof window === 'undefined') return null

    const raw = window.sessionStorage.getItem(DASHBOARD_CACHE_KEY)
    if (!raw) return null

    try {
        return JSON.parse(raw) as DashboardData
    } catch {
        window.sessionStorage.removeItem(DASHBOARD_CACHE_KEY)
        return null
    }
}

export function writeCachedDashboard(data: DashboardData) {
    if (typeof window === 'undefined') return

    window.sessionStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(data))
    window.dispatchEvent(new CustomEvent(DASHBOARD_UPDATED_EVENT, { detail: data }))
}

export function clearCachedDashboard() {
    if (typeof window === 'undefined') return
    window.sessionStorage.removeItem(DASHBOARD_CACHE_KEY)
}
