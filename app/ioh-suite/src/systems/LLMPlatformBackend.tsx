import React, { useEffect, useState } from 'react'
import { Cpu, Gauge, Image as ImageIcon, Key, LineChart, Power, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { CartesianGrid, Line, LineChart as ReLineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export default function IOHStage1MVP() {
  const [prompt, setPrompt] = useState('')
  const [resp, setResp] = useState<string | null>(null)
  const [imgUrl, setImgUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [model, setModel] = useState<'llama' | 'diffusion'>('llama')

  // mock realtime feed data
  const [feedData, setFeedData] = useState(Array.from({ length: 10 }, (_, i) => ({
    time: i,
    latency: 1.5 + Math.random() * 0.4,
    qps: 35 + Math.random() * 10,
    errors: Math.random() * 0.5,
  })))

  useEffect(() => {
    const interval = setInterval(() => {
      setFeedData((prev) => {
        const next = [...prev.slice(1), {
          time: prev[prev.length - 1].time + 1,
          latency: 1.5 + Math.random() * 0.4,
          qps: 35 + Math.random() * 10,
          errors: Math.random() * 0.5,
        }]
        return next
      })
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const onInfer = async () => {
    setLoading(true)
    setResp(null)
    setImgUrl(null)
    await new Promise(r => setTimeout(r, 1000))

    const defaultPrompt = prompt.trim() || (model === 'llama' ? 'Explain the benefits of AI for telecom operations.' : 'A futuristic digital city skyline at sunset, cyberpunk style')

    if (model === 'llama') {
      const fakeText = `Prompt: ${defaultPrompt}\n\nGenerated Response:\nArtificial Intelligence greatly enhances telecom operations by automating network monitoring, predicting failures, and optimizing resources in real time. This reduces downtime and improves customer satisfaction.\n\nLatency: 1.6s  |  Accuracy: 96.3%`
      setResp(fakeText)
    }
    else {
      const fakeImage = 'https://picsum.photos/seed/IOH_AI_Diffusion/512/512'
      setImgUrl(fakeImage)
      const fakeText = `Prompt: ${defaultPrompt}\n\nGenerated Image Info:\n- Resolution: 512×512\n- Steps: 15  |  CFG: 6.5  |  Seed: 20251029\n- P95 Latency: 9.1s  |  Fail Rate: 0.6%`
      setResp(fakeText)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-dvh bg-white">
      <div className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-xl bg-gradient-to-r from-yellow-300 to-red-500" />
            <div>
              <div className="text-xs text-zinc-500">IOH · Meranti Cloud</div>
              <div className="font-semibold">Model Platform Admin — Stage-1 MVP</div>
            </div>
            <Badge className="ml-2 bg-black text-white">Huawei Cloud CCE</Badge>
          </div>
          {/* <div className="text-xs text-zinc-500">Prototype • Phase-1 Deliverable</div> */}
        </div>
      </div>

      <main className="mx-auto max-w-6xl p-4 lg:p-6">
        <Tabs defaultValue="status" className="space-y-4">
          <TabsList style={{ background: 'whitesmoke' }}>
            <TabsTrigger value="status" className="gap-2"><Gauge className="size-4" />Status</TabsTrigger>
            <TabsTrigger value="infer" className="gap-2"><Sparkles className="size-4" />Infer</TabsTrigger>
            <TabsTrigger value="monitor" className="gap-2"><LineChart className="size-4" />Monitoring</TabsTrigger>
          </TabsList>

          {/* 时间范围选择器  按月/按周 默认最近1小时，可选1天/1周）筛选*/}
          <div className="flex items-center justify-end py-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">time range:</span>
              <Select defaultValue="hour">
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ background: '#fff' }}>
                  <SelectItem value="hour">last hour</SelectItem>
                  <SelectItem value="day">last 1 day</SelectItem>
                  <SelectItem value="week">last 1 week</SelectItem>
                  <SelectItem value="month">last month</SelectItem>
                  <SelectItem value="year">last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value="status" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Cpu className="size-4" />GPU Node</CardTitle>
                  <CardDescription>ap-jakarta-1 · A100 80G</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>Utilization</div>
                  <Progress value={72} />
                  <div className="mt-2">Memory</div>
                  <Progress value={65} />
                  <div className="mt-2">Temperature</div>
                  <div>69°C</div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Serving (LLM)</CardTitle>
                  <CardDescription>LLaMA · 3.1-Instruct</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center justify-between"><span>P95 Latency</span><span>1.8s</span></div>
                  <Progress value={86} />
                  <div className="mt-2 flex items-center justify-between"><span>Fail Rate</span><span>0.4%</span></div>
                  <Progress value={99} />
                  <div className="mt-3 flex items-center gap-2 text-xs text-zinc-600">
                    <Power className="size-3" /> Status: <Badge className='bg-black text-white'>Running</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Serving (Diffusion)</CardTitle>
                  <CardDescription>SDXL-Turbo · preset mobile</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center justify-between"><span>P95 Latency</span><span>9.1s</span></div>
                  <Progress value={75} />
                  <div className="mt-2 flex items-center justify-between"><span>Fail Rate</span><span>0.6%</span></div>
                  <Progress value={98} />
                  <div className="mt-3 flex items-center gap-2 text-xs text-zinc-600">
                    <Power className="size-3" /> Status: <Badge className='bg-black text-white'>Running</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>API Endpoint</CardTitle>
                <CardDescription>Single minimal endpoint for Phase-1</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 text-sm md:grid-cols-2">
                <div>
                  <div className="rounded-xl border bg-zinc-50 p-3 font-mono text-xs">
                    POST /infer {'{ model: \'llama\' | \'diffusion\', prompt: string }'}
                  </div>
                  <div className="mt-2 text-xs text-zinc-500">Response (LLM): {'{ text, latency_ms }'} · Response (Diffusion): {'{ job_id, eta_s, seed }'}</div>
                </div>
                <div>
                  <div className="flex items-center gap-2"><Key className="size-4" /><span className="font-semibold">API Key</span></div>
                  <div className="mt-2 select-all rounded-xl border bg-zinc-50 p-3 font-mono text-xs">key_stage1_prod_****_0aa</div>
                  <div className="mt-2 text-xs text-zinc-500">Scope: inference · Rate-limit: 50 rps (mock)</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="infer" className="space-y-4">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Sparkles className="size-4" />Try /infer</CardTitle>
                <CardDescription>Phase-1 Mock Demo — Text or Image generation</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="grid grid-cols-3 items-center gap-2">
                  <Label>Model</Label>
                  <div className="col-span-2 flex gap-2">
                    <Button size="sm" variant={model === 'llama' ? 'default' : 'outline'} onClick={() => setModel('llama')}>LLaMA</Button>
                    <Button size="sm" variant={model === 'diffusion' ? 'default' : 'outline'} onClick={() => setModel('diffusion')}>Diffusion</Button>
                  </div>
                </div>
                <div className="grid grid-cols-3 items-start gap-2">
                  <Label>Prompt</Label>
                  <Textarea className="col-span-2 min-h-28" placeholder={model === 'llama' ? 'Ask a question…' : 'Describe an image…'} value={prompt} onChange={e => setPrompt(e.target.value)} />
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={onInfer} disabled={loading}>{loading ? 'Running…' : 'Send /infer'}</Button>
                  <Button variant="outline" onClick={() => { setPrompt(''); setResp(null); setImgUrl(null) }}>Clear</Button>
                </div>
                {loading && (<div className="text-xs text-zinc-500">Invoking container (mock)…</div>)}
                {resp && (
                  <div className="mt-3 space-y-3">
                    <div className="whitespace-pre-wrap rounded-xl border bg-zinc-50 p-3 font-mono text-xs">{resp}</div>
                    {imgUrl && (
                      <div className="flex flex-col items-center">
                        <ImageIcon className="mb-1 size-4 text-zinc-600" />
                        <img src={imgUrl} alt="AI generated" className="h-64 w-64 rounded-xl border object-cover" />
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitor" className="space-y-4">
            <div className="grid md:grid-cols-4 gap-3" style={{ 'gridTemplateColumns': 'repeat(4, minmax(0, 1fr))' }}>
              <MiniKpi label="LLM P95" value="1.78 s" target="≤ 2 s" ok />
              <MiniKpi label="Data IO Accuracy" value="96.1%" target=">= 95%" ok />
              <MiniKpi label="AI-Draw P95" value="8.9 s" target="≤ 12 s" ok />
              <MiniKpi label="Fail Rate" value="0.41%" target="≤ 1%" ok />
            </div>
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><LineChart className="size-4" />Realtime Feed</CardTitle>
                <CardDescription>Latency / QPS / Errors (mock data)</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ReLineChart data={feedData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="left" orientation="left" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line yAxisId="left" type="monotone" dataKey="latency" stroke="#f97316" dot={false} name="Latency (s)" />
                    <Line yAxisId="right" type="monotone" dataKey="qps" stroke="#10b981" dot={false} name="QPS" />
                    <Line yAxisId="right" type="monotone" dataKey="errors" stroke="#ef4444" dot={false} name="Errors (%)" />
                  </ReLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="pt-2 text-[11px] text-zinc-500">MVP Scope • Text + Image generation defaults ready for demo</div>
      </main>
    </div>
  )
}

function MiniKpi({ label, value, target, ok }: { label: string; value: string; target: string; ok?: boolean }) {
  return (
    <Card className="border-zinc-200 shadow-sm">
      <CardHeader className="pb-2">
        <CardDescription className="text-xs text-zinc-500">{label}</CardDescription>
        <CardTitle className="text-xl">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-xs ${ok ? 'text-emerald-600' : 'text-red-600'}`}>Target {target}</div>
      </CardContent>
    </Card>
  )
}
