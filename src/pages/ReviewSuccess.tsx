import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReviewSuccess() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl scale-150" />
          <CheckCircle2 className="relative w-24 h-24 text-green-500 mx-auto animate-in zoom-in-50 duration-500" />
        </div>

        {/* Message */}
        <h1 className="mt-8 text-2xl font-bold text-foreground animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
          Terima Kasih Atas Penilaian Anda
        </h1>

        <p className="mt-3 text-muted-foreground animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
          Penilaian Anda sangat berarti untuk membantu meningkatkan kualitas
          wasit futsal di Sulawesi Selatan.
        </p>

        {/* Action Button */}
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500">
          <Button size="lg" onClick={() => navigate("/review")}>
            Kembali ke Daftar Wasit
          </Button>
        </div>
      </div>
    </div>
  );
}
