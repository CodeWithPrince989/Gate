/**
 * API service for the GATE Study Tracker.
 * In production, set VITE_API_URL to your Render backend URL.
 */

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Always send session cookies (needed for cross-origin Vercel→Render)
const OPTS: RequestInit = { credentials: 'include' };
let csrfToken: string | null = null;

function buildHeaders(headers?: HeadersInit, extra?: Record<string, string>): Headers {
    const merged = new Headers(headers || {});
    Object.entries(extra || {}).forEach(([key, value]) => merged.set(key, value));
    return merged;
}

export async function ensureCsrfToken(forceRefresh = false): Promise<string> {
    if (csrfToken && !forceRefresh) return csrfToken;

    const res = await fetch(`${API_BASE}/api/csrf/`, OPTS);
    if (!res.ok) throw new Error('Failed to initialize secure session');

    const data = await res.json().catch(() => null);
    if (!data?.csrfToken) throw new Error('Missing CSRF token from server');

    const token = data.csrfToken as string;
    csrfToken = token;
    return token;
}

export async function fetchWithCsrf(url: string, init: RequestInit): Promise<Response> {
    let token = await ensureCsrfToken();
    let res = await fetch(url, {
        ...init,
        credentials: 'include',
        headers: buildHeaders(init.headers, { 'X-CSRFToken': token }),
    });

    if (res.status === 403) {
        token = await ensureCsrfToken(true);
        res = await fetch(url, {
            ...init,
            credentials: 'include',
            headers: buildHeaders(init.headers, { 'X-CSRFToken': token }),
        });
    }

    return res;
}

// ── Types ───────────────────────────────────

export interface StudySession {
    id: number;
    date: string;
    subject: string;
    subject_display: string;
    study_type: string;
    duration_minutes: number;
    questions_solved: number;
    lecture_minutes: number;
    notes_created: boolean;
    created_at: string | null;
}

export interface DashboardData {
    today_hours: number;
    today_questions: number;
    today_lectures: number;
    current_streak: number;
    longest_streak: number;
    recent_sessions: StudySession[];
    total_sessions: number;
}

export interface ChartData {
    daily_labels: string[];
    daily_hours: number[];
    daily_questions: number[];
    subject_labels: string[];
    subject_values: number[];
    type_labels: string[];
    type_values: number[];
}

export interface AnalyticsData {
    avg_daily_hours: number;
    most_studied: string;
    least_studied: string;
    current_streak: number;
    longest_streak: number;
}

export interface SaveSessionPayload {
    subject: string;
    study_type: string;
    duration_seconds: number;
    questions_solved: number;
    lecture_minutes: number;
    notes_created: boolean;
}

export interface WeeklyDay {
    date: string;
    day: string;
    hours: number;
    questions: number;
    lectures: number;
    sessions: number;
    is_today: boolean;
    is_future: boolean;
}

export interface WeeklyProgress {
    days: WeeklyDay[];
    this_week_hours: number;
    this_week_questions: number;
    last_week_hours: number;
    last_week_questions: number;
    week_label: string;
}

export interface GrowthTree {
    total_hours: number;
    today_hours: number;
    stage: number;
    stage_name: string;
    stage_message: string;
    next_stage_name: string;
    next_stage_hours: number;
    progress_to_next: number;
    total_stages: number;
}

export interface WeekData {
    week_label: string;
    week_range: string;
    hours: number;
    questions: number;
    lectures: number;
    sessions: number;
    days_studied: number;
    subject_breakdown: { subject: string; hours: number }[];
    best_day_hours: number;
    best_day_date: string | null;
    is_current: boolean;
}

export interface ProgressAlert {
    week: string;
    type: 'critical' | 'warning' | 'success';
    message: string;
    suggestion: string;
}

export interface MultiWeekProgress {
    weeks: WeekData[];
    alerts: ProgressAlert[];
    consistency_score: number;
    total_hours: number;
    total_questions: number;
    avg_weekly_hours: number;
}

