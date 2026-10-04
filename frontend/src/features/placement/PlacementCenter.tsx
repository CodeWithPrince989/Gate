import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AlertCircle as CircleAlert, ArrowLeft, ArrowRight, Briefcase, Check, Plus, Target, Trash2 } from 'lucide-react'
import {
  behavioralTopics, createPlacementData, dailyTasks, githubChecklist, levels, linkedinChecklist, matrixSkills,
  loadPlacementData, pages, placementId, projectChecklist, projectDepth, resumeChecklist,
  rolesAvailable, savePlacementData, statusOptions,
  type Application, type PlacementData, type Problem, type Project, type Skill,
} from './data'
import './placement.css'

const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const today = () => localDate()
const pct = (n: number) => `${Math.round(Math.min(100, Math.max(0, n)))}%`
const average = (values: number[]) => values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0
const progressFor = (skills: Skill[]) => skills.length ? average(skills.map(skill => skill.level / 4 * 100)) : 0
type ProblemFilter = { company: string; topic: string; pattern: string; difficulty: string; platform: string; solved: string }
const companyRoles: Record<string, string[]> = {
  SDE: ['DSA', 'cs', 'development', 'projects', 'system-design', 'interview'],
  'Software Engineer': ['DSA', 'cs', 'development', 'projects', 'system-design', 'interview'],
  'Backend Developer': ['DSA', 'cs', 'development', 'projects', 'cloud', 'system-design'],
  'Full Stack Developer': ['DSA', 'development', 'projects', 'programming', 'interview'],
  'AI/ML Engineer': ['DSA', 'aiml', 'programming', 'projects', 'cloud', 'interview'],
  'Data Analyst': ['programming', 'aiml', 'aptitude', 'projects', 'cs'],
  'Data Scientist': ['DSA', 'aiml', 'programming', 'projects', 'aptitude'],
  'Cloud Engineer': ['cs', 'cloud', 'development', 'projects', 'interview'],
  'DevOps Engineer': ['cs', 'cloud', 'projects', 'programming', 'interview'],
}

function Panel({ title, subtitle, action, children, className = '' }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`pc-panel ${className}`}><header className="pc-panel-head"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</header>{children}</section>
}

function Bar({ value, tone = '' }: { value: number; tone?: string }) {
  return <div className="pc-bar"><span className={tone} style={{ width: pct(value) }} /></div>
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="pc-field"><span>{label}</span>{children}</label>
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return <label className="pc-toggle"><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} /><span>{label}</span></label>
}

function readiness(data: PlacementData) {
  const skillProgress = (page: string) => progressFor(data.skills.filter(skill => skill.page === page))
  const projectScore = average(data.projects.map(project => average(Object.values(project.depth)) / 5 * 100))
  const resumeScore = data.resumes.length ? average(data.resumes.map(resume => average(Object.values(resume.checklist).map(value => value ? 100 : 0)) || resume.ats)) : 0
  const behavioralScore = average(Object.values(data.behaviors).map(item => item.ready ? 100 : item.improved ? 75 : item.practiced ? 50 : item.drafted ? 25 : 0))
  const mockScore = average(data.mocks.map(mock => Math.min(100, mock.score)))
  return {
    DSA: skillProgress('dsa'), 'CS Fundamentals': skillProgress('cs'), Development: skillProgress('development'),
    Projects: projectScore, 'System Design': skillProgress('system-design'), 'AI/ML': skillProgress('aiml'),
    'Cloud/DevOps': skillProgress('cloud'), Aptitude: skillProgress('aptitude'), Resume: resumeScore,
    Interview: average([skillProgress('interview'), behavioralScore, mockScore]),
    'Programming': skillProgress('programming'), Behavioral: behavioralScore, 'Company preparation': average(Object.values(data.companyQuestions).map(item => (item.dsa + item.cs + item.design + item.behavioral + item.previous) / 5)),
    'Mock interviews': mockScore,
  }
}

