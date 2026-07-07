import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getMyAccounts, createAccount, getAccountBalance, getAccountStatement } from "@/lib/api";
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

  const [statementRecords, setStatementRecords] = useState([]);
  const [statementLoading, setStatementLoading] = useState(false);
  const [isStatementOpen, setIsStatementOpen] = useState(false);
  const [statementAccountId, setStatementAccountId] = useState("");
  const [statementAccountName, setStatementAccountName] = useState("");
  const [statementCurrency, setStatementCurrency] = useState("INR");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  async function handleFetchStatement(accountId, name, currency) {
    setStatementAccountId(accountId);
    setStatementAccountName(name);
    setStatementCurrency(currency);
    setStartDate("");
    setEndDate("");
    setIsStatementOpen(true);
    setStatementLoading(true);
    try {
      const data = await getAccountStatement(accountId);
      setStatementRecords(data.statement || []);
    } catch (err) {
      toast.error(err.message || "Failed to fetch statement");
    } finally {
      setStatementLoading(false);
    }
  }

  const filteredStatementRecords = useMemo(() => {
    return statementRecords.filter((record) => {
      if (!record.date) return false;
      const recordDate = new Date(record.date);
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (recordDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (recordDate > end) return false;
      }
      return true;
    });
  }, [statementRecords, startDate, endDate]);

  function handleExportPDF() {
    const printWindow = window.open("", "_blank");
    const recordsHtml = filteredStatementRecords.map(record => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee; font-family: monospace; font-size: 13px; color: #555;">
          ${record.date ? new Date(record.date).toLocaleString() : "N/A"}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: 600; font-size: 13px; color: ${record.type === 'CREDIT' ? '#10b981' : '#f43f5e'};">
          ${record.type}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; font-size: 13px; color: ${record.type === 'CREDIT' ? '#10b981' : '#f43f5e'};">
          ${record.type === 'CREDIT' ? '+' : '-'}${formatBalance(record.amount, statementCurrency)}
        </td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Statement - ${statementAccountName}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1f2937; }
            .header { margin-bottom: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; }
            .title { font-size: 26px; font-weight: 800; margin: 0; color: #111827; }
            .meta { font-size: 13px; color: #4b5563; margin-top: 6px; }
            table { width: 100%; border-collapse: collapse; margin-top: 24px; }
            th { padding: 12px 10px; border-bottom: 2px solid #e5e7eb; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 700; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Account Statement</div>
            <div class="meta">Account Name: <strong>${statementAccountName}</strong></div>
            <div class="meta">Account ID: <code>${statementAccountId}</code></div>
            <div class="meta">Statement Date: ${new Date().toLocaleString()}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date / Time</th>
                <th>Type</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${recordsHtml}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

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
              <CardContent className="flex items-center justify-between gap-4">
                <div>
                  {revealedBalances[account._id] !== undefined ? (
                    <span className="text-2xl font-bold">{formatBalance(revealedBalances[account._id], account.currency)}</span>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => handleFetchBalance(account._id)} disabled={balanceLoading[account._id]}>
                      {balanceLoading[account._id] ? <Loader2 className="h-4 w-4 animate-spin" /> : "Show Balance"}
                    </Button>
                  )}
                </div>
                <Button size="sm" variant="outline" onClick={() => handleFetchStatement(account._id, account.name, account.currency)}>
                  Statement
                </Button>
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

      {isStatementOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-xl bg-card p-6 shadow-xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <div>
                <h3 className="font-semibold text-lg">{statementAccountName} - Statement</h3>
                <p className="text-xs text-muted-foreground font-mono">Account ID: {statementAccountId}</p>
              </div>
              <div className="flex items-center gap-2">
                {statementRecords.length > 0 && (
                  <Button size="sm" variant="outline" onClick={handleExportPDF}>
                    Export PDF
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => setIsStatementOpen(false)}><X /></Button>
              </div>
            </div>
            
            {statementRecords.length > 0 && (
              <div className="flex gap-4 items-center mb-4 bg-muted/40 p-3 rounded-lg text-sm flex-wrap">
                <div className="flex items-center gap-2">
                  <label htmlFor="start-date" className="text-xs text-muted-foreground uppercase font-bold">From</label>
                  <input
                    id="start-date"
                    type="date"
                    className="border bg-background rounded px-2.5 py-1 text-xs"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="end-date" className="text-xs text-muted-foreground uppercase font-bold">To</label>
                  <input
                    id="end-date"
                    type="date"
                    className="border bg-background rounded px-2.5 py-1 text-xs"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                {(startDate || endDate) && (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-xs text-rose-500 h-7 px-2 hover:bg-rose-500/10 hover:text-rose-600"
                    onClick={() => { setStartDate(""); setEndDate(""); }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            )}

            <div className="flex-1 overflow-y-auto min-h-[250px] pr-1">
              {statementLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : statementRecords.length === 0 ? (
                <p className="text-center text-muted-foreground py-16 text-sm">No ledger transactions found for this account.</p>
              ) : filteredStatementRecords.length === 0 ? (
                <p className="text-center text-muted-foreground py-16 text-sm">No ledger transactions found for the selected date range.</p>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-muted/50 border-b text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                        <th className="p-3">Date</th>
                        <th className="p-3">Type</th>
                        <th className="p-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-sm">
                      {filteredStatementRecords.map((record) => (
                        <tr key={record._id} className="hover:bg-muted/10">
                          <td className="p-3 text-muted-foreground text-xs font-mono">
                            {record.date ? new Date(record.date).toLocaleString() : "N/A"}
                          </td>
                          <td className="p-3">
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                              record.type === 'CREDIT' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                            }`}>
                              {record.type}
                            </span>
                          </td>
                          <td className={`p-3 text-right font-semibold ${
                            record.type === 'CREDIT' ? 'text-emerald-500' : 'text-rose-500'
                          }`}>
                            {record.type === 'CREDIT' ? '+' : '-'}{formatBalance(record.amount, statementCurrency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}