'use client'

import { useState } from 'react'

interface ReportUser {
  name: string
  phone: string | null
  months: Record<string, number>
  total: number
}

function getMonthsBetween(start: string, end: string) {
  const months = []
  let curr = new Date(start + '-01T00:00:00Z')
  const endDate = new Date(end + '-01T00:00:00Z')
  
  while (curr <= endDate) {
    const monthStr = curr.toISOString().substring(0, 7) // 'YYYY-MM'
    months.push(monthStr)
    curr.setUTCMonth(curr.getUTCMonth() + 1)
  }
  return months
}

function formatMonthDisplay(yyyyMm: string) {
  return new Date(yyyyMm + '-01T00:00:00Z').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export default function ChurchFundReportPage() {
  const currentMonth = new Date().toISOString().substring(0, 7)
  const [startMonth, setStartMonth] = useState(currentMonth)
  const [endMonth, setEndMonth] = useState(currentMonth)
  
  const [reportData, setReportData] = useState<ReportUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [generatedMonths, setGeneratedMonths] = useState<string[]>([])

  const generateReport = async () => {
    if (!startMonth || !endMonth) {
      setError('Please select both start and end months')
      return
    }
    if (startMonth > endMonth) {
      setError('Start month must be before or equal to end month')
      return
    }

    try {
      setLoading(true)
      setError('')
      const res = await fetch(`/api/reports/church-fund?startMonth=${startMonth}&endMonth=${endMonth}`)
      if (!res.ok) {
        throw new Error('Failed to fetch report data')
      }
      
      const { report } = await res.json()
      setReportData(report)
      setGeneratedMonths(getMonthsBetween(startMonth, endMonth))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const downloadCSV = () => {
    if (reportData.length === 0) return

    // Header row
    const headers = ['Name', 'Phone', ...generatedMonths.map(formatMonthDisplay), 'Total']
    
    // Data rows
    const rows = reportData.map(user => {
      const row = [
        `"${user.name}"`, 
        `"${user.phone || ''}"`
      ]
      generatedMonths.forEach(m => {
        row.push(user.months[m]?.toString() || '0')
      })
      row.push(user.total.toString())
      return row
    })

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `church_fund_report_${startMonth}_to_${endMonth}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Church Fund Report</h1>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Start Month:</label>
            <input 
              type="month" 
              value={startMonth} 
              onChange={e => setStartMonth(e.target.value)} 
              className="border rounded px-2 py-1" 
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">End Month:</label>
            <input 
              type="month" 
              value={endMonth} 
              onChange={e => setEndMonth(e.target.value)} 
              className="border rounded px-2 py-1" 
            />
          </div>
          <button
            onClick={generateReport}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
          <button
            onClick={downloadCSV}
            disabled={reportData.length === 0 || loading}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 border px-4 py-2 rounded disabled:opacity-50"
          >
            Download CSV
          </button>
        </div>
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {reportData.length > 0 ? (
        <div className="bg-white rounded-lg shadow border overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 border-r">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 border-r" style={{ left: '150px' }}>
                  Phone
                </th>
                {generatedMonths.map(m => (
                  <th key={m} className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    {formatMonthDisplay(m)}
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider bg-blue-50 border-l">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.map((user, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium whitespace-nowrap sticky left-0 bg-white border-r z-10">
                    {user.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap sticky left-0 bg-white border-r z-10" style={{ left: '150px' }}>
                    {user.phone || '-'}
                  </td>
                  {generatedMonths.map(m => (
                    <td key={m} className="px-4 py-3 text-sm text-gray-900 text-right whitespace-nowrap">
                      {user.months[m] ? user.months[m].toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-sm text-blue-900 font-bold text-right whitespace-nowrap bg-blue-50/50 border-l">
                    {user.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !loading && !error && (
          <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
            Select a date range and click Generate Report to see data.
          </div>
        )
      )}
    </div>
  )
}
