CropContract - Project Nova
==========================

Offline-first React PWA connecting Sri Lankan smallholder farmers with
commercial buyers through pre-planting contracts, plus AI crop disease detection.

Flow: Know demand -> Secure contract -> AI crop monitoring -> Harvest -> Delivery & pay


USER TYPES AND WHAT HAPPENS FOR EACH
=====================================

1. FARMER
---------
Registration:
- Farmer registers with name, email, phone, region, farm location, crop types
- Phone normalized to +94XXXXXXXXX format (handles +94, 94, 0 prefixes)
- Account created with "farmer" role
- Preferred language set (en/si/ta)

Login Flow:
- Enter phone number + password
- System sends OTP to phone (default: 123456 for demo)
- Verify OTP to receive JWT token
- Check ban status before granting access
- If banned: full-screen BanScreen with live countdown shown

What Farmer Can Do:
a) View Contracts (Marketplace)
   - Browse open contracts by buyers in their region
   - Filter by crop type, region, status
   - See contract details: crop, grade, quantity, price, deadline, notes

b) Commit to Contract
   - Select a contract and specify quantity (kg)
   - System auto-caps at remaining contract quota
   - Commitment stored with idempotency key (client_action_id)
   - Contract status updates to "fulfilled" when total quota met
   - Works offline: queued in IndexedDB, synced on reconnect

c) Track Commitments
   - View all personal commitments
   - Visual GrowthThread: committed -> growing -> ready -> harvested -> delivered -> paid
   - Update status progression

d) Disease Scan
   - Capture leaf photo using device camera (ScanCamera component)
   - Client-side image compression (max 1024px, 0.8 quality JPEG, 5MB limit)
   - AI analyzes image for disease detection
   - Results: disease name, confidence, severity, treatment steps
   - i18n keys returned for trilingual display (English/Sinhala/Tamil)
   - If severity is "high" or "critical": scan flagged for officer review
   - Safety precautions shown from AI analysis
   - Officer can provide solution and additional safety precautions
   - Works offline: queued in IndexedDB, synced later
   - OverCommitRecovery UI if offline commitment exceeds remaining quota

e) View Alerts
   - See regional alerts issued by officers
   - Alerts about disease outbreaks in their region
   - Browser notification support for alert push

f) Submit Delivery
   - Submit delivery info for a commitment (delivered_qty_kg, quality_grade)
   - Updates commitment status to "delivered"

g) Review Buyers
   - Rate and review buyers after contract completion (1-5 stars)
   - One review per contract pair
   - Cross-role only (farmer reviews buyer, not other farmers)

h) Profile Management
   - Edit profile: name, phone, region, preferred language, profile picture
   - Change password
   - View own warnings and ban status

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
- Company details: company name, location, delivery address, delivery address 2
- Phone normalized to +94XXXXXXXXX format
- Account created with "buyer" role

Login Flow:
- Phone + password authentication
- OTP verification
- JWT token issued
- Ban status checked

What Buyer Can Do:
a) Post Contracts
   - Create new purchase contracts
   - Specify: crop type, grade, quantity (kg), price per kg, region
   - Set commitment deadline (default: 14 days)
   - Set delivery date (default: deadline + 45 days)
   - Add optional notes/specifications
   - System checks price ranges set by officers
   - Warning auto-issued if price is below minimum
   - Real-time price range validation during form entry

b) View Contracts
   - See all posted contracts
   - Track commitment progress
   - Filter by status: open, fulfilled, all

c) Manage Commitments
   - View commitments for their contracts
   - See farmer names and quantities
   - Track delivery status
   - Update commitment status: delivered, paid

d) Delivery Management
   - Record deliveries from farmers
   - Track quality grades
   - Update payment status

e) Fulfillment Analytics
   - Dashboard with stat cards, bar chart (intake by week)
   - Regional share breakdown
   - Contract completion rates

f) Review Farmers
   - Rate and review farmers after contract completion (1-5 stars)
   - One review per contract pair
   - Cross-role only (buyer reviews farmer)

