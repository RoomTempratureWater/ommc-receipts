'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getUserSession } from '@/lib/auth'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const session = await getUserSession()
      if (session) {
        router.push('/dashboard')
      } else {
        router.push('/login')
      }
    }
    checkAuth()
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Loading...</h1>
        <p>Redirecting to the appropriate page...</p>
      </div>
    </div>
  )
}
