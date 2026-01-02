import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ImageUpload } from "@/components/ui/image-upload";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";

// Mock data for AFK Kab/Kota Sulawesi Selatan
const afkOptions = [
  { value: "makassar", label: "AFK Kota Makassar" },
  { value: "gowa", label: "AFK Kabupaten Gowa" },
  { value: "maros", label: "AFK Kabupaten Maros" },
  { value: "takalar", label: "AFK Kabupaten Takalar" },
  { value: "bone", label: "AFK Kabupaten Bone" },
  { value: "bulukumba", label: "AFK Kabupaten Bulukumba" },
  { value: "sinjai", label: "AFK Kabupaten Sinjai" },
  { value: "wajo", label: "AFK Kabupaten Wajo" },
  { value: "soppeng", label: "AFK Kabupaten Soppeng" },
  { value: "pangkep", label: "AFK Kabupaten Pangkep" },
  { value: "barru", label: "AFK Kabupaten Barru" },
  { value: "pinrang", label: "AFK Kabupaten Pinrang" },
  { value: "enrekang", label: "AFK Kabupaten Enrekang" },
  { value: "luwu", label: "AFK Kabupaten Luwu" },
  { value: "luwu-utara", label: "AFK Kabupaten Luwu Utara" },
  { value: "luwu-timur", label: "AFK Kabupaten Luwu Timur" },
  { value: "tana-toraja", label: "AFK Kabupaten Tana Toraja" },
  { value: "toraja-utara", label: "AFK Kabupaten Toraja Utara" },
  { value: "palopo", label: "AFK Kota Palopo" },
  { value: "parepare", label: "AFK Kota Parepare" },
  { value: "bantaeng", label: "AFK Kabupaten Bantaeng" },
  { value: "jeneponto", label: "AFK Kabupaten Jeneponto" },
  { value: "selayar", label: "AFK Kabupaten Kepulauan Selayar" },
  { value: "sidrap", label: "AFK Kabupaten Sidenreng Rappang" },
];

const licenseOptions = [
  { value: "level-3", label: "Level 3", description: "Lisensi Dasar" },
  { value: "level-2", label: "Level 2", description: "Lisensi Menengah" },
  { value: "level-1", label: "Level 1", description: "Lisensi Tertinggi" },
];

interface FormData {
  profilePhoto: string | null;
  fullName: string;
  birthDate: Date | undefined;
  afk: string;
  occupation: string;
  licenseLevel: string;
  licensePhoto: string | null;
  ktpPhoto: string | null;
}

