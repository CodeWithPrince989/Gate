export type TaskStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Carried Forward'
export type Priority = 'High' | 'Medium' | 'Low'

export interface Task {
  id: string
  date: string
  title: string
  subject: string
  topic: string
  priority: Priority
  estimatedMinutes: number
  status: TaskStatus
  notes: string
  carryCount: number
  isMIT: boolean
  order?: number
}

export interface Topic {
  id: string
  subject: string
  paper: 'CSE' | 'DA' | 'Common'
  name: string
  stage: number
  questions: number
  pyqs: number
  accuracy: number
  revisionCount: number
  lastRevised: string
  nextRevision: string
  strength: 'Weak' | 'Developing' | 'Strong'
}

export interface Pyq {
  id: string
  subject: string
  topic: string
  year: number
  difficulty: 'Easy' | 'Medium' | 'Hard'
  attemptDate: string
  result: 'Unattempted' | 'Correct' | 'Wrong' | 'Guessed Correct' | 'Marked for Reattempt' | 'Mastered'
  timeTaken: number
  confidence: number
  mistakeType: string
  reattemptDate: string
}

export interface Revision {
  id: string
  topicId: string
  subject: string
  topic: string
  type: 'R0' | 'R1' | 'R2' | 'R3' | 'R4'
  dueDate: string
  completedDate: string
  status: 'Due' | 'Completed' | 'Snoozed'
  weak: boolean
}

export interface Mistake {
  id: string
  date: string
  subject: string
  topic: string
  question: string
  source: string
  approach: string
  whyWrong: string
  concept: string
  lesson: string
  category: string
  reattempts: number[]
}

export interface TestRecord {
  id: string
  date: string
  type: 'Topic Test' | 'Subject Test' | 'Full-Length Mock'
  name: string
  subject: string
  score: number
  maxMarks: number
  attempted: number
  correct: number
  wrong: number
  unattempted: number
  minutes: number
  rank: number
  a: number
  b: number
  c: number
  d: number
}

export interface StudySession {
  id: string
  date: string
  subject: string
  topic: string
  duration: number
}

export interface DayRecord {
  date: string
  targetQuestions: number
  attempted: number
  correct: number
  targetPyqs: number
  pyqsAttempted: number
  pyqsCorrect: number
  pyqYears: string
  difficultPyqs: string
  revisionMinutes: number
  theorySubject: string
  theoryTopic: string
  theory: boolean
  concepts: boolean
  notes: boolean
  recall: boolean
  dayStatus: 'Completed' | 'Partially Completed' | 'Rest Day'
  learned: string
  tomorrow: string
  distractions: { name: string; minutes: number }[]
}

export interface WeeklyReview {
  week: string
  strongest: string
  weakest: string
  mistake: string
  achievement: string
  priority: string
}

export interface Goal {
  id: string
  level: 'Monthly' | 'Weekly'
  title: string
  target: number
  unit: string
  current: number
}

export interface TrackerData {
  onboardingComplete: boolean
  paper: 'CSE' | 'DA' | 'CSE + DA'
  dailyTargetHours: number
  weeklyTargetHours: number
  tasks: Task[]
  topics: Topic[]
  pyqs: Pyq[]
  revisions: Revision[]
  mistakes: Mistake[]
  tests: TestRecord[]
  sessions: StudySession[]
  days: Record<string, DayRecord>
  reviews: WeeklyReview[]
  goals: Goal[]
  timer: { running: boolean; mode: 'focus' | 'break'; startedAt: number; subject: string; topic: string; task: string; focusMinutes: number; breakMinutes: number }
}

