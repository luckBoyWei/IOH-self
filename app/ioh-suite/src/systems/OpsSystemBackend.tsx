import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { BookMarked, BookOpen, CheckCircle2, FolderPlus, Gauge, Loader2, Save, Settings, SlidersHorizontal, Sparkles, TestTube2, ThumbsDown, ThumbsUp, Trash2, Upload, UploadCloud } from 'lucide-react'

// shadcn/ui
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'

/**
 * IOH · Ops System Admin — MVP (Stage‑2)
 * Matches the **Frontend MVP** Search&RCA page:
 *  - Minimal set only: Ingestion · Knowledge · RAG Config · Feedback
 *  - No dashboards, no status/monitoring, no user mgmt
 *  - Mocked state; wire‑ready layout and defaults baked in
 */

const gradient = 'from-yellow-100 via-amber-100 to-red-100'

// ------- Mocked State -------
const MOCK_JOBS = [
  { id: 'job-1007', file: 'SOP-DNS-001.pdf', state: 'Done', chunks: 48, secs: 2.1 },
  { id: 'job-1008', file: 'Alarm-Playbook-v3.docx', state: 'Indexing', chunks: 112, secs: 6.4 },
]

const MOCK_DOCS = [
  { id: 'SOP-DNS-001', title: 'SOP—DNS latency troubleshooting', ver: 'v2025.10.24', tags: ['dns', 'latency'], chunks: 48 },
  { id: 'KB-OPS-1012', title: 'RCA—DNS SERVFAIL spike case', ver: 'v2025.10.20', tags: ['rca', 'case'], chunks: 36 },
]

const DEFAULTS = {
  chunkSize: 800,
  overlap: 200,
  topK: 4,
  threshold: 0.35,
  rerank: true,
  embeddingModel: 'bge-base (placeholder)',
  llmRoute: '/platform/llm/generate',
}

function Header() {
  return (
    <div className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-xl bg-gradient-to-r from-yellow-300 to-red-500" />
          <div>
            <div className="text-sm text-zinc-500">IOH · Meranti Cloud</div>
            <div className="font-semibold">Ops System Admin · MVP</div>
          </div>
          <Badge className="ml-2">Targets: Accuracy ≥90% · P95 ≤3s</Badge>
        </div>
        <div className="text-sm text-zinc-500">v0.1</div>
      </div>
    </div>
  )
}

