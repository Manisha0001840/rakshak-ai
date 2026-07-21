# Rakshak AI

## AI-Powered Digital Public Safety Platform for India

Rakshak AI is an AI-powered digital public safety platform designed to help Indian citizens identify phone scams, digital arrest fraud, phishing messages, fake government documents, investment scams, courier fraud, and other forms of cybercrime.

The platform has two main interfaces:

- Citizen Portal: Analyze suspicious messages, call recordings, and documents.
- Command Center: Help law enforcement monitor incidents, fraud networks, and geographic patterns.

---

## Features

### Citizen Portal

Citizens can:

- Paste suspicious SMS, WhatsApp messages, emails, or links.
- Upload scam call recordings.
- Upload screenshots or fake government documents.
- Receive an AI-generated scam analysis.
- View a threat score from 0 to 100.
- See the detected scam category.
- View evidence-based threat signals.
- Understand the psychological tactics used by scammers.
- Receive a victim-friendly explanation.
- Generate a cybercrime complaint draft.
- Confirm or deny whether the content was a scam.
- Get emergency guidance for critical threats.

Supported scam categories include:

- Digital arrest fraud
- Courier fraud
- Investment scam
- Loan fraud
- Job scam
- Sextortion
- Tech support scam
- Phishing
- Impersonation
- No scam detected

### Command Center

The law enforcement dashboard provides:

- Total incident statistics
- Critical incident count
- High-risk incident monitoring
- Incident table with filtering
- Fraud network graph
- Scammer phone and UPI relationship mapping
- Victim and money mule relationships
- Geographic complaint heatmap across India
- Incident-level evidence and threat information

### AI Analysis

Rakshak AI uses Google Gemini for:

- Text analysis
- Audio transcription and scam analysis
- Image and document analysis
- NCRP complaint generation
- Victim advisory generation
- Police evidence summaries

The final threat score is calculated using a deterministic scoring engine instead of relying only on the AI response.

---

## Threat Scoring

Rakshak AI calculates a score between 0 and 100.

```text
Final Score =
Category Score
+ Psychological Tactics Score
+ Threat Signals Score
+ Blocklist Score

Copy the following into README.md in your project:
# Rakshak AI

## AI-Powered Digital Public Safety Platform for India

Rakshak AI is a digital public safety platform designed to help Indian citizens detect phone scams, digital arrest fraud, phishing messages, fake government documents, courier fraud, investment scams, loan fraud, job scams, sextortion, and other online threats.

The platform provides two connected experiences:

- A citizen portal for analyzing suspicious messages, audio recordings, and documents.
- A law-enforcement command center for monitoring incidents, identifying fraud networks, and viewing geographic complaint patterns.

> Rakshak AI is a hackathon prototype for awareness, analysis, and public-safety intelligence. It does not replace official police investigation, legal advice, or verified government communication.

---

## Key Features

### Citizen Portal

Citizens can visit `/citizen` to:

- Paste suspicious SMS, WhatsApp messages, emails, or social-media messages.
- Upload suspicious audio recordings.
- Upload fake government notices, warrants, identity documents, or screenshots.
- Receive an AI-generated fraud analysis.
- View a deterministic threat score from 0 to 100.
- See the detected scam category.
- Review threat signals and psychological tactics.
- View evidence quotes extracted from the input.
- Receive safety recommendations.
- Generate a structured cybercrime complaint draft.
- Confirm or deny whether the content was a scam.
- Get emergency guidance for high-risk incidents.

### Command Center

Law-enforcement users can visit `/command` to:

- View total reported incidents.
- Monitor critical and high-risk incidents.
- Review recent complaints.
- Filter incidents by threat level and category.
- Explore connected scammer phone numbers and UPI IDs.
- Identify potential fraud rings.
- View incident clusters on an India geographic heatmap.
- Inspect incident details and extracted intelligence.

### AI Analysis

Rakshak AI uses Google Gemini for multimodal analysis:

- Text analysis
- Audio transcription and analysis
- Document and image analysis
- Complaint draft generation
- Victim-focused explanations

The current default Gemini model is configurable through the `GEMINI_MODEL` environment variable.

### Deterministic Threat Scoring

The final threat score is calculated by a deterministic scoring engine instead of relying only on the AI response.

```text
Final Score =
Category Score
+ Psychological Tactics Score
+ Threat Signals Score
+ Blocklist Score
The maximum score is capped at 100.
Category Weights
| Scam Category | Weight |
|---|---:|
| Digital Arrest | 30 |
| Sextortion | 25 |
| Courier Fraud | 22 |
| Investment Scam | 20 |
| Impersonation | 20 |
| Loan Fraud | 18 |
| Phishing | 18 |
| Job Scam | 12 |
| Tech Support Scam | 10 |
| None | 0 |

Threat Levels
| Score | Threat Level |
|---:|---|
| 0–29 | LOW |
| 30–49 | MEDIUM |
| 50–74 | HIGH |
| 75–100 | CRITICAL |

