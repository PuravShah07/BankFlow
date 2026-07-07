import { Link } from "react-router-dom";
import {
  Shield,
  ArrowRightLeft,
  Activity,
  KeyRound,
  Lock,
  Mail,
  ArrowRight,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";



const FEATURES = [
  {
    icon: Shield,
    title: "Immutable Ledger",
    description:
      "Every transaction is permanently recorded. No edits, no deletions — complete financial auditability.",
  },
  {
    icon: ArrowRightLeft,
    title: "ACID Transactions",
    description:
      "Atomic transfers powered by MongoDB sessions. If one side fails, the entire transaction rolls back.",
  },
  {
    icon: Activity,
    title: "Dynamic Balance",
    description:
      "Your balance is computed in real-time from the ledger. No stale data, no race conditions.",
  },
  {
    icon: KeyRound,
    title: "Idempotent Transfers",
    description:
      "Client-generated idempotency keys ensure no duplicate charges — even on network retries.",
  },
  {
    icon: Lock,
    title: "Account Security",
    description:
      "Accounts support Active, Freeze, and Closed states. Protected by JWT-based authentication.",
  },
  {
    icon: Mail,
    title: "Email Receipts",
    description:
      "Instant email confirmations on every successful transaction, delivered automatically.",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Sign Up",
    description: "Create your account in under a minute with just an email and password.",
  },
  {
    number: "02",
    title: "Open an Account",
    description: "Set up your banking account instantly. It's activated and ready to go.",
  },
  {
    number: "03",
    title: "Transfer Funds",
    description: "Send money between accounts with ACID guarantees and full transparency.",
  },
];

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Logo */}
        <Link to="/" className="text-xl font-bold tracking-tight text-foreground">
          Bank<span className="text-primary">Flow</span>
        </Link>

        {/* Auth actions */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-muted-foreground">
                {user?.name || user?.email}
              </span>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="mr-1 h-4 w-4" /> Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/register">
                  Sign Up <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

/** Hero section with gradient mesh background */
function Hero() {
  return (
    <section className="relative flex min-h-[90vh] items-center justify-center overflow-hidden px-6 pt-16">
      {/* Gradient mesh — pure CSS, no images */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.07] blur-2xl" />
      </div>

      <div className="mx-auto max-w-3xl text-center">
        <p className="mb-4 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Banking Ledger System
        </p>
        <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl md:text-6xl">
          Your Money. Your Ledger.{" "}
          <span className="text-primary">Fully Transparent.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
          An immutable, double-entry ledger that records every financial
          movement. No hidden fees, no data tampering — just honest banking.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Button size="lg" asChild>
            <Link to="/register">
              Open Free Account <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <a href="#features">Learn More</a>
          </Button>
        </div>
      </div>
    </section>
  );
}

/** Feature cards grid — 6 core capabilities */
function Features() {
  return (
    <section id="features" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        {/* Section heading */}
        <div className="mb-16 text-center">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-primary">
            Core Features
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Built for reliability
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Every feature is designed around financial integrity — from
            immutable records to atomic transactions.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}

/** Individual feature card */
function FeatureCard({ icon: Icon, title, description }) {
  return (
    <Card className="group transition-all duration-300 hover:shadow-lg hover:border-primary/20">
      <CardHeader>
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          <Icon className="h-5 w-5" />
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription className="text-sm leading-relaxed">
          {description}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

/** How it works — 3 numbered steps */
function HowItWorks() {
  return (
    <section className="border-t border-border/50 bg-muted/30 px-6 py-24">
      <div className="mx-auto max-w-4xl">
        {/* Section heading */}
        <div className="mb-16 text-center">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-primary">
            How It Works
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Three steps to get started
          </h2>
        </div>

        {/* Steps */}
        <div className="relative grid gap-12 md:grid-cols-3 md:gap-8">
          {/* Connecting line (desktop only) */}
          <div className="absolute top-8 left-[16.67%] right-[16.67%] hidden h-px bg-border md:block" />

          {STEPS.map((step) => (
            <div key={step.number} className="relative text-center">
              {/* Step number circle */}
              <div className="relative z-10 mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary bg-background text-lg font-bold text-primary">
                {step.number}
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Full-width CTA banner */
function CtaBanner() {
  return (
    <section className="px-6 py-24">
      <div className="relative mx-auto max-w-4xl overflow-hidden rounded-2xl bg-primary px-8 py-16 text-center text-primary-foreground sm:px-16">
        {/* Subtle gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />

        <h2 className="relative text-3xl font-bold tracking-tight sm:text-4xl">
          Start managing your finances with confidence
        </h2>
        <p className="relative mx-auto mt-4 max-w-xl text-primary-foreground/80">
          Join BankFlow and experience banking that is fully transparent,
          immutable, and built on real accounting principles.
        </p>
        <Button
          size="lg"
          variant="secondary"
          className="relative mt-8"
          asChild
        >
          <Link to="/register">
            Create Account <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}

/** Minimal footer */
function Footer() {
  return (
    <footer className="border-t border-border/50 px-6 py-8">
      <div className="mx-auto max-w-6xl text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} BankFlow. Built with transparency in mind.
      </div>
    </footer>
  );
}


export default function Landing() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
}
