'use client'

import { useEffect, useState } from 'react'
import Papa from 'papaparse'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import { printInvoice } from '@/lib/print_invoice'
import { Checkbox } from '@/components/ui/checkbox'

type Tag = {
  tag_id: string;
  tag_name: string;
};

type Invoice = {
  id: string;
  user_id: string;
  phone: string;
  name: string;
  title: string;
  amount: number;
  tag: string;
  payment_reference?: string;
  payment_type?: string;
  created_at: string;
  date: string;
  actual_amt_credit_dt: string | null;
  id_short: number;
  tags?: Tag;
  subtag?: string;
  users?: {
    email: string | null
  } | null;
};

type MonthlyTotal = {
  month: string;
  total: number;
};

function getTodayDate() {
  return new Date().toISOString().split('T')[0]
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

export default function InvoiceHistory() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [monthlyTotals, setMonthlyTotals] = useState<MonthlyTotal[]>([])
  const [totalAmount, setTotalAmount] = useState<number>(0)
  const [userRole, setUserRole] = useState<string>('user')

  const [filterPhone, setFilterPhone] = useState('')
  const [filterTag, setFilterTag] = useState<string | undefined>()
  const [paymentRef, setPaymentRef] = useState('')
  const [paymentType, setPaymentType] = useState<string | undefined>()

  const [maxDate, setMaxDate] = useState(getTodayDate)
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    return d.toISOString().split('T')[0]
  })
  
  const [recordStartDate, setRecordStartDate] = useState('')
  const [recordEndDate, setRecordEndDate] = useState('')
  
  const [tags, setTags] = useState<Tag[]>([])

  const [loadingDelete, setLoadingDelete] = useState<string | null>(null)
  const [onlyPendingCredit, setOnlyPendingCredit] = useState(false)
  const [filterEmail, setFilterEmail] = useState('')

  // New filters
  const [filterIdShort, setFilterIdShort] = useState('')
  const [filterTitle, setFilterTitle] = useState('')
  const [filterName, setFilterName] = useState('')
  const [filterMinAmount, setFilterMinAmount] = useState('')
  const [filterMaxAmount, setFilterMaxAmount] = useState('')

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch('/api/invoice-tags')
        if (!response.ok) throw new Error('Failed to fetch tags')
        const { tags } = await response.json()
        setTags(tags)
      } catch (error) {
        console.error('Error fetching tags:', error)
      }
    }
    fetchTags()

    const fetchRole = async () => {
      try {
        const response = await fetch('/api/auth/session')
        const data = await response.json()
        if (data?.user?.role) setUserRole(data.user.role)
      } catch (error) {}
    }
    fetchRole()
  }, [])

  const fetchInvoices = async (
    phone = '',
    tagId?: string,
    maxDate?: string,
    fromDate?: string,
    paymentRef?: string,
    paymentType?: string,
    email?: string,
    idShort?: string,
    title?: string,
    name?: string,
    minAmount?: string,
    maxAmount?: string,
    recordStartDate?: string,
    recordEndDate?: string
  ) => {
    try {
      const params = new URLSearchParams()
      if (phone.trim()) params.append('phone', phone.trim())
      if (tagId && tagId !== '__all__') params.append('tagId', tagId)
      if (paymentRef?.trim()) params.append('paymentRef', paymentRef.trim())
      if (paymentType && paymentType !== '__all__') params.append('paymentType', paymentType)
      if (maxDate) params.append('maxDate', maxDate)
      if (fromDate) params.append('fromDate', fromDate)
      if (onlyPendingCredit) params.append('onlyPendingCredit', 'true')
      if (email?.trim()) params.append('email', email.trim())
      if (idShort?.trim()) params.append('idShort', idShort.trim())
      if (title?.trim()) params.append('title', title.trim())
      if (name?.trim()) params.append('name', name.trim())
      if (minAmount?.trim()) params.append('minAmount', minAmount.trim())
      if (maxAmount?.trim()) params.append('maxAmount', maxAmount.trim())
      if (recordStartDate) params.append('recordStartDate', recordStartDate)
      if (recordEndDate) params.append('recordEndDate', recordEndDate)

      const response = await fetch(`/api/invoices?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch invoices')
      const { invoices } = await response.json()

      setInvoices(invoices)
    } catch (error) {
      console.error('Error fetching invoices:', error)
    }
  }

  const fetchGraphData = async (phone = '', tagId?: string, dateLimit?: string) => {
    const fromDate = new Date()
    fromDate.setMonth(fromDate.getMonth() - 11)
    fromDate.setDate(1)

    try {
      const params = new URLSearchParams()
      params.append('type', 'monthly')
      params.append('fromDate', fromDate.toISOString())
      if (dateLimit) params.append('toDate', dateLimit)
      if (phone.trim()) params.append('phone', phone.trim())
      if (tagId && tagId !== '__all__') params.append('tagId', tagId)

      const response = await fetch(`/api/invoices/stats?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch graph data')
      const { data } = await response.json()
      setMonthlyTotals(data)
    } catch (error) {
      console.error('Error fetching graph data:', error)
    }
  }

  const fetchTotalAmount = async (phone = '', tagId?: string, dateLimit?: string) => {
    try {
      const params = new URLSearchParams()
      params.append('type', 'total')
      if (phone.trim()) params.append('phone', phone.trim())
      if (tagId && tagId !== '__all__') params.append('tagId', tagId)
      if (dateLimit) params.append('toDate', dateLimit)

      const response = await fetch(`/api/invoices/stats?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch total amount')
      const { data } = await response.json()

      if (data && data[0] && data[0].total !== null) {
        setTotalAmount(data[0].total)
      }
    } catch (error) {
      console.error('Error fetching total amount:', error)
    }
  }

  useEffect(() => {
    fetchInvoices(filterPhone, filterTag, maxDate, fromDate, paymentRef, paymentType, filterEmail, filterIdShort, filterTitle, filterName, filterMinAmount, filterMaxAmount, recordStartDate, recordEndDate)
    fetchGraphData(filterPhone, filterTag, maxDate)
    fetchTotalAmount(filterPhone, filterTag, maxDate)
  }, [filterPhone, filterTag, maxDate, fromDate, paymentRef, paymentType, onlyPendingCredit, filterEmail, filterIdShort, filterTitle, filterName, filterMinAmount, filterMaxAmount, recordStartDate, recordEndDate])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return
    setLoadingDelete(id)
    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete invoice')

      setInvoices(invoices => invoices.filter(inv => inv.id !== id))
      fetchGraphData(filterPhone, filterTag, maxDate)
      fetchTotalAmount(filterPhone, filterTag, maxDate)
    } catch (error) {
      console.error('Error deleting invoice:', error)
    } finally {
      setLoadingDelete(null)
    }
  }

  const handleExportCSV = () => {
    if (!invoices.length) return alert('No invoices to export')
    
    const csvData = invoices.map(inv => ({
      'Receipt No.': inv.id_short,
      Title: inv.title,
      Name: inv.name,
      Phone: inv.phone,
      Tag: inv.tags?.tag_name || '',
      'Created By': inv.users?.email || '',
      'Payment Type': inv.payment_type || '',
      'Amount (₹)': inv.amount,
      'Payment Reference': inv.payment_reference || '',
      Date: formatDateDDMMYYYY(inv.date),
      'Actual Credit Date': formatDateDDMMYYYY(inv.actual_amt_credit_dt),
      'Record Create Date': formatDateDDMMYYYY(inv.created_at)
    }))
    
    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `invoices_export_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleResetFilters = () => {
    setFilterPhone('')
    setFilterTag(undefined)
    setPaymentRef('')
    setPaymentType(undefined)
    setFilterEmail('')
    setFilterIdShort('')
    setFilterTitle('')
    setFilterName('')
    setFilterMinAmount('')
    setFilterMaxAmount('')
    setOnlyPendingCredit(false)
    const fromD = new Date()
    fromD.setMonth(fromD.getMonth() - 1)
    setFromDate(fromD.toISOString().split('T')[0])
    setMaxDate(getTodayDate())
    setRecordStartDate('')
    setRecordEndDate('')
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4 justify-between">
        <div className="flex items-center gap-4 w-full">
          <h2 className="text-xl font-semibold">Receipt Dashboard</h2>
          <Button variant="outline" size="sm" onClick={handleResetFilters}>Reset Filters</Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>Export CSV</Button>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Phone Number</label>
          <Input
            placeholder="Filter by phone number"
            value={filterPhone}
            onChange={e => setFilterPhone(e.target.value)}
            className="w-64"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Payment Reference</label>
          <Input
            placeholder="Filter by payment ref"
            value={paymentRef}
            onChange={e => setPaymentRef(e.target.value)}
            className="w-64"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Creator Email</label>
          <Input
            placeholder="Search by email"
            value={filterEmail}
            onChange={e => setFilterEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Receipt No.</label>
          <Input
            placeholder="Filter by ID"
            value={filterIdShort}
            onChange={e => setFilterIdShort(e.target.value)}
            className="w-24"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <Input
            placeholder="Search by title"
            value={filterTitle}
            onChange={e => setFilterTitle(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <Input
            placeholder="Search by name"
            value={filterName}
            onChange={e => setFilterName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Min Amount (₹)</label>
          <Input
            type="number"
            placeholder="0"
            value={filterMinAmount}
            onChange={e => setFilterMinAmount(e.target.value)}
            className="w-32"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Max Amount (₹)</label>
          <Input
            type="number"
            placeholder="9999"
            value={filterMaxAmount}
            onChange={e => setFilterMaxAmount(e.target.value)}
            className="w-32"
          />
        </div>

        {/* Date Boxes */}
        <div className="flex gap-4 w-full">
          <div className="border rounded-md p-3 flex gap-4 bg-muted/20 flex-1">
            <div className="flex flex-col">
              <span className="font-semibold text-sm mb-2 text-muted-foreground">Receipt Date</span>
              <div className="flex gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">From</label>
                  <Input
                    type="date"
                    className="w-36 text-sm"
                    value={fromDate}
                    max={maxDate}
                    onChange={e => setFromDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">To</label>
                  <Input
                    type="date"
                    className="w-36 text-sm"
                    value={maxDate}
                    max={getTodayDate()}
                    onChange={e => setMaxDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border rounded-md p-3 flex gap-4 bg-muted/20 flex-1">
            <div className="flex flex-col">
              <span className="font-semibold text-sm mb-2 text-muted-foreground">Record Create Date</span>
              <div className="flex gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">From</label>
                  <Input
                    type="date"
                    className="w-36 text-sm"
                    value={recordStartDate}
                    onChange={e => setRecordStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">To</label>
                  <Input
                    type="date"
                    className="w-36 text-sm"
                    value={recordEndDate}
                    onChange={e => setRecordEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-48">
          <label className="block text-sm font-medium mb-1">Tag</label>
          <Select value={filterTag} onValueChange={setFilterTag}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Tags</SelectItem>
              {tags
                .filter(tag => tag.tag_name.trim() !== '')
                .map(tag => (
                  <SelectItem key={tag.tag_id} value={tag.tag_id}>
                    {tag.tag_name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-48">
          <label className="block text-sm font-medium mb-1">Payment Type</label>
          <Select value={paymentType} onValueChange={setPaymentType}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by payment type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Types</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="cheque">Cheque</SelectItem>
              <SelectItem value="upi">UPI</SelectItem>
              <SelectItem value="card">Card</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="pending-credit"
            checked={onlyPendingCredit}
            onCheckedChange={() => setOnlyPendingCredit(!onlyPendingCredit)}
          />
          <label htmlFor="pending-credit" className="text-sm">Show pending bank credits only</label>
        </div>
      </div>



      {/* Table */}
      <div className="overflow-auto border rounded-md" style={{ height: 'calc(100vh - 250px)' }}>
        <table className="min-w-full border-collapse table-auto">
          <thead className="sticky top-0 bg-muted z-10">
            <tr>
              <th className="border px-3 py-2 text-left">Receipt No.</th>
              <th className="border px-3 py-2 text-left">Title</th>
              <th className="border px-3 py-2 text-left">Name</th>
              <th className="border px-3 py-2 text-left">Phone</th>
              <th className="border px-3 py-2 text-left">Tag</th>
              <th className="border px-3 py-2 text-left">Created By</th>
              <th className="border px-3 py-2 text-left">Payment Type</th>
              <th className="border px-3 py-2 text-right">Amount (₹)</th>
              <th className="border px-3 py-2 text-right">Payment Reference</th>
              <th className="border px-3 py-2 text-left">Date</th>
              <th className="border px-3 py-2 text-left">Actual Credit Date</th>
              <th className="border px-3 py-2 text-center">Print</th>
              <th className="border px-3 py-2 text-center">Record Create date</th>
              {userRole === 'admin' && <th className="border px-3 py-2 text-center">Delete</th>}
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={12} className="text-center p-4">No invoices found.</td>
              </tr>
            ) : (
              invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="border px-3 py-2">{inv.id_short}</td>
                  <td className="border px-3 py-2">{inv.title}</td>
                  <td className="border px-3 py-2">{inv.name}</td>
                  <td className="border px-3 py-2">{inv.phone}</td>
                  <td className="border px-3 py-2">{inv.tags?.tag_name || <span className="italic text-gray-400">None</span>}</td>
                  <td className="border px-3 py-2">{inv.users?.email || '—'}</td>
                  <td className="border px-3 py-2">{inv.payment_type || <span className="italic text-gray-400">—</span>}</td>
                  <td className="border px-3 py-2 text-right">{inv.amount}</td>
                  <td className="border px-3 py-2">{inv.payment_reference || <span className="italic text-gray-400">—</span>}</td>
                  <td className="border px-3 py-2">{formatDateDDMMYYYY(inv.date)}</td>
                  <td className="border px-3 py-2">
                    <input
                      type="date"
                      className="border px-2 py-1 rounded text-sm dark:bg-gray-800"
                      value={inv.actual_amt_credit_dt?.slice(0, 10) || ''}
                      onChange={async (e) => {
                        const newDate = e.target.value
                        if (!window.confirm('Are you sure you want to update the credit date?')) return
                        
                        try {
                          const response = await fetch('/api/invoices', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              id: inv.id,
                              actual_amt_credit_dt: newDate ? new Date(newDate) : null
                            })
                          })
                          
                          if (!response.ok) throw new Error('Failed to update date')
                          
                          setInvoices((prev) =>
                            prev.map((row) =>
                              row.id === inv.id ? { ...row, actual_amt_credit_dt: newDate || null } : row
                            )
                          )
                        } catch (error) {
                          console.error(error)
                          alert('Failed to update date')
                        }
                      }}
                    />
                  </td>
                  <td className="border px-3 py-2 text-center">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => printInvoice(inv)}
                    >
                      Print
                    </Button>
                  </td>
                  <td className="border px-3 py-2">{formatDateDDMMYYYY(inv.created_at)}</td>
                  {userRole === 'admin' && (
                    <td className="border px-3 py-2 text-center">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(inv.id)}
                        disabled={loadingDelete === inv.id}
                      >
                        {loadingDelete === inv.id ? 'Deleting...' : 'Delete'}
                      </Button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}