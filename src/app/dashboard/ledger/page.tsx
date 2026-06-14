'use client'

import { useState, useEffect } from 'react'

interface LedgerEntry {
  date: string;
  tagId: string;
  tagName: string;
  amount: number;
}

export default function LedgerPage() {
  const today = new Date().toISOString().split('T')[0]
  const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const [fromDate, setFromDate] = useState(lastMonth)
  const [toDate, setToDate] = useState(today)

  const [invoices, setInvoices] = useState<LedgerEntry[]>([])
  const [expenditures, setExpenditures] = useState<LedgerEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLedgerData()
  }, [])

  const fetchLedgerData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (fromDate) params.append('fromDate', fromDate)
      if (toDate) params.append('toDate', toDate)
      
      const res = await fetch(`/api/ledger?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch ledger data')
      const data = await res.json()
      setInvoices(data.invoices || [])
      setExpenditures(data.expenditures || [])
    } catch (error) {
      console.error(error)
      alert('Failed to fetch ledger data')
    } finally {
      setLoading(false)
    }
  }

  const downloadCSV = () => {
    const maxLen = Math.max(invoices.length, expenditures.length)
    
    // Header
    const rows = [
      ['Invoice Date', 'Invoice Tag', 'Invoice Amount', 'Expense Date', 'Expense Tag', 'Expense Amount']
    ]

    for (let i = 0; i < maxLen; i++) {
      const inv = invoices[i]
      const exp = expenditures[i]
      
      const invDate = inv?.date ? new Date(inv.date).toLocaleDateString() : ''
      const invTag = inv?.tagName || ''
      const invAmt = inv ? inv.amount.toString() : ''
      
      const expDate = exp?.date ? new Date(exp.date).toLocaleDateString() : ''
      const expTag = exp?.tagName || ''
      const expAmt = exp ? exp.amount.toString() : ''

      rows.push([
        `"${invDate}"`, `"${invTag}"`, `"${invAmt}"`,
        `"${expDate}"`, `"${expTag}"`, `"${expAmt}"`
      ])
    }

    const csvContent = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', 'ledger_export.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Ledger</h1>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">From:</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="border rounded px-2 py-1" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">To:</label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="border rounded px-2 py-1" />
          </div>
          <button
            onClick={fetchLedgerData}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded border"
          >
            Apply Filters
          </button>
          <button
            onClick={downloadCSV}
            disabled={loading || (invoices.length === 0 && expenditures.length === 0)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Download CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading ledger data...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Invoices */}
          <div className="bg-white p-4 rounded-lg shadow border">
            <h2 className="text-xl font-semibold mb-4 text-green-700">Invoices</h2>
            {invoices.length === 0 ? (
              <p className="text-gray-500">No invoice data available.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tag</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invoices.map((inv, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {new Date(inv.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {inv.tagName}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-900 font-medium">
                          {inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Expenditures */}
          <div className="bg-white p-4 rounded-lg shadow border">
            <h2 className="text-xl font-semibold mb-4 text-red-700">Expenditures</h2>
            {expenditures.length === 0 ? (
              <p className="text-gray-500">No expenditure data available.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tag</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {expenditures.map((exp, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {new Date(exp.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {exp.tagName}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-900 font-medium">
                          {exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
