import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { members } = body

    if (!members || !Array.isArray(members)) {
      return NextResponse.json({ error: 'Invalid payload. Expected an array of members.' }, { status: 400 })
    }

    const successfulRows: any[] = []
    const failedRows: any[] = []

    // Process sequentially to isolate errors to specific rows
    for (const [index, row] of members.entries()) {
      try {
        const created = await db.members.create({
          data: {
            first_name: row.firstName || null,
            middle_name: row.middleName || null,
            last_name: row.lastName || null,
            phone: row.mobileNumber || null,
            address: row.address || null,
          }
        })
        
        // Convert BigInt to string before returning
        const safeCreated = {
          ...created,
          id: created.id.toString()
        }
        
        successfulRows.push({ ...row, _dbResult: safeCreated })
      } catch (error: any) {
        failedRows.push({ 
          ...row, 
          _error: error?.message || 'Database error' 
        })
      }
    }

    return NextResponse.json({ 
      success: true, 
      successfulRows, 
      failedRows 
    }, { status: 200 })

  } catch (error: any) {
    console.error('Error in bulk member upload:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message },
      { status: 500 }
    )
  }
}
