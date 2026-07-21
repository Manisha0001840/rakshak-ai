# Rakshak AI

## AI-Powered Digital Public Safety Platform for India

Rakshak AI is a digital public safety platform designed to help Indian citizens detect phone scams, digital arrest fraud, phishing messages, fake government documents, courier fraud, investment scams, loan fraud, job scams, sextortion, and other online threats.

The platform provides two connected experiences:

- A Citizen Portal for analyzing suspicious messages, audio recordings, and documents.
- A Law-Enforcement Command Center for monitoring incidents, identifying fraud networks, and viewing geographic complaint patterns.

> Rakshak AI is a hackathon prototype for awareness, analysis, and public-safety intelligence. It does not replace official police investigation, legal advice, or verified government communication.

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

The Gemini model can be configured through the `GEMINI_MODEL` environment variable. The default model is `gemini-3.5-flash`.

### Deterministic Threat Scoring

The final threat score is calculated by a deterministic scoring engine instead of relying only on the AI response.

```text
Final Score =
Category Score
+ Psychological Tactics Score
+ Threat Signals Score
+ Blocklist Score
```

The maximum score is capped at 100.

#### Category Weights

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

#### Threat Levels

| Score | Threat Level |
|---:|---|
| 0–29 | LOW |
| 30–49 | MEDIUM |
| 50–74 | HIGH |
| 75–100 | CRITICAL |

#### Blocklist Matching

- Known scam UPI ID: +15 points
- Known scam phone number: +10 points

## Technology Stack

- Next.js 14 with App Router
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion
- Google Gemini API
- SQLite with better-sqlite3
- Cytoscape.js and react-cytoscapejs
- Leaflet, React Leaflet, and leaflet.heat
- Lucide React
- Node.js 20+

## Project Architecture

```text
rakshak-ai/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
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
│   ├── command/
│   │   ├── page.tsx
│   │   └── components/
│   │       ├── StatsBar.tsx
│   │       ├── IncidentTable.tsx
│   │       ├── FraudGraph.tsx
│   │       └── GeoHeatmap.tsx
│   └── api/
│       ├── analyze/text/route.ts
│       ├── analyze/audio/route.ts
│       ├── analyze/image/route.ts
│       ├── incidents/route.ts
│       ├── graph/route.ts
│       ├── feedback/route.ts
│       ├── complaint/route.ts
│       └── stats/route.ts
├── lib/
│   ├── gemini.ts
│   ├── prompts.ts
│   ├── scoring.ts
│   ├── db.ts
│   ├── blocklist.ts
│   └── types.ts
├── data/
│   ├── seed-incidents.json
│   ├── blocklist.json
│   └── sample-messages.json
├── scripts/
│   └── seed-db.ts
├── package.json
├── tailwind.config.ts
├── postcss.config.js
├── next.config.js
├── tsconfig.json
└── .env.example
```

## Requirements

Install the following before running the project:

- Node.js 20 or later
- npm
- Git
- A Google Gemini API key

Node.js 20 is recommended because the project uses the native `better-sqlite3` package.

## Installation

Clone the repository:

```bash
git clone https://github.com/Manisha0001840/rakshak-ai.git
cd rakshak-ai
```

Install dependencies:

```bash
npm install --no-audit --no-fund
```

## Environment Configuration

Create a file named `.env.local` in the project root.

### Windows PowerShell

```powershell
Copy-Item .env.example .env.local
notepad .env.local
```

Add your Gemini API key:

```env
GEMINI_API_KEY=your_actual_gemini_api_key
```

Optional model configuration:

```env
GEMINI_MODEL=gemini-3.5-flash
```

Optional database path:

```env
RAKSHAK_DB_PATH=./data/rakshak.sqlite
```

Never commit `.env.local` or expose your API key publicly.

## Database Setup

Populate the SQLite database with demo incidents and blocklist entries:

```bash
npm run seed
```

This creates:

```text
data/rakshak.sqlite
```

The seed data includes 20 sample incidents, 30 known scam identifiers, geographic incident information, and fraud-network relationships.

## Run the Development Server

Start the application:

```bash
npm run dev
```

Open these URLs in your browser:

```text
Landing page:     http://localhost:3000
Citizen portal:   http://localhost:3000/citizen
Command center:   http://localhost:3000/command
```

Stop the server with `Ctrl + C`.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the local development server |
| `npm run build` | Creates a production build |
| `npm run start` | Starts the production server |
| `npm run typecheck` | Runs the TypeScript compiler without emitting files |
| `npm run lint` | Runs Next.js lint checks |
| `npm run seed` | Creates and populates the SQLite database |

Recommended verification commands:

```bash
npm run typecheck
npm run build
```

## API Endpoints

### Analyze Text

```http
POST /api/analyze/text
Content-Type: application/json
```

Example request:

```json
{
  "text": "Your bank account will be blocked today. Click this link immediately.",
  "locale": "en"
}
```

The response includes the detected language, scam category, threat score, threat level, signals, tactics, evidence quotes, explanation, and victim advisory.

### Analyze Audio

```http
POST /api/analyze/audio
Content-Type: multipart/form-data
```

Form field:

```text
file
```

The audio is sent to Gemini for transcription and fraud analysis.

