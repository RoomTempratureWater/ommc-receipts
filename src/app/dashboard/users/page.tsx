'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface UserData {
  id: string
  email: string
  created_at: string
  role: 'admin' | 'user'
  status: 'active' | 'revoked'
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users')
      if (!res.ok) throw new Error('Failed to fetch users')
      const data = await res.json()
      setUsers(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleUpdate = async (userId: string, field: 'role' | 'status', value: string) => {
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, [field]: value })
      })
      if (!res.ok) throw new Error(`Failed to update ${field}`)
      
      // Update local state
      setUsers(users.map(u => u.id === userId ? { ...u, [field]: value } : u))
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleResetPassword = async (userId: string, email: string) => {
    const newPassword = window.prompt(`Enter a new password for ${email}:`)
    if (!newPassword) return

    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password: newPassword })
      })
      if (!res.ok) throw new Error('Failed to reset password')
      
      alert('Password reset successfully')
    } catch (err: any) {
      alert(err.message)
    }
  }

  if (loading) return <div className="p-8">Loading users...</div>
  if (error) return <div className="p-8 text-red-500">{error}</div>

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">User Management</CardTitle>
          <CardDescription>
            Manage access and roles for all registered users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted text-muted-foreground">
                <tr>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Registered At</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="px-6 py-4 font-medium">{user.email}</td>
                    <td className="px-6 py-4">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        value={user.role} 
                        onChange={(e) => handleUpdate(user.id, 'role', e.target.value)}
                        className="bg-transparent border border-input rounded px-2 py-1"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        value={user.status} 
                        onChange={(e) => handleUpdate(user.id, 'status', e.target.value)}
                        className={`bg-transparent border rounded px-2 py-1 ${user.status === 'revoked' ? 'border-red-500 text-red-500' : 'border-input'}`}
                      >
                        <option value="active">Active</option>
                        <option value="revoked">Revoked</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleResetPassword(user.id, user.email)}
                        className="text-xs bg-secondary text-secondary-foreground hover:bg-secondary/80 px-3 py-1.5 rounded-md font-medium"
                      >
                        Reset Password
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">No users found.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
