import { useState } from "react";
import { Eye, EyeOff, Loader2, AlertCircle, UserPlus } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FFSSLogo } from "@/components/reviews/FFSSLogo";
import { supabase } from "@/integrations/supabase/client";
import { useKabupatenKota } from "@/hooks/useUsers";
import { z } from "zod";
import { signupSchema } from "@/lib/validations";

type RequestedRole = "wasit" | "panitia";

export default function Signup() {
  const navigate = useNavigate();
  const { data: kabupatenKotaList, isLoading: loadingKabKota } = useKabupatenKota();
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    kabupatenKotaId: "",
    requestedRole: "" as RequestedRole | "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Password dan konfirmasi password tidak cocok");
      return;
    }

    // Validate with Zod
    try {
      signupSchema.parse({
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
        kabupaten_kota_id: formData.kabupatenKotaId,
        requested_role: formData.requestedRole,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
        return;
      }
    }

    setIsLoading(true);

    try {
      // Create auth user - the database trigger will create the profile with pending status
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: formData.fullName,
            kabupaten_kota_id: formData.kabupatenKotaId,
            requested_role: formData.requestedRole,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (!authData.user) {
        throw new Error("Gagal membuat akun");
      }

      // Redirect to pending approval page
      navigate("/pending-approval");
    } catch (err: any) {
      console.error("Signup error:", err);
      if (err.message?.includes("User already registered")) {
        setError("Email sudah terdaftar. Silakan gunakan email lain atau login.");
      } else if (err.message?.includes("Password should be at least")) {
        setError("Password minimal 6 karakter");
      } else {
        setError(err.message || "Terjadi kesalahan saat mendaftar");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const roleOptions = [
    { value: "wasit", label: "Wasit" },
    { value: "panitia", label: "Panitia" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with gradient */}
      <div className="bg-gradient-to-br from-primary to-accent px-6 pt-8 pb-12 text-center">
        <FFSSLogo size="lg" showSubtitle={true} />
      </div>

      {/* Signup Form Card */}
      <div className="flex-1 px-6 -mt-8 pb-8">
        <div className="bg-card rounded-2xl shadow-lg border border-border p-6 animate-fade-in max-w-md mx-auto">
          <div className="flex items-center justify-center gap-2 mb-1">
            <UserPlus className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-center">Daftar Akun Baru</h2>
          </div>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Isi formulir untuk mendaftar sebagai wasit atau panitia
          </p>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name Field */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium">
                Nama Lengkap <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Masukkan nama lengkap"
                value={formData.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                disabled={isLoading}
                className="h-12 text-base"
              />
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@email.com"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                disabled={isLoading}
                className="h-12 text-base"
                autoComplete="email"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimal 8 karakter dengan huruf dan angka"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
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
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Konfirmasi Password <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Ulangi password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
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

            {/* Kabupaten/Kota Field */}
            <div className="space-y-2">
              <Label htmlFor="kabupatenKota" className="text-sm font-medium">
                Kabupaten/Kota <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.kabupatenKotaId}
                onValueChange={(value) => handleChange("kabupatenKotaId", value)}
                disabled={isLoading || loadingKabKota}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Pilih kabupaten/kota" />
                </SelectTrigger>
                <SelectContent>
                  {kabupatenKotaList?.map((kk) => (
                    <SelectItem key={kk.id} value={kk.id}>
                      {kk.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Role Field */}
            <div className="space-y-2">
              <Label htmlFor="role" className="text-sm font-medium">
                Daftar Sebagai <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.requestedRole}
                onValueChange={(value) => handleChange("requestedRole", value)}
                disabled={isLoading}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Pilih peran" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  Mendaftar...
                </>
              ) : (
                "Daftar"
              )}
            </Button>

            <div className="text-center mt-4 text-sm text-muted-foreground">
              Sudah punya akun?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Masuk di sini
              </Link>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-muted-foreground">
            © 2024 Federasi Futsal Sulawesi Selatan
          </p>
        </div>
      </div>
    </div>
  );
}
