import React, { useEffect, useMemo, useState } from 'react'
import { Brain, ClipboardList, Inbox, Loader2, Ticket } from 'lucide-react'

// shadcn/ui
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

/**
 * IOH · Ticketing — User Portal (MVP Simplified)
 * ------------------------------------------------
 * 满足第二阶段「前台页面最小验收」：
 * 1) 新建工单（必填：Title/Description；可选：Severity）
 * 2) 智能解析占位（AI Suggest 填充摘要）
 * 3) 工单列表（搜索/打开详情）
 * 4) 工单详情（对话 + Ask AI，输入为空使用默认问题并返回默认答案）
 * 5) 独立 RAG 的占位：Knowledge Suggestions（仅展示占位数据）
 * 说明：去掉了 Dashboard/Tabs/复杂交互，保留最小必需字段与动作。
 */

// ---- 默认问答（满足“Ask AI 为空也能返回默认答案”） -----------------------
const DEFAULT_QUESTION = 'DNS SERVFAIL in Jakarta: cause and quick fix?'
const DEFAULT_ANSWER = {
  text:
    'Root cause: upstream resolver threshold tightened, causing cache misses and SERVFAIL.\n\n'
    + 'Quick fix:\n'
    + '1) Roll back threshold to 60ms.\n'
    + '2) Flush cache on edge resolvers.\n'
    + '3) Watch P95 latency < 200ms for 30 min.\n',
  cites: ['SOP-DNS-001', 'KB-OPS-1012'],
  conf: 0.86,
  latency: 2.2,
}

// ---- Mock 数据 ------------------------------------------------------------
const MOCK_TICKETS = [
  { id: 'TK-2025-10123', title: 'DNS latency spike in Jakarta', severity: 'P2', status: 'Open', queue: 'Core Network', assignee: 'Auto', created: '2025-10-24 10:18' },
  { id: 'TK-2025-10124', title: 'Billing adjustment for postpaid', severity: 'P3', status: 'In Progress', queue: 'Customer Care', assignee: 'Ayu', created: '2025-10-24 09:42' },
  { id: 'TK-2025-10125', title: 'Laptop request for new hire', severity: 'P4', status: 'Open', queue: 'IT Support', assignee: 'Rizky', created: '2025-10-23 16:02' },
]

const KNOWLEDGE_HINTS = [
  { id: 'SOP-DNS-001', title: 'SOP—DNS latency troubleshooting', score: 0.89 },
  { id: 'KB-OPS-1012', title: 'Case—DNS SERVFAIL spike after config change', score: 0.92 },
]

