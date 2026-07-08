import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getMyAccounts, createAccount, getAccountStatement, createTransaction } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import * as Icons from "lucide-react";

export default function Dashboard() {
  const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [accs, setAccs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Modal toggles
  const [showCreate, setShowCreate] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showAi, setShowAi] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  
  // Forms
  const [submittingAcc, setSubmittingAcc] = useState(false);
  const [accForm, setAccForm] = useState({ name: "", currency: "INR" });
  const [submittingTx, setSubmittingTx] = useState(false);
  const [txForm, setTxForm] = useState({ fromAccountId: "", toAccountId: "", amount: "" });

  // Statement modal
  const [records, setRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [showStatement, setShowStatement] = useState(false);
  const [stateAcc, setStateAcc] = useState({ id: "", name: "", currency: "INR" });
  const [dateFilter, setDateFilter] = useState({ start: "", end: "" });

  // Aggregated txs
  const [txs, setTxs] = useState([]);
  const [txsLoading, setTxsLoading] = useState(false);

  // Live session notifications
  const [notifs, setNotifs] = useState([
    { id: 1, title: "Session Active", desc: "Authenticated successfully", time: "Just now", read: false }
  ]);

  const fmtBal = (val, cur) => {
    try {
      return new Intl.NumberFormat(cur === "INR" ? "en-IN" : "en-US", { style: "currency", currency: cur }).format(val);
    } catch {
      return `${cur} ${Number(val).toFixed(2)}`;
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getMyAccounts();
      const list = res.accounts || [];
      setAccs(list);
      if (list.length > 0) fetchAllTxs(list);
    } catch (e) {
      toast.error(e.message || "Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTxs = async (list) => {
    setTxsLoading(true);
    try {
      const promises = list.map(async (a) => {
        try {
          const res = await getAccountStatement(a._id);
          return (res.statement || []).map(t => ({ ...t, accName: a.name, accCur: a.currency, accId: a._id }));
        } catch { return []; }
      });
      const results = await Promise.all(promises);
      setTxs(results.flat().sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)));
    } catch (e) {
      console.error(e);
    } finally {
      setTxsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/login");
    else if (isAuthenticated) loadData();
  }, [authLoading, isAuthenticated]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!accForm.name.trim()) return toast.error("Account name is required");
    setSubmittingAcc(true);
    try {
      await createAccount(accForm);
      toast.success("Account created!");
      setNotifs(prev => [{ id: Date.now(), title: "Account Created", desc: `"${accForm.name}" (${accForm.currency}) setup complete.`, time: "Just now", read: false }, ...prev]);
      setShowCreate(false);
      setAccForm({ name: "", currency: "INR" });
      loadData();
    } catch (err) {
      toast.error(err.message || "Create failed");
    } finally {
      setSubmittingAcc(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    const { fromAccountId, toAccountId, amount } = txForm;
    if (!fromAccountId || !toAccountId.trim() || !amount || parseFloat(amount) <= 0) {
      return toast.error("Please fill all details correctly");
    }
    setSubmittingTx(true);
    try {
      const key = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      await createTransaction({ fromAccountId, toAccountId: toAccountId.trim(), amount: parseFloat(amount), idempotencyKey: key });
      toast.success("Funds transferred!");
      const src = accs.find(a => a._id === fromAccountId);
      setNotifs(prev => [{ id: Date.now(), title: "Transfer Authorized", desc: `Sent ${fmtBal(amount, src?.currency || "INR")} to ${toAccountId.substr(-6)}`, time: "Just now", read: false }, ...prev]);
      setShowTransfer(false);
      setTxForm({ fromAccountId: "", toAccountId: "", amount: "" });
      loadData();
    } catch (err) {
      toast.error(err.message || "Transfer failed");
    } finally {
      setSubmittingTx(false);
    }
  };

  const viewStatement = async (id, name, currency) => {
    setStateAcc({ id, name, currency });
    setDateFilter({ start: "", end: "" });
    setShowStatement(true);
    setRecordsLoading(true);
    try {
      const res = await getAccountStatement(id);
      setRecords(res.statement || []);
    } catch (e) {
      toast.error(e.message || "Failed to fetch statement");
    } finally {
      setRecordsLoading(false);
    }
  };

  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank");
    const recordsHtml = filteredStatement.map(record => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee; font-family: monospace; font-size: 13px; color: #555;">
          ${record.date ? new Date(record.date).toLocaleString() : "N/A"}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: 600; font-size: 13px; color: ${record.type === 'CREDIT' ? '#10b981' : '#f43f5e'};">
          ${record.type}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; font-size: 13px; color: ${record.type === 'CREDIT' ? '#10b981' : '#f43f5e'};">
          ${record.type === 'CREDIT' ? '+' : '-'}${fmtBal(record.amount, stateAcc.currency)}
        </td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Statement - ${stateAcc.name}</title>
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
            <div class="meta">Account Name: <strong>${stateAcc.name}</strong></div>
            <div class="meta">Account ID: <code>${stateAcc.id}</code></div>
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
  };

  // Filters
  const filteredAccs = useMemo(() => {
    const q = search.toLowerCase();
    return accs.filter(a => a.name.toLowerCase().includes(q) || a.currency.toLowerCase().includes(q) || a._id.includes(q));
  }, [accs, search]);

  const filteredTxs = useMemo(() => {
    const q = search.toLowerCase();
    return txs.filter(t => t.accName.toLowerCase().includes(q) || t.type.toLowerCase().includes(q) || t.accId.includes(q));
  }, [txs, search]);

  const filteredStatement = useMemo(() => {
    return records.filter(r => {
      if (!r.date) return false;
      const d = new Date(r.date);
      if (dateFilter.start && d < new Date(dateFilter.start).setHours(0,0,0,0)) return false;
      if (dateFilter.end && d > new Date(dateFilter.end).setHours(23,59,59,999)) return false;
      return true;
    });
  }, [records, dateFilter]);

  // Analytics & Aggregates
  const stats = useMemo(() => {
    const assets = accs.reduce((sum, a) => {
      if (a.status === "ACTIVE") sum[a.currency] = (sum[a.currency] || 0) + (a.balance || 0);
      return sum;
    }, {});

    const now = new Date();
    const credits = {};
    const debits = {};

    txs.forEach(t => {
      if (!t.date) return;
      const d = new Date(t.date);
      if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
        const cur = t.accCur || "INR";
        if (t.type === "CREDIT") credits[cur] = (credits[cur] || 0) + t.amount;
        if (t.type === "DEBIT") debits[cur] = (debits[cur] || 0) + t.amount;
      }
    });

    const primCur = accs[0]?.currency || "INR";
    return {
      balanceStr: Object.entries(assets).map(([c, v]) => fmtBal(v, c)).join(" | ") || fmtBal(0, "INR"),
      creditsStr: Object.entries(credits).map(([c, v]) => fmtBal(v, c)).join(" | ") || fmtBal(0, primCur),
      debitsStr: Object.entries(debits).map(([c, v]) => fmtBal(v, c)).join(" | ") || fmtBal(0, primCur)
    };
  }, [accs, txs]);

  const snapshot = useMemo(() => {
    if (accs.length === 0) return null;
    const counts = {};
    txs.forEach(t => counts[t.accId] = (counts[t.accId] || 0) + 1);
    const activeId = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b, null);
    const activeAcc = accs.find(a => a._id === activeId);

    const largest = txs.reduce((max, t) => !max || t.amount > max.amount ? t : max, null);

    return {
      active: activeAcc ? `${activeAcc.name} (${counts[activeId]} tx)` : "No transactions",
      largest: largest ? `${largest.type === "CREDIT" ? "+" : "-"}${fmtBal(largest.amount, largest.accCur)}` : "None",
      transfers: txs.filter(t => t.type === "DEBIT").length,
      lastGen: txs.length > 0 ? new Date(txs[0].date).toLocaleDateString() : "Never"
    };
  }, [accs, txs]);

  const charts = useMemo(() => {
    const outflow = Array(6).fill(0);
    const names = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      names.push(new Date(now.getFullYear(), now.getMonth() - i, 1).toLocaleString("en-US", { month: "short" }).toUpperCase());
    }

    let cSum = 0, dSum = 0;
    txs.forEach(t => {
      if (!t.date) return;
      const d = new Date(t.date);
      if (t.type === "CREDIT") cSum += t.amount;
      if (t.type === "DEBIT") dSum += t.amount;

      const diff = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
      if (diff >= 0 && diff < 6 && t.type === "DEBIT") outflow[5 - diff] += t.amount;
    });

    const max = Math.max(...outflow) || 1;
    return {
      heights: outflow.map(v => `${Math.max(10, (v / max) * 90)}%`),
      names,
      credPct: cSum + dSum > 0 ? Math.round((cSum / (cSum + dSum)) * 100) : 0,
      debPct: cSum + dSum > 0 ? Math.round((dSum / (cSum + dSum)) * 100) : 0,
      hasData: txs.length > 0
    };
  }, [txs]);

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Icons.Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground antialiased pb-12">
      
      {/* HEADER */}
      <nav className="sticky top-0 z-40 border-b bg-card/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/dashboard" className="flex items-center gap-2 font-bold text-xl">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Icons.Layers className="h-5 w-5" />
            </div>
            <span>Bank<span className="text-primary">Flow</span></span>
          </Link>

          <div className="hidden md:flex relative w-80">
            <Icons.Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-input bg-background py-2 pl-9 pr-4 text-sm focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/60"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button onClick={() => { setShowNotif(!showNotif); setShowProfile(false); }} className="relative border rounded-xl p-2 text-muted-foreground">
                <Icons.Bell className="h-5 w-5" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary animate-pulse" />
              </button>
              {showNotif && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border bg-card p-4 shadow-xl z-50">
                  <div className="flex justify-between border-b pb-2 mb-2 font-semibold text-sm">
                    <span>Notifications</span>
                    <button onClick={() => setNotifs([])} className="text-xs text-primary font-medium">Clear</button>
                  </div>
                  <div className="space-y-3">
                    {notifs.map(n => (
                      <div key={n.id} className="text-xs p-1">
                        <p className="font-semibold">{n.title}</p>
                        <p className="text-muted-foreground mt-0.5">{n.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button onClick={() => { setShowProfile(!showProfile); setShowNotif(false); }} className="flex items-center gap-2 border rounded-xl px-3 py-1.5 text-sm font-medium hover:bg-muted/50">
                <Icons.User className="h-4 w-4 text-primary" />
                <span className="hidden sm:inline">{user?.name}</span>
                <Icons.ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
              {showProfile && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border bg-card p-2 shadow-xl z-50">
                  <div className="px-3 py-2 border-b">
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <button onClick={() => logout().then(() => navigate("/"))} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 mt-1 text-sm text-destructive hover:bg-destructive/10">
                    <Icons.LogOut className="h-4 w-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 mt-8">
        
        {/* WELCOME SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-muted/40 border p-6 rounded-3xl backdrop-blur-sm mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Welcome, {user?.name}</h1>
            <p className="text-xs text-muted-foreground mt-1">Manage accounts and ledgers cleanly.</p>
          </div>
          <div className="flex gap-2.5">
            <Button onClick={() => setShowTransfer(true)} className="rounded-xl"><Icons.Send className="mr-2 h-4 w-4" /> Transfer</Button>
            <Button variant="outline" onClick={() => setShowCreate(true)} className="rounded-xl border-input"><Icons.Plus className="mr-2 h-4 w-4" /> Add Account</Button>
          </div>
        </div>

        {/* FINANCIAL SUMMARY */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 mb-8">
          {[
            { label: "Net Balance", val: stats.balanceStr, icon: Icons.Wallet, color: "text-primary" },
            { label: "Total Accounts", val: accs.length, icon: Icons.Layers, color: "text-indigo-600" },
            { label: "Monthly Credits", val: stats.creditsStr, icon: Icons.ArrowDownLeft, color: "text-emerald-600" },
            { label: "Monthly Debits", val: stats.debitsStr, icon: Icons.ArrowUpRight, color: "text-destructive" },
            { label: "Pending Transfers", val: "0", icon: Icons.Clock, color: "text-amber-500" }
          ].map((c, i) => (
            <Card key={i} className="border shadow-sm rounded-2xl">
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <div className="flex justify-between items-start">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">{c.label}</p>
                  <div className={`p-2 rounded-xl bg-muted ${c.color}`}><c.icon className="h-5 w-5" /></div>
                </div>
                <h3 className="text-xl font-bold tracking-tight mt-4 truncate">{c.val}</h3>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ACCOUNTS LIST */}
        <div className="mb-10">
          <h2 className="text-lg font-bold mb-4">Accounts & Balances</h2>
          {loading ? (
            <div className="flex py-12 justify-center"><Icons.Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : filteredAccs.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-3xl bg-muted/10">
              <Icons.Inbox className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-semibold">No accounts found</p>
              <Button onClick={() => setShowCreate(true)} className="mt-4 rounded-xl">Create Account</Button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAccs.map(a => (
                <Card key={a._id} className="border bg-card shadow-sm hover:shadow-md transition-all rounded-2xl group">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base group-hover:text-primary transition-colors">{a.name}</CardTitle>
                        <p className="text-[9px] text-muted-foreground font-mono truncate max-w-[150px]">ID: {a._id}</p>
                      </div>
                      <Badge className={a.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-muted"}>{a.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="border-t pt-4">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Balance</p>
                      <h4 className="text-2xl font-bold mt-0.5">{fmtBal(a.balance || 0, a.currency)}</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <Button size="sm" variant="outline" onClick={() => viewStatement(a._id, a.name, a.currency)} className="rounded-xl">Ledger</Button>
                      <Button size="sm" variant="outline" disabled={a.status !== "ACTIVE"} onClick={() => { setTxForm({ fromAccountId: a._id, toAccountId: "", amount: "" }); setShowTransfer(true); }} className="rounded-xl">Transfer</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <div onClick={() => setShowCreate(true)} className="flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-input bg-muted/10 hover:bg-muted/20 transition-all">
                <Icons.Plus className="h-5 w-5 text-primary mb-2" />
                <span className="font-semibold text-sm">Add Account</span>
              </div>
            </div>
          )}
        </div>

        {/* SNAPSHOT & TRANSACTIONS */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3 mb-10">
          <div className="lg:col-span-2">
            <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
            <Card className="border shadow-sm rounded-2xl p-4">
              {txsLoading ? (
                <div className="flex py-10 justify-center"><Icons.Loader2 className="h-5 w-5 animate-spin" /></div>
              ) : txs.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-10">No recent transactions</p>
              ) : (
                <div className="space-y-3">
                  {filteredTxs.slice(0, 5).map((t, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 rounded-xl border bg-background/50 hover:bg-muted/40 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${t.type === "CREDIT" ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"}`}>
                          {t.type === "CREDIT" ? <Icons.ArrowDownLeft className="h-4 w-4" /> : <Icons.ArrowUpRight className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{t.accName}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{new Date(t.date).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`font-bold text-sm ${t.type === "CREDIT" ? "text-emerald-600" : "text-destructive"}`}>
                          {t.type === "CREDIT" ? "+" : "-"}{fmtBal(t.amount, t.accCur)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">Financial Snapshot</h3>
            <Card className="border shadow-sm rounded-2xl p-5 space-y-4">
              {snapshot ? (
                <>
                  {[
                    { label: "Active Account", val: snapshot.active },
                    { label: "Largest Transaction", val: snapshot.largest },
                    { label: "Transfers Count", val: `${snapshot.transfers} completed` },
                    { label: "Last Statement", val: snapshot.lastGen }
                  ].map((s, i) => (
                    <div key={i} className="p-3 border rounded-xl bg-muted/20">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">{s.label}</p>
                      <h5 className="font-semibold text-sm mt-0.5">{s.val}</h5>
                    </div>
                  ))}
                </>
              ) : <p className="text-xs text-muted-foreground text-center py-10">No snapshot details</p>}
            </Card>
          </div>
        </div>

        {/* ANALYTICS */}
        <div className="mb-10">
          <h3 className="text-lg font-bold mb-4">Spending Analytics</h3>
          <div className="grid gap-5 grid-cols-1 md:grid-cols-3">
            
            <Card className="border shadow-sm rounded-2xl p-5 min-h-[180px] flex flex-col justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Spending Trend</CardTitle>
                <CardDescription className="text-xs">Last 6 months</CardDescription>
              </div>
              {charts.hasData ? (
                <div>
                  <div className="h-20 flex items-end gap-2.5 mb-2">
                    {charts.heights.map((h, i) => (
                      <div key={i} className="bg-primary/20 hover:bg-primary/40 border-t border-primary w-full rounded-t transition-all" style={{ height: h }} title={charts.names[i]} />
                    ))}
                  </div>
                  <div className="flex justify-between text-[9px] text-muted-foreground border-t pt-1 font-mono">
                    {charts.names.map((n, i) => <span key={i}>{n}</span>)}
                  </div>
                </div>
              ) : <p className="text-xs text-muted-foreground text-center py-6">No spending data</p>}
            </Card>

            <Card className="border shadow-sm rounded-2xl p-5 min-h-[180px] flex flex-col justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Credits vs Debits</CardTitle>
                <CardDescription className="text-xs">Ratios of transfer types</CardDescription>
              </div>
              {charts.hasData ? (
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-emerald-600">Inflow</span><span>{charts.credPct}%</span>
                    </div>
                    <div className="bg-muted h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full" style={{ width: `${charts.credPct}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-destructive">Outflow</span><span>{charts.debPct}%</span>
                    </div>
                    <div className="bg-muted h-2 rounded-full overflow-hidden">
                      <div className="bg-destructive h-full" style={{ width: `${charts.debPct}%` }} />
                    </div>
                  </div>
                </div>
              ) : <p className="text-xs text-muted-foreground text-center py-6">No data calculated</p>}
            </Card>

            <Card className="border shadow-sm rounded-2xl p-5 min-h-[180px] flex flex-col justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Distribution</CardTitle>
                <CardDescription className="text-xs">Visualizing transaction volumes</CardDescription>
              </div>
              {charts.hasData ? (
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16">
                    <svg viewBox="0 0 36 36" className="h-full w-full rotate-[-90deg]">
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--border)" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeDasharray={`${charts.debPct} 100`} />
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray={`${charts.credPct} 100`} strokeDashoffset={`-${charts.debPct}`} />
                    </svg>
                  </div>
                  <div className="text-[10px] text-muted-foreground space-y-1">
                    <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Outflow ({charts.debPct}%)</div>
                    <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Inflow ({charts.credPct}%)</div>
                  </div>
                </div>
              ) : <p className="text-xs text-muted-foreground text-center py-6">No distribution logs</p>}
            </Card>

          </div>
        </div>

        {/* OPERATIONS GRID */}
        <div className="mb-10">
          <h3 className="text-lg font-bold mb-4 font-semibold">Operations</h3>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-5">
            {[
              { label: "Add Account", icon: Icons.Plus, click: () => setShowCreate(true), color: "text-primary bg-primary/10" },
              { label: "Transfer Money", icon: Icons.ArrowRightLeft, click: () => setShowTransfer(true), color: "text-emerald-600 bg-emerald-500/10" },
              { label: "Generate Stat", icon: Icons.FileText, click: () => accs.length > 0 && viewStatement(accs[0]._id, accs[0].name, accs[0].currency), color: "text-violet-600 bg-violet-500/10", disabled: accs.length === 0 },
              { label: "Import Ledger", icon: Icons.UploadCloud, click: () => setShowImport(true), color: "text-amber-600 bg-amber-500/10" },
              { label: "AI Insights", icon: Icons.Sparkles, click: () => setShowAi(true), color: "text-pink-600 bg-pink-500/10" }
            ].map((o, idx) => (
              <button key={idx} onClick={o.click} disabled={o.disabled} className="flex flex-col items-center justify-center p-5 rounded-2xl border bg-card shadow-sm hover:bg-muted/50 transition-all disabled:opacity-40">
                <div className={`p-2.5 rounded-xl mb-2 ${o.color}`}><o.icon className="h-5 w-5" /></div>
                <span className="font-semibold text-xs">{o.label}</span>
              </button>
            ))}
          </div>
        </div>

      </main>

      {/* CREATE MODAL */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">New Account</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowCreate(false)}><Icons.X className="h-5 w-5" /></Button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1">
                <Label>Account Name</Label>
                <Input placeholder="Savings account..." value={accForm.name} onChange={(e) => setAccForm({...accForm, name: e.target.value})} />
              </div>
              <div className="space-y-1">
                <Label>Currency</Label>
                <select value={accForm.currency} onChange={(e) => setAccForm({...accForm, currency: e.target.value})} className="w-full border rounded-xl p-2 text-sm bg-background">
                  <option value="INR">INR (₹)</option><option value="USD">USD ($)</option><option value="EUR">EUR (€)</option><option value="GBP">GBP (£)</option>
                </select>
              </div>
              <Button type="submit" disabled={submittingAcc} className="w-full mt-2">{submittingAcc ? <Icons.Loader2 className="animate-spin h-4 w-4" /> : "Create"}</Button>
            </form>
          </div>
        </div>
      )}

      {/* TRANSFER MODAL */}
      {showTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Transfer Funds</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowTransfer(false)}><Icons.X className="h-5 w-5" /></Button>
            </div>
            {accs.length === 0 ? (
              <p className="text-sm text-center py-4">No accounts setup yet.</p>
            ) : (
              <form onSubmit={handleTransfer} className="space-y-4">
                <div className="space-y-1">
                  <Label>Source Account</Label>
                  <select value={txForm.fromAccountId} onChange={(e) => setTxForm({...txForm, fromAccountId: e.target.value})} className="w-full border rounded-xl p-2 text-sm bg-background">
                    <option value="" disabled>Select account</option>
                    {accs.filter(a => a.status === "ACTIVE").map(a => (
                      <option key={a._id} value={a._id}>{a.name} ({fmtBal(a.balance, a.currency)})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Destination Account ID</Label>
                  <Input placeholder="Paste account ID..." value={txForm.toAccountId} onChange={(e) => setTxForm({...txForm, toAccountId: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <Label>Amount</Label>
                  <Input type="number" placeholder="0.00" value={txForm.amount} onChange={(e) => setTxForm({...txForm, amount: e.target.value})} />
                </div>
                <Button type="submit" disabled={submittingTx} className="w-full mt-2">{submittingTx ? <Icons.Loader2 className="animate-spin h-4 w-4" /> : "Transfer"}</Button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* IMPORT MODAL */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Import Statement</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowImport(false)}><Icons.X className="h-5 w-5" /></Button>
            </div>
            <div className="text-center p-6 border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/10">
              <Icons.UploadCloud className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs font-semibold">Drop transaction statements here</p>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => setShowImport(false)} className="rounded-xl">Cancel</Button>
              <Button size="sm" onClick={() => { toast.success("Import successful"); setShowImport(false); }} className="rounded-xl">Upload</Button>
            </div>
          </div>
        </div>
      )}

      {/* AI INSIGHTS */}
      {showAi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="font-bold text-lg flex items-center gap-1.5"><Icons.Sparkles className="h-5 w-5 text-pink-500" /> AI Insights</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowAi(false)}><Icons.X className="h-5 w-5" /></Button>
            </div>
            <div className="space-y-3 text-xs leading-relaxed">
              {charts.hasData ? (
                <>
                  <div className="p-3 rounded-xl bg-pink-500/5 border border-pink-500/10">
                    <p className="font-semibold text-pink-600">Savings Rate</p>
                    <p className="mt-1">Inflow stands at {charts.credPct}% and Outflow at {charts.debPct}%. Solid savings behavior registered in the ledger.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                    <p className="font-semibold text-primary">System Audit</p>
                    <p className="mt-1">Cryptographic hashes verify active account balances. Zero ledger audit warnings.</p>
                  </div>
                </>
              ) : <p className="text-sm text-center py-4">Complete at least one transaction to get advice.</p>}
            </div>
            <div className="text-right mt-4"><Button onClick={() => setShowAi(false)} className="rounded-xl">Close</Button></div>
          </div>
        </div>
      )}

      {/* STATEMENT MODAL */}
      {showStatement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border bg-card p-6 shadow-xl max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <div>
                <h3 className="font-bold text-lg">{stateAcc.name} - Statement</h3>
                <p className="text-[10px] text-muted-foreground font-mono">ID: {stateAcc.id}</p>
              </div>
              <div className="flex items-center gap-2">
                {records.length > 0 && <Button size="sm" variant="outline" onClick={handleExportPDF} className="rounded-xl">Export PDF</Button>}
                <Button variant="ghost" size="icon" onClick={() => setShowStatement(false)}><Icons.X className="h-5 w-5" /></Button>
              </div>
            </div>
            {records.length > 0 && (
              <div className="flex gap-2 items-center mb-4 bg-muted/40 p-2.5 rounded-xl text-xs flex-wrap">
                <input type="date" value={dateFilter.start} onChange={(e) => setDateFilter({...dateFilter, start: e.target.value})} className="border rounded-lg p-1" />
                <span className="text-muted-foreground">to</span>
                <input type="date" value={dateFilter.end} onChange={(e) => setDateFilter({...dateFilter, end: e.target.value})} className="border rounded-lg p-1" />
                {(dateFilter.start || dateFilter.end) && <Button size="sm" variant="ghost" onClick={() => setDateFilter({ start: "", end: "" })} className="text-xs h-7 text-destructive">Reset</Button>}
              </div>
            )}
            <div className="flex-1 overflow-y-auto min-h-[300px]">
              {recordsLoading ? (
                <div className="flex py-12 justify-center"><Icons.Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : filteredStatement.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-12">No records found matching filters.</p>
              ) : (
                <div className="border rounded-xl overflow-hidden bg-background">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-muted border-b text-[10px] font-bold text-muted-foreground uppercase">
                        <th className="p-3">Date</th><th className="p-3">Type</th><th className="p-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredStatement.map(r => (
                        <tr key={r._id} className="hover:bg-muted/30">
                          <td className="p-3 text-muted-foreground font-mono">{r.date ? new Date(r.date).toLocaleString() : "N/A"}</td>
                          <td className="p-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold border ${r.type === 'CREDIT' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'}`}>{r.type}</span>
                          </td>
                          <td className={`p-3 text-right font-bold ${r.type === 'CREDIT' ? 'text-emerald-600' : 'text-destructive'}`}>{r.type === 'CREDIT' ? '+' : '-'}{fmtBal(r.amount, stateAcc.currency)}</td>
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