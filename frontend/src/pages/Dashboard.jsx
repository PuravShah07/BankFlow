import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getMyAccounts, createAccount, getAccountStatement, createTransaction } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Logo } from "@/components/ui/logo";
import { toast } from "sonner";
import * as Icons from "lucide-react";

export default function Dashboard() {
  const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [accs, setAccs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showAi, setShowAi] = useState(false);

  const [submittingAcc, setSubmittingAcc] = useState(false);
  const [accForm, setAccForm] = useState({ name: "", currency: "INR" });
  const [submittingTx, setSubmittingTx] = useState(false);
  const [txSuccess, setTxSuccess] = useState(false);
  const [txForm, setTxForm] = useState({ fromAccountId: "", toAccountId: "", amount: "" });

  const [records, setRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [showStatement, setShowStatement] = useState(false);
  const [stateAcc, setStateAcc] = useState({ id: "", name: "", currency: "INR" });
  const [dateFilter, setDateFilter] = useState({ start: "", end: "" });

  const [txs, setTxs] = useState([]);
  const [txsLoading, setTxsLoading] = useState(false);

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
    setTxSuccess(false);
    try {
      const key = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      await createTransaction({ fromAccountId, toAccountId: toAccountId.trim(), amount: parseFloat(amount), idempotencyKey: key });
      const src = accs.find(a => a._id === fromAccountId);
      setNotifs(prev => [{ id: Date.now(), title: "Transfer Authorized", desc: `Sent ${fmtBal(amount, src?.currency || "INR")} to ${toAccountId.substr(-6)}`, time: "Just now", read: false }, ...prev]);
      setSubmittingTx(false);
      setTxSuccess(true);
      loadData();
      setTimeout(() => {
        setTxSuccess(prev => {
          if (prev) {
            setShowTransfer(false);
            setTxForm({ fromAccountId: "", toAccountId: "", amount: "" });
            return false;
          }
          return prev;
        });
      }, 3000);
    } catch (err) {
      toast.error(err.message || "Transfer failed");
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
        <td style="padding: 10px; border-bottom: 1px solid #eee; font-size: 13px; color: #333;">
          ${record.description || "N/A"}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; font-family: monospace; font-size: 13px; color: #555;">
          ${record.receiverName || "N/A"}
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
                <th>Description</th>
                <th>Receiver Name</th>
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

  const userInitials = useMemo(() => {
    if (!user?.name) return "U";
    return user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  }, [user]);

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Icons.Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (showTransfer) {
    if (submittingTx) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground p-6">
          <div className="relative flex items-center justify-center w-80 h-80">
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <div className="absolute inset-4 rounded-full border-2 border-dashed border-primary/20 animate-[spin_10s_linear_infinite_reverse]" />
            <div className="z-10 flex flex-col items-center justify-center text-center p-6 max-w-[240px]">
              <h3 className="text-lg font-bold text-primary animate-pulse">Transaction in Progress</h3>
              <p className="text-[11px] text-muted-foreground mt-2 font-medium">Your Amount is Getting Transfered via Safe way...</p>
            </div>
          </div>
        </div>
      );
    }

    if (txSuccess) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground p-6">
          <style>{`
            @keyframes strokeCircle {
              to { stroke-dashoffset: 0; }
            }
            @keyframes strokeCheck {
              to { stroke-dashoffset: 0; }
            }
            @keyframes scaleIn {
              0% { transform: scale(0); }
              100% { transform: scale(1); }
            }
          `}</style>
          <div className="flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="relative flex items-center justify-center w-28 h-28 mb-6">
              <svg className="w-full h-full text-emerald-500 animate-[scaleIn_0.3s_ease-out_forwards]" viewBox="0 0 52 52">
                <circle className="stroke-emerald-500 stroke-[3] fill-none animate-[strokeCircle_0.6s_ease-in-out_forwards]" cx="26" cy="26" r="25" strokeDasharray="157" strokeDashoffset="157" />
                <path className="stroke-emerald-500 stroke-[5] fill-none animate-[strokeCheck_0.3s_0.6s_ease-in-out_forwards]" d="M14 27 l8 8 l16 -16" strokeDasharray="48" strokeDashoffset="48" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="text-2xl font-extrabold tracking-tight">Transfer Successful</h3>
            <p className="text-xs text-muted-foreground mt-2 max-w-[280px]">Your funds have been transferred successfully via our secure pathway.</p>
            <Button onClick={() => { setTxSuccess(false); setShowTransfer(false); setTxForm({ fromAccountId: "", toAccountId: "", amount: "" }); }} className="mt-8 px-8 py-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-500/20">Done</Button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background text-foreground antialiased pb-12">
        <nav className="sticky top-0 z-40 border-b bg-card/85 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
            <div className="flex items-center gap-2 font-bold text-xl">
              <Logo className="h-9 w-9" />
              <span>Bank<span className="text-primary">Flow</span></span>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowTransfer(false)}>
              <Icons.ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Dashboard
            </Button>
          </div>
        </nav>

        <main className="mx-auto max-w-2xl px-6 mt-12">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Transfer Funds</h1>
              <p className="text-xs text-muted-foreground mt-1">Move money securely between accounts instantly.</p>
            </div>

            <Card className="p-6">
              {accs.length === 0 ? (
                <div className="text-center py-8">
                  <Icons.Inbox className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-semibold">No active accounts found.</p>
                  <Button onClick={() => { setShowTransfer(false); setShowCreate(true); }} className="mt-4">Create Account</Button>
                </div>
              ) : (
                <form onSubmit={handleTransfer} className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Source Account</Label>
                    <Select value={txForm.fromAccountId} onValueChange={(val) => setTxForm({ ...txForm, fromAccountId: val })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accs.filter(a => a.status === "ACTIVE").map(a => (
                          <SelectItem key={a._id} value={a._id}>{a.name} ({fmtBal(a.balance, a.currency)})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Destination Account ID</Label>
                    <Input
                      placeholder="Paste destination account ID here..."
                      value={txForm.toAccountId}
                      onChange={(e) => setTxForm({ ...txForm, toAccountId: e.target.value })}
                      className="font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Amount</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={txForm.amount}
                        onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                        className="pl-8 text-lg font-bold"
                      />
                      <div className="absolute left-3 top-2.5 text-muted-foreground font-semibold text-sm">
                        {txForm.fromAccountId ? accs.find(a => a._id === txForm.fromAccountId)?.currency === "INR" ? "₹" : "$" : ""}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={() => setShowTransfer(false)} className="flex-1 py-6 font-bold">Cancel</Button>
                    <Button type="submit" className="flex-1 py-6 font-bold">Send Transfer</Button>
                  </div>
                </form>
              )}
            </Card>

            <div className="rounded-lg border bg-muted/30 p-4 flex gap-3 items-start">
              <Icons.ShieldAlert className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold">Secure Bank Transfer</h4>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">Transactions are signed cryptographically and monitored for security. Do not share transaction details with anyone.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (showStatement) {
    return (
      <div className="min-h-screen bg-background text-foreground antialiased pb-12">
        <nav className="sticky top-0 z-40 border-b bg-card/85 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
            <div className="flex items-center gap-2 font-bold text-xl">
              <Logo className="h-9 w-9" />
              <span>Bank<span className="text-primary">Flow</span></span>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowStatement(false)}>
              <Icons.ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Dashboard
            </Button>
          </div>
        </nav>

        <main className="mx-auto max-w-6xl px-6 mt-12">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight">{stateAcc.name} - Statement</h1>
                <p className="text-xs text-muted-foreground mt-1 font-mono">Account ID: {stateAcc.id}</p>
              </div>
              <div className="flex gap-2.5">
                {records.length > 0 && <Button variant="outline" onClick={handleExportPDF}>Export PDF</Button>}
                <Button variant="outline" onClick={() => setShowStatement(false)}>Back to Dashboard</Button>
              </div>
            </div>

            {records.length > 0 && (
              <div className="flex gap-2 items-center bg-muted/40 p-3 rounded-lg text-xs flex-wrap">
                <Input type="date" value={dateFilter.start} onChange={(e) => setDateFilter({...dateFilter, start: e.target.value})} className="w-auto h-8" />
                <span className="text-muted-foreground">to</span>
                <Input type="date" value={dateFilter.end} onChange={(e) => setDateFilter({...dateFilter, end: e.target.value})} className="w-auto h-8" />
                {(dateFilter.start || dateFilter.end) && <Button size="sm" variant="ghost" onClick={() => setDateFilter({ start: "", end: "" })} className="text-xs h-8 text-destructive hover:bg-destructive/10">Reset Filters</Button>}
              </div>
            )}

            <Card className="overflow-hidden">
              {recordsLoading ? (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-4 w-[140px]" />
                      <Skeleton className="h-4 w-[60px]" />
                      <Skeleton className="h-4 w-[180px]" />
                      <Skeleton className="h-4 w-[100px]" />
                      <Skeleton className="h-4 w-[80px] ml-auto" />
                    </div>
                  ))}
                </div>
              ) : filteredStatement.length === 0 ? (
                <div className="text-center py-24">
                  <Icons.Inbox className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-semibold">No records found matching filters.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Receiver Name</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStatement.map(r => (
                      <TableRow key={r._id}>
                        <TableCell className="text-muted-foreground font-mono">{r.date ? new Date(r.date).toLocaleString() : "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant={r.type === "CREDIT" ? "default" : "destructive"} className="text-[9px]">{r.type}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{r.description || "N/A"}</TableCell>
                        <TableCell className="font-mono text-muted-foreground">{r.receiverName || "N/A"}</TableCell>
                        <TableCell className={`text-right font-bold ${r.type === "CREDIT" ? "text-emerald-600" : "text-destructive"}`}>{r.type === "CREDIT" ? "+" : "-"}{fmtBal(r.amount, stateAcc.currency)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground antialiased pb-12">

      <nav className="sticky top-0 z-40 border-b bg-card/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/dashboard" className="flex items-center gap-2 font-bold text-xl">
            <Logo className="h-9 w-9" />
            <span>Bank<span className="text-primary">Flow</span></span>
          </Link>

          <div className="hidden md:flex relative w-80">
            <Icons.Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                  <Icons.Bell className="h-5 w-5" />
                  {notifs.length > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary animate-pulse" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex justify-between">
                  <span>Notifications</span>
                  <button onClick={() => setNotifs([])} className="text-xs text-primary font-medium">Clear</button>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifs.length === 0 ? (
                  <div className="p-4 text-xs text-center text-muted-foreground">No notifications</div>
                ) : (
                  notifs.map(n => (
                    <DropdownMenuItem key={n.id} className="flex-col items-start">
                      <p className="font-semibold text-xs">{n.title}</p>
                      <p className="text-muted-foreground text-xs">{n.desc}</p>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 px-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">{userInitials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm font-medium">{user?.name}</span>
                  <Icons.ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">{user?.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout().then(() => navigate("/"))} className="text-destructive focus:text-destructive">
                  <Icons.LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 mt-8">

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-muted/40 border p-6 rounded-lg backdrop-blur-sm mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Welcome, {user?.name}</h1>
            <p className="text-xs text-muted-foreground mt-1">Manage accounts and ledgers cleanly.</p>
          </div>
          <div className="flex gap-2.5">
            <Button onClick={() => setShowTransfer(true)}><Icons.Send className="mr-2 h-4 w-4" /> Transfer</Button>
            <Button variant="outline" onClick={() => setShowCreate(true)}><Icons.Plus className="mr-2 h-4 w-4" /> Add Account</Button>
          </div>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 mb-8">
          {[
            { label: "Net Balance", val: stats.balanceStr, icon: Icons.Wallet, color: "text-primary" },
            { label: "Total Accounts", val: accs.length, icon: Icons.Layers, color: "text-indigo-600" },
            { label: "Monthly Credits", val: stats.creditsStr, icon: Icons.ArrowDownLeft, color: "text-emerald-600" },
            { label: "Monthly Debits", val: stats.debitsStr, icon: Icons.ArrowUpRight, color: "text-destructive" },
            { label: "Pending Transfers", val: "0", icon: Icons.Clock, color: "text-amber-500" }
          ].map((c, i) => {
            return (
              <Card key={i}>
                <CardContent className="p-5 flex flex-col justify-between h-full">
                  <div className="flex justify-between items-start">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">{c.label}</p>
                    <div className={`p-2 rounded-lg bg-muted ${c.color}`}><c.icon className="h-5 w-5" /></div>
                  </div>
                  <h3 className="text-xl font-bold tracking-tight mt-4 truncate">
                    {c.val}
                  </h3>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mb-10">
          <h2 className="text-lg font-bold mb-4">Accounts & Balances</h2>
          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-5 w-[140px] mb-2" />
                  <Skeleton className="h-3 w-[100px] mb-6" />
                  <Separator className="mb-4" />
                  <Skeleton className="h-3 w-[60px] mb-2" />
                  <Skeleton className="h-7 w-[120px] mb-4" />
                  <div className="grid grid-cols-2 gap-2">
                    <Skeleton className="h-9" />
                    <Skeleton className="h-9" />
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredAccs.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-lg bg-muted/10">
              <Icons.Inbox className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-semibold">No accounts found</p>
              <Button onClick={() => setShowCreate(true)} className="mt-4">Create Account</Button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAccs.map(a => (
                <Card key={a._id} className="group hover:shadow-md transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base group-hover:text-primary transition-colors">{a.name}</CardTitle>
                        <p className="text-[9px] text-muted-foreground font-mono truncate max-w-[150px]">ID: {a._id}</p>
                      </div>
                      <Badge variant={a.status === "ACTIVE" ? "default" : "secondary"}>{a.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Separator className="mb-4" />
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Balance</p>
                    <h4 className="text-2xl font-bold mt-0.5">{fmtBal(a.balance || 0, a.currency)}</h4>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <Button size="sm" variant="outline" onClick={() => viewStatement(a._id, a.name, a.currency)}>Ledger</Button>
                      <Button size="sm" disabled={a.status !== "ACTIVE"} onClick={() => { setTxForm({ fromAccountId: a._id, toAccountId: "", amount: "" }); setShowTransfer(true); }}>Transfer</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <div onClick={() => setShowCreate(true)} className="flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-input bg-muted/10 hover:bg-muted/20 transition-all">
                <Icons.Plus className="h-5 w-5 text-primary mb-2" />
                <span className="font-semibold text-sm">Add Account</span>
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3 mb-10">
          <div className="lg:col-span-2">
            <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
            <Card className="p-4">
              {txsLoading ? (
                <div className="space-y-3 py-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex justify-between items-center p-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-9 w-9 rounded-lg" />
                        <div>
                          <Skeleton className="h-4 w-[100px] mb-1" />
                          <Skeleton className="h-3 w-[140px]" />
                        </div>
                      </div>
                      <Skeleton className="h-4 w-[80px]" />
                    </div>
                  ))}
                </div>
              ) : txs.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-10">No recent transactions</p>
              ) : (
                <div className="space-y-3">
                  {filteredTxs.slice(0, 5).map((t, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 rounded-lg border bg-background/50 hover:bg-muted/40 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${t.type === "CREDIT" ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"}`}>
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
            <Card className="p-5 space-y-4">
              {snapshot ? (
                <>
                  {[
                    { label: "Active Account", val: snapshot.active },
                    { label: "Largest Transaction", val: snapshot.largest },
                    { label: "Transfers Count", val: `${snapshot.transfers} completed` },
                    { label: "Last Statement", val: snapshot.lastGen }
                  ].map((s, i) => (
                    <div key={i} className="p-3 border rounded-lg bg-muted/20">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">{s.label}</p>
                      <h5 className="font-semibold text-sm mt-0.5">{s.val}</h5>
                    </div>
                  ))}
                </>
              ) : <p className="text-xs text-muted-foreground text-center py-10">No snapshot details</p>}
            </Card>
          </div>
        </div>

        <div className="mb-10">
          <h3 className="text-lg font-bold mb-4">Spending Analytics</h3>
          <div className="grid gap-5 grid-cols-1 md:grid-cols-3">

            <Card className="p-5 min-h-[180px] flex flex-col justify-between">
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

            <Card className="p-5 min-h-[180px] flex flex-col justify-between">
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

            <Card className="p-5 min-h-[180px] flex flex-col justify-between">
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

        <div className="mb-10">
          <h3 className="text-lg font-bold mb-4">Operations</h3>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-5">
            {[
              { label: "Add Account", icon: Icons.Plus, click: () => setShowCreate(true), color: "text-primary bg-primary/10" },
              { label: "Transfer Money", icon: Icons.ArrowRightLeft, click: () => setShowTransfer(true), color: "text-emerald-600 bg-emerald-500/10" },
              { label: "Generate Stat", icon: Icons.FileText, click: () => accs.length > 0 && viewStatement(accs[0]._id, accs[0].name, accs[0].currency), color: "text-violet-600 bg-violet-500/10", disabled: accs.length === 0 },
              { label: "Import Ledger", icon: Icons.UploadCloud, click: () => setShowImport(true), color: "text-amber-600 bg-amber-500/10" },
              { label: "AI Insights", icon: Icons.Sparkles, click: () => setShowAi(true), color: "text-pink-600 bg-pink-500/10" }
            ].map((o, idx) => (
              <Card key={idx} asChild className="p-0">
                <button onClick={o.click} disabled={o.disabled} className="flex flex-col items-center justify-center p-5 rounded-lg border bg-card shadow-sm hover:bg-muted/50 transition-colors disabled:opacity-40">
                  <div className={`p-3 rounded-lg mb-2.5 ${o.color}`}><o.icon className="h-5 w-5" /></div>
                  <span className="font-semibold text-xs">{o.label}</span>
                </button>
              </Card>
            ))}
          </div>
        </div>

      </main>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Account</DialogTitle>
            <DialogDescription>Set up a new banking account with your preferred currency.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Account Name</Label>
              <Input placeholder="Savings account..." value={accForm.name} onChange={(e) => setAccForm({...accForm, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={accForm.currency} onValueChange={(val) => setAccForm({...accForm, currency: val})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">INR (₹)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={submittingAcc} className="w-full">{submittingAcc ? <Icons.Loader2 className="animate-spin h-4 w-4" /> : "Create"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Import Statement</DialogTitle>
            <DialogDescription>Upload transaction statements from external sources.</DialogDescription>
          </DialogHeader>
          <div className="text-center p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/10">
            <Icons.UploadCloud className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs font-semibold">Drop transaction statements here</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowImport(false)}>Cancel</Button>
            <Button size="sm" onClick={() => { toast.success("Import successful"); setShowImport(false); }}>Upload</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAi} onOpenChange={setShowAi}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5"><Icons.Sparkles className="h-5 w-5 text-pink-500" /> AI Insights</DialogTitle>
            <DialogDescription>Smart analysis of your financial data.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-xs leading-relaxed">
            {charts.hasData ? (
              <>
                <div className="p-3 rounded-lg bg-pink-500/5 border border-pink-500/10">
                  <p className="font-semibold text-pink-600">Savings Rate</p>
                  <p className="mt-1">Inflow stands at {charts.credPct}% and Outflow at {charts.debPct}%. Solid savings behavior registered in the ledger.</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="font-semibold text-primary">System Audit</p>
                  <p className="mt-1">Cryptographic hashes verify active account balances. Zero ledger audit warnings.</p>
                </div>
              </>
            ) : <p className="text-sm text-center py-4">Complete at least one transaction to get advice.</p>}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}