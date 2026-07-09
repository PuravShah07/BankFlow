import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BlurFade } from "@/components/ui/blur-fade";
import { Logo } from "@/components/ui/logo";

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

  const userInitials = user?.name
    ? user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
          <Logo className="h-8 w-8" />
          <span>Bank<span className="text-primary">Flow</span></span>
        </Link>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Button size="sm" asChild className="mr-1">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 px-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{userInitials}</AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline">{user?.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">{user?.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/register">
                  Sign Up <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
      <Separator />
    </nav>
  );
}

function Hero() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="relative flex min-h-[90vh] items-center justify-center overflow-hidden px-6 pt-16">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.07] blur-2xl" />
      </div>

      <div className="mx-auto max-w-3xl text-center">
        <BlurFade delay={0.1}>
          <Badge variant="secondary" className="mb-4 text-xs uppercase tracking-widest">
            Banking Ledger System
          </Badge>
        </BlurFade>
        <BlurFade delay={0.2}>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Your Money. Your Ledger.{" "}
            <span className="text-primary">Fully Transparent.</span>
          </h1>
        </BlurFade>
        <BlurFade delay={0.3}>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            An immutable, double-entry ledger that records every financial
            movement. No hidden fees, no data tampering — just honest banking.
          </p>
        </BlurFade>
        <BlurFade delay={0.4}>
          <div className="mt-10 flex items-center justify-center gap-4">
            {isAuthenticated ? (
              <Button size="lg" asChild>
                <Link to="/dashboard">
                  Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button size="lg" asChild>
                <Link to="/register">
                  Open Free Account <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
            <Button variant="outline" size="lg" asChild>
              <a href="#features">Learn More</a>
            </Button>
          </div>
        </BlurFade>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <BlurFade delay={0.1}>
            <Badge variant="outline" className="mb-2 text-xs uppercase tracking-widest text-primary">
              Core Features
            </Badge>
          </BlurFade>
          <BlurFade delay={0.2}>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Built for reliability
            </h2>
          </BlurFade>
          <BlurFade delay={0.3}>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Every feature is designed around financial integrity — from
              immutable records to atomic transactions.
            </p>
          </BlurFade>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, idx) => (
            <BlurFade key={feature.title} delay={0.1 + idx * 0.1}>
              <Card className="group transition-all duration-300 hover:shadow-lg hover:border-primary/20 h-full">
                <CardHeader>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </BlurFade>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="bg-muted/30 px-6 py-24">
      <Separator className="mb-24" />
      <div className="mx-auto max-w-4xl">
        <div className="mb-16 text-center">
          <BlurFade delay={0.1}>
            <Badge variant="outline" className="mb-2 text-xs uppercase tracking-widest text-primary">
              How It Works
            </Badge>
          </BlurFade>
          <BlurFade delay={0.2}>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Three steps to get started
            </h2>
          </BlurFade>
        </div>

        <div className="relative grid gap-12 md:grid-cols-3 md:gap-8">
          <Separator className="absolute top-8 left-[16.67%] right-[16.67%] hidden md:block" orientation="horizontal" />

          {STEPS.map((step, idx) => (
            <BlurFade key={step.number} delay={0.1 + idx * 0.15}>
              <div className="relative text-center">
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
            </BlurFade>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaBanner() {
  return (
    <section className="px-6 py-24">
      <BlurFade delay={0.2}>
        <Card className="relative mx-auto max-w-4xl overflow-hidden bg-primary px-8 py-16 text-center text-primary-foreground sm:px-16 border-0">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />

          <h2 className="relative text-3xl font-bold tracking-tight sm:text-4xl">
            Start managing your finances with confidence
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-primary-foreground/80">
            Join BankFlow and experience banking that is fully transparent,
            immutable, and built on real accounting principles.
          </p>
          <div className="relative mt-8 flex justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/register">
                Create Account <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Card>
      </BlurFade>
    </section>
  );
}

function Footer() {
  return (
    <footer className="px-6 py-8">
      <Separator className="mb-8" />
      <div className="mx-auto max-w-6xl text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} BankFlow. Built with transparency in mind.
      </div>
    </footer>
  );
}


export default function Landing() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isLoading, isAuthenticated, navigate]);

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
