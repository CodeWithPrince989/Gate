export type PreparationTab = 'ALL' | 'CSE' | 'DA' | 'PLACEMENT'

export type GateActivities = {
  theory: boolean
  questions: boolean
  pyqs: boolean
  revision: boolean
  test: boolean
  focus: boolean
}

export type PlacementActivities = {
  dsa: boolean
  fundamentals: boolean
  development: boolean
  systemDesign: boolean
  aptitude: boolean
  interview: boolean
}

export interface PreparationCheckin {
  date: string
  gateCseActivities: GateActivities
  gateDaActivities: GateActivities
  placementActivities: PlacementActivities
  focusMinutes: number
  questionsSolved: number
  pyqsSolved: number
  dsaProblems: number
  dailyScore: number
  preparationLevel: number
  subjectsStudied: string
  topicsStudied: string
  notes: string
  learned: string
  mistake: string
  improveTomorrow: string
}

export type ActivityFilter = 'All activities' | 'Study sessions' | 'Questions' | 'PYQs' | 'Revision' | 'Tests' | 'DSA' | 'Projects' | 'Interview'
export interface ContributionPreferences {
  monthlyGoals: { focusHours: number; dsaProblems: number; pyqs: number; activeDays: number }
  perfectDay: { requireGateStudy: boolean; requirePlacement: boolean; requireRevision: boolean; minimumFocusMinutes: number }
}

export const ACTIVITY_FILTERS: ActivityFilter[] = ['All activities', 'Study sessions', 'Questions', 'PYQs', 'Revision', 'Tests', 'DSA', 'Projects', 'Interview']
export const PREPARATION_ACTIVITY_LEVELS = {
  trackScoreMaximums: [1, 2, 3, 5],
  combinedScoreMaximums: [2, 5, 9, 14],
}
export const DEFAULT_CONTRIBUTION_PREFERENCES: ContributionPreferences = {
  monthlyGoals: { focusHours: 120, dsaProblems: 100, pyqs: 500, activeDays: 26 },
  perfectDay: { requireGateStudy: true, requirePlacement: true, requireRevision: true, minimumFocusMinutes: 120 },
}

export const GATE_ACTIVITY_LABELS: Record<keyof GateActivities, string> = {
  theory: 'Theory studied',
  questions: 'Questions solved',
  pyqs: 'PYQs solved',
  revision: 'Revision completed',
  test: 'Test completed',
  focus: 'Focused session',
}

export const PLACEMENT_ACTIVITY_LABELS: Record<keyof PlacementActivities, string> = {
  dsa: 'DSA practice',
  fundamentals: 'CS fundamentals',
  development: 'Development / project work',
  systemDesign: 'System design',
  aptitude: 'Aptitude',
  interview: 'Interview preparation',
}

const STORAGE_PREFIX = 'gate-preparation-checkins-v1'
const emptyGateActivities = (): GateActivities => ({ theory: false, questions: false, pyqs: false, revision: false, test: false, focus: false })
const emptyPlacementActivities = (): PlacementActivities => ({ dsa: false, fundamentals: false, development: false, systemDesign: false, aptitude: false, interview: false })

export function emptyCheckin(date: string): PreparationCheckin {
  return {
    date,
    gateCseActivities: emptyGateActivities(),
    gateDaActivities: emptyGateActivities(),
    placementActivities: emptyPlacementActivities(),
    focusMinutes: 0,
    questionsSolved: 0,
    pyqsSolved: 0,
    dsaProblems: 0,
    dailyScore: 0,
    preparationLevel: 0,
    subjectsStudied: '',
    topicsStudied: '',
    notes: '',
    learned: '',
    mistake: '',
    improveTomorrow: '',
  }
}

function storageKey() {
  const savedUser = localStorage.getItem('gate-user')
  if (!savedUser) return `${STORAGE_PREFIX}-anonymous`
  let user: { id?: number }
  try {
    user = JSON.parse(savedUser) as { id?: number }
  } catch (error) {
    console.error('Could not identify the signed-in user for preparation check-ins.', error)
    throw new Error('Unable to identify the signed-in user for preparation check-ins.')
  }
  if (!Number.isInteger(user.id)) throw new Error('Unable to identify the signed-in user for preparation check-ins.')
  return `${STORAGE_PREFIX}-${user.id}`
}

function preferencesStorageKey() {
  return `${storageKey()}-preferences`
}

