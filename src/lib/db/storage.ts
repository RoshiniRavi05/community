import fs from 'fs';
import path from 'path';
import { AppState, Member, Campaign, MessageLog, AudienceSegment, SocialMediaPost, CampEvent, DiscountOffer, AutomationError, AntiSpamSettings, WhatsAppConfig, AuditLog, CareAlarm } from './types';

const DATA_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const INITIAL_MEMBERS: Member[] = [
  {
    id: 'mem_1',
    name: 'Aarav Sharma',
    phone: '+919876543210',
    age: 28,
    ageRange: '26-35',
    gender: 'male',
    location: 'Bangalore, Indiranagar',
    interests: ['Coding', 'AI / ML', 'Weekend Hackathons'],
    preferredCategories: ['announcement', 'camp_event', 'reel_video'],
    dateAdded: '2026-08-15T10:30:00Z',
    verificationStatus: 'verified',
    consentStatus: 'opted_in',
    consentTimestamp: '2026-08-15T10:30:00Z',
    preferredChannel: 'whatsapp',
    lastMessageDate: '2026-10-24T18:00:00Z',
    nextEligiblePromoDate: '2026-10-29T00:00:00Z',
    isUnsubscribed: false,
    notes: 'Community core volunteer; attends weekend hackathons'
  },
  {
    id: 'mem_2',
    name: 'Priya Sundaram',
    phone: '+919812345678',
    age: 34,
    ageRange: '26-35',
    gender: 'female',
    location: 'Chennai, Adyar',
    interests: ['Parenting', 'Kids Summer Camps', 'STEM Workshops'],
    preferredCategories: ['camp_event', 'discount_offer'],
    dateAdded: '2026-07-20T14:15:00Z',
    verificationStatus: 'verified',
    consentStatus: 'opted_in',
    consentTimestamp: '2026-07-20T14:15:00Z',
    preferredChannel: 'whatsapp',
    lastMessageDate: '2026-10-22T09:30:00Z',
    nextEligiblePromoDate: '2026-10-27T00:00:00Z',
    isUnsubscribed: false,
    notes: 'Parent of two kids (Ages 7 and 10); interested in science workshops'
  },
  {
    id: 'mem_3',
    name: 'Rohan Deshmukh',
    phone: '+919734567890',
    age: 22,
    ageRange: '18-25',
    gender: 'male',
    location: 'Pune, Kothrud',
    interests: ['Robotics', 'Reels / Tech Shorts', 'Sports'],
    preferredCategories: ['reel_video', 'camp_event'],
    dateAdded: '2026-09-02T11:00:00Z',
    verificationStatus: 'verified',
    consentStatus: 'opted_in',
    consentTimestamp: '2026-09-02T11:00:00Z',
    preferredChannel: 'whatsapp',
    lastMessageDate: '2026-10-25T17:45:00Z',
    nextEligiblePromoDate: '2026-10-30T00:00:00Z',
    isUnsubscribed: false,
    notes: 'Engineering student, very active on WhatsApp discussions'
  },
  {
    id: 'mem_4',
    name: 'Ananya Roy',
    phone: '+919654321987',
    age: 31,
    ageRange: '26-35',
    gender: 'female',
    location: 'Mumbai, Bandra West',
    interests: ['Design & Arts', 'Creative Workshops', 'Offers'],
    preferredCategories: ['discount_offer', 'announcement'],
    dateAdded: '2026-06-10T08:20:00Z',
    verificationStatus: 'verified',
    consentStatus: 'opted_in',
    consentTimestamp: '2026-06-10T08:20:00Z',
    preferredChannel: 'whatsapp',
    lastMessageDate: '2026-10-20T12:00:00Z',
    nextEligiblePromoDate: '2026-10-25T00:00:00Z',
    isUnsubscribed: false
  },
  {
    id: 'mem_5',
    name: 'Vikram Malhotra',
    phone: '+919988776655',
    age: 42,
    ageRange: '36-50',
    gender: 'male',
    location: 'Delhi NCR, Gurgaon',
    interests: ['Wellness', 'Executive Camps', 'Discounts'],
    preferredCategories: ['camp_event', 'discount_offer'],
    dateAdded: '2026-05-18T16:40:00Z',
    verificationStatus: 'verified',
    consentStatus: 'opted_in',
    consentTimestamp: '2026-05-18T16:40:00Z',
    preferredChannel: 'whatsapp',
    lastMessageDate: '2026-10-23T15:10:00Z',
    nextEligiblePromoDate: '2026-10-28T00:00:00Z',
    isUnsubscribed: false
  },
  {
    id: 'mem_6',
    name: 'Sneha Patel',
    phone: '+919123456780',
    age: 26,
    ageRange: '26-35',
    gender: 'female',
    location: 'Ahmedabad, Satellite',
    interests: ['Tech Tutorials', 'Social Reels', 'Community Meetups'],
    preferredCategories: ['reel_video', 'general_update'],
    dateAdded: '2026-09-14T09:15:00Z',
    verificationStatus: 'verified',
    consentStatus: 'opted_in',
    consentTimestamp: '2026-09-14T09:15:00Z',
    preferredChannel: 'whatsapp',
    lastMessageDate: '2026-10-26T11:00:00Z',
    nextEligiblePromoDate: '2026-10-31T00:00:00Z',
    isUnsubscribed: false
  },
  {
    id: 'mem_7',
    name: 'Kavita Nair',
    phone: '+919845012345',
    age: 38,
    ageRange: '36-50',
    gender: 'female',
    location: 'Kochi, Kakkanad',
    interests: ['Kids Camp', 'Parenting', 'Art'],
    preferredCategories: ['camp_event', 'announcement'],
    dateAdded: '2026-04-12T13:00:00Z',
    verificationStatus: 'verified',
    consentStatus: 'opted_in',
    consentTimestamp: '2026-04-12T13:00:00Z',
    preferredChannel: 'whatsapp',
    lastMessageDate: '2026-10-21T10:00:00Z',
    nextEligiblePromoDate: '2026-10-26T00:00:00Z',
    isUnsubscribed: false
  },
  {
    id: 'mem_8',
    name: 'Devansh Kulkarni',
    phone: '+919765432109',
    age: 19,
    ageRange: '18-25',
    gender: 'male',
    location: 'Hyderabad, Hitec City',
    interests: ['Coding', 'Robotics', 'Reels'],
    preferredCategories: ['reel_video', 'camp_event'],
    dateAdded: '2026-09-28T17:00:00Z',
    verificationStatus: 'unverified',
    consentStatus: 'opted_in',
    consentTimestamp: '2026-09-28T17:00:00Z',
    preferredChannel: 'whatsapp',
    lastMessageDate: undefined,
    nextEligiblePromoDate: '2026-10-28T00:00:00Z',
    isUnsubscribed: false
  },
  {
    id: 'mem_9',
    name: 'Tarun Verma',
    phone: '+919899112233',
    age: 30,
    ageRange: '26-35',
    gender: 'male',
    location: 'Noida, Sector 62',
    interests: ['Sports', 'Offers'],
    preferredCategories: ['discount_offer'],
    dateAdded: '2026-03-01T10:00:00Z',
    verificationStatus: 'verified',
    consentStatus: 'opted_out',
    consentTimestamp: '2026-09-10T14:30:00Z',
    preferredChannel: 'whatsapp',
    lastMessageDate: '2026-09-10T14:28:00Z',
    nextEligiblePromoDate: undefined,
    isUnsubscribed: true,
    notes: 'Member replied STOP on 10 Sep 2026; placed on suppression list'
  },
  {
    id: 'mem_10',
    name: 'Meera Iyer',
    phone: '+919444098765',
    age: 27,
    ageRange: '26-35',
    gender: 'female',
    location: 'Chennai, Anna Nagar',
    interests: ['Coding', 'Design & Arts', 'AI / ML'],
    preferredCategories: ['announcement', 'reel_video'],
    dateAdded: '2026-07-04T12:00:00Z',
    verificationStatus: 'verified',
    consentStatus: 'opted_in',
    consentTimestamp: '2026-07-04T12:00:00Z',
    preferredChannel: 'whatsapp',
    lastMessageDate: '2026-10-24T18:00:00Z',
    nextEligiblePromoDate: '2026-10-29T00:00:00Z',
    isUnsubscribed: false
  },
  {
    id: 'mem_11',
    name: 'Siddharth Sen',
    phone: '+919830012345',
    age: 36,
    ageRange: '36-50',
    gender: 'male',
    location: 'Kolkata, Salt Lake',
    interests: ['STEM Workshops', 'General Updates'],
    preferredCategories: ['general_update', 'announcement'],
    dateAdded: '2026-02-15T09:00:00Z',
    verificationStatus: 'verified',
    consentStatus: 'opted_in',
    consentTimestamp: '2026-02-15T09:00:00Z',
    preferredChannel: 'whatsapp',
    lastMessageDate: '2026-10-18T16:00:00Z',
    nextEligiblePromoDate: '2026-10-23T00:00:00Z',
    isUnsubscribed: false
  },
  {
    id: 'mem_12',
    name: 'Ritu Kapoor',
    phone: '+919811223344',
    age: 24,
    ageRange: '18-25',
    gender: 'female',
    location: 'Delhi, Hauz Khas',
    interests: ['Social Reels', 'Design & Arts', 'Offers'],
    preferredCategories: ['reel_video', 'discount_offer'],
    dateAdded: '2026-08-30T15:30:00Z',
    verificationStatus: 'verified',
    consentStatus: 'opted_in',
    consentTimestamp: '2026-08-30T15:30:00Z',
    preferredChannel: 'whatsapp',
    lastMessageDate: '2026-10-25T17:45:00Z',
    nextEligiblePromoDate: '2026-10-30T00:00:00Z',
    isUnsubscribed: false,
    campLocation: 'Delhi Design Center',
    district: 'Delhi',
    leadSource: 'Hauz Khas Design Sprint'
  },
  // Tirupur District Camp Leads
  {
    id: 'mem_t1',
    name: 'Kavin Raj',
    phone: '+919842100111',
    age: 26,
    ageRange: '26-35',
    gender: 'male',
    location: 'Palladam, Tiruppur',
    campLocation: 'Palladam Camp Hub',
    district: 'Tiruppur',
    leadSource: 'Palladam Robotics Workshop',
    interests: ['Robotics', 'Coding', 'STEM Camps'],
    preferredCategories: ['camp_event', 'announcement'],
    dateAdded: '2026-09-10T10:00:00Z',
    verificationStatus: 'verified',
    consentStatus: 'opted_in',
    consentTimestamp: '2026-09-10T10:00:00Z',
    preferredChannel: 'whatsapp',
    lastMessageDate: '2026-10-25T14:30:00Z',
    nextEligiblePromoDate: '2026-10-30T00:00:00Z',
    isUnsubscribed: false,
    notes: 'Lead registered from Palladam School Grounds camp session'
  },
  {
    id: 'mem_t2',
    name: 'Deepa Senthil',
    phone: '+919842200222',
    age: 34,
    ageRange: '26-35',
    gender: 'female',
    location: 'Avinashi, Tiruppur',
    campLocation: 'Avinashi STEM Center',
    district: 'Tiruppur',
    leadSource: 'Avinashi Science Camp',
    interests: ['Parenting', 'Kids Summer Camps', 'STEM Workshops'],
    preferredCategories: ['camp_event', 'discount_offer'],
    dateAdded: '2026-08-20T11:15:00Z',
    verificationStatus: 'verified',
    consentStatus: 'opted_in',
    consentTimestamp: '2026-08-20T11:15:00Z',
    preferredChannel: 'whatsapp',
    lastMessageDate: '2026-10-24T10:00:00Z',
    nextEligiblePromoDate: '2026-10-29T00:00:00Z',
    isUnsubscribed: false,
    notes: 'Parent lead from Avinashi community outreach'
  },
  {
    id: 'mem_t3',
    name: 'Vignesh Kumar',
    phone: '+919842300333',
    age: 21,
    ageRange: '18-25',
    gender: 'male',
    location: 'Kumaran Road, Tiruppur',
    campLocation: 'Tiruppur Central Hub',
    district: 'Tiruppur',
    leadSource: 'Tiruppur Central Tech Bootcamp',
    interests: ['AI / ML', 'Python', 'Web Dev'],
    preferredCategories: ['camp_event', 'reel_video'],
    dateAdded: '2026-09-15T09:30:00Z',
    verificationStatus: 'verified',
    consentStatus: 'opted_in',
    consentTimestamp: '2026-09-15T09:30:00Z',
    preferredChannel: 'whatsapp',
    lastMessageDate: '2026-10-26T12:00:00Z',
    nextEligiblePromoDate: '2026-10-31T00:00:00Z',
    isUnsubscribed: false,
    notes: 'College student lead captured at Tiruppur Central library drive'
  },
  {
    id: 'mem_t4',
    name: 'Revathi Natarajan',
    phone: '+919842400444',
    age: 29,
    ageRange: '26-35',
    gender: 'female',
    location: 'Dharapuram, Tiruppur',
    campLocation: 'Dharapuram Camp Hub',
    district: 'Tiruppur',
    leadSource: 'Dharapuram Youth Tech Drive',
    interests: ['Creative Arts', 'STEM Workshops', 'Discounts'],
    preferredCategories: ['discount_offer', 'camp_event'],
    dateAdded: '2026-07-12T16:20:00Z',
    verificationStatus: 'verified',
    consentStatus: 'opted_in',
    consentTimestamp: '2026-07-12T16:20:00Z',
    preferredChannel: 'whatsapp',
    lastMessageDate: '2026-10-21T15:45:00Z',
    nextEligiblePromoDate: '2026-10-26T00:00:00Z',
    isUnsubscribed: false,
    notes: 'Enrolled child through Dharapuram camp demo stall'
  },
  {
    id: 'mem_t5',
    name: 'Saravanan M',
    phone: '+919842500555',
    age: 38,
    ageRange: '36-50',
    gender: 'male',
    location: 'Kangeyam, Tiruppur',
    campLocation: 'Kangeyam Tech Camp',
    district: 'Tiruppur',
    leadSource: 'Kangeyam Coding Bootcamp',
    interests: ['Automation', 'Robotics', 'Electronics'],
    preferredCategories: ['camp_event', 'announcement'],
    dateAdded: '2026-06-25T14:00:00Z',
    verificationStatus: 'verified',
    consentStatus: 'opted_in',
    consentTimestamp: '2026-06-25T14:00:00Z',
    preferredChannel: 'whatsapp',
    lastMessageDate: '2026-10-22T17:10:00Z',
    nextEligiblePromoDate: '2026-10-27T00:00:00Z',
    isUnsubscribed: false,
    notes: 'High school teacher lead from Kangeyam camp session'
  },
  {
    id: 'mem_t6',
    name: 'Nithya Ramasamy',
    phone: '+919842600666',
    age: 24,
    ageRange: '18-25',
    gender: 'female',
    location: 'Udumalpet, Tiruppur',
    campLocation: 'Udumalpet Innovation Camp',
    district: 'Tiruppur',
    leadSource: 'Udumalpet Digital Media Camp',
    interests: ['Design & Arts', 'Social Reels', 'Animation'],
    preferredCategories: ['reel_video', 'camp_event'],
    dateAdded: '2026-08-05T13:40:00Z',
    verificationStatus: 'verified',
    consentStatus: 'opted_in',
    consentTimestamp: '2026-08-05T13:40:00Z',
    preferredChannel: 'whatsapp',
    lastMessageDate: '2026-10-23T11:20:00Z',
    nextEligiblePromoDate: '2026-10-28T00:00:00Z',
    isUnsubscribed: false,
    notes: 'Lead from Udumalpet arts camp workshop'
  },
  {
    id: 'mem_t7',
    name: 'Gokul Prasad',
    phone: '+919842700777',
    age: 31,
    ageRange: '26-35',
    gender: 'male',
    location: 'Uthukuli, Tiruppur',
    campLocation: 'Uthukuli Camp Hub',
    district: 'Tiruppur',
    leadSource: 'Uthukuli Tech Day Expo',
    interests: ['STEM Workshops', 'Offers', 'Sports'],
    preferredCategories: ['discount_offer', 'announcement'],
    dateAdded: '2026-09-01T15:00:00Z',
    verificationStatus: 'verified',
    consentStatus: 'opted_in',
    consentTimestamp: '2026-09-01T15:00:00Z',
    preferredChannel: 'whatsapp',
    lastMessageDate: '2026-10-20T14:15:00Z',
    nextEligiblePromoDate: '2026-10-25T00:00:00Z',
    isUnsubscribed: false,
    notes: 'Local business owner; registered at Uthukuli camp'
  },
  // Elderly & Senior Citizen Community Members (Targeted for Care & Medicine Alarms)
  {
    id: 'mem_eld_1',
    name: 'Lakshmi Narayanan',
    phone: '+919842800888',
    age: 68,
    ageRange: '50+',
    gender: 'female',
    location: 'Kumaran Road, Tiruppur',
    campLocation: 'Tiruppur Central Hub',
    district: 'Tiruppur',
    leadSource: 'Senior Health & Wellness Camp',
    interests: ['Wellness', 'Ayurveda', 'Senior Care'],
    preferredCategories: ['announcement', 'general_update'],
    dateAdded: '2026-08-10T10:00:00Z',
    verificationStatus: 'verified',
    consentStatus: 'opted_in',
    consentTimestamp: '2026-08-10T10:00:00Z',
    preferredChannel: 'whatsapp',
    lastMessageDate: '2026-10-27T08:00:00Z',
    nextEligiblePromoDate: '2026-11-01T00:00:00Z',
    isUnsubscribed: false,
    notes: 'Elderly community matriarch; requires daily morning blood pressure pill and evening reminders'
  },
  {
    id: 'mem_eld_2',
    name: 'Ramasamy Gounder',
    phone: '+919842900999',
    age: 74,
    ageRange: '50+',
    gender: 'male',
    location: 'Palladam, Tiruppur',
    campLocation: 'Palladam Camp Hub',
    district: 'Tiruppur',
    leadSource: 'Palladam Elders Wellness Pavilion',
    interests: ['Diet', 'Senior Health', 'Yoga'],
    preferredCategories: ['announcement'],
    dateAdded: '2026-07-15T09:30:00Z',
    verificationStatus: 'verified',
    consentStatus: 'opted_in',
    consentTimestamp: '2026-07-15T09:30:00Z',
    preferredChannel: 'whatsapp',
    lastMessageDate: '2026-10-27T13:00:00Z',
    nextEligiblePromoDate: '2026-11-01T00:00:00Z',
    isUnsubscribed: false,
    notes: 'Senior citizen; enrolled for alarm-style medicine and meal reminders'
  },
  {
    id: 'mem_eld_3',
    name: 'Subramanian Iyer',
    phone: '+919843000101',
    age: 62,
    ageRange: '50+',
    gender: 'male',
    location: 'Avinashi, Tiruppur',
    campLocation: 'Avinashi STEM Center',
    district: 'Tiruppur',
    leadSource: 'Avinashi Community Camp',
    interests: ['Wellness', 'General Updates'],
    preferredCategories: ['general_update'],
    dateAdded: '2026-09-02T11:00:00Z',
    verificationStatus: 'verified',
    consentStatus: 'opted_in',
    consentTimestamp: '2026-09-02T11:00:00Z',
    preferredChannel: 'whatsapp',
    lastMessageDate: '2026-10-28T08:00:00Z',
    nextEligiblePromoDate: '2026-11-02T00:00:00Z',
    isUnsubscribed: false,
    notes: 'Retired school headmaster; needs regular daily hydration & medication alerts'
  },
  {
    id: 'mem_eld_4',
    name: 'Dr. Meenakshi Sundaram',
    phone: '+919843100202',
    age: 66,
    ageRange: '50+',
    gender: 'female',
    location: 'Indiranagar, Bangalore',
    campLocation: 'Bangalore Health Center',
    district: 'Bangalore',
    leadSource: 'Wellness Webinar',
    interests: ['Senior Care', 'Cardiology', 'Wellness'],
    preferredCategories: ['announcement'],
    dateAdded: '2026-06-18T14:20:00Z',
    verificationStatus: 'verified',
    consentStatus: 'opted_in',
    consentTimestamp: '2026-06-18T14:20:00Z',
    preferredChannel: 'whatsapp',
    lastMessageDate: '2026-10-28T20:30:00Z',
    nextEligiblePromoDate: '2026-11-02T00:00:00Z',
    isUnsubscribed: false,
    notes: 'Retired physician; participates in elderly wellness pilot'
  }
];

