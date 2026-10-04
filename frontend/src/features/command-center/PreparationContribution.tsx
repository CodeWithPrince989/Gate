import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDownWideNarrow, ArrowUpWideNarrow, CalendarDays, Check, Clock3, Flame, FlameKindling, Pencil, Save, X } from 'lucide-react'
import {
  ACTIVITY_FILTERS, DEFAULT_CONTRIBUTION_PREFERENCES, GATE_ACTIVITY_LABELS, PLACEMENT_ACTIVITY_LABELS, activityCount, activityLevel, categoryActivityCount,
  checkinFromForm, checkinLevel, emptyCheckin, gateActivityCount, loadCheckins, loadContributionPreferences, meaningfulActive, placementActivityCount,
  recordActivityCounts, saveCheckins, saveContributionPreferences,
  type ActivityFilter, type ContributionPreferences, type GateActivities, type PlacementActivities, type PreparationCheckin, type PreparationTab,
} from './preparationCheckins'
import './preparation-contribution.css'

const today = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
const shiftDate = (date: Date, amount: number) => {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount, 12)
  return `${result.getFullYear()}-${String(result.getMonth() + 1).padStart(2, '0')}-${String(result.getDate()).padStart(2, '0')}`
}
const dateFromKey = (date: string) => new Date(`${date}T12:00:00`)
const formatDate = (date: string, options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' }) =>
  dateFromKey(date).toLocaleDateString(undefined, options)
const formatMinutes = (minutes: number) => `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`
const tabNames: { id: PreparationTab; label: string }[] = [
  { id: 'ALL', label: 'All preparation' }, { id: 'CSE', label: 'GATE CSE' }, { id: 'DA', label: 'GATE DA' }, { id: 'PLACEMENT', label: 'Placement' },
]
const levelNames = ['No preparation', 'Very low activity', 'Light preparation', 'Good preparation', 'Strong preparation', 'Excellent preparation']
const levelColors = ['#202832', '#0e4429', '#006d32', '#26a641', '#39d353', '#8de49c']

function yearDays(year: number, through: string) {
  const start = new Date(year, 0, 1, 12)
  const end = new Date(year, 11, 31, 12)
  const offset = (start.getDay() + 6) % 7
  const weekCount = Math.ceil((offset + Math.round((end.getTime() - start.getTime()) / 86400000) + 1) / 7)
  return Array.from({ length: weekCount }, (_, weekIndex) => Array.from({ length: 7 }, (_, dayIndex) => {
    const date = new Date(year, 0, 1 + weekIndex * 7 + dayIndex - offset, 12)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    return date.getFullYear() === year && key <= through ? key : ''
  }))
}

function streaks(records: Record<string, PreparationCheckin>, through: string) {
  const active = new Set(Object.values(records).filter(meaningfulActive).map(record => record.date).filter(date => date <= through))
  let current = active.has(through) ? through : shiftDate(dateFromKey(through), -1)
  let currentDays = 0
  while (active.has(current)) { currentDays++; current = shiftDate(dateFromKey(current), -1) }
  let longest = 0
  let run = 0
  const dates = [...active].sort()
  let previous = ''
  for (const date of dates) {
    run = previous && shiftDate(dateFromKey(previous), 1) === date ? run + 1 : 1
    longest = Math.max(longest, run)
    previous = date
  }
  return { current: currentDays, longest, active }
}

function yearSummary(records: Record<string, PreparationCheckin>, year: number, through: string, tab: PreparationTab) {
  const yearStart = `${year}-01-01`
  const yearEnd = `${year}-12-31`
  const effectiveEnd = through < yearEnd ? through : yearEnd
  const available = effectiveEnd < yearStart ? 0 : Math.floor((dateFromKey(effectiveEnd).getTime() - dateFromKey(yearStart).getTime()) / 86400000) + 1
  const selected = Object.values(records).filter(record => record.date >= yearStart && record.date <= yearEnd && record.date <= through)
  const activeDays = selected.filter(record => tab === 'ALL' ? meaningfulActive(record) : categoryActivityCount(record, tab) > 0).length
  return {
    activeDays,
    consistency: available ? Math.round(activeDays / available * 100) : 0,
    focusMinutes: selected.reduce((sum, record) => sum + record.focusMinutes, 0),
    questions: selected.reduce((sum, record) => sum + record.questionsSolved, 0),
    pyqs: selected.reduce((sum, record) => sum + record.pyqsSolved, 0),
    dsa: selected.reduce((sum, record) => sum + record.dsaProblems, 0),
    available,
    records: selected,
  }
}

function isPerfectDay(record: PreparationCheckin, preferences: ContributionPreferences) {
  const rules = preferences.perfectDay
  return (!rules.requireGateStudy || gateActivityCount(record.gateCseActivities) + gateActivityCount(record.gateDaActivities) > 0) &&
    (!rules.requirePlacement || placementActivityCount(record.placementActivities) > 0) &&
    (!rules.requireRevision || record.gateCseActivities.revision || record.gateDaActivities.revision) &&
    record.focusMinutes >= rules.minimumFocusMinutes
}

function monthlySummary(records: Record<string, PreparationCheckin>, year: number, month: number, through: string, preferences: ContributionPreferences) {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`
  const selected = Object.values(records).filter(record => record.date.startsWith(prefix) && record.date <= through)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const available = year === dateFromKey(through).getFullYear() && month === dateFromKey(through).getMonth()
    ? dateFromKey(through).getDate()
    : daysInMonth
  const activityDays = (tab: PreparationTab) => selected.filter(record => tab === 'ALL' ? meaningfulActive(record) : categoryActivityCount(record, tab) > 0).length
  return {
    selected,
    available,
    active: selected.filter(meaningfulActive).length,
    perfect: selected.filter(record => isPerfectDay(record, preferences)).length,
    hours: selected.reduce((sum, record) => sum + record.focusMinutes, 0) / 60,
    questions: selected.reduce((sum, record) => sum + record.questionsSolved, 0),
    pyqs: selected.reduce((sum, record) => sum + record.pyqsSolved, 0),
    dsa: selected.reduce((sum, record) => sum + record.dsaProblems, 0),
    csePercent: available ? Math.round(activityDays('CSE') / available * 100) : 0,
    daPercent: available ? Math.round(activityDays('DA') / available * 100) : 0,
    placementPercent: available ? Math.round(activityDays('PLACEMENT') / available * 100) : 0,
    averageLevel: selected.length ? selected.reduce((sum, record) => sum + checkinLevel(record, 'ALL'), 0) / selected.length : 0,
  }
}

function ActivityChecks<T extends Record<string, boolean>>({ title, activities, labels, onChange, focusFirst = false }: {
  title: string; activities: T; labels: Record<keyof T, string>; onChange: (key: keyof T, value: boolean) => void; focusFirst?: boolean
}) {
  return <fieldset className="prep-check-section">
    <legend>{title}</legend>
    <div className="prep-check-grid">{(Object.keys(labels) as (keyof T)[]).map((key, index) =>
      <label key={String(key)} className="prep-check-item">
        <input autoFocus={focusFirst && index === 0} type="checkbox" checked={activities[key]} onChange={event => onChange(key, event.target.checked)} />
        <span className="prep-check-box"><Check size={12} /></span><span>{labels[key]}</span>
      </label>,
    )}</div>
  </fieldset>
}

function CheckinEditor({ initial, onClose, onSave }: {
  initial: PreparationCheckin; onClose: () => void; onSave: (checkin: PreparationCheckin) => void
}) {
  const [form, setForm] = useState(initial)
  const patchGate = (key: 'gateCseActivities' | 'gateDaActivities', name: keyof GateActivities, value: boolean) =>
    setForm(previous => ({ ...previous, [key]: { ...previous[key], [name]: value } }))
  const patchPlacement = (name: keyof PlacementActivities, value: boolean) =>
    setForm(previous => ({ ...previous, placementActivities: { ...previous.placementActivities, [name]: value } }))
  const submit = (event: FormEvent) => {
    event.preventDefault()
    onSave(checkinFromForm(form))
  }
  return <div className="prep-modal-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <section className="prep-modal" role="dialog" aria-modal="true" aria-labelledby="prep-modal-title">
      <header className="prep-modal-header"><div><span className="prep-eyebrow">DAILY PREPARATION CHECK-IN</span><h2 id="prep-modal-title">{formatDate(form.date)}</h2></div><button className="prep-icon-button" onClick={onClose} aria-label="Close check-in"><X size={18} /></button></header>
      <form onSubmit={submit}>
        <div className="prep-check-columns">
          <ActivityChecks title="GATE CSE" activities={form.gateCseActivities} labels={GATE_ACTIVITY_LABELS} onChange={(key, value) => patchGate('gateCseActivities', key, value)} focusFirst />
          <ActivityChecks title="GATE DA" activities={form.gateDaActivities} labels={GATE_ACTIVITY_LABELS} onChange={(key, value) => patchGate('gateDaActivities', key, value)} />
          <ActivityChecks title="Placement" activities={form.placementActivities} labels={PLACEMENT_ACTIVITY_LABELS} onChange={patchPlacement} />
        </div>
        <div className="prep-entry-grid">
          <label>Focus time (minutes)<input type="number" min="0" max="1440" value={form.focusMinutes} onChange={event => setForm(previous => ({ ...previous, focusMinutes: Number(event.target.value) }))} /></label>
          <label>Questions solved<input type="number" min="0" value={form.questionsSolved} onChange={event => setForm(previous => ({ ...previous, questionsSolved: Number(event.target.value) }))} /></label>
          <label>PYQs solved<input type="number" min="0" value={form.pyqsSolved} onChange={event => setForm(previous => ({ ...previous, pyqsSolved: Number(event.target.value) }))} /></label>
          <label>DSA problems<input type="number" min="0" value={form.dsaProblems} onChange={event => setForm(previous => ({ ...previous, dsaProblems: Number(event.target.value) }))} /></label>
        </div>
        <details className="prep-reflection">
          <summary>Topics and daily reflection <span>Optional</span></summary>
          <label>Subjects studied<input value={form.subjectsStudied} onChange={event => setForm(previous => ({ ...previous, subjectsStudied: event.target.value }))} placeholder="e.g. DBMS, Operating Systems" /></label>
          <label>Topics studied<textarea value={form.topicsStudied} onChange={event => setForm(previous => ({ ...previous, topicsStudied: event.target.value }))} rows={2} placeholder="Add topics you covered" /></label>
          <label>What did I learn?<textarea value={form.learned} onChange={event => setForm(previous => ({ ...previous, learned: event.target.value }))} rows={2} /></label>
          <label>What mistake did I make?<textarea value={form.mistake} onChange={event => setForm(previous => ({ ...previous, mistake: event.target.value }))} rows={2} /></label>
          <label>What should I improve tomorrow?<textarea value={form.improveTomorrow} onChange={event => setForm(previous => ({ ...previous, improveTomorrow: event.target.value }))} rows={2} /></label>
          <label>Notes<textarea value={form.notes} onChange={event => setForm(previous => ({ ...previous, notes: event.target.value }))} rows={2} /></label>
        </details>
        <div className="prep-score-preview"><span>Meaningful activity score</span><strong>{categoryActivityCount(form, 'ALL')} / 18 · Level {activityLevel(categoryActivityCount(form, 'ALL'), 'ALL', 'All activities')} / 5</strong><span>Focus time never increases the activity score by itself.</span></div>
        <footer className="prep-modal-actions"><button type="button" className="prep-secondary-button" onClick={onClose}>Cancel</button><button className="prep-primary-button" type="submit"><Save size={15} /> Save check-in</button></footer>
      </form>
    </section>
  </div>
}

export default function PreparationContribution({ historyOnly = false }: { historyOnly?: boolean }) {
  const navigate = useNavigate()
  const [loaded] = useState(() => {
    let records: Record<string, PreparationCheckin> = {}
    let preferences = DEFAULT_CONTRIBUTION_PREFERENCES
    let error = ''
    let preferenceError = ''
    try { records = loadCheckins() }
    catch (loadError) { error = loadError instanceof Error ? loadError.message : 'Unable to load check-ins.' }
    try { preferences = loadContributionPreferences() }
    catch (loadError) { preferenceError = loadError instanceof Error ? loadError.message : 'Unable to load contribution preferences.' }
    return { records, preferences, error, preferenceError }
  })
  const [records, setRecords] = useState(loaded.records)
  const [preferences, setPreferences] = useState(loaded.preferences)
  const [preferenceDraft, setPreferenceDraft] = useState(loaded.preferences)
  const [storageError, setStorageError] = useState(loaded.error)
  const [preferenceError, setPreferenceError] = useState(loaded.preferenceError)
  const [loadFailed] = useState(Boolean(loaded.error))
  const [preferencesOpen, setPreferencesOpen] = useState(false)
  const [tab, setTab] = useState<PreparationTab>('ALL')
  const [activity, setActivity] = useState<ActivityFilter>('All activities')
  const currentDate = today()
  const [year, setYear] = useState(() => dateFromKey(currentDate).getFullYear())
  const [month, setMonth] = useState('all')
  const [editing, setEditing] = useState<PreparationCheckin | null>(null)
  const [sort, setSort] = useState<{ key: 'date' | 'score' | 'hours'; descending: boolean }>({ key: 'date', descending: true })
  const [historyFilter, setHistoryFilter] = useState<PreparationTab>('ALL')
  const currentYear = dateFromKey(currentDate).getFullYear()
  const yearChoices = useMemo(() => {
    const earliest = Math.min(currentYear - 1, ...Object.keys(records).map(date => dateFromKey(date).getFullYear()))
    return Array.from({ length: currentYear - earliest + 1 }, (_, index) => currentYear - index)
  }, [records, currentYear])
  const annual = useMemo(() => yearSummary(records, year, currentDate, tab), [records, year, currentDate, tab])
  const months = useMemo(() => {
    if (month !== 'all') return monthlySummary(records, year, Number(month), currentDate, preferences)
    const annualSummary = yearSummary(records, year, currentDate, 'ALL')
    const datesInPeriod = annualSummary.records
    const available = annualSummary.available
    const activityDays = (category: PreparationTab) => datesInPeriod.filter(record => category === 'ALL' ? meaningfulActive(record) : categoryActivityCount(record, category) > 0).length
    return {
      selected: datesInPeriod,
      available,
      active: activityDays('ALL'),
      perfect: datesInPeriod.filter(record => isPerfectDay(record, preferences)).length,
      hours: annualSummary.focusMinutes / 60,
      questions: annualSummary.questions,
      pyqs: annualSummary.pyqs,
      dsa: annualSummary.dsa,
      csePercent: available ? Math.round(activityDays('CSE') / available * 100) : 0,
      daPercent: available ? Math.round(activityDays('DA') / available * 100) : 0,
      placementPercent: available ? Math.round(activityDays('PLACEMENT') / available * 100) : 0,
      averageLevel: datesInPeriod.length ? datesInPeriod.reduce((sum, record) => sum + checkinLevel(record, 'ALL'), 0) / datesInPeriod.length : 0,
    }
  }, [records, year, month, currentDate, preferences])
  const goalMonth = month === 'all' ? year === currentYear ? dateFromKey(currentDate).getMonth() : 11 : Number(month)
  const goalSummary = useMemo(() => monthlySummary(records, year, goalMonth, currentDate, preferences), [records, year, goalMonth, currentDate, preferences])
  const streak = useMemo(() => streaks(records, currentDate), [records, currentDate])
  const weeks = useMemo(() => yearDays(year, currentDate), [year, currentDate])
  const monthOptions = Array.from({ length: year === currentYear ? dateFromKey(currentDate).getMonth() + 1 : 12 }, (_, index) => index)
  const activeTabRecord = (record: PreparationCheckin) => activity === 'All activities'
    ? categoryActivityCount(record, tab)
    : activityCount(record, activity)
  const weekStart = shiftDate(dateFromKey(currentDate), -((dateFromKey(currentDate).getDay() + 6) % 7))
  const weekDates = Array.from({ length: 7 }, (_, index) => shiftDate(dateFromKey(weekStart), index))
  const weekRecords = weekDates.map(date => records[date] ?? emptyCheckin(date))
  const weekActiveDays = weekRecords.filter(record => record.date <= currentDate && meaningfulActive(record)).length
  const filteredHistory = Object.values(records).filter(record =>
    record.date <= currentDate && (historyFilter === 'ALL' || categoryActivityCount(record, historyFilter) > 0),
  ).sort((a, b) => {
    const left = sort.key === 'date' ? a.date : sort.key === 'hours' ? a.focusMinutes : categoryActivityCount(a, historyFilter)
    const right = sort.key === 'date' ? b.date : sort.key === 'hours' ? b.focusMinutes : categoryActivityCount(b, historyFilter)
    return (left < right ? -1 : left > right ? 1 : 0) * (sort.descending ? -1 : 1)
  })

  useEffect(() => {
    if (!editing) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setEditing(null)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [editing])

  const save = (checkin: PreparationCheckin) => {
    if (loadFailed) return
    const updated = { ...records, [checkin.date]: checkin }
    try {
      saveCheckins(updated)
      setRecords(updated)
      setStorageError('')
      setEditing(null)
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : 'Unable to save this check-in.')
    }
  }
  const savePreferences = (event: FormEvent) => {
    event.preventDefault()
    try {
      saveContributionPreferences(preferenceDraft)
      setPreferences(preferenceDraft)
      setPreferenceError('')
      setPreferencesOpen(false)
    } catch (error) {
      setPreferenceError(error instanceof Error ? error.message : 'Unable to save contribution preferences.')
    }
  }
  const changeSort = (key: 'date' | 'score' | 'hours') =>
    setSort(previous => ({ key, descending: previous.key === key ? !previous.descending : true }))

  return <div className="prep-contribution">
    <header className="prep-page-heading">
      <div><span className="prep-eyebrow">{historyOnly ? 'YOUR DAILY RECORDS' : 'PREPARATION CONTRIBUTION'}</span><h2>{historyOnly ? 'Check-in history' : 'Preparation consistency'}</h2><p>{historyOnly ? 'Review and update any saved day.' : 'Don’t chase a perfect day. Build a consistent year.'}</p></div>
      <div className="prep-heading-actions">{!historyOnly && <button className="prep-secondary-button" onClick={() => navigate('/check-in')}>Check-in history</button>}<button className="prep-primary-button" onClick={() => !loadFailed && setEditing(records[currentDate] ?? emptyCheckin(currentDate))} disabled={loadFailed}><Check size={16} /> Check in today</button></div>
    </header>
    {storageError && <div className="prep-storage-error" role="alert">{storageError}</div>}
    {preferenceError && <div className="prep-storage-error" role="alert">{preferenceError}</div>}
    {!historyOnly && <>
      <div className="prep-stat-row" aria-label="Preparation consistency statistics">
        <div><Flame size={16} /><span>Current streak</span><strong>{streak.current} days</strong></div>
        <div><FlameKindling size={16} /><span>Longest streak</span><strong>{streak.longest} days</strong></div>
        <div><CalendarDays size={16} /><span>Active days</span><strong>{annual.activeDays} / {annual.available}</strong></div>
        <div><span className="prep-stat-dot" /><span>Consistency</span><strong>{annual.consistency}%</strong></div>
        <div><Clock3 size={16} /><span>Study time</span><strong>{Math.floor(annual.focusMinutes / 60)}h</strong></div>
        <div><span className="prep-stat-text-icon">Q</span><span>Questions</span><strong>{annual.questions.toLocaleString()}</strong></div>
        <div><span className="prep-stat-text-icon">P</span><span>PYQs</span><strong>{annual.pyqs.toLocaleString()}</strong></div>
        <div><span className="prep-stat-text-icon">D</span><span>DSA problems</span><strong>{annual.dsa.toLocaleString()}</strong></div>
      </div>
      <section className="prep-heatmap-panel" aria-label="Preparation contribution graph">
        <div className="prep-controls">
          <div className="prep-tabs" role="tablist" aria-label="Preparation graph category">{tabNames.map(item =>
            <button key={item.id} role="tab" aria-selected={tab === item.id} className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)}>{item.label}</button>,
          )}</div>
          <div className="prep-select-controls"><label>Year<select value={year} onChange={event => { setYear(Number(event.target.value)); setMonth('all') }}>{yearChoices.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
            <label>Month<select value={month} onChange={event => setMonth(event.target.value)}><option value="all">All months</option>{monthOptions.map(value => <option key={value} value={value}>{new Date(year, value, 1).toLocaleDateString(undefined, { month: 'long' })}</option>)}</select></label>
            <label>Activity<select value={activity} onChange={event => setActivity(event.target.value as ActivityFilter)}>{ACTIVITY_FILTERS.map(item => <option key={item}>{item}</option>)}</select></label>
          </div>
        </div>
        <p className="prep-graph-caption">{tabNames.find(item => item.id === tab)?.label} · {year} · Select any day to review or edit it.</p>
        <div className="prep-heatmap-scroll">
          <div className="prep-heatmap">
            <div className="prep-month-labels" aria-hidden="true">{Array.from({ length: weeks.length }, (_, index) => {
              const firstDay = weeks[index].find(Boolean)
              const firstOfMonth = firstDay && dateFromKey(firstDay).getDate() === 1
              return <span key={index} style={{ gridColumn: index + 1 }}>{firstOfMonth ? dateFromKey(firstDay).toLocaleDateString(undefined, { month: 'short' }) : ''}</span>
            })}</div>
            <div className="prep-calendar-body"><div className="prep-weekday-labels" aria-hidden="true"><span>Mon</span><span></span><span>Wed</span><span></span><span>Fri</span><span></span><span>Sun</span></div>
              <div className="prep-week-columns">{weeks.map((week, weekIndex) => <div className="prep-week-column" key={weekIndex}>{week.map((date, dayIndex) => {
                if (!date) return <span className="prep-day-spacer" key={`blank-${dayIndex}`} />
                const record = records[date]
                const count = record ? activeTabRecord(record) : 0
                const level = activity === 'All activities'
                  ? (record ? checkinLevel(record, tab) : 0)
                  : activityLevel(count, tab, activity)
                const counts = record ? recordActivityCounts(record) : { cse: 0, da: 0, placement: 0 }
                const title = record
                  ? `${formatDate(date)} · Preparation level ${activity === 'All activities' ? checkinLevel(record, tab) : level}/5 · GATE CSE ${counts.cse} activities · GATE DA ${counts.da} activities · Placement ${counts.placement} activities · Study ${formatMinutes(record.focusMinutes)} · Questions ${record.questionsSolved} · PYQs ${record.pyqsSolved} · DSA ${record.dsaProblems}`
                  : `${formatDate(date)} · No preparation recorded.`
                const selected = month === 'all' || dateFromKey(date).getMonth() === Number(month)
                return <button key={date} type="button" className={`prep-day level-${level} ${selected ? '' : 'month-muted'}`} style={{ '--prep-level-color': levelColors[level] } as CSSProperties} aria-label={title} title={title} disabled={loadFailed} onClick={() => setEditing(record ?? emptyCheckin(date))} />
              })}</div>)}</div>
            </div>
          </div>
        </div>
        <div className="prep-legend"><span>Preparation activity</span><span>Less</span>{levelColors.map((color, index) => <span key={color} className="prep-legend-square" style={{ backgroundColor: color }} title={levelNames[index]} aria-label={levelNames[index]} />)}<span>More</span></div>
      </section>
      <div className="prep-summary-grid">
        <section className="prep-summary-panel">
          <div className="prep-summary-heading"><div><span className="prep-eyebrow">{month === 'all' ? 'YEARLY SUMMARY' : 'MONTHLY SUMMARY'}</span><h3>{month === 'all' ? `${year} overview` : formatDate(`${year}-${String(Number(month) + 1).padStart(2, '0')}-01`, { month: 'long', year: 'numeric' })}</h3></div><span className="prep-perfect-count">★ {months.perfect} perfect {months.perfect === 1 ? 'day' : 'days'}</span></div>
          <div className="prep-month-stats"><span>Active days<strong>{months.active}/{months.available}</strong></span><span>Study hours<strong>{months.hours.toFixed(1)}h</strong></span><span>Questions<strong>{months.questions}</strong></span><span>PYQs<strong>{months.pyqs}</strong></span><span>DSA problems<strong>{months.dsa}</strong></span><span>Avg. daily level<strong>{months.averageLevel.toFixed(1)}/5</strong></span></div>
          <div className="prep-category-progress">{[['GATE CSE', months.csePercent], ['GATE DA', months.daPercent], ['Placement', months.placementPercent]].map(([label, value]) =>
            <div key={label as string}><span>{label}</span><div className="prep-progress-track"><span style={{ width: `${value}%` }} /></div><strong>{value}%</strong></div>,
          )}</div>
          <div className="prep-goal-section">
            <div className="prep-goal-heading"><strong>Monthly goals · {new Date(year, goalMonth, 1).toLocaleDateString(undefined, { month: 'long' })}</strong><button type="button" className="prep-text-button" aria-expanded={preferencesOpen} onClick={() => setPreferencesOpen(open => !open)}>{preferencesOpen ? 'Close settings' : 'Edit goals & perfect day'}</button></div>
            {[['Focus hours', goalSummary.hours, preferences.monthlyGoals.focusHours], ['DSA problems', goalSummary.dsa, preferences.monthlyGoals.dsaProblems], ['PYQs', goalSummary.pyqs, preferences.monthlyGoals.pyqs], ['Active days', goalSummary.active, preferences.monthlyGoals.activeDays]].map(([label, value, target]) => {
              const progress = Number(target) > 0 ? Math.min(100, Number(value) / Number(target) * 100) : 0
              return <div className="prep-goal-progress" key={label as string}><span>{label}</span><div className="prep-progress-track"><span style={{ width: `${progress}%` }} /></div><strong>{typeof value === 'number' && Number(value) % 1 ? Number(value).toFixed(1) : value as number}/{target as number}</strong></div>
            })}
            {preferencesOpen && <form className="prep-preferences-form" onSubmit={savePreferences}>
              <span className="prep-eyebrow">MONTHLY TARGETS</span>
              <div className="prep-goal-inputs">
                <label>Focus hours<input type="number" min="0" value={preferenceDraft.monthlyGoals.focusHours} onChange={event => setPreferenceDraft(previous => ({ ...previous, monthlyGoals: { ...previous.monthlyGoals, focusHours: Number(event.target.value) } }))} /></label>
                <label>DSA problems<input type="number" min="0" value={preferenceDraft.monthlyGoals.dsaProblems} onChange={event => setPreferenceDraft(previous => ({ ...previous, monthlyGoals: { ...previous.monthlyGoals, dsaProblems: Number(event.target.value) } }))} /></label>
                <label>PYQs<input type="number" min="0" value={preferenceDraft.monthlyGoals.pyqs} onChange={event => setPreferenceDraft(previous => ({ ...previous, monthlyGoals: { ...previous.monthlyGoals, pyqs: Number(event.target.value) } }))} /></label>
                <label>Active days<input type="number" min="0" max="31" value={preferenceDraft.monthlyGoals.activeDays} onChange={event => setPreferenceDraft(previous => ({ ...previous, monthlyGoals: { ...previous.monthlyGoals, activeDays: Number(event.target.value) } }))} /></label>
              </div>
              <span className="prep-eyebrow">PERFECT DAY DEFINITION</span>
              <div className="prep-perfect-options">{([
                ['requireGateStudy', 'Complete GATE study'],
                ['requirePlacement', 'Complete placement practice'],
                ['requireRevision', 'Complete revision'],
              ] as const).map(([key, label]) => <label key={key}><input type="checkbox" checked={preferenceDraft.perfectDay[key]} onChange={event => setPreferenceDraft(previous => ({ ...previous, perfectDay: { ...previous.perfectDay, [key]: event.target.checked } }))} />{label}</label>)}
                <label>Minimum focus minutes<input type="number" min="0" max="1440" value={preferenceDraft.perfectDay.minimumFocusMinutes} onChange={event => setPreferenceDraft(previous => ({ ...previous, perfectDay: { ...previous.perfectDay, minimumFocusMinutes: Number(event.target.value) } }))} /></label>
              </div>
              <button className="prep-primary-button" type="submit"><Save size={14} /> Save goals</button>
            </form>}
          </div>
        </section>
        <section className="prep-summary-panel prep-week-panel">
          <div className="prep-summary-heading"><div><span className="prep-eyebrow">THIS WEEK</span><h3>Small steps add up.</h3></div><span className="prep-perfect-count">{weekActiveDays}/7 active</span></div>
          <div className="prep-week-list">{weekRecords.map(record => {
            const value = categoryActivityCount(record, 'ALL')
            return <button key={record.date} disabled={loadFailed} onClick={() => setEditing(record)} aria-label={`${formatDate(record.date, { weekday: 'long', month: 'short', day: 'numeric' })}: ${value} activities`}>
              <span>{formatDate(record.date, { weekday: 'short' })}</span><span className="prep-week-bar"><i style={{ width: `${Math.max(value ? 8 : 0, value / 18 * 100)}%` }} /></span><strong>{value || '—'}</strong>
            </button>
          })}</div>
          <div className="prep-week-totals"><span>Focus<strong>{formatMinutes(weekRecords.reduce((sum, item) => sum + item.focusMinutes, 0))}</strong></span><span>Questions<strong>{weekRecords.reduce((sum, item) => sum + item.questionsSolved, 0)}</strong></span><span>PYQs<strong>{weekRecords.reduce((sum, item) => sum + item.pyqsSolved, 0)}</strong></span><span>DSA<strong>{weekRecords.reduce((sum, item) => sum + item.dsaProblems, 0)}</strong></span></div>
        </section>
      </div>
      <section className="prep-consistency-panel"><div><span className="prep-eyebrow">PREPARATION CONSISTENCY</span><h3>Measured by showing up, not by hours alone.</h3></div>{(['CSE', 'DA', 'PLACEMENT', 'ALL'] as PreparationTab[]).map(value => {
        const selected = yearSummary(records, year, currentDate, value)
        return <div key={value}><span>{tabNames.find(item => item.id === value)?.label}</span><strong>{selected.consistency}%</strong><i><span style={{ width: `${selected.consistency}%` }} /></i></div>
      })}</section>
      <p className="prep-recovery-note">A missed day stays in your history. Start again today; there’s no need to compensate with an unrealistic workload.</p>
    </>}
    {historyOnly && <section className="prep-history-panel">
      <div className="prep-history-toolbar"><div className="prep-tabs" role="tablist" aria-label="Filter check-in history">{tabNames.map(item =>
        <button key={item.id} role="tab" aria-selected={historyFilter === item.id} className={historyFilter === item.id ? 'active' : ''} onClick={() => setHistoryFilter(item.id)}>{item.label}</button>,
      )}</div><span>{filteredHistory.length} recorded {filteredHistory.length === 1 ? 'day' : 'days'}</span></div>
      {filteredHistory.length ? <div className="prep-history-scroll"><table><thead><tr>
        <th><button onClick={() => changeSort('date')}>Date {sort.key === 'date' ? sort.descending ? <ArrowDownWideNarrow size={13} /> : <ArrowUpWideNarrow size={13} /> : null}</button></th>
        <th>GATE CSE</th><th>GATE DA</th><th>Placement</th>
        <th><button onClick={() => changeSort('hours')}>Focus time</button></th><th>Questions</th><th>PYQs</th><th><button onClick={() => changeSort('score')}>Activities</button></th><th>Level</th><th />
      </tr></thead><tbody>{filteredHistory.map(record => <tr key={record.date}>
        <td>{formatDate(record.date, { month: 'short', day: 'numeric', year: 'numeric' })}</td><td>{gateActivityCount(record.gateCseActivities)}/6</td><td>{gateActivityCount(record.gateDaActivities)}/6</td><td>{placementActivityCount(record.placementActivities)}/6</td>
        <td>{formatMinutes(record.focusMinutes)}</td><td>{record.questionsSolved}</td><td>{record.pyqsSolved}</td><td>{categoryActivityCount(record, historyFilter)}/18</td><td>{checkinLevel(record, historyFilter)}/5</td>
        <td><button className="prep-icon-button" aria-label={`Edit ${record.date}`} disabled={loadFailed} onClick={() => setEditing(record)}><Pencil size={14} /></button></td>
      </tr>)}</tbody></table></div> : <div className="prep-history-empty"><CalendarDays size={24} /><strong>No check-ins recorded yet</strong><span>Your saved daily check-ins will appear here.</span><button className="prep-primary-button" disabled={loadFailed} onClick={() => !loadFailed && setEditing(records[currentDate] ?? emptyCheckin(currentDate))}><Check size={15} /> Check in today</button></div>}
    </section>}
    {editing && <CheckinEditor initial={editing} onClose={() => setEditing(null)} onSave={save} />}
  </div>
}
