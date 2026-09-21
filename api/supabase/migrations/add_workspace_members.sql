ALTER TABLE workspaces
ADD COLUMN member_ids uuid[] NOT NULL DEFAULT '{}';