function validPreferences(value: unknown): value is ContributionPreferences {
  if (!value || typeof value !== 'object') return false
  const preferences = value as Partial<ContributionPreferences>
  const goals = preferences.monthlyGoals
  const perfect = preferences.perfectDay
  return !!goals && Number.isSafeInteger(goals.focusHours) && goals.focusHours >= 0 &&
    Number.isSafeInteger(goals.dsaProblems) && goals.dsaProblems >= 0 &&
    Number.isSafeInteger(goals.pyqs) && goals.pyqs >= 0 &&
    Number.isSafeInteger(goals.activeDays) && goals.activeDays >= 0 &&
    !!perfect && typeof perfect.requireGateStudy === 'boolean' &&
    typeof perfect.requirePlacement === 'boolean' && typeof perfect.requireRevision === 'boolean' &&
    Number.isSafeInteger(perfect.minimumFocusMinutes) && perfect.minimumFocusMinutes >= 0
}

export function loadContributionPreferences(): ContributionPreferences {
  const raw = localStorage.getItem(preferencesStorageKey())
  if (!raw) return DEFAULT_CONTRIBUTION_PREFERENCES
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (error) {
    console.error('Saved preparation contribution preferences could not be parsed.', error)
    throw new Error('Saved contribution preferences are unreadable. Your existing data was left untouched.')
  }
  if (!validPreferences(parsed)) throw new Error('Saved contribution preferences are invalid. Your existing data was left untouched.')
  return parsed
}

export function saveContributionPreferences(preferences: ContributionPreferences) {
  try {
    localStorage.setItem(preferencesStorageKey(), JSON.stringify(preferences))
  } catch (error) {
    console.error('Could not save contribution preferences.', error)
    throw new Error('Your browser could not save these contribution preferences. Check available storage and try again.')
  }
}

function isCheckin(value: unknown): value is PreparationCheckin {
  if (!value || typeof value !== 'object') return false
  const record = value as Partial<PreparationCheckin>
  const parsedDate = new Date(`${record.date}T00:00:00Z`)
  const isDate = /^\d{4}-\d{2}-\d{2}$/.test(record.date ?? '') &&
    !Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString().slice(0, 10) === record.date
  const hasActivities = (activities: unknown, names: string[]) => !!activities && typeof activities === 'object' &&
    names.every(name => typeof (activities as Record<string, unknown>)[name] === 'boolean') &&
    Object.keys(activities).every(name => names.includes(name))
  const hasText = (key: keyof PreparationCheckin) => typeof record[key] === 'string'
  const hasCount = (count: number | undefined) => Number.isSafeInteger(count) && (count ?? -1) >= 0
  return isDate &&
    hasActivities(record.gateCseActivities, Object.keys(emptyGateActivities())) &&
    hasActivities(record.gateDaActivities, Object.keys(emptyGateActivities())) &&
    hasActivities(record.placementActivities, Object.keys(emptyPlacementActivities())) &&
    hasCount(record.focusMinutes) && hasCount(record.questionsSolved) &&
    hasCount(record.pyqsSolved) && hasCount(record.dsaProblems) &&
    hasCount(record.dailyScore) && hasCount(record.preparationLevel) &&
    ['subjectsStudied', 'topicsStudied', 'notes', 'learned', 'mistake', 'improveTomorrow'].every(key => hasText(key as keyof PreparationCheckin))
}

export function loadCheckins(): Record<string, PreparationCheckin> {
  const raw = localStorage.getItem(storageKey())
  if (!raw) return {}
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (error) {
    console.error('Saved preparation check-in data could not be parsed.', error)
    throw new Error('Saved preparation check-in data is unreadable. Your existing records were left untouched.')
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Saved preparation check-in data is invalid. Your existing records were left untouched.')
  }
  const entries = Object.entries(parsed)
  if (entries.some(([date, value]) => !isCheckin(value) || value.date !== date)) {
    throw new Error('Saved preparation check-in data is invalid. Your existing records were left untouched.')
  }
  return parsed as Record<string, PreparationCheckin>
}

export function saveCheckins(checkins: Record<string, PreparationCheckin>) {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(checkins))
  } catch (error) {
    console.error('Could not save preparation check-ins.', error)
    throw new Error('Your browser could not save this check-in. Check available storage and try again.')
  }
}

export function gateActivityCount(activities: GateActivities) {
  return Object.values(activities).filter(Boolean).length
}

