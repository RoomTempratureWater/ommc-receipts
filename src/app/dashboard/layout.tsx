'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { getUser, signOut } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { X, Menu, Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await getUser()
      if (data?.user) {
        setUserEmail(data.user.email ?? null)
      } else {
        router.push('/login')
      }
    }
    fetchUser()
  }, [router])

  const handleSignOut = async () => {
    await signOut()
    // signOut already handles the redirect
  }

  const SidebarButton = ({
    label,
    emoji,
    href,
  }: {
    label: string
    emoji: string
    href: string
  }) => {
    const isActive = pathname === href
    return (
      <Link href={href} className="w-full" onClick={() => setSidebarOpen(false)}>
        <Button
          variant={isActive ? 'default' : 'outline'}
          className={`w-full justify-start gap-2 text-left ${isActive ? '' : 'bg-[--color-sidebar-primary] text-[--color-sidebar-primary-foreground] hover:bg-[--color-sidebar-accent]'}`}
        >
          <span>{emoji}</span>
          {label}
        </Button>
      </Link>
    )
  }

  const Sidebar = (
    <div
      className="w-60 p-4 flex flex-col gap-4 h-full border-r"
      style={{
        backgroundColor: 'var(--color-sidebar)',
        color: 'var(--color-sidebar-foreground)',
        borderColor: 'var(--color-sidebar-border)',
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">OMMC | Accounting</h2>
        <button onClick={() => setSidebarOpen(false)} className="md:hidden text-inherit">
          <X />
        </button>
      </div>

      <SidebarButton label="Add Invoice" emoji="➕" href="/dashboard/add-invoice" />
      <SidebarButton label="Invoice History" emoji="📜" href="/dashboard/invoice-history" />
      <SidebarButton label="Tags" emoji="🏷️" href="/dashboard/tags" />
      <SidebarButton label="Church Fund History" emoji="🧾" href="/dashboard/church-funds" />
      <SidebarButton label="Add Expenditure" emoji="💸" href="/dashboard/add-expenditure" />
      <SidebarButton label="Expenditure History" emoji="📉" href="/dashboard/expenditure-history" />
      <SidebarButton label="Balance Sheet" emoji="📊" href="/dashboard/balance-sheet" />
      <SidebarButton label="Ledger" emoji="📓" href="/dashboard/ledger" />
      <SidebarButton label="Members" emoji="🧑" href="/dashboard/members" />
      <SidebarButton label="Database Backup" emoji="💾" href="/dashboard/backup" />

      <div className="mt-auto text-sm pt-4 border-t" style={{ borderColor: 'var(--color-sidebar-border)' }}>
        <p className="mb-2">Signed in as:</p>
        <p className="font-medium break-words">{userEmail || 'Loading...'}</p>
        <Button variant="destructive" onClick={handleSignOut} className="w-full mt-4">
          🔒 Sign Out
        </Button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen relative bg-[--color-background] text-[--color-foreground]">
      {/* Sidebar for desktop */}
      <div className="hidden md:block">{Sidebar}</div>

      {/* Sidebar for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black opacity-50" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-50">{Sidebar}</div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-6 w-full">
        {/* Mobile top bar */}
        <div className="flex justify-between items-center mb-4 md:hidden">
          <Button variant="outline" onClick={() => setSidebarOpen(true)}>
            <Menu className="mr-2 h-5 w-5" /> Menu
          </Button>

          <Button variant="ghost" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
        </div>

        {/* Desktop theme toggle */}
        <div className="hidden md:flex justify-end mb-4">
          <Button variant="ghost" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
        </div>

        {children}
      </main>
    </div>
  )
}
