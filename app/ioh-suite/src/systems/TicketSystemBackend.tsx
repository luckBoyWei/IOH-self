import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3, Brain, CalendarClock, CircleGauge, FilePlus2, GitBranch, Inbox,
  KeyRound, Link as LinkIcon, Plus, Settings, ShieldCheck, SlidersHorizontal, Timer, Users,
} from 'lucide-react'

// shadcn/ui
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'

// recharts for default charts
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line,
  LineChart, Tooltip as RTooltip, ResponsiveContainer, XAxis, YAxis,
} from 'recharts'

/**
 * IOH · Ticketing — Admin Portal (MVP Simplified)
 * ----------------------------------------------
 * Matches the Frontend MVP (Create/Search/Open/Ask AI) and exposes:
 * 1) Overview KPIs (Create ≤3s, Classify/Assign ≥90%, Fail ≤1%)
 * 2) Queues (capacity/SLA)
 * 3) Routing Rules (When → Then)
 * 4) SLA Policies (minimal)
 * 5) Agents & Skills
 * 6) Templates (intake forms)
 * 7) Integrations (placeholders)
 * 8) Monitoring with **default charts** (Realtime Create/Assign latency · Errors)
 * Notes: Pure front-end prototype with mocked state only; English only.
 */

// ---- Mock data ------------------------------------------------------------
const kpis = [
  { label: 'Create P95', value: '2.2 s', tip: '≤ 3 s', ok: true },
  { label: 'Classify Acc', value: '92.1%', tip: '≥ 90%', ok: true },
  { label: 'Assign Acc', value: '90.6%', tip: '≥ 90%', ok: true },
  { label: 'Fail Rate', value: '0.55%', tip: '≤ 1%', ok: true },
]

const queues = [
  { id: 'q-core', name: 'Core Network', prio: 'P1–P3', cap: 120, wip: 63, sla: 'P1 30m / P2 2h' },
  { id: 'q-care', name: 'Customer Care', prio: 'P2–P4', cap: 300, wip: 141, sla: 'P2 4h / P3 1d' },
  { id: 'q-it', name: 'IT Support', prio: 'P3–P5', cap: 180, wip: 52, sla: 'P3 1d / P4 3d' },
]

const rules = [
  { id: 'R-001', name: 'P1 Network Alarm', when: 'source=ops && severity=P1', then: 'queue=Core Network; assignee=Auto; notify=oncall' },
  { id: 'R-014', name: 'DNS incidents', when: 'title ~ \'DNS\' || tags has dns', then: 'queue=Core Network; skill=DNS' },
  { id: 'R-031', name: 'Billing', when: 'category=Billing', then: 'queue=Customer Care' },
]

const agents = [
  { id: 'a-yoan', name: 'Yoan', skills: ['DNS', 'CGNAT'], load: 3, max: 5, status: 'Online' },
  { id: 'a-ayu', name: 'Ayu', skills: ['Billing', 'CRM'], load: 4, max: 6, status: 'Online' },
  { id: 'a-riz', name: 'Rizky', skills: ['Core', 'RAN'], load: 1, max: 4, status: 'Away' },
]

const templates = [
  { id: 'T-ops', name: 'Ops Incident', fields: ['title', 'severity', 'domain', 'attachments'] },
  { id: 'T-care', name: 'Care Ticket', fields: ['customerId', 'channel', 'summary'] },
  { id: 'T-it', name: 'IT Request', fields: ['requestType', 'device', 'impact'] },
]

// ---- Default chart series -------------------------------------------------
const genSeries = () => {
  const base = Date.now()
  return Array.from({ length: 12 }).map((_, i) => {
    const t = new Date(base - (11 - i) * 60_000)
    const hh = t.getHours().toString().padStart(2, '0')
    const mm = t.getMinutes().toString().padStart(2, '0')
    return {
      time: `${hh}:${mm}`,
      create_p50: 1.1 + Math.sin(i / 2) * 0.2 + (i % 5 === 0 ? 0.1 : 0),
      create_p95: 2.1 + Math.cos(i / 3) * 0.3 + (i % 7 === 0 ? 0.2 : 0),
      assign_p50: 0.9 + Math.sin(i / 1.7) * 0.15,
      assign_p95: 1.8 + Math.cos(i / 2.6) * 0.25,
      errors: 0.3 + (i % 6 === 0 ? 0.25 : 0.05) + Math.max(0, Math.sin(i / 4)) * 0.1,
    }
  })
}

