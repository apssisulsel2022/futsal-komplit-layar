import { useEffect } from "react";
import { Clock, LogOut, Mail, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FFSSLogo } from "@/components/reviews/FFSSLogo";
import { useAuth } from "@/contexts/AuthContext";

export default function PendingApproval() {
  const navigate = useNavigate();
  const { user, signOut, registrationStatus, isLoading } = useAuth();

  useEffect(() => {
    // If user is approved and has role, redirect to appropriate page
    if (!isLoading && registrationStatus === "approved") {
      navigate("/login", { replace: true });
    }
  }, [registrationStatus, isLoading, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse">
          <Clock className="h-12 w-12 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with gradient */}
      <div className="bg-gradient-to-br from-primary to-accent px-6 pt-12 pb-16 text-center">
        <FFSSLogo size="lg" showSubtitle={true} />
      </div>

      {/* Content Card */}
      <div className="flex-1 px-6 -mt-8 pb-8">
        <Card className="max-w-md mx-auto animate-fade-in">
          <CardContent className="pt-8 pb-6 px-6 text-center">
            {/* Icon */}
            <div className="mx-auto w-20 h-20 bg-warning/10 rounded-full flex items-center justify-center mb-6">
              <Clock className="h-10 w-10 text-warning" />
            </div>

            {/* Title */}
            <h1 className="text-xl font-bold mb-2">Menunggu Persetujuan</h1>

            {/* Description */}
            <p className="text-muted-foreground mb-6">
              Pendaftaran Anda sedang ditinjau oleh admin. Kami akan segera memproses pendaftaran Anda.
            </p>

            {/* Status Card */}
            <div className="bg-muted/50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className="text-sm font-medium text-warning flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Pending
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Email</span>
                <span className="text-sm font-medium">{user?.email}</span>
              </div>
            </div>

            {/* Info */}
            <div className="text-left bg-primary/5 rounded-lg p-4 mb-6">
              <p className="text-sm font-medium mb-2">Apa selanjutnya?</p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">1.</span>
                  Admin akan meninjau pendaftaran Anda
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">2.</span>
                  Anda akan mendapatkan notifikasi setelah disetujui
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">3.</span>
                  Login kembali untuk mengakses sistem
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className="text-left mb-6">
              <p className="text-sm font-medium mb-2">Butuh bantuan?</p>
              <div className="space-y-2">
                <a
                  href="mailto:admin@ffss.id"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  admin@afpsulsel.org
                </a>
                <a
                  href="tel:+6281234567890"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  +62 822-7777-0241 / zulfitrah 
                </a>
              </div>
            </div>

            {/* Logout Button */}
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Keluar
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-muted-foreground">
            © 2025 Asosiasi Futsal Provinsi Sulawesi Selatan
          </p>
        </div>
      </div>
    </div>
  );
}
