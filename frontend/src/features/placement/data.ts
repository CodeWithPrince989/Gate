export type Skill = {
  id: string
  page: string
  group: string
  name: string
  level: number
  weak: boolean
  learning: boolean
  practice: boolean
  projectUsed: boolean
  interviewReady: boolean
}

export type Problem = {
  id: string
  name: string
  platform: string
  url: string
  topic: string
  pattern: string
  difficulty: string
  company: string
  date: string
  time: number
  result: string
  hints: number
  solutionViewed: boolean
  mistake: string
  insight: string
  reattemptDate: string
  status: string
}

export type Project = {
  id: string
  name: string
  category: string
  stack: string
  github: string
  live: string
  readme: string
  architecture: string
  startDate: string
  endDate: string
  status: string
  checklist: Record<string, boolean>
  depth: Record<string, number>
}

export type Application = {
  id: string
  company: string
  role: string
  location: string
  date: string
  source: string
  url: string
  resume: string
  status: string
  oaDate: string
  interviewDate: string
  result: string
  followUp: string
  notes: string
}

export type PlacementData = {
  skills: Skill[]
  patterns: Record<string, { theory: boolean; easy: number; medium: number; hard: number; company: number; reattempt: number; independent: number }>
  designStages: Record<string, { studied: boolean; designed: boolean; explained: boolean; mock: boolean; mastered: boolean }>
  matrix: Record<string, number>
  problems: Problem[]
  platforms: string[]
  companies: string[]
  companyQuestions: Record<string, { dsa: number; cs: number; design: number; behavioral: number; previous: number; status: string }>
  projects: Project[]
  applications: Application[]
  mocks: { id: string; date: string; company: string; interviewer: string; topics: string; score: number; strengths: string; weaknesses: string; feedback: string; next: string }[]
  behaviors: Record<string, { drafted: boolean; practiced: boolean; recorded: boolean; improved: boolean; ready: boolean; notes: string }>
  aptitude: { id: string; date: string; category: string; questions: number; correct: number; minutes: number; mock: number }[]
  contests: { id: string; date: string; platform: string; rank: number; ratingChange: number; solved: number; mistakes: string; topics: string }[]
  ratings: Record<string, number>
  resumes: { id: string; name: string; ats: number; checklist: Record<string, boolean> }[]
  linkedin: Record<string, boolean>
  github: Record<string, boolean>
  githubStats: { repositories: number; pinnedProjects: number; openSourceContributions: number }
  roles: string[]
  daily: Record<string, Record<string, boolean>>
  balance: { date: string; gateHours: number; placementHours: number; dsa: number; pyqs: number; revision: number; projects: number }[]
  customCompanies: string[]
  customLanguages: string[]
  customPlatforms: string[]
  masteryAttempts: Record<string, number>
}

