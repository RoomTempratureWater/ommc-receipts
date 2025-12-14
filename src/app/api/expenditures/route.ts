import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import jwt from 'jsonwebtoken'

async function getUserIdFromToken(request: NextRequest): Promise<string | null> {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) return null
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
    return decoded.userId
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication back when user auth is implemented
    // const userId = await getUserIdFromToken(request)
    // if (!userId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const tags = searchParams.get('tags')
    const paymentRef = searchParams.get('paymentRef')
    const onlyPendingCredit = searchParams.get('onlyPendingCredit')

    // Build where clause
    const where: any = {}
    
    if (startDate) where.actual_amt_credit_dt = { gte: new Date(startDate) }
    if (endDate) where.actual_amt_credit_dt = { ...where.actual_amt_credit_dt, lte: new Date(endDate) }
    if (tags) {
      const tagArray = tags.split(',').filter(t => t.trim())
      if (tagArray.length) where.tag = { in: tagArray }
    }
    if (paymentRef) where.payment_reference = { contains: paymentRef, mode: 'insensitive' }
    if (onlyPendingCredit === 'true') where.actual_amt_credit_dt = null

    // Allow all users to see all expenditures
    const expenditures = await db.expenditures.findMany({
      where,
      include: { tags: true },
      orderBy: { date: 'desc' }
    })

    return NextResponse.json({ expenditures }, { status: 200 })
  } catch (error) {
    console.error('Error fetching expenditures:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication back when user auth is implemented
    // const userId = await getUserIdFromToken(request)
    // if (!userId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const body = await request.json()
    const expenditure = await db.expenditures.create({
      data: {
        ...body,
        user_id: null // Set to null instead of invalid UUID string
      },
      include: { tags: true }
    })

    return NextResponse.json({ expenditure }, { status: 201 })
  } catch (error) {
    console.error('Error creating expenditure:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // TODO: Add authentication back when user auth is implemented
    // const userId = await getUserIdFromToken(request)
    // if (!userId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const body = await request.json()
    const { id, ...updateData } = body

    const expenditure = await db.expenditures.update({
      where: { id },
      data: updateData,
      include: { tags: true }
    })

    return NextResponse.json({ expenditure }, { status: 200 })
  } catch (error) {
    console.error('Error updating expenditure:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // TODO: Add authentication back when user auth is implemented
    // const userId = await getUserIdFromToken(request)
    // if (!userId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    await db.expenditures.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Expenditure deleted successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error deleting expenditure:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