export const subjects = [
  { name: 'C Programming', paper: 'CSE' as const, topics: ['Pointers', 'Arrays & Strings', 'Functions', 'Structures', 'Recursion'] },
  { name: 'Data Structures', paper: 'CSE' as const, topics: ['Linked Lists', 'Stacks & Queues', 'Trees', 'Hashing', 'Graphs'] },
  { name: 'Algorithms', paper: 'CSE' as const, topics: ['Asymptotic Analysis', 'Sorting', 'Greedy Algorithms', 'Dynamic Programming', 'Graph Algorithms'] },
  { name: 'Digital Logic', paper: 'CSE' as const, topics: ['Boolean Algebra', 'Combinational Circuits', 'Sequential Circuits', 'Number Systems'] },
  { name: 'Computer Organization', paper: 'CSE' as const, topics: ['Instruction Pipeline', 'Cache Memory', 'Addressing Modes', 'I/O Organization'] },
  { name: 'Theory of Computation', paper: 'CSE' as const, topics: ['Finite Automata', 'Regular Expressions', 'Context-Free Grammars', 'Turing Machines'] },
  { name: 'Compiler Design', paper: 'CSE' as const, topics: ['Lexical Analysis', 'Parsing', 'Syntax Directed Translation', 'Code Optimization'] },
  { name: 'Operating Systems', paper: 'CSE' as const, topics: ['Processes', 'CPU Scheduling', 'Deadlocks', 'Memory Management', 'File Systems'] },
  { name: 'DBMS', paper: 'CSE' as const, topics: ['ER Model', 'Relational Algebra', 'Normalization', 'Transactions', 'SQL'] },
  { name: 'Computer Networks', paper: 'CSE' as const, topics: ['OSI & TCP/IP', 'Data Link Layer', 'IP Addressing', 'TCP Congestion Control'] },
  { name: 'Engineering Mathematics', paper: 'Common' as const, topics: ['Linear Algebra', 'Calculus', 'Discrete Mathematics', 'Combinatorics'] },
  { name: 'General Aptitude', paper: 'Common' as const, topics: ['Verbal Aptitude', 'Numerical Aptitude', 'Analytical Reasoning'] },
  { name: 'Probability & Statistics', paper: 'DA' as const, topics: ['Probability Distributions', 'Bayes Theorem', 'Descriptive Statistics', 'Hypothesis Testing'] },
  { name: 'Linear Algebra', paper: 'DA' as const, topics: ['Vector Spaces', 'Eigenvalues', 'Matrix Factorization', 'Linear Equations'] },
  { name: 'Programming & DS', paper: 'DA' as const, topics: ['Python Basics', 'Data Structures', 'Searching & Sorting', 'Complexity'] },
  { name: 'Machine Learning', paper: 'DA' as const, topics: ['Linear Regression', 'Classification', 'Clustering', 'Model Evaluation'] },
  { name: 'Artificial Intelligence', paper: 'DA' as const, topics: ['Search Strategies', 'Knowledge Representation', 'Reasoning', 'Planning'] },
  { name: 'Database & Warehousing', paper: 'DA' as const, topics: ['Relational Databases', 'Data Warehousing', 'Data Mining', 'SQL'] },
  { name: 'Data Science', paper: 'DA' as const, topics: ['Data Preparation', 'Visualization', 'Feature Engineering', 'Big Data'] },
]

export const stageNames = ['Not Started', 'Theory', 'Questions', 'PYQs', 'R1', 'R2', 'R3', 'Test', 'Mastered']
export const mistakeCategories = ['Conceptual gap', 'Calculation error', 'Misread question', 'Formula forgotten', 'Careless mistake', 'Time pressure', 'Guessing']

export const localDate = (date = new Date()) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const shiftDay = (date: string, amount: number) => {
  const next = new Date(`${date}T12:00:00`)
  next.setDate(next.getDate() + amount)
  return localDate(next)
}

