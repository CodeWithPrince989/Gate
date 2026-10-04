export interface FeaturedArticle {
    title: string
    category: string
    publishedOn: string
    href: string
    source: string
    summary: string
}

export interface DailyGateNewsItem {
    title: string
    source: string
    publishedOn: string
    href: string
    note: string
}

export const featuredArticles: FeaturedArticle[] = [
    {
        title: 'Question Paper Pattern for GATE Exam',
        category: 'Exam Strategy',
        publishedOn: 'February 9, 2025',
        href: 'https://gateing.com/question-paper-pattern-for-gate-exam/',
        source: 'Gateing',
        summary: 'A practical overview of the GATE paper structure, including question types, marking rules, and the usual section-wise split for planning your preparation.',
    },
    {
        title: 'Top 10 Mistakes to Avoid While Preparing for GATE Aerospace',
        category: 'Preparation',
        publishedOn: 'February 6, 2025',
        href: 'https://gateing.com/top-10-mistakes-to-avoid-while-preparing-for-gate-aerospace/',
        source: 'Gateing',
        summary: 'Highlights common prep mistakes such as weak revision, poor time planning, and ignoring aptitude or math, with corrective steps students can apply quickly.',
    },
    {
        title: 'How to Prepare for GATE Aerospace Engineering: A Step-by-Step Guide',
        category: 'Study Plan',
        publishedOn: 'February 6, 2025',
        href: 'https://gateing.com/how-to-prepare-for-gate-aerospace-engineering-a-step-by-step-guide/',
        source: 'Gateing',
        summary: 'Breaks preparation into concept building, problem practice, and mock-test phases, while also pointing to standard books and revision habits.',
    },
    {
        title: 'Can You Crack GATE Aerospace Without Coaching? A Strategic Guide',
        category: 'Self Study',
        publishedOn: 'February 6, 2025',
        href: 'https://gateing.com/can-you-crack-gate-aerospace-without-coaching-a-strategic-guide/',
        source: 'Gateing',
        summary: 'Compares disciplined self-study with structured coaching and outlines the tradeoffs in planning, materials, doubt support, and mock-test practice.',
    },
    {
        title: 'GATE Aerospace : Past Year Papers & Answer Key',
        category: 'Practice',
        publishedOn: 'February 6, 2025',
        href: 'https://gateing.com/gate-aerospace-past-year-papers-answer-key/',
        source: 'Gateing',
        summary: 'Useful as a jumping-off point for previous-year paper practice and answer-key review during the problem-solving and revision stages.',
    },
]

export const dailyGateNews: DailyGateNewsItem[] = [
    {
        title: 'GATE 2026 registration with late fee ends today at gate2026.iitg.ac.in, link here',
        source: 'Hindustan Times',
        publishedOn: 'October 13, 2025',
        href: 'https://gateing.com/',
        note: 'Listed in Gateing’s public GATE news roundup.',
    },
    {
        title: 'GATE 2026 application deadline today with late fee; here’s how to register',
        source: 'Scroll.in',
        publishedOn: 'October 13, 2025',
        href: 'https://gateing.com/',
        note: 'Listed in Gateing’s public GATE news roundup.',
    },
    {
        title: 'GATE 2026: Last date to register with late fee tomorrow, check details here',
        source: 'Scroll.in',
        publishedOn: 'October 8, 2025',
        href: 'https://gateing.com/',
        note: 'Listed in Gateing’s public GATE news roundup.',
    },
    {
        title: 'Cracking GATE, Breaking Barriers: Ashritha’s Journey to IISc and NVIDIA',
        source: 'Times Now',
        publishedOn: 'September 21, 2025',
        href: 'https://gateing.com/',
        note: 'Listed in Gateing’s public GATE news roundup.',
    },
    {
        title: 'Climate change, GATE prep now part of engg curriculum',
        source: 'Times of India',
        publishedOn: 'August 26, 2025',
        href: 'https://gateing.com/',
        note: 'Listed in Gateing’s public GATE news roundup.',
    },
    {
        title: 'GATE 2026 registration date postponed; Know when and how to apply at gate2026.iitg.ac.in',
        source: 'Financial Express',
        publishedOn: 'August 25, 2025',
        href: 'https://gateing.com/',
        note: 'Listed in Gateing’s public GATE news roundup.',
    },
]