export function placementActivityCount(activities: PlacementActivities) {
  return Object.values(activities).filter(Boolean).length
}

export function categoryActivityCount(checkin: PreparationCheckin, tab: PreparationTab) {
  if (tab === 'CSE') return gateActivityCount(checkin.gateCseActivities)
  if (tab === 'DA') return gateActivityCount(checkin.gateDaActivities)
  if (tab === 'PLACEMENT') return placementActivityCount(checkin.placementActivities)
  const gateCount = gateActivityCount(checkin.gateCseActivities) + gateActivityCount(checkin.gateDaActivities)
  const gateQuestionRecorded = checkin.gateCseActivities.questions || checkin.gateDaActivities.questions
  const gatePyqRecorded = checkin.gateCseActivities.pyqs || checkin.gateDaActivities.pyqs
  const placementCount = placementActivityCount(checkin.placementActivities)
  const dsaRecorded = checkin.placementActivities.dsa
  return Math.min(18, gateCount + placementCount +
    Number(checkin.questionsSolved > 0 && !gateQuestionRecorded) +
    Number(checkin.pyqsSolved > 0 && !gatePyqRecorded) +
    Number(checkin.dsaProblems > 0 && !dsaRecorded))
}

export function activityCount(checkin: PreparationCheckin, filter: ActivityFilter) {
  if (filter === 'All activities') return categoryActivityCount(checkin, 'ALL')
  if (filter === 'Study sessions') return Number(checkin.gateCseActivities.focus || checkin.gateDaActivities.focus)
  if (filter === 'Questions') return Math.min(5, Math.max(Number(checkin.gateCseActivities.questions || checkin.gateDaActivities.questions), Math.ceil(checkin.questionsSolved / 10)))
  if (filter === 'PYQs') return Math.min(5, Math.max(Number(checkin.gateCseActivities.pyqs || checkin.gateDaActivities.pyqs), Math.ceil(checkin.pyqsSolved / 5)))
  if (filter === 'Revision') return Number(checkin.gateCseActivities.revision) + Number(checkin.gateDaActivities.revision)
  if (filter === 'Tests') return Number(checkin.gateCseActivities.test) + Number(checkin.gateDaActivities.test)
  if (filter === 'DSA') return Math.min(5, Math.max(Number(checkin.placementActivities.dsa), checkin.dsaProblems))
  if (filter === 'Projects') return Number(checkin.placementActivities.development)
  return Number(checkin.placementActivities.interview)
}

export function activityLevel(count: number, tab: PreparationTab, filter: ActivityFilter) {
  if (count <= 0) return 0
  if (filter !== 'All activities') return Math.min(5, count)
  const maximums = tab === 'ALL' ? PREPARATION_ACTIVITY_LEVELS.combinedScoreMaximums : PREPARATION_ACTIVITY_LEVELS.trackScoreMaximums
  return maximums.findIndex(maximum => count <= maximum) + 1 || 5
}

export function checkinLevel(checkin: PreparationCheckin, tab: PreparationTab) {
  return activityLevel(categoryActivityCount(checkin, tab), tab, 'All activities')
}

export function meaningfulActive(checkin: PreparationCheckin) {
  return categoryActivityCount(checkin, 'ALL') > 0 || checkin.questionsSolved > 0 || checkin.pyqsSolved > 0 || checkin.dsaProblems > 0
}

export function checkinFromForm(form: PreparationCheckin): PreparationCheckin {
  const positiveInteger = (value: number) => Math.max(0, Math.floor(Number.isFinite(value) ? value : 0))
  const normalized = {
    ...form,
    focusMinutes: positiveInteger(form.focusMinutes),
    questionsSolved: positiveInteger(form.questionsSolved),
    pyqsSolved: positiveInteger(form.pyqsSolved),
    dsaProblems: positiveInteger(form.dsaProblems),
  }
  const dailyScore = categoryActivityCount(normalized, 'ALL')
  return {
    ...normalized,
    dailyScore,
    preparationLevel: activityLevel(dailyScore, 'ALL', 'All activities'),
  }
}

export function recordActivityCounts(checkin: PreparationCheckin) {
  return {
    cse: gateActivityCount(checkin.gateCseActivities),
    da: gateActivityCount(checkin.gateDaActivities),
    placement: placementActivityCount(checkin.placementActivities),
  }
}
