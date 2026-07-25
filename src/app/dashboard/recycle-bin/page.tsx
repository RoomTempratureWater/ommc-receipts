'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type DeletedRecord = {
  id: string
  record_id: string
  record_type: string
  record_data: any
  deleted_by: string | null
  deleted_at: string
  users?: {
    email: string | null
  } | null
}

function formatDateTime(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleString('en-IN')
}

export default function RecycleBinPage() {
  const [records, setRecords] = useState<DeletedRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const response = await fetch('/api/recycle-bin')
        if (!response.ok) throw new Error('Failed to fetch deleted records')
        const data = await response.json()
        setRecords(data.records)
      } catch (error) {
        console.error('Error fetching records:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchRecords()
  }, [])

  return (
    <div className="w-full p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Recycle Bin</h1>
      <p className="text-gray-500">View records that have been deleted from the system.</p>

      {loading ? (
        <div className="text-center py-10">Loading...</div>
      ) : records.length === 0 ? (
        <div className="p-4 text-center text-gray-500 border rounded bg-white">No deleted records found.</div>
      ) : (
        <div className="overflow-x-auto border rounded bg-white shadow-sm" style={{ height: 'calc(100vh - 200px)' }}>
          <table className="min-w-full text-sm table-auto border-collapse">
            <thead className="bg-gray-50 border-b sticky top-0 z-10">
              <tr>
                <th className="border px-4 py-3 text-left">Table Name</th>
                <th className="border px-4 py-3 text-left">Deleted By</th>
                <th className="border px-4 py-3 text-left">Date of Deletion</th>
                <th className="border px-4 py-3 text-left">JSON Data</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {records.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="border px-4 py-3 font-medium capitalize">{item.record_type.toLowerCase()}</td>
                  <td className="border px-4 py-3 text-gray-600">{item.users?.email || item.deleted_by || 'Unknown'}</td>
                  <td className="border px-4 py-3 text-gray-500 whitespace-nowrap">{formatDateTime(item.deleted_at)}</td>
                  <td className="border px-4 py-3">
                    <pre className="text-xs text-gray-600 bg-gray-100 p-2 rounded max-h-40 overflow-y-auto whitespace-pre-wrap max-w-2xl break-words">
                      {JSON.stringify(item.record_data, null, 2)}
                    </pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