const INITIAL_SEGMENTS: AudienceSegment[] = [
  {
    id: 'seg_all',
    name: 'All Opted-in Members',
    description: 'All verified or active community members who opted into WhatsApp communications',
    filters: { consentOnly: true },
    memberCount: 11,
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'seg_parents',
    name: 'Kids & Camp Parents',
    description: 'Members interested in STEM, Kids Camps, and Parenting workshops',
    filters: {
      interests: ['Kids Summer Camps', 'Parenting', 'STEM Workshops', 'Kids Camp'],
      consentOnly: true
    },
    memberCount: 3,
    createdAt: '2026-02-01T00:00:00Z'
  },
  {
    id: 'seg_tech',
    name: 'Tech Enthusiasts & Coders',
    description: 'Members engaged in coding, AI, hackathons, and technical reels',
    filters: {
      interests: ['Coding', 'AI / ML', 'Robotics', 'Tech Tutorials'],
      consentOnly: true
    },
    memberCount: 5,
    createdAt: '2026-02-15T00:00:00Z'
  },
  {
    id: 'seg_discount',
    name: 'Offer & Deal Seekers',
    description: 'Members who frequently redeem promotional discount codes',
    filters: {
      interests: ['Offers', 'Discounts'],
      consentOnly: true
    },
    memberCount: 4,
    createdAt: '2026-03-01T00:00:00Z'
  },
  {
    id: 'seg_elderly',
    name: 'Elderly Community (Age 50+)',
    description: 'Senior citizens and elderly members registered for care, routine, and medicine reminders',
    filters: {
      ageRange: ['50+'],
      consentOnly: true
    },
    memberCount: 4,
    createdAt: '2026-03-10T00:00:00Z'
  }
];

