import { useEffect, useRef, useState, type CSSProperties, type Dispatch, type FormEvent, type ReactNode, type SetStateAction } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Activity, AlertCircle as CircleAlert, ArrowDown, ArrowRight, ArrowUp, BarChart3, BookOpen, Briefcase, CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight,
  Clock3, Download, Flame, Play as Focus, GraduationCap, HelpCircle, ListChecks, Menu, Moon, Pencil, Plus, RotateCcw, Search,
  Settings, ShieldCheck, Sparkles, Target, Trash2, Trophy, X,
} from 'lucide-react'
import {
  createDemoData, dayRecord, formatMinutes, loadData, localDate, mistakeCategories, newId, saveData, stageNames, subjects,
  type DayRecord, type Goal, type Mistake, type Pyq, type Revision, type Task, type TaskStatus, type TestRecord, type Topic, type TrackerData,
} from './data'
import PreparationContribution from './PreparationContribution'
import './command-center.css'

const navItems = [
  { path: '/', label: 'Dashboard', icon: Activity },
  { path: '/placement', label: '💼 Placement Preparation', icon: Briefcase },
  { path: '/planner', label: 'Daily Planner', icon: ListChecks },
  { path: '/calendar', label: 'Calendar', icon: CalendarDays },
  { path: '/syllabus', label: 'Syllabus', icon: BookOpen },
  { path: '/pyqs', label: 'PYQ Tracker', icon: HelpCircle },
  { path: '/revision', label: 'Revision', icon: RotateCcw },
  { path: '/mistakes', label: 'Mistake Notebook', icon: CircleAlert },
  { path: '/tests', label: 'Tests & Mocks', icon: GraduationCap },
  { path: '/timer', label: 'Study Timer', icon: Clock3 },
  { path: '/command-analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/weekly-review', label: 'Weekly Review', icon: CheckCircle2 },
  { path: '/goals', label: 'Goals', icon: Target },
  { path: '/check-in', label: 'Check-in history', icon: CalendarDays },
  { path: '/settings', label: 'Settings', icon: Settings },
]
const percent = (value: number) => `${Math.max(0, Math.min(100, Math.round(value)))}%`
const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0
const friendlyDate = (value: string, options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' }) =>
  new Date(`${value}T12:00:00`).toLocaleDateString(undefined, options)
const inDays = (date: string, days: number) => {
  const next = new Date(`${date}T12:00:00`)
  next.setDate(next.getDate() + days)
  return localDate(next)
}
const todayKey = localDate()
const getGreeting = () => {
  const hour = new Date().getHours()
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
}
const getUserName = () => {
  try {
    const user = JSON.parse(localStorage.getItem('gate-user') ?? '{}') as { username?: string }
    return user.username || 'Prince'
  } catch {
    return 'Prince'
  }
}

function Panel({ title, subtitle, action, children, className = '' }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`cc-panel ${className}`}>
    <header className="cc-panel-heading"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</header>
    {children}
  </section>
}

function ProgressBar({ value, color = 'blue' }: { value: number; color?: string }) {
  return <div className="cc-progress-track"><span className={`cc-progress-fill ${color}`} style={{ width: percent(value) }} /></div>
}

function Stat({ label, value, hint, icon: Icon, color = 'blue' }: { label: string; value: string; hint: string; icon: typeof Activity; color?: string }) {
  return <article className="cc-stat"><div className={`cc-stat-icon ${color}`}><Icon size={17} /></div><div className="cc-stat-label">{label}</div><strong>{value}</strong><small>{hint}</small></article>
}

function Empty({ title, detail }: { title: string; detail: string }) {
  return <div className="cc-empty"><div className="cc-empty-icon"><Sparkles size={18} /></div><strong>{title}</strong><span>{detail}</span></div>
}

function Modal({ title, close, children }: { title: string; close: () => void; children: ReactNode }) {
  return <div className="cc-modal-scrim" onMouseDown={event => event.target === event.currentTarget && close()}><section className="cc-modal">
    <header><h2>{title}</h2><button className="cc-icon-button" onClick={close} aria-label="Close"><X size={18} /></button></header>{children}
  </section></div>
}

