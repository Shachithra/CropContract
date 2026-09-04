CropContract - Project Nova
==========================

Offline-first React PWA connecting Sri Lankan smallholder farmers with
commercial buyers through pre-planting contracts, plus AI crop disease detection.

Flow: Know demand → Secure contract → AI crop monitoring → Harvest → Delivery & pay


USER TYPES AND WHAT HAPPENS FOR EACH
=====================================

1. FARMER
---------
Registration:
- Farmer registers with name, email, phone, region, farm location, crop types
- Account created with "farmer" role

Login Flow:
- Enter phone number + password
- System sends OTP to phone (default: 123456 for demo)
- Verify OTP to receive JWT token
- Check ban status before granting access

What Farmer Can Do:
a) View Contracts
   - Browse open contracts by buyers in their region
   - Filter by crop type, region, status
   - See contract details: crop, grade, quantity, price, deadline

b) Commit to Contract
   - Select a contract and specify quantity (kg)
   - System auto-caps at remaining contract quota
   - Commitment stored with idempotency key (client_action_id)
   - Contract status updates to "fulfilled" when total quota met

c) Track Commitments
   - View all personal commitments
   - Update status: active → growing → ready → harvested → delivered → paid

d) Disease Scan
   - Capture leaf photo using device camera
   - AI analyzes image for disease detection
   - Results: disease name, confidence, severity, treatment steps
   - If severity is "high" or "critical": scan flagged for officer review
   - Works offline - queued in IndexedDB, synced later

e) View Alerts
   - See regional alerts issued by officers
   - Alerts about disease outbreaks in their region

Farmer Status Progression:
- active: Contract committed, farming started
- growing: Crop is growing
- ready: Crop ready for harvest
- harvested: Crop harvested
- delivered: Crop delivered to buyer
- paid: Payment received


2. BUYER
--------
Registration:
- Buyer registers with name, email, phone, region
- Company details: company name, location, delivery address
- Account created with "buyer" role

Login Flow:
- Phone + password authentication
- OTP verification
- JWT token issued

What Buyer Can Do:
a) Post Contracts
   - Create new purchase contracts
   - Specify: crop type, grade, quantity (kg), price per kg, region
   - Set commitment deadline (default: 14 days)
   - Set delivery date (default: deadline + 45 days)
   - Add optional notes/specifications
   - System checks price ranges set by officers
   - Warning issued if price is below minimum

b) View Contracts
   - See all posted contracts
   - Track commitment progress
   - Filter by status: open, fulfilled, all

c) Manage Commitments
   - View commitments for their contracts
   - See farmer names and quantities
   - Track delivery status
   - Update commitment status: delivered, paid

d) Fulfillment Analytics
   - Dashboard showing contract completion rates
   - Delivery tracking

e) Delivery Management
   - Record deliveries from farmers
   - Track quality grades
   - Update payment status

Buyer Contract Lifecycle:
- Open: Contract created, accepting commitments
- Fulfilled: Total quantity committed reached


3. OFFICER (Agriculture Officer)
---------------------------------
Registration:
- Officer registers with name, email, phone, region
- Official details: officer ID, department, district, designation
- Account created with "officer" role

Login Flow:
- Phone + password authentication
- OTP verification
- JWT token issued

What Officer Can Do:
a) Review Disease Scans
   - View flagged scans (high/critical severity)
   - See farmer's scan details, disease, confidence
   - Provide officer solution and safety precautions
   - Confirm or dismiss scan results
   - Issue regional alerts for critical cases

b) Issue Alerts
   - Create regional alerts for disease outbreaks
   - Specify affected region, disease, message
   - Alert visible to all farmers in the region

c) Manage Warnings
   - Issue warnings to farmers or buyers for violations
   - Violation types: pricing, disease_report, contract_breach, conduct, other
   - Warning progression:
     * 3 warnings → 7-day temporary ban
     * After ban + 3 more warnings → permanent ban
   - View all warnings issued
   - Track warning counts per user

d) Set Price Ranges
   - Define minimum and maximum prices per crop per region
   - Buyers warned if posting contracts below minimum
   - Prevents exploitation of farmers

e) Regional Outbreak Monitoring
   - View outbreak data by region
   - Track disease cases, risk levels, trends
   - Risk levels: low, moderate, high, critical

f) View All Warnings
   - See warnings they have issued
   - Track user compliance


LOGIC AND SYSTEM DESIGN
========================

1. AUTHENTICATION LOGIC
-----------------------
- Registration: Email uniqueness check, phone ban check
- Login: Phone + password → OTP sent → Verify OTP → JWT issued
- JWT contains: user ID, role, expiration (24 hours)
- Role-based access control (RBAC) for all endpoints
- Ban check on every login/OTP verification

