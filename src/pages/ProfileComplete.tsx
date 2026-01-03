import { useState, useEffect } from "react";
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
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useUpdateProfile, uploadProfileImage } from "@/hooks/useProfile";
import { toast } from "sonner";

// AFK options for Sulawesi Selatan
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
  { value: "level_3", label: "Level 3", description: "Lisensi Dasar" },
  { value: "level_2", label: "Level 2", description: "Lisensi Menengah" },
  { value: "level_1", label: "Level 1", description: "Lisensi Tertinggi" },
];

interface FormData {
  profilePhoto: string | null;
  profilePhotoFile: File | null;
  fullName: string;
  birthDate: Date | undefined;
  afk: string;
  occupation: string;
  licenseLevel: string;
  licensePhoto: string | null;
  licensePhotoFile: File | null;
  ktpPhoto: string | null;
  ktpPhotoFile: File | null;
}

export default function ProfileComplete() {
  const navigate = useNavigate();
  const { user, role, refreshProfile, isAdmin, isProfileComplete } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  
  const isWasit = role === "wasit";
  const totalSteps = isWasit ? 2 : 2; // Both have 2 steps, but wasit has license fields in step 2
  
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    profilePhoto: null,
    profilePhotoFile: null,
    fullName: "",
    birthDate: undefined,
    afk: "",
    occupation: "",
    licenseLevel: "",
    licensePhoto: null,
    licensePhotoFile: null,
    ktpPhoto: null,
    ktpPhotoFile: null,
  });

  const getRedirectPath = () => {
    if (isAdmin()) {
      return "/dashboard";
    }
    switch (role) {
      case "wasit":
        return "/referee";
      case "evaluator":
        return "/evaluations";
      case "panitia":
        return "/events";
      default:
        return "/";
    }
  };

  // Redirect if profile is already complete
  useEffect(() => {
    if (!profileLoading && isProfileComplete) {
      navigate(getRedirectPath(), { replace: true });
    }
  }, [isProfileComplete, profileLoading, navigate, role]);

  // Initialize form data from profile when loaded
  useEffect(() => {
    if (profile) {
      setFormData({
        profilePhoto: profile.profile_photo_url || null,
        profilePhotoFile: null,
        fullName: profile.full_name || "",
        birthDate: profile.birth_date ? new Date(profile.birth_date) : undefined,
        afk: profile.afk_origin || "",
        occupation: profile.occupation || "",
        licenseLevel: profile.license_level || "",
        licensePhoto: profile.license_photo_url || null,
        licensePhotoFile: null,
        ktpPhoto: profile.ktp_photo_url || null,
        ktpPhotoFile: null,
      });
    }
  }, [profile]);

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (
    field: "profilePhoto" | "licensePhoto" | "ktpPhoto",
    fileField: "profilePhotoFile" | "licensePhotoFile" | "ktpPhotoFile",
    value: string | undefined,
    file?: File
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value || null,
      [fileField]: file || null,
    }));
  };

  const isStep1Valid =
    formData.fullName.trim() !== "" &&
    formData.birthDate !== undefined &&
    formData.afk !== "";

  const isStep2Valid = () => {
    const hasKtp = formData.ktpPhoto !== null || formData.ktpPhotoFile !== null;
    
    if (isWasit) {
      const hasLicense = formData.licenseLevel !== "" &&
        (formData.licensePhoto !== null || formData.licensePhotoFile !== null);
      return hasLicense && hasKtp;
    }
    
    return hasKtp;
  };

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
    if (!isStep2Valid() || !user) return;

    setIsLoading(true);
    
    try {
      let profilePhotoUrl = formData.profilePhoto;
      let licensePhotoUrl = formData.licensePhoto;
      let ktpPhotoUrl = formData.ktpPhoto;

      // Upload profile photo if new file selected
      if (formData.profilePhotoFile) {
        profilePhotoUrl = await uploadProfileImage(
          user.id,
          formData.profilePhotoFile,
          "avatars",
          "profile"
        );
      }

      // Upload license photo if new file selected (only for wasit)
      if (isWasit && formData.licensePhotoFile) {
        licensePhotoUrl = await uploadProfileImage(
          user.id,
          formData.licensePhotoFile,
          "documents",
          "license"
        );
      }

      // Upload KTP photo if new file selected
      if (formData.ktpPhotoFile) {
        ktpPhotoUrl = await uploadProfileImage(
          user.id,
          formData.ktpPhotoFile,
          "documents",
          "ktp"
        );
      }

      // Build update object
      const updateData: any = {
        full_name: formData.fullName,
        birth_date: formData.birthDate ? format(formData.birthDate, "yyyy-MM-dd") : null,
        afk_origin: formData.afk,
        occupation: formData.occupation || null,
        profile_photo_url: profilePhotoUrl,
        ktp_photo_url: ktpPhotoUrl,
        is_profile_complete: true,
      };

      // Add license fields only for wasit
      if (isWasit) {
        updateData.license_level = formData.licenseLevel;
        updateData.license_photo_url = licensePhotoUrl;
      }

      // Update profile
      await updateProfile.mutateAsync(updateData);

      await refreshProfile();
      toast.success("Profil berhasil disimpan!");
      navigate(getRedirectPath());
    } catch (error: any) {
      toast.error("Gagal menyimpan profil: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleLabel = () => {
    switch (role) {
      case "wasit":
        return "Wasit";
      case "admin_provinsi":
        return "Admin Provinsi";
      case "admin_kab_kota":
        return "Admin Kab/Kota";
      case "panitia":
        return "Panitia";
      case "evaluator":
        return "Evaluator";
      default:
        return "User";
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
          {getRoleLabel()} - Langkah {step} dari {totalSteps}
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
                  onChange={(val, file) => handleImageChange("profilePhoto", "profilePhotoFile", val, file)}
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
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* AFK Origin */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Asal AFK / Kabupaten Kota <span className="text-destructive">*</span>
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
                {isWasit ? "Data Lisensi & Dokumen" : "Dokumen Pendukung"}
              </h2>

              {/* License Level - Only for Wasit */}
              {isWasit && (
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
              )}

              {/* License Photo - Only for Wasit */}
              {isWasit && (
                <ImageUpload
                  label="Foto Lisensi *"
                  value={formData.licensePhoto || undefined}
                  onChange={(val, file) => handleImageChange("licensePhoto", "licensePhotoFile", val, file)}
                />
              )}

              {/* KTP Photo - For all roles */}
              <ImageUpload
                label="Foto KTP *"
                value={formData.ktpPhoto || undefined}
                onChange={(val, file) => handleImageChange("ktpPhoto", "ktpPhotoFile", val, file)}
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
                  disabled={!isStep2Valid() || isLoading}
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
          Data Anda akan diverifikasi oleh Admin sebelum dapat mengakses fitur lengkap
        </p>
      </div>
    </div>
  );
}
