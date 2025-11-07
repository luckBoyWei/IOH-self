import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen,
  Copy,
  History,
  Link as LinkIcon,
  Loader2,
  Plus,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Trash2,
} from 'lucide-react'

// shadcn/ui
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

/**
 * IOH · Ops System Portal — Chat‑style MVP (Stage‑2)
 * DeepSeek‑like UX:
 *  - Left: conversations (new chat, history)
 *  - Middle: chat messages with context memory
 *  - Right: evidence panel for current turn (Top‑k)
 * Keeps minimal acceptance:
 *  Query → Evidence + Suggested Answer → One‑click Feedback · Defaults baked in
 */

const gradient = 'from-yellow-100 via-amber-100 to-red-100'

// ------- Mock Data -------
const MOCK_RESULTS = [
  {
    id: 'KB-OPS-1012',
    title: 'DNS SERVFAIL spike after config change',
    snippet: 'Root cause linked to resolver upstream timeout…',
    cites: ['SOP-DNS-001', 'ALM-2025-10-1221'],
    ts: '2025‑10‑20',
    score: 0.92,
  },
  {
    id: 'SOP-DNS-001',
    title: 'SOP—DNS latency troubleshooting',
    snippet: 'Collect dig + trace logs, compare with baseline…',
    cites: ['KB-OPS-1012'],
    ts: '2025‑09‑11',
    score: 0.89,
  },
  {
    id: 'ALM-2025-10-1221',
    title: 'Alarm record: Resolver upstream timeout',
    snippet: 'Spike between 10:42–11:05 at Jakarta POP…',
    cites: ['MON-JKT-POP'],
    ts: '2025‑10‑20',
    score: 0.84,
  },
]

const MOCK_ANSWER = (query: string) => ({
  text:
    `Likely root cause: resolver upstream timeout after threshold change.

Actions:
1) Revert threshold to previous value (60ms).
2) Flush cache on edge resolvers.
3) Validate with sample domains: ioh.co.id, meranti.id.
4) Monitor P95 < 200ms for 30 min.

Query: ${query}`,
  citeIds: ['SOP-DNS-001', 'KB-OPS-1012'],
  latency: 1.9, // seconds (P95)
  confidence: 0.81,
})

// ------- Types -------
type Msg = { id: string; role: 'user' | 'assistant'; content: string; cites?: string[] }
type Chat = { id: string; title: string; messages: Msg[]; createdAt: string }

// util
const uid = () => Math.random().toString(36).slice(2, 10)

function Header() {
  return (
    <div className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-xl bg-gradient-to-r from-yellow-300 to-red-500" />
          <div>
            <div className="text-sm text-zinc-500">IOH · Meranti Cloud</div>
            <div className="font-semibold">Ops System Portal · Chat</div>
          </div>
          <Badge className="ml-2">P95 ≤ 3s</Badge>
          <Badge variant="outline" className="ml-2">Context on</Badge>
        </div>
        <div className="text-sm text-zinc-500">v0.2</div>
      </div>
    </div>
  )
}

function Sidebar({ chats, activeId, onNew, onSelect, onDelete }: {
  chats: Chat[];
  activeId?: string;
  onNew: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <aside className="flex w-[280px] flex-col border-r bg-white/90">
      <div className="border-b p-3">
        <Button className="w-full" onClick={onNew}>
          <Plus className="mr-2 size-4"/> New Chat
        </Button>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-wide text-zinc-500">
        <History className="size-3"/> History
      </div>
      <div className="flex-1 space-y-2 overflow-auto p-2">
        {chats.map(c => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`group w-full rounded-xl border p-2 text-left hover:bg-zinc-50 ${activeId === c.id ? 'border-amber-300 bg-amber-50' : ''}`}
          >
            <div className="line-clamp-1 text-sm font-medium">{c.title || 'Untitled'}</div>
            <div className="text-[12px] text-zinc-500">{c.createdAt}</div>
            <div className="mt-1 flex gap-2 opacity-0 transition group-hover:opacity-100">
              <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onDelete(c.id) }}>
                <Trash2 className="mr-1 size-3"/>Delete
              </Button>
            </div>
          </button>
        ))}
      </div>
      <div className="border-t p-3 text-[12px] text-zinc-500">Defaults: top_k=4 • threshold=0.35 • rerank=on</div>
    </aside>
  )
}

