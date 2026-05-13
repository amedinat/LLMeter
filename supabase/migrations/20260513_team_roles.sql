-- Add fine-grained roles to organization_members
-- Before: only 'owner' | 'member'
-- After:  'owner' | 'admin' | 'member' | 'viewer'
--
-- owner  — full access + billing management, cannot be changed
-- admin  — full access, can manage team members (invite/remove/promote up to admin)
-- member — standard access (add providers, create alerts), cannot manage team
-- viewer — read-only access to cost data

ALTER TABLE organization_members
  DROP CONSTRAINT IF EXISTS organization_members_role_check;

ALTER TABLE organization_members
  ADD CONSTRAINT organization_members_role_check
  CHECK (role IN ('owner', 'admin', 'member', 'viewer'));
