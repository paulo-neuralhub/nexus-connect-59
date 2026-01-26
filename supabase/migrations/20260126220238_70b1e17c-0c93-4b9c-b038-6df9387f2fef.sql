-- Fix nested aggregates in VAT breakdown generation (caused 42803 errors during invoice_items triggers)

CREATE OR REPLACE FUNCTION public.calculate_invoice_vat_breakdown(p_invoice_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_breakdown JSONB;
BEGIN
  -- IMPORTANT: Avoid nested aggregates (e.g., jsonb_agg(SUM(...))) by aggregating in a subquery first.
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'rate', t.tax_rate,
        'base', t.base,
        'amount', t.amount,
        'surcharge', t.surcharge
      )
      ORDER BY t.tax_rate
    ),
    '[]'::jsonb
  )
  INTO v_breakdown
  FROM (
    SELECT
      tax_rate,
      SUM(subtotal) AS base,
      SUM(COALESCE(tax_amount, 0)) AS amount,
      SUM(COALESCE(surcharge_amount, 0)) AS surcharge
    FROM public.invoice_items
    WHERE invoice_id = p_invoice_id
    GROUP BY tax_rate
  ) t;

  -- Update invoice cached breakdown
  UPDATE public.invoices
  SET vat_breakdown = v_breakdown,
      updated_at = NOW()
  WHERE id = p_invoice_id;

  RETURN v_breakdown;
END;
$function$;