// Reference date for "Next 7 Days": local time is October 28, 2026
const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: 'camp_daily_1',
    title: 'Daily Community Briefing [Occurrence 1/7]',
    message: "*Daily Community Briefing*\n\nGood morning champions! Here is your daily digest of live coding rooms, camp updates, and member spotlights.\n\nToday's Featured Session: Hands-on Python Automation at 5:00 PM IST.\n\nLink: https://example.com/daily-briefing\n\nReply STOP to opt out.",
    category: 'announcement',
    mediaType: 'none',
    targetSegmentId: 'seg_all',
    scheduledAt: '2026-10-30T09:00:00Z',
    timezone: 'Asia/Kolkata',
    status: 'scheduled',
    requiresApproval: false,
    approvedBy: 'Admin Roshini',
    approvedAt: '2026-10-28T18:00:00Z',
    cadence: 'daily',
    cadenceIntervalDays: 1,
    cadenceOccurrences: 7,
    parentCampaignId: 'camp_daily_1',
    seriesIndex: 1,
    totalRecipients: 19,
    sentCount: 0,
    deliveredCount: 0,
    readCount: 0,
    failedCount: 0,
    blockedCount: 0,
    createdAt: '2026-10-28T10:00:00Z',
    updatedAt: '2026-10-28T18:00:00Z'
  },
  {
    id: 'camp_daily_2',
    title: 'Daily Community Briefing [Occurrence 2/7]',
    message: "*Daily Community Briefing*\n\nGood morning champions! Weekend project submissions are underway. Check your repo status on the portal.\n\nLink: https://example.com/daily-briefing\n\nReply STOP to opt out.",
    category: 'announcement',
    mediaType: 'none',
    targetSegmentId: 'seg_all',
    scheduledAt: '2026-10-31T09:00:00Z',
    timezone: 'Asia/Kolkata',
    status: 'scheduled',
    requiresApproval: false,
    cadence: 'daily',
    cadenceIntervalDays: 1,
    cadenceOccurrences: 7,
    parentCampaignId: 'camp_daily_1',
    seriesIndex: 2,
    totalRecipients: 19,
    sentCount: 0,
    deliveredCount: 0,
    readCount: 0,
    failedCount: 0,
    blockedCount: 0,
    createdAt: '2026-10-28T10:00:00Z',
    updatedAt: '2026-10-28T18:00:00Z'
  },
  {
    id: 'camp_daily_3',
    title: 'Daily Community Briefing [Occurrence 3/7]',
    message: "*Daily Community Briefing*\n\nSunday Hackathon wrap-up and live leaderboard announcement today at 7:00 PM IST.\n\nLink: https://example.com/daily-briefing\n\nReply STOP to opt out.",
    category: 'announcement',
    mediaType: 'none',
    targetSegmentId: 'seg_all',
    scheduledAt: '2026-11-01T09:00:00Z',
    timezone: 'Asia/Kolkata',
    status: 'scheduled',
    requiresApproval: false,
    cadence: 'daily',
    cadenceIntervalDays: 1,
    cadenceOccurrences: 7,
    parentCampaignId: 'camp_daily_1',
    seriesIndex: 3,
    totalRecipients: 19,
    sentCount: 0,
    deliveredCount: 0,
    readCount: 0,
    failedCount: 0,
    blockedCount: 0,
    createdAt: '2026-10-28T10:00:00Z',
    updatedAt: '2026-10-28T18:00:00Z'
  },
  {
    id: 'camp_3d_1',
    title: 'STEM & Robotics Coding Challenge [Occurrence 1/5]',
    message: "*3-Day STEM Challenge #1: Sensor Interfacing*\n\nCalling our robotics enthusiasts! Build an obstacle-avoiding sensor routine in Arduino. Top submissions win innovation hub badges.\n\nChallenge details: https://example.com/stem-3days\n\nReply STOP to opt out.",
    category: 'camp_event',
    mediaUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=80',
    mediaType: 'image',
    targetSegmentId: 'seg_tech',
    scheduledAt: '2026-10-30T10:30:00Z',
    timezone: 'Asia/Kolkata',
    status: 'scheduled',
    requiresApproval: false,
    cadence: 'every_3_days',
    cadenceIntervalDays: 3,
    cadenceOccurrences: 5,
    parentCampaignId: 'camp_3d_1',
    seriesIndex: 1,
    totalRecipients: 7,
    sentCount: 0,
    deliveredCount: 0,
    readCount: 0,
    failedCount: 0,
    blockedCount: 0,
    createdAt: '2026-10-28T10:00:00Z',
    updatedAt: '2026-10-28T18:00:00Z'
  },
  {
    id: 'camp_3d_2',
    title: 'STEM & Robotics Coding Challenge [Occurrence 2/5]',
    message: "*3-Day STEM Challenge #2: Motor Drivers & Logic*\n\nRound 2 is live! Implement dual-motor H-bridge control logic.\n\nGuide: https://example.com/stem-3days\n\nReply STOP to opt out.",
    category: 'camp_event',
    mediaUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=80',
    mediaType: 'image',
    targetSegmentId: 'seg_tech',
    scheduledAt: '2026-11-02T10:30:00Z',
    timezone: 'Asia/Kolkata',
    status: 'scheduled',
    requiresApproval: false,
    cadence: 'every_3_days',
    cadenceIntervalDays: 3,
    cadenceOccurrences: 5,
    parentCampaignId: 'camp_3d_1',
    seriesIndex: 2,
    totalRecipients: 7,
    sentCount: 0,
    deliveredCount: 0,
    readCount: 0,
    failedCount: 0,
    blockedCount: 0,
    createdAt: '2026-10-28T10:00:00Z',
    updatedAt: '2026-10-28T18:00:00Z'
  },
  {
    id: 'camp_5d_1',
    title: 'Regional Camp Highlights & Lead Digest [Occurrence 1/4]',
    message: "*5-Day Camp Roundup: Tiruppur District & Hub Updates*\n\nHighlights from Palladam, Avinashi, and Kangeyam training stalls. View upcoming camp dates, discount passes, and workshop rosters.\n\nFull newsletter: https://example.com/camps-5days\n\nReply STOP to opt out.",
    category: 'camp_event',
    mediaUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80',
    mediaType: 'image',
    targetSegmentId: 'seg_all',
    scheduledAt: '2026-10-30T16:00:00Z',
    timezone: 'Asia/Kolkata',
    status: 'scheduled',
    requiresApproval: true,
    approvedBy: 'Admin Roshini',
    approvedAt: '2026-10-29T10:00:00Z',
    cadence: 'every_5_days',
    cadenceIntervalDays: 5,
    cadenceOccurrences: 4,
    parentCampaignId: 'camp_5d_1',
    seriesIndex: 1,
    totalRecipients: 19,
    sentCount: 0,
    deliveredCount: 0,
    readCount: 0,
    failedCount: 0,
    blockedCount: 0,
    createdAt: '2026-10-28T10:00:00Z',
    updatedAt: '2026-10-28T18:00:00Z'
  },
  {
    id: 'camp_5d_2',
    title: 'Regional Camp Highlights & Lead Digest [Occurrence 2/4]',
    message: "*5-Day Camp Roundup: Dharapuram & Udumalpet Camp Showcase*\n\nNew batch intake is now open for the weekend innovation bootcamps.\n\nDetails: https://example.com/camps-5days\n\nReply STOP to opt out.",
    category: 'camp_event',
    mediaUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80',
    mediaType: 'image',
    targetSegmentId: 'seg_all',
    scheduledAt: '2026-11-04T16:00:00Z',
    timezone: 'Asia/Kolkata',
    status: 'scheduled',
    requiresApproval: false,
    cadence: 'every_5_days',
    cadenceIntervalDays: 5,
    cadenceOccurrences: 4,
    parentCampaignId: 'camp_5d_1',
    seriesIndex: 2,
    totalRecipients: 19,
    sentCount: 0,
    deliveredCount: 0,
    readCount: 0,
    failedCount: 0,
    blockedCount: 0,
    createdAt: '2026-10-28T10:00:00Z',
    updatedAt: '2026-10-28T18:00:00Z'
  },
  {
    id: 'camp_101',
    title: 'New AI Masterclass Reel Out Now',
    message: "*New Video Alert for our Community*\n\nWe just published a walkthrough: *Building Voice AI Agents in 15 Minutes*.\n\nWatch the full breakdown here:\nhttps://www.instagram.com/reel/DA123456789/\n\nReply STOP to opt out of video notifications.",
    category: 'reel_video',
    mediaUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    mediaType: 'image',
    linkPreviewUrl: 'https://www.instagram.com/reel/DA123456789/',
    targetSegmentId: 'seg_tech',
    scheduledAt: '2026-10-29T11:00:00Z',
    timezone: 'Asia/Kolkata',
    status: 'scheduled',
    requiresApproval: false,
    approvedBy: 'Admin Roshini',
    approvedAt: '2026-10-28T18:00:00Z',
    internalNotes: 'Showcases the new Whisper integration; high engagement expected',
    totalRecipients: 5,
    sentCount: 0,
    deliveredCount: 0,
    readCount: 0,
    failedCount: 0,
    blockedCount: 0,
    createdAt: '2026-10-27T10:00:00Z',
    updatedAt: '2026-10-28T18:00:00Z'
  },
  {
    id: 'camp_102',
    title: 'Winter Robotics Camp Registration Open',
    message: "*Winter Robotics Bootcamp 2026 is Here*\n\nHands-on Arduino, drone programming, and robotics showdowns for ages 8-15.\n\nDates: Nov 14 – Nov 20, 2026\nVenue: Tech Innovation Hub, Bangalore\nPerk: 20% off with code ROBOCOMM20\n\nRegister: https://example.com/camps/robotics2026\n\nSeats capped at 30 participants. Reply STOP to opt out.",
    category: 'camp_event',
    mediaUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=80',
    mediaType: 'image',
    linkPreviewUrl: 'https://example.com/camps/robotics2026',
    targetSegmentId: 'seg_parents',
    scheduledAt: '2026-10-30T10:30:00Z',
    timezone: 'Asia/Kolkata',
    status: 'scheduled',
    requiresApproval: true,
    approvedBy: 'Admin Roshini',
    approvedAt: '2026-10-28T20:15:00Z',
    internalNotes: 'Targeted to verified parents; limit 1 promo per week enforced',
    totalRecipients: 3,
    sentCount: 0,
    deliveredCount: 0,
    readCount: 0,
    failedCount: 0,
    blockedCount: 0,
    createdAt: '2026-10-28T09:00:00Z',
    updatedAt: '2026-10-28T20:15:00Z'
  },
  {
    id: 'camp_103',
    title: 'Diwali Community Flash Discount (24 Hrs)',
    message: "*Exclusive Community Flash Perk*\n\nEnjoy a flat 30% discount on all upcoming masterclasses and workshop passes this weekend.\n\nCoupon Code: DIWALI30\nValid through Sunday midnight.\n\nClaim your pass: https://example.com/festive-perks\n\nReply STOP to opt out.",
    category: 'discount_offer',
    mediaUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80',
    mediaType: 'image',
    linkPreviewUrl: 'https://example.com/festive-perks',
    targetSegmentId: 'seg_discount',
    scheduledAt: '2026-10-31T09:00:00Z',
    timezone: 'Asia/Kolkata',
    status: 'pending_approval',
    requiresApproval: true,
    internalNotes: 'Needs pricing team final sign-off before Friday dispatch',
    totalRecipients: 4,
    sentCount: 0,
    deliveredCount: 0,
    readCount: 0,
    failedCount: 0,
    blockedCount: 0,
    createdAt: '2026-10-28T16:00:00Z',
    updatedAt: '2026-10-28T16:00:00Z'
  },
  {
    id: 'camp_104',
    title: 'Reminder: Weekend Hackathon Submissions Close Tonight',
    message: "*Final Notice: Submissions Close Tonight*\n\nTeams competing in the Autumn Code Sprint: please submit your GitHub repo and 2-min demo link before 11:59 PM.\n\nPortal: https://example.com/hackathon/submit\n\nReply STOP to opt out.",
    category: 'registration_deadline',
    mediaType: 'none',
    targetSegmentId: 'seg_tech',
    scheduledAt: '2026-11-01T14:00:00Z',
    timezone: 'Asia/Kolkata',
    status: 'scheduled',
    requiresApproval: false,
    totalRecipients: 5,
    sentCount: 0,
    deliveredCount: 0,
    readCount: 0,
    failedCount: 0,
    blockedCount: 0,
    createdAt: '2026-10-28T12:00:00Z',
    updatedAt: '2026-10-28T12:00:00Z'
  },
  {
    id: 'camp_100_past',
    title: 'Weekly Community Bulletin #42 (Sent)',
    message: "*Weekly Community Bulletin #42*\n\nHere is your digest for the week: 3 new tutorial guides released, community meetups in 4 cities, and the speaker lineup for TechWeek.\n\nRead full memo: https://example.com/bulletin-42\n\nReply STOP to opt out.",
    category: 'announcement',
    mediaType: 'none',
    targetSegmentId: 'seg_all',
    scheduledAt: '2026-10-24T18:00:00Z',
    timezone: 'Asia/Kolkata',
    status: 'completed',
    requiresApproval: false,
    totalRecipients: 11,
    sentCount: 11,
    deliveredCount: 10,
    readCount: 9,
    failedCount: 0,
    blockedCount: 0,
    createdAt: '2026-10-24T12:00:00Z',
    updatedAt: '2026-10-24T18:05:00Z'
  }
];

