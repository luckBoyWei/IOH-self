import React, { useState } from 'react'
import { Gauge, KeyRound, Layers, Link as LinkIcon, Loader2, RefreshCw, UploadCloud } from 'lucide-react'

// shadcn/ui
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

/**
 * IOH · Q&A System — Admin (Minimal MVP)
 * --------------------------------------------------
 * Purpose: match the Frontend Minimal Acceptance for Stage‑2.
 * Pages (6): KBs · Ingestion · RAG Config · Models & Routing · Metrics · Access & Keys
 * Notes:
 *  - English‑only UI; small, production‑lean layout
 *  - Replace mock handlers with real endpoints when wiring
 */

/* ------------------------ Minimal Mock API ------------------------ */
async function wait(ms: number) { return new Promise(r => setTimeout(r, ms)) }
async function mockReindex() { await wait(600); return { ok: true, jobId: 'reindex_001' } }
async function mockUpload() { await wait(600); return { ok: true, docId: 'doc_xxx' } }

/* ----------------------------- Const ----------------------------- */
const DOMAINS = [
  { id: 'care', name: 'Customer Care' },
  { id: 'mkt', name: 'Marketing' },
  { id: 'train', name: 'Training' },
  { id: 'net', name: 'Network Tech' },
]

const DEFAULT_KBS = [
  { id: 'care', name: 'Customer Care', version: 'v2025.10.24', docs: 512, chunks: 24120 },
  { id: 'mkt', name: 'Marketing', version: 'v2025.10.14', docs: 388, chunks: 18230 },
  { id: 'train', name: 'Training', version: 'v2025.10.10', docs: 210, chunks: 10110 },
  { id: 'net', name: 'Network Tech', version: 'v2025.10.26', docs: 930, chunks: 46100 },
]

/* ----------------------------- Layout ---------------------------- */
function Header() {
  return (
    <div className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-xl bg-gradient-to-r from-yellow-300 to-red-500"/>
          <div>
            <div className="text-xs text-zinc-500">IOH · Meranti Cloud</div>
            <div className="font-semibold">Q&A Admin</div>
          </div>
          <Badge variant="secondary" className="ml-2">Acc ≥92%</Badge>
          <Badge variant="secondary">P95 ≤2.5s</Badge>
        </div>
        <div className="text-xs text-zinc-500">Prototype • Minimal</div>
      </div>
    </div>
  )
}

