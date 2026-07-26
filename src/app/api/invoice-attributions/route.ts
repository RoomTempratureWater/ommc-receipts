import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone')

    if (!phone) {
      return NextResponse.json({ error: 'Phone parameter is required' }, { status: 400 })
    }

    const attributions = await db.$queryRaw`
      WITH attribution_data AS (
        -- Multi-month range invoices (Where both from and to dates exist)
        SELECT
          i.id as id,
          i.id_short as id_short,
          i.name as name,
          i.phone as phone,
          TO_CHAR(i.date, 'DD/MM/YYYY') as formatted_date,
          (date_trunc('month', i.effective_from) + (n || ' months')::interval)::date as effective_month,
          -- Cast to numeric to prevent integer division resulting in 0
          round(
            i.amount::numeric / (((EXTRACT(year FROM i.effective_to) - EXTRACT(year FROM i.effective_from)) * 12 + (EXTRACT(month FROM i.effective_to) - EXTRACT(month FROM i.effective_from)) + 1)::numeric),
            2
          ) as amount
        FROM public.invoices i
        JOIN generate_series(
          0,
          ((EXTRACT(year FROM i.effective_to) - EXTRACT(year FROM i.effective_from)) * 12 + (EXTRACT(month FROM i.effective_to) - EXTRACT(month FROM i.effective_from)))::int
        ) as n ON true
        JOIN public.tags t ON t.tag_id = i.tag
        WHERE t.tag_name = 'Church Fund'
          AND i.phone = ${phone}
          AND i.effective_from IS NOT NULL
          AND i.effective_to IS NOT NULL

        UNION ALL

        -- Single-month invoices (Where effective dates are missing)
        SELECT
          i.id as id,
          i.id_short as id_short,
          i.name as name,
          i.phone as phone,
          TO_CHAR(i.date, 'DD/MM/YYYY') as formatted_date,
          date_trunc('month', coalesce(i.effective_from, i.date))::date as effective_month,
          i.amount::numeric as amount
        FROM public.invoices i
        JOIN public.tags t ON t.tag_id = i.tag
        WHERE t.tag_name = 'Church Fund'
          AND i.phone = ${phone}
          AND (i.effective_from IS NULL OR i.effective_to IS NULL)
      )
      SELECT 
        id,
        id_short,
        name,
        phone,
        formatted_date,
        effective_month,
        -- Final formatting of the month for the frontend
        TO_CHAR(effective_month, 'Month YYYY') as month_display,
        amount
      FROM attribution_data
      ORDER BY effective_month DESC;
    `

    return NextResponse.json({ attributions }, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching invoice attributions:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}