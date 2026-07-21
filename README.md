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
