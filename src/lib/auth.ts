// lib/auth.ts
// Custom auth functions using Next.js API routes

export interface User {
  id: string
  email: string
}

export interface Session {
  user: User
}

export async function getUserSession(): Promise<Session | null> {
  try {
    const response = await fetch('/api/auth/session', {
      method: 'GET',
      credentials: 'include'
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.user ? { user: data.user } : null
  } catch (error) {
    console.error('Error getting user session:', error)
    return null
  }
}

export async function signInWithPassword(email: string, password: string) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ email, password })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Login failed')
  }

  return await response.json()
}

export async function signUp(email: string, password: string) {
  const response = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ email, password })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Signup failed')
  }

  return await response.json()
}

export async function signOut() {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    })
  } catch (error) {
    console.error('Error signing out:', error)
  }

  // Redirect to login page
  if (typeof window !== 'undefined') {
    window.location.href = '/login'
  }
}

export async function getUser() {
  try {
    const session = await getUserSession()
    return { data: { user: session?.user || null } }
  } catch (error) {
    console.error('Error getting user:', error)
    return { data: { user: null } }
  }
}

