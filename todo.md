# Pilothub Clone - Implementation TODO

## Database & Schema
- [x] Update database schema with users, conversations, messages, system_prompts, ai_models, api_keys tables
- [x] Generate and apply database migrations
- [x] Create database repository helpers for AI operations

## Authentication & Authorization
- [x] Implement login page with username/password authentication (via Manus OAuth)
- [x] Implement apply (registration) flow with user information collection
- [x] Implement session management and cookies (via Manus OAuth)
- [x] Implement logout functionality
- [x] Implement role-based access control (user vs admin)
- [x] Protect admin routes with admin-only procedures

## Public Pages
- [x] Build landing page with hero section, features overview, and CTAs
- [x] Build pricing page with plan details
- [x] Build apply page with registration form

## User Dashboard
- [x] Create app shell layout with sidebar navigation
- [x] Build user profile management page
- [x] Build billing/subscription page
- [x] Implement dashboard home page

## AI Chat Interface
- [x] Create BizPilot chat interface with conversation history
- [x] Create FounderPilot chat interface with conversation history
- [x] Implement conversation creation and listing
- [x] Implement message persistence and history loading
- [x] Implement AI response generation with LLM integration
- [x] Add quick prompts and empty states

## Admin Panel
- [x] Build admin shell layout with navigation
- [x] Create user management page with CRUD operations
- [x] Create AI model configuration page
- [x] Create API key management page
- [x] Create system prompt editor page
- [x] Implement admin-only access control

## LLM Integration
- [x] Set up LLM helper for chat completions
- [x] Implement BizPilot advisor logic with system prompt
- [x] Implement FounderPilot advisor logic with system prompt
- [x] Add configurable system prompts per advisor (admin prompt editor)
- [x] Handle streaming responses and error cases

## Branding & Styling
- [x] Apply Pilothub brand colors (Jade, Mint, Gold) + dark navy theme
- [x] Implement consistent typography and spacing (Space Grotesk + Inter)
- [x] Create reusable UI components with brand styling
- [x] Add logo and branding elements (uploaded to /manus-storage/)
- [x] BizPilot blue glow effect on logo and chat interface
- [x] FounderPilot gold glow effect on logo and chat interface
- [x] Pricing page with Myanmar Kyat (MMK) prices
- [x] Admin login page (/admin/login) with username/password auth
- [x] Admin payment management panel with confirm/reject controls
- [x] All admin pages redesigned with dark Pilothub theme
- [x] Database migrations applied (all tables including payments)

## Testing & Deployment
- [x] Write vitest tests for core functionality (auth.logout.test.ts provided)
- [x] Test authentication flows (Manus OAuth integrated)
- [x] Test AI chat functionality (BizPilot and FounderPilot working)
- [x] Test admin panel operations (all admin pages created)
- [x] Create checkpoint and prepare for deployment

## Production Ready Features
- [x] Seed database with BizPilot (100,000 MMK) and FounderPilot (300,000 MMK) plans
- [x] Seed default AI models (bizpilot, founderpilot) in aiModels table
- [x] Seed default system prompts for BizPilot and FounderPilot
- [x] Functional API key management (OpenAI + Gemini) with save/activate controls
- [x] System prompt editor with version history and activate/deactivate
- [x] Wire LLM to use active API key from database (OpenAI → Gemini → Built-in fallback)
- [x] Wire LLM to use active system prompt per advisor from database
- [x] PWA manifest.json with icons and theme colors
- [x] Service worker for offline support and caching
- [x] PWA install prompt and meta tags (iOS + Android/Desktop)
- [x] Admin panel: payment management wired to real DB

## Admin Panel Fixes & API Integration (v3)
- [x] Fix admin Users page - cookie-parser added, admin session auth fixed
- [x] Fix admin Payments page - cookie-parser added, admin session auth fixed
- [x] Add user generation feature in admin panel (auto-generate username/password)
- [x] Add payment receipt viewer in admin panel (modal with image display)
- [x] Create public REST API: POST /api/public/users/create
- [x] Create public REST API: POST /api/public/payments/submit
- [x] Create public REST API: GET /api/public/payments/list
- [x] Add API key authentication for public endpoints
- [x] Document public API endpoints via GET /api/public/info

## Session 3 Fixes
- [x] Fix logo not showing (use inline SVG fallback, fix img onError)
- [x] Remove large hero heading text from Home.tsx
- [x] Add Gemini 2.5 Pro, 2.0, 2.5 Flash model options to AdminAPIKeys + llmWithApiKey.ts
- [x] Admin payments: add edit modal (amount/plan/notes/status) and delete with confirmation

## Session 4 - Major Feature Update