const topics: { page: string; group: string; names: string }[] = [
  { page: 'roadmap', group: 'Phase 1 · Foundation', names: 'C++|Python|Java|OOP|Git/GitHub|Linux|Basic SQL|Basic DSA' },
  { page: 'dsa', group: 'Core patterns', names: 'Arrays|Strings|Hashing|Two Pointers|Sliding Window|Prefix Sum|Binary Search|Sorting|Intervals|Linked List|Stack|Monotonic Stack|Queue|Deque|Heap|Greedy|Recursion|Backtracking|Trees|BST|Trie|Graphs|BFS|DFS|Topological Sort|Union Find|Shortest Path|MST|Dynamic Programming|Bit Manipulation|Divide & Conquer|Advanced data structures' },
  { page: 'cs', group: 'OOP', names: 'Classes|Objects|Encapsulation|Inheritance|Polymorphism|Abstraction|SOLID principles|Design patterns' },
  { page: 'cs', group: 'DBMS', names: 'SQL|Joins|Subqueries|Aggregation|Indexing|Transactions|ACID|Normalization|Locks|Concurrency|Query optimization' },
  { page: 'cs', group: 'Operating Systems', names: 'Processes|Threads|Scheduling|Synchronization|Deadlocks|Memory management|Virtual memory|File systems' },
  { page: 'cs', group: 'Computer Networks', names: 'OSI|TCP/IP|HTTP/HTTPS|DNS|TCP|UDP|IP|Routing|Network security basics' },
  { page: 'cs', group: 'Computer Architecture', names: 'CPU|Cache|Memory hierarchy|Pipelines|Virtual memory|I/O' },
  { page: 'programming', group: 'C++', names: 'Syntax|STL|Vector|String|Pair|Map|Set|Unordered map|Stack|Queue|Priority queue|Algorithms|Iterators|Lambda|Memory|Pointers|References' },
  { page: 'programming', group: 'Java', names: 'OOP|Collections|Exception handling|Generics|Streams|Multithreading|JVM basics' },
  { page: 'programming', group: 'Python', names: 'Core Python|OOP|NumPy|Pandas|APIs|Automation' },
  { page: 'development', group: 'Frontend', names: 'HTML|CSS|JavaScript|TypeScript|React|Next.js|Responsive design|API integration|State management' },
  { page: 'development', group: 'Backend', names: 'Node.js|Express|REST APIs|Authentication|Authorization|Databases|Caching|WebSockets|Testing' },
  { page: 'development', group: 'Databases', names: 'SQL|PostgreSQL|MySQL|MongoDB|Redis|Database design|Indexing' },
  { page: 'aiml', group: 'Mathematics', names: 'Linear algebra|Probability|Statistics|Calculus|Optimization' },
  { page: 'aiml', group: 'Machine Learning', names: 'Regression|Classification|Clustering|Decision trees|Random forests|SVM|KNN|Naive Bayes|Ensemble learning|Feature engineering|Model evaluation|Cross-validation' },
  { page: 'aiml', group: 'Deep Learning', names: 'Neural networks|Backpropagation|CNN|RNN|LSTM|Transformers|Attention' },
  { page: 'aiml', group: 'AI Engineering', names: 'LLMs|Embeddings|Vector databases|RAG|Prompt engineering|Agents|Evaluation|AI APIs' },
  { page: 'aiml', group: 'ML Engineering', names: 'Model deployment|APIs|Docker|Monitoring|Experiment tracking|CI/CD' },
  { page: 'cloud', group: 'Linux', names: 'CLI|Processes|Permissions|Networking|Shell scripting' },
  { page: 'cloud', group: 'Git/GitHub', names: 'Git basics|Branching|Merge|Rebase|Pull requests|GitHub Actions' },
  { page: 'cloud', group: 'Docker', names: 'Images|Containers|Dockerfile|Compose|Volumes|Networks' },
  { page: 'cloud', group: 'AWS', names: 'EC2|S3|IAM|VPC|RDS|Lambda|CloudWatch' },
  { page: 'cloud', group: 'Azure', names: 'Virtual Machines|Blob Storage|Entra ID|Virtual Network|Azure SQL|Functions|Monitor' },
  { page: 'cloud', group: 'GCP', names: 'Compute Engine|Cloud Storage|IAM|VPC|Cloud SQL|Cloud Functions|Cloud Monitoring' },
  { page: 'cloud', group: 'DevOps', names: 'CI/CD|Jenkins|GitHub Actions|Kubernetes|Terraform|Monitoring|Logging' },
  { page: 'system-design', group: 'LLD · Concepts', names: 'OOP|SOLID|Design patterns|UML|Class design|Interfaces|Dependency injection|Object modeling' },
  { page: 'system-design', group: 'LLD · Practice systems', names: 'Parking lot|Elevator|Library|ATM|Splitwise|Chess|Logger|Food delivery' },
  { page: 'system-design', group: 'HLD · Concepts', names: 'Scalability|Load balancing|Caching|Databases|Replication|Sharding|CAP theorem|Message queues|CDN|Rate limiting|Microservices|Event-driven architecture|Distributed systems' },
  { page: 'system-design', group: 'HLD · Practice systems', names: 'URL shortener|Instagram|YouTube|WhatsApp|Netflix|Uber|Twitter/X|Food delivery system|Notification system' },
  { page: 'aptitude', group: 'Quantitative Aptitude', names: 'Percentages|Ratio|Average|Profit/loss|Time/work|Time/speed/distance|Probability|Permutation/combination|Number system|Algebra|Geometry' },
  { page: 'aptitude', group: 'Logical Reasoning', names: 'Series|Puzzles|Coding-decoding|Blood relations|Directions|Arrangements|Data interpretation' },
  { page: 'aptitude', group: 'Verbal', names: 'Reading comprehension|Grammar|Vocabulary|Sentence correction' },
  { page: 'github', group: 'Git & GitHub', names: 'Git basics|Branching|Merge|Rebase|Pull requests|GitHub Actions' },
  { page: 'interview', group: 'Technical Interview', names: 'DSA|OOP|DBMS|OS|CN|SQL|System Design|Projects' },
  { page: 'interview', group: 'Coding Interview', names: 'Easy problems|Medium problems|Hard problems|Timed problems|Company problems' },
]

