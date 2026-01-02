import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Calendar,
  MapPin,
  Briefcase,
  Award,
  FileText,
  Edit3,
  LogOut,
  ChevronRight,
  Home,
  CalendarDays,
  DollarSign,
  Camera,
  Check,
  X,
  Loader2,
} from "lucide-react";
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
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { ImageUpload } from "@/components/ui/image-upload";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";

// Mock data for AFK options
const afkOptions = [
  { value: "makassar", label: "AFK Kota Makassar" },
  { value: "gowa", label: "AFK Kabupaten Gowa" },
  { value: "maros", label: "AFK Kabupaten Maros" },
  { value: "takalar", label: "AFK Kabupaten Takalar" },
  { value: "bone", label: "AFK Kabupaten Bone" },
  { value: "bulukumba", label: "AFK Kabupaten Bulukumba" },
  { value: "sinjai", label: "AFK Kabupaten Sinjai" },
  { value: "wajo", label: "AFK Kabupaten Wajo" },
];

const licenseOptions = [
  { value: "level-3", label: "Level 3", description: "Lisensi Dasar" },
  { value: "level-2", label: "Level 2", description: "Lisensi Menengah" },
  { value: "level-1", label: "Level 1", description: "Lisensi Tertinggi" },
];

// Mock profile data
const mockProfile = {
  profilePhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
  fullName: "Ahmad Fauzi Rahman",
  email: "ahmad.fauzi@email.com",
  birthDate: new Date(1990, 5, 15),
  afk: "makassar",
  occupation: "Guru Olahraga",
  licenseLevel: "level-2",
  licensePhoto: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300&h=200&fit=crop",
  ktpPhoto: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300&h=200&fit=crop",
  verificationStatus: "verified" as const,
};

interface ProfileData {
  profilePhoto: string | null;
  fullName: string;
  birthDate: Date | undefined;
  afk: string;
  occupation: string;
  licenseLevel: string;
  licensePhoto: string | null;
  ktpPhoto: string | null;
}