const INITIAL_LOGS: MessageLog[] = [
  {
    id: 'log_1',
    campaignId: 'camp_100_past',
    campaignTitle: 'Weekly Community Bulletin #42 (Sent)',
    recipientId: 'mem_1',
    recipientName: 'Aarav Sharma',
    recipientPhone: '+919876543210',
    messageText: "*Hello Community Champions!* ...",
    status: 'read',
    whatsappMessageId: 'wamid.HBgLMzkxOTg3NjU0MzIxMBUCABEYEjA1RUFDRDg2OTRERTQ2NzYyQQA=',
    timestamp: '2026-10-24T18:00:02Z',
    deliveredAt: '2026-10-24T18:00:05Z',
    readAt: '2026-10-24T18:04:12Z'
  },
  {
    id: 'log_2',
    campaignId: 'camp_100_past',
    campaignTitle: 'Weekly Community Bulletin #42 (Sent)',
    recipientId: 'mem_2',
    recipientName: 'Priya Sundaram',
    recipientPhone: '+919812345678',
    messageText: "*Hello Community Champions!* ...",
    status: 'read',
    whatsappMessageId: 'wamid.HBgLMzkxOTgxMjM0NTY3OBUCABEYEjA1RUFDRDg2OTRERTQ2NzYyQQA=',
    timestamp: '2026-10-24T18:00:03Z',
    deliveredAt: '2026-10-24T18:00:06Z',
    readAt: '2026-10-24T18:15:30Z'
  },
  {
    id: 'log_3',
    campaignId: 'camp_100_past',
    campaignTitle: 'Weekly Community Bulletin #42 (Sent)',
    recipientId: 'mem_5',
    recipientName: 'Vikram Malhotra',
    recipientPhone: '+919988776655',
    messageText: "*Hello Community Champions!* ...",
    status: 'delivered',
    whatsappMessageId: 'wamid.HBgLMzkxOTk4ODc3NjY1NBUCABEYEjA1RUFDRDg2OTRERTQ2NzYyQQA=',
    timestamp: '2026-10-24T18:00:04Z',
    deliveredAt: '2026-10-24T18:00:08Z'
  },
  {
    id: 'log_4',
    campaignId: 'camp_100_past',
    campaignTitle: 'Weekly Community Bulletin #42 (Sent)',
    recipientId: 'mem_9',
    recipientName: 'Tarun Verma',
    recipientPhone: '+919899112233',
    messageText: "*Hello Community Champions!* ...",
    status: 'blocked_optout',
    errorReason: 'Recipient opted out via STOP keyword on 10 Sep 2026. Suppressed before API dispatch.',
    timestamp: '2026-10-24T18:00:01Z'
  }
];

