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
    const phone = searchParams.get('phone')
    const tagId = searchParams.get('tagId')
    const paymentRef = searchParams.get('paymentRef')
    const paymentType = searchParams.get('paymentType')
    const maxDate = searchParams.get('maxDate')
    const fromDate = searchParams.get('fromDate')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const onlyPendingCredit = searchParams.get('onlyPendingCredit')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7a16c0d1-bc8b-493e-9ce5-d920499db01c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:31',message:'Reading query parameters',data:{maxDate,fromDate,startDate,endDate,allParams:Object.fromEntries(searchParams)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    // Build where clause
    const where: any = {}
    
    if (phone) where.phone = phone
    if (tagId && tagId !== '__all__') where.tag = tagId
    if (paymentRef) where.payment_reference = { contains: paymentRef, mode: 'insensitive' }
    if (paymentType && paymentType !== '__all__') where.payment_type = paymentType
    
    // Handle date filtering - support both maxDate/fromDate (InvoiceHistory) and startDate/endDate (BalanceSheet)
    // Use startDate/endDate if provided, otherwise fall back to maxDate/fromDate
    const effectiveStartDate = startDate || fromDate
    const effectiveEndDate = endDate || maxDate
    
    if (effectiveEndDate) {
      where.created_at = { ...where.created_at, lte: new Date(effectiveEndDate + 'T23:59:59') }
    }
    if (effectiveStartDate) {
      where.created_at = { ...where.created_at, gte: new Date(effectiveStartDate + 'T00:00:00') }
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7a16c0d1-bc8b-493e-9ce5-d920499db01c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:52',message:'Where clause after date filters',data:{where:JSON.stringify(where),effectiveStartDate,effectiveEndDate},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    if (onlyPendingCredit === 'true') where.actual_amt_credit_dt = null

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7a16c0d1-bc8b-493e-9ce5-d920499db01c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:48',message:'Final where clause before query',data:{where:JSON.stringify(where),hasDateFilter:!!where.created_at},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    // Allow all users to see all invoices
    const invoices = await db.invoices.findMany({
      where,
      include: { tags: true },
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    })

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7a16c0d1-bc8b-493e-9ce5-d920499db01c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:56',message:'Query result',data:{invoiceCount:invoices.length,firstDate:invoices[0]?.created_at,lastDate:invoices[invoices.length-1]?.created_at},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    return NextResponse.json({ invoices }, { status: 200 })
  } catch (error) {
    console.error('Error fetching invoices:', error)
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7a16c0d1-bc8b-493e-9ce5-d920499db01c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:91',message:'POST request received',data:{body:JSON.stringify(body)},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    const invoice = await db.invoices.create({
      data: {
        ...body,
        user_id: null // Set to null instead of invalid UUID string
      },
      include: { tags: true }
    })
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7a16c0d1-bc8b-493e-9ce5-d920499db01c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:98',message:'Invoice created in database',data:{invoiceId:invoice.id,createdAt:invoice.created_at,date:invoice.date},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'F'})}).catch(()=>{});
    // #endregion

    return NextResponse.json({ invoice }, { status: 201 })
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