export interface AssistantReply {
    reply: string;
}

export interface FeedbackItem {
    id: number;
    name: string;
    email: string;
    message: string;
    created_at: string;
    upvotes: number;
}

// ── API Functions ───────────────────────────

export async function fetchDashboard(): Promise<DashboardData> {
    const res = await fetch(`${API_BASE}/api/dashboard/`, OPTS);
    if (!res.ok) throw new Error('Failed to fetch dashboard');
    return res.json();
}

export async function fetchChartData(): Promise<ChartData> {
    const res = await fetch(`${API_BASE}/api/chart-data/`, OPTS);
    if (!res.ok) throw new Error('Failed to fetch chart data');
    return res.json();
}

export async function fetchAnalytics(): Promise<AnalyticsData> {
    const res = await fetch(`${API_BASE}/api/analytics/`, OPTS);
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
}

export async function fetchHistory(params: {
    subject?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
}): Promise<StudySession[]> {
    const query = new URLSearchParams();
    if (params.subject) query.set('subject', params.subject);
    if (params.date_from) query.set('date_from', params.date_from);
    if (params.date_to) query.set('date_to', params.date_to);
    if (params.search) query.set('search', params.search);
    const res = await fetch(`${API_BASE}/api/history/?${query}`, OPTS);
    if (!res.ok) throw new Error('Failed to fetch history');
    return res.json();
}

export async function fetchHeatmapData(): Promise<Record<string, number>> {
    const res = await fetch(`${API_BASE}/api/heatmap/`, OPTS);
    if (!res.ok) throw new Error('Failed to fetch heatmap');
    return res.json();
}

export async function fetchWeeklyProgress(): Promise<WeeklyProgress> {
    const res = await fetch(`${API_BASE}/api/weekly-progress/`, OPTS);
    if (!res.ok) throw new Error('Failed to fetch weekly progress');
    return res.json();
}

export async function fetchGrowthTree(): Promise<GrowthTree> {
    const res = await fetch(`${API_BASE}/api/growth-tree/`, OPTS);
    if (!res.ok) throw new Error('Failed to fetch growth tree');
    return res.json();
}

export async function fetchMultiWeekProgress(): Promise<MultiWeekProgress> {
    const res = await fetch(`${API_BASE}/api/progress/`, OPTS);
    if (!res.ok) throw new Error('Failed to fetch progress');
    return res.json();
}

export async function saveSession(payload: SaveSessionPayload): Promise<{ status: string; session_id: number }> {
    const res = await fetchWithCsrf(`${API_BASE}/save-session/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to save session');
    return res.json();
}

export function getExportUrl(): string {
    return `${API_BASE}/export/`;
}

export async function chatWithAssistant(message: string): Promise<AssistantReply> {
    const res = await fetchWithCsrf(`${API_BASE}/api/assistant/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
        throw new Error(data?.error || 'Failed to get assistant response');
    }
    return data;
}

export async function fetchFeedback(): Promise<FeedbackItem[]> {
    const res = await fetch(`${API_BASE}/api/feedback/`, OPTS);
    if (!res.ok) throw new Error('Failed to fetch feedback');
    const data = await res.json();
    return data.items;
}

export async function submitFeedback(payload: {
    name?: string;
    email?: string;
    message: string;
}): Promise<{ status: string; message: string; feedback: FeedbackItem }> {
    const res = await fetchWithCsrf(`${API_BASE}/api/feedback/submit/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
        throw new Error(data?.error || 'Failed to submit feedback');
    }
    return data;
}

export async function upvoteFeedback(feedbackId: number): Promise<{ status: string; upvotes: number }> {
    const res = await fetchWithCsrf(`${API_BASE}/api/feedback/${feedbackId}/upvote/`, {
        method: 'POST',
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
        throw new Error(data?.error || 'Failed to upvote feedback');
    }
    return data;
}
