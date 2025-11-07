import React, { useEffect, useRef, useState } from 'react'
import { ArrowUp, Brain, Clock, Loader2, Plus, Sparkles } from 'lucide-react'

// shadcn/ui
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

/**
 * Q&A Frontend — DeepSeek-style Minimal MVP (with Conversations)
 * --------------------------------------------------------------
 * New in this revision:
 *  - Left sidebar for Conversations (history list)
 *  - "New chat" button to start a clean dialog
 *  - Per-conversation message threads; lightweight localStorage persistence
 *
 * Replace mockAsk/mockFeedback with real endpoints when integrating.
 */

/* ----------------------- Mock & Constants ----------------------- */
const DOMAINS = [
  { id: 'care', name: 'Customer Care' },
  { id: 'mkt', name: 'Marketing' },
  { id: 'train', name: 'Training' },
  { id: 'net', name: 'Network Tech' },
]

const DEFAULT_QUESTION = 'DNS SERVFAIL in Jakarta: cause and quick fix?'
const SUGGESTED = [
  'How to activate eSIM prepaid in MyIOH?',
  'Resolve high DNS latency in 3 steps',
  'Rollback resolver threshold SOP',
]

function wait(ms: number) { return new Promise(r => setTimeout(r, ms)) }

async function mockAsk(payload: { query: string; kb: string; }): Promise<any> {
  await wait(500)
  return {
    trace_id: 'trace-qa-001',
    answer: 'The DNS SERVFAIL in Jakarta was triggered by an upstream resolver threshold update.\n\n**Action Plan**\n1) Roll back threshold to 60ms.\n2) Flush cache on edge resolvers.\n3) Watch P95 latency <200ms for 30 minutes.',
    cites: [
      { id: 'SOP-DNS-001', title: 'SOP—DNS latency troubleshooting', page: 2, score: 0.91 },
      { id: 'KB-OPS-1012', title: 'Case—SERVFAIL spike after config change', page: 1, score: 0.88 },
    ],
    conf: 0.86,
    latency_ms: 2300,
  }
}

/* ---------------------------- Types ---------------------------- */
export type ChatMsg = { role: 'user' | 'assistant'; content: string; cites?: any[]; conf?: number; latency_ms?: number; trace_id?: string }
export type Conversation = { id: string; title: string; domain: string; created_at: number; msgs: ChatMsg[] }

/* ------------------------- Utilities -------------------------- */
const LS_KEY = 'qa_conversations_v1'
function loadConvs(): Conversation[] {
  try { const raw = localStorage.getItem(LS_KEY); return raw ? JSON.parse(raw) : [] }
  catch { return [] }
}
function saveConvs(items: Conversation[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(items)) }
  catch {}
}
function id() { return Math.random().toString(36).slice(2, 9) }
function timeLabel(ts: number) { const d = new Date(ts); return d.toLocaleString() }

/* ---------------------------- UI Bits ---------------------------- */
function HeaderBar() {
  return (
    <div className="sticky top-0 z-40 border-b bg-white/75 backdrop-blur">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-xl bg-gradient-to-r from-yellow-300 to-red-500"/>
          <div>
            <div className="text-xs text-zinc-500">IOH · Meranti Cloud</div>
            <div className="font-semibold">Q&A Portal</div>
          </div>
          <Badge variant="secondary" className="ml-2">Acc ≥92%</Badge>
          <Badge variant="secondary">P95 ≤2.5s</Badge>
        </div>
        <div className="text-xs text-zinc-500">Prototype • Stage 2</div>
      </div>
    </div>
  )
}

function SuggestedRow({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {[DEFAULT_QUESTION, ...SUGGESTED].map(q => (
        <button key={q} onClick={() => onPick(q)} className="rounded-lg border px-2.5 py-1 text-xs hover:bg-zinc-50" title="Use this">
          {q}
        </button>
      ))}
    </div>
  )
}

