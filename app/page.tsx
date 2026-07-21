import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  FileWarning,
  LockKeyhole,
  Network,
  PhoneCall,
  ScanSearch,
  ShieldCheck,
  Siren,
} from "lucide-react";

const capabilities = [
  {
    icon: ScanSearch,
    eyebrow: "Citizen protection",
    title: "Understand suspicious messages",
    description: "Paste a message, upload a call, or share a document and receive a clear threat breakdown in seconds.",
    tone: "from-blue-500/20 to-cyan-500/5",
  },
  {
    icon: Network,
    eyebrow: "Investigation intelligence",
    title: "Connect the fraud ring",
    description: "Surface recurring phone numbers, UPI identifiers, mule accounts, and victim patterns in one view.",
    tone: "from-violet-500/20 to-fuchsia-500/5",
  },
  {
    icon: Siren,
    eyebrow: "Rapid response",
    title: "Move from alert to action",
    description: "Prioritize critical incidents, draft a complaint, preserve evidence, and guide victims to the right help.",
    tone: "from-rose-500/20 to-orange-500/5",
  },
];

const steps = [
  ["01", "Submit evidence", "Paste a message or upload a suspicious call or document."],
  ["02", "Get a threat score", "AI identifies tactics and signals; a deterministic engine calculates risk."],
  ["03", "Take the next safe step", "Use the advisory, complaint draft, and responder tools to act quickly."],
];

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[42rem] bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.15),transparent_65%)]" />

      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-6 sm:px-8 lg:px-10">
        <Link href="/" className="focus-ring flex items-center gap-3 rounded-xl" aria-label="Rakshak AI home">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent-gradient shadow-glow">
            <ShieldCheck className="h-5 w-5 text-white" />
          </span>
          <span>
            <span className="block text-sm font-semibold tracking-[0.22em] text-white">RAKSHAK AI</span>
            <span className="block text-[10px] uppercase tracking-[0.26em] text-slate-500">Digital public safety</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-slate-400 md:flex" aria-label="Primary navigation">
          <a className="transition hover:text-white" href="#how-it-works">
            How it works
          </a>
          <a className="transition hover:text-white" href="#capabilities">
            Capabilities
          </a>
          <Link className="transition hover:text-white" href="/command">
            Command center
          </Link>
        </nav>

        <Link
          href="/citizen"
          className="focus-ring button-secondary hidden items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium sm:flex"
        >
          Check a message
          <ArrowRight className="h-4 w-4" />
        </Link>
      </header>

      <section className="relative z-10 mx-auto grid max-w-7xl gap-16 px-5 pb-24 pt-16 sm:px-8 sm:pt-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-10 lg:pb-32">
        <div>
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3.5 py-2 text-xs font-medium text-blue-200">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            AI-assisted safety intelligence for India
          </div>

          <h1 className="max-w-3xl text-5xl font-semibold leading-[1.02] tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl">
            Detect the threat.
            <span className="mt-2 block text-gradient">Protect the person.</span>
          </h1>

          <p className="mt-7 max-w-2xl text-base leading-8 text-slate-400 sm:text-lg">
            Rakshak AI helps citizens recognize digital arrest fraud, phone scams, fake government documents, and coordinated fraud networks before the damage spreads.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/citizen"
              className="focus-ring button-primary inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold"
            >
              Analyze something suspicious
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/command"
              className="focus-ring button-secondary inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold"
            >
              Open command center
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Built for fast decisions
            </span>
            <span className="inline-flex items-center gap-2">
              <LockKeyhole className="h-4 w-4 text-blue-400" />
              Evidence-aware analysis
            </span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl lg:ml-auto">
          <div className="absolute -inset-10 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="glass-panel relative overflow-hidden rounded-[2rem] p-4 shadow-glass sm:p-5">
            <div className="flex items-center justify-between border-b border-white/10 px-3 pb-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500">Live threat monitor</p>
                <p className="mt-1 text-sm font-medium text-white">Incident intelligence overview</p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] text-emerald-300">
                <Activity className="h-3.5 w-3.5" /> Active
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:col-span-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-slate-500">Threat level</p>
                    <p className="mt-2 text-2xl font-semibold text-red-300">CRITICAL</p>
                  </div>
                  <span className="critical-pulse flex h-10 w-10 items-center justify-center rounded-xl border border-red-400/25 bg-red-400/10">
                    <Siren className="h-5 w-5 text-red-300" />
                  </span>
                </div>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[88%] rounded-full bg-gradient-to-r from-orange-500 to-red-400" />
                </div>
                <div className="mt-2 flex justify-between text-[11px] text-slate-500">
                  <span>Digital arrest pattern</span>
                  <span>88 / 100</span>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <p className="text-xs text-slate-500">Signals found</p>
                <p className="mt-2 text-2xl font-semibold text-white">08</p>
                <div className="mt-4 flex gap-1">
                  <span className="h-1.5 w-6 rounded-full bg-red-400" />
                  <span className="h-1.5 w-4 rounded-full bg-orange-400" />
                  <span className="h-1.5 w-3 rounded-full bg-amber-400" />
                </div>
              </div>
            </div>

            <div className="space-y-2 px-3 pb-3">
              {["Fake authority claim", "Urgent money demand", "Isolation instruction"].map((signal, index) => (
                <div key={signal} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/10 px-3.5 py-3">
                  <div className="flex items-center gap-3">
                    <span className={`h-2 w-2 rounded-full ${index === 2 ? "bg-amber-400" : "bg-red-400"}`} />
                    <span className="text-xs text-slate-300">{signal}</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-slate-600">detected</span>
                </div>
              ))}
            </div>

            <div className="mt-1 flex items-center gap-3 rounded-2xl border border-blue-400/15 bg-blue-400/[0.07] p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-400/15">
                <PhoneCall className="h-4 w-4 text-blue-300" />
              </div>
              <p className="text-xs leading-5 text-slate-300">
                If money was transferred, call <span className="font-semibold text-blue-200">1930</span> immediately and preserve the evidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="capabilities" className="relative z-10 mx-auto max-w-7xl scroll-mt-10 px-5 pb-24 sm:px-8 lg:px-10">
        <div className="mb-9 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-blue-300">One safety layer, three views</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">Designed for the moment it matters.</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-slate-500">A calm citizen experience and an evidence-oriented responder workspace, connected by the same analysis engine.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {capabilities.map((capability) => {
            const Icon = capability.icon;
            return (
              <div key={capability.title} className={`glass-card group relative overflow-hidden rounded-3xl p-6`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${capability.tone} opacity-60 transition-opacity group-hover:opacity-100`} />
                <div className="relative">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08]">
                    <Icon className="h-5 w-5 text-blue-200" />
                  </span>
                  <p className="mt-7 text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">{capability.eyebrow}</p>
                  <h3 className="mt-2 text-xl font-semibold tracking-[-0.025em] text-white">{capability.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{capability.description}</p>
                  <Link href="/citizen" className="focus-ring mt-6 inline-flex items-center gap-2 rounded-lg text-sm font-medium text-blue-300 transition hover:text-blue-200">
                    Explore the portal
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section id="how-it-works" className="relative z-10 mx-auto max-w-7xl scroll-mt-10 px-5 pb-24 sm:px-8 lg:px-10">
        <div className="glass-panel rounded-[2rem] p-6 sm:p-10">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-violet-300">How it works</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">Clarity before panic.</h2>
              <p className="mt-4 max-w-md text-sm leading-7 text-slate-400">Rakshak AI translates complex scam signals into a simple risk score, explains what happened, and makes the next safe action obvious.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {steps.map(([number, title, description]) => (
                <div key={number} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                  <span className="text-xs font-semibold tracking-[0.18em] text-blue-300">{number}</span>
                  <h3 className="mt-6 text-sm font-semibold text-white">{title}</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-16 sm:px-8 lg:px-10">
        <div className="relative overflow-hidden rounded-[2rem] border border-blue-400/20 bg-accent-gradient-soft p-7 sm:p-10">
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="relative flex flex-col justify-between gap-7 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-blue-200">
                <FileWarning className="h-4 w-4" />
                Something feels wrong?
              </div>
              <h2 className="mt-3 max-w-xl text-2xl font-semibold tracking-[-0.035em] text-white sm:text-3xl">Pause. Verify. Then act with confidence.</h2>
            </div>
            <Link href="/citizen" className="focus-ring button-primary inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold">
              Open the citizen portal
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="relative z-10 mx-auto flex max-w-7xl flex-col gap-4 border-t border-white/10 px-5 py-7 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
        <p>Rakshak AI · Digital public safety prototype</p>
        <div className="flex items-center gap-5">
          <span>Built for safer digital India</span>
          <Link href="/command" className="text-slate-400 transition hover:text-white">Responder access</Link>
        </div>
      </footer>
    </main>
  );
}