### Analyze Image or Document

```http
POST /api/analyze/image
Content-Type: multipart/form-data
```

Form field:

```text
file
```

The image analyzer checks for fake emblems, misspelled agency names, invalid case numbers, fabricated signatures, fake seals, suspicious URLs, fake legal terminology, digital arrest claims, and fraudulent RBI account instructions.

### Other Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/incidents` | List incidents |
| `POST` | `/api/incidents` | Create an incident |
| `GET` | `/api/stats` | Return command-center statistics |
| `GET` | `/api/graph` | Return fraud graph nodes and edges |
| `POST` | `/api/feedback` | Save citizen feedback |
| `POST` | `/api/complaint` | Generate a cybercrime complaint draft |

## Database Model

The SQLite database stores:

- Incidents
- Fraud graph nodes
- Fraud graph relationships
- Known scam phone numbers
- Known scam UPI IDs

Important incident fields include:

```text
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
```

## Demo Data

The project includes mock data for demonstrations:

- 20 seed incidents
- 15 scam phone numbers
- 15 scam UPI IDs
- 10 sample messages
- Digital arrest, courier, investment, job, phishing, and sextortion examples
- Shared phone and UPI identifiers that form a visible fraud ring in the graph

## Detection Signals

Rakshak AI looks for signals such as:

- Impersonation
- Fake authority claims
- Legal threats
- Urgency
- Isolation instructions
- Money demands
- Identity harvesting
- Emotional manipulation
- Fake government references
- Suspicious links
- Secrecy instructions
- Unrealistic financial promises

The prompts also include false-positive guidance for legitimate bank OTPs, genuine delivery notifications, and official government communications.

## Safety Guidance

If someone is being threatened or pressured:

1. End the call.
2. Do not share OTPs, passwords, PINs, or card details.
3. Do not transfer money to a so-called safe account.
4. Do not install remote-access applications.
5. Save screenshots, phone numbers, UPI IDs, and recordings.
6. Contact the official cybercrime helpline at `1930`.
7. File a complaint at [cybercrime.gov.in](https://www.cybercrime.gov.in).

Rakshak AI should not be the only basis for arrest, investigation, account blocking, or legal action.

## Privacy and Security

This project is a hackathon prototype and requires additional security hardening before production use.

Recommended production improvements include:

- Authentication and role-based access control
- Encryption of stored evidence
- Secure object storage for audio and images
- Database access controls
- Audit logging
- Rate limiting
- Input validation
- Malware scanning for uploaded files
- Personally identifiable information redaction
- Data retention and deletion policies
- Human review before enforcement action
- Secure secrets management

Do not upload real passwords, card details, private keys, or unnecessary personal information while using the demo environment.

## Local SQLite and Deployment Note

The project currently uses file-based SQLite through `better-sqlite3`. This works well for local development, hackathon demonstrations, and single-server deployments.

Standard Vercel serverless deployments do not provide reliable persistent local filesystem storage for SQLite. For production deployment, replace SQLite with a managed database such as PostgreSQL, Supabase, Neon, Turso, or Cloud SQL.

The database integration can be adapted by replacing the database helper functions in:

```text
lib/db.ts
```

## Design System

Rakshak AI uses a dark glassmorphism interface with responsive layouts and animated threat states.

```text
Background: #0a0a0f
Card surface: rgba(255, 255, 255, 0.05)
Primary gradient: #3b82f6 → #8b5cf6
LOW: #22c55e
MEDIUM: #f59e0b
HIGH: #f97316
CRITICAL: #ef4444
```

The interface is designed around clear threat communication, calm victim messaging, evidence-focused incident presentation, and a desktop command-center workflow.

## Project Status

Rakshak AI is an MVP suitable for:

- Hackathon demonstrations
- Fraud-awareness testing
- Public-safety workflow demonstrations
- AI-assisted incident triage
- Product prototyping

The core citizen analysis portal and command center are implemented.

## Future Roadmap

- Hindi and regional-language support
- Real-time scam-number reporting
- WhatsApp and SMS integrations
- Official government verification APIs
- Advanced duplicate-incident detection
- Automated fraud-ring expansion
- Police evidence export packages
- Victim advisory history
- Case assignment and investigation workflows
- Authentication for law-enforcement users
- Managed production database
- Secure cloud evidence storage
- Mobile application
- Browser extension for suspicious links
- Real-time notifications
- Model evaluation and accuracy dashboards

## Contributing

Contributions are welcome.

```bash
git clone https://github.com/Manisha0001840/rakshak-ai.git
cd rakshak-ai
npm install
npm run seed
npm run dev
```

Create a feature branch:

```bash
git checkout -b feature/your-feature-name
```

Run checks before submitting changes:

```bash
npm run typecheck
npm run build
```

Commit and push changes:

```bash
git add .
git commit -m "feat: describe your change"
git push origin feature/your-feature-name
```

## License

A project license has not yet been selected. Add an appropriate license file before public reuse.

## Author

Built as a hackathon project focused on protecting Indian citizens from digital fraud and coordinated cybercrime.

Repository: [github.com/Manisha0001840/rakshak-ai](https://github.com/Manisha0001840/rakshak-ai)