export default function CommandCenter() {
  const location = useLocation()
  const navigate = useNavigate()
  const [data, setData] = useState<TrackerData>(() => loadData())
  const [selectedDate, setSelectedDate] = useState(todayKey)
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [quickOpen, setQuickOpen] = useState(false)
  const [modal, setModal] = useState('')
  const [editingTestId, setEditingTestId] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const [paperTab, setPaperTab] = useState<'CSE' | 'DA' | 'Common'>('CSE')
  const [calendarMode, setCalendarMode] = useState<'Month' | 'Week' | 'Day'>('Month')
  const [calendarMonth, setCalendarMonth] = useState(() => new Date())
  const [pyqFilter, setPyqFilter] = useState({ subject: 'All', topic: 'All', difficulty: 'All', result: 'All', year: 'All' })
  const [timerNow, setTimerNow] = useState(Date.now())
  const section = location.pathname
  const currentNav = navItems.find(item => item.path === section) ?? navItems[0]
  const currentDay = dayRecord(data, selectedDate)
  const currentTasks = data.tasks.filter(task => task.date === selectedDate).sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
  const todaysSessions = data.sessions.filter(session => session.date === selectedDate)
  const studyMinutes = todaysSessions.reduce((total, session) => total + session.duration, 0)
  const stageAverage = average(data.topics.map(topic => topic.stage / 8 * 100))
  const pyqAttemptRate = data.pyqs.length ? data.pyqs.filter(pyq => pyq.result !== 'Unattempted').length / data.pyqs.length * 100 : 0
  const allAttempts = data.pyqs.filter(pyq => pyq.result !== 'Unattempted')
  const accuracy = allAttempts.length ? allAttempts.filter(pyq => pyq.result === 'Correct' || pyq.result === 'Mastered').length / allAttempts.length * 100 : 0
  const revisionCoverage = data.revisions.length ? data.revisions.filter(revision => revision.status === 'Completed').length / data.revisions.length * 100 : 0
  const mockAverage = average(data.tests.filter(test => test.type === 'Full-Length Mock').map(test => test.score / Math.max(1, test.maxMarks) * 100))
  const activeDays = new Set(data.sessions.map(session => session.date)).size
  const readiness = Math.round(stageAverage * .24 + pyqAttemptRate * .16 + revisionCoverage * .14 + accuracy * .18 + mockAverage * .16 + Math.min(activeDays / 15 * 100, 100) * .12)
  const filteredPyqs = data.pyqs.filter(pyq =>
    (pyqFilter.subject === 'All' || pyq.subject === pyqFilter.subject) &&
    (pyqFilter.topic === 'All' || pyq.topic === pyqFilter.topic) &&
    (pyqFilter.difficulty === 'All' || pyq.difficulty === pyqFilter.difficulty) &&
    (pyqFilter.result === 'All' || pyq.result === pyqFilter.result) &&
    (pyqFilter.year === 'All' || String(pyq.year) === pyqFilter.year),
  )
  const searchResults = search.trim() ? [
    ...data.topics.filter(topic => `${topic.subject} ${topic.name}`.toLowerCase().includes(search.toLowerCase())).map(item => ({ name: `${item.subject} · ${item.name}`, go: '/syllabus' })),
    ...data.tasks.filter(task => `${task.title} ${task.subject} ${task.topic}`.toLowerCase().includes(search.toLowerCase())).map(item => ({ name: `Task · ${item.title}`, go: '/planner' })),
    ...data.pyqs.filter(item => `${item.id} ${item.subject} ${item.topic}`.toLowerCase().includes(search.toLowerCase())).map(item => ({ name: `PYQ · ${item.id}`, go: '/pyqs' })),
    ...data.revisions.filter(item => `${item.subject} ${item.topic} ${item.type}`.toLowerCase().includes(search.toLowerCase())).map(item => ({ name: `Revision · ${item.subject} — ${item.topic} (${item.type})`, go: '/revision' })),
    ...data.mistakes.filter(item => `${item.subject} ${item.topic} ${item.question} ${item.lesson}`.toLowerCase().includes(search.toLowerCase())).map(item => ({ name: `Mistake · ${item.topic}`, go: '/mistakes' })),
    ...data.tests.filter(item => `${item.name} ${item.subject}`.toLowerCase().includes(search.toLowerCase())).map(item => ({ name: `Test · ${item.name}`, go: '/tests' })),
  ].slice(0, 8) : []

  useEffect(() => {
    try { saveData(data) } catch (error) { setToast(error instanceof Error ? error.message : 'Unable to save your changes.') }
  }, [data])
  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(''), 3500)
    return () => window.clearTimeout(timeout)
  }, [toast])
  useEffect(() => {
    if (!data.timer.running) return
    const timer = window.setInterval(() => setTimerNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [data.timer.running])

  const updateDay = (patch: Partial<DayRecord>, date = selectedDate) => setData(previous => ({
    ...previous, days: { ...previous.days, [date]: { ...dayRecord(previous, date), ...patch } },
  }))
  const updateTask = (id: string, patch: Partial<Task>) => setData(previous => ({
    ...previous, tasks: previous.tasks.map(task => task.id === id ? { ...task, ...patch } : task),
  }))
  const updateTopic = (id: string, patch: Partial<Topic>) => setData(previous => ({
    ...previous, topics: previous.topics.map(topic => topic.id === id ? { ...topic, ...patch } : topic),
  }))
  const updateRevision = (id: string, patch: Partial<Revision>) => setData(previous => ({
    ...previous, revisions: previous.revisions.map(revision => revision.id === id ? { ...revision, ...patch } : revision),
  }))
  const addTask = (task: Omit<Task, 'id' | 'date' | 'carryCount'> & { date?: string }) => {
    const mitCount = data.tasks.filter(item => item.date === (task.date ?? selectedDate) && item.isMIT).length
    if (data.tasks.some(item => item.date === (task.date ?? selectedDate) && item.title.trim().toLowerCase() === task.title.trim().toLowerCase())) {
      setToast('A task with that title already exists on this date.')
      return false
    }
    if (task.isMIT && mitCount >= 3) { setToast('A day can have up to 3 Most Important Tasks.'); return false }
    const { date, ...details } = task
    setData(previous => ({ ...previous, tasks: [...previous.tasks, { ...details, id: newId(), date: date ?? selectedDate, carryCount: 0 }] }))
    setModal('')
    setToast('Task added to your plan.')
    return true
  }
  const completeRevision = (revision: Revision) => {
    const completedDate = localDate()
    setData(previous => {
      const next = { ...previous, revisions: previous.revisions.map(item => item.id === revision.id ? { ...item, status: 'Completed' as const, completedDate } : item) }
      const nextType = revision.type === 'R0' ? 'R1' : revision.type === 'R1' ? 'R2' : revision.type === 'R2' ? 'R3' : 'R4'
      const offset = nextType === 'R1' ? 1 : nextType === 'R2' ? 7 : nextType === 'R3' ? 21 : 30
      const nextDueDate = inDays(completedDate, revision.weak ? Math.max(1, Math.floor(offset / 2)) : offset)
      if (nextType !== 'R4') next.revisions.push({ ...revision, id: newId(), type: nextType, dueDate: nextDueDate, completedDate: '', status: 'Due' })
      next.topics = next.topics.map(topic => topic.id === revision.topicId ? { ...topic, revisionCount: topic.revisionCount + 1, lastRevised: completedDate, nextRevision: nextDueDate } : topic)
      return next
    })
    setToast('Revision completed. The next review is scheduled automatically.')
  }
  const markLearned = (topic: Topic) => {
    if (data.revisions.some(revision => revision.topicId === topic.id && revision.status !== 'Completed')) {
      setToast('This topic already has an active revision schedule.')
      return
    }
    updateTopic(topic.id, { stage: Math.max(topic.stage, 1), lastRevised: todayKey, nextRevision: todayKey })
    setData(previous => ({ ...previous, revisions: [...previous.revisions, { id: newId(), topicId: topic.id, subject: topic.subject, topic: topic.name, type: 'R0', dueDate: todayKey, completedDate: '', status: 'Due', weak: topic.strength === 'Weak' }] }))
    setToast(`Spaced revision scheduled for ${topic.name}.`)
  }
  const addPyq = (values: Pyq) => {
    if (data.pyqs.some(pyq => pyq.id.toLowerCase() === values.id.trim().toLowerCase())) { setToast('That question ID already exists.'); return false }
    setData(previous => ({ ...previous, pyqs: [{ ...values, id: values.id.trim() }, ...previous.pyqs] }))
    setToast('PYQ saved.')
    setModal('')
    return true
  }
  const addMistake = (values: Omit<Mistake, 'id' | 'date' | 'reattempts'>) => {
    setData(previous => ({ ...previous, mistakes: [{ ...values, id: newId(), date: todayKey, reattempts: [0, 0, 0] }, ...previous.mistakes] }))
    setToast('Mistake saved. Use the reattempts to close the loop.')
    setModal('')
  }
  const addTest = (values: Omit<TestRecord, 'id' | 'date'>) => {
    setData(previous => ({ ...previous, tests: [{ ...values, id: newId(), date: todayKey }, ...previous.tests] }))
    setToast('Test result saved.')
    setModal('')
  }
  const startTimer = () => {
    setData(previous => ({ ...previous, timer: { ...previous.timer, running: true, mode: 'focus', startedAt: Date.now() } }))
  }
  const stopTimer = (discard = false) => {
    const elapsed = data.timer.running && data.timer.mode !== 'break' ? Math.max(1, Math.round((timerNow - data.timer.startedAt) / 60000)) : 0
    if (!discard && elapsed > 0) {
      const date = localDate(new Date(data.timer.startedAt))
      const session = { id: newId(), date, subject: data.timer.subject || 'Focused Study', topic: data.timer.topic, duration: elapsed }
      setData(previous => ({ ...previous, sessions: [...previous.sessions, session] }))
      setToast(`${elapsed} focused minutes saved to your study log.`)
    } else if (discard) setToast(data.timer.mode === 'break' ? 'Break skipped.' : 'Focus session discarded.')
    setData(previous => ({ ...previous, timer: { ...previous.timer, running: false, mode: 'focus', startedAt: 0 } }))
  }
  const finishTimerPeriod = () => {
    if (data.timer.mode === 'break') {
      setData(previous => ({ ...previous, timer: { ...previous.timer, running: false, mode: 'focus', startedAt: 0 } }))
      setToast('Break complete. Ready for the next focus block.')
      return
    }
    const elapsed = Math.max(1, Math.round((timerNow - data.timer.startedAt) / 60000))
    const session = { id: newId(), date: localDate(new Date(data.timer.startedAt)), subject: data.timer.subject || 'Focused Study', topic: data.timer.topic, duration: elapsed }
    setData(previous => ({ ...previous, sessions: [...previous.sessions, session], timer: { ...previous.timer, running: true, mode: 'break', startedAt: Date.now() } }))
    setToast(`${elapsed} focused minutes saved. Your ${data.timer.breakMinutes}-minute break has started.`)
  }
  const carryTask = (task: Task, date: string) => {
    const mitLimitReached = data.tasks.filter(item => item.date === date && item.isMIT).length >= 3
    updateTask(task.id, { date, status: 'Not Started', carryCount: task.carryCount + 1, isMIT: task.isMIT && !mitLimitReached })
    setToast(task.carryCount + 1 >= 3 ? 'This task has been carried 3+ times. Consider splitting it into smaller tasks.' : `Task moved to ${friendlyDate(date, { month: 'short', day: 'numeric' })}.`)
  }
  const addGoal = (title: string, target: number, unit: string, level: Goal['level']) => {
    if (!title.trim() || target <= 0) { setToast('Enter a goal and a target greater than zero.'); return }
    if (data.goals.some(goal => goal.level === level && goal.title.trim().toLowerCase() === title.trim().toLowerCase())) { setToast('A goal with that title already exists at this level.'); return }
    setData(previous => ({ ...previous, goals: [...previous.goals, { id: newId(), title: title.trim(), target, unit, level, current: 0 }] }))
    setModal('')
    setToast('Goal added.')
  }
  const addWeeklyReview = (review: Omit<TrackerData['reviews'][number], 'week'>) => {
    const monday = new Date()
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
    const week = localDate(monday)
    setData(previous => ({ ...previous, reviews: [...previous.reviews.filter(item => item.week !== week), { ...review, week }] }))
    setToast('Weekly review saved.')
  }

  const makeModal = () => {
    if (modal === 'task') return <TaskForm date={selectedDate} subjects={subjects.map(subject => subject.name)} existingMIT={data.tasks.filter(task => task.date === selectedDate && task.isMIT).length} close={() => setModal('')} submit={addTask} />
    if (modal === 'pyq') return <PyqForm subjects={subjects.map(subject => subject.name)} close={() => setModal('')} submit={addPyq} />
    if (modal === 'mistake') return <MistakeForm subjects={subjects.map(subject => subject.name)} close={() => setModal('')} submit={addMistake} />
    if (modal === 'test') return <TestForm close={() => setModal('')} submit={addTest} />
    if (modal === 'test-edit' && editingTestId) {
      const test = data.tests.find(item => item.id === editingTestId)
      if (test) return <TestForm initial={test} close={() => setModal('')} submit={values => {
        setData(previous => ({ ...previous, tests: previous.tests.map(item => item.id === test.id ? { ...item, ...values } : item) }))
        setModal('')
        setToast('Test result updated.')
      }} />
    }
    if (modal === 'goal') return <GoalForm close={() => setModal('')} submit={addGoal} />
    return null
  }

  if (!data.onboardingComplete) return <Onboarding data={data} complete={next => { setData(next); setToast('Your GATE 2027 workspace is ready.') }} />

  return <div className="command-center">
    <header className="cc-topbar">
      <div className="cc-brand"><div className="cc-brand-mark"><Target size={19} /></div><div><strong>GATE Command Center</strong><small>Study intelligence · GATE 2027</small></div></div>
      <div className="cc-top-actions">
        <div className={`cc-search ${searchOpen ? 'open' : ''}`}>
          <Search size={16} /><input aria-label="Search tracker" placeholder="Search topics, tasks, PYQs..." value={search} onChange={event => setSearch(event.target.value)} onFocus={() => setSearchOpen(true)} onKeyDown={event => event.key === 'Escape' && setSearchOpen(false)} />
          {search && <button className="cc-icon-button" onClick={() => setSearch('')} aria-label="Clear search"><X size={14} /></button>}
          {searchOpen && search && <div className="cc-search-results">{searchResults.length ? searchResults.map((result, index) => <button key={`${result.name}-${index}`} onClick={() => { navigate(result.go); setSearchOpen(false); setSearch('') }}>{result.name}<ArrowRight size={14} /></button>) : <span>No matching records found.</span>}</div>}
        </div>
        <button className="cc-icon-button cc-mobile-menu" onClick={() => setMobileNavOpen(open => !open)} aria-label={mobileNavOpen ? 'Close navigation' : 'Open navigation'}><Menu size={19} /></button>
        <button className="cc-date-chip" onClick={() => { setSelectedDate(todayKey); navigate('/planner') }}><CalendarDays size={15} />{friendlyDate(todayKey, { weekday: 'short', month: 'short', day: 'numeric' })}</button>
      </div>
    </header>
    <div className="cc-layout">
      {mobileNavOpen && <button className="cc-sidebar-scrim" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}
      <aside className={`cc-sidebar ${mobileNavOpen ? 'mobile-open' : ''}`}>
        <div className="cc-goal-card"><span className="cc-label">YOUR NORTH STAR</span><strong>GATE 2027</strong><span>Target rank · AIR &lt;100</span><div className="cc-goal-papers">{data.paper}</div></div>
        <nav>{navItems.map(item => <button key={item.path} className={`cc-nav-item ${section === item.path ? 'active' : ''}`} onClick={() => { navigate(item.path); setMobileNavOpen(false) }}><item.icon size={16} /><span>{item.label}</span>{section === item.path && <span className="cc-nav-indicator" />}</button>)}</nav>
        <div className="cc-sidebar-bottom"><span className="cc-demo-dot" /> Demo workspace · saved on this device</div>
      </aside>
      <main className="cc-main">
        <div className="cc-page-head"><div><span className="cc-eyebrow">PLAN · EXECUTE · MEASURE · ANALYZE · CORRECT · REPEAT</span><h1>{section === '/' ? `${getGreeting()}, ${getUserName()}` : currentNav.label}</h1><p>{section === '/' ? 'Build consistency. Measure mastery. Close the gaps.' : section === '/planner' ? `Your execution plan for ${friendlyDate(selectedDate)}` : `${currentNav.label} · GATE 2027 preparation workspace`}</p></div>
          <div className="cc-head-actions">{section === '/planner' && <input aria-label="Planner date" className="cc-input cc-date-input" type="date" value={selectedDate} onChange={event => setSelectedDate(event.target.value)} />}<button className="cc-button primary" onClick={() => setModal('task')}><Plus size={16} /> Add task</button></div>
        </div>
        {section === '/' && <DashboardView data={data} todayTasks={data.tasks.filter(task => task.date === todayKey)} revisions={data.revisions.filter(revision => revision.dueDate <= todayKey && revision.status !== 'Completed')} studyMinutes={data.sessions.filter(session => session.date === todayKey).reduce((sum, session) => sum + session.duration, 0)} stageAverage={stageAverage} pyqAttemptRate={pyqAttemptRate} accuracy={accuracy} readiness={readiness} tests={data.tests} onNavigate={navigate} onTaskStatus={updateTask} onQuick={kind => setModal(kind)} />}
        {section === '/check-in' && <PreparationContribution historyOnly />}
        {section === '/planner' && <PlannerView data={data} date={selectedDate} day={currentDay} tasks={currentTasks} revisions={data.revisions.filter(revision => revision.dueDate === selectedDate && revision.status !== 'Completed')} studyMinutes={studyMinutes} setDate={setSelectedDate} updateTask={updateTask} deleteTask={id => setData(previous => ({ ...previous, tasks: previous.tasks.filter(task => task.id !== id) }))} updateDay={updateDay} addTask={addTask} onCompleteRevision={completeRevision} onCarry={carryTask} />}
        {section === '/calendar' && <CalendarView data={data} date={selectedDate} month={calendarMonth} setMonth={setCalendarMonth} mode={calendarMode} setMode={setCalendarMode} onSelect={date => { setSelectedDate(date); navigate('/planner') }} />}
        {section === '/syllabus' && <SyllabusView data={data} tab={paperTab} setTab={setPaperTab} updateTopic={updateTopic} onLearn={markLearned} />}
        {section === '/pyqs' && <PyqView pyqs={filteredPyqs} allPyqs={data.pyqs} filter={pyqFilter} setFilter={setPyqFilter} onUpdate={(id, patch) => setData(previous => ({ ...previous, pyqs: previous.pyqs.map(pyq => pyq.id === id ? { ...pyq, ...patch } : pyq) }))} onDelete={id => window.confirm('Delete this PYQ record?') && setData(previous => ({ ...previous, pyqs: previous.pyqs.filter(pyq => pyq.id !== id) }))} onAdd={() => setModal('pyq')} />}
        {section === '/revision' && <RevisionView data={data} updateRevision={updateRevision} onComplete={completeRevision} />}
        {section === '/mistakes' && <MistakesView data={data} onAdd={() => setModal('mistake')} onUpdate={(id, patch) => setData(previous => ({ ...previous, mistakes: previous.mistakes.map(mistake => mistake.id === id ? { ...mistake, ...patch } : mistake) }))} onDelete={id => window.confirm('Delete this mistake record?') && setData(previous => ({ ...previous, mistakes: previous.mistakes.filter(mistake => mistake.id !== id) }))} />}
        {section === '/tests' && <TestsView data={data} onAdd={() => setModal('test')} onEdit={id => { setEditingTestId(id); setModal('test-edit') }} onDelete={id => window.confirm('Delete this test result?') && setData(previous => ({ ...previous, tests: previous.tests.filter(test => test.id !== id) }))} />}
        {section === '/timer' && <TimerView data={data} setData={setData} now={timerNow} onStart={startTimer} onStop={stopTimer} onPeriodElapsed={finishTimerPeriod} />}
        {section === '/command-analytics' && <AnalyticsView data={data} stageAverage={stageAverage} />}
        {section === '/weekly-review' && <WeeklyReviewView data={data} onSave={addWeeklyReview} />}
        {section === '/goals' && <GoalsView data={data} setData={setData} onAdd={() => setModal('goal')} />}
        {section === '/settings' && <SettingsView data={data} setData={setData} />}
        {makeModal()}
      </main>
    </div>
    <div className="cc-bottom-nav">{navItems.slice(0, 5).map(item => <button key={item.path} className={section === item.path ? 'active' : ''} onClick={() => navigate(item.path)}><item.icon size={18} /><span>{item.label}</span></button>)}</div>
    <button className="cc-quick-add" onClick={() => setQuickOpen(!quickOpen)} aria-label="Quick add"><Plus size={21} /></button>
    {quickOpen && <div className="cc-quick-menu">{[['task', 'Task'], ['syllabus', 'Topic'], ['pyq', 'PYQ'], ['mistake', 'Mistake'], ['revision', 'Revision'], ['test', 'Test'], ['timer', 'Study session'], ['weekly-review', 'Weekly review']].map(([path, label]) => <button key={path} onClick={() => { setQuickOpen(false); if (path === 'timer' || path === 'syllabus' || path === 'revision' || path === 'weekly-review') navigate(`/${path}`); else setModal(path) }}><Plus size={14} />{label}</button>)}</div>}
    {toast && <div className="cc-toast"><CheckCircle2 size={16} />{toast}<button onClick={() => setToast('')} aria-label="Dismiss notification"><X size={14} /></button></div>}
  </div>
}

function Onboarding({ data, complete }: { data: TrackerData; complete: (data: TrackerData) => void }) {
  const [paper, setPaper] = useState(data.paper)
  const [daily, setDaily] = useState(data.dailyTargetHours)
  const [weekly, setWeekly] = useState(data.weeklyTargetHours)
  return <div className="cc-onboarding"><div className="cc-onboard-card"><div className="cc-brand-mark large"><Target size={25} /></div><span className="cc-eyebrow">GATE 2027 COMMAND CENTER</span><h1>What's your target?</h1><p>Set your north star. We'll turn the work into a measurable plan.</p>
    <label>Exam year<div className="cc-fixed-input">GATE 2027 <span>Target exam</span></div></label>
    <label>Paper<div className="cc-choice-row">{(['CSE', 'DA', 'CSE + DA'] as const).map(option => <button type="button" key={option} className={paper === option ? 'selected' : ''} onClick={() => setPaper(option)}>{option}</button>)}</div></label>
    <label>Target rank<div className="cc-fixed-input">&lt;100 <span>Target rank</span></div></label>
    <div className="cc-onboard-grid"><label>Daily study target<input type="number" min="1" max="16" value={daily} onChange={event => setDaily(Number(event.target.value))} /></label><label>Weekly study target<input type="number" min="1" max="100" value={weekly} onChange={event => setWeekly(Number(event.target.value))} /></label></div>
    <button className="cc-button primary full" onClick={() => complete({ ...data, paper, dailyTargetHours: daily, weeklyTargetHours: weekly, onboardingComplete: true })}>Build my command center <ArrowRight size={16} /></button>
    <small>Your tracker data stays in this browser. Cloud sync can be added later.</small>
  </div></div>
}

function DashboardView({ data, todayTasks, revisions, studyMinutes, stageAverage, pyqAttemptRate, accuracy, readiness, tests, onNavigate, onTaskStatus, onQuick }: {
  data: TrackerData; todayTasks: Task[]; revisions: Revision[]; studyMinutes: number; stageAverage: number; pyqAttemptRate: number; accuracy: number; readiness: number;
  tests: TestRecord[]; onNavigate: (path: string) => void; onTaskStatus: (id: string, patch: Partial<Task>) => void; onQuick: (kind: string) => void
}) {
  const completedTasks = todayTasks.filter(task => task.status === 'Completed').length
  const day = dayRecord(data, todayKey)
  const dailyCompletion = Math.round((completedTasks + (studyMinutes >= data.dailyTargetHours * 60 ? 1 : 0) + (revisions.length === 0 ? 1 : 0)) / (todayTasks.length + 2) * 100)
  const weakTopics = data.topics.filter(topic => topic.strength === 'Weak').sort((a, b) => a.accuracy - b.accuracy).slice(0, 4)
  const history = Array.from({ length: 7 }, (_, index) => {
    const date = inDays(todayKey, index - 6)
    return { date, hours: data.sessions.filter(session => session.date === date).reduce((sum, session) => sum + session.duration, 0) / 60 }
  })
  const barMax = Math.max(1, ...history.map(item => item.hours))
  const mistakeCounts = data.mistakes.reduce<Record<string, number>>((result, item) => { result[item.category] = (result[item.category] || 0) + 1; return result }, {})
  const repeated = Object.entries(mistakeCounts).sort((a, b) => b[1] - a[1]).slice(0, 4)
  const recommendations: { icon: typeof Activity; tone: string; text: string; detail: string; path: string }[] = []
  const dueRevision = data.revisions.find(revision => revision.dueDate <= todayKey && revision.status !== 'Completed')
  if (dueRevision) recommendations.push({ icon: RotateCcw, tone: 'red', text: `Revise ${dueRevision.subject} — ${dueRevision.topic}`, detail: `${dueRevision.type} · due ${dueRevision.dueDate < todayKey ? 'overdue' : 'today'}`, path: '/revision' })
  const weakest = data.topics.filter(topic => topic.strength === 'Weak').sort((a, b) => a.accuracy - b.accuracy)[0]
  if (weakest) recommendations.push({ icon: Target, tone: 'red', text: `Strengthen ${weakest.subject} · ${weakest.name}`, detail: `${weakest.accuracy}% accuracy · ${weakest.questions} questions logged`, path: '/syllabus' })
  const overduePyq = data.pyqs.find(pyq => pyq.result === 'Marked for Reattempt' || pyq.reattemptDate && pyq.reattemptDate <= todayKey && pyq.result !== 'Mastered')
  if (overduePyq) recommendations.push({ icon: BookOpen, tone: 'amber', text: `Reattempt ${overduePyq.subject} PYQ`, detail: `${overduePyq.topic} · ${overduePyq.id}`, path: '/pyqs' })
  const openTask = todayTasks.filter(task => task.status !== 'Completed').sort((a, b) => (a.priority === 'High' ? -1 : 0) - (b.priority === 'High' ? -1 : 0))[0]
  if (openTask) recommendations.push({ icon: ListChecks, tone: 'blue', text: openTask.title, detail: `${openTask.subject} · ${openTask.estimatedMinutes} min · ${openTask.priority} priority`, path: '/planner' })
  const syllabusGap = data.topics.find(topic => topic.stage < 1)
  if (syllabusGap) recommendations.push({ icon: BookOpen, tone: 'green', text: `Start ${syllabusGap.subject} · ${syllabusGap.name}`, detail: 'Long-term syllabus coverage gap', path: '/syllabus' })
  return <div className="cc-content">
    <div className="cc-banner"><div className="cc-banner-copy"><span className="cc-label">THE LONG GAME</span><h2>GATE 2027 <span>·</span> AIR &lt;100</h2><p>Progress is built in the quiet work between mock tests.</p></div><div className="cc-banner-status"><span className="cc-live-dot" /> Your preparation, in focus <button onClick={() => onNavigate('/goals')}>View goals <ArrowRight size={13} /></button></div><div className="cc-banner-watermark"><Target size={98} strokeWidth={0.8} /></div></div>
    <div className="cc-stats-grid">
      <Stat label="Today's completion" value={percent(dailyCompletion)} hint={`${completedTasks} of ${todayTasks.length} tasks`} icon={CheckCircle2} color="green" />
      <Stat label="Study hours" value={formatMinutes(studyMinutes)} hint={`Target ${data.dailyTargetHours} hours`} icon={Clock3} color="blue" />
      <Stat label="Questions solved" value={String(day.attempted)} hint={`${day.correct} correct today`} icon={HelpCircle} color="violet" />
      <Stat label="PYQs solved" value={String(day.pyqsAttempted || data.pyqs.filter(pyq => pyq.attemptDate === todayKey && pyq.result !== 'Unattempted').length)} hint="Across your prep log" icon={BookOpen} color="orange" />
      <Stat label="Accuracy" value={percent(accuracy || dailyQuestionAccuracyFrom(day))} hint="From recorded attempts" icon={Target} color="green" />
      <Stat label="Study streak" value={`${studyStreak(data)} days`} hint="Consistency over intensity" icon={Flame} color="orange" />
      <Stat label="Topics completed" value={`${data.topics.filter(topic => topic.stage >= 8).length}`} hint={`of ${data.topics.length} tracked`} icon={GraduationCap} color="blue" />
      <Stat label="Latest mock" value={tests.find(test => test.type === 'Full-Length Mock') ? `${tests.find(test => test.type === 'Full-Length Mock')?.score}/${tests.find(test => test.type === 'Full-Length Mock')?.maxMarks}` : '—'} hint={tests.find(test => test.type === 'Full-Length Mock')?.name ?? 'Add your first mock'} icon={Trophy} color="violet" />
    </div>
    <div className="cc-progress-summary"><div><span>Overall progress</span><strong>{percent((stageAverage + pyqAttemptRate + accuracy) / 3)}</strong></div><ProgressBar value={(stageAverage + pyqAttemptRate + accuracy) / 3} /><div className="cc-progress-mini"><div><span>Syllabus</span><strong>{percent(stageAverage)}</strong><ProgressBar value={stageAverage} color="green" /></div><div><span>PYQs</span><strong>{percent(pyqAttemptRate)}</strong><ProgressBar value={pyqAttemptRate} color="violet" /></div><div><span>Revision</span><strong>{percent(data.revisions.length ? data.revisions.filter(item => item.status === 'Completed').length / data.revisions.length * 100 : 0)}</strong><ProgressBar value={data.revisions.length ? data.revisions.filter(item => item.status === 'Completed').length / data.revisions.length * 100 : 0} color="orange" /></div></div></div>
    <Panel title="What should I do today?" subtitle="Priority: revision due → weak topics → reattempts → planned tasks → syllabus gaps.">
      {recommendations.length ? <div className="cc-recommendations">{recommendations.slice(0, 5).map((item, index) => <button key={`${item.path}-${item.text}`} onClick={() => onNavigate(item.path)}><span className={`cc-recommend-number ${item.tone}`}>{index + 1}</span><item.icon size={15} /><span><strong>{item.text}</strong><small>{item.detail}</small></span><ArrowRight size={14} /></button>)}</div> : <Empty title="You're caught up on the highest-priority work" detail="Add a task or mark a topic weak to get a focused recommendation." />}
    </Panel>
    <div className="cc-dashboard-grid">
      <Panel title="Today's priorities" subtitle="Small, finishable steps move the score." action={<button className="cc-text-button" onClick={() => onNavigate('/planner')}>Open planner <ArrowRight size={14} /></button>}>
        <div className="cc-task-list">{todayTasks.slice().sort((a, b) => Number(b.isMIT) - Number(a.isMIT)).slice(0, 4).map((task, index) => <div className="cc-task-row" key={task.id}><button className={`cc-check ${task.status === 'Completed' ? 'checked' : ''}`} onClick={() => onTaskStatus(task.id, { status: task.status === 'Completed' ? 'Not Started' : 'Completed' })} aria-label="Toggle task completion">{task.status === 'Completed' && <Check size={13} />}</button><div className="cc-task-info"><strong>{task.title}</strong><span>{task.subject} · {task.topic} · {task.estimatedMinutes} min</span></div><span className={`cc-priority ${task.priority.toLowerCase()}`}>{task.isMIT ? `MIT ${index + 1}` : task.priority}</span></div>)}{!todayTasks.length && <Empty title="Your plan is clear" detail="Add a task to make today count." />}</div>
      </Panel>
      <Panel title="Revision due today" subtitle="Spaced repetition beats last-minute cramming." action={<button className="cc-text-button" onClick={() => onNavigate('/revision')}>All revisions <ArrowRight size={14} /></button>}>
        {revisions.length ? <div className="cc-revision-list">{revisions.slice(0, 4).map(revision => <div key={revision.id} className="cc-revision-item"><span className={`cc-revision-dot ${revision.weak ? 'red' : revision.type === 'R1' ? 'amber' : 'green'}`} /><div><strong>{revision.subject} — {revision.topic}</strong><span>{revision.type} · Due today</span></div><button className="cc-icon-button" onClick={() => onNavigate('/revision')} aria-label="Open revision"><ArrowRight size={15} /></button></div>)}</div> : <Empty title="Nothing due right now" detail="Keep learning topics to build your revision queue." />}
      </Panel>
      <Panel title="Study hours" subtitle="Focused time · last 7 days" action={<button className="cc-text-button" onClick={() => onNavigate('/command-analytics')}>Analytics <ArrowRight size={14} /></button>}>
        <div className="cc-bar-chart">{history.map(item => <div className="cc-bar-col" key={item.date}><div className="cc-bar-tooltip">{item.hours.toFixed(1)}h</div><div className="cc-bar-area"><span style={{ height: `${Math.max(3, item.hours / barMax * 100)}%` }} /></div><small>{friendlyDate(item.date, { weekday: 'short' })}</small></div>)}</div><div className="cc-chart-foot"><strong>{formatMinutes(Math.round(history.reduce((sum, item) => sum + item.hours, 0) * 60))}</strong><span>total focus this week</span></div>
      </Panel>
      <Panel title="Preparation readiness" subtitle="Internal preparation indicator — NOT a prediction of actual GATE rank." className="cc-readiness-panel">
        <div className="cc-readiness-score"><div className="cc-ring" style={{ '--score': `${readiness * 3.6}deg` } as CSSProperties}><strong>{readiness}<small>/100</small></strong></div><div><span className="cc-label">PREPARATION READINESS</span><p>Consistency compounded over time.</p></div></div><div className="cc-readiness-notes"><div><CheckCircle2 size={15} /><span>Strong: {accuracy >= 70 ? 'PYQ accuracy' : 'Study rhythm'} · Revision consistency</span></div><div className="warn"><CircleAlert size={15} /><span>Improve: {tests.length ? `${tests[0].subject} mock performance` : 'Record mock test scores'} · weak topics</span></div></div>
      </Panel>
      <Panel title="Weak topics" subtitle="Spend time where it changes the result." action={<button className="cc-text-button" onClick={() => onNavigate('/syllabus')}>Syllabus <ArrowRight size={14} /></button>}>
        {weakTopics.length ? <div className="cc-weak-list">{weakTopics.map(topic => <div key={topic.id}><div className="cc-weak-top"><span>{topic.subject} <small>· {topic.name}</small></span><strong>{topic.accuracy}%</strong></div><ProgressBar value={topic.accuracy} color="red" /></div>)}</div> : <Empty title="No weak topics found" detail="Log your topic accuracy to see gaps here." />}
      </Panel>
      <Panel title="Mistakes to learn from" subtitle="Patterns are more useful than isolated scores." action={<button className="cc-text-button" onClick={() => onNavigate('/mistakes')}>Notebook <ArrowRight size={14} /></button>}>
        {repeated.length ? <div className="cc-mistake-summary">{repeated.map(([category, count]) => <div key={category}><span className="cc-mistake-icon"><CircleAlert size={14} /></span><span>{category}</span><strong>{count}</strong></div>)}</div> : <Empty title="No mistakes logged" detail="Capture a mistake to prevent repeating it." />}
      </Panel>
    </div>
    <PreparationContribution />
    <Panel title="Your preparation loop" subtitle="Lecture watched is not the same as topic mastered." className="cc-loop-panel"><div className="cc-learning-loop">{['Theory', 'Questions', 'PYQs', 'Revision', 'Test', 'Mastered'].map((label, index) => <div key={label} className={index < 3 ? 'done' : ''}><span>{index < 3 ? <Check size={13} /> : index + 1}</span><strong>{label}</strong>{index < 5 && <i />}</div>)}</div></Panel>
    <div className="cc-shortcuts"><button onClick={() => onQuick('pyq')}><Plus size={16} /> Log a PYQ</button><button onClick={() => onNavigate('/timer')}><Clock3 size={16} /> Start a focus session</button><button onClick={() => onQuick('mistake')}><CircleAlert size={16} /> Capture a mistake</button></div>
    <div className="cc-footnote"><ShieldCheck size={14} /> Your preparation data is saved in this browser. Readiness is an internal planning metric, never a rank prediction.</div>
  </div>
}
function dailyQuestionAccuracyFrom(day: DayRecord) { return day.attempted ? day.correct / day.attempted * 100 : 0 }
function studyStreak(data: TrackerData) {
  const active = new Set(data.sessions.map(session => session.date))
  let count = 0
  let date = todayKey
  if (!active.has(date)) date = inDays(date, -1)
  while (active.has(date) && count < 365) { count++; date = inDays(date, -1) }
  return count || 0
}

function PlannerView({ data, date, day, tasks, revisions, studyMinutes, setDate, updateTask, deleteTask, updateDay, addTask, onCompleteRevision, onCarry }: {
  data: TrackerData; date: string; day: DayRecord; tasks: Task[]; revisions: Revision[]; studyMinutes: number; setDate: (date: string) => void;
  updateTask: (id: string, patch: Partial<Task>) => void; deleteTask: (id: string) => void; updateDay: (patch: Partial<DayRecord>) => void; addTask: (task: Omit<Task, 'id' | 'date' | 'carryCount'> & { date?: string }) => boolean;
  onCompleteRevision: (revision: Revision) => void; onCarry: (task: Task, date: string) => void
}) {
  const [carryDates, setCarryDates] = useState<Record<string, string>>({})
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const mitCount = tasks.filter(task => task.isMIT).length
  const attemptedWrong = day.attempted - day.correct
  const pyqWrong = day.pyqsAttempted - day.pyqsCorrect
  const toggleTask = (task: Task) => updateTask(task.id, { status: task.status === 'Completed' ? 'Not Started' : 'Completed' })
  const moveTask = (index: number, direction: number) => {
    const arranged = [...tasks]
    const target = index + direction
    if (target < 0 || target >= arranged.length) return
    ;[arranged[index], arranged[target]] = [arranged[target], arranged[index]]
    arranged.forEach((task, order) => updateTask(task.id, { order }))
  }
  const moveTaskTo = (from: number, to: number) => {
    if (from === to) return
    const arranged = [...tasks]
    const [item] = arranged.splice(from, 1)
    if (!item) return
    arranged.splice(to, 0, item)
    arranged.forEach((task, order) => updateTask(task.id, { order }))
  }
  const ordered = tasks
  const completed = tasks.filter(task => task.status === 'Completed').length
  return <div className="cc-content">
    <div className="cc-planner-date"><div><span className="cc-label">SELECTED DAY</span><strong>{friendlyDate(date, { weekday: 'long', month: 'long', day: 'numeric' })}</strong><span>Plan honestly. Execute one focused block at a time.</span></div><input type="date" aria-label="Select planner date" className="cc-input" value={date} onChange={event => setDate(event.target.value)} /></div>
    <div className="cc-planner-grid">
      <div className="cc-planner-main">
        <Panel title="Most Important Tasks" subtitle={`Choose no more than 3 MITs · ${mitCount}/3 assigned`} action={<button className="cc-button secondary small" onClick={() => setShowTaskForm(true)}><Plus size={14} /> Add task</button>}>
          <div className="cc-task-list planner">{ordered.map((task, index) => <div className="cc-planner-task" key={task.id} draggable onDragStart={() => setDragIndex(index)} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); if (dragIndex !== null) moveTaskTo(dragIndex, index); setDragIndex(null) }} onDragEnd={() => setDragIndex(null)}>
            <button className={`cc-check ${task.status === 'Completed' ? 'checked' : ''}`} onClick={() => toggleTask(task)} aria-label="Toggle task">{task.status === 'Completed' && <Check size={13} />}</button>
            <div className="cc-task-info"><div className="cc-task-title-row"><strong className={task.status === 'Completed' ? 'line-through' : ''}>{task.title}</strong>{task.isMIT && <span className="cc-mit-label">MIT</span>}{task.carryCount >= 3 && <span className="cc-warning-pill">Split this task</span>}<button className="cc-icon-button cc-edit-task" onClick={() => setEditingTaskId(editingTaskId === task.id ? null : task.id)} aria-label="Edit task"><Pencil size={12} /></button></div><span>{task.subject} · {task.topic} · {task.estimatedMinutes} min · {task.priority} priority</span>{task.notes && <small>{task.notes}</small>}{editingTaskId === task.id && <div className="cc-inline-task-edit"><input className="cc-input" aria-label="Task title" value={task.title} onChange={event => updateTask(task.id, { title: event.target.value })} /><div className="cc-form-grid two"><select className="cc-input" aria-label="Task subject" value={task.subject} onChange={event => updateTask(task.id, { subject: event.target.value })}>{subjects.map(item => <option key={item.name}>{item.name}</option>)}</select><input className="cc-input" aria-label="Task topic" value={task.topic} onChange={event => updateTask(task.id, { topic: event.target.value })} /></div><div className="cc-form-grid two"><input className="cc-input" aria-label="Estimated minutes" type="number" min="1" value={task.estimatedMinutes} onChange={event => updateTask(task.id, { estimatedMinutes: Math.max(1, Number(event.target.value)) })} /><input className="cc-input" aria-label="Task notes" value={task.notes} onChange={event => updateTask(task.id, { notes: event.target.value })} placeholder="Notes" /></div><button className="cc-text-button" onClick={() => setEditingTaskId(null)}>Done editing <Check size={12} /></button></div>}<div className="cc-task-control-row"><select value={task.status} onChange={event => updateTask(task.id, { status: event.target.value as TaskStatus })} aria-label="Task status">{['Not Started', 'In Progress', 'Completed', 'Carried Forward'].map(status => <option key={status}>{status}</option>)}</select><button className="cc-subtle-button" disabled={!task.isMIT && mitCount >= 3} onClick={() => updateTask(task.id, { isMIT: !task.isMIT })}>{task.isMIT ? 'Remove MIT' : mitCount < 3 ? 'Make MIT' : 'MIT limit reached'}</button><button className="cc-subtle-button danger" onClick={() => window.confirm('Delete this task?') && deleteTask(task.id)}>Delete</button></div>
              {task.status !== 'Completed' && <div className="cc-carry-row"><span>Carry forward</span><input type="date" className="cc-input compact" min={date} value={carryDates[task.id] ?? inDays(date, 1)} onChange={event => setCarryDates(previous => ({ ...previous, [task.id]: event.target.value }))} /><button className="cc-text-button" onClick={() => onCarry(task, carryDates[task.id] ?? inDays(date, 1))}>Move <ArrowRight size={13} /></button></div>}</div>
            <div className="cc-order-controls"><button onClick={() => moveTask(index, -1)} aria-label="Move task up"><ArrowUp size={13} /></button><button onClick={() => moveTask(index, 1)} aria-label="Move task down"><ArrowDown size={13} /></button></div>
          </div>)}{!tasks.length && <Empty title="No tasks planned for this day" detail="Add specific, achievable tasks to make execution measurable." />}</div>
          {showTaskForm && <TaskForm date={date} subjects={subjects.map(subject => subject.name)} existingMIT={mitCount} close={() => setShowTaskForm(false)} submit={values => { const ok = addTask(values); if (ok) setShowTaskForm(false); return ok }} />}
        </Panel>
        <Panel title="Theory & concept work" subtitle="Track learning actions separately from mastery.">
          <div className="cc-form-grid two"><label>Subject<select className="cc-input" value={day.theorySubject} onChange={event => updateDay({ theorySubject: event.target.value })}><option value="">Choose subject</option>{subjects.map(item => <option key={item.name}>{item.name}</option>)}</select></label><label>Topic<input className="cc-input" value={day.theoryTopic} placeholder="e.g. Normalization" onChange={event => updateDay({ theoryTopic: event.target.value })} /></label></div>
          <div className="cc-checkbox-grid">{([{ key: 'theory', label: 'Lecture / theory completed' }, { key: 'concepts', label: 'Concept understood' }, { key: 'notes', label: 'Notes completed' }, { key: 'recall', label: 'Active recall completed' }] as const).map(({ key, label }) => <label key={key} className="cc-check-card"><input type="checkbox" checked={day[key]} onChange={event => updateDay({ [key]: event.target.checked })} /><span className="cc-check" aria-hidden="true">{day[key] && <Check size={13} />}</span>{label}</label>)}</div>
          <div className="cc-theory-progress"><span>Theory completion</span><strong>{percent([day.theory, day.concepts, day.notes, day.recall].filter(Boolean).length / 4 * 100)}</strong><ProgressBar value={[day.theory, day.concepts, day.notes, day.recall].filter(Boolean).length / 4 * 100} color="violet" /></div>
        </Panel>
        <Panel title="Questions & practice" subtitle="Correct / attempted · accuracy updates as you go.">
          <div className="cc-input-stats"><label>Target questions<input className="cc-input" type="number" min="0" value={day.targetQuestions} onChange={event => updateDay({ targetQuestions: Number(event.target.value) })} /></label><label>Attempted<input className="cc-input" type="number" min="0" value={day.attempted} onChange={event => updateDay({ attempted: Number(event.target.value), correct: Math.min(day.correct, Number(event.target.value)) })} /></label><label>Correct<input className="cc-input" type="number" min="0" max={day.attempted} value={day.correct} onChange={event => updateDay({ correct: Math.min(day.attempted, Number(event.target.value)) })} /></label><label>Wrong<strong className="cc-static-value">{Math.max(0, attemptedWrong)}</strong></label><label>Skipped<strong className="cc-static-value">{Math.max(0, day.targetQuestions - day.attempted)}</strong></label><label>Accuracy<strong className="cc-static-value">{percent(dailyQuestionAccuracyFrom(day))}</strong></label></div>
        </Panel>
        <Panel title="PYQ practice" subtitle="Year-wise previous question practice.">
          <div className="cc-input-stats"><label>Target PYQs<input className="cc-input" type="number" min="0" value={day.targetPyqs} onChange={event => updateDay({ targetPyqs: Number(event.target.value) })} /></label><label>Attempted<input className="cc-input" type="number" min="0" value={day.pyqsAttempted} onChange={event => updateDay({ pyqsAttempted: Number(event.target.value), pyqsCorrect: Math.min(day.pyqsCorrect, Number(event.target.value)) })} /></label><label>Correct<input className="cc-input" type="number" min="0" max={day.pyqsAttempted} value={day.pyqsCorrect} onChange={event => updateDay({ pyqsCorrect: Math.min(day.pyqsAttempted, Number(event.target.value)) })} /></label><label>Wrong<strong className="cc-static-value">{Math.max(0, pyqWrong)}</strong></label><label>Accuracy<strong className="cc-static-value">{percent(day.pyqsAttempted ? day.pyqsCorrect / day.pyqsAttempted * 100 : 0)}</strong></label><label>Years attempted<input className="cc-input" value={day.pyqYears} onChange={event => updateDay({ pyqYears: event.target.value })} placeholder="2024, 2023..." /></label></div><label className="cc-field-block">Difficult PYQs<input className="cc-input" value={day.difficultPyqs} onChange={event => updateDay({ difficultPyqs: event.target.value })} placeholder="Add question IDs that need another look" /></label>
        </Panel>
        <Panel title="Today's revisions" subtitle="R0 same day · R1 tomorrow · R2 +7 days · R3 +21–30 days">
          {revisions.length ? revisions.map(revision => <div key={revision.id} className="cc-revision-item planner-revision"><span className={`cc-revision-dot ${revision.weak ? 'red' : 'amber'}`} /><div><strong>{revision.subject} — {revision.topic}</strong><span>{revision.type} · due {friendlyDate(revision.dueDate, { month: 'short', day: 'numeric' })}</span></div><button className="cc-button secondary small" onClick={() => onCompleteRevision(revision)}>Complete</button></div>) : <Empty title="No revision due on this date" detail="Newly learned topics automatically enter the spaced revision queue." />}
        </Panel>
      </div>
      <aside className="cc-planner-side">
        <Panel title="Daily scorecard" subtitle="Targets vs execution">
          <ScoreRow label="Study hours" target={`${data.dailyTargetHours}h`} actual={formatMinutes(studyMinutes)} value={Math.min(studyMinutes / (data.dailyTargetHours * 60) * 100, 100)} />
          <ScoreRow label="Questions" target={String(day.targetQuestions)} actual={String(day.attempted)} value={Math.min(day.attempted / Math.max(day.targetQuestions, 1) * 100, 100)} />
          <ScoreRow label="PYQs" target={String(day.targetPyqs)} actual={String(day.pyqsAttempted)} value={Math.min(day.pyqsAttempted / Math.max(day.targetPyqs, 1) * 100, 100)} />
          <ScoreRow label="Revision" target="60 min" actual={`${day.revisionMinutes} min`} value={Math.min(day.revisionMinutes / 60 * 100, 100)} />
          <ScoreRow label="Accuracy" target="85%+" actual={percent(dailyQuestionAccuracyFrom(day))} value={dailyQuestionAccuracyFrom(day)} />
          <div className="cc-divider" /><div className="cc-day-status"><label>Day status</label><div>{(['Completed', 'Partially Completed', 'Rest Day'] as const).map(status => <button key={status} className={day.dayStatus === status ? 'selected' : ''} onClick={() => updateDay({ dayStatus: status })}>{status}</button>)}</div></div>
        </Panel>
        <Panel title="Close the day" subtitle="Short reflection turns activity into learning."><label className="cc-field-block">One thing I learned today<textarea className="cc-input" rows={3} value={day.learned} onChange={event => updateDay({ learned: event.target.value })} placeholder="Capture one specific takeaway..." /></label><label className="cc-field-block">First task for tomorrow<input className="cc-input" value={day.tomorrow} onChange={event => updateDay({ tomorrow: event.target.value })} placeholder="Make starting tomorrow easier" /></label></Panel>
        <Panel title="Distraction log" subtitle="Awareness, not guilt."><DistractionEditor day={day} updateDay={updateDay} /><div className="cc-distraction-total"><span>Logged distraction</span><strong>{day.distractions.reduce((sum, item) => sum + item.minutes, 0)} min</strong></div></Panel>
        <Panel title="Progress snapshot"><div className="cc-score-big">{percent(tasks.length ? completed / tasks.length * 100 : 0)}<span>tasks completed</span></div><ProgressBar value={tasks.length ? completed / tasks.length * 100 : 0} color="green" /><p className="cc-muted-note">{tasks.filter(task => task.status !== 'Completed').length} tasks still open. Carry them forward deliberately—nothing disappears.</p></Panel>
      </aside>
    </div>
  </div>
}

