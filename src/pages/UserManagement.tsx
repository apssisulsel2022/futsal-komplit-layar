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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { useUsers, useKabupatenKota, useCreateUser, useUpdateUserRole, useUpdateUserKabupatenKota } from "@/hooks/useUsers";
import { UserPlus, Search, Edit2, Loader2 } from "lucide-react";
import type { AppRole } from "@/contexts/AuthContext";

const ROLE_LABELS: Record<AppRole, string> = {
  admin_provinsi: "Admin Provinsi",
  admin_kab_kota: "Admin Kab/Kota",
  panitia: "Panitia",
  wasit: "Wasit",
  evaluator: "Evaluator",
};

const ROLE_COLORS: Record<AppRole, string> = {
  admin_provinsi: "bg-primary text-primary-foreground",
  admin_kab_kota: "bg-accent text-accent-foreground",
  panitia: "bg-info text-info-foreground",
  wasit: "bg-success text-success-foreground",
  evaluator: "bg-warning text-warning-foreground",
};

export default function UserManagement() {
  const { toast } = useToast();
  const { data: users, isLoading: usersLoading } = useUsers();
  const { data: kabupatenKotaList } = useKabupatenKota();
  const createUserMutation = useCreateUser();
  const updateRoleMutation = useUpdateUserRole();
  const updateKabKotaMutation = useUpdateUserKabupatenKota();

  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<typeof users extends (infer T)[] ? T : never | null>(null);

  // Create user form state
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState<AppRole | "">("");
  const [newUserKabKota, setNewUserKabKota] = useState<string>("");

  // Edit user form state
  const [editRole, setEditRole] = useState<AppRole | "">("");
  const [editKabKota, setEditKabKota] = useState<string>("");

  const filteredUsers = users?.filter((user) =>
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword || !newUserName || !newUserRole) {
      toast({
        title: "Error",
        description: "Mohon lengkapi semua field yang diperlukan",
        variant: "destructive",
      });
      return;
    }

    if (newUserRole !== "admin_provinsi" && !newUserKabKota) {
      toast({
        title: "Error",
        description: "Kabupaten/Kota wajib dipilih untuk role ini",
        variant: "destructive",
      });
      return;
    }

    try {
      await createUserMutation.mutateAsync({
        email: newUserEmail,
        password: newUserPassword,
        full_name: newUserName,
        role: newUserRole as AppRole,
        kabupaten_kota_id: newUserRole === "admin_provinsi" ? undefined : newUserKabKota,
      });

      toast({
        title: "Berhasil",
        description: "User berhasil dibuat",
      });

      // Reset form
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserName("");
      setNewUserRole("");
      setNewUserKabKota("");
      setIsCreateDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal membuat user",
        variant: "destructive",
      });
    }
  };

  const handleEditUser = (user: typeof selectedUser) => {
    setSelectedUser(user);
    setEditRole(user?.role || "");
    setEditKabKota(user?.kabupaten_kota_id || "");
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;

    try {
      // Update role if changed
      if (editRole && editRole !== selectedUser.role) {
        await updateRoleMutation.mutateAsync({
          userId: selectedUser.id,
          role: editRole as AppRole,
        });
      }

      // Update kabupaten/kota if changed
      if (editKabKota !== (selectedUser.kabupaten_kota_id || "")) {
        await updateKabKotaMutation.mutateAsync({
          userId: selectedUser.id,
          kabupatenKotaId: editKabKota || null,
        });
      }

      toast({
        title: "Berhasil",
        description: "User berhasil diperbarui",
      });

      setIsEditDialogOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal memperbarui user",
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout title="Manajemen User">
      <div className="p-4 space-y-4 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Tambah User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Tambah User Baru</DialogTitle>
                <DialogDescription>
                  Buat akun user baru dengan role dan wilayah yang ditentukan
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimal 6 karakter"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Lengkap</Label>
                  <Input
                    id="name"
                    placeholder="Nama lengkap user"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={newUserRole} onValueChange={(val) => setNewUserRole(val as AppRole)}>
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
                {newUserRole && newUserRole !== "admin_provinsi" && (
                  <div className="space-y-2">
                    <Label htmlFor="kabkota">Kabupaten/Kota</Label>
                    <Select value={newUserKabKota} onValueChange={setNewUserKabKota}>
                      <SelectTrigger>
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
                )}
                <Button
                  className="w-full"
                  onClick={handleCreateUser}
                  disabled={createUserMutation.isPending}
                >
                  {createUserMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Membuat...
                    </>
                  ) : (
                    "Buat User"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar User</CardTitle>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Kabupaten/Kota</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {user.full_name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.full_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.role ? (
                          <Badge className={ROLE_COLORS[user.role]}>
                            {ROLE_LABELS[user.role]}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Belum ada role</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.kabupaten_kota?.name || (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredUsers?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Tidak ada user ditemukan
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Ubah role atau wilayah untuk {selectedUser?.full_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select value={editRole} onValueChange={(val) => setEditRole(val as AppRole)}>
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
                  <Label htmlFor="edit-kabkota">Kabupaten/Kota</Label>
                  <Select value={editKabKota} onValueChange={setEditKabKota}>
                    <SelectTrigger>
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
              )}
              <Button
                className="w-full"
                onClick={handleSaveEdit}
                disabled={updateRoleMutation.isPending || updateKabKotaMutation.isPending}
              >
                {(updateRoleMutation.isPending || updateKabKotaMutation.isPending) ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Perubahan"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
