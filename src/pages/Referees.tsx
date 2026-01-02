import { useState } from "react";
import { Plus, Search, Filter, Star, ChevronRight, X, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const referees = [
  {
    id: 1,
    name: "Ahmad Rizky",
    license: "Lisensi A",
    kabKota: "Makassar",
    phone: "0812-3456-7890",
    email: "ahmad.rizky@email.com",
    rating: 4.8,
    totalMatches: 124,
    status: "active",
    totalEarnings: 15600000,
  },
  {
    id: 2,
    name: "Budi Santoso",
    license: "Lisensi A",
    kabKota: "Gowa",
    phone: "0813-4567-8901",
    email: "budi.santoso@email.com",
    rating: 4.6,
    totalMatches: 98,
    status: "active",
    totalEarnings: 12400000,
  },
  {
    id: 3,
    name: "Cahya Putra",
    license: "Lisensi B",
    kabKota: "Maros",
    phone: "0814-5678-9012",
    email: "cahya.putra@email.com",
    rating: 4.5,
    totalMatches: 76,
    status: "active",
    totalEarnings: 9500000,
  },
  {
    id: 4,
    name: "Dedi Wijaya",
    license: "Lisensi B",
    kabKota: "Makassar",
    phone: "0815-6789-0123",
    email: "dedi.wijaya@email.com",
    rating: 4.3,
    totalMatches: 52,
    status: "inactive",
    totalEarnings: 6800000,
  },
  {
    id: 5,
    name: "Eko Prasetyo",
    license: "Lisensi C",
    kabKota: "Takalar",
    phone: "0816-7890-1234",
    email: "eko.prasetyo@email.com",
    rating: 4.1,
    totalMatches: 28,
    status: "active",
    totalEarnings: 3500000,
  },
  {
    id: 6,
    name: "Fajar Ramadhan",
    license: "Lisensi C",
    kabKota: "Gowa",
    phone: "0817-8901-2345",
    email: "fajar.ramadhan@email.com",
    rating: 4.0,
    totalMatches: 15,
    status: "pending",
    totalEarnings: 1800000,
  },
];

const kabKotaOptions = ["Semua", "Makassar", "Gowa", "Maros", "Takalar"];
const licenseOptions = ["Semua", "Lisensi A", "Lisensi B", "Lisensi C"];
const statusOptions = ["Semua", "Aktif", "Non-Aktif", "Pending"];

export default function Referees() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    kabKota: "Semua",
    license: "Semua",
    status: "Semua",
  });
  const [tempFilters, setTempFilters] = useState(filters);

  const activeFilterCount = Object.values(filters).filter((v) => v !== "Semua").length;

  const getStatusValue = (status: string) => {
    switch (status) {
      case "active":
        return "Aktif";
      case "inactive":
        return "Non-Aktif";
      case "pending":
        return "Pending";
      default:
        return status;
    }
  };

  const filteredReferees = referees.filter((referee) => {
    const matchesSearch = referee.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesKabKota = filters.kabKota === "Semua" || referee.kabKota === filters.kabKota;
    const matchesLicense = filters.license === "Semua" || referee.license === filters.license;
    const matchesStatus = filters.status === "Semua" || getStatusValue(referee.status) === filters.status;
    return matchesSearch && matchesKabKota && matchesLicense && matchesStatus;
  });

  const handleApplyFilters = () => {
    setFilters(tempFilters);
    setFilterOpen(false);
  };

  const handleResetFilters = () => {
    const resetFilters = { kabKota: "Semua", license: "Semua", status: "Semua" };
    setTempFilters(resetFilters);
    setFilters(resetFilters);
  };

  const removeFilter = (key: keyof typeof filters) => {
    setFilters((prev) => ({ ...prev, [key]: "Semua" }));
    setTempFilters((prev) => ({ ...prev, [key]: "Semua" }));
  };

  return (
    <AppLayout title="Database Wasit">
      <div className="p-4 space-y-4 animate-fade-in">
        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-primary">{referees.length}</p>
              <p className="text-xs text-muted-foreground">Total Wasit</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-success">
                {referees.filter((r) => r.status === "active").length}
              </p>
              <p className="text-xs text-muted-foreground">Aktif</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-primary">4.5</p>
              <p className="text-xs text-muted-foreground">Avg Rating</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari wasit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <Filter className="h-4 w-4" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto max-h-[80vh]">
              <SheetHeader>
                <SheetTitle>Filter Wasit</SheetTitle>
                <SheetDescription>Pilih kriteria untuk memfilter daftar wasit</SheetDescription>
              </SheetHeader>
              <div className="py-6 space-y-4">
                <div className="space-y-2">
                  <Label>Kab/Kota</Label>
                  <Select
                    value={tempFilters.kabKota}
                    onValueChange={(value) => setTempFilters((prev) => ({ ...prev, kabKota: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Kab/Kota" />
                    </SelectTrigger>
                    <SelectContent>
                      {kabKotaOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Lisensi</Label>
                  <Select
                    value={tempFilters.license}
                    onValueChange={(value) => setTempFilters((prev) => ({ ...prev, license: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Lisensi" />
                    </SelectTrigger>
                    <SelectContent>
                      {licenseOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={tempFilters.status}
                    onValueChange={(value) => setTempFilters((prev) => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <SheetFooter className="flex-row gap-2">
                <Button variant="outline" className="flex-1" onClick={handleResetFilters}>
                  Reset
                </Button>
                <Button className="flex-1" onClick={handleApplyFilters}>
                  Terapkan Filter
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>

        {/* Active Filter Chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2">
            {filters.kabKota !== "Semua" && (
              <Badge variant="secondary" className="gap-1 pr-1">
                <MapPin className="h-3 w-3" />
                {filters.kabKota}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 hover:bg-transparent"
                  onClick={() => removeFilter("kabKota")}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {filters.license !== "Semua" && (
              <Badge variant="secondary" className="gap-1 pr-1">
                {filters.license}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 hover:bg-transparent"
                  onClick={() => removeFilter("license")}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {filters.status !== "Semua" && (
              <Badge variant="secondary" className="gap-1 pr-1">
                {filters.status}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 hover:bg-transparent"
                  onClick={() => removeFilter("status")}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
          </div>
        )}

        {/* Results Count */}
        <p className="text-sm text-muted-foreground">
          Menampilkan {filteredReferees.length} dari {referees.length} wasit
        </p>

        {/* Referee Grid/List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredReferees.map((referee) => (
            <Link key={referee.id} to={`/referees/${referee.id}`}>
              <Card className="hover:shadow-md transition-shadow h-full">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-14 w-14">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                        {referee.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{referee.name}</h3>
                          <p className="text-sm text-muted-foreground">{referee.license}</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {referee.kabKota}
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 text-sm">
                          <Star className="h-3.5 w-3.5 text-warning fill-warning" />
                          {referee.rating}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {referee.totalMatches} pertandingan
                        </span>
                      </div>
                      <div className="mt-2">
                        <StatusBadge
                          status={
                            referee.status === "active"
                              ? "success"
                              : referee.status === "pending"
                              ? "warning"
                              : "neutral"
                          }
                        >
                          {referee.status === "active"
                            ? "Aktif"
                            : referee.status === "pending"
                            ? "Pending"
                            : "Non-Aktif"}
                        </StatusBadge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {filteredReferees.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Tidak ada wasit yang ditemukan</p>
              <Button variant="link" onClick={handleResetFilters}>
                Reset filter
              </Button>
            </CardContent>
          </Card>
        )}

        {/* FAB */}
        <Button
          size="lg"
          className="fixed bottom-24 right-4 md:bottom-8 rounded-full shadow-lg h-14 w-14 p-0"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </AppLayout>
  );
}
