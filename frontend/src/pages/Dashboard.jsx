import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getMyAccounts, createAccount, getAccountBalance } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, LogOut, Loader2, X, User, Wallet } from "lucide-react";

export default function Dashboard() {
  const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [revealedBalances, setRevealedBalances] = useState({});
  const [balanceLoading, setBalanceLoading] = useState({});
  const [formData, setFormData] = useState({ name: "", currency: "INR" });

  const balancesByCurrency = useMemo(() => {
    return Object.entries(revealedBalances).reduce((acc, [id, bal]) => {
      const accObj = accounts.find((a) => a._id === id);
      if (accObj?.status === "ACTIVE") {
        acc[accObj.currency] = (acc[accObj.currency] || 0) + bal;
      }
      return acc;
    }, {});
  }, [revealedBalances, accounts]);

  async function fetchAccounts() {
    try {
      setLoading(true);
      const data = await getMyAccounts();
      setAccounts(data.accounts || []);
    } catch (err) {
      toast.error(err.message || "Failed to load accounts");
    } finally {
      setLoading(false);
    }
  }

  async function handleFetchBalance(accountId) {
    setBalanceLoading((prev) => ({ ...prev, [accountId]: true }));
    try {
      const { balance } = await getAccountBalance(accountId);
      setRevealedBalances((prev) => ({ ...prev, [accountId]: balance }));
    } catch (err) {
      toast.error(err.message || "Failed to fetch balance");
    } finally {
      setBalanceLoading((prev) => ({ ...prev, [accountId]: false }));
    }
  }

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/login");
    else if (isAuthenticated) fetchAccounts();
  }, [authLoading, isAuthenticated, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error("Account name is required");

    setIsSubmitting(true);
    try {
      await createAccount(formData);
      toast.success("Account created successfully!");
      setIsModalOpen(false);
      setFormData({ name: "", currency: "INR" });
      fetchAccounts();
    } catch (err) {
      toast.error(err.message || "Failed to create account");
    } finally {
      setIsSubmitting(false);
    }
  }

  function formatBalance(amount, currency) {
    const localeMap = { INR: "en-IN", USD: "en-US", EUR: "de-DE", GBP: "en-GB", CAD: "en-CA" };
    try {
      return new Intl.NumberFormat(localeMap[currency] || "en-US", {
        style: "currency",
        currency
      }).format(amount);
    } catch {
      return `${currency} ${amount.toFixed(2)}`;
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="text-xl font-bold">Bank<span className="text-primary">Flow</span></Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-sm font-medium">
              <User className="h-3.5 w-3.5 text-primary" /> {user?.name}
            </div>
            <Button variant="ghost" size="sm" onClick={() => logout().then(() => navigate("/"))}>
              <LogOut className="mr-1.5 h-4 w-4" /> Logout
            </Button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-10 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {user?.name}</h1>
            <p className="text-muted-foreground">Manage your banking and ledgers.</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}><Plus className="mr-1.5 h-4 w-4" /> Create Account</Button>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row justify-between pb-2">
              <div>
                <CardDescription>Total Managed Accounts</CardDescription>
                <CardTitle className="text-2xl">{accounts.length}</CardTitle>
              </div>
              <Wallet className="h-5 w-5 text-primary" />
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Net Balance Summary</CardDescription>
              {Object.keys(balancesByCurrency).length === 0 ? (
                <p className="text-sm text-muted-foreground mt-2">No active balances.</p>
              ) : (
                Object.entries(balancesByCurrency).map(([curr, sum]) => (
                  <div key={curr} className="flex justify-between text-sm mt-2">
                    <span className="font-medium text-muted-foreground">{curr} Assets</span>
                    <span className="font-bold">{formatBalance(sum, curr)}</span>
                  </div>
                ))
              )}
            </CardHeader>
          </Card>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account._id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{account.name}</CardTitle>
                    <p className="text-xs text-muted-foreground font-mono mt-1">ID: {account._id}</p>
                  </div>
                  <Badge variant={account.status === "ACTIVE" ? "default" : "secondary"}>{account.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {revealedBalances[account._id] !== undefined ? (
                  <span className="text-2xl font-bold">{formatBalance(revealedBalances[account._id], account.currency)}</span>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => handleFetchBalance(account._id)} disabled={balanceLoading[account._id]}>
                    {balanceLoading[account._id] ? <Loader2 className="h-4 w-4 animate-spin" /> : "Show Balance"}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Quick plus card with dotted border and hover animation */}
          <div 
            onClick={() => setIsModalOpen(true)}
            className="flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/60 bg-muted/10 p-6 text-center transition-all duration-300 hover:border-primary/40 hover:bg-muted/20"
          >
            <div className="rounded-full bg-muted p-2.5 mb-2">
              <Plus className="h-5 w-5 text-muted-foreground" />
            </div>
            <span className="font-medium text-sm text-muted-foreground">Add Account</span>
          </div>
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl">
            <div className="flex justify-between mb-4">
              <h3 className="font-semibold text-lg">Create New Account</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}><X /></Button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Label>Account Name</Label>
              <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              <Label>Currency</Label>
              <select className="w-full border rounded p-2" onChange={(e) => setFormData({...formData, currency: e.target.value})}>
                <option value="INR">INR</option><option value="USD">USD</option><option value="EUR">EUR</option>
              </select>
              <Button type="submit" disabled={isSubmitting}>Create Account</Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}