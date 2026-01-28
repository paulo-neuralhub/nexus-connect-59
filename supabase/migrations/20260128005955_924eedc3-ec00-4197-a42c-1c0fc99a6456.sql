-- Allow authenticated users to read voip_enabled from telephony_config
-- This is necessary for the SoftphoneWidget to know if VoIP is globally enabled

CREATE POLICY "Anyone can read voip_enabled"
ON public.telephony_config
FOR SELECT
USING (true);