function ScoreRow({ label, target, actual, value }: { label: string; target: string; actual: string; value: number }) {
  return <div className="cc-score-row"><div><span>{label}</span><span><b>{actual}</b><small> / {target}</small></span></div><ProgressBar value={value} color={value >= 85 ? 'green' : value >= 50 ? 'blue' : 'orange'} /></div>
}

function DistractionEditor({ day, updateDay }: { day: DayRecord; updateDay: (patch: Partial<DayRecord>) => void }) {
  const [name, setName] = useState('Social media')
  const [minutes, setMinutes] = useState(10)
  const add = () => {
    if (!name.trim() || minutes < 1 || minutes > 1440) return
    updateDay({ distractions: [...day.distractions, { name: name.trim(), minutes }] })
    setMinutes(10)
  }
  return <><div className="cc-distraction-form"><select className="cc-input" value={name} onChange={event => setName(event.target.value)}>{['Social media', 'YouTube', 'Movies / web series', 'Gaming', 'Other'].map(item => <option key={item}>{item}</option>)}</select><input className="cc-input" aria-label="Distraction duration in minutes" type="number" min="1" max="1440" value={minutes} onChange={event => setMinutes(Number(event.target.value))} /><button className="cc-button secondary small" onClick={add}>Log</button></div>{day.distractions.map((item, index) => <div className="cc-distraction-row" key={`${item.name}-${index}`}><span>{item.name}</span><span>{item.minutes}m <button className="cc-icon-button" onClick={() => updateDay({ distractions: day.distractions.filter((_, position) => position !== index) })} aria-label="Remove distraction"><X size={13} /></button></span></div>)}</>
}

