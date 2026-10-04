import { Helmet } from 'react-helmet-async'

interface Props {
    title: string
    description: string
    path?: string
    keywords?: string
    type?: 'website' | 'article'
}

const BASE_URL = 'https://gate-tracker-wzwf.vercel.app'
const OG_IMAGE = `${BASE_URL}/og-image.png`
const SITE_NAME = 'GateTracker'
const DEFAULT_KEYWORDS = 'GATE CSE tracker, GATE 2027 preparation, GATE study planner, GATE CSE study tracker free, GATE progress tracker'

export default function SEO({ title, description, path = '', keywords, type = 'website' }: Props) {
    const url = `${BASE_URL}${path}`
    const fullTitle = `${title} | ${SITE_NAME}`
    const allKeywords = keywords
        ? `${keywords}, ${DEFAULT_KEYWORDS}`
        : DEFAULT_KEYWORDS

    return (
        <Helmet>
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={allKeywords} />
            <link rel="canonical" href={url} />
            <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />

            {/* Open Graph */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:url" content={url} />
            <meta property="og:image" content={OG_IMAGE} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:image:alt" content={`${title} — GateTracker GATE CSE Study Tracker`} />
            <meta property="og:site_name" content={SITE_NAME} />
            <meta property="og:locale" content="en_IN" />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={OG_IMAGE} />

            {/* Author */}
            <meta name="author" content="Satya Sarthak Manohari" />
        </Helmet>
    )
}
