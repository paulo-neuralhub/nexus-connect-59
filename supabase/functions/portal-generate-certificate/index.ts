import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const jwt = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(jwt);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = claimsData.claims.sub as string;

    // Get org from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", userId)
      .single();
    if (!profile) {
      return new Response(JSON.stringify({ error: "no_profile" }), { status: 403, headers: corsHeaders });
    }
    const orgId = profile.organization_id;

    const { matter_id } = await req.json();
    if (!matter_id) {
      return new Response(JSON.stringify({ error: "missing_matter_id" }), { status: 400, headers: corsHeaders });
    }

    // STEP 1: Get matter
    const { data: matter } = await supabase
      .from("matters")
      .select("id, title, status, jurisdiction, client_id, reference_number")
      .eq("id", matter_id)
      .eq("organization_id", orgId)
      .single();

    if (!matter) {
      return new Response(JSON.stringify({ error: "matter_not_found" }), { status: 404, headers: corsHeaders });
    }
    if (matter.status !== "registered") {
      return new Response(JSON.stringify({ error: "not_registered_yet" }), { status: 400, headers: corsHeaders });
    }

    // Get account + org
    const [accountRes, orgRes] = await Promise.all([
      supabase.from("crm_accounts").select("id, name, tax_id, portal_user_id").eq("id", matter.client_id).single(),
      supabase.from("organizations").select("name, tax_id, portal_subdomain").eq("id", orgId).single(),
    ]);
    const account = accountRes.data;
    const org = orgRes.data;

    // STEP 2: Try trademark_assets
    let markName = matter.title || "Sin nombre";
    let registrationNumber = matter.reference_number || "";
    let registrationDate: string | null = null;
    let niceClasses: number[] = [];

    const { data: tmAsset } = await supabase
      .from("trademark_assets")
      .select("mark_name, registration_number, registration_date, nice_classes")
      .eq("matter_id", matter_id)
      .limit(1)
      .maybeSingle();

    if (tmAsset) {
      markName = tmAsset.mark_name || markName;
      registrationNumber = tmAsset.registration_number || registrationNumber;
      registrationDate = tmAsset.registration_date || null;
      niceClasses = tmAsset.nice_classes || [];
    }

    // STEP 3: Certificate number
    const slug = org?.portal_subdomain || "org";
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from("portal_certificates")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId);
    const seqNum = String((count || 0) + 1).padStart(6, "0");
    const certNumber = `CERT-${slug.toUpperCase()}-${year}-${seqNum}`;

    // STEP 4: content_hash
    const encoder = new TextEncoder();
    const hashData = encoder.encode(
      `${markName}|${registrationNumber}|${matter.jurisdiction}|${account?.name}|${registrationDate}`
    );
    const hashBuffer = await crypto.subtle.digest("SHA-256", hashData);
    const contentHash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const verificationUrl = `${supabaseUrl}/verify/${certNumber}`;

    // STEP 5: Upsert certificate
    const { data: cert, error: certErr } = await supabase
      .from("portal_certificates")
      .upsert(
        {
          organization_id: orgId,
          crm_account_id: matter.client_id,
          matter_id,
          certificate_type: "registration_confirmation",
          certificate_number: certNumber,
          mark_name: markName,
          registration_number: registrationNumber,
          registration_date: registrationDate,
          jurisdiction_code: matter.jurisdiction,
          nice_classes: niceClasses,
          owner_name: account?.name || "Titular",
          despacho_name: org?.name || "Despacho",
          despacho_tax_id: org?.tax_id || null,
          verification_url: verificationUrl,
          content_hash: contentHash,
          generated_by: userId,
          generated_at: new Date().toISOString(),
        },
        { onConflict: "matter_id" }
      )
      .select("id, certificate_number")
      .single();

    if (certErr) {
      return new Response(JSON.stringify({ error: "certificate_creation_failed", detail: certErr.message }), { status: 500, headers: corsHeaders });
    }

    // STEP 6: Update matter
    await supabase
      .from("matters")
      .update({ portal_certificate_generated: true })
      .eq("id", matter_id);

    // STEP 7: Notification with dedup
    const today = new Date().toISOString().slice(0, 10);
    const dedupKey = `certificate_ready_${matter_id}_${today}`;
    let notificationSent = false;

    if (account?.portal_user_id) {
      const { error: notifErr } = await supabase.from("portal_notifications").insert({
        organization_id: orgId,
        crm_account_id: matter.client_id,
        portal_user_id: account.portal_user_id,
        type: "certificate_ready",
        title: "Certificado disponible",
        message: `El certificado de registro de "${markName}" está disponible para descargar.`,
        matter_id,
        priority: "normal",
        dedup_key: dedupKey,
      });
      notificationSent = !notifErr;
    }

    // STEP 8: Try email
    try {
      if (account?.portal_user_id) {
        await supabase.functions.invoke("comm-send-email", {
          body: {
            organization_id: orgId,
            to: (await supabase.auth.admin.getUserById(account.portal_user_id)).data?.user?.email,
            subject: `Certificado de registro: ${markName}`,
            body_html: `<p>Tu certificado de registro para "${markName}" está listo.</p><p>Accede a tu portal para descargarlo.</p>`,
          },
        });
      }
    } catch (_) { /* continue */ }

    return new Response(
      JSON.stringify({
        certificate_id: cert.id,
        certificate_number: cert.certificate_number,
        verification_url: verificationUrl,
        notification_sent: notificationSent,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: "internal_error", detail: String(err) }), { status: 500, headers: corsHeaders });
  }
});
