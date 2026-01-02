import { useState } from "react";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!name.trim()) {
      setError("Nama lengkap tidak boleh kosong");
      return;
    }
    if (!email.trim()) {
      setError("Email tidak boleh kosong");
      return;
    }
    if (!password.trim()) {
      setError("Password tidak boleh kosong");
      return;
    }
    if (password.length < 6) {
      setError("Password minimal 6 karakter");
      return;
    }
    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak sesuai");
      return;
    }

    // Simulate signup (UI mockup only)
    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      setIsLoading(false);
      // Navigate to profile completion page after signup
      navigate("/referee/profile/complete");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with gradient */}
      <div className="bg-gradient-to-br from-primary to-accent px-6 pt-12 pb-16 text-center">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-foreground/20 rounded-2xl mb-4 backdrop-blur-sm border border-primary-foreground/10">
          <div className="text-center">
            <span className="text-2xl font-black text-primary-foreground tracking-tight">FF</span>
            <span className="block text-[10px] font-semibold text-primary-foreground/80 -mt-1">SULSEL</span>
          </div>
        </div>
        
        <h1 className="text-xl font-bold text-primary-foreground mb-1">
          Federasi Futsal
        </h1>
        <p className="text-sm text-primary-foreground/80">
          Sulawesi Selatan
        </p>
      </div>

      {/* Signup Form Card */}
      <div className="flex-1 px-6 -mt-8">
        <div className="bg-card rounded-2xl shadow-lg border border-border p-6 animate-fade-in">
          <h2 className="text-lg font-bold text-center mb-1">
            Daftar Akun Baru
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Bergabung untuk mengelola event dan wasit
          </p>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Nama Lengkap
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Masukkan nama lengkap"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                className="h-12 text-base"
                autoComplete="name"
              />
            </div>

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
                  placeholder="Buat password"
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
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Konfirmasi Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Ulangi password"
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
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Daftar"
              )}
            </Button>
            
            <div className="text-center mt-4">
              <span className="text-sm text-muted-foreground">
                Sudah punya akun?{" "}
              </span>
              <Link to="/login" className="text-sm font-semibold text-primary hover:underline">
                Masuk
              </Link>
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
