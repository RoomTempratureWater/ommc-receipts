'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Card } from '@/components/ui/card'

interface Tag {
  tag_id: string
  tag_name: string
}

interface Record {
  tag: string
  payment_type: string
  amount: number
}

export default function BalanceSheet() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [invoiceTagsList, setInvoiceTagsList] = useState<Tag[]>([])
  const [expenseTagsList, setExpenseTagsList] = useState<Tag[]>([])

  const [invoiceRecords, setInvoiceRecords] = useState<Record[]>([])
  const [expenseRecords, setExpenseRecords] = useState<Record[]>([])

  const [selectedInvoiceTags, setSelectedInvoiceTags] = useState<string[]>([])
  const [selectedExpenseTags, setSelectedExpenseTags] = useState<string[]>([])

  const [actualCash, setActualCash] = useState<number>(0)
  const [actualBank, setActualBank] = useState<number>(0)

  // Load tags from separate tables
  useEffect(() => {
    const loadTags = async () => {
      try {
        const response = await fetch('/api/tags')
        if (!response.ok) throw new Error('Failed to fetch tags')
        const { invoiceTags, expenseTags } = await response.json()

        setInvoiceTagsList(invoiceTags)
        setSelectedInvoiceTags(invoiceTags.map((t: any) => t.tag_id))
        setExpenseTagsList(expenseTags)
        setSelectedExpenseTags(expenseTags.map((t: any) => t.tag_id))
      } catch (error) {
        console.error('Error loading tags:', error)
      }
    }
    loadTags()
  }, [])

  // Load records when dates change
  useEffect(() => {
    const fetchData = async () => {
      if (!startDate || !endDate) return

      try {
        // Fetch invoice data
        const invoiceParams = new URLSearchParams()
        invoiceParams.append('startDate', startDate)
        invoiceParams.append('endDate', endDate)
        const invoiceResponse = await fetch(`/api/invoices?${invoiceParams.toString()}`)
        if (!invoiceResponse.ok) throw new Error('Failed to fetch invoices')
        const { invoices } = await invoiceResponse.json()
        
        // Fetch expense data
        const expenseParams = new URLSearchParams()
        expenseParams.append('startDate', startDate)
        expenseParams.append('endDate', endDate)
        const expenseResponse = await fetch(`/api/expenditures?${expenseParams.toString()}`)
        if (!expenseResponse.ok) throw new Error('Failed to fetch expenditures')
        const { expenditures } = await expenseResponse.json()

        // Extract only the fields we need
        const invoiceData = invoices.map((inv: any) => ({
          tag: inv.tag,
          payment_type: inv.payment_type,
          amount: inv.amount
        }))
        const expenseData = expenditures.map((exp: any) => ({
          tag: exp.tag,
          payment_type: exp.payment_type,
          amount: exp.amount
        }))

        setInvoiceRecords(invoiceData)
        setExpenseRecords(expenseData)

        // Call the PostgreSQL function via API
        const actualResponse = await fetch(`/api/invoices/stats?type=balance&endDate=${endDate}`)
        if (actualResponse.ok) {
          const { data } = await actualResponse.json()
          const result = data as any[]
          const cash = result.find((r: any) => r.payment_group === 'cash')?.total_amount || 0
          const bank = result.find((r: any) => r.payment_group === 'bank')?.total_amount || 0
          setActualCash(cash)
          setActualBank(bank)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
  }, [startDate, endDate])

  const groupByTagAndType = (data: Record[], selectedTags: string[]) => {
    const totals: Record<string, { cash: number; bank: number }> = {}

    for (const entry of data) {
      if (!selectedTags.includes(entry.tag)) continue
      if (!totals[entry.tag]) totals[entry.tag] = { cash: 0, bank: 0 }

      const isCash = entry.payment_type === 'cash'
      const amount = Number(entry.amount) || 0 // Ensure amount is a number
      if (isCash) totals[entry.tag].cash += amount
      else totals[entry.tag].bank += amount
    }

    return totals
  }

  const invoiceTotals = groupByTagAndType(invoiceRecords, selectedInvoiceTags)
  const expenseTotals = groupByTagAndType(expenseRecords, selectedExpenseTags)

  const totalInvoiceCash = Object.values(invoiceTotals).reduce((sum, t) => sum + t.cash, 0)
  const totalInvoiceBank = Object.values(invoiceTotals).reduce((sum, t) => sum + t.bank, 0)
  const totalExpenseCash = Object.values(expenseTotals).reduce((sum, t) => sum + t.cash, 0)
  const totalExpenseBank = Object.values(expenseTotals).reduce((sum, t) => sum + t.bank, 0)

  const netCash = totalInvoiceCash - totalExpenseCash
  const netBank = totalInvoiceBank - totalExpenseBank

  const downloadCSV = () => {
    let csv = `Balance Sheet Report (${startDate} to ${endDate})\n\n`

    csv += `Invoices\nTag,Cash,Bank\n`
    Object.entries(invoiceTotals).forEach(([tagId, { cash, bank }]) => {
      const tagName = tags.find(t => t.tag_id === tagId)?.tag_name || tagId
      csv += `${tagName},${cash},${bank}\n`
    })
    csv += `Total,${totalInvoiceCash},${totalInvoiceBank}\n\n`

    csv += `Expenditures\nTag,Cash,Bank\n`
    Object.entries(expenseTotals).forEach(([tagId, { cash, bank }]) => {
      const tagName = tags.find(t => t.tag_id === tagId)?.tag_name || tagId
      csv += `${tagName},${cash},${bank}\n`
    })
    csv += `Total,${totalExpenseCash},${totalExpenseBank}\n\n`

    csv += `Summary\n`
    csv += `Current Cash Difference,${netCash}\n`
    csv += `Current Bank Difference,${netBank}\n`
    csv += `Actual Cash Till Date,${actualCash}\n`
    csv += `Actual Bank Till Date,${actualBank}\n`

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `balance_sheet_${startDate}_to_${endDate}.csv`)
    link.click()
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h2 className="text-2xl font-semibold text-center">Balance Sheet</h2>

      <div className="flex gap-4 flex-wrap items-end">
        <div>
          <Label>Start Date</Label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div>
          <Label>End Date</Label>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <Button onClick={downloadCSV} disabled={!startDate || !endDate}>
          Download CSV
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Invoices */}
        <Card className="flex-1 p-4">
          <h3 className="font-semibold mb-2">Invoices</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="mb-2">
                Invoice Tags ({selectedInvoiceTags.length})
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="p-2 max-h-64 overflow-auto space-y-2">
              {invoiceTagsList.map(tag => (
                <div key={tag.tag_id} className="flex items-center gap-2 px-2">
                  <Checkbox
                    checked={selectedInvoiceTags.includes(tag.tag_id)}
                    onCheckedChange={() => {
                      setSelectedInvoiceTags(prev =>
                        prev.includes(tag.tag_id)
                          ? prev.filter(t => t !== tag.tag_id)
                          : [...prev, tag.tag_id]
                      )
                    }}
                  />
                  <span className="text-sm">{tag.tag_name}</span>
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <table className="w-full mt-2 text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-1">Tag</th>
                <th className="text-right py-1">Cash</th>
                <th className="text-right py-1">Bank</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(invoiceTotals).map(([tagId, { cash, bank }]) => {
                const tagName = invoiceTagsList.find(t => t.tag_id === tagId)?.tag_name || tagId
                return (
                  <tr key={tagId}>
                    <td>{tagName}</td>
                    <td className="text-right">₹{cash.toLocaleString()}</td>
                    <td className="text-right">₹{bank.toLocaleString()}</td>
                  </tr>
                )
              })}
              <tr className="border-t font-semibold">
                <td>Total</td>
                <td className="text-right">₹{totalInvoiceCash.toLocaleString()}</td>
                <td className="text-right">₹{totalInvoiceBank.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </Card>

        {/* Expenditures */}
        <Card className="flex-1 p-4">
          <h3 className="font-semibold mb-2">Expenditures</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="mb-2">
                Expense Tags ({selectedExpenseTags.length})
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="p-2 max-h-64 overflow-auto space-y-2">
              {expenseTagsList.map(tag => (
                <div key={tag.tag_id} className="flex items-center gap-2 px-2">
                  <Checkbox
                    checked={selectedExpenseTags.includes(tag.tag_id)}
                    onCheckedChange={() => {
                      setSelectedExpenseTags(prev =>
                        prev.includes(tag.tag_id)
                          ? prev.filter(t => t !== tag.tag_id)
                          : [...prev, tag.tag_id]
                      )
                    }}
                  />
                  <span className="text-sm">{tag.tag_name}</span>
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <table className="w-full mt-2 text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-1">Tag</th>
                <th className="text-right py-1">Cash</th>
                <th className="text-right py-1">Bank</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(expenseTotals).map(([tagId, { cash, bank }]) => {
                const tagName = expenseTagsList.find(t => t.tag_id === tagId)?.tag_name || tagId
                return (
                  <tr key={tagId}>
                    <td>{tagName}</td>
                    <td className="text-right">₹{cash.toLocaleString()}</td>
                    <td className="text-right">₹{bank.toLocaleString()}</td>
                  </tr>
                )
              })}
              <tr className="border-t font-semibold">
                <td>Total</td>
                <td className="text-right">₹{totalExpenseCash.toLocaleString()}</td>
                <td className="text-right">₹{totalExpenseBank.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </Card>
      </div>

      {/* Summary */}
      <Card className="max-w-xl mx-auto p-4 mt-6 shadow-md space-y-4">
        <h4 className="text-lg font-semibold text-center">Summary</h4>
        <div className="flex justify-between text-base font-medium">
          <span>Current Cash Difference</span>
          <span className={netCash >= 0 ? 'text-green-600' : 'text-red-600'}>₹{netCash.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-base font-medium">
          <span>Current Bank Difference</span>
          <span className={netBank >= 0 ? 'text-green-600' : 'text-red-600'}>₹{netBank.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-base font-medium border-t pt-2">
          <span>Actual Cash Till Date</span>
          <span className={actualCash >= 0 ? 'text-green-700' : 'text-red-700'}>₹{actualCash.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-base font-medium">
          <span>Actual Bank Till Date</span>
          <span className={actualBank >= 0 ? 'text-green-700' : 'text-red-700'}>₹{actualBank.toLocaleString()}</span>
        </div>
      </Card>
    </div>
  )
}
