'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

type Attribution = {
  id: string
  id_short: number
  phone: string
  name: string
  formatted_date: string // "11/01/2026"
  month_display: string  // "January 2026"
  amount: string | number
}

type MonthlyTotal = {
  month: string
  total: number
}

function getTodayDate() {
  return new Date().toISOString().split('T')[0]
}

export default function ChurchFundHistory() {
  const [attributions, setAttributions] = useState<Attribution[]>([])
  const [filterPhone, setFilterPhone] = useState('')
  const [loading, setLoading] = useState(false)
  
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 11)
    return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(getTodayDate())

  const fetchAttributions = async () => {
    if (filterPhone.trim().length === 0) {
      setAttributions([])
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/invoice-attributions?phone=${encodeURIComponent(filterPhone.trim())}`)
      if (!response.ok) throw new Error('Failed to fetch')

      const { attributions: data } = await response.json()

      const from = new Date(startDate)
      const to = new Date(endDate)

      // FIX: Parse the DD-MM-YYYY string into a Date object for filtering
      const filtered = data.filter((row: Attribution) => {
        const [day, month, year] = row.formatted_date.split('-').map(Number)
        const rowDate = new Date(year, month - 1, day)
        return rowDate >= from && rowDate <= to
      })

      setAttributions(filtered)
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getMonthlyTotals = (): MonthlyTotal[] => {
    const map = new Map<string, number>()
  
    for (const attr of attributions) {
      const monthStr = attr.month_display.trim().replace(/\s+/g, ' ') // Clean up extra spaces
      map.set(monthStr, (map.get(monthStr) || 0) + Number(attr.amount))
    }
  
    return Array.from(map.entries())
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => {
        // Sort by parsing the "Month Year" string
        return new Date(a.month).getTime() - new Date(b.month).getTime()
      })
  }

  const totalAmount = attributions.reduce((sum, a) => sum + Number(a.amount), 0)
  const monthlyTotals = getMonthlyTotals()

  useEffect(() => {
    fetchAttributions()
  }, [filterPhone, startDate, endDate])

  const downloadCSV = () => {
    if (attributions.length === 0) {
      alert('No records to export.')
      return
    }

    const headers = ['ID', 'Name', 'Attributed Month', 'Amount', 'Date']
    const rows = attributions.map(attr => [
      `#${attr.id_short}`,
      attr.name,
      attr.month_display,
      Number(attr.amount).toString(),
      attr.formatted_date
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(val => `"${val}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `church_fund_history_${filterPhone}.csv`
    a.click()

    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4 justify-between">
        <h2 className="text-xl font-semibold text-emerald-800">Church Fund History</h2>
        
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Phone Number</label>
            <Input
              placeholder="Phone number"
              value={filterPhone}
              onChange={e => setFilterPhone(e.target.value.replace(/\D/g, ''))}
              className="w-48"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">From</label>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">To</label>
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <div className="flex items-end pb-[2px]">
            <Button onClick={downloadCSV} variant="outline">
              ⬇️ Export CSV
            </Button>
          </div>
        </div>
      </div>

      {filterPhone.trim().length > 0 ? (
        <>


          <div className="border rounded-xl overflow-auto shadow-sm bg-white" style={{ height: 'calc(100vh - 200px)' }}>
            <table className="w-full text-sm relative">
              <thead className="sticky top-0 bg-gray-50 border-b z-10 shadow-sm">
                <tr>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Attributed Month</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-10">Loading...</td></tr>
                ) : attributions.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-10 text-gray-500">No records found for this date range.</td></tr>
                ) : (
                  attributions.map((attr, idx) => (
                    <tr key={idx} className="hover:bg-emerald-50/50 transition-colors">
                      <td className="px-4 py-3 text-gray-400">#{attr.id_short}</td>
                      <td className="px-4 py-3 font-medium">{attr.name}</td>
                      <td className="px-4 py-3 text-emerald-700 font-semibold">{attr.month_display}</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">₹{Number(attr.amount).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-gray-500">{attr.formatted_date}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-xl text-gray-400">
          Enter a phone number to fetch history.
        </div>
      )}
    </div>
  )
}