/* ------------------------------ Pages ---------------------------- */
function KBs() {
  const [items, setItems] = useState(DEFAULT_KBS)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')

  function addKB() {
    if(!newName.trim()) return
    setItems([{ id: newName.toLowerCase().replace(/\s+/g, '-'), name: newName, version: 'v0', docs: 0, chunks: 0 }, ...items])
    setNewName('')
  }

  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Layers className="size-4"/>Knowledge Bases</CardTitle>
          <CardDescription>Four independent KBs aligned with the Frontend domain switch.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-12 px-2 text-[12px] text-zinc-500">
            <div className="col-span-3">Name</div>
            <div className="col-span-3">Version</div>
            <div className="col-span-3">Docs/Chunks</div>
            <div className="col-span-3 text-right">Actions</div>
          </div>
          {items.map(k => (
            <div key={k.id} className="grid grid-cols-12 items-center rounded-xl border px-2 py-2 hover:bg-zinc-50">
              <div className="col-span-3 font-medium">{k.name}</div>
              <div className="col-span-3">{k.version}</div>
              <div className="col-span-3 text-sm">{k.docs} / {k.chunks.toLocaleString()}</div>
              <div className="col-span-3 text-right">
                <Button variant="outline" size="sm">Rename</Button>
                <Button variant="outline" size="sm" className="ml-2">Delete</Button>
              </div>
            </div>
          ))}

          <div className="grid gap-2 rounded-xl border p-3 md:grid-cols-[1fr,120px]">
            <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Create new KB (name)"/>
            <Button onClick={addKB}>Create KB</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Ingestion() {
  const [domain, setDomain] = useState('care')
  const [chunk, setChunk] = useState('800')
  const [overlap, setOverlap] = useState('200')
  const [running, setRunning] = useState(false)

  async function runReindex() {
    setRunning(true)
    await mockReindex()
    setRunning(false)
  }

  async function upload() {
    setRunning(true)
    await mockUpload()
    setRunning(false)
  }

  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UploadCloud className="size-4"/>Ingestion Jobs</CardTitle>
          <CardDescription>Upload documents or crawl URLs; split & index.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-3">
            <div className="grid grid-cols-3 items-center gap-2"><Label>Domain</Label>
              <Select value={domain} onValueChange={setDomain}><SelectTrigger className="col-span-2"><SelectValue/></SelectTrigger>
                <SelectContent>{DOMAINS.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 items-center gap-2"><Label>Chunk size</Label><Input className="col-span-2" value={chunk} onChange={e => setChunk(e.target.value)} /></div>
            <div className="grid grid-cols-3 items-center gap-2"><Label>Overlap</Label><Input className="col-span-2" value={overlap} onChange={e => setOverlap(e.target.value)} /></div>
            <div className="grid grid-cols-3 items-center gap-2"><Label>PII Mask</Label><Textarea className="col-span-2" placeholder="email, msisdn, card"/></div>
          </div>
          <div className="grid gap-3">
            <div className="grid grid-cols-3 items-center gap-2"><Label>Upload</Label>
              <div className="col-span-2 flex gap-2">
                <Button variant="outline" onClick={upload}><UploadCloud className="mr-2 size-4"/>Select file</Button>
                <Button variant="outline"><LinkIcon className="mr-2 size-4"/>Add URL</Button>
              </div>
            </div>
            <div className="grid grid-cols-3 items-center gap-2"><Label>Reindex</Label>
              <Button onClick={runReindex} className="col-span-2" disabled={running}>
                {running ? <Loader2 className="mr-2 size-4 animate-spin"/> : <RefreshCw className="mr-2 size-4"/>}
                {running ? 'Running…' : 'Run now'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function RAGConfig() {
  const [embed, setEmbed] = useState('bge-m3')
  const [rerank, setRerank] = useState('bge-m3')
  const [topk, setTopk] = useState('8')
  const [style, setStyle] = useState('concise')

  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Retrieval</CardTitle>
          <CardDescription>Embedding · Top‑K · Reranker</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-3">
            <div className="grid grid-cols-3 items-center gap-2"><Label>Embedding</Label>
              <Select value={embed} onValueChange={setEmbed}><SelectTrigger className="col-span-2"><SelectValue/></SelectTrigger>
                <SelectContent><SelectItem value="bge-m3">bge‑m3</SelectItem><SelectItem value="e5-large">e5‑large</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 items-center gap-2"><Label>Top‑K</Label><Input className="col-span-2" value={topk} onChange={e => setTopk(e.target.value)} /></div>
          </div>
          <div className="grid gap-3">
            <div className="grid grid-cols-3 items-center gap-2"><Label>Re‑ranker</Label>
              <Select value={rerank} onValueChange={setRerank}><SelectTrigger className="col-span-2"><SelectValue/></SelectTrigger>
                <SelectContent><SelectItem value="bge-m3">bge‑m3</SelectItem><SelectItem value="none">none</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 items-center gap-2"><Label>Answer style</Label>
              <Select value={style} onValueChange={setStyle}><SelectTrigger className="col-span-2"><SelectValue/></SelectTrigger>
                <SelectContent><SelectItem value="concise">Concise</SelectItem><SelectItem value="bulleted">Bulleted</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ModelsRouting() {
  const [endpoint, setEndpoint] = useState('http://llm.internal:8000')
  const [timeout, setTimeoutMs] = useState('8000')
  const [limit, setLimit] = useState('20')
  const [retry, setRetry] = useState(true)

  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Models & Routing</CardTitle>
          <CardDescription>LLM endpoint · concurrency · retry</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-3">
            <div className="grid grid-cols-3 items-center gap-2"><Label>Endpoint</Label><Input className="col-span-2" value={endpoint} onChange={e => setEndpoint(e.target.value)} /></div>
            <div className="grid grid-cols-3 items-center gap-2"><Label>Timeout (ms)</Label><Input className="col-span-2" value={timeout} onChange={e => setTimeoutMs(e.target.value)} /></div>
          </div>
          <div className="grid gap-3">
            <div className="grid grid-cols-3 items-center gap-2"><Label>Concurrency</Label><Input className="col-span-2" value={limit} onChange={e => setLimit(e.target.value)} /></div>
            <div className="grid grid-cols-3 items-center gap-2"><Label>Retry</Label><Switch className="col-span-2" checked={retry} onCheckedChange={setRetry} /></div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Metrics() {
  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Gauge className="size-4"/>Realtime</CardTitle>
          <CardDescription>Latency · QPS · Error rate (placeholders)</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-2 text-sm">
          <div className="rounded-xl border p-3 text-center"><div className="text-[11px] text-zinc-500">Latency P95</div><div className="text-lg font-semibold">2.3s</div></div>
          <div className="rounded-xl border p-3 text-center"><div className="text-[11px] text-zinc-500">QPS</div><div className="text-lg font-semibold">12</div></div>
          <div className="rounded-xl border p-3 text-center"><div className="text-[11px] text-zinc-500">Errors</div><div className="text-lg font-semibold">0.4%</div></div>
        </CardContent>
      </Card>
    </div>
  )
}

function AccessKeys() {
  const [endpoint, setEndpoint] = useState('https://qa.api.ioh')
  const [quota, setQuota] = useState('400 rps')
  const [scopes, setScopes] = useState('inference, workflow')

  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><KeyRound className="size-4"/>API & Keys</CardTitle>
          <CardDescription>Gateway endpoint · quotas · scopes</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-3">
            <div className="grid grid-cols-3 items-center gap-2"><Label>Endpoint</Label><Input className="col-span-2" value={endpoint} onChange={e => setEndpoint(e.target.value)} /></div>
            <div className="grid grid-cols-3 items-center gap-2"><Label>Quota</Label><Input className="col-span-2" value={quota} onChange={e => setQuota(e.target.value)} /></div>
            <div className="grid grid-cols-3 items-center gap-2"><Label>Scopes</Label><Input className="col-span-2" value={scopes} onChange={e => setScopes(e.target.value)} /></div>
          </div>
          <div className="rounded-xl border p-3 text-sm">
            <div className="flex items-center justify-between"><span>key_qa_****0aa</span><Badge>Active</Badge></div>
            <div className="text-[12px] text-zinc-500">System Q&A · {quota} · {scopes}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/* ------------------------------- App ------------------------------ */
export default function QABackendMinimal() {
  const [tab, setTab] = useState('kbs')
  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <Header />

      <main className="mx-auto w-full max-w-7xl p-4 lg:p-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="kbs">KBs</TabsTrigger>
            <TabsTrigger value="ingest">Ingestion</TabsTrigger>
            <TabsTrigger value="rag">RAG Config</TabsTrigger>
            <TabsTrigger value="models">Models & Routing</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="access">Access & Keys</TabsTrigger>
          </TabsList>

          <TabsContent value="kbs"><KBs/></TabsContent>
          <TabsContent value="ingest"><Ingestion/></TabsContent>
          <TabsContent value="rag"><RAGConfig/></TabsContent>
          <TabsContent value="models"><ModelsRouting/></TabsContent>
          <TabsContent value="metrics"><Metrics/></TabsContent>
          <TabsContent value="access"><AccessKeys/></TabsContent>
        </Tabs>
      </main>

      <footer className="border-t px-4 py-3 text-[12px] text-zinc-500">
        Minimal admin prototype • Replace mocks with backend APIs • Aligns with Frontend: care/mkt/train/net
      </footer>
    </div>
  )
}
