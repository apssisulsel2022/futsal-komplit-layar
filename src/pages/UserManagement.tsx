import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { 
  useUsers, 
  useKabupatenKota, 
  useCreateUser, 
  useUpdateUserRole, 
  useUpdateUserKabupatenKota,
  useDeleteUser,
  useResetUserPassword 
} from "@/hooks/useUsers";
import type { AppRole } from "@/contexts/AuthContext";
import { 
  Plus, 
  Search, 
  Edit, 
  Loader2, 
  Eye, 
  EyeOff, 
  Trash2, 
  KeyRound 
} from "lucide-react";
import { z } from "zod";
import { createUserSchema, passwordSchema } from "@/lib/validations";

const ROLE_LABELS: Record<AppRole, string> = {
  admin_provinsi: "Admin Provinsi",
  admin_kab_kota: "Admin Kab/Kota",
  panitia: "Panitia",
  wasit: "Wasit",
  evaluator: "Evaluator",
};

const ROLE_COLORS: Record<AppRole, string> = {
  admin_provinsi: "bg-purple-100 text-purple-700",
  admin_kab_kota: "bg-blue-100 text-blue-700",
  panitia: "bg-green-100 text-green-700",
  wasit: "bg-orange-100 text-orange-700",
  evaluator: "bg-pink-100 text-pink-700",
};

