# 🚀 CommUnity WA — WhatsApp Community Management Platform

A standalone, production-ready **WhatsApp Community Management Platform** engineered with Next.js (App Router), TypeScript, Tailwind CSS, Lucide icons, Recharts, and Supabase PostgreSQL.

The platform allows administrators to manage their real WhatsApp Community, schedule broadcast messages for the upcoming week, curate and share Instagram Reels and YouTube Shorts, maintain member profiles with GDPR/opt-in consent records, enforce strict anti-spam frequency controls, and monitor automated dispatches in real-time.

---

## 🌟 Key Modules & Features

### 1. Overview Dashboard
- **Real KPI Metrics:** Total community members, verified members, opted-in members, scheduled broadcasts for next 7 days, delivery and read receipt percentages, and unresolved alert count.
- **Next Upcoming Broadcast Card:** Real-time highlight card with dispatch time, audience target, and message preview.
- **Weekly Broadcast Volume Chart:** Interactive Recharts visualization tracking sent vs. read receipts over the 7-day cycle.
- **Quick Administrative Actions:** Instant one-click triggers to Schedule Message, Add Member, Create Camp, or Create Discount.

### 2. Community Member Management
- **Full Profiles:** Full name, WhatsApp phone number, age/age-range, gender, location, interests, preferred categories, verification status, and consent timestamps.
- **Central Suppression List:** Automatic opt-out tracking (triggered by user STOP/UNSUBSCRIBE commands) that strictly blocks future promotional dispatches.
- **Member Activity Drawer:** Slide-over drawer with granular communication history, timestamps, read receipts, and next eligible promotional dates.
- **CSV Import & Export:** Bulk import with validation and duplicate phone detection; one-click CSV export of community records.

### 3. Weekly Message Scheduler & Next 7 Days Engine
- **Next 7 Days Dedicated View:** Chronological roadmap of upcoming broadcasts for the week with date, time, target audience, channel, approval status, and quick actions.
- **Calendar Views:** Interactive Day, Week, and Month scheduling grid.
- **Persistent Background Execution:** Scheduled campaigns run autonomously in the background even when the dashboard is closed or the computer is powered off.
- **Approval Workflow:** Campaigns can require administrative approval before automated dispatch (`Draft` ➔ `Pending Approval` ➔ `Scheduled` ➔ `Processing` ➔ `Completed`).

### 4. Interactive WhatsApp Mobile Simulator & Composer
- **Pixel-Perfect Mobile Simulator:** Live split-screen phone mockup rendering WhatsApp dark/light styling, double checkmarks (sent, delivered, read), verified badges, bold/italic text, and image/link cards.
- **Pre-formatted Reusable Templates:**
  - Community Announcements
  - Camp & Workshop Announcements
  - Event Reminders
  - Reel & Video Drops
  - Discounts & Festive Offers
  - Registration Deadlines
  - General Updates

### 5. Anti-Spam & Frequency Control Engine
- **Configurable Frequency Caps:** Maximum promotional messages per recipient per day (default 1) and per week (default 2).
- **Minimum Interval:** Minimum hours between promotional messages (default 48 hours).
- **Protected Quiet Hours:** Automatic deferral of nighttime messages (default 21:00 to 08:00) to protect members from disturbance.
- **Allowed Sending Days:** Restriction of promotional dispatches to selected days (e.g. Monday through Saturday).
- **Duplicate Prevention:** Prevents identical content from being dispatched to the same recipient within a 48-hour window.
- **Emergency Kill-Switch:** Immediate 1-click administrative pause that halts all outgoing queue processing.

### 6. Campaigns & Message Logs
- **Granular Message Logs Table:** Recipient phone, recipient name, campaign title, status (Sent, Delivered, Read, Blocked by Anti-Spam, Failed), timestamps, and Meta WAMID.
- **Anti-Spam Audit Reasons:** Transparent diagnostic explanations for why any recipient was skipped or deferred.
- **Failed Message Retry:** One-click retry action for recoverable delivery errors.

### 7. Social Media Hub (Instagram Reels & YouTube Shorts)
- **Curated Feed:** Manage and organize engaging educational reels and shorts with thumbnails, view counts, and engagement stats.
- **1-Click WhatsApp Broadcast Generator:** Automatically prepares engaging, emoji-rich community broadcast copy with verified short video links.

### 8. Camps & Workshops Management
- **Camp Tracker:** Title, subtitle, dates, venue, age group, registration fees, and maximum capacity.
- **Live Seat Availability Meter:** Visual progress bar showing enrolled participants vs. seat caps.
- **Broadcast RSVP Generator:** Generates WhatsApp announcements with dates, venue, and registration links.

### 9. Discounts & Promotional Offers
- **Coupon Code Manager:** Codes, percentage/fixed discounts, expiration dates, target segments, and redemption limits.
- **Broadcast Promo Generator:** Pre-fills WhatsApp campaigns with urgency hooks and expiration reminders.

### 10. Automation Monitor & Incident Diagnostics
- **System Health Indicators:** Live status of Autonomous Scheduler Runner, WhatsApp Cloud API, Anti-Spam Engine, and Queue Worker.
- **Incident Remediation Log:** Error log with severity tags, affected components, failure reasons, and "Mark Resolved" workflows.

### 11. WhatsApp Cloud API Integration
- **Official Meta Cloud API:** Configured for WhatsApp Business API with Phone Number ID, WABA ID, and webhook endpoints.
- **Live Test Message Console:** Send direct test messages to any phone number to verify API connectivity and carrier delivery.
- **Webhook Simulator:** Test inbound webhook callbacks including user `STOP` opt-out replies and delivery/read receipts.

---

## 🛠️ Technology Stack

- **Framework:** Next.js (App Router, Turbopack) & React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Charts:** Recharts
- **Database:** Supabase PostgreSQL with local JSON persistence fallback (`.data/db.json`)
- **API Engine:** Next.js Server-side Route Handlers (`/api/...`)
- **Scheduler:** Background autonomous execution runner (`/api/scheduler`)

---

## 🚀 Getting Started

### 1. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Production Build
```bash
npm run build
npm run start
```

### 3. Deploying to Supabase PostgreSQL
A complete, production-ready schema is included in [`supabase_schema.sql`](./supabase_schema.sql).
1. Create a Supabase project at [supabase.com](https://supabase.com).
2. In the Supabase SQL Editor, paste the contents of `supabase_schema.sql` and run.
3. Add your environment variables in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Background Job Scheduling on Vercel
To trigger the scheduler automatically every 10 minutes when deployed on Vercel, add a `vercel.json` file:
```json
{
  "crons": [
    {
      "path": "/api/scheduler",
      "schedule": "*/10 * * * *"
    }
  ]
}
```
You can also trigger sweeps manually anytime from the header button **"Run Queue Sweep"** in the dashboard.
