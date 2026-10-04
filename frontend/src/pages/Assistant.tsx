import { useState } from 'react'
import type { FormEvent } from 'react'
import { MessageSquare, Send, Loader2 } from 'lucide-react'
import SEO from '../components/SEO'
import { chatWithAssistant } from '../api/api'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTED_PROMPTS = [
  'Make a 4-hour study plan for today for weak OS + DBMS.',
  'How should I improve Theory of Computation in 2 weeks?',
  'I broke my streak. Give me a restart plan for the next 3 days.',
]

export default function Assistant() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Share your current issue (plan, weak subject, consistency, or concept). I will give a concise action plan with PYQ focus.',
    },
  ])

  const send = async (message: string) => {
    const trimmed = message.trim()
    if (!trimmed || loading) return

    const next: ChatMessage = { role: 'user', content: trimmed }
    setMessages(prev => [...prev, next])
    setInput('')
    setLoading(true)

    try {
      const data = await chatWithAssistant(trimmed)
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Unable to fetch response now. Retry in a few seconds. Meanwhile, solve 10 PYQs and revise one weak topic.'
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: message,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await send(input)
  }

  return (
    <div className="space-y-6">
      <SEO
        title="Vistra AI — GATE CSE Study Assistant"
        description="Vistra AI helps GATE CSE aspirants with daily study plans, weak-subject strategies, consistency advice, and PYQ-focused preparation guidance."
        path="/assistant"
        keywords="GATE AI assistant, GATE study help, GATE preparation AI, GATE study planner AI"
      />

      <div>
        <h1 className="page-header-title flex items-center gap-3">
          <MessageSquare size={28} className="text-emerald-400" />
          Vistra AI Assistant
        </h1>
        <p className="page-header-sub">
          Practical GATE CSE guidance focused on consistency, revision and PYQs
        </p>
      </div>

      <div className="glass-panel p-4 md:p-5 space-y-4">
        <p className="section-label">Quick Prompts</p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_PROMPTS.map(prompt => (
            <button
              key={prompt}
              type="button"
              onClick={() => void send(prompt)}
              disabled={loading}
              className="px-3 py-2 text-[12px] rounded-lg border border-white/[.08] bg-white/[.02] hover:bg-white/[.05] transition-colors disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-panel h-[60vh] min-h-[420px] flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-3">
          {messages.map((m, idx) => (
            <div
              key={`${m.role}-${idx}`}
              className={`max-w-[92%] whitespace-pre-wrap text-[13px] leading-relaxed px-3 py-2.5 rounded-xl border ${
                m.role === 'user'
                  ? 'ml-auto bg-emerald-500/12 border-emerald-500/30'
                  : 'bg-white/[.02] border-white/[.08]'
              }`}
            >
              {m.content}
            </div>
          ))}

          {loading && (
            <div className="inline-flex items-center gap-2 text-[12px] opacity-60">
              <Loader2 size={14} className="animate-spin" />
              Vistra is preparing your plan...
            </div>
          )}
        </div>

        <form onSubmit={onSubmit} className="border-t border-white/[.08] p-3 md:p-4 flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask for today's plan, weak subject strategy, or quick concept help"
            className="flex-1 h-11 rounded-lg px-3 text-[13px] bg-white/[.03] border border-white/[.08] outline-none focus:border-emerald-500/50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="h-11 px-4 rounded-lg bg-emerald-500 text-white text-[13px] font-medium hover:bg-emerald-400 disabled:opacity-60 inline-flex items-center gap-1.5"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
