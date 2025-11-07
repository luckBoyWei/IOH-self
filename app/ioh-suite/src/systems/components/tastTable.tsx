'use client'

import React, { useMemo, useState } from 'react'
import { Table } from 'antd'

type DataItem = {
  key: number
  name: string
  status: string
  updatedAt: string
  value: number
}

function genRandomData(count = 57): DataItem[] {
  return Array.from({ length: count }, (_, i) => ({
    key: i + 1,
    name: `Model #${i + 1}`,
    status: Math.random() > 0.15 ? 'Running' : 'Stopped',
    updatedAt: new Date(Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24)).toLocaleString(),
    value: Math.round(Math.random() * 100),
  }))
}

export default function TastTable() {
  const data = useMemo(() => genRandomData(57), [])

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: data.length,
  })

  const columns = [
    {
      title: 'ID',
      dataIndex: 'key',
      key: 'key',
      width: 80,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => (
        <span style={{ color: v === 'Running' ? '#16a34a' : '#ef4444' }}>{v}</span>
      ),
    },
    {
      title: 'Updated At',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
    },
    {
      title: 'Util %',
      dataIndex: 'value',
      key: 'value',
      width: 120,
      render: (v: number) => <strong>{v}%</strong>,
    },
  ]

  const handleTableChange = (pag: any) => {
    setPagination({ ...pagination, current: pag.current, pageSize: pag.pageSize })
  }

  return (
    <div className="w-full">
      <Table<DataItem>
        columns={columns}
        dataSource={data}
        pagination={pagination}
        onChange={pag => handleTableChange(pag)}
        rowKey="key"
      />
    </div>
  )
}
