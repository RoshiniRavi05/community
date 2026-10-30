-- =========================================================================
-- WHATSAPP COMMUNITY MANAGEMENT PLATFORM - SUPABASE POSTGRESQL SCHEMA
-- Complete schema with Row Level Security (RLS) & Policies
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. COMMUNITY MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    age INTEGER,
    age_range TEXT,
    gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')) DEFAULT 'prefer_not_to_say',
    location TEXT,
    interests TEXT[] DEFAULT '{}',
    preferred_categories TEXT[] DEFAULT '{}',
    date_added TIMESTAMPTZ DEFAULT NOW(),
    verification_status TEXT CHECK (verification_status IN ('verified', 'unverified', 'pending')) DEFAULT 'unverified',
    consent_status TEXT CHECK (consent_status IN ('opted_in', 'opted_out', 'unspecified')) DEFAULT 'unspecified',
    consent_timestamp TIMESTAMPTZ,
    preferred_channel TEXT CHECK (preferred_channel IN ('whatsapp', 'sms', 'email')) DEFAULT 'whatsapp',
    last_message_date TIMESTAMPTZ,
    next_eligible_promo_date TIMESTAMPTZ,
    is_unsubscribed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for phone and consent lookup
CREATE INDEX IF NOT EXISTS idx_members_phone ON public.members(phone);
CREATE INDEX IF NOT EXISTS idx_members_consent ON public.members(consent_status, is_unsubscribed);

-- 2. AUDIENCE SEGMENTS TABLE
CREATE TABLE IF NOT EXISTS public.audience_segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    filters JSONB NOT NULL DEFAULT '{}'::jsonb,
    member_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CAMPAIGNS TABLE
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'announcement', 'camp_event', 'event_reminder', 
        'reel_video', 'discount_offer', 'registration_deadline', 'general_update'
    )),
    media_url TEXT,
    media_type TEXT CHECK (media_type IN ('image', 'video', 'document', 'none')) DEFAULT 'none',
    link_preview_url TEXT,
    target_segment_id TEXT NOT NULL DEFAULT 'all',
    scheduled_at TIMESTAMPTZ NOT NULL,
    timezone TEXT DEFAULT 'Asia/Kolkata',
    status TEXT CHECK (status IN (
        'draft', 'pending_approval', 'scheduled', 'processing', 
        'completed', 'partially_failed', 'failed', 'cancelled'
    )) DEFAULT 'draft',
    requires_approval BOOLEAN DEFAULT FALSE,
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    internal_notes TEXT,
    total_recipients INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    read_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    blocked_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_status_scheduled ON public.campaigns(status, scheduled_at);

-- 4. MESSAGE DELIVERY LOGS TABLE
CREATE TABLE IF NOT EXISTS public.message_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    campaign_title TEXT NOT NULL,
    recipient_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    recipient_name TEXT NOT NULL,
    recipient_phone TEXT NOT NULL,
    message_text TEXT NOT NULL,
    media_url TEXT,
    status TEXT CHECK (status IN (
        'scheduled', 'queued', 'sent', 'delivered', 'read', 
        'failed', 'blocked_spam', 'blocked_quiet_hours', 'blocked_optout'
    )) NOT NULL,
    error_reason TEXT,
    whatsapp_message_id TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_logs_recipient_timestamp ON public.message_logs(recipient_phone, timestamp);
CREATE INDEX IF NOT EXISTS idx_logs_campaign ON public.message_logs(campaign_id);

-- 5. SOCIAL MEDIA POSTS TABLE
CREATE TABLE IF NOT EXISTS public.social_media_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform TEXT CHECK (platform IN ('instagram', 'youtube')) NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    author_handle TEXT,
    views_count TEXT,
    likes_count TEXT,
    caption TEXT,
    category TEXT,
    suggested_broadcast_text TEXT,
    date_added TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CAMPS & WORKSHOPS TABLE
CREATE TABLE IF NOT EXISTS public.camps_and_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    subtitle TEXT,
    category TEXT CHECK (category IN ('sports', 'coding', 'art', 'science', 'wellness')) DEFAULT 'coding',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    venue TEXT NOT NULL,
    age_group TEXT,
    fee TEXT,
    max_capacity INTEGER NOT NULL DEFAULT 30,
    registered_count INTEGER NOT NULL DEFAULT 0,
    status TEXT CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')) DEFAULT 'upcoming',
    registration_deadline DATE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. DISCOUNTS & OFFERS TABLE
CREATE TABLE IF NOT EXISTS public.discount_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')) DEFAULT 'percentage',
    discount_value NUMERIC NOT NULL,
    valid_until TIMESTAMPTZ NOT NULL,
    min_purchase NUMERIC DEFAULT 0,
    eligible_segment TEXT DEFAULT 'all',
    usage_limit INTEGER DEFAULT 100,
    used_count INTEGER DEFAULT 0,
    status TEXT CHECK (status IN ('active', 'scheduled', 'expired')) DEFAULT 'active',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. AUTOMATION ERRORS MONITOR TABLE
CREATE TABLE IF NOT EXISTS public.automation_errors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    severity TEXT CHECK (severity IN ('high', 'medium', 'low')) DEFAULT 'medium',
    component TEXT NOT NULL,
    error_message TEXT NOT NULL,
    details TEXT,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    resolved BOOLEAN DEFAULT FALSE
);

-- 9. ANTI-SPAM & FREQUENCY SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.app_settings (
    id TEXT PRIMARY KEY DEFAULT 'primary',
    max_promotional_per_day INTEGER DEFAULT 1,
    max_promotional_per_week INTEGER DEFAULT 2,
    min_interval_hours INTEGER DEFAULT 48,
    quiet_hours_enabled BOOLEAN DEFAULT TRUE,
    quiet_hours_start TIME DEFAULT '21:00',
    quiet_hours_end TIME DEFAULT '08:00',
    allowed_send_days INTEGER[] DEFAULT '{1,2,3,4,5,6}',
    duplicate_prevention_hours INTEGER DEFAULT 48,
    opt_out_keywords TEXT[] DEFAULT '{"STOP","UNSUBSCRIBE","CANCEL","END","OPTOUT"}',
    emergency_pause_active BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    admin_user TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    ip_address TEXT
);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Only authenticated administrators and service role have full access.
-- =========================================================================

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audience_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.camps_and_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins policy
CREATE POLICY "Admins have full access to members" ON public.members
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admins have full access to campaigns" ON public.campaigns
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admins have full access to message_logs" ON public.message_logs
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admins have full access to settings" ON public.app_settings
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
