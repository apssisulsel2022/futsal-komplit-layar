import { useState, useEffect } from "react";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { FFSSLogo } from "@/components/reviews/FFSSLogo";
import { z } from "zod";
import { loginSchema } from "@/lib/validations";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, user, role, isProfileComplete, isLoading: authLoading, isAdmin } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading && role) {
      redirectBasedOnRole();
    }
  }, [user, role, isProfileComplete, authLoading]);

  const redirectBasedOnRole = () => {
    // Check if there's a redirect path from protected route
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
    
    if (from) {
      navigate(from, { replace: true });
      return;
    }

    // Only wasit role requires profile completion
    if (role === "wasit" && !isProfileComplete) {
      navigate("/referee/profile/complete", { replace: true });
      return;
    }

    // Redirect based on role
    if (isAdmin()) {
      navigate("/dashboard", { replace: true });
    } else if (role === "wasit") {
      navigate("/referee", { replace: true });
    } else if (role === "evaluator") {
      navigate("/evaluations", { replace: true });
    } else if (role === "panitia") {
      navigate("/events", { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate with Zod
    try {
      loginSchema.parse({ email, password });
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
        return;
      }
    }

    setIsLoading(true);
    
    const { error } = await signIn(email, password);
    
    setIsLoading(false);
    
    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        setError("Email atau password salah");
      } else if (error.message.includes("Email not confirmed")) {
        setError("Email belum diverifikasi. Silakan cek email Anda");
      } else {
        setError(error.message);
      }
    }
  };

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with gradient */}
      <div className="bg-gradient-to-br from-primary to-accent px-6 pt-12 pb-16 text-center">
        <FFSSLogo size="lg" showSubtitle={true} />
      </div>

      {/* Login Form Card */}
      <div className="flex-1 px-6 -mt-8">
        <div className="bg-card rounded-2xl shadow-lg border border-border p-6 animate-fade-in">
          <h2 className="text-lg font-bold text-center mb-1">
            Login Sistem Federasi Futsal
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Masuk untuk mengelola event dan wasit
          </p>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="h-12 text-base"
                autoComplete="email"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="h-12 text-base pr-12"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Lupa Password?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Masuk"
              )}
            </Button>

            <div className="text-center mt-4 text-sm text-muted-foreground">
              Hubungi admin untuk mendapatkan akun
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 pb-8">
          <p className="text-xs text-muted-foreground">
            © 2024 Federasi Futsal Sulawesi Selatan
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Sistem Manajemen Wasit & Event
          </p>
        </div>
      </div>
    </div>
  );
}