const patternNames = 'Arrays|Strings|Hashing|Two Pointers|Sliding Window|Prefix Sum|Binary Search|Sorting|Intervals|Linked List|Stack|Monotonic Stack|Queue|Deque|Heap|Greedy|Recursion|Backtracking|Trees|BST|Trie|Graphs|BFS|DFS|Topological Sort|Union Find|Shortest Path|MST|Dynamic Programming|Bit Manipulation|Divide & Conquer'
export const levels = ['Not started', 'Beginner', 'Intermediate', 'Advanced', 'Interview ready']
export const companiesDefault = ['Google', 'Microsoft', 'Amazon', 'Meta', 'Apple', 'NVIDIA', 'Adobe', 'Atlassian', 'Uber', 'Salesforce', 'Goldman Sachs', 'JPMorgan', 'Walmart', 'Flipkart', 'TCS', 'Infosys', 'Accenture', 'Deloitte']
export const rolesAvailable = ['SDE', 'Software Engineer', 'Backend Developer', 'Full Stack Developer', 'AI/ML Engineer', 'Data Analyst', 'Data Scientist', 'Cloud Engineer', 'DevOps Engineer']
export const pages = [
  { path: '/placement', id: 'dashboard', label: 'Placement Dashboard', group: 'Placement' },
  { path: '/placement/dsa', id: 'dsa', label: 'DSA', group: 'Core skills' },
  { path: '/placement/cs', id: 'cs', label: 'CS Fundamentals', group: 'Core skills' },
  { path: '/placement/programming', id: 'programming', label: 'Programming Languages', group: 'Core skills' },
  { path: '/placement/development', id: 'development', label: 'Development', group: 'Build' },
  { path: '/placement/aiml', id: 'aiml', label: 'AI/ML', group: 'Build' },
  { path: '/placement/cloud', id: 'cloud', label: 'Cloud & DevOps', group: 'Build' },
  { path: '/placement/projects', id: 'projects', label: 'Projects', group: 'Build' },
  { path: '/placement/system-design', id: 'system-design', label: 'System Design', group: 'Interviews' },
  { path: '/placement/aptitude', id: 'aptitude', label: 'Aptitude', group: 'Interviews' },
  { path: '/placement/competitive', id: 'competitive', label: 'Competitive Programming', group: 'Interviews' },
  { path: '/placement/github', id: 'github', label: 'Git & GitHub', group: 'Profile' },
  { path: '/placement/resume', id: 'resume', label: 'Resume', group: 'Profile' },
  { path: '/placement/linkedin', id: 'linkedin', label: 'LinkedIn', group: 'Profile' },
  { path: '/placement/interview', id: 'interview', label: 'Interview Preparation', group: 'Interviews' },
  { path: '/placement/behavioral', id: 'behavioral', label: 'Behavioral Interview', group: 'Interviews' },
  { path: '/placement/companies', id: 'companies', label: 'Company Preparation', group: 'Apply' },
  { path: '/placement/applications', id: 'applications', label: 'Applications', group: 'Apply' },
  { path: '/placement/roadmap', id: 'roadmap', label: 'Placement Roadmap', group: 'Placement' },
  { path: '/placement/analytics', id: 'analytics', label: 'Placement Analytics', group: 'Placement' },
]
export const statusOptions = ['Interested', 'Preparing', 'Applied', 'Online Assessment', 'Technical Interview', 'HR/Behavioral', 'Offer', 'Rejected', 'Withdrawn']
export const projectChecklist = ['Real problem solved', 'Clean GitHub repository', 'Good README', 'Architecture documented', 'Deployed', 'Screenshots/demo', 'Testing', 'Error handling', 'Security basics', 'Performance considered', 'Can explain every technology', 'Can explain design decisions', 'Added to resume']
export const projectDepth = ['Problem clarity', 'Technical complexity', 'Code quality', 'Architecture', 'Deployment', 'Scalability', 'Testing', 'Documentation', 'Interview readiness']
export const resumeChecklist = ['One-page resume', 'Strong project bullets', 'Truthful quantified achievements', 'No unnecessary information', 'Correct formatting', 'Updated skills', 'GitHub links', 'Portfolio link', 'Final proofreading']
export const linkedinChecklist = ['Professional profile photo', 'Strong headline', 'About section', 'Education', 'Skills', 'Projects', 'Internship', 'Certifications', 'GitHub', 'Portfolio', 'Relevant connections', 'Technical posts/projects']
export const githubChecklist = ['Profile completeness', 'Repositories', 'README quality', 'Contribution activity', 'Project documentation', 'Issues', 'Pull requests', 'Open-source contributions']
export const behavioralTopics = ['Tell me about yourself', 'Leadership', 'Conflict', 'Failure', 'Challenge', 'Teamwork', 'Time management', 'Difficult decision', 'Project failure', 'Biggest achievement', 'Why this company?', 'Why should we hire you?', 'Strengths', 'Weaknesses']
export const dailyTasks = ['DSA · 2 problems', 'CS · revise a concept', 'Development · practice', 'Project · focused build time', 'Aptitude · 20 questions', 'Interview · practice one answer']
export const matrixSkills = ['C++', 'DSA', 'OOP', 'DBMS', 'OS', 'CN', 'SQL', 'Git/GitHub', 'Development', 'AI/ML', 'Cloud', 'DevOps', 'System Design', 'Projects', 'Aptitude', 'Communication', 'Interview']
const id = () => crypto.randomUUID()