function CalendarView({ data, date, month, setMonth, mode, setMode, onSelect }: {
  data: TrackerData; date: string; month: Date; setMonth: (date: Date) => void; mode: 'Month' | 'Week' | 'Day'; setMode: (mode: 'Month' | 'Week' | 'Day') => void; onSelect: (date: string) => void
}) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const gridStart = new Date(first)
  gridStart.setDate(1 - ((first.getDay() + 6) % 7))
  const days = Array.from({ length: 42 }, (_, index) => {
    const current = new Date(gridStart)
    current.setDate(gridStart.getDate() + index)
    return localDate(current)
  })
  const weekDayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const visibleDays = mode === 'Day' ? [date] : mode === 'Week' ? days.filter(day => {
    const start = new Date(`${date}T12:00:00`)
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
    const end = new Date(start); end.setDate(start.getDate() + 7)
    const item = new Date(`${day}T12:00:00`)
    return item >= start && item < end
  }) : days
  const stats = (day: string) => {
    const record = dayRecord(data, day)
    const tasks = data.tasks.filter(task => task.date === day)
    const tests = data.tests.filter(test => test.date === day)
    const minutes = data.sessions.filter(session => session.date === day).reduce((sum, session) => sum + session.duration, 0)
    const isFuture = day > todayKey
    const complete = tasks.length > 0 && tasks.every(task => task.status === 'Completed') && minutes > 0
    const partial = tasks.some(task => task.status === 'Completed') || minutes > 0 || record.attempted > 0
    return { record, tasks, tests, minutes, className: isFuture ? 'future' : complete ? 'complete' : partial ? 'partial' : 'missed' }
  }
  const shiftMonth = (direction: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + direction, 1))
  return <div className="cc-content"><Panel title="Day-wise calendar" subtitle="See execution at a glance and open any day to edit its planner." action={<div className="cc-segment">{(['Month', 'Week', 'Day'] as const).map(view => <button key={view} className={mode === view ? 'active' : ''} onClick={() => setMode(view)}>{view}</button>)}</div>}>
    <div className="cc-calendar-toolbar"><button className="cc-icon-button" onClick={() => shiftMonth(-1)} aria-label="Previous month"><ChevronLeft size={18} /></button><strong>{month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</strong><button className="cc-icon-button" onClick={() => shiftMonth(1)} aria-label="Next month"><ChevronRight size={18} /></button><button className="cc-text-button" onClick={() => { setMonth(new Date()); onSelect(todayKey) }}>Today</button></div>
    {mode !== 'Day' && <div className="cc-calendar-grid">{weekDayNames.map(name => <div className="cc-calendar-weekday" key={name}>{name}</div>)}{visibleDays.map(day => { const summary = stats(day); return <button key={day} className={`cc-calendar-day ${summary.className} ${day.slice(0, 7) !== localDate(month).slice(0, 7) ? 'outside' : ''} ${date === day ? 'selected' : ''}`} onClick={() => onSelect(day)}><strong>{Number(day.slice(-2))}</strong>{summary.tasks.length > 0 && <span className="cc-calendar-task-count">{summary.tasks.filter(task => task.status === 'Completed').length}/{summary.tasks.length} tasks</span>}{(summary.minutes > 0 || summary.record.pyqsAttempted > 0) && <small>{(summary.minutes / 60).toFixed(1)}h · {summary.record.pyqsAttempted} PYQ</small>}{summary.record.attempted > 0 && <small>{percent(summary.record.attempted ? summary.record.correct / summary.record.attempted * 100 : 0)} acc</small>}{summary.tests.length > 0 && <small className="cc-calendar-test">Test · {summary.tests.length}</small>}</button> })}</div>}
    {mode === 'Day' && <div className="cc-calendar-day-detail"><h3>{friendlyDate(date, { weekday: 'long', month: 'long', day: 'numeric' })}</h3><div className="cc-stats-grid compact"><Stat label="Tasks" value={String(stats(date).tasks.length)} hint="planned" icon={ListChecks} /><Stat label="Study" value={formatMinutes(stats(date).minutes)} hint="focused" icon={Clock3} /><Stat label="PYQs" value={String(stats(date).record.pyqsAttempted)} hint="attempted" icon={BookOpen} /><Stat label="Accuracy" value={percent(dailyQuestionAccuracyFrom(stats(date).record))} hint="questions" icon={Target} /></div><button className="cc-button primary" onClick={() => onSelect(date)}>Open this day's planner <ArrowRight size={15} /></button></div>}
    <div className="cc-calendar-legend"><span><i className="complete" />Completed</span><span><i className="partial" />In progress</span><span><i className="missed" />Missed / no activity</span><span><i className="future" />Future</span></div>
  </Panel><div className="cc-calendar-summary"><div><CalendarDays size={17} /><span>Tasks planned this month</span><strong>{data.tasks.filter(task => task.date.slice(0, 7) === localDate(month).slice(0, 7)).length}</strong></div><div><Clock3 size={17} /><span>Focused hours logged</span><strong>{(data.sessions.filter(session => session.date.slice(0, 7) === localDate(month).slice(0, 7)).reduce((sum, session) => sum + session.duration, 0) / 60).toFixed(1)}h</strong></div><div><BookOpen size={17} /><span>PYQs attempted</span><strong>{data.pyqs.filter(pyq => pyq.attemptDate.slice(0, 7) === localDate(month).slice(0, 7) && pyq.result !== 'Unattempted').length}</strong></div></div></div>
}

function SyllabusView({ data, tab, setTab, updateTopic, onLearn }: { data: TrackerData; tab: 'CSE' | 'DA' | 'Common'; setTab: (tab: 'CSE' | 'DA' | 'Common') => void; updateTopic: (id: string, patch: Partial<Topic>) => void; onLearn: (topic: Topic) => void }) {
  const visibleSubjects = subjects.filter(subject => subject.paper === tab)
  const topics = data.topics.filter(topic => topic.paper === tab)
  const [filter, setFilter] = useState('All topics')
  const visible = topics.filter(topic => filter === 'All topics' || filter === 'Weak' && topic.strength === 'Weak' || filter === 'Mastered' && topic.stage === 8)
  return <div className="cc-content"><div className="cc-tabs">{(['CSE', 'DA', 'Common'] as const).map(item => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item === 'Common' ? 'Common Topics' : `GATE ${item}`}</button>)}</div>
    <div className="cc-syllabus-overview"><div><span className="cc-label">{tab === 'Common' ? 'COMMON TOPICS' : `GATE ${tab}`}</span><h2>{percent(topics.length ? average(topics.map(topic => topic.stage / 8 * 100)) : 0)}<small> average progress</small></h2><ProgressBar value={topics.length ? average(topics.map(topic => topic.stage / 8 * 100)) : 0} /></div><div className="cc-syllabus-counts"><span><strong>{topics.filter(topic => topic.stage === 8).length}</strong>Mastered</span><span><strong>{topics.filter(topic => topic.strength === 'Weak').length}</strong>Weak topics</span><span><strong>{topics.reduce((sum, topic) => sum + topic.pyqs, 0)}</strong>PYQs logged</span></div></div>
    <div className="cc-list-toolbar"><span>{visibleSubjects.length} subjects · {visible.length} topics</span><select className="cc-input" value={filter} onChange={event => setFilter(event.target.value)}><option>All topics</option><option>Weak</option><option>Mastered</option></select></div>
    {visibleSubjects.map(subject => {
      const subjectTopics = visible.filter(topic => topic.subject === subject.name)
      if (!subjectTopics.length) return null
      const completion = average(subjectTopics.map(topic => topic.stage / 8 * 100))
      return <Panel key={subject.name} title={subject.name} subtitle={`${subjectTopics.length} topics · ${percent(completion)} complete`} className="cc-subject-panel"><div className="cc-topic-table"><div className="cc-topic-header"><span>Topic</span><span>Learning stage</span><span>Questions</span><span>PYQs</span><span>Accuracy</span><span>Strength</span></div>{subjectTopics.map(topic => <div className="cc-topic-row" key={topic.id}><div><strong>{topic.name}</strong><small>Revised {friendlyDate(topic.lastRevised, { month: 'short', day: 'numeric' })} · next {friendlyDate(topic.nextRevision, { month: 'short', day: 'numeric' })}</small></div><div className="cc-stage-control"><select className="cc-input" value={topic.stage} onChange={event => updateTopic(topic.id, { stage: Number(event.target.value) })}>{stageNames.map((name, index) => <option key={name} value={index}>{name}</option>)}</select><ProgressBar value={topic.stage / 8 * 100} /></div><input className="cc-input mini-number" type="number" min="0" value={topic.questions} aria-label={`Questions solved for ${topic.name}`} onChange={event => updateTopic(topic.id, { questions: Number(event.target.value) })} /><input className="cc-input mini-number" type="number" min="0" value={topic.pyqs} aria-label={`PYQs solved for ${topic.name}`} onChange={event => updateTopic(topic.id, { pyqs: Number(event.target.value) })} /><div className="cc-accuracy-edit"><input type="number" min="0" max="100" value={topic.accuracy} aria-label={`Accuracy for ${topic.name}`} onChange={event => updateTopic(topic.id, { accuracy: Math.max(0, Math.min(100, Number(event.target.value))), strength: Number(event.target.value) < 65 ? 'Weak' : Number(event.target.value) >= 85 ? 'Strong' : 'Developing' })} /><span>%</span></div><div className="cc-strength-control"><select value={topic.strength} onChange={event => updateTopic(topic.id, { strength: event.target.value as Topic['strength'] })}><option>Weak</option><option>Developing</option><option>Strong</option></select><button className="cc-icon-button" title="Mark learned and schedule R0" onClick={() => onLearn(topic)}><RotateCcw size={14} /></button></div></div>)}</div></Panel>
    })}<p className="cc-muted-note">Topic progression is deliberate: Theory → Questions → PYQs → Revision → Test → Mastered. Marking a topic as learned schedules R0 today and future reviews.</p>
  </div>
}