export function createDemoData(): TrackerData {
  const today = localDate()
  const topicList: Topic[] = subjects.flatMap((subject, subjectIndex) => subject.topics.map((name, index) => {
    const stage = (subjectIndex * 3 + index * 2) % 9
    const weak = (subjectIndex + index) % 7 === 0
    return {
      id: `${subject.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${index}`,
      subject: subject.name,
      paper: subject.paper,
      name,
      stage,
      questions: Math.max(0, stage * 9 + (index % 3) * 5),
      pyqs: Math.max(0, (stage - 1) * 4),
      accuracy: weak ? 62 : Math.min(97, 70 + stage * 3),
      revisionCount: Math.max(0, stage - 3),
      lastRevised: shiftDay(today, -((index + subjectIndex) % 12)),
      nextRevision: shiftDay(today, stage < 2 ? 2 : ((index + subjectIndex) % 4 === 0 ? -1 : (index % 10) + 1)),
      strength: weak ? 'Weak' as const : stage >= 6 ? 'Strong' as const : 'Developing' as const,
    }
  }))
  const findTopic = (subject: string, name: string) => topicList.find(t => t.subject === subject && t.name === name)!
  const tasks: Task[] = [
    { id: crypto.randomUUID(), date: today, title: 'Revise normalization and solve 15 PYQs', subject: 'DBMS', topic: 'Normalization', priority: 'High', estimatedMinutes: 75, status: 'In Progress', notes: 'Focus on BCNF decomposition', carryCount: 0, isMIT: true },
    { id: crypto.randomUUID(), date: today, title: 'Practice CPU scheduling numericals', subject: 'Operating Systems', topic: 'CPU Scheduling', priority: 'High', estimatedMinutes: 60, status: 'Not Started', notes: '', carryCount: 1, isMIT: true },
    { id: crypto.randomUUID(), date: today, title: 'Linked list problem set', subject: 'Data Structures', topic: 'Linked Lists', priority: 'Medium', estimatedMinutes: 45, status: 'Not Started', notes: '', carryCount: 0, isMIT: true },
    { id: crypto.randomUUID(), date: today, title: 'Daily aptitude practice', subject: 'General Aptitude', topic: 'Numerical Aptitude', priority: 'Low', estimatedMinutes: 30, status: 'Completed', notes: '20 questions', carryCount: 0, isMIT: false },
  ]
  const demoDay: DayRecord = {
    date: today, targetQuestions: 40, attempted: 26, correct: 22, targetPyqs: 20, pyqsAttempted: 12, pyqsCorrect: 10,
    pyqYears: '2024, 2023', difficultPyqs: 'DBMS-2024-12', revisionMinutes: 35, theorySubject: 'DBMS', theoryTopic: 'Normalization', theory: true, concepts: true, notes: false, recall: false,
    dayStatus: 'Partially Completed', learned: '', tomorrow: '', distractions: [{ name: 'Social media', minutes: 15 }],
  }
  const pyqs: Pyq[] = [
    { id: 'DBMS-2024-12', subject: 'DBMS', topic: 'Normalization', year: 2024, difficulty: 'Hard', attemptDate: today, result: 'Wrong', timeTaken: 8, confidence: 2, mistakeType: 'Conceptual gap', reattemptDate: shiftDay(today, 2) },
    { id: 'OS-2023-07', subject: 'Operating Systems', topic: 'CPU Scheduling', year: 2023, difficulty: 'Medium', attemptDate: today, result: 'Correct', timeTaken: 5, confidence: 4, mistakeType: '', reattemptDate: '' },
    { id: 'DS-2022-18', subject: 'Data Structures', topic: 'Linked Lists', year: 2022, difficulty: 'Easy', attemptDate: shiftDay(today, -1), result: 'Guessed Correct', timeTaken: 4, confidence: 1, mistakeType: 'Guessing', reattemptDate: shiftDay(today, 1) },
    { id: 'CN-2021-25', subject: 'Computer Networks', topic: 'IP Addressing', year: 2021, difficulty: 'Medium', attemptDate: '', result: 'Unattempted', timeTaken: 0, confidence: 0, mistakeType: '', reattemptDate: '' },
  ]
  const revisions: Revision[] = [
    { id: crypto.randomUUID(), topicId: findTopic('DBMS', 'Normalization').id, subject: 'DBMS', topic: 'Normalization', type: 'R2', dueDate: today, completedDate: '', status: 'Due', weak: true },
    { id: crypto.randomUUID(), topicId: findTopic('Operating Systems', 'CPU Scheduling').id, subject: 'Operating Systems', topic: 'CPU Scheduling', type: 'R1', dueDate: today, completedDate: '', status: 'Due', weak: false },
    { id: crypto.randomUUID(), topicId: findTopic('C Programming', 'Pointers').id, subject: 'C Programming', topic: 'Pointers', type: 'R3', dueDate: today, completedDate: '', status: 'Due', weak: false },
  ]
  const mistakes: Mistake[] = [
    { id: crypto.randomUUID(), date: shiftDay(today, -1), subject: 'DBMS', topic: 'Normalization', question: 'Lossless decomposition check', source: 'GATE 2024', approach: 'Checked dependency preservation only', whyWrong: 'Forgot the lossless join condition', concept: 'Use the common attribute superkey criterion', lesson: 'Check lossless join and dependency preservation independently', category: 'Conceptual gap', reattempts: [0, 0, 0] },
    { id: crypto.randomUUID(), date: shiftDay(today, -2), subject: 'Operating Systems', topic: 'CPU Scheduling', question: 'Average waiting time', source: 'Practice set', approach: 'Summed turnaround times', whyWrong: 'Subtracted arrival time incorrectly', concept: 'Waiting time = turnaround - burst time', lesson: 'Write timeline before calculating', category: 'Calculation error', reattempts: [1, 0, 0] },
  ]
  const sessions: StudySession[] = Array.from({ length: 10 }, (_, index) => ({
    id: crypto.randomUUID(), date: shiftDay(today, -index % 7), subject: ['DBMS', 'Operating Systems', 'Data Structures'][index % 3],
    topic: ['Normalization', 'CPU Scheduling', 'Linked Lists'][index % 3], duration: [50, 70, 35, 45][index % 4],
  }))
  const tests: TestRecord[] = [
    { id: crypto.randomUUID(), date: shiftDay(today, -4), type: 'Subject Test', name: 'DBMS Unit Test 2', subject: 'DBMS', score: 48, maxMarks: 65, attempted: 42, correct: 34, wrong: 8, unattempted: 8, minutes: 90, rank: 124, a: 28, b: 6, c: 5, d: 3 },
    { id: crypto.randomUUID(), date: shiftDay(today, -11), type: 'Full-Length Mock', name: 'GATE Mock 01', subject: 'CSE', score: 61, maxMarks: 100, attempted: 52, correct: 42, wrong: 10, unattempted: 13, minutes: 180, rank: 320, a: 35, b: 7, c: 6, d: 4 },
  ]
  const days: Record<string, DayRecord> = { [today]: demoDay }
  for (let index = 1; index < 8; index++) {
    const date = shiftDay(today, -index)
    days[date] = { ...demoDay, date, attempted: 32 + index, correct: 25 + index, pyqsAttempted: 14 + index, pyqsCorrect: 11 + index, revisionMinutes: 40 }
  }
  return {
    onboardingComplete: false, paper: 'CSE + DA', dailyTargetHours: 6, weeklyTargetHours: 40, tasks, topics: topicList, pyqs, revisions, mistakes, tests, sessions, days,
    reviews: [], goals: [
      { id: crypto.randomUUID(), level: 'Monthly', title: 'Complete Operating Systems', target: 15, unit: 'topics', current: 7 },
      { id: crypto.randomUUID(), level: 'Monthly', title: 'Solve PYQs', target: 500, unit: 'PYQs', current: 146 },
      { id: crypto.randomUUID(), level: 'Monthly', title: 'Take subject tests', target: 4, unit: 'tests', current: 1 },
      { id: crypto.randomUUID(), level: 'Weekly', title: 'Focused study', target: 40, unit: 'hours', current: 15 },
      { id: crypto.randomUUID(), level: 'Weekly', title: 'Practice questions', target: 250, unit: 'questions', current: 87 },
      { id: crypto.randomUUID(), level: 'Weekly', title: 'Solve PYQs', target: 150, unit: 'PYQs', current: 46 },
      { id: crypto.randomUUID(), level: 'Weekly', title: 'Complete revisions', target: 2, unit: 'revisions', current: 0 },
      { id: crypto.randomUUID(), level: 'Weekly', title: 'Take a test', target: 1, unit: 'test', current: 0 },
    ],
    timer: { running: false, mode: 'focus', startedAt: 0, subject: 'DBMS', topic: 'Normalization', task: '', focusMinutes: 50, breakMinutes: 10 },
  }
}

