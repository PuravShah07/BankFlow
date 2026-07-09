import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BlurFade } from "@/components/ui/blur-fade";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { sendResetOtp, resetPassword } from "@/lib/api";
import { toast } from "sonner";
import { ArrowRight, Loader2 } from "lucide-react";
import { Logo } from "@/components/ui/logo";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetStep, setResetStep] = useState(1);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [resettingPass, setResettingPass] = useState(false);

  function handleChange(e) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const data = await login({
        email: formData.email,
        password: formData.password,
      });

      toast.success(`Welcome back, ${data.user.name}!`);
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.message || "Login failed. Please check your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSendOtp(e) {
    e.preventDefault();
    if (!resetEmail.trim()) return toast.error("Email is required");
    setSendingOtp(true);
    try {
      await sendResetOtp(resetEmail);
      toast.success("OTP sent to your email!");
      setResetStep(2);
    } catch (err) {
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    if (!resetOtp.trim()) return toast.error("OTP is required");
    if (!resetNewPassword || resetNewPassword.length < 10) return toast.error("Password must be at least 10 characters");
    setResettingPass(true);
    try {
      await resetPassword({ email: resetEmail, otp: resetOtp, newPassword: resetNewPassword });
      toast.success("Password reset successfully! Please sign in.");
      setShowReset(false);
      setResetEmail("");
      setResetOtp("");
      setResetNewPassword("");
      setResetStep(1);
    } catch (err) {
      toast.error(err.message || "Reset failed");
    } finally {
      setResettingPass(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 py-16">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        <BlurFade delay={0.1}>
          <Link to="/" className="mb-8 flex items-center justify-center gap-2 text-2xl font-bold tracking-tight text-foreground animate-in fade-in slide-in-from-top-4 duration-500">
            <Logo className="h-8 w-8" />
            <span>Bank<span className="text-primary">Flow</span></span>
          </Link>
        </BlurFade>

        <BlurFade delay={0.2}>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription>
                Sign in to your BankFlow account
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="login-password">Password</Label>
                    <button type="button" onClick={() => setShowReset(true)} className="text-xs text-primary hover:underline font-medium">Forgot Password?</button>
                  </div>
                  <Input
                    id="login-password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                </div>
              </CardContent>

              <CardFooter className="flex-col gap-4">
                <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <Separator />

                <p className="text-sm text-muted-foreground">
                  Don&apos;t have an account?{" "}
                  <Link to="/register" className="font-medium text-primary hover:underline">
                    Sign Up
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        </BlurFade>
      </div>

      <Dialog open={showReset} onOpenChange={setShowReset}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              {resetStep === 1 
                ? "Enter your email address to receive a 6-digit OTP code."
                : "Enter the OTP code sent to your email and your new password."}
            </DialogDescription>
          </DialogHeader>
          
          {resetStep === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input 
                  type="email" 
                  placeholder="you@example.com" 
                  value={resetEmail} 
                  onChange={(e) => setResetEmail(e.target.value)} 
                  required 
                />
              </div>
              <Button type="submit" className="w-full" disabled={sendingOtp}>
                {sendingOtp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Send OTP"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input 
                  type="email" 
                  value={resetEmail} 
                  disabled 
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label>OTP Code</Label>
                <Input 
                  type="text" 
                  placeholder="Enter 6-digit OTP" 
                  value={resetOtp} 
                  onChange={(e) => setResetOtp(e.target.value)} 
                  required 
                  maxLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input 
                  type="password" 
                  placeholder="Min. 10 characters" 
                  value={resetNewPassword} 
                  onChange={(e) => setResetNewPassword(e.target.value)} 
                  required 
                  minLength={10}
                />
              </div>
              <Button type="submit" className="w-full" disabled={resettingPass}>
                {resettingPass ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Reset Password"}
              </Button>
              <div className="text-center">
                <button type="button" onClick={() => setResetStep(1)} className="text-xs text-primary hover:underline">
                  Back / Change Email
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
