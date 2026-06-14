'use client'

import { useState } from 'react'
import Papa from 'papaparse'

interface CsvRow {
  Address?: string;
  'First Name'?: string;
  'Middle Name'?: string;
  'Last Name'?: string;
  'Mobile Number'?: string;
}

interface MemberPayload {
  address: string;
  firstName: string;
  middleName: string;
  lastName: string;
  mobileNumber: string;
}

export default function UploadMembersPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [successes, setSuccesses] = useState<any[]>([])
  const [failures, setFailures] = useState<any[]>([])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      // Reset previous results
      setSuccesses([])
      setFailures([])
    }
  }

  const handleUpload = () => {
    if (!file) return

    setLoading(true)
    setSuccesses([])
    setFailures([])

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const members: MemberPayload[] = results.data.map(row => ({
            address: row['Address']?.trim() || '',
            firstName: row['First Name']?.trim() || '',
            middleName: row['Middle Name']?.trim() || '',
            lastName: row['Last Name']?.trim() || '',
            mobileNumber: row['Mobile Number']?.trim() || ''
          }))

          const res = await fetch('/api/members/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ members })
          })

          const data = await res.json()

          if (!res.ok) {
            throw new Error(data.error || 'Failed to upload members')
          }

          setSuccesses(data.successfulRows || [])
          setFailures(data.failedRows || [])

        } catch (error: any) {
          console.error('Error during upload:', error)
          alert('Upload failed: ' + error.message)
        } finally {
          setLoading(false)
        }
      },
      error: (error) => {
        console.error('CSV parse error:', error)
        alert('Failed to parse CSV file.')
        setLoading(false)
      }
    })
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Bulk Upload Members</h1>

      <div className="bg-white p-6 rounded-lg shadow border mb-8">
        <h2 className="text-lg font-semibold mb-4">Select CSV File</h2>
        <p className="text-gray-600 text-sm mb-4">
          The CSV file must contain the following headers exactly (case-sensitive): <br/>
          <code className="bg-gray-100 px-1 py-0.5 rounded">Address</code>, <code className="bg-gray-100 px-1 py-0.5 rounded">First Name</code>, <code className="bg-gray-100 px-1 py-0.5 rounded">Middle Name</code>, <code className="bg-gray-100 px-1 py-0.5 rounded">Last Name</code>, <code className="bg-gray-100 px-1 py-0.5 rounded">Mobile Number</code>
        </p>
        
        <div className="flex items-center gap-4">
          <input 
            type="file" 
            accept=".csv"
            onChange={handleFileChange}
            className="border border-gray-300 p-2 rounded"
          />
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Uploading...' : 'Upload & Process'}
          </button>
        </div>
      </div>

      {(successes.length > 0 || failures.length > 0) && (
        <div className="space-y-8">
          {/* Failures Table */}
          {failures.length > 0 && (
            <div className="bg-red-50 p-6 rounded-lg border border-red-200">
              <h2 className="text-xl font-bold text-red-700 mb-4">
                Failed to Add ({failures.length})
              </h2>
              <div className="overflow-x-auto bg-white rounded shadow-sm">
                <table className="min-w-full divide-y divide-red-200">
                  <thead className="bg-red-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-red-800 uppercase">First Name</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-red-800 uppercase">Last Name</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-red-800 uppercase">Mobile</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-red-800 uppercase">Error Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-100">
                    {failures.map((row, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 text-sm text-gray-800">{row.firstName || '-'}</td>
                        <td className="px-4 py-2 text-sm text-gray-800">{row.lastName || '-'}</td>
                        <td className="px-4 py-2 text-sm text-gray-800">{row.mobileNumber || '-'}</td>
                        <td className="px-4 py-2 text-sm font-medium text-red-600">{row._error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Successes Table */}
          {successes.length > 0 && (
            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <h2 className="text-xl font-bold text-green-700 mb-4">
                Successfully Added ({successes.length})
              </h2>
              <div className="overflow-x-auto bg-white rounded shadow-sm">
                <table className="min-w-full divide-y divide-green-200">
                  <thead className="bg-green-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-green-800 uppercase">First Name</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-green-800 uppercase">Last Name</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-green-800 uppercase">Mobile</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-green-800 uppercase">Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-green-100">
                    {successes.map((row, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 text-sm text-gray-800">{row.firstName || '-'}</td>
                        <td className="px-4 py-2 text-sm text-gray-800">{row.lastName || '-'}</td>
                        <td className="px-4 py-2 text-sm text-gray-800">{row.mobileNumber || '-'}</td>
                        <td className="px-4 py-2 text-sm text-gray-800">{row.address || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
