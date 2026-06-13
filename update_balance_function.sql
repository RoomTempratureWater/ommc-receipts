-- This script updates the get_net_balance_by_payment_type function 
-- to use actual_amt_credit_dt instead of the created date.

CREATE OR REPLACE FUNCTION public.get_net_balance_by_payment_type(end_date date)
 RETURNS TABLE(payment_group text, total_amount numeric)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    WITH invoice_totals AS (
        SELECT 
            CASE WHEN payment_type = 'cash' THEN 'cash' ELSE 'bank' END AS payment_group,
            SUM(amount) as total
        FROM public.invoices
        WHERE actual_amt_credit_dt <= end_date
        GROUP BY CASE WHEN payment_type = 'cash' THEN 'cash' ELSE 'bank' END
    ),
    expense_totals AS (
        SELECT 
            CASE WHEN payment_type = 'cash' THEN 'cash' ELSE 'bank' END AS payment_group,
            SUM(amount) as total
        FROM public.expenditures
        WHERE actual_amt_credit_dt <= end_date
        GROUP BY CASE WHEN payment_type = 'cash' THEN 'cash' ELSE 'bank' END
    )
    SELECT 
        groups.payment_group,
        COALESCE(i.total, 0) - COALESCE(e.total, 0) as total_amount
    FROM (SELECT 'cash'::text AS payment_group UNION ALL SELECT 'bank'::text) groups
    LEFT JOIN invoice_totals i ON i.payment_group = groups.payment_group
    LEFT JOIN expense_totals e ON e.payment_group = groups.payment_group;
END;
$function$;
