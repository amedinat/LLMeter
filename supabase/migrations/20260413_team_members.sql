-- Team member management for Team/Enterprise plan
-- organizations: one per Team-plan user (auto-created)
-- organization_members: up to 5 total (including owner) for Team plan

CREATE TABLE IF NOT EXISTS organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL DEFAULT 'My Team',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (owner_id)
);

CREATE TABLE IF NOT EXISTS organization_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_email TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'removed')),
  invite_token  TEXT UNIQUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS org_members_org_id   ON organization_members(org_id);
CREATE INDEX IF NOT EXISTS org_members_user_id  ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS org_members_token    ON organization_members(invite_token);

-- RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Owner can read/write their org
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organizations' AND policyname = 'orgs_owner') THEN
    CREATE POLICY orgs_owner ON organizations FOR ALL USING (owner_id = auth.uid());
  END IF;
END $$;

-- Members can read orgs they belong to
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organizations' AND policyname = 'orgs_member_read') THEN
    CREATE POLICY orgs_member_read ON organizations FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM organization_members om
        WHERE om.org_id = id
          AND om.user_id = auth.uid()
          AND om.status = 'active'
      )
    );
  END IF;
END $$;

-- Owner can manage members in their org
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organization_members' AND policyname = 'org_members_owner') THEN
    CREATE POLICY org_members_owner ON organization_members FOR ALL USING (
      EXISTS (
        SELECT 1 FROM organizations o
        WHERE o.id = org_id AND o.owner_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Members can read their own membership rows
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organization_members' AND policyname = 'org_members_self_read') THEN
    CREATE POLICY org_members_self_read ON organization_members FOR SELECT USING (user_id = auth.uid());
  END IF;
END $$;

-- Members can update their own row (accept invite)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organization_members' AND policyname = 'org_members_self_accept') THEN
    CREATE POLICY org_members_self_accept ON organization_members FOR UPDATE USING (user_id = auth.uid());
  END IF;
END $$;