function ChatMessage({ m }: { m: ChatMsg }) {
  const isUser = m.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] rounded-2xl border p-3 text-sm leading-6 shadow-sm ${isUser ? 'bg-white' : 'bg-zinc-50'}`}>
        {!isUser && (
          <div className="mb-1 flex items-center gap-1 text-[11px] text-zinc-500"><Brain className="size-3"/> Assistant</div>
        )}
        <div className="whitespace-pre-wrap">{m.content}</div>
        {!isUser && (
          <div className="mt-2 flex items-center gap-2 text-[11px] text-zinc-500">
            {typeof m.conf === 'number' && <span>Conf {Math.round(m.conf * 100)}%</span>}
            {typeof m.latency_ms === 'number' && <span>· Latency {(m.latency_ms / 1000).toFixed(2)}s</span>}
            {m.trace_id && <span>· {m.trace_id}</span>}
          </div>
        )}
      </div>
    </div>
  )
}

function SourceList({ items }: { items: Array<{ id: string; title: string; page?: number; score?: number }> }) {
  if (!items?.length) return null
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Sparkles className="size-4"/>Retrieved Sources</CardTitle>
        <CardDescription>Ranked hybrid retrieval</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map(it => (
          <div key={it.id} className="rounded-xl border p-3 hover:bg-zinc-50">
            <div className="flex items-center justify-between">
              <div className="font-medium">{it.title}</div>
              {typeof it.score === 'number' && <Badge variant="secondary">Score {Math.round(it.score * 100)}</Badge>}
            </div>
            <div className="text-[12px] text-zinc-500">{it.id}{typeof it.page === 'number' ? ` · p.${it.page}` : ''}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function InputBar({ onSend, sending, domain, setDomain }: { onSend: (q: string) => void; sending: boolean; domain: string; setDomain: (v: string) => void }) {
  const [val, setVal] = useState('')
  const disabled = sending || !val.trim()
  const handleSend = () => onSend(val.trim())
  return (
    <div className="rounded-2xl border bg-white/80 p-3">
      <div className="grid items-start gap-2 md:grid-cols-[1fr,200px]">
        <Textarea value={val} onChange={e => setVal(e.target.value)} placeholder="Ask anything…" className="h-24" />
        <div className="grid gap-2">
          <div className="grid grid-cols-3 items-center gap-2">
            <Label>Domain</Label>
            <Select value={domain} onValueChange={setDomain}>
              <SelectTrigger className="col-span-2"><SelectValue placeholder="Select domain"/></SelectTrigger>
              <SelectContent>
                {DOMAINS.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSend} disabled={disabled}>
            {sending ? <Loader2 className="mr-2 size-4 animate-spin"/> : <ArrowUp className="mr-2 size-4"/>}
            {sending ? 'Thinking…' : 'Ask'}
          </Button>
          <Button variant="outline" onClick={() => setVal(DEFAULT_QUESTION)}>Use default</Button>
        </div>
      </div>
      <div className="mt-2 text-[12px] text-zinc-500">Tips: keep it short; add keywords for faster, precise answers.</div>
    </div>
  )
}

/* ------------------------------ Page ------------------------------ */
export default function QAMinimalDeepSeek() {
  const [domain, setDomain] = useState('net')
  const [sending, setSending] = useState(false)
  const [sources, setSources] = useState<any[]>([])

  // Conversations state
  const [convs, setConvs] = useState<Conversation[]>(() => {
    const loaded = loadConvs()
    if (loaded.length) return loaded
    return [{ id: id(), title: 'New chat', domain: 'net', created_at: Date.now(), msgs: [] }]
  })
  const [activeId, setActiveId] = useState<string>(convs[0].id)

  useEffect(() => { saveConvs(convs) }, [convs])

  const active = convs.find(c => c.id === activeId)!
  const msgs = active.msgs
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => { scrollRef.current?.scrollTo({ top: 999999, behavior: 'smooth' }) }, [msgs])

  function renameIfNeeded(firstUserMsg?: string) {
    if (!firstUserMsg) return
    if (active.title === 'New chat')
      setConvs(items => items.map(c => c.id === activeId ? { ...c, title: firstUserMsg.slice(0, 40) } : c))
  }

  async function send(q: string) {
    // push user
    setConvs(items => items.map(c => c.id === activeId ? { ...c, domain, msgs: [...c.msgs, { role: 'user', content: q }] } : c))
    renameIfNeeded(q)
    setSending(true)
    try{
      // const res = await fetch('/api/ask', { method: 'POST', body: JSON.stringify({ query: q, kb: domain }) });
      // const data = await res.json();
      const data = await mockAsk({ query: q, kb: domain })
      setConvs(items => items.map(c => c.id === activeId ? { ...c, msgs: [...c.msgs, { role: 'assistant', content: data.answer, conf: data.conf, latency_ms: data.latency_ms, trace_id: data.trace_id }] } : c))
      setSources(data.cites || [])
    }
    finally {
      setSending(false)
    }
  }

  function newChat() {
    const c: Conversation = { id: id(), title: 'New chat', domain: 'net', created_at: Date.now(), msgs: [] }
    setConvs(items => [c, ...items])
    setActiveId(c.id)
    setSources([])
  }

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <HeaderBar />

      <main className="grid flex-1 grid-cols-[260px,1fr] gap-0">
        {/* Sidebar */}
        <aside className="flex flex-col gap-3 border-r bg-zinc-50/60 p-3">
          <Button onClick={newChat} className="w-full"> <Plus className="mr-2 size-4"/> New chat</Button>
          <div className="px-1 text-[11px] text-zinc-500">Conversations</div>
          <div className="space-y-1 overflow-auto pr-1">
            {convs.map(c => (
              <button key={c.id} onClick={() => { setActiveId(c.id); setSources([]) }}
                className={`w-full rounded-xl border px-3 py-2 text-left hover:bg-white ${c.id === activeId ? 'border-zinc-300 bg-white' : 'border-transparent'}`}>
                <div className="line-clamp-1 text-sm">{c.title}</div>
                <div className="text-[11px] text-zinc-500">{timeLabel(c.created_at)}</div>
              </button>
            ))}
          </div>
        </aside>

        {/* Main column */}
        <section className="mx-auto grid w-full max-w-7xl gap-4 p-4 lg:grid-cols-3 lg:p-6">
          {/* Conversation */}
          <div className="flex flex-col gap-4 lg:col-span-2">
            {/* hero */}
            <div className="rounded-3xl border border-amber-200 bg-gradient-to-r from-yellow-100 via-amber-100 to-red-100 p-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-gradient-to-r from-yellow-400 to-red-500"/>
                <div>
                  <div className="text-sm text-zinc-600">Private Knowledge Assistant</div>
                  <div className="text-lg font-semibold">Ask · Retrieve · Answer</div>
                </div>
              </div>
            </div>

            {/* suggested */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Suggested</CardTitle>
                <CardDescription>Click to paste a ready-to-run question</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {[DEFAULT_QUESTION, ...SUGGESTED].map(q => (
                    <button key={q} onClick={() => send(q)} className="rounded-lg border px-2.5 py-1 text-xs hover:bg-zinc-50" title="Use this">
                      {q}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* chat window */}
            <div ref={scrollRef} className="h-[48vh] space-y-3 overflow-auto rounded-2xl border bg-white p-4">
              {msgs.length === 0 && (
                <div className="text-sm text-zinc-500">No messages yet. Try a suggested question above.</div>
              )}
              {msgs.map((m, i) => <ChatMessage key={i} m={m}/>) }
              {sending && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-2xl border bg-zinc-50 p-3 text-sm leading-6">
                    <div className="mb-1 flex items-center gap-1 text-[11px] text-zinc-500"><Loader2 className="size-3 animate-spin"/> Thinking…</div>
                    <div className="text-zinc-600">Analyzing knowledge base and drafting an answer…</div>
                  </div>
                </div>
              )}
            </div>

            {/* input */}
            <InputBar onSend={send} sending={sending} domain={domain} setDomain={setDomain} />
          </div>

          {/* sources */}
          <div className="space-y-4">
            <SourceList items={sources} />
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Clock className="size-4"/>Realtime</CardTitle>
                <CardDescription>Latency · QPS · Errors (placeholder)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="rounded-xl border p-3 text-center">
                    <div className="text-[11px] text-zinc-500">Latency P95</div>
                    <div className="text-lg font-semibold">2.3s</div>
                  </div>
                  <div className="rounded-xl border p-3 text-center">
                    <div className="text-[11px] text-zinc-500">QPS</div>
                    <div className="text-lg font-semibold">12</div>
                  </div>
                  <div className="rounded-xl border p-3 text-center">
                    <div className="text-[11px] text-zinc-500">Errors</div>
                    <div className="text-lg font-semibold">0.4%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className="border-t px-4 py-3 text-[12px] text-zinc-500">
        Prototype • Conversations in sidebar • Replace mocks with /api endpoints
      </footer>
    </div>
  )
}