function PyqView({ pyqs, allPyqs, filter, setFilter, onUpdate, onDelete, onAdd }: { pyqs: Pyq[]; allPyqs: Pyq[]; filter: { subject: string; topic: string; difficulty: string; result: string; year: string }; setFilter: (filter: { subject: string; topic: string; difficulty: string; result: string; year: string }) => void; onUpdate: (id: string, patch: Partial<Pyq>) => void; onDelete: (id: string) => void; onAdd: () => void }) {
  const attempted = allPyqs.filter(pyq => pyq.result !== 'Unattempted')
  const correct = attempted.filter(pyq => ['Correct', 'Mastered', 'Guessed Correct'].includes(pyq.result)).length
  const weakSubjects = Object.entries(attempted.reduce<Record<string, { wrong: number; count: number }>>((summary, pyq) => {
    summary[pyq.subject] ??= { wrong: 0, count: 0 }; summary[pyq.subject].count++
    if (pyq.result === 'Wrong' || pyq.result === 'Marked for Reattempt') summary[pyq.subject].wrong++
    return summary
  }, {})).sort((a, b) => b[1].wrong / b[1].count - a[1].wrong / a[1].count).slice(0, 3)
  const years = Array.from(new Set(allPyqs.map(pyq => String(pyq.year)))).sort().reverse()
  const topics = Array.from(new Set(allPyqs.map(pyq => pyq.topic))).sort()
  const statusStyles: Record<Pyq['result'], string> = { Unattempted: 'gray', Correct: 'green', Wrong: 'red', 'Guessed Correct': 'amber', 'Marked for Reattempt': 'violet', Mastered: 'blue' }
  return <div className="cc-content"><div className="cc-stats-grid compact"><Stat label="Total PYQs" value={String(allPyqs.length)} hint="in your database" icon={BookOpen} /><Stat label="Attempted" value={String(attempted.length)} hint="including guessed" icon={CheckCircle2} color="green" /><Stat label="Correct" value={String(correct)} hint="recorded correct" icon={Target} color="blue" /><Stat label="Accuracy" value={percent(attempted.length ? correct / attempted.length * 100 : 0)} hint="from recorded data" icon={Activity} color="violet" /><Stat label="Average time" value={formatMinutes(Math.round(average(attempted.map(pyq => pyq.timeTaken))))} hint="per question" icon={Clock3} color="orange" /></div>
    <Panel title="PYQ question bank" subtitle="Filter attempts and capture outcomes across previous years." action={<button className="cc-button primary small" onClick={onAdd}><Plus size={15} /> Add PYQ</button>}>
      <div className="cc-filter-row"><select className="cc-input" aria-label="Filter by subject" value={filter.subject} onChange={event => setFilter({ ...filter, subject: event.target.value })}><option>All</option>{Array.from(new Set(allPyqs.map(pyq => pyq.subject))).map(subject => <option key={subject}>{subject}</option>)}</select><select className="cc-input" aria-label="Filter by topic" value={filter.topic} onChange={event => setFilter({ ...filter, topic: event.target.value })}><option>All</option>{topics.map(topic => <option key={topic}>{topic}</option>)}</select><select className="cc-input" aria-label="Filter by year" value={filter.year} onChange={event => setFilter({ ...filter, year: event.target.value })}><option>All</option>{years.map(year => <option key={year}>{year}</option>)}</select><select className="cc-input" aria-label="Filter by difficulty" value={filter.difficulty} onChange={event => setFilter({ ...filter, difficulty: event.target.value })}><option>All</option>{['Easy', 'Medium', 'Hard'].map(level => <option key={level}>{level}</option>)}</select><select className="cc-input" aria-label="Filter by result" value={filter.result} onChange={event => setFilter({ ...filter, result: event.target.value })}><option>All</option>{['Unattempted', 'Correct', 'Wrong', 'Guessed Correct', 'Marked for Reattempt', 'Mastered'].map(result => <option key={result}>{result}</option>)}</select></div>
      <div className="cc-pyq-table"><div className="cc-pyq-header"><span>Question</span><span>Topic</span><span>Year</span><span>Difficulty</span><span>Time</span><span>Result</span><span /></div>{pyqs.map(pyq => <div className="cc-pyq-row" key={pyq.id}><div><strong>{pyq.id}</strong><small>{pyq.subject} · confidence {pyq.confidence}/5</small></div><span>{pyq.topic}</span><span>{pyq.year}</span><span className={`cc-difficulty ${pyq.difficulty.toLowerCase()}`}>{pyq.difficulty}</span><span>{pyq.timeTaken ? `${pyq.timeTaken}m` : '—'}</span><select aria-label={`Result for ${pyq.id}`} className={`cc-status-select ${statusStyles[pyq.result]}`} value={pyq.result} onChange={event => onUpdate(pyq.id, { result: event.target.value as Pyq['result'], attemptDate: pyq.attemptDate || todayKey })}>{['Unattempted', 'Correct', 'Wrong', 'Guessed Correct', 'Marked for Reattempt', 'Mastered'].map(result => <option key={result}>{result}</option>)}</select><button className="cc-icon-button danger" onClick={() => window.confirm(`Delete PYQ ${pyq.id}?`) && onDelete(pyq.id)} aria-label={`Delete ${pyq.id}`}><Trash2 size={13} /></button></div>)}{!pyqs.length && <Empty title="No PYQs match these filters" detail="Add a PYQ record or adjust your filters." />}</div>
    </Panel>
    <div className="cc-dashboard-grid"><Panel title="Topics needing attention" subtitle="Prioritized by missed and marked questions.">{weakSubjects.length ? weakSubjects.map(([subject, counts]) => <div className="cc-weak-list-row" key={subject}><span>{subject}</span><strong>{counts.wrong} / {counts.count} need another attempt</strong></div>) : <Empty title="No weak PYQ topics yet" detail="Record question outcomes to identify patterns." />}</Panel><Panel title="PYQ method" subtitle="An attempt is only useful when you learn from it."><div className="cc-method-list"><span><b>1</b> Attempt in exam conditions</span><span><b>2</b> Mark confidence honestly</span><span><b>3</b> Review wrong and guessed-correct questions</span><span><b>4</b> Reattempt after a spaced interval</span></div></Panel></div></div>
}

function RevisionView({ data, updateRevision, onComplete }: { data: TrackerData; updateRevision: (id: string, patch: Partial<Revision>) => void; onComplete: (revision: Revision) => void }) {
  const [dueFilter, setDueFilter] = useState('Due and overdue')
  const due = data.revisions.filter(revision => revision.status !== 'Completed').filter(revision => dueFilter === 'All upcoming' || revision.dueDate <= todayKey).sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  const snooze = (revision: Revision, days: number) => updateRevision(revision.id, { dueDate: inDays(revision.dueDate > todayKey ? revision.dueDate : todayKey, days), status: 'Snoozed' })
  return <div className="cc-content"><div className="cc-revision-banner"><div className="cc-revision-badge"><RotateCcw size={22} /></div><div><span className="cc-label">SPACED REPETITION ENGINE</span><h2>Remember more, relearn less.</h2><p>Newly learned topics queue R0 today → R1 tomorrow → R2 in 7 days → R3 in 21 days → R4 before a major test.</p></div></div>
    <div className="cc-revision-timeline">{[['R0', 'Same day', 'Start'], ['R1', '+1 day', 'Recall'], ['R2', '+7 days', 'Reinforce'], ['R3', '+21 days', 'Retain'], ['R4', 'Before major test', 'Apply']].map((item, index) => <div className="cc-timeline-stage" key={item[0]}><span>{item[0]}</span><strong>{item[1]}</strong><small>{item[2]}</small>{index < 4 && <i />}</div>)}</div>
    <Panel title="Revision due today" subtitle={`${due.filter(item => item.dueDate <= todayKey).length} reviews due or overdue`} action={<select className="cc-input" value={dueFilter} onChange={event => setDueFilter(event.target.value)}><option>Due and overdue</option><option>All upcoming</option></select>}>
      {due.length ? <div className="cc-revision-due-list">{due.map(revision => <div className={`cc-due-card ${revision.dueDate < todayKey ? 'overdue' : ''}`} key={revision.id}><span className={`cc-revision-dot ${revision.dueDate < todayKey || revision.weak ? 'red' : revision.type === 'R1' ? 'amber' : 'green'}`} /><div className="cc-due-info"><span className="cc-label">{revision.type} · {revision.dueDate < todayKey ? `${Math.floor((new Date(`${todayKey}T12:00:00`).getTime() - new Date(`${revision.dueDate}T12:00:00`).getTime()) / 86400000)}d overdue` : friendlyDate(revision.dueDate, { month: 'short', day: 'numeric' })}</span><strong>{revision.subject} — {revision.topic}</strong><span>{revision.weak ? 'Marked weak · higher-frequency review' : 'Active spaced review'}</span></div><div className="cc-due-actions"><button className={`cc-icon-button ${revision.weak ? 'active' : ''}`} title="Mark weak" onClick={() => updateRevision(revision.id, { weak: !revision.weak })}><CircleAlert size={15} /></button><button className="cc-subtle-button" onClick={() => snooze(revision, 1)}>Snooze 1d</button><input type="date" className="cc-input compact" min={todayKey} value={revision.dueDate < todayKey ? todayKey : revision.dueDate} onChange={event => updateRevision(revision.id, { dueDate: event.target.value, status: 'Due' })} aria-label="Reschedule revision" /><button className="cc-button primary small" onClick={() => onComplete(revision)}><Check size={14} /> Complete</button></div></div>)}</div> : <Empty title="Revision queue is clear" detail="Mark a topic as learned in the syllabus to automatically schedule a revision sequence." />}
    </Panel><Panel title="Revision history" subtitle="Completed reviews remain part of your progress."><div className="cc-history-list">{data.revisions.filter(revision => revision.status === 'Completed').slice(-8).reverse().map(revision => <div key={revision.id}><CheckCircle2 size={15} /><span>{revision.subject} — {revision.topic}</span><span>{revision.type}</span><small>{revision.completedDate ? friendlyDate(revision.completedDate, { month: 'short', day: 'numeric' }) : 'Completed'}</small></div>)}{!data.revisions.some(revision => revision.status === 'Completed') && <Empty title="No reviews completed yet" detail="Completed spaced reviews will appear here." />}</div></Panel>
  </div>
}