g) Profile Management
   - Edit profile
   - Change password
   - View warnings and ban status

Buyer Contract Lifecycle:
- Open: Contract created, accepting commitments
- Fulfilled: Total quantity committed reached


3. OFFICER (Agriculture Officer)
---------------------------------
Registration:
- Officer registers with name, email, phone, region
- Official details: officer ID, department, district, designation
- Phone normalized to +94XXXXXXXXX format
- Account created with "officer" role

Login Flow:
- Phone + password authentication
- OTP verification
- JWT token issued

What Officer Can Do:
a) Review Disease Scans
   - View flagged scans (high/critical severity)
   - See farmer's scan details, disease, confidence
   - Provide officer solution and safety precautions (7 predefined options)
   - Confirm or dismiss scan results
   - Issue regional alerts for critical cases
   - FlaggedScanCard component with expandable review form

b) Issue Alerts
   - Create regional alerts for disease outbreaks
   - Specify affected region, disease, message
   - Alert visible to all farmers in the region
   - Auto-created when officer confirms critical scan

c) Manage Warnings
   - Issue warnings to farmers or buyers for violations
   - Violation types: pricing, disease_report, contract_breach, conduct, other
   - Warning progression:
     * First cycle: 3 warnings -> 7-day temporary ban
     * After ban expires: had_temp_ban flag set
     * Next 3 warnings -> permanent ban
   - View all warnings issued
   - Track warning counts per user

d) Set Price Ranges
   - Define minimum and maximum prices per crop per region
   - Upsert behavior: same crop+region updates existing range
   - Buyers warned if posting contracts below minimum
   - Prevents exploitation of farmers
   - "All Regions" fallback if no exact match

e) Regional Outbreak Monitoring
   - View outbreak data across all regions
   - Detailed view per region (cases by week, trend)
   - Risk levels: low, moderate, high, critical
   - OutbreakTrendChart for visualization

f) User Search
   - Search users by user_id, name, or phone
   - Filter by role
   - View user profiles

g) View User Profiles
   - See any user's profile details
   - View reviews and ratings for that user
   - Average rating and total review count

h) View All Warnings
   - See warnings they have issued
   - Track user compliance


LIBRARIES USED
==============

Backend (Python):
  fastapi>=0.115.0        - Web framework, routing, dependency injection
  uvicorn[standard]       - ASGI server for running FastAPI
  pydantic-settings       - Settings management via .env files
  PyJWT>=2.9.0            - JWT token creation and verification
  passlib[bcrypt]         - Password hashing (bcrypt)
  bcrypt==4.0.1           - Bcrypt backend for passlib
  python-multipart        - File upload handling (multipart/form-data)
  python-dotenv           - Load .env variables
  Pillow>=10.4.0          - Image processing for disease detection heuristic
  motor>=3.3.0            - Async MongoDB driver
  pymongo>=4.6.0          - MongoDB driver (used by motor)
  email-validator         - Email validation for registration
  torch>=2.5.0            - (optional) PyTorch for real CNN inference
  torchvision>=0.20.0     - (optional) PyTorch vision models
  opencv-python>=4.10.0   - (optional) Image preprocessing

Frontend (JavaScript/React):
  react>=18.3.1           - UI framework
  react-dom>=18.3.1       - React DOM renderer
  react-router-dom>=6.27  - Client-side routing
  @tanstack/react-query   - Server state management, caching, background refetch
  axios>=1.7.7            - HTTP client for API calls
  react-hook-form>=7.86   - Form state management and validation
  @hookform/resolvers     - Zod resolver for react-hook-form
  zod>=4.4.3              - Schema validation (forms, API payloads)
  framer-motion>=11.11    - Animations and transitions
  recharts>=2.13.0        - Charts (bar charts for analytics)
  lucide-react>=0.453     - Icon library
  @phosphor-icons/react    - Additional icon library
  i18next>=23.16.0        - Internationalization framework
  react-i18next>=15.0     - React bindings for i18next
  i18next-http-backend    - Load translations from JSON files
  i18next-browser-languagedetector - Auto-detect browser language
  idb>=8.0.0              - IndexedDB wrapper (offline outbox + cache)
  clsx>=2.1.1             - Conditional classname utility
  @fontsource/space-grotesk  - Display font
  @fontsource/noto-sans      - Body font (Latin)
  @fontsource/noto-sans-sinhala - Sinhala script font
  @fontsource/noto-sans-tamil   - Tamil script font