Blocklist Matching
Known scam UPI ID: +15 points
Known scam phone number: +10 points
Technology Stack
Next.js 14
React 18
TypeScript
Tailwind CSS
Framer Motion
Google Gemini API
SQLite
better-sqlite3
Cytoscape.js
React Cytoscape
Leaflet
React Leaflet
leaflet.heat
Lucide React
Node.js 20+

Project Architecture
rakshak-ai/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   │
│   ├── citizen/
│   │   ├── page.tsx
│   │   └── components/
│   │       ├── TextAnalyzer.tsx
│   │       ├── AudioAnalyzer.tsx
│   │       ├── ImageAnalyzer.tsx
│   │       ├── ThreatCard.tsx
│   │       ├── AlertOverlay.tsx
│   │       ├── ComplaintDraft.tsx
│   │       └── FeedbackButtons.tsx
│   │
│   ├── command/
│   │   ├── page.tsx
│   │   └── components/
│   │       ├── StatsBar.tsx
│   │       ├── IncidentTable.tsx
│   │       ├── FraudGraph.tsx
│   │       └── GeoHeatmap.tsx
│   │
│   └── api/
│       ├── analyze/
│       │   ├── text/route.ts
│       │   ├── audio/route.ts
│       │   └── image/route.ts
│       ├── incidents/route.ts
│       ├── graph/route.ts
│       ├── feedback/route.ts
│       ├── complaint/route.ts
│       └── stats/route.ts
│
├── lib/
│   ├── gemini.ts
│   ├── prompts.ts
│   ├── scoring.ts
│   ├── db.ts
│   ├── blocklist.ts
│   └── types.ts
│
├── data/
│   ├── seed-incidents.json
│   ├── blocklist.json
│   └── sample-messages.json
│
├── scripts/
│   └── seed-db.ts
│
├── package.json
├── tailwind.config.ts
├── postcss.config.js
├── next.config.js
├── tsconfig.json
└── .env.example

Requirements
Before running the project, install:
Node.js 20 or later
npm
Git
A Google Gemini API key
Node.js 20 is recommended because the project uses the native better-sqlite3 package.

Installation
Clone the repository:
git clone https://github.com/Manisha0001840/rakshak-ai.git
cd rakshak-ai
Install dependencies:
npm install --no-audit --no-fund

Environment Configuration
Create a file named .env.local in the project root.
Windows PowerShell
Copy-Item .env.example .env.local
notepad .env.local
Add your Gemini API key:
GEMINI_API_KEY=your_actual_gemini_api_key
The current default model is:
GEMINI_MODEL=gemini-3.5-flash
You may override it if required:
GEMINI_MODEL=gemini-3.1-flash-lite
Optional database path:
RAKSHAK_DB_PATH=./data/rakshak.sqlite
Never commit .env.local or expose your API key publicly.

Database Setup
Populate the SQLite database with demo incidents and blocklist entries:
npm run seed
This creates:
data/rakshak.sqlite
The seed data includes:
20 sample incidents
30 known scam identifiers
Phone and UPI fraud relationships
Geographic incident information
Fraud-network relationships
The SQLite database is ignored by Git and can be regenerated using the seed command.

Run the Development Server
Start the application:
npm run dev
Open the following URLs in your browser:
Landing page:
http://localhost:3000

Citizen portal:
http://localhost:3000/citizen

Command center:
http://localhost:3000/command
To stop the server, press:
Ctrl + C

Available Scripts
| Command | Description |
|---|---|
| `npm run dev` | Starts the local development server |
| `npm run build` | Creates a production build |
| `npm run start` | Starts the production server |
| `npm run typecheck` | Runs the TypeScript compiler without emitting files |
| `npm run lint` | Runs Next.js lint checks |
| `npm run seed` | Creates and populates the SQLite database |

Recommended verification:
npm run typecheck
npm run build

API Endpoints
Analyze Text
POST /api/analyze/text
Content-Type: application/json
Example request:
{
  "text": "Your bank account will be blocked today. Click this link immediately.",
  "locale": "en"
}
The response includes:
Detected language
Scam category
Threat score
Threat level
Threat signals
Psychological tactics
Evidence quotes
Explanation
Victim advisory

Analyze Audio
POST /api/analyze/audio
Content-Type: multipart/form-data
Form field:
file
The audio is sent to Gemini for transcription and fraud analysis.

Analyze Image or Document
POST /api/analyze/image
Content-Type: multipart/form-data
Form field:
file
The image analyzer checks for indicators such as:
Fake government emblems
Misspelled agency names
Invalid case numbers
Fabricated signatures
Fake seals
Suspicious URLs
Fake legal terminology
Digital arrest claims
Fraudulent RBI account instructions

Incidents
GET /api/incidents
POST /api/incidents
Used to retrieve and create fraud incidents.

Dashboard Statistics
GET /api/stats
Returns aggregate information such as:
Total incidents
Critical incidents
High-risk incidents
Category counts
Geographic summaries

Fraud Graph
GET /api/graph
Returns graph nodes and relationships for:
Scammer phone numbers
Scammer UPI IDs
Victims
Mule accounts
Incident relationships

Feedback
POST /api/feedback
Stores citizen feedback about whether an analyzed item was a scam.