function MistakesView({ data, onAdd, onUpdate, onDelete }: { data: TrackerData; onAdd: () => void; onUpdate: (id: string, patch: Partial<Mistake>) => void; onDelete: (id: string) => void }) {
  const [editing, setEditing] = useState<Mistake | null>(null)
  const counts = data.mistakes.reduce<Record<string, number>>((result, item) => { result[item.category] = (result[item.category] || 0) + 1; return result }, {})
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
  const editField = (key: 'topic' | 'question' | 'source' | 'approach' | 'whyWrong' | 'concept' | 'lesson' | 'category', value: string) => setEditing(previous => previous ? { ...previous, [key]: value } : previous)
  return <div className="cc-content"><div className="cc-mistake-intro"><div><span className="cc-label">ERROR → INSIGHT → IMPROVEMENT</span><h2>Don't lose the lesson.</h2><p>Capture why a solution failed, so the same gap doesn't cost you marks twice.</p></div><button className="cc-button primary" onClick={onAdd}><Plus size={15} /> Log a mistake</button></div>
    <div className="cc-mistake-kpis">{sorted.slice(0, 4).map(([category, count]) => <div key={category}><CircleAlert size={16} /><span>{category}</span><strong>{count}</strong></div>)}{!sorted.length && <div><CircleAlert size={16} /><span>Start logging mistakes</span><strong>0</strong></div>}</div>
    <Panel title="Mistake notebook" subtitle={`${data.mistakes.length} lessons captured`}><div className="cc-mistakes-list">{data.mistakes.map(mistake => <article className="cc-mistake-card" key={mistake.id}><div className="cc-mistake-card-head"><div><span className="cc-label">{mistake.category} · {friendlyDate(mistake.date, { month: 'short', day: 'numeric' })}</span><h3>{mistake.subject} — {mistake.topic}</h3></div><div className="cc-mistake-card-actions"><button className="cc-subtle-button" onClick={() => setEditing(editing?.id === mistake.id ? null : { ...mistake, reattempts: [...mistake.reattempts] })}>{editing?.id === mistake.id ? 'Cancel' : 'Edit'}</button><button className="cc-icon-button danger" onClick={() => onDelete(mistake.id)} aria-label="Delete mistake"><Trash2 size={15} /></button></div></div>{editing?.id === mistake.id ? <div className="cc-mistake-edit"><label>Topic<input className="cc-input" value={editing.topic} onChange={event => editField('topic', event.target.value)} /></label><label>Question<textarea className="cc-input" value={editing.question} onChange={event => editField('question', event.target.value)} /></label><div className="cc-form-grid two"><label>Mistake category<select className="cc-input" value={editing.category} onChange={event => editField('category', event.target.value)}>{mistakeCategories.map(category => <option key={category}>{category}</option>)}</select></label><label>Source<input className="cc-input" value={editing.source} onChange={event => editField('source', event.target.value)} /></label></div><label>My approach<textarea className="cc-input" value={editing.approach} onChange={event => editField('approach', event.target.value)} /></label><label>Why I was wrong<textarea className="cc-input" value={editing.whyWrong} onChange={event => editField('whyWrong', event.target.value)} /></label><label>Correct concept<textarea className="cc-input" value={editing.concept} onChange={event => editField('concept', event.target.value)} /></label><label>Key lesson<input className="cc-input" value={editing.lesson} onChange={event => editField('lesson', event.target.value)} /></label><button className="cc-button primary small" disabled={!editing.topic.trim() || !editing.question.trim() || !editing.lesson.trim()} onClick={() => { onUpdate(mistake.id, editing); setEditing(null) }}><Check size={13} /> Save changes</button></div> : <><div className="cc-mistake-question"><span>QUESTION / SOURCE</span><p>{mistake.question} <small>· {mistake.source}</small></p></div><div className="cc-mistake-grid"><div><span>My approach</span><p>{mistake.approach || '—'}</p></div><div><span>Why I was wrong</span><p>{mistake.whyWrong || '—'}</p></div><div><span>Correct concept</span><p>{mistake.concept || '—'}</p></div><div><span>Key lesson</span><p>{mistake.lesson || '—'}</p></div></div><div className="cc-reattempts"><span>REATTEMPTS</span>{mistake.reattempts.map((attempt, index) => <button key={index} className={attempt ? 'done' : ''} onClick={() => { const attempts = [...mistake.reattempts]; attempts[index] = attempts[index] ? 0 : 1; onUpdate(mistake.id, { reattempts: attempts }) }}>{attempt ? <Check size={12} /> : index + 1} Reattempt {index + 1}</button>)}</div></>}</article>)}{!data.mistakes.length && <Empty title="Your notebook is a clean slate" detail="Log a mistake with your approach and the corrected concept to learn from it." />}</div></Panel>
  </div>
}

function TestsView({ data, onAdd, onEdit, onDelete }: { data: TrackerData; onAdd: () => void; onEdit: (id: string) => void; onDelete: (id: string) => void }) {
  const latest = data.tests[0]
  return <div className="cc-content"><div className="cc-stats-grid compact"><Stat label="Tests taken" value={String(data.tests.length)} hint="topic, subject, mocks" icon={GraduationCap} /><Stat label="Average score" value={data.tests.length ? `${Math.round(average(data.tests.map(test => test.score / Math.max(1, test.maxMarks) * 100)))}%` : '—'} hint="of maximum marks" icon={Target} color="blue" /><Stat label="Latest score" value={latest ? `${latest.score}/${latest.maxMarks}` : '—'} hint={latest?.name ?? 'Add test results'} icon={Trophy} color="orange" /><Stat label="Avg accuracy" value={data.tests.length ? percent(average(data.tests.map(test => test.attempted ? test.correct / test.attempted * 100 : 0))) : '—'} hint="on attempted questions" icon={Activity} color="green" /></div>
    <Panel title="Test history" subtitle="Score alone doesn't tell the whole story. Review confidence and error type." action={<button className="cc-button primary small" onClick={onAdd}><Plus size={15} /> Add test</button>}>
      {data.tests.length ? <div className="cc-test-list">{data.tests.map(test => <article className="cc-test-card" key={test.id}><div className="cc-test-top"><div><span className="cc-label">{test.type} · {friendlyDate(test.date, { month: 'short', day: 'numeric', year: 'numeric' })}</span><h3>{test.name}</h3><span>{test.subject} · {test.minutes} min {test.rank ? `· Rank ${test.rank}` : ''}</span></div><div className="cc-test-score"><strong>{test.score}</strong><small> / {test.maxMarks}</small><span>{percent(test.score / Math.max(1, test.maxMarks) * 100)}</span></div><button className="cc-subtle-button" onClick={() => onEdit(test.id)}>Edit</button><button className="cc-icon-button danger" onClick={() => onDelete(test.id)} aria-label="Delete test"><Trash2 size={15} /></button></div><div className="cc-test-metrics"><span>{test.attempted} attempted</span><span>{test.correct} correct</span><span>{test.wrong} wrong</span><span>{test.unattempted} unattempted</span><span>{percent(test.attempted ? test.correct / test.attempted * 100 : 0)} accuracy</span></div><div className="cc-analysis-bars">{[['A', 'Correct + confident', test.a], ['B', 'Correct but guessed', test.b], ['C', 'Wrong despite concept', test.c], ['D', 'Concept unknown', test.d]].map(([code, label, count]) => <div key={code}><span className={`cc-analysis-code code-${code}`}>{code}</span><span>{label}</span><strong>{count}</strong></div>)}</div></article>)}</div> : <Empty title="No test results yet" detail="Log topic tests, subject tests, and full-length mocks to measure exam readiness." />}
    </Panel></div>
}

function TimerView({ data, setData, now, onStart, onStop, onPeriodElapsed }: { data: TrackerData; setData: Dispatch<SetStateAction<TrackerData>>; now: number; onStart: () => void; onStop: (discard?: boolean) => void; onPeriodElapsed: () => void }) {
  const timer = data.timer
  const [customPreset, setCustomPreset] = useState(false)
  const completedPeriod = useRef<TrackerData['timer']['mode'] | null>(null)
  const elapsed = timer.running ? Math.max(0, Math.floor((now - timer.startedAt) / 1000)) : 0
  const periodMinutes = timer.mode === 'break' ? timer.breakMinutes : timer.focusMinutes
  const remaining = Math.max(0, periodMinutes * 60 - elapsed)
  const fmt = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
  const todaySessions = data.sessions.filter(session => session.date === todayKey)
  const subjectsToday = Object.entries(todaySessions.reduce<Record<string, number>>((sum, session) => { sum[session.subject] = (sum[session.subject] || 0) + session.duration; return sum }, {}))
  const elapsedPercent = Math.min(100, elapsed / (periodMinutes * 60) * 100)
  useEffect(() => {
    if (!timer.running) {
      completedPeriod.current = null
      return
    }
    if (remaining === 0 && completedPeriod.current !== timer.mode) {
      completedPeriod.current = timer.mode
      onPeriodElapsed()
    }
  }, [remaining, timer.running, timer.mode, onPeriodElapsed])
  return <div className="cc-content"><div className="cc-timer-layout"><Panel title="Focus timer" subtitle="One task. One block. No distractions." className="cc-timer-panel">
    <div className="cc-timer-presets">{[[25, 5, '25 / 5'], [50, 10, '50 / 10'], [60, 10, '60 / 10']].map(([focus, rest, label]) => <button className={!customPreset && timer.focusMinutes === focus ? 'active' : ''} key={label} onClick={() => { setCustomPreset(false); if (!timer.running) setData(previous => ({ ...previous, timer: { ...previous.timer, focusMinutes: Number(focus), breakMinutes: Number(rest) } })) }}>{label}<small>focus / break</small></button>)}<button className={customPreset ? 'active' : ''} onClick={() => !timer.running && setCustomPreset(true)}>Custom<small>set durations</small></button></div>
    {customPreset && <div className="cc-custom-timer"><label>Focus minutes<input className="cc-input compact" type="number" min="1" max="180" value={timer.focusMinutes} disabled={timer.running} onChange={event => setData(previous => ({ ...previous, timer: { ...previous.timer, focusMinutes: Math.max(1, Math.min(180, Number(event.target.value))) } }))} /></label><label>Break minutes<input className="cc-input compact" type="number" min="1" max="60" value={timer.breakMinutes} disabled={timer.running} onChange={event => setData(previous => ({ ...previous, timer: { ...previous.timer, breakMinutes: Math.max(1, Math.min(60, Number(event.target.value))) } }))} /></label></div>}
    <div className={`cc-timer-ring ${timer.mode === 'break' ? 'break' : ''}`} style={{ '--timer-progress': `${elapsedPercent * 3.6}deg` } as CSSProperties}><div><strong>{fmt(remaining)}</strong><span>{timer.running ? timer.mode === 'break' ? 'ON BREAK' : 'FOCUSING' : 'READY TO FOCUS'}</span></div></div>
    <div className="cc-timer-fields"><label>Subject<select className="cc-input" value={timer.subject} disabled={timer.running} onChange={event => setData(previous => ({ ...previous, timer: { ...previous.timer, subject: event.target.value } }))}>{subjects.map(subject => <option key={subject.name}>{subject.name}</option>)}</select></label><label>Topic<input className="cc-input" value={timer.topic} disabled={timer.running} placeholder="What are you working on?" onChange={event => setData(previous => ({ ...previous, timer: { ...previous.timer, topic: event.target.value } }))} /></label><label>Task (optional)<input className="cc-input" value={timer.task} disabled={timer.running} placeholder="Specific task for this block" onChange={event => setData(previous => ({ ...previous, timer: { ...previous.timer, task: event.target.value } }))} /></label></div>
    <div className="cc-timer-actions">{timer.running ? timer.mode === 'break' ? <button className="cc-button secondary" onClick={() => onStop(true)}>Skip break</button> : <><button className="cc-button primary" onClick={() => onStop()}>Finish focus session <Check size={16} /></button><button className="cc-button secondary" onClick={() => onStop(true)}>Discard session</button></> : <button className="cc-button primary" onClick={onStart}><Focus size={16} /> Start focus</button>}<span>{timer.focusMinutes} min focus · {timer.breakMinutes} min break</span></div>
  </Panel><aside><Panel title="Today's focus" subtitle="Time saved from completed timer blocks.">{subjectsToday.length ? <div className="cc-focus-breakdown">{subjectsToday.map(([subject, minutes]) => <div key={subject}><span>{subject}</span><strong>{formatMinutes(minutes)}</strong><ProgressBar value={minutes / Math.max(...subjectsToday.map(item => item[1])) * 100} /></div>)}</div> : <Empty title="No focus time yet" detail="Start your first timer to begin tracking." />}<div className="cc-focus-total"><span>Total</span><strong>{formatMinutes(todaySessions.reduce((sum, session) => sum + session.duration, 0))}</strong></div></Panel>
  <Panel title="Recent sessions" subtitle="Latest focused blocks">{data.sessions.slice(-6).reverse().map(session => <div key={session.id} className="cc-session-row"><span>{session.subject}<small>{session.topic || 'Focused study'} · {friendlyDate(session.date, { month: 'short', day: 'numeric' })}</small></span><strong>{formatMinutes(session.duration)}</strong></div>)}</Panel></aside></div></div>
}