const INITIAL_SOCIAL_POSTS: SocialMediaPost[] = [
  {
    id: 'soc_1',
    platform: 'instagram',
    title: 'Building Real-time Voice AI in 15 Minutes with Next.js',
    url: 'https://www.instagram.com/reel/DA123456789/',
    thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    authorHandle: '@tech_community_hub',
    viewsCount: '48.2K',
    likesCount: '3.4K',
    caption: 'Full code walkthrough showing how to connect speech-to-text with LLM function calling in a single server action. Drop your questions below!',
    category: 'AI & Web Dev',
    dateAdded: '2026-10-27T10:00:00Z',
    suggestedBroadcastText: "*Fresh Reel Available*\n\nCurious how voice AI bots work under the hood? Watch our 60-second architecture breakdown: \nhttps://www.instagram.com/reel/DA123456789/\n\nTell us in the comments what you want covered next!"
  },
  {
    id: 'soc_2',
    platform: 'youtube',
    title: '5 Git Tricks 90% of Developers Don\'t Know #Shorts',
    url: 'https://www.youtube.com/shorts/dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
    authorHandle: 'CodeMasters Daily',
    viewsCount: '124K',
    likesCount: '9.8K',
    caption: 'Interactive rebase, reflog recovery, and worktrees simplified for your daily workflow.',
    category: 'Developer Productivity',
    dateAdded: '2026-10-26T15:00:00Z',
    suggestedBroadcastText: "*5 Quick Git Productivity Hacks*\n\nSave yourself hours of rebasing headaches. Check out this 45-second YouTube Short: \nhttps://www.youtube.com/shorts/dQw4w9WgXcQ"
  },
  {
    id: 'soc_3',
    platform: 'instagram',
    title: 'Top 3 Robotics Kits for Kids & Beginners in 2026',
    url: 'https://www.instagram.com/reel/DB987654321/',
    thumbnailUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=80',
    authorHandle: '@stem_parenting',
    viewsCount: '31.5K',
    likesCount: '2.1K',
    caption: 'Tested with children aged 8-14. See which kit balances ease of use, durability, and coding depth.',
    category: 'STEM & Kids',
    dateAdded: '2026-10-25T08:00:00Z',
    suggestedBroadcastText: "*Thinking about getting your kids into robotics?*\n\nHere is an honest review of the top 3 kits this year: \nhttps://www.instagram.com/reel/DB987654321/\n\nWhich one does your child use?"
  }
];

