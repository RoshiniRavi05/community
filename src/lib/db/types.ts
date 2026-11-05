export type MemberGender = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type VerificationStatus = 'verified' | 'unverified' | 'pending';
export type ConsentStatus = 'opted_in' | 'opted_out' | 'unspecified';
export type ContactChannel = 'whatsapp' | 'sms' | 'email';
export type MembershipStatus = 
  | 'registered' 
  | 'invitation_sent' 
  | 'joined_community' 
  | 'not_joined' 
  | 'left_community' 
  | 'unverified';

export interface Member {
  id: string;
  name: string;
  phone: string;
  age?: number;
  ageRange?: string; // e.g. "18-25", "26-35", "36-50", "50+"
  gender: MemberGender;
  location: string;
  interests: string[];
  preferredCategories: string[];
  dateAdded: string;
  dateLeft?: string;
  verificationStatus: VerificationStatus;
  membershipStatus?: MembershipStatus;
  consentStatus: ConsentStatus;
  consentTimestamp?: string;
  preferredChannel: ContactChannel;
  lastMessageDate?: string;
  nextEligiblePromoDate?: string;
  isUnsubscribed: boolean;
  campLocation?: string; // e.g. "Palladam Camp Hub", "Avinashi STEM Center", "Tiruppur Central"
  preferredCamp?: string;
  communicationPreferences?: string[];
  district?: string; // e.g. "Tiruppur", "Coimbatore", "Bangalore"
  leadSource?: string; // e.g. "Camp Outreach Drive", "Walk-in Registration", "Referral", "Web"
  notes?: string;
}

export type CampaignStatus = 
  | 'draft' 
  | 'pending_approval' 
  | 'scheduled' 
  | 'processing' 
  | 'completed' 
  | 'partially_failed' 
  | 'failed' 
  | 'cancelled';

export type CampaignCategory = 
  | 'announcement' 
  | 'camp_event' 
  | 'event_reminder' 
  | 'reel_video' 
  | 'discount_offer' 
  | 'registration_deadline' 
  | 'general_update';

export type RecurrenceCadence = 
  | 'none'
  | 'daily'         // Every day (1 day interval)
  | 'every_3_days'  // 3 days once (3 days interval)
  | 'every_5_days'  // 5 days once (5 days interval)
  | 'weekly'        // Every week (7 days interval)
  | 'custom_days';  // Custom N-day interval

export interface Campaign {
  id: string;
  title: string;
  message: string;
  category: CampaignCategory;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'document' | 'none';
  linkPreviewUrl?: string;
  targetSegmentId: string; // "all" or specific segment ID
  scheduledAt: string; // ISO 8601
  timezone: string;
  status: CampaignStatus;
  requiresApproval: boolean;
  isDoctorApproved?: boolean;
  approvedBy?: string;
  approvedAt?: string;
  internalNotes?: string;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  failedCount: number;
  blockedCount: number;
  createdAt: string;
  updatedAt: string;

  // Repetitive / Cadence fields
  cadence?: RecurrenceCadence;
  cadenceIntervalDays?: number;
  cadenceOccurrences?: number;
  cadenceEndDate?: string;
  parentCampaignId?: string;
  seriesIndex?: number;
}

export type MessageDeliveryStatus = 
  | 'scheduled' 
  | 'queued' 
  | 'sent' 
  | 'delivered' 
  | 'read' 
  | 'failed' 
  | 'blocked_spam' 
  | 'blocked_quiet_hours' 
  | 'blocked_optout';

export interface MessageLog {
  id: string;
  campaignId: string;
  campaignTitle: string;
  recipientId: string;
  recipientName: string;
  recipientPhone: string;
  messageText: string;
  mediaUrl?: string;
  status: MessageDeliveryStatus;
  errorReason?: string;
  whatsappMessageId?: string;
  timestamp: string;
  deliveredAt?: string;
  readAt?: string;
}

export interface AudienceSegment {
  id: string;
  name: string;
  description: string;
  filters: {
    ageRange?: string[];
    gender?: MemberGender[];
    location?: string[];
    interests?: string[];
    consentOnly?: boolean;
    verificationStatus?: VerificationStatus[];
  };
  memberCount: number;
  createdAt: string;
}

export type SocialPostType = 'reel' | 'post' | 'short';
export type SocialSharingStatus = 'not_shared' | 'scheduled' | 'pending_approval' | 'shared_to_community';

export interface SocialMediaPost {
  id: string;
  platform: 'instagram' | 'youtube';
  postType?: SocialPostType;
  sharingStatus?: SocialSharingStatus;
  title: string;
  url: string;
  thumbnailUrl: string;
  authorHandle: string;
  viewsCount?: string;
  likesCount?: string;
  caption: string;
  category: string;
  dateAdded: string;
  publicationDate?: string;
  suggestedBroadcastText?: string;
}

