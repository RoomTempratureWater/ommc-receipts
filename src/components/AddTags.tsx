'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface Tag {
  tag_id: string
  tag_name: string
  sub_tag1: string | null
  sub_tag2: string | null
  created_at: string
}

export default function ManageTags() {
  const [invoiceTags, setInvoiceTags] = useState<Tag[]>([])
  const [expenseTags, setExpenseTags] = useState<Tag[]>([])

  const [newInvoiceTag, setNewInvoiceTag] = useState('')
  const [newExpenseTag, setNewExpenseTag] = useState('')
  const [newInvoiceSubtag1, setNewInvoiceSubtag1] = useState('')
  const [newInvoiceSubtag2, setNewInvoiceSubtag2] = useState('')
  const [newExpenseSubtag1, setNewExpenseSubtag1] = useState('')
  const [newExpenseSubtag2, setNewExpenseSubtag2] = useState('')

  const [editingInvoiceTagId, setEditingInvoiceTagId] = useState<string | null>(null)
  const [editingExpenseTagId, setEditingExpenseTagId] = useState<string | null>(null)

  const [editingTagName, setEditingTagName] = useState('')
  const [editingSubtag1, setEditingSubtag1] = useState('')
  const [editingSubtag2, setEditingSubtag2] = useState('')

  // fetch invoice tags
  const fetchInvoiceTags = async () => {
    try {
      const response = await fetch('/api/tags')
      if (!response.ok) throw new Error('Failed to fetch tags')
      const { invoiceTags } = await response.json()
      setInvoiceTags(invoiceTags || [])
    } catch (error) {
      console.error('Error fetching invoice tags:', error)
    }
  }

  // fetch expense tags
  const fetchExpenseTags = async () => {
    try {
      const response = await fetch('/api/tags')
      if (!response.ok) throw new Error('Failed to fetch tags')
      const { expenseTags } = await response.json()
      setExpenseTags(expenseTags || [])
    } catch (error) {
      console.error('Error fetching expense tags:', error)
    }
  }

  useEffect(() => {
    fetchInvoiceTags()
    fetchExpenseTags()
  }, [])

  // add new invoice tag
  const handleAddInvoiceTag = async () => {
    if (!newInvoiceTag.trim()) return
    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'invoice',
          tag_name: newInvoiceTag.trim(),
          sub_tag1: newInvoiceSubtag1.trim() || null,
          sub_tag2: newInvoiceSubtag2.trim() || null,
        })
      })
      
      if (!response.ok) throw new Error('Failed to create invoice tag')
      
      setNewInvoiceTag('')
      setNewInvoiceSubtag1('')
      setNewInvoiceSubtag2('')
      fetchInvoiceTags()
    } catch (error) {
      console.error('Error adding invoice tag:', error)
    }
  }

  // add new expense tag
  const handleAddExpenseTag = async () => {
    if (!newExpenseTag.trim()) return
    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'expense',
          tag_name: newExpenseTag.trim(),
          sub_tag1: newExpenseSubtag1.trim() || null,
          sub_tag2: newExpenseSubtag2.trim() || null,
        })
      })
      
      if (!response.ok) throw new Error('Failed to create expense tag')
      
      setNewExpenseTag('')
      setNewExpenseSubtag1('')
      setNewExpenseSubtag2('')
      fetchExpenseTags()
    } catch (error) {
      console.error('Error adding expense tag:', error)
    }
  }

  // edit invoice tag
  const handleEditInvoice = (tagId: string, currentName: string) => {
    setEditingInvoiceTagId(tagId)
    setEditingTagName(currentName)
    const tag = invoiceTags.find(t => t.tag_id === tagId)
    setEditingSubtag1(tag?.sub_tag1 || '')
    setEditingSubtag2(tag?.sub_tag2 || '')
  }

  // save invoice tag
  const handleSaveInvoice = async (tagId: string) => {
    try {
      const response = await fetch('/api/tags', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'invoice',
          tag_id: tagId,
          tag_name: editingTagName,
          sub_tag1: editingSubtag1.trim() || null,
          sub_tag2: editingSubtag2.trim() || null,
        })
      })
      
      if (!response.ok) throw new Error('Failed to update invoice tag')
      
      setEditingInvoiceTagId(null)
      setEditingTagName('')
      setEditingSubtag1('')
      setEditingSubtag2('')
      fetchInvoiceTags()
    } catch (error) {
      console.error('Error updating invoice tag:', error)
    }
  }

  // edit expense tag
  const handleEditExpense = (tagId: string, currentName: string) => {
    setEditingExpenseTagId(tagId)
    setEditingTagName(currentName)
    const tag = expenseTags.find(t => t.tag_id === tagId)
    setEditingSubtag1(tag?.sub_tag1 || '')
    setEditingSubtag2(tag?.sub_tag2 || '')
  }

  // save expense tag
  const handleSaveExpense = async (tagId: string) => {
    try {
      const response = await fetch('/api/tags', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'expense',
          tag_id: tagId,
          tag_name: editingTagName,
          sub_tag1: editingSubtag1.trim() || null,
          sub_tag2: editingSubtag2.trim() || null,
        })
      })
      
      if (!response.ok) throw new Error('Failed to update expense tag')
      
      setEditingExpenseTagId(null)
      setEditingTagName('')
      setEditingSubtag1('')
      setEditingSubtag2('')
      fetchExpenseTags()
    } catch (error) {
      console.error('Error updating expense tag:', error)
    }
  }

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Invoice Tags */}
      <Card className="p-4 space-y-4">
        <h2 className="text-xl font-semibold text-center">Invoice Tags</h2>

        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="New invoice tag"
              value={newInvoiceTag}
              onChange={e => setNewInvoiceTag(e.target.value)}
            />
            <Button onClick={handleAddInvoiceTag}>Add</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Input
              placeholder="Subtag 1 (optional)"
              value={newInvoiceSubtag1}
              onChange={e => setNewInvoiceSubtag1(e.target.value)}
            />
            <Input
              placeholder="Subtag 2 (optional)"
              value={newInvoiceSubtag2}
              onChange={e => setNewInvoiceSubtag2(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          {invoiceTags.map(tag => (
            <div key={tag.tag_id} className="border-b pb-2 space-y-1">
              {editingInvoiceTagId === tag.tag_id ? (
                <div className="space-y-2">
                  <Input
                    value={editingTagName}
                    onChange={e => setEditingTagName(e.target.value)}
                    className="w-full"
                    placeholder="Tag name"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Input
                      value={editingSubtag1}
                      onChange={e => setEditingSubtag1(e.target.value)}
                      placeholder="Subtag 1 (optional)"
                    />
                    <Input
                      value={editingSubtag2}
                      onChange={e => setEditingSubtag2(e.target.value)}
                      placeholder="Subtag 2 (optional)"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingInvoiceTagId(null)
                        setEditingTagName('')
                        setEditingSubtag1('')
                        setEditingSubtag2('')
                      }}
                    >
                      Cancel
                    </Button>
                    <Button size="sm" onClick={() => handleSaveInvoice(tag.tag_id)}>
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-medium">{tag.tag_name}</p>
                    <p className="text-xs text-gray-500">
                      {tag.sub_tag1 || tag.sub_tag2
                        ? [tag.sub_tag1, tag.sub_tag2].filter(Boolean).join(', ')
                        : 'No subtags'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditInvoice(tag.tag_id, tag.tag_name)}
                  >
                    Edit
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Expense Tags */}
      <Card className="p-4 space-y-4">
        <h2 className="text-xl font-semibold text-center">Expense Tags</h2>

        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="New expense tag"
              value={newExpenseTag}
              onChange={e => setNewExpenseTag(e.target.value)}
            />
            <Button onClick={handleAddExpenseTag}>Add</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Input
              placeholder="Subtag 1 (optional)"
              value={newExpenseSubtag1}
              onChange={e => setNewExpenseSubtag1(e.target.value)}
            />
            <Input
              placeholder="Subtag 2 (optional)"
              value={newExpenseSubtag2}
              onChange={e => setNewExpenseSubtag2(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          {expenseTags.map(tag => (
            <div key={tag.tag_id} className="border-b pb-2 space-y-1">
              {editingExpenseTagId === tag.tag_id ? (
                <div className="space-y-2">
                  <Input
                    value={editingTagName}
                    onChange={e => setEditingTagName(e.target.value)}
                    className="w-full"
                    placeholder="Tag name"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Input
                      value={editingSubtag1}
                      onChange={e => setEditingSubtag1(e.target.value)}
                      placeholder="Subtag 1 (optional)"
                    />
                    <Input
                      value={editingSubtag2}
                      onChange={e => setEditingSubtag2(e.target.value)}
                      placeholder="Subtag 2 (optional)"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingExpenseTagId(null)
                        setEditingTagName('')
                        setEditingSubtag1('')
                        setEditingSubtag2('')
                      }}
                    >
                      Cancel
                    </Button>
                    <Button size="sm" onClick={() => handleSaveExpense(tag.tag_id)}>
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-medium">{tag.tag_name}</p>
                    <p className="text-xs text-gray-500">
                      {tag.sub_tag1 || tag.sub_tag2
                        ? [tag.sub_tag1, tag.sub_tag2].filter(Boolean).join(', ')
                        : 'No subtags'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditExpense(tag.tag_id, tag.tag_name)}
                  >
                    Edit
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