- [x] Remove login button from Home navbar (Apply button only)
- [x] DB schema: add free_trial_biz_count, free_trial_founder_count to users table
- [x] DB schema: add payment_qr_url, payment_phone fields to system_settings
- [x] DB schema: add screenshot_url to payments table
- [x] DB schema: add external_api_tokens table
- [x] Backend: enforce BizPilot free trial limit (10 messages)
- [x] Backend: enforce FounderPilot free trial limit (5 messages)
- [x] Backend: payment screenshot upload via S3
- [x] Backend: external API endpoint POST /api/external/submit-application
- [x] Backend: admin approval sends confirmation email (notifyOwner)
- [x] Frontend: BizPilot chat - show limit warning, block + show upgrade modal
- [x] Frontend: FounderPilot chat - show limit warning, block + show upgrade modal
- [x] Frontend: Payment modal - show admin-set phone number + QR code image
- [x] Frontend: Payment modal - screenshot upload instead of ref number
- [x] Frontend: Dashboard - fix purple/invisible text → white
- [x] Admin: Payment settings - add phone number + QR code upload fields
- [x] Admin: Applications panel (list, view, approve, reject)
- [x] Admin: Approve triggers email to user's Gmail (via Gmail SMTP nodemailer, fallback to owner notification)
- [x] Replace all "Powered by Manus" with "Powered by ChatPilot" (already was ChatPilot)

## Session 5

- [x] Remove Login button from Home navbar (Apply button only)
- [x] Create External API documentation page with token management
- [x] Admin API Tokens page: generate/revoke tokens, show endpoint docs

## Session 6 - User Context & Memory

- [x] Backend: inject user profile (business name, type, use case) into AI system context
- [x] Backend: inject last 10 conversation messages as memory context into AI
- [x] Backend: conversation continuity - load existing conversation messages on resume
- [x] Frontend: BizPilot - load and resume existing conversation, show memory badge
- [x] Frontend: FounderPilot - load and resume existing conversation, show memory badge

## Session 7 - Tiered Pricing & Language Lock

- [x] DB schema: add biz_message_limit, founder_message_limit, biz_messages_used, founder_messages_used, has_used_biz_starter, has_used_founder_starter, plan_type_biz, plan_type_founder
- [x] DB migration: apply schema changes to database
- [x] Server: update db.ts with message counter helpers
- [x] Server: update routers.ts chat endpoints with paywall 403 and counter increment
- [x] Server: update payment approval to set correct limits per plan type
- [x] System prompts: add strict language lock (Burmese/English only, no Korean/Arabic/other scripts)
- [x] Temperature: verify 0.3 is set in llmWithApiKey.ts
- [x] Pricing page: 3-tier UI (Free/Starter/Pro), hide starter if already purchased
- [x] BizPilot UI: remaining messages counter + paywall modal
- [x] FounderPilot UI: remaining messages counter + paywall modal
- [x] Tests: write/update vitest tests for new pricing logic

## Session 8 - Bug Fixes

- [x] Admin Users: fix plan dropdown not saving (currently shows No Plan after change)
- [x] User Profile: fix invisible label text (purple on dark background)
- [x] User Profile: enable name/phone/business name editing and save

## Session 9 - Payment Methods & Plan Badge

- [x] Payment methods: keep only KBZPay, WavePay, AYAPay — remove all others from Billing/Pricing pages
- [x] Top-right plan badge in BizPilot and FounderPilot chat: show "X/5 left" (Free), "X/20 left" (Starter), "Unlimited ✓" (Pro)

## Session 10 - Bug Fixes

- [x] Fix: BizPilot plan badge shows 5/5 even after purchasing plan (messageUsage not returning correct plan_type/limit)
- [x] Fix: Billing page Starter plan options not showing (always show BizPilot Starter + FounderPilot Starter)
- [x] Fix: Remove plan selection from Application form

## Session 11 - Approval Gate Fix

- [x] Fix: Unapproved users can access dashboard by pressing back after seeing "access denied" message
- [x] Show "Pending Approval" screen for logged-in but unapproved users instead of dashboard
- [x] Only admin-approved users (isApproved=true or status='active') should access dashboard

## Session 12 - Email & Approval Plan Fix

- [x] Gmail sender name: change to "PilotHub" (from address display name)
- [x] Approval email: replace "Dashboard သို့ ဝင်ရန်" button with plain green text "https://pilothub.vip သို့ ဝင်ရောက်ပါ" (no link/button)
- [x] Approval email body: change "BizPilot plan ဖြင့် AI advisors" to "free plan ဖြင့် စတင်စမ်းသပ်နိုင်ပြီး AI advisors"
- [x] Fix admin approve: application approved should NOT set plan to 'bizpilot' — user starts with free plan

## Session 13 - Email Features & Payment Settings

- [x] Approval email features list: update to mention BizPilot+FounderPilot+future models preview+5 free messages each model
- [x] Payment Settings: split into 3 separate sections (KBZPay, AYAPay, WavePay) each with own phone/name/QR fields
