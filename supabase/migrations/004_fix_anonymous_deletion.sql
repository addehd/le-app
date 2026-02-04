-- Fix anonymous property deletion
-- This migration adds RLS policy to allow deletion of anonymous property links
-- Without this policy, anonymous users cannot delete properties they created

-- Allow anyone to delete anonymous property links
CREATE POLICY "Anyone can delete anonymous property links"
  ON property_links
  FOR DELETE
  USING (shared_by = 'anon');

-- Add comment explaining the policy
COMMENT ON POLICY "Anyone can delete anonymous property links" ON property_links IS 
  'Allows unauthenticated users to delete properties marked as anonymous (shared_by = anon). This is necessary for the dual persistence model (localStorage + Supabase) to work correctly.';