function MessageBubble({ m }: { m: Msg }) {
  const isUser = m.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] rounded-2xl border p-3 text-sm leading-6 shadow-sm ${isUser ? 'border-amber-200 bg-amber-50' : 'bg-white'}`}>
        <div className="whitespace-pre-wrap">{m.content}</div>
        {!isUser && m.cites && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-zinc-500">Citations:</span>
            {m.cites.map(c => (
              <Badge key={c} variant="secondary">{c}</Badge>
            ))}
            <div className="ml-auto flex gap-2">
              <Button size="sm" variant="outline"><Copy className="mr-1 size-4"/>Copy</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Composer({ onSend, busy, useContext, setUseContext }: {
  onSend: (q: string) => void;
  busy: boolean;
  useContext: boolean;
  setUseContext: (v: boolean) => void;
}) {
  const [q, setQ] = useState('DNS SERVFAIL spike at Jakarta POP after config change')
  return (
    <div className="sticky bottom-0 border-t bg-white p-3">
      <div className="mb-2 flex items-center gap-2">
        <Switch id="ctx" checked={useContext} onCheckedChange={setUseContext}/>
        <Label htmlFor="ctx" className="text-sm text-zinc-600">Use conversation context</Label>
      </div>
      <div className="flex gap-2">
        <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Describe your issue…"/>
        <Button onClick={() => onSend(q)} disabled={busy}>
          {busy ? <Loader2 className="mr-2 size-4 animate-spin"/> : <Sparkles className="mr-1 size-4"/>}
          Ask
        </Button>
      </div>
      <div className="mt-1 text-[12px] text-zinc-500">Shift+Enter to newline · Enter to send</div>
    </div>
  )
}

function EvidencePanel({ results }: { results: typeof MOCK_RESULTS }) {
  return (
    <aside className="h-full w-[340px] overflow-auto border-l bg-white/80">
      <div className="border-b p-3">
        <div className="flex items-center gap-2 text-sm font-semibold"><BookOpen className="size-4"/> Evidence (Top‑k)</div>
        <div className="text-[12px] text-zinc-500">Most relevant docs/snippets</div>
      </div>
      <div className="space-y-3 p-3">
        {results.map(r => (
          <div key={r.id} className="rounded-2xl border p-3 hover:bg-zinc-50">
            <div className="flex items-center justify-between">
              <div className="font-medium">{r.title}</div>
              <Badge variant="outline">Score {Math.round(r.score * 100)}</Badge>
            </div>
            <div className="mt-1 line-clamp-2 text-sm text-zinc-600">{r.snippet}</div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
              <LinkIcon className="size-3" /> {r.cites.join(' · ')} <span className="ml-2">{r.ts}</span>
              <Button size="sm" variant="outline" className="ml-auto">Open</Button>
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}

export default function IOHOpsPortalChatMVP() {
  const [useContext, setUseContext] = useState(true)
  const [busy, setBusy] = useState(false)
  const [chats, setChats] = useState<Chat[]>([{
    id: uid(),
    title: 'DNS SERVFAIL spike at Jakarta POP',
    createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    messages: [
      { id: uid(), role: 'assistant', content: 'Hi! Describe your ops issue, I will search knowledge and propose an RCA.' },
    ],
  }])
  const [activeId, setActiveId] = useState<string>(chats[0].id)

  const active = useMemo(() => chats.find(c => c.id === activeId)!, [chats, activeId])

  function newChat() {
    const c: Chat = { id: uid(), title: 'New conversation', createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '), messages: [{ id: uid(), role: 'assistant', content: 'New chat started. Tell me your ops issue.' }] }
    setChats([c, ...chats])
    setActiveId(c.id)
  }

  function selectChat(id: string) { setActiveId(id) }

  function deleteChat(id: string) {
    const idx = chats.findIndex(c => c.id === id)
    if (idx >= 0) {
      const next = chats.filter(c => c.id !== id)
      setChats(next)
      if (activeId === id && next.length) setActiveId(next[0].id)
    }
  }

  async function onSend(q: string) {
    setBusy(true)
    // append user msg
    setChats(prev => prev.map(c => c.id === activeId ? ({ ...c, title: c.title === 'New conversation' ? q.slice(0, 40) : c.title, messages: [...c.messages, { id: uid(), role: 'user', content: q }] }) : c))

    // simulate retrieval + generation
    await new Promise(r => setTimeout(r, 600))
    const ans = MOCK_ANSWER(q)

    setChats(prev => prev.map(c => c.id === activeId ? ({
      ...c, messages: [...c.messages, {
        id: uid(), role: 'assistant', content: `Confidence ${Math.round(ans.confidence * 100)}% · P95 ${ans.latency}s

${ans.text}`, cites: ans.citeIds,
      }],
    }) : c))
    setBusy(false)
  }

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <Header />
      <div className="grid flex-1 grid-cols-[280px_minmax(0,1fr)_340px]">
        <Sidebar chats={chats} activeId={activeId} onNew={newChat} onSelect={selectChat} onDelete={deleteChat} />

        {/* Chat Column */}
        <main className="mx-auto flex w-full max-w-3xl flex-col">
          <motion.div layout className={`m-4 rounded-3xl bg-gradient-to-r p-4 ${gradient} border border-amber-200`}>
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-gradient-to-r from-yellow-400 to-red-500" />
              <div>
                <div className="text-sm text-zinc-600">IOH · Meranti Cloud AI</div>
                <div className="text-lg font-semibold">Ops System Portal</div>
              </div>
            </div>
          </motion.div>

          <div className="flex-1 space-y-3 overflow-auto px-4 pb-24">
            {active.messages.map(m => <MessageBubble key={m.id} m={m} />)}
            {/* Feedback bar only for last assistant message */}
            {active.messages.filter(m => m.role === 'assistant').slice(-1).map(m => (
              <div key={m.id} className="flex items-center gap-2 px-2 text-sm">
                <span className="text-zinc-600">Was this helpful?</span>
                <Button variant="outline" size="sm"><ThumbsUp className="mr-1 size-4"/>Yes</Button>
                <Button variant="outline" size="sm"><ThumbsDown className="mr-1 size-4"/>No</Button>
              </div>
            ))}
          </div>

          <Composer onSend={onSend} busy={busy} useContext={useContext} setUseContext={setUseContext}/>
          <div className="px-4 pb-3 text-[12px] text-zinc-500">MVP Targets: Accuracy ≥90% · P95 ≤3s · Fail ≤1% · One‑click feedback</div>
        </main>

        {/* Evidence Right Column */}
        <EvidencePanel results={MOCK_RESULTS} />
      </div>
    </div>
  )
}
