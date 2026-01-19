-- Add slug column to email_templates
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS slug VARCHAR(100) UNIQUE;

-- Add missing columns to notifications
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS category VARCHAR(50),
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS action_label VARCHAR(100),
ADD COLUMN IF NOT EXISTS channels_sent JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS group_key VARCHAR(100),
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}';

-- Add missing columns to notification_preferences
ALTER TABLE notification_preferences 
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS digest_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS digest_frequency VARCHAR(20) DEFAULT 'daily',
ADD COLUMN IF NOT EXISTS digest_time TIME DEFAULT '09:00',
ADD COLUMN IF NOT EXISTS digest_day INTEGER DEFAULT 1;

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category, created_at DESC);

-- Update existing notifications to have default category
UPDATE notifications SET category = type WHERE category IS NULL;