const INITIAL_CAMPS: CampEvent[] = [
  {
    id: 'camp_e1',
    title: 'Winter Robotics & Drone Camp',
    subtitle: 'Hands-on hardware, sensors, and autonomous flight programming',
    category: 'coding',
    startDate: '2026-11-14',
    endDate: '2026-11-20',
    venue: 'Bangalore Innovation Hub, Koramangala',
    ageGroup: 'Ages 9-15',
    fee: '₹7,499',
    maxCapacity: 30,
    registeredCount: 22,
    status: 'upcoming',
    registrationDeadline: '2026-11-08',
    description: 'A 7-day immersive workshop where students build and take home their own autonomous obstacle-avoiding bot.'
  },
  {
    id: 'camp_e2',
    title: 'Junior Sports & Athletic Conditioning Camp',
    subtitle: 'Multi-sport skill training, agility, and team building',
    category: 'sports',
    startDate: '2026-11-21',
    endDate: '2026-11-27',
    venue: 'Decathlon Sports Arena, Sarjapur',
    ageGroup: 'Ages 7-14',
    fee: '₹4,999',
    maxCapacity: 40,
    registeredCount: 34,
    status: 'upcoming',
    registrationDeadline: '2026-11-15',
    description: 'Expert-led athletic coaching across football, basketball, and track fundamentals with certified physiotherapists.'
  },
  {
    id: 'camp_e3',
    title: 'Creative Digital Arts & Animation Sprint',
    subtitle: 'Procreate, 2D character rigging, and storyboard creation',
    category: 'art',
    startDate: '2026-12-05',
    endDate: '2026-12-10',
    venue: 'Online Interactive Studio (Zoom)',
    ageGroup: 'Ages 12-18',
    fee: '₹3,499',
    maxCapacity: 25,
    registeredCount: 18,
    status: 'upcoming',
    registrationDeadline: '2026-11-30',
    description: 'Learn modern digital art techniques from senior concept artists in the gaming and animation industry.'
  }
];