export default function PlacementCenter() {
  const location = useLocation()
  const navigate = useNavigate()
  const [data, setData] = useState<PlacementData>(() => createPlacementData())
  const [hydrated, setHydrated] = useState(false)
  const [storageError, setStorageError] = useState('')
  const [toast, setToast] = useState('')
  const [filter, setFilter] = useState<ProblemFilter>({ company: 'All', topic: 'All', pattern: 'All', difficulty: 'All', platform: 'All', solved: 'All' })
  const [appFilter, setAppFilter] = useState('All')
  const [companyFilter, setCompanyFilter] = useState('')
  const page = pages.find(item => item.path === location.pathname) ?? pages[0]
  const companyNames = [...data.companies, ...data.customCompanies]
  const platformNames = [...data.platforms, ...data.customPlatforms]
  const metrics = useMemo(() => readiness(data), [data])

  useEffect(() => {
    try {
      setData(loadPlacementData())
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : 'Unable to load placement data.')
    } finally {
      setHydrated(true)
    }
  }, [])
  useEffect(() => {
    if (!hydrated || storageError) return
    try {
      savePlacementData(data)
      setStorageError('')
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : 'Unable to save placement data.')
    }
  }, [data, hydrated, storageError])

  const updateSkill = (id: string, patch: Partial<Skill>) => setData(previous => ({ ...previous, skills: previous.skills.map(skill => skill.id === id ? { ...skill, ...patch } : skill) }))
  const updateBehavior = (name: string, patch: Partial<PlacementData['behaviors'][string]>) => setData(previous => ({ ...previous, behaviors: { ...previous.behaviors, [name]: { ...previous.behaviors[name], ...patch } } }))
  const addToast = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2600) }
  const groupedSkills = (pageId: string) => {
    const found = data.skills.filter(skill => skill.page === pageId)
    return [...new Set(found.map(skill => skill.group))].map(group => ({ group, skills: found.filter(skill => skill.group === group) }))
  }
  const addProblem = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const problem: Problem = {
      id: placementId(), name: String(form.get('name') || '').trim(), platform: String(form.get('platform') || 'LeetCode'),
      url: String(form.get('url') || ''), topic: String(form.get('topic') || '').trim(), pattern: String(form.get('pattern') || '').trim(),
      difficulty: String(form.get('difficulty') || 'Medium'), company: String(form.get('company') || ''),
      date: String(form.get('date') || today()), time: Number(form.get('time') || 0), result: String(form.get('result') || 'Attempted'),
      hints: Number(form.get('hints') || 0), solutionViewed: form.get('solutionViewed') === 'on', mistake: String(form.get('mistake') || ''),
      insight: String(form.get('insight') || ''), reattemptDate: String(form.get('reattemptDate') || ''),
      status: String(form.get('status') || 'Attempted'),
    }
    if (!problem.name) return
    setData(previous => ({ ...previous, problems: [problem, ...previous.problems] }))
    event.currentTarget.reset()
    addToast('Problem logged.')
  }
  const addProject = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const name = String(form.get('name') || '').trim()
    if (!name) return
    const project: Project = {
      id: placementId(), name, category: String(form.get('category') || 'Software'), stack: String(form.get('stack') || ''),
      github: String(form.get('github') || ''), live: String(form.get('live') || ''), readme: String(form.get('readme') || ''),
      architecture: String(form.get('architecture') || ''), startDate: String(form.get('startDate') || ''), endDate: String(form.get('endDate') || ''), status: 'In progress',
      checklist: Object.fromEntries(projectChecklist.map(item => [item, false])),
      depth: Object.fromEntries(projectDepth.map(item => [item, 0])),
    }
    setData(previous => ({ ...previous, projects: [project, ...previous.projects] }))
    event.currentTarget.reset()
    addToast('Project added. Depth is measured by quality, not project count.')
  }
  const addApplication = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const company = String(form.get('company') || '').trim()
    const role = String(form.get('role') || '').trim()
    if (!company || !role) return
    const application: Application = {
      id: placementId(), company, role, location: String(form.get('location') || ''), date: String(form.get('date') || today()),
      source: String(form.get('source') || ''), url: String(form.get('url') || ''), resume: String(form.get('resume') || ''),
      status: String(form.get('status') || 'Interested'), oaDate: String(form.get('oaDate') || ''), interviewDate: String(form.get('interviewDate') || ''),
      result: String(form.get('result') || ''), followUp: String(form.get('followUp') || ''), notes: String(form.get('notes') || ''),
    }
    setData(previous => ({ ...previous, applications: [application, ...previous.applications] }))
    event.currentTarget.reset()
    addToast('Application saved.')
  }
  const addCompany = () => {
    const name = companyFilter.trim()
    if (!name || companyNames.some(company => company.toLowerCase() === name.toLowerCase())) return
    setData(previous => ({
      ...previous, customCompanies: [...previous.customCompanies, name],
      companyQuestions: { ...previous.companyQuestions, [name]: { dsa: 0, cs: 0, design: 0, behavioral: 0, previous: 0, status: 'Not started' } },
    }))
    setCompanyFilter(name)
  }
  const addLanguage = () => {
    const name = window.prompt('Name a programming language to track')?.trim()
    if (!name || data.skills.some(skill => skill.page === 'programming' && skill.group.toLowerCase() === name.toLowerCase())) return
    const skill: Skill = { id: `programming-custom-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, page: 'programming', group: name, name: 'Core concepts', level: 0, weak: false, learning: false, practice: false, projectUsed: false, interviewReady: false }
    setData(previous => ({ ...previous, customLanguages: [...previous.customLanguages, name], skills: [...previous.skills, skill] }))
  }
  return <div className="placement-center">
    <header className="pc-topbar"><div className="pc-brand"><div className="pc-mark"><Briefcase size={18} /></div><div><strong>GATE + Placement OS</strong><small>One preparation workspace</small></div></div><button className="pc-link-button" onClick={() => navigate('/')}><ArrowLeft size={15} /> GATE 2027</button></header>
    <div className="pc-layout">
      <aside className="pc-sidebar"><div className="pc-goal"><span>YOUR SECOND TRACK</span><strong>PLACEMENT<br />PREPARATION</strong><small>Preparation progress, not a job guarantee.</small></div>
        {['Placement', 'Core skills', 'Build', 'Interviews', 'Profile', 'Apply'].map(group => <div className="pc-nav-group" key={group}><span>{group}</span>{pages.filter(item => item.group === group).map(item => <button key={item.path} className={item.path === page.path ? 'active' : ''} onClick={() => navigate(item.path)}><span>{item.label}</span>{item.path === page.path && <i />}</button>)}</div>)}
        <div className="pc-sidebar-foot">Saved in this browser · Use the GATE link above for your existing tracker.</div>
      </aside>
      <main className="pc-main">
        <div className="pc-page-title"><div><span>PLACEMENT PREPARATION</span><h1>{page.label === 'Placement Dashboard' ? 'Placement Command Center' : page.label}</h1><p>Target: Software Engineer / SDE / AI-ML / Cloud / Full Stack · Target companies: Product + MNC</p></div><button className="pc-button subtle" onClick={() => navigate('/placement/analytics')}><Target size={15} /> Readiness {pct(average(Object.values(metrics).slice(0, 10)))}</button></div>
        {storageError && <div className="pc-alert"><CircleAlert size={17} />{storageError}</div>}
        {page.id === 'dashboard' && <Dashboard data={data} metrics={metrics} navigate={navigate} update={setData} />}
        {['dsa', 'cs', 'programming', 'development', 'aiml', 'cloud', 'system-design', 'aptitude', 'github', 'interview', 'roadmap'].includes(page.id) &&
          (page.id === 'dsa' ? <DsaView data={data} setData={setData} addProblem={addProblem} filter={filter} setFilter={setFilter} platformNames={platformNames} companyNames={companyNames} /> :
            page.id === 'aptitude' ? <AptitudeView data={data} setData={setData} groups={groupedSkills(page.id)} updateSkill={updateSkill} /> :
              page.id === 'interview' ? <InterviewView data={data} setData={setData} groups={groupedSkills(page.id)} updateSkill={updateSkill} /> :
                page.id === 'github' ? <GithubView data={data} setData={setData} /> :
                  page.id === 'roadmap' ? <RoadmapView groupedSkills={groupedSkills} updateSkill={updateSkill} navigate={navigate} /> :
                    page.id === 'programming' ? <div className="pc-content"><SkillsView id={page.id} title={page.label} data={data} groups={groupedSkills(page.id)} updateSkill={updateSkill} setData={setData} /><Panel title="Additional languages" subtitle="Track other languages you use for coursework or interviews."><button className="pc-button subtle" onClick={addLanguage}><Plus size={14} /> Add language</button>{data.customLanguages.length > 0 && <span className="pc-muted">Tracked: {data.customLanguages.join(', ')}</span>}</Panel></div> :
                      <SkillsView id={page.id} title={page.label} data={data} groups={groupedSkills(page.id)} updateSkill={updateSkill} setData={page.id === 'system-design' ? setData : undefined} />)}
        {page.id === 'projects' && <ProjectsView data={data} setData={setData} addProject={addProject} />}
        {page.id === 'companies' && <CompaniesView data={data} metrics={metrics} setData={setData} companyNames={companyNames} companyFilter={companyFilter} setCompanyFilter={setCompanyFilter} addCompany={addCompany} />}
        {page.id === 'applications' && <ApplicationsView data={data} setData={setData} addApplication={addApplication} filter={appFilter} setFilter={setAppFilter} />}
        {page.id === 'resume' && <ChecklistView title="Resume versions" subtitle="Keep role-specific versions truthful, concise and easy to scan." entries={data.resumes.map(item => ({ id: item.id, name: item.name, score: item.ats, checklist: item.checklist }))} checklist={resumeChecklist} onToggle={(id, name, value) => setData(previous => ({ ...previous, resumes: previous.resumes.map(item => item.id === id ? { ...item, checklist: { ...item.checklist, [name]: value } } : item) }))} onScore={(id, score) => setData(previous => ({ ...previous, resumes: previous.resumes.map(item => item.id === id ? { ...item, ats: score } : item) }))} onRename={(id, name) => setData(previous => ({ ...previous, resumes: previous.resumes.map(item => item.id === id ? { ...item, name } : item) }))} onAdd={() => setData(previous => ({ ...previous, resumes: [...previous.resumes, { id: placementId(), name: 'New resume version', ats: 0, checklist: Object.fromEntries(resumeChecklist.map(item => [item, false])) }] }))} />}
        {page.id === 'linkedin' && <ProfileView title="LinkedIn profile checklist" items={linkedinChecklist} values={data.linkedin} update={values => setData(previous => ({ ...previous, linkedin: values }))} />}
        {page.id === 'behavioral' && <BehaviorView data={data} update={updateBehavior} />}
        {page.id === 'competitive' && <CompetitiveView data={data} setData={setData} />}
        {page.id === 'analytics' && <AnalyticsView data={data} metrics={metrics} setData={setData} />}
        {toast && <div className="pc-toast"><Check size={15} />{toast}</div>}
      </main>
    </div>
  </div>
}

function Dashboard({ data, metrics, navigate, update }: { data: PlacementData; metrics: Record<string, number>; navigate: (path: string) => void; update: (updater: (previous: PlacementData) => PlacementData) => void }) {
  const skillCard = (name: string, id: string, metric: string) => {
    const skills = data.skills.filter(skill => skill.page === id)
    const weak = skills.filter(skill => skill.weak)
    const next = skills.find(skill => skill.level < 4)
    return { name, path: `/placement/${id}`, progress: metrics[metric], complete: `${skills.filter(skill => skill.level === 4).length}/${skills.length} topics interview ready`, weak: weak[0]?.name ?? 'No weak topics marked', next: next ? `Practice ${next.name}` : 'Review a mastered topic' }
  }
  const dashboardCards = [
    skillCard('DSA Progress', 'dsa', 'DSA'), skillCard('CS Fundamentals', 'cs', 'CS Fundamentals'),
    skillCard('Development', 'development', 'Development'),
    { name: 'Projects', path: '/placement/projects', progress: metrics.Projects, complete: `${data.projects.length} projects tracked · quality-weighted`, weak: data.projects.find(item => average(Object.values(item.depth)) < 3)?.name ?? 'No shallow project score flagged', next: data.projects.length ? 'Improve the lowest depth dimension' : 'Add one substantial project' },
    skillCard('System Design', 'system-design', 'System Design'), skillCard('AI/ML', 'aiml', 'AI/ML'),
    skillCard('Cloud/DevOps', 'cloud', 'Cloud/DevOps'), skillCard('Aptitude', 'aptitude', 'Aptitude'),
    skillCard('Interview', 'interview', 'Interview'),
    { name: 'Resume', path: '/placement/resume', progress: metrics.Resume, complete: `${data.resumes.filter(item => Object.values(item.checklist).every(Boolean)).length}/${data.resumes.length} versions checklist-complete`, weak: data.resumes.find(item => average(Object.values(item.checklist).map(done => done ? 100 : 0)) < 50)?.name ?? 'No resume version flagged', next: data.resumes.flatMap(item => Object.entries(item.checklist).filter(([, done]) => !done).map(([check]) => `${item.name}: ${check}`))[0] ?? 'Review for accuracy' },
  ]
  const day = today()
  const tasks = data.daily[day] ?? {}
  const gateHours = data.balance.filter(item => item.date === day).reduce((total, item) => total + item.gateHours, 0)
  const placementHours = data.balance.filter(item => item.date === day).reduce((total, item) => total + item.placementHours, 0)
  const addBalance = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const entry = { date: day, gateHours: Number(form.get('gateHours') || 0), placementHours: Number(form.get('placementHours') || 0), dsa: Number(form.get('dsa') || 0), pyqs: Number(form.get('pyqs') || 0), revision: Number(form.get('revision') || 0), projects: Number(form.get('projects') || 0) }
    update(previous => ({ ...previous, balance: [...previous.balance.filter(item => item.date !== day), entry] }))
    event.currentTarget.reset()
  }
  return <div className="pc-content">
    <section className="pc-hero"><div><span>PLACEMENT PREPARATION</span><h2>Build evidence of your skills,<br />one focused session at a time.</h2><p>Targets: Software Engineer / SDE / AI-ML / Cloud / Full Stack · Product + MNC</p></div><div className="pc-readiness"><small>PLACEMENT READINESS</small><strong>{pct(average(Object.values(metrics).slice(0, 10)))}</strong><span>Internal preparation indicator · not a prediction of selection</span></div></section>
    <Panel title="Readiness by skill area" subtitle="Each internal progress card shows completed work, a weak area and a recommended next action. Not an employment or interview-selection prediction.">
      <div className="pc-grid pc-track-grid">{dashboardCards.map(card => <button className="pc-track-card" key={card.name} onClick={() => navigate(card.path)}><span>{card.name}<ArrowRight size={14} /></span><strong>{pct(card.progress)}</strong><Bar value={card.progress} /><small>Completed: {card.complete}</small><small>Weak: {card.weak}</small><em>Next: {card.next}</em></button>)}</div>
    </Panel>
    <div className="pc-grid pc-two">
      <Panel title="Today · Placement daily plan" subtitle="A lightweight checklist, not a forced schedule.">
        <div className="pc-daily-list">{dailyTasks.map(item => <Toggle key={item} label={item} checked={Boolean(tasks[item])} onChange={checked => update(previous => ({ ...previous, daily: { ...previous.daily, [day]: { ...(previous.daily[day] ?? {}), [item]: checked } } }))} />)}</div>
        <div className="pc-shared-links"><button onClick={() => navigate('/planner')}>GATE daily planner</button><button onClick={() => navigate('/calendar')}>Shared calendar</button><button onClick={() => navigate('/timer')}>Study timer</button><button onClick={() => navigate('/goals')}>GATE goals</button></div>
      </Panel>
      <Panel title="GATE + Placement balance" subtitle="Log hours and work completed; reminders never force a schedule.">
        <div className="pc-balance"><div><span>GATE</span><Bar value={gateHours + placementHours ? gateHours / (gateHours + placementHours) * 100 : 0} /><strong>{gateHours.toFixed(1)}h</strong></div><div><span>PLACEMENT</span><Bar value={gateHours + placementHours ? placementHours / (gateHours + placementHours) * 100 : 0} /><strong>{placementHours.toFixed(1)}h</strong></div></div>
        <form className="pc-inline-form" onSubmit={addBalance}><Field label="GATE hours"><input name="gateHours" type="number" min="0" step=".25" defaultValue="0" /></Field><Field label="Placement hours"><input name="placementHours" type="number" min="0" step=".25" defaultValue="0" /></Field><Field label="DSA problems"><input name="dsa" type="number" min="0" defaultValue="0" /></Field><Field label="GATE PYQs"><input name="pyqs" type="number" min="0" defaultValue="0" /></Field><Field label="Revision"><input name="revision" type="number" min="0" defaultValue="0" /></Field><Field label="Project hours"><input name="projects" type="number" min="0" step=".25" defaultValue="0" /></Field><button className="pc-button primary">Log today</button></form>
        {(gateHours === 0 || placementHours === 0) && <small className="pc-muted">Only one side is logged today. Check in periodically to keep both goals visible—no automatic schedule changes.</small>}
      </Panel>
    </div>
    <Panel title="Master skill matrix" subtitle="Self-assessed levels. Interview readiness is a practice signal, not a hiring guarantee.">
      <div className="pc-table-scroll"><table className="pc-table"><thead><tr><th>Skill</th>{levels.slice(1).map(level => <th key={level}>{level}</th>)}</tr></thead><tbody>{matrixSkills.map(name => {
        const label = name === 'OS' ? 'Operating Systems' : name === 'CN' ? 'Computer Networks' : name
        const selected = data.matrix[name] ?? 0
        return <tr key={name}><td>{label}</td>{levels.slice(1).map((level, index) => <td key={level}><input aria-label={`${label}: ${level}`} type="radio" name={`matrix-${name}`} checked={selected === index + 1} onChange={() => update(previous => ({ ...previous, matrix: { ...previous.matrix, [name]: index + 1 } }))} /></td>)}</tr>
      })}</tbody></table></div>
    </Panel>
  </div>
}

function SkillsView({ id, title, data, groups, updateSkill, setData }: { id: string; title: string; data: PlacementData; groups: { group: string; skills: Skill[] }[]; updateSkill: (id: string, patch: Partial<Skill>) => void; setData?: (updater: (previous: PlacementData) => PlacementData) => void }) {
  const skills = data.skills.filter(skill => skill.page === id)
  const [filter, setFilter] = useState('All')
  const visible = filter === 'Weak' ? skills.filter(skill => skill.weak) : filter === 'Incomplete' ? skills.filter(skill => skill.level < 4) : skills
  return <div className="pc-content">
    <Panel title={`${title} tracker`} subtitle="Move a skill forward as you practice. Record weak spots honestly and use the next action to guide work." action={<select className="pc-select" value={filter} onChange={event => setFilter(event.target.value)}><option>All</option><option>Weak</option><option>Incomplete</option></select>}>
      <div className="pc-track-summary"><strong>{pct(progressFor(skills))}</strong><Bar value={progressFor(skills)} /><span>{skills.filter(item => item.level === 4).length} interview ready · {skills.filter(item => item.weak).length} weak · {skills.filter(item => item.learning).length} learning</span></div>
      {groups.map(group => <div className="pc-skill-group" key={group.group}><h3>{group.group}</h3><div className="pc-skill-list">{group.skills.filter(skill => visible.includes(skill)).map(skill => <article className="pc-skill-row" key={skill.id}><div><strong>{skill.name}</strong><small>{skill.learning ? 'Learning' : skill.practice ? 'Practicing' : skill.level === 4 ? 'Interview ready' : 'Next: learn and practice this topic'}</small></div><select className="pc-select" aria-label={`${skill.name} level`} value={skill.level} onChange={event => updateSkill(skill.id, { level: Number(event.target.value), interviewReady: Number(event.target.value) === 4 })}>{levels.map((level, index) => <option key={level} value={index}>{level}</option>)}</select><Toggle label="Weak" checked={skill.weak} onChange={weak => updateSkill(skill.id, { weak })} /><Toggle label="Learning" checked={skill.learning} onChange={learning => updateSkill(skill.id, { learning })} /><Toggle label="Practice" checked={skill.practice} onChange={practice => updateSkill(skill.id, { practice })} />{['development', 'aiml', 'cloud', 'system-design'].includes(id) && <Toggle label="Used in project" checked={skill.projectUsed} onChange={projectUsed => updateSkill(skill.id, { projectUsed })} />}<Toggle label="Interview ready" checked={skill.interviewReady} onChange={interviewReady => updateSkill(skill.id, { interviewReady, level: interviewReady ? 4 : Math.min(skill.level, 3) })} /></article>)}</div></div>)}
    </Panel>
    {id === 'system-design' && setData && <Panel title="Design practice stages" subtitle="Mastery is a sequence: study, design, explain aloud, and complete a mock."><div className="pc-table-scroll"><table className="pc-table"><thead><tr><th>System</th><th>Studied</th><th>Designed</th><th>Explained aloud</th><th>Mock interview</th><th>Mastered</th></tr></thead><tbody>{skills.map(skill => { const stages = data.designStages[skill.id] ?? { studied: false, designed: false, explained: false, mock: false, mastered: false }; const ready = stages.studied && stages.designed && stages.explained && stages.mock; return <tr key={skill.id}><td>{skill.name}</td>{(['studied', 'designed', 'explained', 'mock', 'mastered'] as const).map(stage => <td key={stage}><input aria-label={`${skill.name}: ${stage}`} type="checkbox" disabled={stage === 'mastered' && !ready} checked={stages[stage]} onChange={event => setData(previous => { const next = { ...stages, [stage]: event.target.checked }; if (stage !== 'mastered' && !event.target.checked) next.mastered = false; return { ...previous, designStages: { ...previous.designStages, [skill.id]: next } } })} /></td>)}</tr> })}</tbody></table></div><p className="pc-muted">Mastered is enabled only after all four practice stages are complete.</p></Panel>}
  </div>
}

function RoadmapView({ groupedSkills, updateSkill, navigate }: { groupedSkills: (id: string) => { group: string; skills: Skill[] }[]; updateSkill: (id: string, patch: Partial<Skill>) => void; navigate: (path: string) => void }) {
  const phases = [
    { title: 'Phase 1 · Foundation', page: 'roadmap', link: '/placement/programming', description: 'Set up language fluency, core CS habits and basic tools.' },
    { title: 'Phase 2 · DSA', page: 'dsa', link: '/placement/dsa', description: 'Build pattern recognition through practice and reattempts.' },
    { title: 'Phase 3 · CS Fundamentals', page: 'cs', link: '/placement/cs', description: 'Prepare clear explanations and apply concepts in interviews.' },
  ]
  return <div className="pc-content">{phases.map(phase => {
    const groups = groupedSkills(phase.page)
    const skills = groups.flatMap(group => group.skills)
    const progress = progressFor(skills)
    return <Panel key={phase.page} title={phase.title} subtitle={phase.description} action={<button className="pc-button subtle small" onClick={() => navigate(phase.link)}>Open tracker <ArrowRight size={13} /></button>}>
      <div className="pc-track-summary"><strong>{pct(progress)}</strong><Bar value={progress} /><span>{skills.filter(skill => skill.level === 4).length}/{skills.length} interview ready</span></div>
      <div className="pc-phase-groups">{groups.map(group => <div key={group.group}><h3>{group.group}</h3><div>{group.skills.map(skill => <label className="pc-roadmap-topic" key={skill.id}><span>{skill.name}</span><select className="pc-select" value={skill.level} onChange={event => updateSkill(skill.id, { level: Number(event.target.value), interviewReady: Number(event.target.value) === 4 })}>{levels.map((level, index) => <option key={level} value={index}>{level}</option>)}</select></label>)}</div></div>)}</div>
    </Panel>
  })}</div>
}

function DsaView({ data, setData, addProblem, filter, setFilter, platformNames, companyNames }: { data: PlacementData; setData: (updater: (previous: PlacementData) => PlacementData) => void; addProblem: (event: FormEvent<HTMLFormElement>) => void; filter: ProblemFilter; setFilter: (value: ProblemFilter) => void; platformNames: string[]; companyNames: string[] }) {
  const solved = data.problems.filter(problem => ['Solved', 'Mastered'].includes(problem.status))
  const count = (difficulty: string) => solved.filter(problem => problem.difficulty === difficulty).length
  const accuracy = data.problems.length ? data.problems.filter(problem => ['Solved', 'Mastered'].includes(problem.status)).length / data.problems.length * 100 : 0
  const patterns = Object.entries(data.patterns)
  const filtered = data.problems.filter(problem =>
    (filter.company === 'All' || problem.company === filter.company) && (filter.topic === 'All' || problem.topic === filter.topic) &&
    (filter.pattern === 'All' || problem.pattern === filter.pattern) && (filter.difficulty === 'All' || problem.difficulty === filter.difficulty) &&
    (filter.platform === 'All' || problem.platform === filter.platform) && (filter.solved === 'All' || (filter.solved === 'Solved' ? ['Solved', 'Mastered'].includes(problem.status) : !['Solved', 'Mastered'].includes(problem.status))),
  )
  const savePattern = (name: string, key: 'theory' | 'easy' | 'medium' | 'hard' | 'company' | 'reattempt', value: boolean | number) =>
    setData(previous => ({ ...previous, patterns: { ...previous.patterns, [name]: { ...previous.patterns[name], [key]: value } } }))
  const independent = (name: string) => setData(previous => {
    const attempts = (previous.masteryAttempts[name] ?? 0) + 1
    return { ...previous, masteryAttempts: { ...previous.masteryAttempts, [name]: attempts }, patterns: { ...previous.patterns, [name]: { ...previous.patterns[name], independent: attempts } } }
  })
  const customPlatform = () => {
    const name = window.prompt('Name your practice platform')?.trim()
    if (name && !platformNames.some(item => item.toLowerCase() === name.toLowerCase())) setData(previous => ({ ...previous, customPlatforms: [...previous.customPlatforms, name] }))
  }
  return <div className="pc-content">
    <div className="pc-grid pc-stats pc-dsa-stats">{[['Problems solved', solved.length], ['Easy', count('Easy')], ['Medium', count('Medium')], ['Hard', count('Hard')], ['Accuracy', pct(accuracy)], ['Avg time', data.problems.length ? `${Math.round(average(data.problems.map(item => item.time)))} min` : '—'], ['Hints used', data.problems.reduce((n, item) => n + item.hints, 0)], ['Solutions viewed', data.problems.filter(item => item.solutionViewed).length], ['Reattempts', data.problems.filter(item => item.reattemptDate).length], ['Patterns mastered', patterns.filter(([name, p]) => (data.masteryAttempts[name] ?? p.independent) >= 3).length]].map(([label, value]) => <article className="pc-stat" key={String(label)}><span>{label}</span><strong>{value}</strong></article>)}</div>
    <Panel title="Quick problem log" subtitle="Log an attempt now; notes can be improved during review.">
      <form className="pc-form-grid" onSubmit={addProblem}>
        <Field label="Problem name"><input name="name" required placeholder="e.g. Longest substring" /></Field>
        <Field label="Platform"><select name="platform">{platformNames.map(item => <option key={item}>{item}</option>)}</select></Field>
        <Field label="Problem URL"><input name="url" type="url" placeholder="https://" /></Field>
        <Field label="Topic"><input name="topic" placeholder="Graphs" /></Field>
        <Field label="Pattern"><select name="pattern"><option value="">Select pattern</option>{patterns.map(([name]) => <option key={name}>{name}</option>)}</select></Field>
        <Field label="Difficulty"><select name="difficulty" defaultValue="Medium"><option>Easy</option><option>Medium</option><option>Hard</option></select></Field>
        <Field label="Company"><select name="company"><option value="">Unassigned</option>{companyNames.map(item => <option key={item}>{item}</option>)}</select></Field>
        <Field label="Date attempted"><input name="date" type="date" defaultValue={today()} /></Field>
        <Field label="Time taken (min)"><input name="time" type="number" min="0" /></Field>
        <Field label="Status"><select name="status">{['Not Started', 'Attempted', 'Solved', 'Solved with Hint', 'Solved after Solution', 'Needs Reattempt', 'Mastered'].map(item => <option key={item}>{item}</option>)}</select></Field>
        <Field label="Hints used"><input name="hints" type="number" min="0" defaultValue="0" /></Field>
        <Field label="Reattempt date"><input name="reattemptDate" type="date" /></Field>
        <Field label="Result"><input name="result" placeholder="Independent / with hints" /></Field>
        <Field label="Mistake"><input name="mistake" placeholder="What went wrong?" /></Field>
        <Field label="Key insight"><input name="insight" placeholder="The reusable idea" /></Field>
        <label className="pc-toggle"><input type="checkbox" name="solutionViewed" /><span>Solution viewed</span></label>
        <button className="pc-button primary"><Plus size={15} /> Save problem</button>
      </form>
    </Panel>
    <Panel title="Pattern tracker" subtitle="Mastery unlocks after at least three independent solves; assisted solves do not count.">
      <div className="pc-pattern-grid">{patterns.map(([name, item]) => { const mastered = (data.masteryAttempts[name] ?? item.independent) >= 3; return <article key={name} className="pc-pattern"><strong>{name}</strong><Toggle label="Theory" checked={item.theory} onChange={value => savePattern(name, 'theory', value)} /><div className="pc-pattern-counts">{(['easy', 'medium', 'hard', 'company', 'reattempt'] as const).map(key => <Field key={key} label={key}><input type="number" min="0" value={item[key]} onChange={event => savePattern(name, key, Number(event.target.value))} /></Field>)}</div><div className="pc-independent"><span>{item.independent} independent solves · {mastered ? 'Mastered' : `${Math.max(0, 3 - item.independent)} more independent solves to master`}</span><button className="pc-button subtle small" onClick={() => independent(name)}>Log independent solve</button></div></article> })}</div>
    </Panel>
    <Panel title="Problem log" subtitle="Filter by company, topic, pattern, difficulty, platform, or solved state." action={<button className="pc-button subtle small" onClick={customPlatform}>+ Custom platform</button>}>
      <div className="pc-filters">{[['company', 'Company', companyNames], ['topic', 'Topic', [...new Set(data.problems.map(item => item.topic).filter(Boolean))]], ['pattern', 'Pattern', patterns.map(([name]) => name)], ['difficulty', 'Difficulty', ['Easy', 'Medium', 'Hard']], ['platform', 'Platform', platformNames], ['solved', 'Solved / unsolved', ['Solved', 'Unsolved']]].map(([key, label, options]) => { const filterKey = String(key) as keyof ProblemFilter; return <Field label={String(label)} key={filterKey}><select value={filter[filterKey]} onChange={event => setFilter({ ...filter, [filterKey]: event.target.value })}><option>All</option>{(options as string[]).map(option => <option key={option}>{option}</option>)}</select></Field> })}</div>
      <div className="pc-table-scroll"><table className="pc-table"><thead><tr><th>Problem</th><th>Platform</th><th>Topic / pattern</th><th>Difficulty</th><th>Company</th><th>Date</th><th>Time</th><th>Status</th><th>Hint / solution</th><th>Mistake / insight</th><th /></tr></thead><tbody>{filtered.map(problem => <tr key={problem.id}><td>{problem.url ? <a href={problem.url} target="_blank" rel="noreferrer">{problem.name}</a> : problem.name}</td><td>{problem.platform}</td><td>{problem.topic} · {problem.pattern}</td><td>{problem.difficulty}</td><td>{problem.company || '—'}</td><td>{problem.date}</td><td>{problem.time}m</td><td><select className="pc-select" value={problem.status} onChange={event => setData(previous => ({ ...previous, problems: previous.problems.map(item => item.id === problem.id ? { ...item, status: event.target.value } : item) }))}>{['Not Started', 'Attempted', 'Solved', 'Solved with Hint', 'Solved after Solution', 'Needs Reattempt', 'Mastered'].map(item => <option key={item}>{item}</option>)}</select></td><td>{problem.hints} hints{problem.solutionViewed ? ' · viewed' : ''}</td><td>{problem.mistake || problem.insight || '—'}</td><td><button className="pc-icon-button" aria-label="Delete problem" onClick={() => setData(previous => ({ ...previous, problems: previous.problems.filter(item => item.id !== problem.id) }))}><Trash2 size={14} /></button></td></tr>)}</tbody></table>{!filtered.length && <p className="pc-empty">No problem attempts logged yet. Add one above after practice.</p>}</div>
    </Panel>
  </div>
}

function ProjectsView({ data, setData, addProject }: { data: PlacementData; setData: (updater: (previous: PlacementData) => PlacementData) => void; addProject: (event: FormEvent<HTMLFormElement>) => void }) {
  return <div className="pc-content">
    <Panel title="Add a project" subtitle="Prioritize two to four substantial projects over a long list of shallow demos.">
      <form className="pc-form-grid" onSubmit={addProject}><Field label="Project name"><input name="name" required placeholder="Project name" /></Field><Field label="Category"><select name="category"><option>Full Stack</option><option>AI/ML</option><option>Cloud/DevOps</option><option>Backend</option><option>Other</option></select></Field><Field label="Tech stack"><input name="stack" placeholder="React, Django, PostgreSQL" /></Field><Field label="GitHub URL"><input name="github" type="url" placeholder="https://" /></Field><Field label="Live URL"><input name="live" type="url" placeholder="https://" /></Field><Field label="README URL"><input name="readme" type="url" placeholder="https://" /></Field><Field label="Architecture documentation"><input name="architecture" type="url" placeholder="https://" /></Field><Field label="Start date"><input name="startDate" type="date" /></Field><Field label="End date"><input name="endDate" type="date" /></Field><button className="pc-button primary"><Plus size={15} /> Add project</button></form>
    </Panel>
    {!data.projects.length && <Panel title="Project depth score"><p className="pc-empty">Add a project to score problem clarity, technical complexity, code quality, architecture, deployment, scalability, testing, documentation and interview readiness. Having more projects does not increase the score.</p></Panel>}
    {data.projects.map(project => {
      const depthScore = average(Object.values(project.depth)) / 5 * 100
      const checklistDone = Object.values(project.checklist).filter(Boolean).length
      return <Panel key={project.id} title={project.name} subtitle={`${project.category} · ${project.stack || 'Tech stack not set'} · ${project.status}`} action={<button className="pc-icon-button" aria-label="Delete project" onClick={() => setData(previous => ({ ...previous, projects: previous.projects.filter(item => item.id !== project.id) }))}><Trash2 size={15} /></button>}>
        <div className="pc-project-head"><div><small>PROJECT DEPTH SCORE</small><strong>{pct(depthScore)}</strong><Bar value={depthScore} /><span>{checklistDone}/{projectChecklist.length} quality checks complete · one project, no quantity bonus · {project.startDate || 'Start date unset'}–{project.endDate || 'present'}</span></div><div className="pc-project-links">{project.github && <a href={project.github} target="_blank" rel="noreferrer">GitHub</a>}{project.live && <a href={project.live} target="_blank" rel="noreferrer">Live demo</a>}{project.readme && <a href={project.readme} target="_blank" rel="noreferrer">README</a>}{project.architecture && <a href={project.architecture} target="_blank" rel="noreferrer">Architecture</a>}<select className="pc-select" value={project.status} onChange={event => setData(previous => ({ ...previous, projects: previous.projects.map(item => item.id === project.id ? { ...item, status: event.target.value } : item) }))}><option>In progress</option><option>Complete</option><option>Paused</option></select></div></div>
        <div className="pc-depth-grid">{projectDepth.map(item => <Field key={item} label={`${item} · ${project.depth[item]}/5`}><input type="range" min="0" max="5" value={project.depth[item]} onChange={event => setData(previous => ({ ...previous, projects: previous.projects.map(record => record.id === project.id ? { ...record, depth: { ...record.depth, [item]: Number(event.target.value) } } : record) }))} /></Field>)}</div>
        <div className="pc-check-grid">{projectChecklist.map(item => <Toggle key={item} label={item} checked={project.checklist[item]} onChange={value => setData(previous => ({ ...previous, projects: previous.projects.map(record => record.id === project.id ? { ...record, checklist: { ...record.checklist, [item]: value } } : record) }))} />)}</div>
      </Panel>
    })}
  </div>
}

function CompaniesView({ data, metrics, setData, companyNames, companyFilter, setCompanyFilter, addCompany }: { data: PlacementData; metrics: Record<string, number>; setData: (updater: (previous: PlacementData) => PlacementData) => void; companyNames: string[]; companyFilter: string; setCompanyFilter: (value: string) => void; addCompany: () => void }) {
  const company = companyNames.includes(companyFilter) ? companyFilter : companyNames[0]
  const item = data.companyQuestions[company] ?? { dsa: 0, cs: 0, design: 0, behavioral: 0, previous: 0, status: 'Not started' }
  const shared = average([metrics.DSA, metrics['CS Fundamentals'], metrics['System Design'], metrics.Projects, metrics.Resume, metrics.Behavioral, metrics['Mock interviews']])
  const readinessScore = average([shared, item.dsa, item.cs, item.design, item.behavioral, item.previous])
  const updateCompany = (patch: Partial<typeof item>) => setData(previous => ({ ...previous, companyQuestions: { ...previous.companyQuestions, [company]: { ...(previous.companyQuestions[company] ?? item), ...patch } } }))
  const updateCompanyProgress = (key: 'dsa' | 'cs' | 'design' | 'behavioral' | 'previous', value: number) => updateCompany({ [key]: value })
  return <div className="pc-content">
    <Panel title="Company preparation" subtitle="Track real practice and interview-specific preparation; add any employer to your list.">
      <div className="pc-company-add"><input value={companyFilter} onChange={event => setCompanyFilter(event.target.value)} placeholder="Find a company or add one" list="pc-company-list" /><datalist id="pc-company-list">{companyNames.map(name => <option key={name} value={name} />)}</datalist><button className="pc-button primary" onClick={addCompany}><Plus size={15} /> Add company</button></div>
      <div className="pc-company-tabs">{companyNames.map(name => <button key={name} className={company === name ? 'active' : ''} onClick={() => setCompanyFilter(name)}>{name}</button>)}</div>
      <div className="pc-company-summary"><div><span>{company} preparation</span><strong>{pct(readinessScore)}</strong><Bar value={readinessScore} /><small>Internal preparation indicator, not a prediction of interview selection.</small></div><Field label="Preparation status"><select value={item.status} onChange={event => updateCompany({ status: event.target.value })}><option>Not started</option><option>Preparing</option><option>Ready for practice</option><option>Reviewing</option></select></Field></div>
      <div className="pc-readiness-grid">{[['DSA question practice', 'dsa'], ['CS fundamentals', 'cs'], ['System design', 'design'], ['Behavioral preparation', 'behavioral'], ['Previous interview questions', 'previous']].map(([label, key]) => { const progressKey = key as 'dsa' | 'cs' | 'design' | 'behavioral' | 'previous'; return <Field key={key} label={`${label} · ${item[progressKey]}%`}><input type="range" min="0" max="100" step="5" value={item[progressKey]} onChange={event => updateCompanyProgress(progressKey, Number(event.target.value))} /></Field> })}</div>
      <div className="pc-readiness-grid">{[['Shared DSA', metrics.DSA], ['CS Fundamentals', metrics['CS Fundamentals']], ['System Design', metrics['System Design']], ['Projects', metrics.Projects], ['Resume', metrics.Resume], ['Behavioral', metrics.Behavioral], ['Mock interviews', metrics['Mock interviews']]].map(([label, value]) => <div className="pc-readiness-item" key={String(label)}><span>{label}</span><strong>{pct(Number(value))}</strong><Bar value={Number(value)} /></div>)}</div>
      <p className="pc-muted">Company list includes Google, Microsoft, Amazon, Meta, Apple, NVIDIA, Adobe, Atlassian, Uber, Salesforce, Goldman Sachs, JPMorgan, Walmart, Flipkart, TCS, Infosys, Accenture and Deloitte. Preparation tracking cannot predict hiring outcomes.</p>
    </Panel>
  </div>
}

function ApplicationsView({ data, setData, addApplication, filter, setFilter }: { data: PlacementData; setData: (updater: (previous: PlacementData) => PlacementData) => void; addApplication: (event: FormEvent<HTMLFormElement>) => void; filter: string; setFilter: (value: string) => void }) {
  const shown = filter === 'All' ? data.applications : data.applications.filter(item => item.status === filter)
  const followUps = data.applications.filter(item => item.followUp && item.followUp <= today() && !['Offer', 'Rejected', 'Withdrawn'].includes(item.status))
  return <div className="pc-content">
    <Panel title="Application CRM" subtitle={`${data.applications.length} tracked · ${followUps.length} follow-up${followUps.length === 1 ? '' : 's'} due`}><form className="pc-form-grid" onSubmit={addApplication}>
      <Field label="Company"><input name="company" required placeholder="Company" /></Field><Field label="Role"><input name="role" required placeholder="SDE Intern" /></Field><Field label="Location"><input name="location" placeholder="Location / Remote" /></Field><Field label="Application date"><input name="date" type="date" defaultValue={today()} /></Field><Field label="Source"><input name="source" placeholder="Referral, careers page…" /></Field><Field label="Job URL"><input name="url" type="url" placeholder="https://" /></Field><Field label="Resume version"><select name="resume">{data.resumes.map(item => <option key={item.id}>{item.name}</option>)}</select></Field><Field label="Status"><select name="status">{statusOptions.map(item => <option key={item}>{item}</option>)}</select></Field><Field label="OA date"><input name="oaDate" type="date" /></Field><Field label="Interview date"><input name="interviewDate" type="date" /></Field><Field label="Follow-up date"><input name="followUp" type="date" /></Field><Field label="Result"><input name="result" placeholder="Pending / notes" /></Field><Field label="Notes"><input name="notes" placeholder="Next step" /></Field><button className="pc-button primary"><Plus size={15} /> Save application</button>
    </form></Panel>
    <Panel title="Applications" action={<select className="pc-select" value={filter} onChange={event => setFilter(event.target.value)}><option>All</option>{statusOptions.map(item => <option key={item}>{item}</option>)}</select>}>
      {followUps.length > 0 && <div className="pc-alert compact"><CircleAlert size={16} />{followUps.length} follow-up reminder{followUps.length > 1 ? 's' : ''} due: {followUps.map(item => `${item.company} (${item.followUp})`).join(', ')}</div>}
      <div className="pc-table-scroll"><table className="pc-table"><thead><tr><th>Company / role</th><th>Location</th><th>Applied</th><th>Source</th><th>Resume</th><th>Status</th><th>OA / interview</th><th>Follow-up</th><th>Result / notes</th><th /></tr></thead><tbody>{shown.map(item => <tr key={item.id}><td>{item.url ? <a href={item.url} target="_blank" rel="noreferrer">{item.company}</a> : item.company}<small>{item.role}</small></td><td>{item.location || '—'}</td><td>{item.date}</td><td>{item.source || '—'}</td><td>{item.resume}</td><td><select className="pc-select" value={item.status} onChange={event => setData(previous => ({ ...previous, applications: previous.applications.map(record => record.id === item.id ? { ...record, status: event.target.value } : record) }))}>{statusOptions.map(status => <option key={status}>{status}</option>)}</select></td><td>{item.oaDate || '—'} / {item.interviewDate || '—'}</td><td>{item.followUp || '—'}</td><td>{item.result || item.notes || '—'}</td><td><button className="pc-icon-button" aria-label="Delete application" onClick={() => setData(previous => ({ ...previous, applications: previous.applications.filter(record => record.id !== item.id) }))}><Trash2 size={14} /></button></td></tr>)}</tbody></table>{shown.length === 0 && <p className="pc-empty">No applications tracked for this status.</p>}</div>
    </Panel>
  </div>
}

function ChecklistView({ title, subtitle, entries, checklist, onToggle, onScore, onRename, onAdd }: { title: string; subtitle: string; entries: { id: string; name: string; score: number; checklist: Record<string, boolean> }[]; checklist: string[]; onToggle: (id: string, name: string, value: boolean) => void; onScore: (id: string, score: number) => void; onRename: (id: string, name: string) => void; onAdd: () => void }) {
  return <div className="pc-content"><Panel title={title} subtitle={subtitle} action={<button className="pc-button primary small" onClick={onAdd}><Plus size={14} /> Add version</button>}>{entries.map(entry => <div className="pc-profile-card" key={entry.id}><div className="pc-profile-heading"><Field label="Resume version name"><input value={entry.name} onChange={event => onRename(entry.id, event.target.value)} /></Field><Field label={`ATS compatibility score · ${entry.score}%`}><input type="range" min="0" max="100" step="5" value={entry.score} onChange={event => onScore(entry.id, Number(event.target.value))} /></Field></div><div className="pc-check-grid">{checklist.map(item => <Toggle key={item} label={item} checked={entry.checklist[item] ?? false} onChange={value => onToggle(entry.id, item, value)} />)}</div></div>)}</Panel></div>
}

function ProfileView({ title, items, values, update }: { title: string; items: string[]; values: Record<string, boolean>; update: (value: Record<string, boolean>) => void }) {
  return <div className="pc-content"><Panel title={title} subtitle="Keep profile details authentic and focused on useful evidence."><div className="pc-check-grid">{items.map(item => <Toggle key={item} label={item} checked={Boolean(values[item])} onChange={value => update({ ...values, [item]: value })} />)}</div><div className="pc-track-summary"><strong>{pct(average(Object.values(values).map(value => value ? 100 : 0)))}</strong><span>{Object.values(values).filter(Boolean).length}/{items.length} profile elements reviewed</span><Bar value={average(Object.values(values).map(value => value ? 100 : 0))} /></div></Panel></div>
}

function GithubView({ data, setData }: { data: PlacementData; setData: (updater: (previous: PlacementData) => PlacementData) => void }) {
  const score = average(Object.values(data.github).map(value => value ? 100 : 0))
  return <div className="pc-content"><Panel title="Git & GitHub profile" subtitle="Show useful, maintained work; avoid meaningless commits just to inflate activity."><div className="pc-grid pc-rating-grid"><div className="pc-readiness-item"><span>GitHub Profile Score</span><strong>{pct(score)}</strong><Bar value={score} /></div><Field label="Repositories"><input type="number" min="0" value={data.githubStats.repositories} onChange={event => setData(previous => ({ ...previous, githubStats: { ...previous.githubStats, repositories: Number(event.target.value) } }))} /></Field><Field label="Pinned Projects"><input type="number" min="0" value={data.githubStats.pinnedProjects} onChange={event => setData(previous => ({ ...previous, githubStats: { ...previous.githubStats, pinnedProjects: Number(event.target.value) } }))} /></Field><Field label="Open-source contributions"><input type="number" min="0" value={data.githubStats.openSourceContributions} onChange={event => setData(previous => ({ ...previous, githubStats: { ...previous.githubStats, openSourceContributions: Number(event.target.value) } }))} /></Field></div><div className="pc-check-grid">{githubChecklist.map(item => <Toggle key={item} label={item} checked={Boolean(data.github[item])} onChange={value => setData(previous => ({ ...previous, github: { ...previous.github, [item]: value } }))} />)}</div></Panel></div>
}

function BehaviorView({ data, update }: { data: PlacementData; update: (name: string, patch: Partial<PlacementData['behaviors'][string]>) => void }) {
  return <div className="pc-content"><Panel title="STAR-method behavioral practice" subtitle="Draft, practice and refine concise situation–task–action–result stories. Recording is optional.">{behavioralTopics.map(topic => { const answer = data.behaviors[topic]; return <article className="pc-behavior" key={topic}><div><strong>{topic}</strong><textarea aria-label={`${topic} practice notes`} value={answer.notes} placeholder="Add optional STAR notes or practice feedback…" onChange={event => update(topic, { notes: event.target.value })} /></div><div className="pc-check-grid compact">{[['Drafted', 'drafted'], ['Practiced', 'practiced'], ['Recorded (optional)', 'recorded'], ['Improved', 'improved'], ['Interview ready', 'ready']].map(([label, key]) => <Toggle key={key} label={label} checked={answer[key as keyof typeof answer] as boolean} onChange={value => update(topic, { [key]: value })} />)}</div></article> })}</Panel></div>
}

function AptitudeView({ data, setData, groups, updateSkill }: { data: PlacementData; setData: (updater: (previous: PlacementData) => PlacementData) => void; groups: { group: string; skills: Skill[] }[]; updateSkill: (id: string, patch: Partial<Skill>) => void }) {
  const [newLog, setNewLog] = useState(false)
  const [category, setCategory] = useState('Quantitative Aptitude')
  const [questions, setQuestions] = useState(20)
  const [correct, setCorrect] = useState(0)
  const [minutes, setMinutes] = useState(0)
  const [mock, setMock] = useState(0)
  const accuracy = data.aptitude.reduce((sum, item) => sum + item.correct, 0) / Math.max(1, data.aptitude.reduce((sum, item) => sum + item.questions, 0)) * 100
  return <div className="pc-content"><div className="pc-grid pc-stats"><article className="pc-stat"><span>Questions</span><strong>{data.aptitude.reduce((sum, item) => sum + item.questions, 0)}</strong></article><article className="pc-stat"><span>Accuracy</span><strong>{pct(accuracy)}</strong></article><article className="pc-stat"><span>Practice time</span><strong>{data.aptitude.reduce((sum, item) => sum + item.minutes, 0)}m</strong></article><article className="pc-stat"><span>Mock score avg.</span><strong>{pct(average(data.aptitude.map(item => item.mock)))}</strong></article></div><SkillsView id="aptitude" title="Aptitude" data={data} groups={groups} updateSkill={updateSkill} />
    <Panel title="Aptitude practice log" subtitle="Track quantitative, logical reasoning and verbal practice."><button className="pc-button primary" onClick={() => setNewLog(value => !value)}><Plus size={14} /> {newLog ? 'Close quick log' : 'Log a practice set'}</button>{newLog && <div className="pc-quick-log"><Field label="Category"><select value={category} onChange={event => setCategory(event.target.value)}><option>Quantitative Aptitude</option><option>Logical Reasoning</option><option>Verbal</option></select></Field><Field label="Questions"><input type="number" min="0" value={questions} onChange={event => setQuestions(Number(event.target.value))} /></Field><Field label="Correct"><input type="number" min="0" max={questions} value={correct} onChange={event => setCorrect(Number(event.target.value))} /></Field><Field label="Time (minutes)"><input type="number" min="0" value={minutes} onChange={event => setMinutes(Number(event.target.value))} /></Field><Field label="Mock score %"><input type="number" min="0" max="100" value={mock} onChange={event => setMock(Number(event.target.value))} /></Field><button className="pc-button primary" onClick={() => { setData(previous => ({ ...previous, aptitude: [{ id: placementId(), date: today(), category, questions, correct, minutes, mock }, ...previous.aptitude] })); setNewLog(false) }}>Save log</button></div>}
      <div className="pc-table-scroll"><table className="pc-table"><thead><tr><th>Date</th><th>Category</th><th>Questions</th><th>Accuracy</th><th>Time</th><th>Mock score</th></tr></thead><tbody>{data.aptitude.map(item => <tr key={item.id}><td>{item.date}</td><td>{item.category}</td><td>{item.correct}/{item.questions}</td><td>{pct(item.questions ? item.correct / item.questions * 100 : 0)}</td><td>{item.minutes}m</td><td>{pct(item.mock)}</td></tr>)}</tbody></table></div>
    </Panel>
  </div>
}

function InterviewView({ data, setData, groups, updateSkill }: { data: PlacementData; setData: (updater: (previous: PlacementData) => PlacementData) => void; groups: { group: string; skills: Skill[] }[]; updateSkill: (id: string, patch: Partial<Skill>) => void }) {
  const [form, setForm] = useState(false)
  const [company, setCompany] = useState('')
  const [interviewer, setInterviewer] = useState('')
  const [topics, setTopics] = useState('')
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [strengths, setStrengths] = useState('')
  const [weaknesses, setWeaknesses] = useState('')
  const [next, setNext] = useState('')
  return <div className="pc-content"><SkillsView id="interview" title="Interview preparation" data={data} groups={groups} updateSkill={updateSkill} /><Panel title="Mock interviews" subtitle="Record feedback and one specific next action after each mock."><button className="pc-button primary" onClick={() => setForm(value => !value)}><Plus size={14} /> Log mock</button>{form && <div className="pc-quick-log"><Field label="Date"><input id="mock-date" type="date" defaultValue={today()} /></Field><Field label="Company"><input value={company} onChange={event => setCompany(event.target.value)} /></Field><Field label="Interviewer"><input value={interviewer} onChange={event => setInterviewer(event.target.value)} /></Field><Field label="Topics"><input value={topics} onChange={event => setTopics(event.target.value)} /></Field><Field label="Score %"><input type="number" min="0" max="100" value={score} onChange={event => setScore(Number(event.target.value))} /></Field><Field label="Strengths"><input value={strengths} onChange={event => setStrengths(event.target.value)} /></Field><Field label="Weaknesses"><input value={weaknesses} onChange={event => setWeaknesses(event.target.value)} /></Field><Field label="Feedback"><input value={feedback} onChange={event => setFeedback(event.target.value)} /></Field><Field label="Next action"><input value={next} onChange={event => setNext(event.target.value)} /></Field><button className="pc-button primary" onClick={() => { const date = document.querySelector<HTMLInputElement>('#mock-date')?.value || today(); setData(previous => ({ ...previous, mocks: [{ id: placementId(), date, company, interviewer, topics, score, strengths, weaknesses, feedback, next }, ...previous.mocks] })); setForm(false) }}>Save mock</button></div>}
      <div className="pc-table-scroll"><table className="pc-table"><thead><tr><th>Date</th><th>Company</th><th>Interviewer</th><th>Topics</th><th>Score</th><th>Strengths</th><th>Weaknesses / feedback</th><th>Next action</th></tr></thead><tbody>{data.mocks.map(item => <tr key={item.id}><td>{item.date}</td><td>{item.company}</td><td>{item.interviewer || '—'}</td><td>{item.topics}</td><td>{pct(item.score)}</td><td>{item.strengths}</td><td>{item.weaknesses} {item.feedback}</td><td>{item.next}</td></tr>)}</tbody></table></div>
    </Panel></div>
}

function CompetitiveView({ data, setData }: { data: PlacementData; setData: (updater: (previous: PlacementData) => PlacementData) => void }) {
  const [platform, setPlatform] = useState('Codeforces')
  const [rank, setRank] = useState(0)
  const [ratingChange, setRatingChange] = useState(0)
  const [solved, setSolved] = useState(0)
  const [mistakes, setMistakes] = useState('')
  const [topics, setTopics] = useState('')
  const [virtual, setVirtual] = useState(false)
  const updateRating = (name: string, rating: number) => setData(previous => ({ ...previous, ratings: { ...previous.ratings, [name]: rating } }))
  return <div className="pc-content"><Panel title="Competitive programming" subtitle="Ratings are one signal; independent problem solving and DSA patterns matter too."><div className="pc-grid pc-rating-grid">{Object.entries(data.ratings).map(([name, rating]) => <Field key={name} label={`${name} rating`}><input type="number" min="0" value={rating} onChange={event => updateRating(name, Number(event.target.value))} /></Field>)}<div className="pc-readiness-item"><span>Contests participated</span><strong>{data.contests.length}</strong></div><div className="pc-readiness-item"><span>Problems solved in contests</span><strong>{data.contests.reduce((sum, item) => sum + item.solved, 0)}</strong></div><div className="pc-readiness-item"><span>Virtual contests</span><strong>{data.contests.filter(item => item.mistakes.startsWith('[Virtual]')).length}</strong></div></div>
      <div className="pc-quick-log"><Field label="Platform"><select value={platform} onChange={event => setPlatform(event.target.value)}><option>Codeforces</option><option>CodeChef</option><option>AtCoder</option><option>Other</option></select></Field><Field label="Contest date"><input id="contest-date" type="date" defaultValue={today()} /></Field><Field label="Rank"><input type="number" min="0" value={rank} onChange={event => setRank(Number(event.target.value))} /></Field><Field label="Rating change"><input type="number" value={ratingChange} onChange={event => setRatingChange(Number(event.target.value))} /></Field><Field label="Problems solved"><input type="number" min="0" value={solved} onChange={event => setSolved(Number(event.target.value))} /></Field><Field label="Topics that caused failure"><input value={topics} onChange={event => setTopics(event.target.value)} /></Field><Field label="Mistakes"><input value={mistakes} onChange={event => setMistakes(event.target.value)} /></Field><Toggle label="Virtual contest" checked={virtual} onChange={setVirtual} /><button className="pc-button primary" onClick={() => { const date = document.querySelector<HTMLInputElement>('#contest-date')?.value || today(); setData(previous => ({ ...previous, contests: [{ id: placementId(), date, platform, rank, ratingChange, solved, mistakes: `${virtual ? '[Virtual] ' : ''}${mistakes}`, topics }, ...previous.contests] })); setRank(0); setRatingChange(0); setSolved(0) }}>Log contest</button></div>
      <div className="pc-table-scroll"><table className="pc-table"><thead><tr><th>Date</th><th>Platform</th><th>Rank</th><th>Rating change</th><th>Solved</th><th>Failure topics</th><th>Mistakes</th></tr></thead><tbody>{data.contests.map(item => <tr key={item.id}><td>{item.date}</td><td>{item.platform}</td><td>{item.rank}</td><td>{item.ratingChange > 0 ? '+' : ''}{item.ratingChange}</td><td>{item.solved}</td><td>{item.topics}</td><td>{item.mistakes}</td></tr>)}</tbody></table></div>
    </Panel></div>
}

function AnalyticsView({ data, metrics, setData }: { data: PlacementData; metrics: Record<string, number>; setData: (updater: (previous: PlacementData) => PlacementData) => void }) {
  const weekDays = Array.from({ length: 8 }, (_, index) => { const date = new Date(); date.setDate(date.getDate() - (7 - index)); return localDate(date) })
  const dates = weekDays.slice(1)
  const dateLabels = dates.map(date => date.slice(5))
  const dailyProblems = dates.map(day => data.problems.filter(problem => problem.date === day))
  const dailyBalance = dates.map(day => data.balance.filter(item => item.date === day))
  const weeklyProblemCounts = dailyProblems.map(items => items.length)
  const weeklyAccuracy = dailyProblems.map(items => items.length ? items.filter(item => ['Solved', 'Mastered'].includes(item.status)).length / items.length * 100 : 0)
  const weeklyGateHours = dailyBalance.map(items => items.reduce((sum, item) => sum + item.gateHours, 0))
  const weeklyPlacementHours = dailyBalance.map(items => items.reduce((sum, item) => sum + item.placementHours, 0))
  const weeklyProjectHours = dailyBalance.map(items => items.reduce((sum, item) => sum + item.projects, 0))
  const bars = (title: string, values: number[], labels: string[], unit = '') => { const max = Math.max(1, ...values); return <Panel title={title}><div className="pc-chart">{values.map((value, index) => <div key={`${title}-${index}`}><div className="pc-chart-column"><span style={{ height: `${Math.max(3, value / max * 100)}%` }} /></div><small>{labels[index]}</small><b>{unit === '%' ? pct(value) : unit === 'h' ? `${value.toFixed(1)}h` : Math.round(value)}</b></div>)}</div></Panel> }
  const latestMocks = [...data.mocks].reverse().slice(-7)
  const latestAptitude = [...data.aptitude].reverse().slice(-7)
  const csGroups = ['OOP', 'DBMS', 'Operating Systems', 'Computer Networks', 'Computer Architecture']
  const designGroups = ['LLD · Concepts', 'LLD · Practice systems', 'HLD · Concepts', 'HLD · Practice systems']
  const applicationLabels = ['Submitted', 'Interview stage', 'Offers']
  const applicationValues = [
    data.applications.filter(item => !['Interested', 'Preparing'].includes(item.status)).length, interviewsCount(data),
    data.applications.filter(item => item.status === 'Offer').length,
  ]
  const chartPanels = [
    bars('DSA problems / week', weeklyProblemCounts, dateLabels),
    bars('DSA accuracy / week', weeklyAccuracy, dateLabels, '%'),
    bars('GATE study hours / week', weeklyGateHours, dateLabels, 'h'),
    bars('Placement study hours / week', weeklyPlacementHours, dateLabels, 'h'),
    bars('Project hours / week', weeklyProjectHours, dateLabels, 'h'),
    bars('CS fundamentals progress', csGroups.map(group => progressFor(data.skills.filter(skill => skill.page === 'cs' && skill.group === group))), csGroups.map(group => group === 'Operating Systems' ? 'OS' : group === 'Computer Networks' ? 'CN' : group === 'Computer Architecture' ? 'Arch.' : group), '%'),
    bars('Mock interview scores', latestMocks.map(item => item.score), latestMocks.map(item => item.date.slice(5)), '%'),
    bars('Aptitude accuracy', latestAptitude.map(item => item.questions ? item.correct / item.questions * 100 : 0), latestAptitude.map(item => item.date.slice(5)), '%'),
    bars('System design progress', designGroups.map(group => progressFor(data.skills.filter(skill => skill.page === 'system-design' && skill.group === group))), ['LLD concepts', 'LLD practice', 'HLD concepts', 'HLD practice'], '%'),
    bars('Applications & interview conversion', applicationValues, applicationLabels),
    bars('Resume version checklist progress', data.resumes.map(item => average(Object.values(item.checklist).map(done => done ? 100 : 0))), data.resumes.map(item => item.name), '%'),
    bars('Coding contest ratings', Object.values(data.ratings), Object.keys(data.ratings)),
  ]
  const apps = data.applications.length
  const interviews = interviewsCount(data)
  return <div className="pc-content"><div className="pc-grid pc-stats">{Object.entries(metrics).slice(0, 10).map(([name, value]) => <article className="pc-stat" key={name}><span>{name}</span><strong>{pct(value)}</strong><Bar value={value} /></article>)}</div>
    <div className="pc-grid pc-two pc-chart-grid">{chartPanels}</div>
    <div className="pc-grid pc-two"><Panel title="Practice signals"><div className="pc-analytics-list"><div><span>DSA accuracy</span><strong>{pct(data.problems.length ? data.problems.filter(item => ['Solved', 'Mastered'].includes(item.status)).length / data.problems.length * 100 : 0)}</strong></div><div><span>Projects / total project hours logged</span><strong>{data.projects.length} / {data.balance.reduce((sum, item) => sum + item.projects, 0).toFixed(1)}h</strong></div><div><span>CS fundamentals progress</span><strong>{pct(metrics['CS Fundamentals'])}</strong></div><div><span>System design progress</span><strong>{pct(metrics['System Design'])}</strong></div><div><span>Aptitude accuracy</span><strong>{pct(data.aptitude.reduce((sum, item) => sum + item.correct, 0) / Math.max(1, data.aptitude.reduce((sum, item) => sum + item.questions, 0)) * 100)}</strong></div><div><span>Mock interview score avg.</span><strong>{pct(average(data.mocks.map(item => item.score)))}</strong></div></div></Panel><Panel title="Applications & profile"><div className="pc-analytics-list"><div><span>Applications submitted</span><strong>{data.applications.filter(item => !['Interested', 'Preparing'].includes(item.status)).length}</strong></div><div><span>Interview conversion</span><strong>{apps ? pct(interviews / apps * 100) : '0%'}</strong></div><div><span>Resume versions</span><strong>{data.resumes.length}</strong></div><div><span>Contests / rating</span><strong>{data.contests.length} / CF {data.ratings.Codeforces}</strong></div><div><span>GATE hours logged</span><strong>{data.balance.reduce((sum, item) => sum + item.gateHours, 0).toFixed(1)}h</strong></div><div><span>Placement hours logged</span><strong>{data.balance.reduce((sum, item) => sum + item.placementHours, 0).toFixed(1)}h</strong></div></div></Panel></div>
    <Panel title="What should I learn next?" subtitle={`Priorities for selected roles: ${data.roles.join(', ') || 'choose a target role'}.`}><RolePicker roles={data.roles} onChange={roles => setData(previous => ({ ...previous, roles }))} /><div className="pc-gap-list">{[...new Set(data.roles.flatMap(role => companyRoles[role] ?? []))].map(id => { const skills = data.skills.filter(skill => skill.page === id); const weak = skills.filter(skill => skill.weak); const next = skills.filter(skill => skill.level < 4).sort((a, b) => a.level - b.level).slice(0, 1); return skills.length ? <div key={id}><span>{weak.length ? 'Priority gap' : 'Recommended track'} · {pages.find(item => item.id === id)?.label ?? id}</span><strong>{weak[0]?.name ?? next[0]?.name ?? 'Track in good shape'}</strong><Bar value={progressFor(skills)} /></div> : null })}</div></Panel>
    <Panel title="Top actions"><ol className="pc-actions">{data.skills.filter(skill => skill.weak && skill.level < 4).slice(0, 5).map(skill => <li key={skill.id}>Strengthen {skill.name} · {skill.group}</li>)}{data.skills.filter(skill => skill.weak && skill.level < 4).length < 5 && ['Log an independent DSA problem and capture the key insight', 'Revise a DBMS/OS/CN topic you marked weak', 'Complete one meaningful project improvement', 'Practice explaining a system design aloud', 'Run a mock interview and act on the feedback'].slice(0, 5 - data.skills.filter(skill => skill.weak && skill.level < 4).length).map(item => <li key={item}>{item}</li>)}</ol></Panel>
  </div>
}

function interviewsCount(data: PlacementData) {
  return data.applications.filter(item => ['Technical Interview', 'HR/Behavioral', 'Offer'].includes(item.status)).length
}

function RolePicker({ roles, onChange }: { roles: string[]; onChange: (roles: string[]) => void }) {
  return <div className="pc-role-picker">{rolesAvailable.map(role => <label key={role}><input type="checkbox" checked={roles.includes(role)} onChange={event => onChange(event.target.checked ? [...roles, role] : roles.filter(item => item !== role))} />{role}</label>)}</div>
}