Dev Dependencies:
  vite>=5.4.8             - Build tool and dev server
  @vitejs/plugin-react    - Vite plugin for React Fast Refresh
  vite-plugin-pwa>=0.20.5 - PWA support (Workbox service worker)
  tailwindcss>=3.4.13     - Utility-first CSS framework
  postcss>=8.4.47         - CSS processing
  autoprefixer>=10.4.20   - CSS vendor prefixing


LOGIC AND SYSTEM DESIGN
========================

1. AUTHENTICATION LOGIC
-----------------------
Libraries: PyJWT, passlib, bcrypt, fastapi.security.HTTPBearer
- Registration: Email uniqueness check, phone ban check, banned email check
- Phone normalization: Converts to +94XXXXXXXXX format
- Login: Phone + password -> OTP sent -> Verify OTP -> JWT issued
- JWT contains: user ID, role, expiration (24 hours)
- Role-based access control (RBAC) for all endpoints
- Ban check on every login/OTP verification
- Ban types: temporary (7-day), permanent
- Custom events: cc_auth_expired, cc_user_updated, cc_auth_ready

2. CONTRACT SYSTEM LOGIC
-------------------------
Libraries: fastapi, motor (async MongoDB), @tanstack/react-query, idb
- Buyers create contracts with crop details and pricing
- Farmers commit quantity (auto-capped at remaining quota)
- Idempotency: client_action_id prevents duplicate commitments
- Contract auto-fulfills when committed_kg >= total_kg
- Status progression: open -> fulfilled
- React Query hooks with IndexedDB cache fallback

3. DISEASE DETECTION LOGIC
---------------------------
Libraries: Pillow (heuristic), torch/torchvision (optional CNN), idb
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

i18n Key Resolution:
- Backend returns i18n keys: disease_key, advice_key, treatment_step_keys, safety_precautions
- Frontend resolves via react-i18next for trilingual support

Output:
- Disease name, confidence, severity
- Treatment steps (i18n keys for translation)
- Safety precautions
- Flagged for officer review if severity high/critical
- Image compressed client-side before upload (max 1024px, 0.8 quality)

4. WARNING AND BAN LOGIC
--------------------------
Libraries: fastapi, motor, framer-motion (countdown animation)
Warning Progression:
- First cycle: 3 warnings -> 7-day temporary ban
- Ban expires: had_temp_ban flag set to True
- Second cycle: 3 more warnings -> permanent ban
- Warning count resets after ban expiry (had_temp_ban preserves history)

Ban Types:
- Temporary: Time-based (7 days from issuance)
- Permanent: Irreversible, blocks registration with same email/phone
- BanScreen component blocks all app access
- BanCountdown shows live countdown (days:hours:minutes:seconds)

5. OFFLINE SYNC LOGIC
----------------------
Libraries: idb (IndexedDB), axios (batch POST), vite-plugin-pwa (Workbox SW)
IndexedDB Outbox:
- Actions queued when offline:
  * create_commitment
  * disease_scan
- Each action has client_action_id (UUID)
- Two object stores: outbox and cache

Sync Process:
- On reconnect, batch POST to /sync endpoint
- Server checks for existing client_action_id
- Duplicate detected -> return existing record (idempotent)
- New action -> process and store
- Failed actions reported with error messages
- Auto-sync: online listener + 30s periodic retry + flush on auth ready
- OVER_COMMITTED error recovery UI (OverCommitRecovery component)

Service Worker Caching:
- CacheFirst for locale JSON files
- StaleWhileRevalidate for API endpoints (contracts, alerts, outbreaks)