const INITIAL_DISCOUNTS: DiscountOffer[] = [
  {
    id: 'disc_1',
    title: 'Early Bird Camp Discount',
    code: 'ROBOCOMM20',
    discountType: 'percentage',
    discountValue: 20,
    validUntil: '2026-11-05T23:59:59Z',
    minPurchase: 5000,
    eligibleSegment: 'seg_parents',
    usageLimit: 50,
    usedCount: 14,
    status: 'active',
    description: 'Exclusive 20% discount for registered WhatsApp community members on upcoming Winter Camps.'
  },
  {
    id: 'disc_2',
    title: 'Festive Season Perk',
    code: 'DIWALI30',
    discountType: 'percentage',
    discountValue: 30,
    validUntil: '2026-11-02T23:59:59Z',
    minPurchase: 2000,
    eligibleSegment: 'seg_all',
    usageLimit: 100,
    usedCount: 38,
    status: 'active',
    description: 'Flat 30% reduction on all digital passes and video masterclasses.'
  },
  {
    id: 'disc_3',
    title: 'Weekend Flash Voucher',
    code: 'WEEKEND500',
    discountType: 'fixed',
    discountValue: 500,
    validUntil: '2026-11-08T23:59:59Z',
    minPurchase: 2500,
    eligibleSegment: 'seg_discount',
    usageLimit: 30,
    usedCount: 9,
    status: 'active',
    description: '₹500 instant discount on offline workshop registrations.'
  }
];

const INITIAL_ERRORS: AutomationError[] = [
  {
    id: 'err_1',
    timestamp: '2026-10-27T04:12:00Z',
    severity: 'low',
    component: 'Anti-Spam Engine',
    errorMessage: 'Suppression list trigger: Message to +919899112233 blocked due to prior STOP opt-out.',
    details: 'Recipient explicitly sent STOP on 10 Sep 2026; delivery skipped before API call.',
    campaignId: 'camp_100_past',
    resolved: true
  },
  {
    id: 'err_2',
    timestamp: '2026-10-26T22:30:15Z',
    severity: 'medium',
    component: 'Scheduler',
    errorMessage: 'Quiet Hours Enforcement: Campaign draft queued during quiet hours (21:00-08:00).',
    details: 'Automatic deferral triggered. Outbound dispatch postponed until allowed window (09:00 AM).',
    resolved: true
  }
];

const INITIAL_SETTINGS: AntiSpamSettings = {
  maxPromotionalPerDay: 1,
  maxPromotionalPerWeek: 2,
  minIntervalHours: 48,
  quietHoursEnabled: true,
  quietHoursStart: '21:00',
  quietHoursEnd: '08:00',
  allowedSendDays: [1, 2, 3, 4, 5, 6], // Mon-Sat
  duplicatePreventionHours: 48,
  optOutKeywords: ['STOP', 'UNSUBSCRIBE', 'CANCEL', 'END', 'OPTOUT'],
  emergencyPauseActive: false
};

