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

  const [editingInvoiceTagId, setEditingInvoiceTagId] = useState<string | null>(null)
  const [editingExpenseTagId, setEditingExpenseTagId] = useState<string | null>(null)

  const [editingTagName, setEditingTagName] = useState('')

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
          sub_tag1: null,
          sub_tag2: null,
        })
      })
      
      if (!response.ok) throw new Error('Failed to create invoice tag')
      
      setNewInvoiceTag('')
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
          sub_tag1: null,
          sub_tag2: null,
        })
      })
      
      if (!response.ok) throw new Error('Failed to create expense tag')
      
      setNewExpenseTag('')
      fetchExpenseTags()
    } catch (error) {
      console.error('Error adding expense tag:', error)
    }
  }

  // edit invoice tag
  const handleEditInvoice = (tagId: string, currentName: string) => {
    setEditingInvoiceTagId(tagId)
    setEditingTagName(currentName)
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
          tag_name: editingTagName
        })
      })
      
      if (!response.ok) throw new Error('Failed to update invoice tag')
      
      setEditingInvoiceTagId(null)
      setEditingTagName('')
      fetchInvoiceTags()
    } catch (error) {
      console.error('Error updating invoice tag:', error)
    }
  }

  // edit expense tag
  const handleEditExpense = (tagId: string, currentName: string) => {
    setEditingExpenseTagId(tagId)
    setEditingTagName(currentName)
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
          tag_name: editingTagName
        })
      })
      
      if (!response.ok) throw new Error('Failed to update expense tag')
      
      setEditingExpenseTagId(null)
      setEditingTagName('')
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

        <div className="flex gap-2">
          <Input
            placeholder="New invoice tag"
            value={newInvoiceTag}
            onChange={e => setNewInvoiceTag(e.target.value)}
          />
          <Button onClick={handleAddInvoiceTag}>Add</Button>
        </div>

        <div className="space-y-2">
          {invoiceTags.map(tag => (
            <div key={tag.tag_id} className="flex items-center justify-between border-b pb-2">
              {editingInvoiceTagId === tag.tag_id ? (
                <>
                  <Input
                    value={editingTagName}
                    onChange={e => setEditingTagName(e.target.value)}
                    className="flex-1 mr-2"
                  />
                  <Button size="sm" onClick={() => handleSaveInvoice(tag.tag_id)}>
                    Save
                  </Button>
                </>
              ) : (
                <>
                  <p className="flex-1">{tag.tag_name}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditInvoice(tag.tag_id, tag.tag_name)}
                  >
                    Edit
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Expense Tags */}
      <Card className="p-4 space-y-4">
        <h2 className="text-xl font-semibold text-center">Expense Tags</h2>

        <div className="flex gap-2">
          <Input
            placeholder="New expense tag"
            value={newExpenseTag}
            onChange={e => setNewExpenseTag(e.target.value)}
          />
          <Button onClick={handleAddExpenseTag}>Add</Button>
        </div>

        <div className="space-y-2">
          {expenseTags.map(tag => (
            <div key={tag.tag_id} className="flex items-center justify-between border-b pb-2">
              {editingExpenseTagId === tag.tag_id ? (
                <>
                  <Input
                    value={editingTagName}
                    onChange={e => setEditingTagName(e.target.value)}
                    className="flex-1 mr-2"
                  />
                  <Button size="sm" onClick={() => handleSaveExpense(tag.tag_id)}>
                    Save
                  </Button>
                </>
              ) : (
                <>
                  <p className="flex-1">{tag.tag_name}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditExpense(tag.tag_id, tag.tag_name)}
                  >
                    Edit
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
