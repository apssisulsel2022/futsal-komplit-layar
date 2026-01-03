import { useState } from "react";
import { ArrowLeft, Loader2, Mail, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FFSSLogo } from "@/components/reviews/FFSSLogo";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { emailSchema } from "@/lib/validations";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate email
    try {
      emailSchema.parse(email);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
        return;
      }
    }

    setIsLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setIsLoading(false);

    if (error) {
      setError("Gagal mengirim email reset password. Silakan coba lagi.");
    } else {
      setIsSuccess(true);
    }
  };

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
            <h2 className="text-lg font-bold mb-2">Email Terkirim!</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Kami telah mengirim link reset password ke <strong>{email}</strong>. 
              Silakan cek email Anda dan ikuti instruksi untuk mereset password.
            </p>
            <Link to="/login">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali ke Login
              </Button>
            </Link>
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
          <Link to="/login" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Login
          </Link>

          <h2 className="text-lg font-bold text-center mb-1">Lupa Password?</h2>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Masukkan email Anda untuk menerima link reset password
          </p>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="h-12 text-base pl-10"
                  autoComplete="email"
                />
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
                  Mengirim...
                </>
              ) : (
                "Kirim Link Reset Password"
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