function IngestionPane() {
  const [busy, setBusy] = useState(false)
  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UploadCloud className="size-4"/> Ingestion</CardTitle>
          <CardDescription>Upload → Clean → Chunk → Embed → Index (async)</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-3">
            <div className="grid grid-cols-3 items-center gap-2"><Label>File</Label><Input className="col-span-2" placeholder="Drop pdf/docx/md here"/></div>
            <div className="grid grid-cols-3 items-center gap-2"><Label>Category</Label><Input className="col-span-2" placeholder="e.g. SOP / RCA / Manual"/></div>
            <div className="grid grid-cols-3 items-center gap-2"><Label>Tags</Label><Input className="col-span-2" placeholder="dns, latency"/></div>
            <div className="grid grid-cols-3 items-center gap-2"><Label>Publish</Label><Switch defaultChecked/></div>
            <Button onClick={() => { setBusy(true); setTimeout(() => setBusy(false), 1200) }} disabled={busy}>
              {busy ? <Loader2 className="mr-2 size-4 animate-spin"/> : <Upload className="mr-2 size-4"/>} Start Ingest
            </Button>
            <div className="text-[12px] text-zinc-500">Language autodetect; PII masking on.</div>
          </div>
          <div className="rounded-xl border p-3">
            <div className="mb-2 font-semibold">Recent Jobs</div>
            <div className="space-y-2">
              {MOCK_JOBS.map(j => (
                <div key={j.id} className="flex items-center gap-2 rounded-xl border p-2 text-sm">
                  <FolderPlus className="size-4"/>
                  <div className="flex-1">
                    <div className="font-medium">{j.file}</div>
                    <div className="text-xs text-zinc-500">{j.state} · chunks {j.chunks} · {j.secs}s</div>
                  </div>
                  {j.state === 'Done' ? <CheckCircle2 className="size-4 text-emerald-600"/> : <Loader2 className="size-4 animate-spin"/>}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><SlidersHorizontal className="size-4"/> Chunk & Embed Defaults</CardTitle>
          <CardDescription>Keep aligned with the Frontend MVP expectations</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="grid grid-cols-3 items-center gap-2"><Label>Chunk Size</Label><Input defaultValue={DEFAULTS.chunkSize} className="col-span-2"/></div>
          <div className="grid grid-cols-3 items-center gap-2"><Label>Overlap</Label><Input defaultValue={DEFAULTS.overlap} className="col-span-2"/></div>
          <div className="grid grid-cols-3 items-center gap-2"><Label>Embedding</Label><Input defaultValue={DEFAULTS.embeddingModel} className="col-span-2"/></div>
          <div className="grid grid-cols-3 items-center gap-2"><Label>Top‑k</Label><Input defaultValue={DEFAULTS.topK} className="col-span-2"/></div>
          <div className="grid grid-cols-3 items-center gap-2"><Label>Threshold</Label><Input defaultValue={DEFAULTS.threshold} className="col-span-2"/></div>
          <div className="grid grid-cols-3 items-center gap-2"><Label>Rerank</Label><Switch defaultChecked={DEFAULTS.rerank} className="col-span-2"/></div>
          <div className="col-span-3"><Button><Save className="mr-2 size-4"/>Save Defaults</Button></div>
        </CardContent>
      </Card>
    </div>
  )
}

function KnowledgePane() {
  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BookMarked className="size-4"/> Knowledge</CardTitle>
          <CardDescription>Browse / preview / delete</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {MOCK_DOCS.map(d => (
            <div key={d.id} className="rounded-xl border p-3 text-sm">
              <div className="flex items-center gap-2">
                <BookOpen className="size-4"/>
                <div className="flex-1">
                  <div className="font-medium">{d.title}</div>
                  <div className="text-xs text-zinc-500">{d.ver} · chunks {d.chunks}</div>
                </div>
                <div className="flex flex-wrap gap-2">{d.tags.map(t => <Badge key={t} variant="secondary">{t}</Badge>)}</div>
                <Button size="sm" variant="outline">Preview</Button>
                <Button size="sm" variant="outline" className="text-red-600"><Trash2 className="mr-1 size-4"/>Delete</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function RAGConfigPane() {
  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Settings className="size-4"/> RAG Config</CardTitle>
          <CardDescription>Must match Frontend defaults to guarantee behavior</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="grid grid-cols-3 items-center gap-2"><Label>Top‑k</Label><Input defaultValue={DEFAULTS.topK} className="col-span-2"/></div>
          <div className="grid grid-cols-3 items-center gap-2"><Label>Threshold</Label><Input defaultValue={DEFAULTS.threshold} className="col-span-2"/></div>
          <div className="grid grid-cols-3 items-center gap-2"><Label>Rerank</Label><Switch defaultChecked={DEFAULTS.rerank} className="col-span-2"/></div>
          <div className="grid grid-cols-3 items-center gap-2"><Label>LLM Route</Label><Input defaultValue={DEFAULTS.llmRoute} className="col-span-2"/></div>
          <div className="grid grid-cols-3 items-center gap-2"><Label>Embedding</Label><Input defaultValue={DEFAULTS.embeddingModel} className="col-span-2"/></div>
          <div className="col-span-3"><Button><Save className="mr-2 size-4"/>Save Config</Button></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><TestTube2 className="size-4"/> Quick Eval (Golden Set)</CardTitle>
          <CardDescription>Smoke test accuracy & p95 before publish</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-3">
            <div className="grid grid-cols-3 items-center gap-2"><Label>Golden Set</Label><Input className="col-span-2" placeholder="ops_golden_v1.jsonl"/></div>
            <div className="grid grid-cols-3 items-center gap-2"><Label>Sample</Label><Input className="col-span-2" placeholder="300"/></div>
            <Button><Sparkles className="mr-2 size-4"/>Run</Button>
          </div>
          <div className="rounded-xl border p-3 text-sm">
            <div>Accuracy: 90.8%</div>
            <div>P95: 2.9s</div>
            <div>Recall@5: 92.1%</div>
            <div className="mt-2"><Progress value={90}/></div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function FeedbackPane() {
  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Gauge className="size-4"/> Feedback Review</CardTitle>
          <CardDescription>Front‑end 👍/👎 loopback for curation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[{ q: 'DNS SERVFAIL spike at Jakarta POP after config change', helpful: true, evidence: ['SOP-DNS-001', 'KB-OPS-1012'] }, { q: 'Packet drop after CGNAT scale', helpful: false, evidence: ['SOP-CGN-013'] }].map((f, idx) => (
            <div key={idx} className="rounded-2xl border p-3">
              <div className="text-sm text-zinc-600">{f.q}</div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-zinc-500">Evidence:</span>
                {f.evidence.map(e => <Badge key={e} variant="secondary">{e}</Badge>)}
                <div className="ml-auto flex items-center gap-2">
                  {f.helpful ? <Badge><ThumbsUp className="mr-1 size-3"/>Helpful</Badge> : <Badge variant="destructive"><ThumbsDown className="mr-1 size-3"/>Not helpful</Badge>}
                  <Button size="sm" variant="outline">Mark for retrain</Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export default function IOHOpsAdminMVP() {
  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <Header />
      <main className="mx-auto w-full max-w-6xl space-y-4 p-4 lg:p-6">
        <motion.div layout className={`rounded-3xl bg-gradient-to-r p-4 ${gradient} border border-amber-200`}>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-gradient-to-r from-yellow-400 to-red-500" />
            <div>
              <div className="text-sm text-zinc-600">IOH · Meranti Cloud AI</div>
              <div className="text-lg font-semibold">Ops System Admin</div>
            </div>
          </div>
        </motion.div>

        <Tabs defaultValue="ingestion" className="space-y-4">
          <TabsList>
            <TabsTrigger value="ingestion"><UploadCloud className="mr-1 size-4"/>Ingestion</TabsTrigger>
            <TabsTrigger value="knowledge"><BookMarked className="mr-1 size-4"/>Knowledge</TabsTrigger>
            <TabsTrigger value="rag"><Settings className="mr-1 size-4"/>RAG Config</TabsTrigger>
            <TabsTrigger value="feedback"><Gauge className="mr-1 size-4"/>Feedback</TabsTrigger>
          </TabsList>

          <TabsContent value="ingestion"><IngestionPane/></TabsContent>
          <TabsContent value="knowledge"><KnowledgePane/></TabsContent>
          <TabsContent value="rag"><RAGConfigPane/></TabsContent>
          <TabsContent value="feedback"><FeedbackPane/></TabsContent>
        </Tabs>

        <div className="pt-2 text-[12px] text-zinc-500">MVP scope only • Matches Frontend defaults: top_k=4 · threshold=0.35 · rerank=on · chunk_size=800 · overlap=200</div>
      </main>
    </div>
  )
}
