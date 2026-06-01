-- Add "grace" status to membership_status enum
ALTER TYPE membership_status ADD VALUE IF NOT EXISTS 'grace';

-- Add grace_ends_at column: non-null only while status = 'grace'
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS grace_ends_at TIMESTAMP;
