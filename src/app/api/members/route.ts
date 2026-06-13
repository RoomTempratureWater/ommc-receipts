import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone')

    const where = phone ? { phone } : {}

    const members = await db.members.findMany({
      where,
      orderBy: { created_at: 'desc' }
    })

    // Convert BigInt to string for JSON serialization
    const serializedMembers = members.map(member => ({
      ...member,
      id: member.id.toString()
    }))

    return NextResponse.json({ members: serializedMembers }, { status: 200 })
  } catch (error) {
    console.error('Error fetching members:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, first_name, middle_name, last_name, phone, address } = body

    if (!id) {
      return NextResponse.json({ error: 'ID parameter is required' }, { status: 400 })
    }

    const member = await db.members.update({
      where: { id: BigInt(id) },
      data: {
        first_name,
        middle_name,
        last_name,
        phone,
        address
      }
    })

    const serializedMember = {
      ...member,
      id: member.id.toString()
    }

    return NextResponse.json({ member: serializedMember }, { status: 200 })
  } catch (error) {
    console.error('Error updating member:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const member = await db.members.create({
      data: body
    })

    // Convert BigInt to string for JSON serialization
    const serializedMember = {
      ...member,
      id: member.id.toString()
    }

    return NextResponse.json({ member: serializedMember }, { status: 201 })
  } catch (error) {
    console.error('Error creating member:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