function AnalyticsView({ data, stageAverage }: { data: TrackerData; stageAverage: number }) {
  const [range, setRange] = useState(7)
  const daily = Array.from({ length: range }, (_, index) => {
    const date = inDays(todayKey, index - range + 1)
    const sessions = data.sessions.filter(session => session.date === date)
    const record = dayRecord(data, date)
    const pyqs = data.pyqs.filter(pyq => pyq.attemptDate === date && pyq.result !== 'Unattempted').length + record.pyqsAttempted
    return { date, hours: sessions.reduce((sum, session) => sum + session.duration, 0) / 60, accuracy: record.attempted ? record.correct / record.attempted * 100 : 0, pyqs, questions: record.attempted }
  })
  const topHour = Math.max(1, ...daily.map(item => item.hours))
  const mistakeByWeek = Array.from({ length: 4 }, (_, index) => {
    const start = inDays(todayKey, -((3 - index) * 7 + 6))
    const end = inDays(start, 7)
    return { label: `Week ${index + 1}`, count: data.mistakes.filter(item => item.date >= start && item.date < end).length }
  })
  const mockTests = data.tests.filter(test => test.type === 'Full-Length Mock').slice().reverse()
  return <div className="cc-content"><div className="cc-analytics-toolbar"><span className="cc-label">DATA-DRIVEN PREPARATION</span><div className="cc-segment">{[7, 30, 90].map(days => <button className={range === days ? 'active' : ''} key={days} onClick={() => setRange(days)}>{days} days</button>)}</div></div>
    <div className="cc-stats-grid compact"><Stat label="Study hours" value={`${data.sessions.reduce((sum, session) => sum + session.duration, 0) / 60 | 0}h`} hint="logged total" icon={Clock3} /><Stat label="Question accuracy" value={percent(average(Object.values(data.days).filter(day => day.attempted).map(day => day.correct / day.attempted * 100)))} hint="across recorded days" icon={Target} color="green" /><Stat label="Syllabus coverage" value={percent(stageAverage)} hint="topic progression" icon={BookOpen} color="violet" /><Stat label="Tests recorded" value={String(data.tests.length)} hint="all formats" icon={GraduationCap} color="orange" /></div>
    <div className="cc-dashboard-grid">
      <Panel title="Study hours trend" subtitle={`Last ${range} days · focused hours`}><div className="cc-bar-chart tall">{daily.map(item => <div className="cc-bar-col" key={item.date}><div className="cc-bar-tooltip">{item.hours.toFixed(1)}h</div><div className="cc-bar-area"><span style={{ height: `${Math.max(3, item.hours / topHour * 100)}%` }} /></div><small>{friendlyDate(item.date, { day: 'numeric', month: range > 7 ? 'short' : undefined })}</small></div>)}</div></Panel>
      <Panel title="Accuracy trend" subtitle="Correct / attempted by day"><div className="cc-line-chart">{daily.slice(-14).map(item => <div key={item.date} className="cc-line-point" style={{ '--point': `${Math.max(4, item.accuracy)}%` } as CSSProperties}><span title={`${Math.round(item.accuracy)}%`} /><small>{friendlyDate(item.date, { weekday: 'short' })}</small></div>)}</div><div className="cc-chart-foot"><strong>{percent(average(daily.map(item => item.accuracy)))}</strong><span>average recorded accuracy</span></div></Panel>
      <Panel title="PYQ progress" subtitle="Attempted questions in the selected period"><div className="cc-analytics-kpi"><strong>{daily.reduce((sum, item) => sum + item.pyqs, 0)}</strong><span>PYQs attempted</span></div><div className="cc-analytics-bars">{daily.slice(-14).map(item => <div key={item.date} title={`${item.pyqs} PYQs`}><span style={{ height: `${Math.min(100, item.pyqs / Math.max(1, ...daily.map(day => day.pyqs)) * 100)}%` }} /></div>)}</div><p className="cc-muted-note">Total in your question bank: {data.pyqs.filter(pyq => pyq.result !== 'Unattempted').length} attempted of {data.pyqs.length} logged.</p></Panel>
      <Panel title="Syllabus progression" subtitle="Stage-based, not lecture-based"><div className="cc-stage-bars">{stageNames.slice(1).map((stage, index) => <div key={stage}><span>{stage}</span><span className="cc-mini-track"><i style={{ width: percent(data.topics.filter(topic => topic.stage > index).length / Math.max(data.topics.length, 1) * 100) }} /></span><strong>{data.topics.filter(topic => topic.stage > index).length}</strong></div>)}</div></Panel>
      <Panel title="Mock score trend" subtitle="Full-length mock scores"><div className="cc-mock-bars">{mockTests.length ? mockTests.map(test => <div key={test.id}><div><strong>{test.score}</strong><small>/{test.maxMarks}</small></div><span style={{ height: `${test.score / Math.max(1, test.maxMarks) * 100}%` }} /><small>{friendlyDate(test.date, { month: 'short', day: 'numeric' })}</small></div>) : <Empty title="No mocks logged" detail="Full-length mock progress will show here." />}</div></Panel>
      <Panel title="Revision completion" subtitle="Completed vs due"><div className="cc-revision-analytics"><div className="cc-rev-number"><strong>{data.revisions.filter(revision => revision.status === 'Completed').length}</strong><span>completed</span></div><div className="cc-rev-number orange"><strong>{data.revisions.filter(revision => revision.status !== 'Completed').length}</strong><span>due / upcoming</span></div></div><ProgressBar value={data.revisions.length ? data.revisions.filter(revision => revision.status === 'Completed').length / data.revisions.length * 100 : 0} color="green" /><p className="cc-muted-note">Completion rate {percent(data.revisions.length ? data.revisions.filter(revision => revision.status === 'Completed').length / data.revisions.length * 100 : 0)}</p></Panel>
      <Panel title="Questions solved" subtitle="Recorded daily questions"><div className="cc-analytics-kpi"><strong>{daily.reduce((sum, item) => sum + item.questions, 0)}</strong><span>questions · last {range} days</span></div><div className="cc-analytics-bars">{daily.slice(-14).map(item => <div key={item.date} title={`${item.questions} questions`}><span style={{ height: `${Math.min(100, item.questions / Math.max(1, ...daily.map(day => day.questions)) * 100)}%` }} /></div>)}</div></Panel>
      <Panel title="Repeated mistakes" subtitle="Trend by recent weeks"><div className="cc-mistake-trend">{mistakeByWeek.map(item => <div key={item.label}><span>{item.label}</span><div><i style={{ width: `${Math.max(item.count ? 6 : 0, item.count / Math.max(1, ...mistakeByWeek.map(week => week.count)) * 100)}%` }} /></div><strong>{item.count}</strong></div>)}</div></Panel>
    </div>
  </div>
}

function WeeklyReviewView({ data, onSave }: { data: TrackerData; onSave: (review: Omit<TrackerData['reviews'][number], 'week'>) => void }) {
  const monday = new Date()
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  const weekKey = localDate(monday)
  const savedReview = data.reviews.find(review => review.week === weekKey)
  const [answers, setAnswers] = useState(() => ({ strongest: savedReview?.strongest ?? '', weakest: savedReview?.weakest ?? '', mistake: savedReview?.mistake ?? '', achievement: savedReview?.achievement ?? '', priority: savedReview?.priority ?? '' }))
  const dates = Array.from({ length: 7 }, (_, index) => { const date = new Date(monday); date.setDate(date.getDate() + index); return localDate(date) })
  const sessions = data.sessions.filter(session => dates.includes(session.date))
  const weekPYQs = data.pyqs.filter(pyq => dates.includes(pyq.attemptDate) && pyq.result !== 'Unattempted').length + dates.reduce((sum, date) => sum + dayRecord(data, date).pyqsAttempted, 0)
  const weekQuestions = dates.reduce((sum, date) => sum + dayRecord(data, date).attempted, 0)
  const weekAccuracy = average(dates.map(date => { const day = dayRecord(data, date); return day.attempted ? day.correct / day.attempted * 100 : 0 }).filter(value => value > 0))
  const mockScore = average(data.tests.filter(test => dates.includes(test.date)).map(test => test.score))
  const topicsDone = data.topics.filter(topic => topic.stage === 8 && topic.lastRevised && dates.includes(topic.lastRevised)).length
  const repeatedMistakes = data.mistakes.filter(mistake => dates.includes(mistake.date)).length
  const save = () => onSave(answers)
  return <div className="cc-content"><div className="cc-week-heading"><span className="cc-label">WEEKLY REVIEW · {friendlyDate(localDate(monday), { month: 'short', day: 'numeric' })} — {friendlyDate(dates[6], { month: 'short', day: 'numeric' })}</span><h2>Close the loop on this week.</h2><p>Review actual execution, then choose next week's focus with intent.</p></div>
    <div className="cc-stats-grid compact"><Stat label="Planned hours" value={`${data.weeklyTargetHours}h`} hint="weekly target" icon={Target} /><Stat label="Actual hours" value={`${(sessions.reduce((sum, session) => sum + session.duration, 0) / 60).toFixed(1)}h`} hint="focused sessions" icon={Clock3} color="blue" /><Stat label="Questions" value={String(weekQuestions)} hint="recorded" icon={HelpCircle} color="violet" /><Stat label="PYQs" value={String(weekPYQs)} hint="attempted" icon={BookOpen} color="green" /><Stat label="Accuracy" value={percent(weekAccuracy)} hint="question average" icon={Activity} color="orange" /><Stat label="Mock score" value={mockScore ? mockScore.toFixed(1) : '—'} hint="average marks" icon={Trophy} color="violet" /><Stat label="Topics completed" value={String(topicsDone)} hint="mastered this week" icon={GraduationCap} /><Stat label="Mistakes logged" value={String(repeatedMistakes)} hint="review the pattern" icon={CircleAlert} color="orange" /></div>
    <div className="cc-dashboard-grid"><Panel title="Week at a glance" subtitle="Daily study-hour bars">{dates.map(date => { const hours = sessions.filter(session => session.date === date).reduce((sum, session) => sum + session.duration, 0) / 60; return <div className="cc-week-day-row" key={date}><span>{friendlyDate(date, { weekday: 'short' })}</span><ProgressBar value={Math.min(100, hours / (data.dailyTargetHours || 6) * 100)} color="green" /><strong>{hours.toFixed(1)}h</strong></div> })}</Panel><Panel title="This week's quality" subtitle="Measure execution and understanding"><ScoreRow label="Focus hours" target={`${data.weeklyTargetHours}h`} actual={`${(sessions.reduce((sum, session) => sum + session.duration, 0) / 60).toFixed(1)}h`} value={sessions.reduce((sum, session) => sum + session.duration, 0) / (data.weeklyTargetHours * 60) * 100} /><ScoreRow label="Question accuracy" target="85%+" actual={percent(weekAccuracy)} value={weekAccuracy} /><ScoreRow label="PYQ practice" target="150" actual={String(weekPYQs)} value={weekPYQs / 150 * 100} /><ScoreRow label="Revision completion" target="2" actual={String(data.revisions.filter(revision => revision.status === 'Completed' && dates.includes(revision.completedDate)).length)} value={data.revisions.filter(revision => revision.status === 'Completed' && dates.includes(revision.completedDate)).length / 2 * 100} /></Panel></div>
    <Panel title="Five questions for next week" subtitle="A saved review turns your data into the next plan."><div className="cc-review-form">{[['strongest', 'Strongest topic'], ['weakest', 'Weakest topic'], ['mistake', 'Biggest mistake'], ['achievement', 'Biggest achievement'], ['priority', "Next week's priority"]].map(([key, label]) => <label key={key}>{label}<textarea className="cc-input" rows={2} value={answers[key as keyof typeof answers]} onChange={event => setAnswers(previous => ({ ...previous, [key]: event.target.value } as typeof answers))} placeholder="Reflect honestly..." /></label>)}</div><button className="cc-button primary" onClick={save}><Check size={15} /> Save weekly review</button></Panel>
    <Panel title="Past reviews" subtitle="Use earlier reflections to spot long-term patterns">{data.reviews.length ? data.reviews.slice().reverse().map(review => <div key={review.week} className="cc-saved-review"><strong>Week of {friendlyDate(review.week, { month: 'long', day: 'numeric' })}</strong><span>Priority: {review.priority || 'Not set'}</span></div>) : <Empty title="No weekly reviews saved" detail="Your review history starts once you save this week's reflection." />}</Panel>
  </div>
}

function GoalsView({ data, setData, onAdd }: { data: TrackerData; setData: Dispatch<SetStateAction<TrackerData>>; onAdd: () => void }) {
  const updateGoal = (goal: Goal, amount: number) => setData(previous => ({ ...previous, goals: previous.goals.map(item => item.id === goal.id ? { ...item, current: Math.max(0, amount) } : item) }))
  const deleteGoal = (goal: Goal) => { if (window.confirm(`Delete goal "${goal.title}"?`)) setData(previous => ({ ...previous, goals: previous.goals.filter(item => item.id !== goal.id) })) }
  return <div className="cc-content"><div className="cc-goal-hero"><div className="cc-brand-mark"><Target size={20} /></div><div><span className="cc-label">LONG-TERM GOAL</span><h2>GATE 2027 — AIR &lt;100</h2><p>Build a durable preparation system, not a single-score obsession.</p></div><span className="cc-goal-hero-tag">NORTH STAR</span></div><div className="cc-goal-columns">{(['Monthly', 'Weekly'] as const).map(level => <Panel key={level} title={`${level} goals`} subtitle={level === 'Weekly' ? 'A small set of repeatable commitments.' : 'Milestones that compound into exam readiness.'} action={<button className="cc-icon-button" onClick={onAdd} aria-label={`Add ${level.toLowerCase()} goal`}><Plus size={17} /></button>}>
    <div className="cc-goal-list">{data.goals.filter(goal => goal.level === level).map(goal => <div className="cc-goal-item" key={goal.id}><div className="cc-goal-item-head"><div><strong>{goal.title}</strong><span>{goal.current} of {goal.target} {goal.unit}</span></div><button className="cc-icon-button danger" onClick={() => deleteGoal(goal)} aria-label="Delete goal"><Trash2 size={14} /></button></div><ProgressBar value={goal.current / goal.target * 100} color={goal.current >= goal.target ? 'green' : level === 'Weekly' ? 'violet' : 'blue'} /><div className="cc-goal-edit"><input type="range" min="0" max={goal.target} value={Math.min(goal.target, goal.current)} onChange={event => updateGoal(goal, Number(event.target.value))} aria-label={`Progress for ${goal.title}`} /><input className="cc-input compact" type="number" min="0" value={goal.current} onChange={event => updateGoal(goal, Number(event.target.value))} /></div></div>)}{!data.goals.some(goal => goal.level === level) && <Empty title={`No ${level.toLowerCase()} goals`} detail="Create measurable milestones that support your target." />}</div></Panel>)}</div>
    <Panel title="Consistency streaks" subtitle="Streaks reflect showing up—not the quality of learning."><div className="cc-streak-grid"><StreakCard icon={Flame} title="Study streak" days={studyStreak(data)} /><StreakCard icon={BookOpen} title="PYQ streak" days={activityStreak(data.pyqs.filter(pyq => pyq.result !== 'Unattempted').map(pyq => pyq.attemptDate))} /><StreakCard icon={RotateCcw} title="Revision streak" days={activityStreak(data.revisions.filter(revision => revision.status === 'Completed').map(revision => revision.completedDate))} /><StreakCard icon={Trophy} title="Test streak" days={activityStreak(data.tests.map(test => test.date))} /></div></Panel>
  </div>
}
function activityStreak(dates: string[]) {
  const active = new Set(dates.filter(Boolean))
  let current = active.has(todayKey) ? todayKey : inDays(todayKey, -1)
  let count = 0
  while (active.has(current) && count < 365) { count++; current = inDays(current, -1) }
  return count
}
function StreakCard({ icon: Icon, title, days }: { icon: typeof Activity; title: string; days: number }) {
  return <div className="cc-streak-card"><span><Icon size={16} /></span><strong>{days} day{days === 1 ? '' : 's'}</strong><small>{title}</small></div>
}

