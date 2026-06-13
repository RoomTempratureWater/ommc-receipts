'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useState } from 'react'

export default function BackupPage() {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleBackup = () => {
    setIsDownloading(true)
    const link = document.createElement('a')
    link.href = '/api/backup'
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => setIsDownloading(false), 2000)
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 lg:p-8 mt-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Database Backup</CardTitle>
          <CardDescription>
            Download a complete SQL dump of the entire database. This includes all schemas, tables, and data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 text-amber-900 rounded-md">
            <p className="text-sm font-medium mb-1">Important Note</p>
            <p className="text-sm">
              The backup process relies on the <code>pg_dump</code> utility being installed on the server. If this generates an error or an empty file, ensure that PostgreSQL client tools are installed and available in the server's PATH.
            </p>
          </div>
          <Button 
            size="lg" 
            onClick={handleBackup} 
            disabled={isDownloading}
            className="w-full sm:w-auto"
          >
            {isDownloading ? 'Preparing Download...' : 'Download Full SQL Dump'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