export default function RefereeProfileComplete() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    profilePhoto: null,
    fullName: "",
    birthDate: undefined,
    afk: "",
    occupation: "",
    licenseLevel: "",
    licensePhoto: null,
    ktpPhoto: null,
  });

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isStep1Valid =
    formData.fullName.trim() !== "" &&
    formData.birthDate !== undefined &&
    formData.afk !== "";

  const isStep2Valid =
    formData.licenseLevel !== "" &&
    formData.licensePhoto !== null &&
    formData.ktpPhoto !== null;

  const handleNext = () => {
    if (step === 1 && isStep1Valid) {
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  const handleSubmit = async () => {
    if (!isStep2Valid) return;

    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      navigate("/referee");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-accent px-6 pt-8 pb-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-foreground/20 rounded-2xl mb-3 backdrop-blur-sm border border-primary-foreground/10">
          <div className="text-center">
            <span className="text-xl font-black text-primary-foreground tracking-tight">
              FF
            </span>
            <span className="block text-[8px] font-semibold text-primary-foreground/80 -mt-1">
              SULSEL
            </span>
          </div>
        </div>

        <h1 className="text-lg font-bold text-primary-foreground mb-1">
          Lengkapi Profil Anda
        </h1>
        <p className="text-sm text-primary-foreground/80">
          Langkah {step} dari 2
        </p>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <div
            className={cn(
              "w-3 h-3 rounded-full transition-all",
              step >= 1 ? "bg-primary-foreground" : "bg-primary-foreground/30"
            )}
          />
          <div className="w-8 h-0.5 bg-primary-foreground/30">
            <div
              className={cn(
                "h-full bg-primary-foreground transition-all",
                step >= 2 ? "w-full" : "w-0"
              )}
            />
          </div>
          <div
            className={cn(
              "w-3 h-3 rounded-full transition-all",
              step >= 2 ? "bg-primary-foreground" : "bg-primary-foreground/30"
            )}
          />
        </div>
      </div>

      {/* Form Card */}
      <div className="flex-1 px-4 -mt-6 pb-6">
        <div className="bg-card rounded-2xl shadow-lg border border-border p-5 animate-fade-in">
          {step === 1 ? (
            <div className="space-y-5">
              <h2 className="text-base font-semibold text-center mb-4">
                Data Pribadi
              </h2>

              {/* Profile Photo */}
              <div className="flex justify-center">
                <ImageUpload
                  variant="avatar"
                  value={formData.profilePhoto || undefined}
                  onChange={(val) => updateFormData("profilePhoto", val)}
                  label="Foto Profil"
                />
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium">
                  Nama Lengkap <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Masukkan nama lengkap"
                  value={formData.fullName}
                  onChange={(e) => updateFormData("fullName", e.target.value)}
                  className="h-12"
                />
              </div>

              {/* Birth Date */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Tanggal Lahir <span className="text-destructive">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-12 justify-start text-left font-normal",
                        !formData.birthDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.birthDate ? (
                        format(formData.birthDate, "dd MMMM yyyy", {
                          locale: id,
                        })
                      ) : (
                        <span>Pilih tanggal</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.birthDate}
                      onSelect={(date) => updateFormData("birthDate", date)}
                      initialFocus
                      captionLayout="dropdown-buttons"
                      fromYear={1960}
                      toYear={2010}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* AFK Origin */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Asal AFK <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.afk}
                  onValueChange={(val) => updateFormData("afk", val)}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Pilih AFK Kab/Kota" />
                  </SelectTrigger>
                  <SelectContent>
                    {afkOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Occupation */}
              <div className="space-y-2">
                <Label htmlFor="occupation" className="text-sm font-medium">
                  Pekerjaan
                </Label>
                <Input
                  id="occupation"
                  type="text"
                  placeholder="Masukkan pekerjaan"
                  value={formData.occupation}
                  onChange={(e) => updateFormData("occupation", e.target.value)}
                  className="h-12"
                />
              </div>

              {/* Next Button */}
              <Button
                className="w-full h-12 text-base font-semibold mt-4"
                onClick={handleNext}
                disabled={!isStep1Valid}
              >
                Lanjutkan
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              <h2 className="text-base font-semibold text-center mb-4">
                Data Lisensi & Dokumen
              </h2>

              {/* License Level */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Level Lisensi <span className="text-destructive">*</span>
                </Label>
                <RadioGroup
                  value={formData.licenseLevel}
                  onValueChange={(val) => updateFormData("licenseLevel", val)}
                  className="space-y-2"
                >
                  {licenseOptions.map((option) => (
                    <div
                      key={option.value}
                      className={cn(
                        "flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-all",
                        formData.licenseLevel === option.value
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      )}
                      onClick={() => updateFormData("licenseLevel", option.value)}
                    >
                      <RadioGroupItem value={option.value} id={option.value} />
                      <div className="flex-1">
                        <Label
                          htmlFor={option.value}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {option.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {option.description}
                        </p>
                      </div>
                      {formData.licenseLevel === option.value && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* License Photo */}
              <ImageUpload
                label="Foto Lisensi *"
                value={formData.licensePhoto || undefined}
                onChange={(val) => updateFormData("licensePhoto", val)}
              />

              {/* KTP Photo */}
              <ImageUpload
                label="Foto KTP *"
                value={formData.ktpPhoto || undefined}
                onChange={(val) => updateFormData("ktpPhoto", val)}
              />

              {/* Action Buttons */}
              <div className="flex gap-3 mt-4">
                <Button
                  variant="outline"
                  className="flex-1 h-12"
                  onClick={handleBack}
                >
                  <ChevronLeft className="mr-2 h-5 w-5" />
                  Kembali
                </Button>
                <Button
                  className="flex-1 h-12 text-base font-semibold"
                  onClick={handleSubmit}
                  disabled={!isStep2Valid || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan Profil"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <p className="text-xs text-muted-foreground text-center mt-4 px-4">
          Data Anda akan diverifikasi oleh Admin sebelum dapat menerima penugasan
        </p>
      </div>
    </div>
  );
}