function SettingsView({ data, setData }: { data: TrackerData; setData: Dispatch<SetStateAction<TrackerData>> }) {
  const [theme, setTheme] = useState(localStorage.getItem('gate-dark') !== 'false')
  const [importError, setImportError] = useState('')
  const toggleTheme = () => {
    const next = !theme; setTheme(next); localStorage.setItem('gate-dark', String(next)); document.documentElement.className = next ? 'dark' : 'light'
  }
  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `gate-command-center-${todayKey}.json`; link.click(); URL.revokeObjectURL(link.href)
  }
  const importData = async (file?: File) => {
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text()) as TrackerData
      if (!parsed || !Array.isArray(parsed.tasks) || !Array.isArray(parsed.topics) || !Array.isArray(parsed.pyqs) || !Array.isArray(parsed.revisions)) throw new Error('This file does not look like a command center backup.')
      setData({ ...createDemoData(), ...parsed })
      setImportError('')
    } catch (error) { setImportError(error instanceof Error ? error.message : 'Could not import this backup.') }
  }
  return <div className="cc-content"><Panel title="Workspace settings" subtitle="Personalize the tracker and manage your local data."><div className="cc-settings-list"><div><div><strong>Appearance</strong><span>Choose a theme for focused work.</span></div><button className="cc-button secondary" onClick={toggleTheme}>{theme ? <Moon size={15} /> : <Sparkles size={15} />}{theme ? 'Dark mode' : 'Light mode'}</button></div><div><div><strong>Target exam</strong><span>Exam and paper selected during onboarding.</span></div><strong>GATE 2027 · {data.paper} · AIR &lt;100</strong></div><div><div><strong>Daily study target</strong><span>Used for daily progress and timer summaries.</span></div><input className="cc-input compact" type="number" min="1" max="16" value={data.dailyTargetHours} onChange={event => setData(previous => ({ ...previous, dailyTargetHours: Math.max(1, Number(event.target.value)) }))} /></div><div><div><strong>Weekly study target</strong><span>Used in weekly progress and review.</span></div><input className="cc-input compact" type="number" min="1" max="100" value={data.weeklyTargetHours} onChange={event => setData(previous => ({ ...previous, weeklyTargetHours: Math.max(1, Number(event.target.value)) }))} /></div></div></Panel>
    <Panel title="Backup & restore" subtitle="Your data is stored locally in this browser. Export a copy regularly."><div className="cc-backup-actions"><button className="cc-button primary" onClick={exportData}><Download size={16} /> Export all data</button><label className="cc-button secondary file-button">Import backup<input type="file" accept="application/json,.json" onChange={event => importData(event.target.files?.[0])} /></label></div>{importError && <p className="cc-error">{importError}</p>}</Panel>
    <Panel title="Demo workspace" subtitle="The initial workspace uses clearly labeled sample data. Resetting restores the original demo data."><div className="cc-demo-settings"><span><span className="cc-demo-dot" /> Demo data is loaded locally. Existing entries are not overwritten unless you reset.</span><button className="cc-button danger" onClick={() => { if (window.confirm('Reset all command center data to the original demo workspace? This will remove your current local records.')) { localStorage.removeItem('gate-command-center-v1'); const fresh = createDemoData(); setData(fresh); window.location.reload() } }}>Reset Demo Data</button></div></Panel>
    <div className="cc-storage-note"><ShieldCheck size={16} /><span>Authentication and cloud synchronization are intentionally separated from the tracker data model. This local adapter can later be replaced by a Supabase or Firebase repository without changing how the views model a study plan.</span></div>
  </div>
}

function TaskForm({ date, subjects: subjectNames, existingMIT, close, submit }: { date: string; subjects: string[]; existingMIT: number; close: () => void; submit: (task: Omit<Task, 'id' | 'date' | 'carryCount'> & { date?: string }) => boolean }) {
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState(subjectNames[0] ?? '')
  const [topic, setTopic] = useState('')
  const [minutes, setMinutes] = useState(45)
  const [priority, setPriority] = useState<Task['priority']>('Medium')
  const [mit, setMit] = useState(existingMIT < 3)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const onSubmit = (event: FormEvent) => { event.preventDefault(); if (!title.trim() || !subject || !topic.trim() || minutes < 1) { setError('Add a task title, subject, topic, and positive estimate.'); return } const ok = submit({ date, title: title.trim(), subject, topic: topic.trim(), estimatedMinutes: minutes, priority, status: 'Not Started', notes: notes.trim(), isMIT: mit && existingMIT < 3 }); if (!ok) setError('This date already has 3 MITs.') }
  return <Modal title="Add a planner task" close={close}><form className="cc-form" onSubmit={onSubmit}><label>Task title<input className="cc-input" value={title} onChange={event => setTitle(event.target.value)} placeholder="e.g. Solve 10 deadlock questions" autoFocus /></label><div className="cc-form-grid two"><label>Subject<select className="cc-input" value={subject} onChange={event => setSubject(event.target.value)}>{subjectNames.map(item => <option key={item}>{item}</option>)}</select></label><label>Topic<input className="cc-input" value={topic} onChange={event => setTopic(event.target.value)} placeholder="Topic name" /></label></div><div className="cc-form-grid two"><label>Estimated minutes<input className="cc-input" type="number" min="1" max="1440" value={minutes} onChange={event => setMinutes(Number(event.target.value))} /></label><label>Priority<select className="cc-input" value={priority} onChange={event => setPriority(event.target.value as Task['priority'])}><option>High</option><option>Medium</option><option>Low</option></select></label></div><label>Notes<textarea className="cc-input" rows={2} value={notes} onChange={event => setNotes(event.target.value)} placeholder="Optional context or done criteria" /></label><label className="cc-check-card"><input type="checkbox" checked={mit} disabled={existingMIT >= 3} onChange={event => setMit(event.target.checked)} /><span className="cc-check" aria-hidden="true">{mit && <Check size={13} />}</span>Most Important Task ({existingMIT}/3 used)</label>{error && <p className="cc-error">{error}</p>}<div className="cc-modal-actions"><button type="button" className="cc-button secondary" onClick={close}>Cancel</button><button className="cc-button primary" type="submit">Add task</button></div></form></Modal>
}

function PyqForm({ subjects: subjectNames, close, submit }: { subjects: string[]; close: () => void; submit: (pyq: Omit<Pyq, 'id'> & { id: string }) => boolean }) {
  const [values, setValues] = useState({ id: '', subject: subjectNames[0] ?? '', topic: '', year: 2024, difficulty: 'Medium' as Pyq['difficulty'], attemptDate: '', result: 'Unattempted' as Pyq['result'], timeTaken: 0, confidence: 3, mistakeType: '', reattemptDate: '' })
  const [error, setError] = useState('')
  const update = (key: keyof typeof values, value: string | number) => setValues(previous => ({ ...previous, [key]: value } as typeof values))
  const onSubmit = (event: FormEvent) => { event.preventDefault(); if (!values.id.trim() || !values.topic.trim() || values.year < 1990 || values.year > 2035) { setError('Enter a unique question ID, topic, and valid GATE year.'); return } if (!submit(values)) setError('This question ID already exists.') }
  return <Modal title="Add a PYQ record" close={close}><form className="cc-form" onSubmit={onSubmit}><div className="cc-form-grid two"><label>Question ID<input className="cc-input" value={values.id} onChange={event => update('id', event.target.value)} placeholder="e.g. DBMS-2024-12" /></label><label>Year<input className="cc-input" type="number" min="1990" max="2035" value={values.year} onChange={event => update('year', Number(event.target.value))} /></label></div><div className="cc-form-grid two"><label>Subject<select className="cc-input" value={values.subject} onChange={event => update('subject', event.target.value)}>{subjectNames.map(item => <option key={item}>{item}</option>)}</select></label><label>Topic<input className="cc-input" value={values.topic} onChange={event => update('topic', event.target.value)} /></label></div><div className="cc-form-grid two"><label>Difficulty<select className="cc-input" value={values.difficulty} onChange={event => update('difficulty', event.target.value)}><option>Easy</option><option>Medium</option><option>Hard</option></select></label><label>Result<select className="cc-input" value={values.result} onChange={event => update('result', event.target.value)}>{['Unattempted', 'Correct', 'Wrong', 'Guessed Correct', 'Marked for Reattempt', 'Mastered'].map(item => <option key={item}>{item}</option>)}</select></label></div><div className="cc-form-grid two"><label>Attempt date<input className="cc-input" type="date" value={values.attemptDate} onChange={event => update('attemptDate', event.target.value)} /></label><label>Time taken (minutes)<input className="cc-input" type="number" min="0" value={values.timeTaken} onChange={event => update('timeTaken', Number(event.target.value))} /></label></div><div className="cc-form-grid two"><label>Confidence (1–5)<input className="cc-input" type="number" min="1" max="5" value={values.confidence} onChange={event => update('confidence', Number(event.target.value))} /></label><label>Mistake type<input className="cc-input" value={values.mistakeType} onChange={event => update('mistakeType', event.target.value)} placeholder="Optional" /></label></div>{error && <p className="cc-error">{error}</p>}<div className="cc-modal-actions"><button className="cc-button secondary" type="button" onClick={close}>Cancel</button><button className="cc-button primary">Save PYQ</button></div></form></Modal>
}

function MistakeForm({ subjects: subjectNames, close, submit }: { subjects: string[]; close: () => void; submit: (mistake: Omit<Mistake, 'id' | 'date' | 'reattempts'>) => void }) {
  const [values, setValues] = useState({ subject: subjectNames[0] ?? '', topic: '', question: '', source: '', approach: '', whyWrong: '', concept: '', lesson: '', category: mistakeCategories[0] })
  const [error, setError] = useState('')
  const update = (key: keyof typeof values, value: string) => setValues(previous => ({ ...previous, [key]: value }))
  const onSubmit = (event: FormEvent) => { event.preventDefault(); if (!values.topic.trim() || !values.question.trim() || !values.lesson.trim()) { setError('Topic, question, and key lesson are required.'); return } submit(values) }
  return <Modal title="Capture a mistake" close={close}><form className="cc-form" onSubmit={onSubmit}><div className="cc-form-grid two"><label>Subject<select className="cc-input" value={values.subject} onChange={event => update('subject', event.target.value)}>{subjectNames.map(item => <option key={item}>{item}</option>)}</select></label><label>Topic<input className="cc-input" value={values.topic} onChange={event => update('topic', event.target.value)} /></label></div><div className="cc-form-grid two"><label>Source<input className="cc-input" value={values.source} onChange={event => update('source', event.target.value)} placeholder="GATE 2024 / Mock..." /></label><label>Mistake category<select className="cc-input" value={values.category} onChange={event => update('category', event.target.value)}>{mistakeCategories.map(item => <option key={item}>{item}</option>)}</select></label></div>{[['question', 'Question / prompt'], ['approach', 'My approach'], ['whyWrong', 'Why was I wrong?'], ['concept', 'Correct concept'], ['lesson', 'Key lesson']].map(([key, label]) => <label key={key}>{label}<textarea className="cc-input" rows={2} value={values[key as keyof typeof values]} onChange={event => update(key as keyof typeof values, event.target.value)} /></label>)}{error && <p className="cc-error">{error}</p>}<div className="cc-modal-actions"><button className="cc-button secondary" type="button" onClick={close}>Cancel</button><button className="cc-button primary">Save mistake</button></div></form></Modal>
}

function TestForm({ close, submit, initial }: { close: () => void; submit: (test: Omit<TestRecord, 'id' | 'date'>) => void; initial?: TestRecord }) {
  const [values, setValues] = useState<Omit<TestRecord, 'id' | 'date'>>(() => initial ? {
    type: initial.type, name: initial.name, subject: initial.subject, score: initial.score, maxMarks: initial.maxMarks,
    attempted: initial.attempted, correct: initial.correct, wrong: initial.wrong, unattempted: initial.unattempted, minutes: initial.minutes,
    rank: initial.rank, a: initial.a, b: initial.b, c: initial.c, d: initial.d,
  } : { type: 'Subject Test', name: '', subject: 'CSE', score: 0, maxMarks: 100, attempted: 0, correct: 0, wrong: 0, unattempted: 0, minutes: 180, rank: 0, a: 0, b: 0, c: 0, d: 0 })
  const [error, setError] = useState('')
  const update = (key: keyof typeof values, value: string | number) => setValues(previous => ({ ...previous, [key]: value } as typeof values))
  const onSubmit = (event: FormEvent) => { event.preventDefault(); if (!values.name.trim() || values.maxMarks <= 0 || values.score < 0 || values.score > values.maxMarks || values.correct > values.attempted || values.wrong > values.attempted) { setError('Check test name, marks, and attempted / correct / wrong counts.'); return } submit({ ...values, name: values.name.trim() }) }
  return <Modal title={initial ? 'Edit test result' : 'Record a test result'} close={close}><form className="cc-form" onSubmit={onSubmit}><div className="cc-form-grid two"><label>Test format<select className="cc-input" value={values.type} onChange={event => update('type', event.target.value)}><option>Topic Test</option><option>Subject Test</option><option>Full-Length Mock</option></select></label><label>Test name<input className="cc-input" value={values.name} onChange={event => update('name', event.target.value)} /></label></div><div className="cc-form-grid two"><label>Subject<input className="cc-input" value={values.subject} onChange={event => update('subject', event.target.value)} /></label><label>Score / maximum<input className="cc-input" type="number" min="0" value={values.score} onChange={event => update('score', Number(event.target.value))} /><input className="cc-input" type="number" min="1" value={values.maxMarks} onChange={event => update('maxMarks', Number(event.target.value))} /></label></div><div className="cc-form-grid three">{(['attempted', 'correct', 'wrong', 'unattempted', 'minutes', 'rank'] as const).map(key => <label key={key}>{key === 'minutes' ? 'Time taken (min)' : key[0].toUpperCase() + key.slice(1)}<input className="cc-input" type="number" min="0" value={values[key]} onChange={event => update(key, Number(event.target.value))} /></label>)}</div><div className="cc-form-help">Question analysis categories add up independently: A confident correct · B guessed correct · C wrong despite concept · D unknown concept.</div><div className="cc-form-grid four">{(['a', 'b', 'c', 'd'] as const).map(key => <label key={key}>Category {key.toUpperCase()}<input className="cc-input" type="number" min="0" value={values[key]} onChange={event => update(key, Number(event.target.value))} /></label>)}</div>{error && <p className="cc-error">{error}</p>}<div className="cc-modal-actions"><button type="button" className="cc-button secondary" onClick={close}>Cancel</button><button className="cc-button primary">{initial ? 'Save changes' : 'Save test result'}</button></div></form></Modal>
}

function GoalForm({ close, submit }: { close: () => void; submit: (title: string, target: number, unit: string, level: Goal['level']) => void }) {
  const [title, setTitle] = useState('')
  const [target, setTarget] = useState(1)
  const [unit, setUnit] = useState('hours')
  const [level, setLevel] = useState<Goal['level']>('Weekly')
  const [error, setError] = useState('')
  const onSubmit = (event: FormEvent) => { event.preventDefault(); if (!title.trim() || target <= 0) { setError('Enter a goal and a target greater than zero.'); return } submit(title, target, unit, level) }
  return <Modal title="Create a goal" close={close}><form className="cc-form" onSubmit={onSubmit}><label>Goal title<input className="cc-input" value={title} onChange={event => setTitle(event.target.value)} placeholder="e.g. Finish DBMS revision" /></label><div className="cc-form-grid three"><label>Goal level<select className="cc-input" value={level} onChange={event => setLevel(event.target.value as Goal['level'])}><option>Weekly</option><option>Monthly</option></select></label><label>Target<input className="cc-input" type="number" min="1" value={target} onChange={event => setTarget(Number(event.target.value))} /></label><label>Unit<select className="cc-input" value={unit} onChange={event => setUnit(event.target.value)}>{['hours', 'questions', 'PYQs', 'topics', 'revisions', 'tests', 'mock'].map(item => <option key={item}>{item}</option>)}</select></label></div>{error && <p className="cc-error">{error}</p>}<div className="cc-modal-actions"><button className="cc-button secondary" type="button" onClick={close}>Cancel</button><button className="cc-button primary">Create goal</button></div></form></Modal>
}