6. PRICE RANGE VALIDATION
---------------------------
Libraries: fastapi, motor, react-hook-form + zod (frontend validation)
- Officers set min/max prices per crop per region
- Upsert behavior: same crop+region updates existing range
- When buyer posts contract, system checks price range
- Below minimum: Warning auto-issued to buyer
- Above maximum: Warning issued
- "All Regions" fallback if no exact match
- Prevents market exploitation

7. OUTBREAK ENGINE
-------------------
Libraries: motor (MongoDB aggregation)
Risk Calculation:
- Counts disease cases per region
- Risk levels:
  * low: < 2 cases
  * moderate: 2-4 cases
  * high: 5-9 cases
  * critical: 10+ cases
- Trend: "up" if cases > 5, else "flat"
- Runs when scans are reviewed by officers

8. ALERT SYSTEM
----------------
Libraries: fastapi, motor, browser Notifications API
- Officers create regional alerts for disease outbreaks
- Alerts stored with region, disease, message, issuer info
- Farmers view alerts for their region
- Auto-created when officer confirms critical scan
- Browser notification support (Web Notifications API)

9. REVIEW / RATING SYSTEM
---------------------------
Libraries: fastapi, motor, react-hook-form, zod, lucide-react (StarRating)
- Cross-role reviews: farmer reviews buyer, buyer reviews farmer
- Rating: 1-5 stars
- One review per contract pair per direction
- Review stats: average rating, total count
- StarRating, ReviewForm, ReviewList components
- UserProfile page shows reviews

