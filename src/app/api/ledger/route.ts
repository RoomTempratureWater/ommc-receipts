import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')

    const dateFilter: any = { not: null }
    if (fromDate) {
      dateFilter.gte = new Date(fromDate + 'T00:00:00')
    }
    if (toDate) {
      dateFilter.lte = new Date(toDate + 'T23:59:59')
    }

    // Group invoices
    const invoicesGrouped = await db.invoices.groupBy({
      by: ['actual_amt_credit_dt', 'tag'],
      _sum: {
        amount: true
      },
      where: {
        actual_amt_credit_dt: dateFilter
      },
      orderBy: {
        actual_amt_credit_dt: 'asc'
      }
    });

    // Group expenditures
    const expendituresGrouped = await db.expenditures.groupBy({
      by: ['actual_amt_credit_dt', 'tag'],
      _sum: {
        amount: true
      },
      where: {
        actual_amt_credit_dt: dateFilter
      },
      orderBy: {
        actual_amt_credit_dt: 'asc'
      }
    });

    // Fetch tags to map UUID to name
    const tags = await db.tags.findMany();
    const tagMap = tags.reduce((acc: any, tag: any) => {
      acc[tag.tag_id] = tag.tag_name;
      return acc;
    }, {});

    // Format results
    const invoices = invoicesGrouped.map((item: any) => ({
      date: item.actual_amt_credit_dt,
      tagId: item.tag,
      tagName: item.tag ? tagMap[item.tag] || 'Unknown' : 'Unknown',
      amount: Number(item._sum.amount) || 0
    }));

    const expenditures = expendituresGrouped.map((item: any) => ({
      date: item.actual_amt_credit_dt,
      tagId: item.tag,
      tagName: item.tag ? tagMap[item.tag] || 'Unknown' : 'Unknown',
      amount: Number(item._sum.amount) || 0
    }));

    return NextResponse.json({ invoices, expenditures }, { status: 200 })
  } catch (error) {
    console.error('Error fetching ledger data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
