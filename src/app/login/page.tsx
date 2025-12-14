// app/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithPassword } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async () => {
    try {
      await signInWithPassword(email, password)
      // Use window.location.href for a full page reload to ensure cookies are available
      window.location.href = '/dashboard'
    } catch (error: any) {
      setError(error.message)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <div className="w-80 space-y-4">
        <h2 className="text-xl font-semibold text-center">Login</h2>
        <Label>Email</Label>
        <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
        <Label>Password</Label>
        <Input type="password" value={password} onChange={e => setPassword(e.target.value)} />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <Button onClick={handleLogin} className="w-full">Login</Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push('/signup')}
        >
          Create Account
        </Button>
      </div>
    </div>
  )
}

