'use client'

import { useEffect, useState } from 'react'
import Papa from 'papaparse'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'

interface Tag {
  tag_id: string
  tag_name: string
}

interface Expenditure {
  id: string
  title: string
  amount: number
  payment_type: string
  payment_reference?: string
  tag: string
  date: string
  image_url?: string
  signed_image_url?: string | null
  actual_amt_credit_dt: string | null
  users?: {
    email: string | null
  } | null
}

function formatDateDDMMYYYY(dateStr: string | null | undefined) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function ExpenditureHistory() {
  const [expenditures, setExpenditures] = useState<Expenditure[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [allSelected, setAllSelected] = useState(true)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })
  const [paymentRefFilter, setPaymentRefFilter] = useState('')
  const [showPendingCheques, setShowPendingCheques] = useState(false)
  const [filterEmail, setFilterEmail] = useState('')
  const [filterId, setFilterId] = useState('')
  const [filterTitle, setFilterTitle] = useState('')
  const [filterPaymentType, setFilterPaymentType] = useState('__all__')
  const [filterMinAmount, setFilterMinAmount] = useState('')
  const [filterMaxAmount, setFilterMaxAmount] = useState('')

  useEffect(() => {
    const init = async () => {
      try {
        const response = await fetch('/api/tags')
        if (!response.ok) throw new Error('Failed to fetch tags')
        const { expenseTags } = await response.json()
        setTags(expenseTags)
        setSelectedTags(expenseTags.map((t: any) => t.tag_id))
        setAllSelected(true)
      } catch (error) {
        console.error('Error fetching tags:', error)
      }
    }
    init()
  }, [])

  useEffect(() => {
    const fetchExpenditures = async () => {
      try {
        const params = new URLSearchParams()
        if (startDate) params.append('startDate', startDate)
        if (endDate) params.append('endDate', endDate)
        if (selectedTags.length) params.append('tags', selectedTags.join(','))
        if (paymentRefFilter) params.append('paymentRef', paymentRefFilter)
        if (showPendingCheques) params.append('onlyPendingCredit', 'true')
        if (filterEmail.trim()) params.append('email', filterEmail.trim())
        if (filterId.trim()) params.append('id', filterId.trim())
        if (filterTitle.trim()) params.append('title', filterTitle.trim())
        if (filterPaymentType && filterPaymentType !== '__all__') params.append('paymentType', filterPaymentType)
        if (filterMinAmount.trim()) params.append('minAmount', filterMinAmount.trim())
        if (filterMaxAmount.trim()) params.append('maxAmount', filterMaxAmount.trim())

        const response = await fetch(`/api/expenditures?${params.toString()}`)
        if (!response.ok) throw new Error('Failed to fetch expenditures')
        const { expenditures } = await response.json()

        // For now, we'll skip the image signing since we're not using Supabase storage
        // TODO: Implement file storage solution
        const signed = expenditures.map((exp: any) => ({
          ...exp,
          signed_image_url: exp.image_url, // Use image_url instead of file_path
        }))

        setExpenditures(signed)
      } catch (error) {
        console.error('Error fetching expenditures:', error)
      }
    }

    fetchExpenditures()
  }, [startDate, endDate, selectedTags, paymentRefFilter, showPendingCheques, filterEmail, filterId, filterTitle, filterPaymentType, filterMinAmount, filterMaxAmount])

  const toggleTag = (tagId: string) => {
    const updated = selectedTags.includes(tagId)
      ? selectedTags.filter(t => t !== tagId)
      : [...selectedTags, tagId]
    setSelectedTags(updated)
    setAllSelected(updated.length === tags.length)
  }

  const toggleAllTags = () => {
    if (allSelected) {
      setSelectedTags([])
      setAllSelected(false)
    } else {
      setSelectedTags(tags.map(t => t.tag_id))
      setAllSelected(true)
    }
  }

  const updateCreditDate = async (id: string, newDate: string | null) => {
    if (!window.confirm('Are you sure you want to update the credit date?')) return
    try {
      const response = await fetch('/api/expenditures', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          actual_amt_credit_dt: newDate ? new Date(newDate) : null
        })
      })
      
      if (!response.ok) throw new Error('Failed to update expenditure')
      
      setExpenditures(prev => prev.map(exp => exp.id === id ? { ...exp, actual_amt_credit_dt: newDate } : exp))
    } catch (error) {
      console.error('Error updating credit date:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expenditure?')) return
    try {
      const response = await fetch(`/api/expenditures?id=${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete expenditure')
      
      setExpenditures(prev => prev.filter(exp => exp.id !== id))
    } catch (error) {
      console.error('Error deleting expenditure:', error)
    }
  }

  const handleExportCSV = () => {
    if (!expenditures.length) return alert('No expenditures to export')

    const csvData = expenditures.map(exp => ({
      'Expense ID': exp.id.substring(0, 8),
      Title: exp.title,
      'Created By': exp.users?.email || 'System',
      'Payment Type': exp.payment_type,
      'Payment Reference': exp.payment_reference || '',
      'Amount (₹)': exp.amount,
      Date: formatDateDDMMYYYY(exp.date),
      'Debited On': formatDateDDMMYYYY(exp.actual_amt_credit_dt)
    }))

    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `expenditures_export_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleResetFilters = () => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    setStartDate(d.toISOString().split('T')[0])
    setEndDate(new Date().toISOString().split('T')[0])
    setPaymentRefFilter('')
    setShowPendingCheques(false)
    setFilterEmail('')
    setFilterId('')
    setFilterTitle('')
    setFilterPaymentType('__all__')
    setFilterMinAmount('')
    setFilterMaxAmount('')
    setSelectedTags(tags.map(t => t.tag_id))
    setAllSelected(true)
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-4 justify-center">
        <h2 className="text-2xl font-semibold text-center">Expenditure History</h2>
        <Button variant="outline" size="sm" onClick={handleResetFilters}>Reset Filters</Button>
        <Button variant="outline" size="sm" onClick={handleExportCSV}>Export CSV</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <Label>Start Date</Label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div>
          <Label>End Date</Label>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <div>
          <Label>Payment Ref</Label>
          <Input value={paymentRefFilter} onChange={e => setPaymentRefFilter(e.target.value)} placeholder="Filter by ref" />
        </div>
        <div>
          <Label>Creator Email</Label>
          <Input value={filterEmail} onChange={e => setFilterEmail(e.target.value)} placeholder="Search by email" />
        </div>
        <div>
          <Label>Expense ID</Label>
          <Input value={filterId} onChange={e => setFilterId(e.target.value)} placeholder="Search ID" className="w-24" />
        </div>
        <div>
          <Label>Title</Label>
          <Input value={filterTitle} onChange={e => setFilterTitle(e.target.value)} placeholder="Search title" />
        </div>
        <div>
          <Label>Payment Type</Label>
          <select 
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={filterPaymentType}
            onChange={e => setFilterPaymentType(e.target.value)}
          >
            <option value="__all__">All</option>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="bank">Bank</option>
            <option value="cheque">Cheque</option>
            <option value="card">Card</option>
          </select>
        </div>
        <div>
          <Label>Min Amount (₹)</Label>
          <Input type="number" value={filterMinAmount} onChange={e => setFilterMinAmount(e.target.value)} placeholder="0" className="w-32" />
        </div>
        <div>
          <Label>Max Amount (₹)</Label>
          <Input type="number" value={filterMaxAmount} onChange={e => setFilterMaxAmount(e.target.value)} placeholder="9999" className="w-32" />
        </div>
        <div className="flex items-center gap-1">
          <Checkbox checked={showPendingCheques} onCheckedChange={checked => setShowPendingCheques(Boolean(checked))} />
          <span>Pending Cheques</span>
        </div>
        <div>
          <Label>Filter by Tags</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Tags ({selectedTags.length})</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="p-2 max-h-64 overflow-auto space-y-2">
              <div className="flex items-center gap-2 px-2">
                <Checkbox checked={allSelected} onCheckedChange={toggleAllTags} />
                <span className="text-sm font-medium">Select All</span>
              </div>
              {tags.map(tag => (
                <div key={tag.tag_id} className="flex items-center gap-2 px-2">
                  <Checkbox checked={selectedTags.includes(tag.tag_id)} onCheckedChange={() => toggleTag(tag.tag_id)} />
                  <span className="text-sm">{tag.tag_name}</span>
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto border rounded-md" style={{ height: 'calc(100vh - 250px)' }}>
        <table className="min-w-full border-collapse table-auto text-sm">
          <thead className="sticky top-0 bg-muted z-10">
            <tr>
              <th className="border px-3 py-2 text-left">Expense ID</th>
              <th className="border px-3 py-2 text-left">Title</th>
              <th className="border px-3 py-2 text-left">Created By</th>
              <th className="border px-3 py-2 text-left">Payment Type</th>
              <th className="border px-3 py-2 text-left">Ref</th>
              <th className="border px-3 py-2 text-right">Amount</th>
              <th className="border px-3 py-2 text-left">Date</th>
              <th className="border px-3 py-2 text-left">Debited On</th>
              <th className="border px-3 py-2 text-center">Image</th>
              <th className="border px-3 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenditures.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center p-4 text-gray-500">No expenditures found.</td>
              </tr>
            ) : (
              expenditures.map(exp => (
                <tr key={exp.id} className="hover:bg-muted/50">
                  <td className="border px-3 py-2 text-gray-500 font-mono text-xs">{exp.id.substring(0, 8)}</td>
                  <td className="border px-3 py-2">{exp.title}</td>
                  <td className="border px-3 py-2 text-gray-600">{exp.users?.email || 'System'}</td>
                  <td className="border px-3 py-2">{exp.payment_type}</td>
                  <td className="border px-3 py-2">{exp.payment_reference || '-'}</td>
                  <td className="border px-3 py-2 text-right">₹{exp.amount}</td>
                  <td className="border px-3 py-2">{formatDateDDMMYYYY(exp.date)}</td>
                  <td className="border px-3 py-2">
                    <Input
                      type="date"
                      className="w-36 text-xs"
                      value={exp.actual_amt_credit_dt?.split('T')[0] || ''}
                      onChange={e => updateCreditDate(exp.id, e.target.value)}
                    />
                  </td>
                  <td className="border px-3 py-2 text-center">
                    {exp.signed_image_url ? (
                      <a href={exp.signed_image_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline hover:text-blue-700">
                        View Link
                      </a>
                    ) : (
                      <span className="text-gray-400 italic">None</span>
                    )}
                  </td>
                  <td className="border px-3 py-2 text-center space-x-2">

                    <Button size="sm" variant="destructive" onClick={() => handleDelete(exp.id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