10. IMAGE COMPRESSION
----------------------
Libraries: Canvas API, createImageBitmap
- Client-side compression before upload
- Max dimension: 1024px
- JPEG quality: 0.8
- File limit: 5MB
- Type check: image/* only

11. PWA FEATURES
-----------------
Libraries: vite-plugin-pwa, Workbox
- Service Worker via Workbox (autoUpdate registration)
- PWA install prompt (InstallPrompt component)
- Offline banner when no connection
- SyncBadge shows online/offline/syncing status
- Manifest: standalone display, portrait orientation
- Runtime caching for API and locale files

12. NOTIFICATIONS SERVICE
---------------------------
Libraries: Web Notifications API
- Backend: stubbed notification service (send_alert_notification)
- Frontend: Web Notifications API wrapper
- requestNotificationPermission() for browser permission
- showAlertNotification() for alert push


API ROUTES
==========

Auth:
  POST /auth/register
  POST /auth/login
  POST /auth/verify-otp
  GET  /auth/me
  PUT  /auth/profile
  POST /auth/change-password
  GET  /auth/users/search          (officer only)
  GET  /auth/users/{user_id}

Contracts:
  GET  /contracts
  POST /contracts                  (buyer only)
  GET  /contracts/{id}
  POST /contracts/{id}/commit      (farmer only)

Commitments:
  GET  /commitments/mine
  PATCH /commitments/{id}/status
  POST /commitments/{id}/delivery  (farmer only)

Disease Scans:
  POST /disease-scan               (farmer, officer)
  GET  /scans/mine
  GET  /scans/flagged              (officer only)
  POST /scans/{id}/review          (officer only)

Alerts:
  POST /alerts                     (officer only)
  GET  /alerts/region/{region}

Outbreaks:
  GET  /outbreaks/region/{region}

Deliveries:
  POST /deliveries                 (buyer only)

Reviews:
  POST /reviews
  GET  /reviews/user/{user_id}
  GET  /reviews/mine
  GET  /reviews/stats/{user_id}
  GET  /reviews/check/{user_id}

Warnings:
  POST /warnings                   (officer only)
  GET  /warnings/mine
  GET  /warnings/target/{user_id}  (officer only)
  GET  /warnings/all               (officer only)
  GET  /ban-status

Price Ranges:
  POST /price-ranges               (officer only)
  GET  /price-ranges
  GET  /price-ranges/check/{crop}/{region}
  DELETE /price-ranges/{id}        (officer only)

Sync:
  POST /sync

Health:
  GET  /health
  GET  /


FRONTEND PAGES
==============

Shared (14 pages):
  Login.jsx, FarmerLogin.jsx, BuyerLogin.jsx, OfficerLogin.jsx
  OTPVerify.jsx, Register.jsx, RegisterForm.jsx
  FarmerRegister.jsx, BuyerRegister.jsx, OfficerRegister.jsx
  RegistrationSuccess.jsx, Profile.jsx, UserProfile.jsx, Marketplace.jsx

Farmer (5 pages):
  FarmerHome.jsx       - Dashboard with greeting, active contract, growth thread
  MyContracts.jsx      - Committed contracts list
  ContractDetail.jsx   - Individual contract detail
  DiseaseScan.jsx      - Camera + upload + results
  FarmerAlerts.jsx     - Regional disease alerts

Buyer (5 pages):
  BuyerDashboard.jsx     - Analytics dashboard with charts
  PostContract.jsx       - Create new contract
  BuyerContractDetail.jsx - View posted contract detail
  CommitmentDetail.jsx   - View single commitment
  ContractFulfilment.jsx - Fulfillment analytics

Officer (6 pages):
  OfficerReview.jsx      - Review flagged scans
  RegionalOutbreaks.jsx  - Outbreak data across regions
  RegionDetail.jsx       - Detailed outbreak per region
  PriceRanges.jsx        - Manage crop price ranges
  IssueAlert.jsx         - Create regional alerts
  WarningPanel.jsx       - Issue warnings, view history


FRONTEND COMPONENTS
===================

Common (18):
  Button, Card, Chip, Modal, Sheet, Pill, ProgressBar, CountUp
  Skeleton, EmptyState, PasswordInput, StarRating, ReviewForm
  ReviewList, BanScreen, BanCountdown, InstallPrompt, SyncBadge, Toast

Layout (6):
  AppShell, DesktopSidebar, TopBar, NavTabs, LanguageToggle, OfflineBanner

Farmer (5):
  GrowthThread, AlertBanner, ScanCamera, OverCommitRecovery, ContractCard

Buyer (3):
  StatCard, IntakeChart, CommitmentTable

Officer (3):
  FlaggedScanCard, RiskBadge, OutbreakTrendChart


FRONTEND HOOKS
==============

  useAuth.jsx          - Auth state, login, register, OTP, ban tracking
  useOfflineSync.js    - Connectivity, outbox depth, auto-flush, error recovery
  useContracts.js      - React Query hooks for contracts/commitments
  useWarnings.js       - React Query hooks for warnings/ban status


FRONTEND LIB FILES
==================

  api.js               - Axios instance, JWT interceptor, 401 auto-logout
  db.js                - IndexedDB wrapper (outbox + cache stores)
  sync.js              - Outbox flush, auto-sync, periodic retry
  notifications.js     - Web Notifications API wrapper
  imageCompress.js     - Client-side image compression
  sriLankaRegions.js   - Provinces and districts data
  sriLankaCrops.js     - Crop types and grades


DEMO ACCOUNTS
=============
Password for all: demo1234

farmer@demo.lk  - Kumari Silva (Dambulla)
buyer@demo.lk   - Ravi Perera (Colombo)
officer@demo.lk - Officer Nimal (Nuwara Eliya)


DESIGN SYSTEM
=============
Color Palette:
  Background:  #061912 (dark green-black)
  Surface:     #102A20 (deep green)
  Primary:     #10B981 (emerald)
  Accent:      #34D399 (mint)
  Warning:     #F59E0B (gold/turmeric)
  Error:       #EF4444 (clay/red)
  Text:        #2F5233 (paddy green)

Fonts:
  Display: Space Grotesk (headings)
  Body:    Noto Sans (Latin)
  Sinhala: Noto Sans Sinhala
  Tamil:   Noto Sans Tamil


TEAM
====
Team MB SPARTANS - Saegis Campus