export default function RefereeProfile() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showDocumentDialog, setShowDocumentDialog] = useState<"license" | "ktp" | null>(null);

  const [profileData, setProfileData] = useState<ProfileData>({
    profilePhoto: mockProfile.profilePhoto,
    fullName: mockProfile.fullName,
    birthDate: mockProfile.birthDate,
    afk: mockProfile.afk,
    occupation: mockProfile.occupation,
    licenseLevel: mockProfile.licenseLevel,
    licensePhoto: mockProfile.licensePhoto,
    ktpPhoto: mockProfile.ktpPhoto,
  });

  const [editData, setEditData] = useState<ProfileData>(profileData);

  const updateEditData = (field: keyof ProfileData, value: any) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const getAfkLabel = (value: string) => {
    return afkOptions.find((opt) => opt.value === value)?.label || value;
  };

  const getLicenseLabel = (value: string) => {
    return licenseOptions.find((opt) => opt.value === value)?.label || value;
  };

  const handleStartEdit = () => {
    setEditData(profileData);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData(profileData);
  };

  const handleSaveEdit = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setProfileData(editData);
      setIsEditing(false);
      setIsLoading(false);
    }, 1000);
  };

  const handleLogout = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-accent px-6 pt-8 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-bold text-primary-foreground">
            Profil Wasit
          </h1>
          {!isEditing ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-primary-foreground hover:bg-primary-foreground/10"
              onClick={handleStartEdit}
            >
              <Edit3 className="w-4 h-4 mr-1" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-primary-foreground hover:bg-primary-foreground/10"
                onClick={handleCancelEdit}
              >
                <X className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary-foreground hover:bg-primary-foreground/10"
                onClick={handleSaveEdit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Profile Photo */}
        <div className="flex flex-col items-center">
          {isEditing ? (
            <ImageUpload
              variant="avatar"
              value={editData.profilePhoto || undefined}
              onChange={(val) => updateEditData("profilePhoto", val)}
            />
          ) : (
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary-foreground/30">
                {profileData.profilePhoto ? (
                  <img
                    src={profileData.profilePhoto}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary-foreground/20 flex items-center justify-center">
                    <User className="w-10 h-10 text-primary-foreground/50" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary-foreground flex items-center justify-center">
                <Camera className="w-4 h-4 text-primary" />
              </div>
            </div>
          )}

          {!isEditing && (
            <>
              <h2 className="text-xl font-bold text-primary-foreground mt-3">
                {profileData.fullName}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <StatusBadge
                  status={mockProfile.verificationStatus === "verified" ? "success" : "warning"}
                >
                  {mockProfile.verificationStatus === "verified" ? "Terverifikasi" : "Pending"}
                </StatusBadge>
                <span className="text-sm text-primary-foreground/80">
                  {getLicenseLabel(profileData.licenseLevel)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Profile Content */}
      <div className="px-4 -mt-8">
        <div className="bg-card rounded-2xl shadow-lg border border-border overflow-hidden">
          {isEditing ? (
            <div className="p-5 space-y-4">
              {/* Full Name */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Nama Lengkap</Label>
                <Input
                  value={editData.fullName}
                  onChange={(e) => updateEditData("fullName", e.target.value)}
                  className="h-11"
                />
              </div>

              {/* Birth Date */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tanggal Lahir</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full h-11 justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editData.birthDate
                        ? format(editData.birthDate, "dd MMMM yyyy", { locale: id })
                        : "Pilih tanggal"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={editData.birthDate}
                      onSelect={(date) => updateEditData("birthDate", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* AFK */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Asal AFK</Label>
                <Select
                  value={editData.afk}
                  onValueChange={(val) => updateEditData("afk", val)}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
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
                <Label className="text-sm font-medium">Pekerjaan</Label>
                <Input
                  value={editData.occupation}
                  onChange={(e) => updateEditData("occupation", e.target.value)}
                  className="h-11"
                />
              </div>

              {/* License Level */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Level Lisensi</Label>
                <RadioGroup
                  value={editData.licenseLevel}
                  onValueChange={(val) => updateEditData("licenseLevel", val)}
                  className="space-y-2"
                >
                  {licenseOptions.map((option) => (
                    <div
                      key={option.value}
                      className={cn(
                        "flex items-center space-x-3 rounded-lg border p-3 cursor-pointer",
                        editData.licenseLevel === option.value
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      )}
                      onClick={() => updateEditData("licenseLevel", option.value)}
                    >
                      <RadioGroupItem value={option.value} id={`edit-${option.value}`} />
                      <Label htmlFor={`edit-${option.value}`} className="text-sm cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* License Photo */}
              <ImageUpload
                label="Foto Lisensi"
                value={editData.licensePhoto || undefined}
                onChange={(val) => updateEditData("licensePhoto", val)}
              />

              {/* KTP Photo */}
              <ImageUpload
                label="Foto KTP"
                value={editData.ktpPhoto || undefined}
                onChange={(val) => updateEditData("ktpPhoto", val)}
              />
            </div>
          ) : (
            <>
              {/* Info Section */}
              <div className="divide-y divide-border">
                <div className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Tanggal Lahir</p>
                    <p className="text-sm font-medium">
                      {profileData.birthDate
                        ? format(profileData.birthDate, "dd MMMM yyyy", { locale: id })
                        : "-"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Asal AFK</p>
                    <p className="text-sm font-medium">{getAfkLabel(profileData.afk)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Pekerjaan</p>
                    <p className="text-sm font-medium">{profileData.occupation || "-"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Award className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Level Lisensi</p>
                    <p className="text-sm font-medium">
                      {getLicenseLabel(profileData.licenseLevel)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Documents Section */}
              <div className="p-4 bg-muted/30">
                <h3 className="text-sm font-semibold mb-3">Dokumen</h3>
                <div className="space-y-2">
                  <button
                    className="w-full flex items-center gap-3 p-3 bg-background rounded-lg border border-border"
                    onClick={() => setShowDocumentDialog("license")}
                  >
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="flex-1 text-left text-sm">Foto Lisensi</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button
                    className="w-full flex items-center gap-3 p-3 bg-background rounded-lg border border-border"
                    onClick={() => setShowDocumentDialog("ktp")}
                  >
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="flex-1 text-left text-sm">Foto KTP</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Logout Button */}
              <div className="p-4">
                <Button
                  variant="outline"
                  className="w-full h-12 text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => setShowLogoutDialog(true)}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Keluar
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Document Preview Dialog */}
      <Dialog
        open={showDocumentDialog !== null}
        onOpenChange={() => setShowDocumentDialog(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {showDocumentDialog === "license" ? "Foto Lisensi" : "Foto KTP"}
            </DialogTitle>
          </DialogHeader>
          <div className="aspect-[4/3] w-full rounded-lg overflow-hidden bg-muted">
            <img
              src={
                showDocumentDialog === "license"
                  ? profileData.licensePhoto || ""
                  : profileData.ktpPhoto || ""
              }
              alt={showDocumentDialog === "license" ? "Lisensi" : "KTP"}
              className="w-full h-full object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Keluar dari Akun?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Anda akan keluar dari aplikasi dan perlu login kembali.
          </p>
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowLogoutDialog(false)}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleLogout}
            >
              Keluar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-2 z-50">
        <div className="flex justify-around items-center max-w-md mx-auto">
          <button
            onClick={() => navigate("/referee")}
            className="flex flex-col items-center gap-1 py-2 px-3 text-muted-foreground"
          >
            <Home className="w-5 h-5" />
            <span className="text-xs">Beranda</span>
          </button>
          <button
            onClick={() => navigate("/referee")}
            className="flex flex-col items-center gap-1 py-2 px-3 text-muted-foreground"
          >
            <CalendarDays className="w-5 h-5" />
            <span className="text-xs">Event</span>
          </button>
          <button
            onClick={() => navigate("/referee/honor")}
            className="flex flex-col items-center gap-1 py-2 px-3 text-muted-foreground"
          >
            <DollarSign className="w-5 h-5" />
            <span className="text-xs">Honor</span>
          </button>
          <button className="flex flex-col items-center gap-1 py-2 px-3 text-primary">
            <User className="w-5 h-5" />
            <span className="text-xs font-medium">Profil</span>
          </button>
        </div>
      </div>
    </div>
  );
}