const STORAGE_KEY = 'gate-command-center-v1'
export function loadData(): TrackerData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const defaults = createDemoData()
      const saved = JSON.parse(stored) as Partial<TrackerData>
      const days = { ...defaults.days }
      for (const [date, record] of Object.entries(saved.days ?? {})) days[date] = { ...dayRecord(defaults, date), ...record }
      return {
        ...defaults,
        ...saved,
        days,
        timer: { ...defaults.timer, ...saved.timer, mode: saved.timer?.mode ?? 'focus' },
      }
    }
  } catch (error) {
    console.error('Could not load saved command center data.', error)
  }
  return createDemoData()
}

export function saveData(data: TrackerData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Could not save command center data.', error)
    throw new Error('Your browser could not save this change. Check available storage.')
  }
}

export function dayRecord(data: TrackerData, date: string): DayRecord {
  return data.days[date] ?? {
    date, targetQuestions: 40, attempted: 0, correct: 0, targetPyqs: 20, pyqsAttempted: 0, pyqsCorrect: 0, pyqYears: '', difficultPyqs: '', revisionMinutes: 0,
    theorySubject: '', theoryTopic: '', theory: false, concepts: false, notes: false, recall: false,
    dayStatus: 'Partially Completed', learned: '', tomorrow: '', distractions: [],
  }
}

export const formatMinutes = (minutes: number) => `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`
export const newId = () => crypto.randomUUID()
