export function isDarkTheme(): boolean {
    if (typeof document === 'undefined') return true
    return !document.documentElement.classList.contains('light')
}

export function getChartTheme(dark = isDarkTheme()) {
    return {
        tick: dark ? 'rgba(255,255,255,.26)' : 'rgba(15,23,42,.48)',
        grid: dark ? 'rgba(255,255,255,.04)' : 'rgba(15,23,42,.08)',
        legend: dark ? 'rgba(255,255,255,.42)' : 'rgba(15,23,42,.6)',
        tooltipBg: dark ? 'rgba(10,10,15,.94)' : 'rgba(255,255,255,.96)',
        tooltipBorder: dark ? 'rgba(255,255,255,.1)' : 'rgba(15,23,42,.1)',
        tooltipText: dark ? '#f8fafc' : '#0f172a',
        barNeutral: dark ? 'rgba(255,255,255,.12)' : 'rgba(15,23,42,.12)',
        barNeutralBorder: dark ? 'rgba(255,255,255,.2)' : 'rgba(15,23,42,.18)',
        heatmapEmptyClass: dark ? 'bg-white/[.03]' : 'bg-slate-300/55',
        heatmapLowClass: dark ? 'bg-emerald-900/40' : 'bg-emerald-200',
        heatmapMidClass: dark ? 'bg-emerald-700/50' : 'bg-emerald-300',
        heatmapHighClass: dark ? 'bg-emerald-500/70' : 'bg-emerald-400',
        heatmapMaxClass: dark ? 'bg-emerald-400/90' : 'bg-emerald-500',
    }
}