export default function UserManagement() {
  const { toast } = useToast();
  const { data: users, isLoading: usersLoading } = useUsers();
  const { data: kabupatenKotaList } = useKabupatenKota();
  const createUser = useCreateUser();
  const updateRole = useUpdateUserRole();
  const updateKabupatenKota = useUpdateUserKabupatenKota();
  const deleteUser = useDeleteUser();
  const resetPassword = useResetUserPassword();

  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<typeof users extends (infer T)[] ? T : never | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Form states
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formFullName, setFormFullName] = useState("");
  const [formRole, setFormRole] = useState<AppRole | "">("");
  const [formKabupatenKotaId, setFormKabupatenKotaId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Edit form states
  const [editRole, setEditRole] = useState<AppRole | "">("");
  const [editKabupatenKotaId, setEditKabupatenKotaId] = useState("");

  // Reset password form
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const filteredUsers = users?.filter((user) =>
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.kabupaten_kota?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = () => {
    setFormEmail("");
    setFormPassword("");
    setFormFullName("");
    setFormRole("");
    setFormKabupatenKotaId("");
    setFormError(null);
    setShowPassword(false);
  };

  const handleCreateUser = async () => {
    setFormError(null);

    // Validate with Zod
    try {
      createUserSchema.parse({
        email: formEmail,
        password: formPassword,
        full_name: formFullName,
        role: formRole,
        kabupaten_kota_id: formKabupatenKotaId || undefined,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        setFormError(err.errors[0].message);
        return;
      }
    }

    // Additional validation for kabupaten_kota
    if (formRole !== "admin_provinsi" && !formKabupatenKotaId) {
      setFormError("Kabupaten/Kota wajib dipilih untuk role ini");
      return;
    }

    try {
      await createUser.mutateAsync({
        email: formEmail,
        password: formPassword,
        full_name: formFullName,
        role: formRole as AppRole,
        kabupaten_kota_id: formKabupatenKotaId || undefined,
      });

      toast({
        title: "User Berhasil Dibuat",
        description: `User ${formFullName} berhasil ditambahkan`,
      });

      setIsAddDialogOpen(false);
      resetForm();
    } catch (error: any) {
      setFormError(error.message || "Gagal membuat user");
    }
  };

  const handleEditUser = (user: typeof users extends (infer T)[] ? T : never) => {
    setSelectedUser(user);
    setEditRole(user.role || "");
    setEditKabupatenKotaId(user.kabupaten_kota_id || "");
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;

    try {
      // Update role if changed
      if (editRole && editRole !== selectedUser.role) {
        await updateRole.mutateAsync({
          userId: selectedUser.id,
          role: editRole as AppRole,
        });
      }

      // Update kabupaten_kota if changed
      if (editKabupatenKotaId !== selectedUser.kabupaten_kota_id) {
        await updateKabupatenKota.mutateAsync({
          userId: selectedUser.id,
          kabupatenKotaId: editKabupatenKotaId || null,
        });
      }

      toast({
        title: "User Berhasil Diupdate",
        description: `Data user ${selectedUser.full_name} berhasil diperbarui`,
      });

      setIsEditDialogOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      toast({
        title: "Gagal Update User",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (user: typeof users extends (infer T)[] ? T : never) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;

    try {
      await deleteUser.mutateAsync(selectedUser.id);
      toast({
        title: "User Berhasil Dihapus",
        description: `User ${selectedUser.full_name} telah dihapus`,
      });
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      toast({
        title: "Gagal Hapus User",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleResetPasswordClick = (user: typeof users extends (infer T)[] ? T : never) => {
    setSelectedUser(user);
    setNewPassword("");
    setConfirmNewPassword("");
    setFormError(null);
    setShowNewPassword(false);
    setIsResetPasswordDialogOpen(true);
  };

  const handleConfirmResetPassword = async () => {
    if (!selectedUser) return;

    setFormError(null);

    // Validate password
    try {
      passwordSchema.parse(newPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setFormError(err.errors[0].message);
        return;
      }
    }

    if (newPassword !== confirmNewPassword) {
      setFormError("Password dan konfirmasi password tidak cocok");
      return;
    }

    try {
      await resetPassword.mutateAsync({
        userId: selectedUser.id,
        newPassword,
      });
      toast({
        title: "Password Berhasil Direset",
        description: `Password untuk ${selectedUser.full_name} telah diubah`,
      });
      setIsResetPasswordDialogOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      setFormError(error.message || "Gagal reset password");
    }
  };

  return (
    <AppLayout title="Manajemen User">
      <div className="space-y-4 p-4">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Daftar User</CardTitle>
              <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                setIsAddDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Tambah User
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Tambah User Baru</DialogTitle>
                    <DialogDescription>
                      Buat akun baru untuk anggota federasi
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {formError && (
                      <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                        {formError}
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Nama Lengkap</Label>
                      <Input
                        value={formFullName}
                        onChange={(e) => setFormFullName(e.target.value)}
                        placeholder="Masukkan nama lengkap"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        placeholder="nama@email.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={formPassword}
                          onChange={(e) => setFormPassword(e.target.value)}
                          placeholder="Minimal 8 karakter"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Password harus mengandung huruf dan angka
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select value={formRole} onValueChange={(v) => setFormRole(v as AppRole)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin_provinsi">Admin Provinsi</SelectItem>
                          <SelectItem value="admin_kab_kota">Admin Kab/Kota</SelectItem>
                          <SelectItem value="panitia">Panitia</SelectItem>
                          <SelectItem value="wasit">Wasit</SelectItem>
                          <SelectItem value="evaluator">Evaluator</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {formRole && formRole !== "admin_provinsi" && (
                      <div className="space-y-2">
                        <Label>Kabupaten/Kota</Label>
                        <Select value={formKabupatenKotaId} onValueChange={setFormKabupatenKotaId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih kabupaten/kota" />
                          </SelectTrigger>
                          <SelectContent>
                            {kabupatenKotaList?.map((kab) => (
                              <SelectItem key={kab.id} value={kab.id}>
                                {kab.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleCreateUser}
                      disabled={createUser.isPending}
                    >
                      {createUser.isPending && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      Simpan
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {usersLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredUsers && filteredUsers.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Kabupaten/Kota</TableHead>
                      <TableHead className="w-[100px]">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {user.full_name?.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{user.full_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.role ? (
                            <Badge className={ROLE_COLORS[user.role]} variant="secondary">
                              {ROLE_LABELS[user.role]}
                            </Badge>
                          ) : (
                            <Badge variant="outline">Belum Assign</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.kabupaten_kota?.name || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditUser(user)}
                              title="Edit User"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleResetPasswordClick(user)}
                              title="Reset Password"
                            >
                              <KeyRound className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(user)}
                              title="Hapus User"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? "Tidak ada user yang ditemukan" : "Belum ada user"}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Ubah role atau kabupaten/kota untuk {selectedUser?.full_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={editRole} onValueChange={(v) => setEditRole(v as AppRole)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin_provinsi">Admin Provinsi</SelectItem>
                    <SelectItem value="admin_kab_kota">Admin Kab/Kota</SelectItem>
                    <SelectItem value="panitia">Panitia</SelectItem>
                    <SelectItem value="wasit">Wasit</SelectItem>
                    <SelectItem value="evaluator">Evaluator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editRole && editRole !== "admin_provinsi" && (
                <div className="space-y-2">
                  <Label>Kabupaten/Kota</Label>
                  <Select value={editKabupatenKotaId} onValueChange={setEditKabupatenKotaId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kabupaten/kota" />
                    </SelectTrigger>
                    <SelectContent>
                      {kabupatenKotaList?.map((kab) => (
                        <SelectItem key={kab.id} value={kab.id}>
                          {kab.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                onClick={handleSaveEdit}
                disabled={updateRole.isPending || updateKabupatenKota.isPending}
              >
                {(updateRole.isPending || updateKabupatenKota.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus User?</AlertDialogTitle>
              <AlertDialogDescription>
                Anda yakin ingin menghapus user <strong>{selectedUser?.full_name}</strong>? 
                Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteUser.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Reset Password Dialog */}
        <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription>
                Ubah password untuk {selectedUser?.full_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {formError && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {formError}
                </div>
              )}
              <div className="space-y-2">
                <Label>Password Baru</Label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Password harus mengandung huruf dan angka
                </p>
              </div>
              <div className="space-y-2">
                <Label>Konfirmasi Password</Label>
                <Input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleConfirmResetPassword}
                disabled={resetPassword.isPending}
              >
                {resetPassword.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Reset Password
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