const series = genSeries()

function KPI({ label, value, tip, ok }: any) {
  return (
    <Card className="border-zinc-200 shadow-sm">
      <CardHeader className="pb-2">
        <CardDescription className="text-xs text-zinc-500">{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-2 text-xs text-zinc-500">
        <ShieldCheck className={`size-3 ${ok ? 'text-emerald-600' : 'text-red-600'}`} /> {tip}
      </CardContent>
    </Card>
  )
}

function Header() {
  return (
    <div className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-xl bg-gradient-to-r from-yellow-300 to-red-500" />
          <div>
            <div className="text-sm text-zinc-500">IOH · Meranti Cloud</div>
            <div className="font-semibold">Work Order Admin (MVP)</div>
          </div>
          <Badge className="ml-2">Create ≤ 3s · Acc ≥ 90%</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm"><KeyRound className="mr-1 size-4"/>API</Button>
          <Button variant="outline" size="sm"><Settings className="mr-1 size-4"/>Settings</Button>
        </div>
      </div>
    </div>
  )
}

function SideNav({ active, setActive }: any) {
  const items = [
    { id: 'overview', icon: CircleGauge, label: 'Overview' },
    { id: 'queues', icon: Inbox, label: 'Queues' },
    { id: 'routing', icon: GitBranch, label: 'Routing Rules' },
    { id: 'sla', icon: Timer, label: 'SLA Policies' },
    { id: 'agents', icon: Users, label: 'Agents & Skills' },
    { id: 'forms', icon: FilePlus2, label: 'Templates' },
    { id: 'integrations', icon: LinkIcon, label: 'Integrations' },
    { id: 'monitor', icon: BarChart3, label: 'Monitoring' },
  ]
  return (
    <div className="sticky top-[56px] hidden h-[calc(100dvh-56px)] w-60 overflow-y-auto border-r border-zinc-200 p-3 lg:block">
      <div className="space-y-1">
        {items.map(it => (
          <button key={it.id} onClick={() => setActive(it.id)} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-zinc-50 ${active === it.id ? 'bg-zinc-100 font-semibold' : ''}`}>
            <it.icon className="size-4"/>{it.label}
          </button>
        ))}
      </div>
      <div className="mt-6 rounded-2xl border border-amber-200 bg-gradient-to-br from-yellow-50 to-red-50 p-3">
        <div className="text-xs text-zinc-500">SLA Snapshot</div>
        <div className="mt-2 space-y-2">
          <div className="flex justify-between text-sm"><span>Create P95</span><span>2.2s</span></div>
          <Progress value={88} />
          <div className="flex justify-between text-sm"><span>Classify Acc</span><span>92.1%</span></div>
          <Progress value={92} />
        </div>
      </div>
    </div>
  )
}

function QueueCard({ q }: any) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2"><Inbox className="size-4"/>{q.name}</CardTitle>
        <CardDescription>{q.prio} · SLA {q.sla}</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 text-sm">
        <div>Capacity <span className="font-semibold">{q.cap}</span></div>
        <div>In‑progress <span className="font-semibold">{q.wip}</span></div>
        <div className="col-span-2">
          <div className="mb-1 text-xs text-zinc-500">Load</div>
          <Progress value={Math.min(100, Math.round(q.wip / q.cap * 100))}/>
        </div>
        <div className="col-span-2 flex gap-2"><Button size="sm">Pause</Button><Button size="sm" variant="outline">Config</Button></div>
      </CardContent>
    </Card>
  )
}

function Overview() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">{kpis.map(k => <KPI key={k.label} {...k}/>)}</div>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Inbox className="size-4"/>Queues</CardTitle>
          <CardDescription>Priority • Capacity • SLA</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {queues.map(q => <QueueCard key={q.id} q={q}/>)}
        </CardContent>
      </Card>
    </div>
  )
}

function QueuesPane() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button size="sm"><Plus className="mr-1 size-4"/>New Queue</Button>
        <Button size="sm" variant="outline"><SlidersHorizontal className="mr-1 size-4"/>Business Hours</Button>
        <Button size="sm" variant="outline"><CalendarClock className="mr-1 size-4"/>Holidays</Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Queue List</CardTitle>
          <CardDescription>Capacity, priority and policies</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-12 px-3 text-[12px] text-zinc-500">
            <div className="col-span-3">Name</div>
            <div className="col-span-2">Priority</div>
            <div className="col-span-2">Capacity</div>
            <div className="col-span-3">SLA</div>
            <div className="col-span-2"/>
          </div>
          {queues.map(q => (
            <div key={q.id} className="grid grid-cols-12 items-center rounded-xl px-3 py-2 hover:bg-zinc-50">
              <div className="col-span-3 font-medium">{q.name}</div>
              <div className="col-span-2 text-sm">{q.prio}</div>
              <div className="col-span-2 text-sm">{q.cap}</div>
              <div className="col-span-3 text-sm">{q.sla}</div>
              <div className="col-span-2 justify-self-end"><Button size="sm" variant="outline">Edit</Button></div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function RulesPane() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button size="sm"><Plus className="mr-1 size-4"/>New Rule</Button>
        <Button size="sm" variant="outline"><Brain className="mr-1 size-4"/>LLM Classifier</Button>
      </div>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Routing Rules</CardTitle>
          <CardDescription>Conditions → queue/assignee/notify</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-12 px-3 text-[12px] text-zinc-500">
            <div className="col-span-3">Name</div>
            <div className="col-span-5">When</div>
            <div className="col-span-3">Then</div>
            <div className="col-span-1"/>
          </div>
          {rules.map(r => (
            <div key={r.id} className="grid grid-cols-12 items-center rounded-xl px-3 py-2 hover:bg-zinc-50">
              <div className="col-span-3 font-medium">{r.name}</div>
              <div className="col-span-5 text-xs text-zinc-600">{r.when}</div>
              <div className="col-span-3 text-xs text-zinc-600">{r.then}</div>
              <div className="col-span-1 justify-self-end"><Button size="sm" variant="outline">Edit</Button></div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create Rule</CardTitle>
          <CardDescription>Condition builder & actions</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-3">
            <div className="grid grid-cols-3 items-center gap-2"><Label>Name</Label><Input className="col-span-2" placeholder="e.g. P1 Network Alarm"/></div>
            <div className="grid grid-cols-3 items-center gap-2"><Label>When</Label><Textarea className="col-span-2" placeholder={'source=ops && severity=P1'}/></div>
            <div className="grid grid-cols-3 items-center gap-2"><Label>Then</Label><Textarea className="col-span-2" placeholder={'queue=Core; assignee=Auto; notify=oncall'}/></div>
            <Button>Create</Button>
          </div>
          <div className="space-y-1 rounded-xl border p-3 text-sm text-zinc-600">
            <div>Simulated matches: 128</div>
            <div>Precision (est): 0.91</div>
            <div>Recall (est): 0.88</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SLAPane() {
  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>SLA Policies</CardTitle>
          <CardDescription>Targets & escalations</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-3">
            <div className="grid grid-cols-3 items-center gap-2"><Label>P1</Label><Input className="col-span-2" placeholder="ack 5m, resolve 30m"/></div>
            <div className="grid grid-cols-3 items-center gap-2"><Label>P2</Label><Input className="col-span-2" placeholder="ack 15m, resolve 2h"/></div>
            <div className="grid grid-cols-3 items-center gap-2"><Label>P3</Label><Input className="col-span-2" placeholder="ack 1h, resolve 1d"/></div>
          </div>
          <div className="grid gap-3">
            <div className="grid grid-cols-3 items-center gap-2"><Label>Business Hours</Label><Input className="col-span-2" placeholder="09:00-18:00 +07"/></div>
            <div className="grid grid-cols-3 items-center gap-2"><Label>On‑call Group</Label><Input className="col-span-2" placeholder="net‑oncall@ioh"/></div>
            <div className="grid grid-cols-3 items-center gap-2"><Label>Pause on Holidays</Label><Checkbox className="col-span-2" defaultChecked/></div>
            <Button>Save</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function AgentsPane() {
  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Agents & Skills</CardTitle>
          <CardDescription>Load balancing & concurrency</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-12 px-3 text-[12px] text-zinc-500">
            <div className="col-span-3">Name</div>
            <div className="col-span-4">Skills</div>
            <div className="col-span-2">Load</div>
            <div className="col-span-2">Max</div>
            <div className="col-span-1"/>
          </div>
          {agents.map(a => (
            <div key={a.id} className="grid grid-cols-12 items-center rounded-xl px-3 py-2 hover:bg-zinc-50">
              <div className="col-span-3 font-medium">{a.name} <Badge variant="secondary" className="ml-2">{a.status}</Badge></div>
              <div className="col-span-4 flex flex-wrap gap-2 text-sm">{a.skills.map((s: string) => (<Badge key={s}>{s}</Badge>))}</div>
              <div className="col-span-2 text-sm">{a.load}</div>
              <div className="col-span-2 text-sm">{a.max}</div>
              <div className="col-span-1 justify-self-end"><Button size="sm" variant="outline">Edit</Button></div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Edit Agent</CardTitle>
          <CardDescription>Skills, caps and status</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-3">
            <div className="grid grid-cols-3 items-center gap-2"><Label>Name</Label><Input className="col-span-2" placeholder="Agent name"/></div>
            <div className="grid grid-cols-3 items-center gap-2"><Label>Skills</Label><Input className="col-span-2" placeholder="DNS, CGNAT, Billing"/></div>
            <div className="grid grid-cols-3 items-center gap-2"><Label>Max Concurrency</Label><Input className="col-span-2" placeholder="5"/></div>
          </div>
          <div className="grid gap-3">
            <div className="grid grid-cols-3 items-center gap-2"><Label>Status</Label><Select defaultValue="online"><SelectTrigger className="col-span-2"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="online">Online</SelectItem><SelectItem value="away">Away</SelectItem><SelectItem value="offline">Offline</SelectItem></SelectContent></Select></div>
            <div className="grid grid-cols-3 items-center gap-2"><Label>Queue Affinity</Label><Input className="col-span-2" placeholder="Core, Care"/></div>
            <Button>Save</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function FormsPane() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button size="sm"><Plus className="mr-1 size-4"/>New Template</Button>
      </div>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Templates</CardTitle>
          <CardDescription>Standardize ticket intake</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-12 px-3 text-[12px] text-zinc-500">
            <div className="col-span-3">Name</div>
            <div className="col-span-6">Fields</div>
            <div className="col-span-3"/>
          </div>
          {templates.map(t => (
            <div key={t.id} className="grid grid-cols-12 items-center rounded-xl px-3 py-2 hover:bg-zinc-50">
              <div className="col-span-3 font-medium">{t.name}</div>
              <div className="col-span-6 text-sm text-zinc-600">{t.fields.join(', ')}</div>
              <div className="col-span-3 justify-self-end"><Button size="sm" variant="outline">Edit</Button></div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Edit Template</CardTitle>
          <CardDescription>Fields & validations</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-3">
            <div className="grid grid-cols-3 items-center gap-2"><Label>Template Name</Label><Input className="col-span-2" placeholder="Ops Incident"/></div>
            <div className="grid grid-cols-3 items-center gap-2"><Label>Fields</Label><Textarea className="col-span-2" placeholder={'title, severity, domain, attachments'}/></div>
            <div className="flex items-center gap-2"><Checkbox id="aiSuggest" defaultChecked/><Label htmlFor="aiSuggest">AI auto‑fill summary</Label></div>
          </div>
          <div className="grid gap-3">
            <div className="grid grid-cols-3 items-center gap-2"><Label>Required</Label><Input className="col-span-2" placeholder="title, severity"/></div>
            <div className="grid grid-cols-3 items-center gap-2"><Label>Validators</Label><Input className="col-span-2" placeholder="severity in [P1..P5]"/></div>
            <Button>Save</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function IntegrationsPane() {
  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>System Integrations</CardTitle>
          <CardDescription>Connect to Ops/Q&A/LLM Platform</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-3">
            <div className="grid grid-cols-3 items-center gap-2"><Label>Ops System</Label><Input className="col-span-2" placeholder="ops.api.ioh.local"/></div>
            <div className="grid grid-cols-3 items-center gap-2"><Label>Q&A System</Label><Input className="col-span-2" placeholder="qa.api.ioh.local"/></div>
            <div className="grid grid-cols-3 items-center gap-2"><Label>LLM Gateway</Label><Input className="col-span-2" placeholder="llm.api.ioh.local"/></div>
            <div className="grid grid-cols-3 items-center gap-2"><Label>API Key</Label><Input className="col-span-2" placeholder="key_ticket_****b61"/></div>
          </div>
          <div className="grid gap-3">
            <div className="grid grid-cols-3 items-center gap-2"><Label>Webhook</Label><Input className="col-span-2" placeholder="https://ticket.ioh/hooks"/></div>
            <div className="grid grid-cols-3 items-center gap-2"><Label>Retry Policy</Label><Input className="col-span-2" placeholder="3x backoff"/></div>
            <div className="flex items-center gap-2"><Checkbox id="obs" defaultChecked/><Label htmlFor="obs">Send metrics to observability</Label></div>
            <Button>Save</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ---- Monitoring with default charts --------------------------------------
function MonitorPane() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">{kpis.map(k => <KPI key={k.label} {...k}/>)}</div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BarChart3 className="size-4"/>Realtime</CardTitle>
          <CardDescription>Create/Assign latency · Errors (placeholder)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Create Latency */}
            <div className="h-48 rounded-xl border p-2">
              <div className="mb-1 text-xs text-zinc-500">Create latency (P50/P95)</div>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopOpacity={0.4} />
                      <stop offset="95%" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} domain={[0, 'dataMax + 0.6']} />
                  <RTooltip formatter={(v: any) => `${v}s`} />
                  <Area type="monotone" dataKey="create_p50" strokeOpacity={1} fillOpacity={0.2} fill="url(#g1)" />
                  <Area type="monotone" dataKey="create_p95" strokeOpacity={1} fillOpacity={0.1} />
                  <Legend verticalAlign="bottom" height={24} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Assign Latency */}
            <div className="h-48 rounded-xl border p-2">
              <div className="mb-1 text-xs text-zinc-500">Assign latency (P50/P95)</div>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} domain={[0, 'dataMax + 0.6']} />
                  <RTooltip formatter={(v: any) => `${v}s`} />
                  <Line type="monotone" dataKey="assign_p50" dot={false} />
                  <Line type="monotone" dataKey="assign_p95" dot={false} />
                  <Legend verticalAlign="bottom" height={24} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Error Rate */}
            <div className="h-48 rounded-xl border p-2">
              <div className="mb-1 text-xs text-zinc-500">Error rate (%)</div>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={series} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={v => `${v}%`} domain={[0, 'dataMax + 0.6']} tick={{ fontSize: 10 }} />
                  <RTooltip formatter={(v: any) => `${v}%`} />
                  <Bar dataKey="errors" />
                  <Legend verticalAlign="bottom" height={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ---- Root ---------------------------------------------------------------
export default function AdminPortalMVP() {
  const [active, setActive] = useState('overview')

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <Header />
      <div className="mx-auto flex w-full max-w-7xl">
        <SideNav active={active} setActive={setActive} />
        <main className="flex-1 space-y-4 p-4 lg:p-6">
          <motion.div layout className="rounded-3xl border border-amber-200 bg-gradient-to-r from-yellow-100 via-amber-100 to-red-100 p-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-gradient-to-r from-yellow-400 to-red-500"/>
              <div>
                <div className="text-sm text-zinc-600">IOH · Meranti Cloud AI</div>
                <div className="text-lg font-semibold">Work Order Admin</div>
              </div>
            </div>
          </motion.div>

          {active === 'overview' && <Overview />}
          {active === 'queues' && <QueuesPane />}
          {active === 'routing' && <RulesPane />}
          {active === 'sla' && <SLAPane />}
          {active === 'agents' && <AgentsPane />}
          {active === 'forms' && <FormsPane />}
          {active === 'integrations' && <IntegrationsPane />}
          {active === 'monitor' && <MonitorPane />}

          <div className="pt-2 text-[12px] text-zinc-500">Prototype • Targets: Create ≤3s · Classify/Assign ≥90% · Fail ≤1%</div>
        </main>
      </div>
    </div>
  )
}
