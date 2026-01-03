import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
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
  LayoutDashboard,
  CalendarDays,
  Wallet,
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
  DialogFooter,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { ImageUpload } from "@/components/ui/image-upload";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useUpdateProfile, uploadProfileImage } from "@/hooks/useProfile";
import { toast } from "sonner";

// AFK options
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
  { value: "level_3", label: "Level 3", description: "Lisensi Dasar" },
  { value: "level_2", label: "Level 2", description: "Lisensi Menengah" },
  { value: "level_1", label: "Level 1", description: "Lisensi Tertinggi" },
];

interface ProfileData {
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

export default function RefereeProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showDocumentDialog, setShowDocumentDialog] = useState<"license" | "ktp" | null>(null);

  const [profileData, setProfileData] = useState<ProfileData>({
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

  const [editData, setEditData] = useState<ProfileData>(profileData);

  // Sync profile data from database
  useEffect(() => {
    if (profile) {
      const data: ProfileData = {
        profilePhoto: profile.profile_photo_url,
        profilePhotoFile: null,
        fullName: profile.full_name || "",
        birthDate: profile.birth_date ? new Date(profile.birth_date) : undefined,
        afk: profile.afk_origin || "",
        occupation: profile.occupation || "",
        licenseLevel: profile.license_level || "",
        licensePhoto: profile.license_photo_url,
        licensePhotoFile: null,
        ktpPhoto: profile.ktp_photo_url,
        ktpPhotoFile: null,
      };
      setProfileData(data);
      setEditData(data);
    }
  }, [profile]);

  const updateEditData = (field: keyof ProfileData, value: any) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (
    field: "profilePhoto" | "licensePhoto" | "ktpPhoto",
    fileField: "profilePhotoFile" | "licensePhotoFile" | "ktpPhotoFile",
    value: string | undefined,
    file?: File
  ) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value || null,
      [fileField]: file || null,
    }));
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
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      let profilePhotoUrl = editData.profilePhoto;
      let licensePhotoUrl = editData.licensePhoto;
      let ktpPhotoUrl = editData.ktpPhoto;

      // Upload new photos if files selected
      if (editData.profilePhotoFile) {
        profilePhotoUrl = await uploadProfileImage(
          user.id,
          editData.profilePhotoFile,
          "avatars",
          "profile"
        );
      }

      if (editData.licensePhotoFile) {
        licensePhotoUrl = await uploadProfileImage(
          user.id,
          editData.licensePhotoFile,
          "documents",
          "license"
        );
      }

      if (editData.ktpPhotoFile) {
        ktpPhotoUrl = await uploadProfileImage(
          user.id,
          editData.ktpPhotoFile,
          "documents",
          "ktp"
        );
      }

      await updateProfile.mutateAsync({
        full_name: editData.fullName,
        birth_date: editData.birthDate ? format(editData.birthDate, "yyyy-MM-dd") : null,
        afk_origin: editData.afk || null,
        occupation: editData.occupation || null,
        license_level: editData.licenseLevel || null,
        profile_photo_url: profilePhotoUrl,
        license_photo_url: licensePhotoUrl,
        ktp_photo_url: ktpPhotoUrl,
      });

      setIsEditing(false);
    } catch (error: any) {
      toast.error("Gagal menyimpan profil: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/referee" },
    { icon: CalendarDays, label: "Event", path: "/referee/events" },
    { icon: Wallet, label: "Honor", path: "/referee/honor" },
    { icon: User, label: "Profil", path: "/referee/profile" },
  ];

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
              onChange={(val, file) => handleImageChange("profilePhoto", "profilePhotoFile", val, file)}
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
                {profileData.fullName || "Nama belum diisi"}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <StatusBadge
                  status={profile?.is_profile_complete ? "success" : "warning"}
                >
                  {profile?.is_profile_complete ? "Terverifikasi" : "Pending"}
                </StatusBadge>
                {profileData.licenseLevel && (
                  <span className="text-sm text-primary-foreground/80">
                    {getLicenseLabel(profileData.licenseLevel)}
                  </span>
                )}
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
                onChange={(val, file) => handleImageChange("licensePhoto", "licensePhotoFile", val, file)}
              />

              {/* KTP Photo */}
              <ImageUpload
                label="Foto KTP"
                value={editData.ktpPhoto || undefined}
                onChange={(val, file) => handleImageChange("ktpPhoto", "ktpPhotoFile", val, file)}
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
                    <p className="text-sm font-medium">{getAfkLabel(profileData.afk) || "-"}</p>
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
                      {getLicenseLabel(profileData.licenseLevel) || "-"}
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
                    disabled={!profileData.licensePhoto}
                  >
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="flex-1 text-left text-sm">Foto Lisensi</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button
                    className="w-full flex items-center gap-3 p-3 bg-background rounded-lg border border-border"
                    onClick={() => setShowDocumentDialog("ktp")}
                    disabled={!profileData.ktpPhoto}
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
            <DialogTitle>Konfirmasi Keluar</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Apakah Anda yakin ingin keluar dari akun ini?
          </p>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowLogoutDialog(false)}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="flex-1"
            >
              Keluar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
        <div className="grid grid-cols-4 h-16">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : ""}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