Complaint Draft
POST /api/complaint
Generates a structured cybercrime complaint draft from an analysis result.
The generated complaint can be reviewed before filing through the official National Cyber Crime Reporting Portal.

Database Schema
The project uses SQLite tables for:
Incidents
Fraud graph nodes
Fraud graph edges
Known scam blocklist entries
The main incident fields include:
id
created_at
channel
raw_input
locale
scam_category
threat_score
threat_level
score_breakdown
threat_signals
tactics
explanation
scammer_phone
scammer_upi
victim_city
victim_lat
victim_lng
feedback
complaint_filed

Demo Data
The project includes mock data for demonstration purposes.
Seed Incidents
The dataset contains examples of:
Digital arrest fraud
Courier fraud
Investment scams
Job scams
Phishing
Sextortion
Blocklist
The blocklist contains:
15 scam phone numbers
15 scam UPI IDs
Sample Messages
The sample messages cover common fraud patterns, including:
Fake KYC updates
Digital arrest threats
Courier and customs fraud
Investment promises
Fake job offers
Loan processing scams
Sextortion
Bank phishing
Technical support scams
Legitimate bank OTP messages for false-positive testing

Fraud Detection Signals
Rakshak AI looks for signals such as:
Impersonation
Fake authority claims
Legal threats
Urgency
Isolation instructions
Money demands
Identity harvesting
Emotional manipulation
Fake government references
Suspicious links
Secrecy instructions
Unrealistic financial promises
The system also attempts to avoid incorrectly flagging:
Legitimate bank OTP messages
Genuine delivery notifications
Official government communications
Normal account-security alerts

Safety Guidance
If a user is currently being threatened or pressured:
End the call.
Do not share OTPs, passwords, PINs, or card details.
Do not transfer money to a “safe account.”
Do not install remote-access applications.
Save screenshots, phone numbers, UPI IDs, and recordings.
Contact the official cybercrime helpline at 1930.
File a complaint through the official portal:
https://www.cybercrime.gov.in
Rakshak AI should not be used as the only basis for arrest, investigation, account blocking, or legal action.

Privacy and Security
This prototype is designed for hackathon demonstration and requires additional hardening before production use.
Recommended production improvements include:
Authentication and role-based access control
Encryption of stored evidence
Secure object storage for audio and images
Database access controls
Audit logging
Rate limiting
Input validation
Malware scanning for uploaded files
PII redaction
Secure secrets management
Data retention and deletion policies
Police and legal review workflows
Human verification before enforcement action
Do not upload real sensitive documents, passwords, card details, or private information while using the demo environment.

Local SQLite and Deployment Note
The project currently uses file-based SQLite through better-sqlite3.
This works well for:
Local development
Hackathon demonstrations
Single-server deployments
Offline or controlled environments
Standard Vercel serverless deployments do not provide reliable persistent local filesystem storage for SQLite. For production deployment, replace SQLite with a managed database such as:
PostgreSQL
Supabase
Neon
Turso
Cloud SQL
The application can then be adapted by replacing the database helper functions in:
lib/db.ts

Design System
Rakshak AI uses a dark glassmorphism interface.
Colors
Background: #0a0a0f
Card surface: rgba(255, 255, 255, 0.05)
Primary gradient: #3b82f6 → #8b5cf6
LOW: #22c55e
MEDIUM: #f59e0b
HIGH: #f97316
CRITICAL: #ef4444

Interface Principles
Clear threat communication
Mobile-first citizen experience
Desktop dashboard for command-center users
Strong visual distinction between threat levels
Calm, empathetic victim messaging
Evidence-focused incident presentation
Responsive glassmorphism cards
Animated alerts for critical threats

Project Status
Rakshak AI is currently an MVP suitable for:
Hackathon demonstrations
Product prototyping
Fraud-awareness testing
Public-safety workflow demonstrations
AI-assisted incident triage
The core citizen analysis portal and command center are implemented.

Future Roadmap
Potential future improvements include:
Hindi and regional-language support
Real-time scam-number reporting
WhatsApp and SMS integrations
Official government verification APIs
Advanced duplicate-incident detection
Automated fraud-ring expansion
Police evidence export packages
Victim advisory history
Case assignment and investigation workflows
Authentication for law-enforcement users
Managed production database
Cloud evidence storage
Mobile application
Browser extension for suspicious links
Real-time notifications
Model evaluation and accuracy dashboards

Contributing
Contributions are welcome.
To contribute:
git clone https://github.com/Manisha0001840/rakshak-ai.git
cd rakshak-ai
npm install
npm run seed
npm run dev
Create a feature branch:
git checkout -b feature/your-feature-name
Run checks before submitting changes:
npm run typecheck
npm run build
Commit changes using a clear message:
git add .
git commit -m "feat: describe your change"
git push origin feature/your-feature-name

License
A project license has not yet been selected.
For public reuse, add an appropriate license file such as MIT, Apache-2.0, or another license that matches the project goals.

Author
Built as a hackathon project focused on protecting Indian citizens from digital fraud and coordinated cybercrime.
