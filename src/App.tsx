import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Public pages
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import PublicRefereeList from "./pages/PublicRefereeList";
import PublicRefereeDetail from "./pages/PublicRefereeDetail";
import PublicReviewSubmit from "./pages/PublicReviewSubmit";
import ReviewSuccess from "./pages/ReviewSuccess";
import Signup from "./pages/Signup";
import PendingApproval from "./pages/PendingApproval";
import UserApprovals from "./pages/UserApprovals";

// Admin pages
import Dashboard from "./pages/Dashboard";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import EventSubmission from "./pages/EventSubmission";
import Referees from "./pages/Referees";
import RefereeDetail from "./pages/RefereeDetail";
import RefereeAssignment from "./pages/RefereeAssignment";
import AdminHonorMonitoring from "./pages/AdminHonorMonitoring";
import Evaluations from "./pages/Evaluations";
import Organization from "./pages/Organization";
import Approvals from "./pages/Approvals";
import UserManagement from "./pages/UserManagement";
import AuditLogs from "./pages/AuditLogs";

// Referee pages
import RefereeDashboard from "./pages/RefereeDashboard";
import RefereeHonor from "./pages/RefereeHonor";
import RefereeProfile from "./pages/RefereeProfile";
import RefereeProfileComplete from "./pages/RefereeProfileComplete";
import ProfileComplete from "./pages/ProfileComplete";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public review routes - no auth required */}
            <Route path="/review" element={<PublicRefereeList />} />
            <Route path="/review/success" element={<ReviewSuccess />} />
            <Route path="/review/:id" element={<PublicReviewSubmit />} />
            <Route path="/review/:id/detail" element={<PublicRefereeDetail />} />

            {/* Auth routes */}
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/pending-approval" element={<PendingApproval />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Profile Complete - Universal for all roles */}
            <Route 
              path="/profile/complete" 
              element={
                <ProtectedRoute>
                  <ProfileComplete />
                </ProtectedRoute>
              } 
            />
            
            {/* Legacy route - redirect to new profile complete */}
            <Route 
              path="/referee/profile/complete" 
              element={
                <ProtectedRoute>
                  <ProfileComplete />
                </ProtectedRoute>
              } 
            />

            {/* Admin routes - accessible by admin_provinsi and admin_kab_kota */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute requireAdmin requireProfileComplete>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/events" 
              element={
                <ProtectedRoute requireRole={["admin_provinsi", "admin_kab_kota", "panitia"]} requireProfileComplete>
                  <Events />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/events/:id" 
              element={
                <ProtectedRoute requireRole={["admin_provinsi", "admin_kab_kota", "panitia"]} requireProfileComplete>
                  <EventDetail />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/events/submit" 
              element={
                <ProtectedRoute requireRole={["admin_provinsi", "admin_kab_kota", "panitia"]} requireProfileComplete>
                  <EventSubmission />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/referees" 
              element={
                <ProtectedRoute requireAdmin requireProfileComplete>
                  <Referees />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/referees/:id" 
              element={
                <ProtectedRoute requireAdmin requireProfileComplete>
                  <RefereeDetail />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/events/:id/assign-referees" 
              element={
                <ProtectedRoute requireAdmin requireProfileComplete>
                  <RefereeAssignment />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/honor" 
              element={
                <ProtectedRoute requireAdmin requireProfileComplete>
                  <AdminHonorMonitoring />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/evaluations" 
              element={
                <ProtectedRoute requireRole={["admin_provinsi", "admin_kab_kota", "evaluator"]} requireProfileComplete>
                  <Evaluations />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/organization" 
              element={
                <ProtectedRoute requireRole="admin_provinsi" requireProfileComplete>
                  <Organization />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/approvals" 
              element={
                <ProtectedRoute requireRole="admin_provinsi" requireProfileComplete>
                  <Approvals />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/user-approvals" 
              element={
                <ProtectedRoute requireAdmin requireProfileComplete>
                  <UserApprovals />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/users" 
              element={
                <ProtectedRoute requireRole="admin_provinsi" requireProfileComplete>
                  <UserManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/audit-logs" 
              element={
                <ProtectedRoute requireAdmin requireProfileComplete>
                  <AuditLogs />
                </ProtectedRoute>
              } 
            />

            {/* Referee/Wasit routes */}
            <Route 
              path="/referee" 
              element={
                <ProtectedRoute requireRole="wasit" requireProfileComplete>
                  <RefereeDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/referee/honor" 
              element={
                <ProtectedRoute requireRole="wasit" requireProfileComplete>
                  <RefereeHonor />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/referee/profile" 
              element={
                <ProtectedRoute requireRole="wasit" requireProfileComplete>
                  <RefereeProfile />
                </ProtectedRoute>
              } 
            />

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
