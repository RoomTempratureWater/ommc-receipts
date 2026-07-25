'use client'

import { useState, useEffect, ChangeEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

function getTodayDate() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getISTTimestamp() {
  const now = new Date()
  const offsetIST = 5.5 * 60 * 60 * 1000
  return new Date(now.getTime() + offsetIST - now.getTimezoneOffset() * 60000).toISOString()
}

interface Tag {
  tag_id: string
  tag_name: string
  sub_tag1: string | null
  sub_tag2: string | null
}

export default function AddExpenditureForm() {
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [paymentType, setPaymentType] = useState('')
  const [paymentRef, setPaymentRef] = useState('')
  const [tag, setTag] = useState<string | undefined>()
  const [subtag, setSubtag] = useState<string | undefined>()
  const [tags, setTags] = useState<Tag[]>([])
  const [date, setDate] = useState(getTodayDate())
  const [imageUrl, setImageUrl] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [resetKey, setResetKey] = useState(0)

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch('/api/tags')
        if (!response.ok) throw new Error('Failed to fetch tags')
        const { expenseTags } = await response.json()
        setTags(expenseTags)
      } catch (error) {
        console.error('Error fetching tags:', error)
      }
    }
    fetchTags()
  }, [])

  // Reset subtag when tag changes
  useEffect(() => {
    setSubtag(undefined)
  }, [tag])

  const validate = () => {
    if (!title || !amount || !paymentType || !date) return 'All fields are required.'
    if (isNaN(Number(amount))) return 'Amount must be a number.'
    if (paymentType !== 'cash' && !paymentRef) return 'Payment reference is required.'
    if (!tag) return 'Please select a tag.'
    const selectedTag = tags.find(t => t.tag_id === tag)
    const availableSubtags = (selectedTag ? [selectedTag.sub_tag1, selectedTag.sub_tag2] : []).filter(
      (s): s is string => !!s && s.trim().length > 0
    )
    if (availableSubtags.length > 0 && !subtag) return 'Please select a subtag for the chosen tag.'
    return null
  }



  const handleSubmit = async () => {
    setError('')
    setSuccess('')
    const err = validate()
    if (err) {
      setError(err)
      return
    }

    // TODO: Replace with actual user authentication
    const userId = 'temp-user-id'

    const filePath = imageUrl || null

    const actual_amt_credit_dt = paymentType === 'cheque' ? null : date

    const selectedTag = tags.find(t => t.tag_id === tag)
    const availableSubtags = (selectedTag ? [selectedTag.sub_tag1, selectedTag.sub_tag2] : []).filter(
      (s): s is string => !!s && s.trim().length > 0
    )

    const expenditureData = {
      title,
      amount: Number(amount),
      payment_type: paymentType,
      payment_reference: paymentType !== 'cash' ? paymentRef : null,
      tag: tag!,
      subtag: availableSubtags.length > 0 ? subtag || null : null,
      date: new Date(date),
      image_url: filePath,
      actual_amt_credit_dt: actual_amt_credit_dt ? new Date(actual_amt_credit_dt) : null,
    }

    try {
      const response = await fetch('/api/expenditures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenditureData)
      })
      
      if (!response.ok) throw new Error('Failed to create expenditure')
      
      setSuccess('Expenditure added successfully!')
      setTitle('')
      setAmount('')
      setPaymentType('')
      setPaymentRef('')
      setTag(undefined)
      setSubtag(undefined)
      setDate(getTodayDate())
      setImageUrl('')
      setResetKey(prev => prev + 1)
    } catch (error: any) {
      setError(error.message)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <h2 className="text-xl font-semibold text-center">Add Expenditure</h2>

      <div>
        <Label>Title</Label>
        <Input value={title} onChange={e => setTitle(e.target.value)} />
      </div>

      <div>
        <Label>Amount</Label>
        <Input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />
      </div>

      <div>
        <Label>Payment Type</Label>
        <Select value={paymentType} onValueChange={setPaymentType}>
          <SelectTrigger>
            <SelectValue placeholder="Select payment type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="upi">UPI</SelectItem>
            <SelectItem value="bank">Bank Transfer</SelectItem>
            <SelectItem value="cheque">Cheque</SelectItem>
            <SelectItem value="card">Card</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {paymentType !== 'cash' && (
        <div>
          <Label>Payment Reference</Label>
          <Input
            value={paymentRef}
            onChange={e => setPaymentRef(e.target.value)}
            placeholder="Transaction ID, ref no, etc."
          />
        </div>
      )}

      <div>
        <Label>Tag</Label>
        <Select key={resetKey} value={tag} onValueChange={(value) => {
          setTag(value)
          setSubtag(undefined) // Reset subtag when tag changes
        }}>
          <SelectTrigger>
            <SelectValue placeholder="Select a tag" />
          </SelectTrigger>
          <SelectContent>
            {tags.map(t => (
              <SelectItem key={t.tag_id} value={t.tag_id}>
                {t.tag_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {tag && (() => {
        const selectedTag = tags.find(t => t.tag_id === tag)
        const availableSubtags = (selectedTag ? [selectedTag.sub_tag1, selectedTag.sub_tag2] : []).filter(
          (s): s is string => !!s && s.trim().length > 0
        )
        if (!availableSubtags.length) return null
        return (
          <div>
            <Label>Subtag *</Label>
            <Select value={subtag} onValueChange={setSubtag}>
              <SelectTrigger>
                <SelectValue placeholder="Select a subtag" />
              </SelectTrigger>
              <SelectContent>
                {availableSubtags.map(sub => (
                  <SelectItem key={sub} value={sub}>
                    {sub}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      })()}

      <div>
        <Label>Date</Label>
        <Input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          max={getTodayDate()}
        />
      </div>

      <div>
        <Label>Image Link (optional)</Label>
        <Input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
      {success && <p className="text-green-500 text-sm">{success}</p>}

      <Button className="w-full" onClick={handleSubmit}>
        Submit
      </Button>
    </div>
  )
}