2. CONTRACT SYSTEM LOGIC
-------------------------
- Buyers create contracts with crop details and pricing
- Farmers commit quantity (auto-capped at remaining quota)
- Idempotency: client_action_id prevents duplicate commitments
- Contract auto-fulfills when committed_kg >= total_kg
- Status progression: open → fulfilled

3. DISEASE DETECTION LOGIC
---------------------------
Architecture:
- Primary: PyTorch CNN model (MobileNetV3/EfficientNet) if available
- Fallback: Color-statistics heuristic classifier using Pillow

Heuristic Classification:
- Analyzes pixel color ratios: green, yellow, brown, dark, white powder
- Scoring algorithm maps colors to diseases:
  * Healthy Leaf: High green ratio
  * Leaf Blight: Brown + dark pixels
  * Leaf Rust: Yellow + brown pixels
  * Powdery Mildew: White powder pixels
  * Bacterial Spot: Dark + brown pixels
  * Nitrogen Deficiency: Yellow pixels
- Confidence calculated from score differential
- Severity mapped from disease class definitions

Output:
- Disease name, confidence, severity
- Treatment steps (i18n keys for translation)
- Safety precautions
- Flagged for officer review if severity high/critical

4. WARNING AND BAN LOGIC
--------------------------
Warning Progression:
- First cycle: 3 warnings → 7-day temporary ban
- After ban served: 3 more warnings → permanent ban
- Warning count never resets (preserves history)
- Ban expiry checked on login

Ban Types:
- Temporary: Time-based (7 days from issuance)
- Permanent: Irreversible, blocks registration with same email/phone

5. OFFLINE SYNC LOGIC
----------------------
IndexedDB Outbox:
- Actions queued when offline:
  * create_commitment
  * disease_scan
- Each action has client_action_id (UUID)

Sync Process:
- On reconnect, batch POST to /sync endpoint
- Server checks for existing client_action_id
- Duplicate detected → return existing record (idempotent)
- New action → process and store
- Failed actions reported with error messages

6. PRICE RANGE VALIDATION
---------------------------
- Officers set min/max prices per crop per region
- When buyer posts contract, system checks price range
- Below minimum: Warning auto-issued to buyer
- Above maximum: Warning issued
- Prevents market exploitation

7. OUTBREAK ENGINE
-------------------
Risk Calculation:
- Counts disease cases per region
- Risk levels:
  * low: < 2 cases
  * moderate: 2-4 cases
  * high: 5-9 cases
  * critical: 10+ cases
- Trend: "up" if cases > 5, else "flat"

8. ALERT SYSTEM
----------------
- Officers create regional alerts for disease outbreaks
- Alerts stored with region, disease, message, issuer info
- Farmers view alerts for their region
- Auto-created when officer confirms critical scan


API ROUTES
==========
POST /auth/register        POST /auth/login
POST /auth/verify-otp      GET  /auth/me
PUT  /auth/profile         POST /auth/change-password

GET  /contracts            POST /contracts
GET  /contracts/{id}       POST /contracts/{id}/commit

GET  /commitments/mine     PATCH /commitments/{id}/status
POST /commitments/{id}/delivery

POST /disease-scan         GET  /scans/mine
GET  /scans/flagged        POST /scans/{id}/review

POST /alerts               GET  /alerts/region/{region}
GET  /outbreaks/region/{region}

POST /deliveries           GET  /deliveries

POST /warnings             GET  /warnings/mine
GET  /warnings/target/{id} GET  /warnings/all
GET  /ban-status

POST /price-ranges         GET  /price-ranges
GET  /price-ranges/check/{crop}/{region}
DELETE /price-ranges/{id}

POST /sync                 GET  /health


DEMO ACCOUNTS
=============
Password for all: demo1234

farmer@demo.lk  - Kumari Silva (Dambulla)
buyer@demo.lk   - Ravi Perera (Colombo)
officer@demo.lk - Officer Nimal (Nuwara Eliya)


TECH STACK
==========
Frontend: React 18, Vite, Tailwind, Framer Motion, Recharts, Lucide
Offline:  vite-plugin-pwa (Workbox SW), IndexedDB outbox (idb)
i18n:     i18next - English / Sinhala / Tamil
Backend:  FastAPI, PyJWT, passlib(bcrypt), Pillow
ML:       PyTorch weights when available, else color-statistics heuristic


TEAM
====
Team MB SPARTANS - Saegis Campus