export function createPlacementData(): PlacementData {
  const skills = topics.flatMap(group => group.names.split('|').map(name => ({
    id: `${group.page}-${group.group}-${name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    page: group.page, group: group.group, name, level: 0, weak: false, learning: false, practice: false, projectUsed: false, interviewReady: false,
  })))
  return {
    skills,
    patterns: Object.fromEntries(patternNames.split('|').map(name => [name, { theory: false, easy: 0, medium: 0, hard: 0, company: 0, reattempt: 0, independent: 0 }])),
    designStages: Object.fromEntries(skills.filter(skill => skill.page === 'system-design').map(skill => [skill.id, { studied: false, designed: false, explained: false, mock: false, mastered: false }])),
    matrix: Object.fromEntries(matrixSkills.map(name => [name, 0])),
    problems: [], platforms: ['LeetCode', 'Codeforces', 'CodeChef', 'GeeksforGeeks', 'HackerRank', 'InterviewBit', 'AtCoder'],
    companies: companiesDefault, companyQuestions: Object.fromEntries(companiesDefault.map(name => [name, { dsa: 0, cs: 0, design: 0, behavioral: 0, previous: 0, status: 'Not started' }])),
    projects: [], applications: [], mocks: [], behaviors: Object.fromEntries(behavioralTopics.map(name => [name, { drafted: false, practiced: false, recorded: false, improved: false, ready: false, notes: '' }])),
    aptitude: [], contests: [], ratings: { Codeforces: 0, CodeChef: 0, AtCoder: 0 },
    resumes: ['SDE Resume', 'AI/ML Resume', 'Cloud/DevOps Resume', 'General Resume'].map(name => ({ id: id(), name, ats: 0, checklist: Object.fromEntries(resumeChecklist.map(item => [item, false])) })),
    linkedin: Object.fromEntries(linkedinChecklist.map(item => [item, false])), github: Object.fromEntries(githubChecklist.map(item => [item, false])),
    githubStats: { repositories: 0, pinnedProjects: 0, openSourceContributions: 0 },
    roles: ['SDE'], daily: {}, balance: [], customCompanies: [], customLanguages: [], customPlatforms: [], masteryAttempts: {},
  }
}

export function loadPlacementData(): PlacementData {
  const raw = localStorage.getItem(storageKey())
  if (!raw) return createPlacementData()
  const saved = JSON.parse(raw) as Partial<PlacementData>
  if (!saved || !Array.isArray(saved.skills) || !Array.isArray(saved.problems)) throw new Error('Saved placement data is invalid. Export or clear the placement workspace before continuing.')
  return { ...createPlacementData(), ...saved }
}

export function savePlacementData(data: PlacementData) {
  localStorage.setItem(storageKey(), JSON.stringify(data))
}

function storageKey() {
  const savedUser = localStorage.getItem('gate-user')
  if (!savedUser) return 'gate-placement-v1-anonymous'
  const user = JSON.parse(savedUser) as { id?: number }
  if (!Number.isInteger(user.id)) throw new Error('Unable to identify the signed-in user for placement data.')
  return `gate-placement-v1-${user.id}`
}

export const placementId = id
export const topicGroups = topics
