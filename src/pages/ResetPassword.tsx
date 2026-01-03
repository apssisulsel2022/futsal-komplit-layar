import { useState, useEffect } from "react";
import { Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FFSSLogo } from "@/components/reviews/FFSSLogo";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { passwordSchema } from "@/lib/validations";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidToken, setIsValidToken] = useState(true);

  useEffect(() => {
    // Check if we have a valid recovery session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // No session, might be an expired or invalid token
        const hash = window.location.hash;
        if (!hash.includes("access_token") && !hash.includes("type=recovery")) {
          setIsValidToken(false);
        }
      }
    };
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate password
    try {
      passwordSchema.parse(password);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
        return;
      }
    }

    if (password !== confirmPassword) {
      setError("Password dan konfirmasi password tidak cocok");
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    setIsLoading(false);

    if (error) {
      if (error.message.includes("same as")) {
        setError("Password baru tidak boleh sama dengan password lama");
      } else {
        setError("Gagal mengubah password. Silakan coba lagi.");
      }
    } else {
      setIsSuccess(true);
      // Sign out and redirect to login after 3 seconds
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate("/login", { replace: true });
      }, 3000);
    }
  };

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="bg-gradient-to-br from-primary to-accent px-6 pt-12 pb-16 text-center">
          <FFSSLogo size="lg" showSubtitle={true} />
        </div>

        <div className="flex-1 px-6 -mt-8">
          <div className="bg-card rounded-2xl shadow-lg border border-border p-6 animate-fade-in text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-lg font-bold mb-2">Link Tidak Valid</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Link reset password tidak valid atau sudah kadaluarsa. Silakan request link baru.
            </p>
            <Button onClick={() => navigate("/forgot-password")} className="w-full">
              Request Link Baru
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="bg-gradient-to-br from-primary to-accent px-6 pt-12 pb-16 text-center">
          <FFSSLogo size="lg" showSubtitle={true} />
        </div>

        <div className="flex-1 px-6 -mt-8">
          <div className="bg-card rounded-2xl shadow-lg border border-border p-6 animate-fade-in text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-lg font-bold mb-2">Password Berhasil Diubah!</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Anda akan dialihkan ke halaman login dalam beberapa detik...
            </p>
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="bg-gradient-to-br from-primary to-accent px-6 pt-12 pb-16 text-center">
        <FFSSLogo size="lg" showSubtitle={true} />
      </div>

      <div className="flex-1 px-6 -mt-8">
        <div className="bg-card rounded-2xl shadow-lg border border-border p-6 animate-fade-in">
          <h2 className="text-lg font-bold text-center mb-1">Reset Password</h2>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Masukkan password baru Anda
          </p>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password Baru
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimal 8 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="h-12 text-base pr-12"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Password harus mengandung huruf dan angka
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Konfirmasi Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Ulangi password baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  className="h-12 text-base pr-12"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Password Baru"
              )}
            </Button>
          </form>
        </div>

        <div className="text-center mt-6 pb-8">
          <p className="text-xs text-muted-foreground">
            © 2024 Federasi Futsal Sulawesi Selatan
          </p>
        </div>
      </div>
    </div>
  );
}