// ---- SLA 倒计时（简化版） -------------------------------------------------
function SLATimer({ minutes }: { minutes: number }) {
  const [left, setLeft] = useState(minutes * 60)
  useEffect(() => {
    const t = setInterval(() => setLeft(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [minutes])
  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')
  return (
    <div className="text-xs text-zinc-600">SLA Remaining · {mm}:{ss}</div>
  )
}

// ---- Create Ticket（最小表单 + AI Suggest） ------------------------------
function CreateTicket({ onCreate }: { onCreate: (t: any) => void }) {
  const [title, setTitle] = useState('')
  const [severity, setSeverity] = useState('p3')
  const [desc, setDesc] = useState('')
  const [aiBusy, setAiBusy] = useState(false)

  const aiSuggest = () => {
    setAiBusy(true)
    setTimeout(() => {
      setDesc(
        'Auto-summary: DNS latency increased after resolver threshold change. Suggested rollback + cache flush; validate P95 < 200ms.',
      )
      setTitle(t => t || 'DNS latency spike in Jakarta')
      setAiBusy(false)
    }, 500)
  }

  const submit = () => {
    const sev = (severity || 'p3').toLowerCase()
    const newT = {
      id: `TK-2025-${Math.floor(Math.random() * 90000 + 10000)}`,
      title: title || 'Untitled',
      severity: sev.toUpperCase(),
      status: 'Open',
      queue: 'Auto',
      assignee: 'Auto',
      created: new Date().toISOString().slice(0, 16).replace('T', ' '),
      summary: desc,
      slaMinutes: sev === 'p1' ? 30 : sev === 'p2' ? 120 : sev === 'p3' ? 360 : 1440,
      channel: 'Portal',
    }
    onCreate(newT)
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ClipboardList className="size-4"/>Create Ticket</CardTitle>
        <CardDescription>Minimal form · AI assisted</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-3">
          <div className="grid grid-cols-3 items-center gap-2">
            <Label>Title</Label>
            <Input className="col-span-2" value={title} onChange={e => setTitle(e.target.value)} placeholder="Describe the issue"/>
          </div>
          <div className="grid grid-cols-3 items-center gap-2">
            <Label>Severity</Label>
            <Select defaultValue={severity} onValueChange={setSeverity}>
              <SelectTrigger className="col-span-2"><SelectValue/></SelectTrigger>
              <SelectContent>
                {['p1', 'p2', 'p3', 'p4', 'p5'].map(s => <SelectItem key={s} value={s}>{s.toUpperCase()}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-3">
          <div className="grid grid-cols-3 items-center gap-2">
            <Label>Description</Label>
            <Textarea className="col-span-2" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Add details"/>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" onClick={aiSuggest} disabled={aiBusy}>
              {aiBusy ? <Loader2 className="mr-1 size-4 animate-spin"/> : <Brain className="mr-1 size-4"/>}
              AI Suggest
            </Button>
            <Button variant="outline" onClick={() => { setTitle(''); setDesc('') }}>Reset</Button>
            <Button className="ml-auto" onClick={submit}><Ticket className="mr-1 size-4"/>Submit</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ---- Inbox（列表 + 搜索） ------------------------------------------------
function TicketRow({ t, onOpen }: any) {
  return (
    <div className="grid grid-cols-12 items-center rounded-xl px-3 py-2 hover:bg-zinc-50">
      <div className="col-span-4 font-medium">{t.title} <Badge className="ml-2">{t.severity}</Badge></div>
      <div className="col-span-2 text-sm">{t.queue}</div>
      <div className="col-span-2 text-sm">{t.assignee}</div>
      <div className="col-span-2 text-sm">{t.status}</div>
      <div className="col-span-1 text-xs text-zinc-500">{t.created}</div>
      <div className="col-span-1 justify-self-end"><Button size="sm" variant="outline" onClick={() => onOpen(t)}>Open</Button></div>
    </div>
  )
}

function InboxPane({ items, onOpen }: { items: any[]; onOpen: (t: any) => void }) {
  const [q, setQ] = useState('')
  const filtered = useMemo(() => items.filter(t => t.title.toLowerCase().includes(q.toLowerCase())), [q, items])
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Inbox className="size-4"/>Inbox</CardTitle>
        <CardDescription>Search & open ticket</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Input placeholder="Search tickets" value={q} onChange={e => setQ(e.target.value)} className="max-w-sm"/>
        </div>
        <div className="rounded-xl border">
          <div className="grid grid-cols-12 bg-zinc-50 px-3 py-2 text-[12px] text-zinc-500">
            <div className="col-span-4">Title</div>
            <div className="col-span-2">Queue</div>
            <div className="col-span-2">Assignee</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1">Created</div>
            <div className="col-span-1"/>
          </div>
          <div className="space-y-1 p-2">
            {filtered.map(t => <TicketRow key={t.id} t={t} onOpen={onOpen} />)}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ---- 简易对话消息类型 -----------------------------------------------------
type ChatMsg = { role: 'user' | 'assistant'; text: string; ts: string; meta?: { conf?: number; latency?: number; cites?: string[] } }

// ---- 工单详情（对话 + Ask AI 默认问题） ----------------------------------
function TicketDetail({ ticket, onClose }: any) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    { role: 'assistant', text: 'Hi, ask AI to analyze context or propose a quick fix.', ts: new Date().toISOString().slice(0, 16).replace('T', ' ') },
  ])

  const pushMsg = (m: ChatMsg) => setMsgs(prev => [...prev, m])

  const askAI = () => {
    const q = text.trim() || DEFAULT_QUESTION
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
    pushMsg({ role: 'user', text: q, ts: now })
    setBusy(true)
    setTimeout(() => {
      const ansNow = new Date().toISOString().slice(0, 16).replace('T', ' ')
      pushMsg({
        role: 'assistant',
        text: DEFAULT_ANSWER.text,
        ts: ansNow,
        meta: { conf: DEFAULT_ANSWER.conf, latency: DEFAULT_ANSWER.latency, cites: DEFAULT_ANSWER.cites },
      })
      setBusy(false)
      setText('')
    }, 800)
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Ticket className="size-4"/>{ticket.id} — {ticket.title}</CardTitle>
        <CardDescription>Queue: {ticket.queue} · Assignee: {ticket.assignee} · Status: {ticket.status}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <div className="space-y-3 rounded-2xl border p-3">
            <div className="flex items-center justify-between">
              <Badge>{ticket.severity}</Badge>
              <SLATimer minutes={ticket.slaMinutes / 60 || 6} />
            </div>
            <div className="max-h-72 overflow-auto rounded-xl border bg-zinc-50 p-3">
              {msgs.map((m, i) => (
                <div key={i} className={`mb-2 flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm ${m.role === 'user' ? 'bg-zinc-900 text-white' : 'border bg-white'}`}>
                    {m.text}
                    {m.role === 'assistant' && m.meta && (
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-zinc-500">
                        <Badge variant="secondary">Conf {Math.round((m.meta.conf ?? 0) * 100)}%</Badge>
                        <Badge variant="secondary">Latency {m.meta.latency ?? 0}s</Badge>
                        {m.meta.cites?.map(c => <Badge key={c} variant="secondary">{c}</Badge>)}
                      </div>
                    )}
                    <div className={`mt-1 text-[10px] ${m.role === 'user' ? 'text-zinc-200/80' : 'text-zinc-400'}`}>{m.ts}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input placeholder={`Ask about this ticket (e.g., "${DEFAULT_QUESTION}")`} value={text} onChange={e => setText(e.target.value)} />
              <Button onClick={askAI} disabled={busy} variant="outline">
                {busy ? <Loader2 className="mr-1 size-4 animate-spin"/> : <Brain className="mr-1 size-4"/>}
                Ask AI
              </Button>
            </div>
            <div className="text-[12px] text-zinc-500">Tip: Leave empty and click Ask AI to use the default question.</div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="rounded-2xl border p-3">
            <div className="mb-2 text-xs text-zinc-500">Knowledge Suggestions</div>
            <div className="space-y-2">
              {KNOWLEDGE_HINTS.map(k => (
                <div key={k.id} className="flex items-center justify-between">
                  <div className="text-sm"><span className="font-medium">{k.id}</span> · {k.title}</div>
                  <Badge variant="secondary">Score {Math.round(k.score * 100)}</Badge>
                </div>
              ))}
            </div>
          </div>
          <Separator />
          <div className="text-xs text-zinc-500">Channel: {ticket.channel || 'Portal'} · Created: {ticket.created}</div>
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ---- Header（极简） -------------------------------------------------------
function Header() {
  return (
    <div className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-xl bg-gradient-to-r from-yellow-300 to-red-500" />
          <div>
            <div className="text-sm text-zinc-500">IOH · Meranti Cloud</div>
            <div className="font-semibold">Work Order Portal (MVP)</div>
          </div>
          <Badge className="ml-2">Create P95 ≤ 3s</Badge>
        </div>
        <div className="text-sm text-zinc-600">Signed in: Yoan</div>
      </div>
    </div>
  )
}

// ---- 根组件 ---------------------------------------------------------------
export default function TicketPortalMVP() {
  const [tickets, setTickets] = useState(MOCK_TICKETS)
  const [openTicket, setOpenTicket] = useState<any | null>(null)

  const handleCreate = (t: any) => {
    setTickets(prev => [t, ...prev])
    setOpenTicket(t)
  }

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <Header />
      <main className="mx-auto w-full max-w-7xl space-y-4 p-4 lg:p-6">
        <CreateTicket onCreate={handleCreate} />
        <InboxPane items={tickets} onOpen={setOpenTicket} />
        {openTicket && <TicketDetail ticket={openTicket} onClose={() => setOpenTicket(null)} />}
        <div className="pt-2 text-[12px] text-zinc-500">MVP • Actions: Create · Search · Open · Ask AI (default) · Knowledge hints</div>
      </main>
    </div>
  )
}
