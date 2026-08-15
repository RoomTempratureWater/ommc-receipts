'use client'

import { useState, useEffect } from 'react'

interface LedgerEntry {
  date: string;
  tagId: string;
  tagName: string;
  cashAmount: number;
  bankAmount: number;
  totalAmount: number;
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
      const aggregateData = (items: any[]) => {
        const map = new Map<string, LedgerEntry>()
        items.forEach(item => {
          const key = `${item.date}-${item.tagId}`
          if (!map.has(key)) {
            map.set(key, {
              date: item.date,
              tagId: item.tagId,
              tagName: item.tagName,
              cashAmount: 0,
              bankAmount: 0,
              totalAmount: 0
            })
          }
          const entry = map.get(key)!
          if (item.paymentType?.toLowerCase() === 'cash') {
            entry.cashAmount += item.amount
          } else {
            entry.bankAmount += item.amount
          }
          entry.totalAmount += item.amount
        })
        return Array.from(map.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      }

      setInvoices(aggregateData(data.invoices || []))
      setExpenditures(aggregateData(data.expenditures || []))
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
      [`"LEDGER from ${fromDate} to ${toDate}"`],
      [],
      ['Receipt Date', 'Receipt Tag', 'Rec Cash', 'Rec Bank', 'Rec Total', 'Expense Date', 'Expense Tag', 'Exp Cash', 'Exp Bank', 'Exp Total']
    ]

    for (let i = 0; i < maxLen; i++) {
      const inv = invoices[i]
      const exp = expenditures[i]
      
      const invDate = inv?.date ? new Date(inv.date).toLocaleDateString() : ''
      const invTag = inv?.tagName || ''
      const invCash = inv ? inv.cashAmount.toString() : ''
      const invBank = inv ? inv.bankAmount.toString() : ''
      const invTotal = inv ? inv.totalAmount.toString() : ''
      
      const expDate = exp?.date ? new Date(exp.date).toLocaleDateString() : ''
      const expTag = exp?.tagName || ''
      const expCash = exp ? exp.cashAmount.toString() : ''
      const expBank = exp ? exp.bankAmount.toString() : ''
      const expTotal = exp ? exp.totalAmount.toString() : ''

      rows.push([
        `"${invDate}"`, `"${invTag}"`, `"${invCash}"`, `"${invBank}"`, `"${invTotal}"`,
        `"${expDate}"`, `"${expTag}"`, `"${expCash}"`, `"${expBank}"`, `"${expTotal}"`
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

  const invoiceCash = invoices.reduce((sum, i) => sum + i.cashAmount, 0);
  const invoiceBank = invoices.reduce((sum, i) => sum + i.bankAmount, 0);
  const expCash = expenditures.reduce((sum, e) => sum + e.cashAmount, 0);
  const expBank = expenditures.reduce((sum, e) => sum + e.bankAmount, 0);

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

      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-green-50 p-4 rounded-lg shadow-sm border border-green-100">
            <h3 className="text-green-800 text-sm font-medium">Total Receipts (Cash)</h3>
            <p className="text-2xl font-bold text-green-900">{invoiceCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg shadow-sm border border-green-100">
            <h3 className="text-green-800 text-sm font-medium">Total Receipts (Bank)</h3>
            <p className="text-2xl font-bold text-green-900">{invoiceBank.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg shadow-sm border border-red-100">
            <h3 className="text-red-800 text-sm font-medium">Total Expenditures (Cash)</h3>
            <p className="text-2xl font-bold text-red-900">{expCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg shadow-sm border border-red-100">
            <h3 className="text-red-800 text-sm font-medium">Total Expenditures (Bank)</h3>
            <p className="text-2xl font-bold text-red-900">{expBank.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10">Loading ledger data...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Receipts */}
          <div className="bg-white p-4 rounded-lg shadow border">
            <h2 className="text-xl font-semibold mb-4 text-green-700">Receipts</h2>
            {invoices.length === 0 ? (
              <p className="text-gray-500">No receipt data available.</p>
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
                          <div className="flex flex-col text-xs text-gray-500 font-normal mb-1">
                            <span>Cash: {inv.cashAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            <span>Bank: {inv.bankAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                          <span className="font-bold text-sm">
                            Total: {inv.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
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
                          <div className="flex flex-col text-xs text-gray-500 font-normal mb-1">
                            <span>Cash: {exp.cashAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            <span>Bank: {exp.bankAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                          <span className="font-bold text-sm">
                            Total: {exp.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
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
