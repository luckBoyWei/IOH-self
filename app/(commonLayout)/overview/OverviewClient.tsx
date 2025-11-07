'use client'

import dynamic from 'next/dynamic'
import React from 'react'

const IOHStage1MVP = dynamic(() => import('../../ioh-suite/src/systems/LLMPlatformBackend'), { ssr: false })

export default function OverviewClient() {
  return (
    <div className="bg-white aaa" style={{ maxWidth: '80rem', margin: '0 auto' }}>
      <IOHStage1MVP />
    </div>
  )
}