export type CampStatus = 
  | 'draft' 
  | 'upcoming' 
  | 'registration_open' 
  | 'full' 
  | 'ongoing' 
  | 'completed' 
  | 'cancelled';

export interface CampEvent {
  id: string;
  title: string;
  subtitle: string;
  category: 'sports' | 'coding' | 'art' | 'science' | 'wellness';
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  venue: string;
  area?: string;
  ageGroup: string;
  fee: string;
  maxCapacity: number;
  registeredCount: number;
  status: CampStatus;
  registrationDeadline: string;
  registrationLink?: string;
  eligibilityCriteria?: string;
  promotionalImageUrl?: string;
  description: string;
}

export interface DiscountOffer {
  id: string;
  title: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  validUntil: string;
  minPurchase?: number;
  eligibleSegment: string;
  usageLimit: number;
  usedCount: number;
  status: 'active' | 'scheduled' | 'expired';
  description: string;
}

export interface AutomationError {
  id: string;
  timestamp: string;
  severity: 'high' | 'medium' | 'low';
  component: 'Scheduler' | 'WhatsApp API' | 'Anti-Spam Engine' | 'Media Delivery' | 'Webhook Handler';
  errorMessage: string;
  details?: string;
  campaignId?: string;
  resolved: boolean;
}

export interface AntiSpamSettings {
  maxPromotionalPerDay: number;
  maxPromotionalPerWeek: number;
  minIntervalHours: number;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // e.g. "21:00"
  quietHoursEnd: string; // e.g. "08:00"
  allowedSendDays: number[]; // 0 = Sunday, 1 = Monday, etc.
  duplicatePreventionHours: number;
  optOutKeywords: string[]; // ["STOP", "UNSUBSCRIBE", "CANCEL"]
  emergencyPauseActive: boolean;
}

export interface WhatsAppCommunityGroup {
  id: string;
  name: string;
  description?: string;
  inviteLink: string; // e.g. "https://chat.whatsapp.com/G..."
  category: 'announcement' | 'senior_care' | 'camps_tiruppur' | 'tech_youth' | 'general';
  targetAudience?: string;
  memberCount?: number;
  isPrimary?: boolean;
}

export interface WhatsAppConfig {
  phoneNumberId: string;
  businessAccountId: string;
  apiAccessToken: string; // masked in UI
  webhookVerifyToken: string;
  connectionStatus: 'connected' | 'disconnected' | 'testing';
  qualityScore: 'GREEN' | 'YELLOW' | 'RED';
  dailyLimit: number;
  usedToday: number;
  // Real WhatsApp Community & Group Integration fields
  integrationMode?: 'community_group' | 'cloud_api' | 'hybrid';
  communityName?: string;
  mainInviteLink?: string;
  communityGroups?: WhatsAppCommunityGroup[];
  defaultDispatchMethod?: 'whatsapp_web' | 'direct_chat' | 'cloud_api';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  adminUser: string;
  action: string;
  details: string;
  ipAddress?: string;
}

export type AlarmType = 'medicine' | 'meal_diet' | 'hydration' | 'vitals_check' | 'custom';

export interface CareAlarm {
  id: string;
  title: string;
  alarmType: AlarmType;
  time: string; // 24-hr format e.g. "08:00", "13:00", "20:30"
  label: string; // e.g. "Morning Dose & Light Breakfast"
  customMessage: string;
  isActive: boolean; // Persistently ON until explicitly turned off by user
  targetAgeMin: number; // e.g. 50 for elderly, 60 for seniors
  targetAgeMax?: number;
  targetAudienceLabel: string; // e.g. "Elderly Members (50+ yrs)"
  repeatDays: string[]; // ["Daily"] or specific days
  audioTone?: 'gentle_chime' | 'digital_beep' | 'classic_bell';
  lastTriggeredAt?: string;
  totalDeliveredCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AppState {
  members: Member[];
  campaigns: Campaign[];
  messageLogs: MessageLog[];
  segments: AudienceSegment[];
  socialPosts: SocialMediaPost[];
  camps: CampEvent[];
  discounts: DiscountOffer[];
  errors: AutomationError[];
  antiSpamSettings: AntiSpamSettings;
  whatsappConfig: WhatsAppConfig;
  auditLogs: AuditLog[];
  careAlarms?: CareAlarm[];
}

export type UserRole = 'doctor' | 'manager';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  name: string;
  role: UserRole;
  title: string;
  avatar: string;
}
