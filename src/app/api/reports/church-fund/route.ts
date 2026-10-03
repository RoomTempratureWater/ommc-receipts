import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startMonthStr = searchParams.get('startMonth')
    const endMonthStr = searchParams.get('endMonth')

    if (!startMonthStr || !endMonthStr) {
      return NextResponse.json({ error: 'startMonth and endMonth parameters are required' }, { status: 400 })
    }

    // Append -01 to make them valid date strings for Postgres
    const startDate = `${startMonthStr}-01`
    // End date is the last day of the end month. Easiest way in Postgres is to add 1 month to the 1st, then subtract 1 day.
    // But since we just filter by `effective_month` which is always the 1st of the month, we can just use `${endMonthStr}-01`.
    const endDate = `${endMonthStr}-01`

    const attributions: any[] = await db.$queryRaw`
      WITH attribution_data AS (
        -- Multi-month range invoices (Where both from and to dates exist)
        SELECT
          m.id as member_id,
          m.first_name,
          m.last_name,
          m.phone,
          (date_trunc('month', i.effective_from) + (n || ' months')::interval)::date as effective_month,
          -- Cast to numeric to prevent integer division resulting in 0
          round(
            i.amount::numeric / (((EXTRACT(year FROM i.effective_to) - EXTRACT(year FROM i.effective_from)) * 12 + (EXTRACT(month FROM i.effective_to) - EXTRACT(month FROM i.effective_from)) + 1)::numeric),
            2
          ) as amount
        FROM public.invoices i
        JOIN public.members m ON m.phone = i.phone
        JOIN generate_series(
          0,
          ((EXTRACT(year FROM i.effective_to) - EXTRACT(year FROM i.effective_from)) * 12 + (EXTRACT(month FROM i.effective_to) - EXTRACT(month FROM i.effective_from)))::int
        ) as n ON true
        JOIN public.tags t ON t.tag_id = i.tag
        WHERE t.tag_name = 'Church Fund'
          AND i.effective_from IS NOT NULL
          AND i.effective_to IS NOT NULL

        UNION ALL

        -- Single-month invoices (Where effective dates are missing)
        SELECT
          m.id as member_id,
          m.first_name,
          m.last_name,
          m.phone,
          date_trunc('month', coalesce(i.effective_from, i.date))::date as effective_month,
          i.amount::numeric as amount
        FROM public.invoices i
        JOIN public.members m ON m.phone = i.phone
        JOIN public.tags t ON t.tag_id = i.tag
        WHERE t.tag_name = 'Church Fund'
          AND (i.effective_from IS NULL OR i.effective_to IS NULL)
      )
      SELECT 
        member_id,
        first_name,
        last_name,
        phone,
        TO_CHAR(effective_month, 'YYYY-MM') as month_key,
        SUM(amount) as total_amount
      FROM attribution_data
      WHERE effective_month >= ${startDate}::date AND effective_month <= ${endDate}::date
      GROUP BY member_id, first_name, last_name, phone, TO_CHAR(effective_month, 'YYYY-MM')
      ORDER BY first_name, last_name, month_key ASC;
    `

    // Transform into grouped structure by user
    const groupedData = new Map<string, any>()

    attributions.forEach((row) => {
      const userKey = row.phone || row.member_id
      if (!groupedData.has(userKey)) {
        groupedData.set(userKey, {
          name: `${row.first_name} ${row.last_name || ''}`.trim(),
          phone: row.phone,
          months: {},
          total: 0
        })
      }
      const userObj = groupedData.get(userKey)
      const amt = Number(row.total_amount)
      userObj.months[row.month_key] = amt
      userObj.total += amt
    })

    const report = Array.from(groupedData.values())

    return NextResponse.json({ report }, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching church fund report:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
