import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const [invoiceTags, expenseTags] = await Promise.all([
      db.invoice_tags.findMany({
        orderBy: { created_at: 'desc' }
      }),
      db.expense_tags.findMany({
        orderBy: { created_at: 'desc' }
      })
    ])
    
    return NextResponse.json({ invoiceTags, expenseTags }, { status: 200 })
  } catch (error) {
    console.error('Error fetching tags:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, ...tagData } = body

    if (type === 'invoice') {
      const tag_id = crypto.randomUUID()
      // Insert into base tags table to satisfy foreign key constraint on invoices
      await db.tags.create({
        data: { tag_id, tag_name: tagData.tag_name }
      })
      const tag = await db.invoice_tags.create({
        data: {
          tag_id,
          ...tagData
        }
      })
      return NextResponse.json({ tag }, { status: 201 })
    } else if (type === 'expense') {
      const tag_id = crypto.randomUUID()
      // Insert into base tags table to satisfy foreign key constraint on expenditures
      await db.tags.create({
        data: { tag_id, tag_name: tagData.tag_name }
      })
      const tag = await db.expense_tags.create({
        data: {
          tag_id,
          ...tagData
        }
      })
      return NextResponse.json({ tag }, { status: 201 })
    } else {
      return NextResponse.json(
        { error: 'Type must be "invoice" or "expense"' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error creating tag:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, tag_id, tag_name, sub_tag1, sub_tag2 } = body

    // Update the base tags table to keep names in sync
    // Using updateMany so it doesn't throw if the tag is missing in the base table
    await db.tags.updateMany({
      where: { tag_id },
      data: { tag_name }
    })

    if (type === 'invoice') {
      const tag = await db.invoice_tags.update({
        where: { tag_id },
        data: { tag_name, sub_tag1, sub_tag2 }
      })
      return NextResponse.json({ tag }, { status: 200 })
    } else if (type === 'expense') {
      const tag = await db.expense_tags.update({
        where: { tag_id },
        data: { tag_name, sub_tag1, sub_tag2 }
      })
      return NextResponse.json({ tag }, { status: 200 })
    } else {
      return NextResponse.json(
        { error: 'Type must be "invoice" or "expense"' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error updating tag:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
