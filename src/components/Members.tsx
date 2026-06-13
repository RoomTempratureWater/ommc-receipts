'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

interface Member {
  first_name: string
  middle_name?: string
  last_name: string
  phone: string
  address: string
  [key: string]: any
  id: string
}

function generateMemberId(phone: string, name: string): string {
  return btoa(`${phone}:${name}`)
}

export default function MembersList() {
  const [members, setMembers] = useState<Member[]>([])
  const [filtered, setFiltered] = useState<Member[]>([])

  const [searchName, setSearchName] = useState('')
  const [searchPhone, setSearchPhone] = useState('')
  const [searchAddress, setSearchAddress] = useState('')

  // New member form state
  const [newFirstName, setNewFirstName] = useState('')
  const [newLastName, setNewLastName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newAddress, setNewAddress] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch('/api/members')
        if (!response.ok) throw new Error('Failed to fetch members')
        const { members } = await response.json()
        const withIds = members.map((m: any) => ({
          ...m,
          id: m.id || generateMemberId(m.phone, `${m.first_name}${m.middle_name || ''}${m.last_name}`),
        }))
        setMembers(withIds)
        setFiltered(withIds)
      } catch (error) {
        console.error('Error fetching members:', error)
      }
    }
    fetchMembers()
  }, [])

  useEffect(() => {
    const lower = (s: string) => s?.toLowerCase() ?? ''
    const f = members.filter(m =>
      `${m.first_name} ${m.middle_name ? m.middle_name + ' ' : ''}${m.last_name}`.toLowerCase().includes(lower(searchName)) &&
      lower(m.phone).includes(lower(searchPhone)) &&
      lower(m.address).includes(lower(searchAddress))
    )
    setFiltered(f)
  }, [searchName, searchPhone, searchAddress, members])

  const [newMiddleName, setNewMiddleName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Member>>({})

  const handleAddMember = async () => {
    if (!newFirstName || !newLastName || !newPhone || !newAddress) {
      alert('Please fill in all fields (Middle Name is optional).')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: newFirstName,
          middle_name: newMiddleName,
          last_name: newLastName,
          phone: newPhone,
          address: newAddress,
        })
      })
      
      if (!response.ok) throw new Error('Failed to create member')
      const { member } = await response.json()

      const newMember = {
        ...member,
        id: member.id || generateMemberId(member.phone, `${member.first_name}${member.middle_name || ''}${member.last_name}`),
      }
      setMembers(prev => [...prev, newMember])
      setFiltered(prev => [...prev, newMember])

      setNewFirstName('')
      setNewMiddleName('')
      setNewLastName('')
      setNewPhone('')
      setNewAddress('')
    } catch (error) {
      console.error('Error adding member:', error)
      alert('Error adding member.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!window.confirm('Are you sure you want to edit this member?')) return

    try {
      const response = await fetch('/api/members', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })
      
      if (!response.ok) throw new Error('Failed to update member')
      
      const { member } = await response.json()
      
      setMembers(prev => prev.map(m => m.id === member.id ? member : m))
      setFiltered(prev => prev.map(m => m.id === member.id ? member : m))
      setEditingId(null)
      window.alert('Member updated successfully!')
    } catch (error) {
      console.error('Error updating member:', error)
      alert('Error updating member.')
    }
  }

  const downloadCSV = () => {
    const headers = ['Name', 'Phone', 'Address']
    const rows = filtered.map(m => [`${m.first_name} ${m.middle_name ? m.middle_name + ' ' : ''}${m.last_name}`, m.phone, m.address])
    const csvContent = [headers, ...rows]
      .map(row => row.map(val => `"${val}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = 'members.csv'
    a.click()

    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h2 className="text-2xl font-semibold text-center">Members</h2>

      {/* Add New Member Form */}
      <div className="p-4 border rounded-md bg-muted/20 space-y-2">
        <h3 className="text-lg font-semibold">Add New Member</h3>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <div>
            <Label>First Name</Label>
            <Input value={newFirstName} onChange={e => setNewFirstName(e.target.value)} />
          </div>
          <div>
            <Label>Middle Name</Label>
            <Input value={newMiddleName} onChange={e => setNewMiddleName(e.target.value)} />
          </div>
          <div>
            <Label>Last Name</Label>
            <Input value={newLastName} onChange={e => setNewLastName(e.target.value)} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={newPhone} onChange={e => setNewPhone(e.target.value)} />
          </div>
          <div>
            <Label>Address</Label>
            <Input value={newAddress} onChange={e => setNewAddress(e.target.value)} />
          </div>
        </div>
        <Button onClick={handleAddMember} disabled={loading}>
          {loading ? 'Adding...' : 'Add Member'}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <Label>Name</Label>
          <Input
            placeholder="Search by name"
            value={searchName}
            onChange={e => setSearchName(e.target.value)}
          />
        </div>
        <div>
          <Label>Phone</Label>
          <Input
            placeholder="Search by phone"
            value={searchPhone}
            onChange={e => setSearchPhone(e.target.value)}
          />
        </div>
        <div>
          <Label>Address</Label>
          <Input
            placeholder="Search by address"
            value={searchAddress}
            onChange={e => setSearchAddress(e.target.value)}
          />
        </div>
        <Button onClick={downloadCSV} className="mt-1">
          ⬇️ Export CSV
        </Button>
      </div>

      {/* Members Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border text-sm">
          <thead>
            <tr className="bg-muted text-left">
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Phone</th>
              <th className="p-2 border">Address</th>
              <th className="p-2 border text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">
                  No members found.
                </td>
              </tr>
            ) : (
              filtered.map(member => (
                <tr key={member.id} className="hover:bg-muted/40">
                  {editingId === member.id ? (
                    <>
                      <td className="p-2 border space-y-1">
                        <Input value={editForm.first_name || ''} onChange={e => setEditForm({...editForm, first_name: e.target.value})} placeholder="First" className="h-8" />
                        <Input value={editForm.middle_name || ''} onChange={e => setEditForm({...editForm, middle_name: e.target.value})} placeholder="Middle" className="h-8" />
                        <Input value={editForm.last_name || ''} onChange={e => setEditForm({...editForm, last_name: e.target.value})} placeholder="Last" className="h-8" />
                      </td>
                      <td className="p-2 border">
                        <Input value={editForm.phone || ''} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="h-8" />
                      </td>
                      <td className="p-2 border">
                        <Input value={editForm.address || ''} onChange={e => setEditForm({...editForm, address: e.target.value})} className="h-8" />
                      </td>
                      <td className="p-2 border text-center space-x-2">
                        <Button variant="default" size="sm" onClick={handleSaveEdit}>Save</Button>
                        <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>Cancel</Button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-2 border">{member.first_name} {member.middle_name ? member.middle_name + ' ' : ''}{member.last_name}</td>
                      <td className="p-2 border">{member.phone}</td>
                      <td className="p-2 border">{member.address}</td>
                      <td className="p-2 border text-center">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setEditingId(member.id)
                            setEditForm(member)
                          }}
                        >
                          Edit
                        </Button>
                      </td>
                    </>
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