const INITIAL_WHATSAPP: WhatsAppConfig = {
  phoneNumberId: '109845728495021',
  businessAccountId: '204918274910283',
  apiAccessToken: 'EAAG9...mock_token_configured_cloud_api',
  webhookVerifyToken: 'whatsapp_community_verify_secret_2026',
  connectionStatus: 'connected',
  qualityScore: 'GREEN',
  dailyLimit: 1000,
  usedToday: 142
};

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud_1',
    timestamp: '2026-10-28T18:00:00Z',
    adminUser: 'Admin Roshini',
    action: 'CAMPAIGN_APPROVED',
    details: 'Approved campaign "New AI Masterclass Reel Out Now!" for Oct 29, 11:00 AM dispatch'
  },
  {
    id: 'aud_2',
    timestamp: '2026-10-28T16:00:00Z',
    adminUser: 'Admin Roshini',
    action: 'CAMPAIGN_CREATED',
    details: 'Created draft campaign "Diwali Community Flash Discount (24 Hrs)"'
  },
  {
    id: 'aud_3',
    timestamp: '2026-10-27T14:30:00Z',
    adminUser: 'System Scheduler',
    action: 'BACKGROUND_SWEEP',
    details: 'Completed queue scan: 0 due messages, 4 future scheduled'
  }
];

const INITIAL_CARE_ALARMS: CareAlarm[] = [
  {
    id: 'alarm_morning_med',
    title: 'Morning Medicine & Breakfast Alarm',
    alarmType: 'medicine',
    time: '08:00',
    label: 'Morning Prescription & Warm Breakfast',
    customMessage: '🌅 *Gentle Care Reminder: Morning Medicine*\n\nGood morning! Please remember to take your prescribed morning medicine with a glass of warm water after your breakfast.\n\n_Stay hydrated and have a blessed, healthy day ahead!_',
    isActive: true, // Alarm is ON like a clock alarm
    targetAgeMin: 50,
    targetAudienceLabel: 'Elderly Community (50+ yrs)',
    repeatDays: ['Daily'],
    audioTone: 'gentle_chime',
    totalDeliveredCount: 16,
    createdAt: '2026-10-25T08:00:00Z',
    updatedAt: '2026-10-28T08:00:00Z'
  },
  {
    id: 'alarm_lunch_diet',
    title: 'Afternoon Meal & Hydration Alarm',
    alarmType: 'meal_diet',
    time: '13:00',
    label: 'Lunch Time & Balanced Diet',
    customMessage: '🥗 *Care Reminder: Nutritious Afternoon Meal*\n\nIt is 1:00 PM — time for your wholesome lunch and a glass of warm water. Please take any post-meal supplements or digestion aids if prescribed.\n\n_Rest peacefully for 20 minutes after your meal._',
    isActive: true,
    targetAgeMin: 50,
    targetAudienceLabel: 'Elderly Community (50+ yrs)',
    repeatDays: ['Daily'],
    audioTone: 'gentle_chime',
    totalDeliveredCount: 12,
    createdAt: '2026-10-25T13:00:00Z',
    updatedAt: '2026-10-28T13:00:00Z'
  },
  {
    id: 'alarm_night_med',
    title: 'Night Medicine & Rest Alarm',
    alarmType: 'medicine',
    time: '20:30',
    label: 'Night Prescription & Peaceful Sleep',
    customMessage: '🌙 *Night Care Reminder: Evening Medication*\n\nTime for your night dose with warm water after dinner. Please keep your room well-ventilated and avoid phone screens for restorative sleep.\n\n_Wishing you a restful night and good health!_',
    isActive: true,
    targetAgeMin: 50,
    targetAudienceLabel: 'Elderly Community (50+ yrs)',
    repeatDays: ['Daily'],
    audioTone: 'gentle_chime',
    totalDeliveredCount: 14,
    createdAt: '2026-10-25T20:30:00Z',
    updatedAt: '2026-10-28T20:30:00Z'
  },
  {
    id: 'alarm_evening_vitals',
    title: 'Evening Blood Pressure & Vitals Check',
    alarmType: 'vitals_check',
    time: '17:00',
    label: 'Vitals Log & Warm Herbal Tea',
    customMessage: '🩺 *Wellness Check: Evening Vitals & Stroll*\n\nFriendly reminder to check your blood pressure / blood sugar readings if due, enjoy a brief stroll, and sip some warm herbal tea.\n\n_Stay active and vibrant!_',
    isActive: false, // Inactive by default so user can test toggling it ON
    targetAgeMin: 60,
    targetAudienceLabel: 'Senior Citizens (60+ yrs)',
    repeatDays: ['Daily'],
    audioTone: 'digital_beep',
    totalDeliveredCount: 4,
    createdAt: '2026-10-25T17:00:00Z',
    updatedAt: '2026-10-28T17:00:00Z'
  }
];

let memoryState: AppState | null = null;

function ensureDataDirectory() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.error('Failed to create data directory:', err);
  }
}

export function getDatabase(): AppState {
  if (memoryState) {
    if (!memoryState.careAlarms) {
      memoryState.careAlarms = INITIAL_CARE_ALARMS;
    }
    return memoryState;
  }

  ensureDataDirectory();

  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      memoryState = JSON.parse(data) as AppState;
      if (!memoryState.careAlarms || memoryState.careAlarms.length === 0) {
        memoryState.careAlarms = INITIAL_CARE_ALARMS;
        saveDatabase(memoryState);
      }
      return memoryState;
    }
  } catch (err) {
    console.warn('Error reading db.json, falling back to initial data:', err);
  }

  // Initial seed
  const initialState: AppState = {
    members: INITIAL_MEMBERS,
    campaigns: INITIAL_CAMPAIGNS,
    messageLogs: INITIAL_LOGS,
    segments: INITIAL_SEGMENTS,
    socialPosts: INITIAL_SOCIAL_POSTS,
    camps: INITIAL_CAMPS,
    discounts: INITIAL_DISCOUNTS,
    errors: INITIAL_ERRORS,
    antiSpamSettings: INITIAL_SETTINGS,
    whatsappConfig: INITIAL_WHATSAPP,
    auditLogs: INITIAL_AUDIT_LOGS,
    careAlarms: INITIAL_CARE_ALARMS
  };

  saveDatabase(initialState);
  memoryState = initialState;
  return memoryState;
}

export function saveDatabase(state: AppState): void {
  memoryState = state;
  try {
    ensureDataDirectory();
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write to db.json:', err);
  }
}

export function logAuditAction(adminUser: string, action: string, details: string) {
  const db = getDatabase();
  const newLog: AuditLog = {
    id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    adminUser,
    action,
    details
  };
  db.auditLogs.unshift(newLog);
  if (db.auditLogs.length > 200) {
    db.auditLogs = db.auditLogs.slice(0, 200);
  }
  saveDatabase(db);
}
