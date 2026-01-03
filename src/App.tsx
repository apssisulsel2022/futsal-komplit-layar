import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Public pages
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";

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

// Referee pages
import RefereeDashboard from "./pages/RefereeDashboard";
import RefereeHonor from "./pages/RefereeHonor";
import RefereeProfile from "./pages/RefereeProfile";
import RefereeProfileComplete from "./pages/RefereeProfileComplete";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {/* Profile completion - no profile complete requirement */}
            <Route 
              path="/referee/profile/complete" 
              element={
                <ProtectedRoute>
                  <RefereeProfileComplete />
                </ProtectedRoute>
              } 
            />

            {/* Admin routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute requireRole="admin" requireProfileComplete>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/events" 
              element={
                <ProtectedRoute requireRole="admin" requireProfileComplete>
                  <Events />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/events/:id" 
              element={
                <ProtectedRoute requireRole="admin" requireProfileComplete>
                  <EventDetail />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/events/submit" 
              element={
                <ProtectedRoute requireRole="admin" requireProfileComplete>
                  <EventSubmission />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/referees" 
              element={
                <ProtectedRoute requireRole="admin" requireProfileComplete>
                  <Referees />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/referees/:id" 
              element={
                <ProtectedRoute requireRole="admin" requireProfileComplete>
                  <RefereeDetail />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/events/:id/assign-referees" 
              element={
                <ProtectedRoute requireRole="admin" requireProfileComplete>
                  <RefereeAssignment />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/honor" 
              element={
                <ProtectedRoute requireRole="admin" requireProfileComplete>
                  <AdminHonorMonitoring />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/evaluations" 
              element={
                <ProtectedRoute requireRole="admin" requireProfileComplete>
                  <Evaluations />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/organization" 
              element={
                <ProtectedRoute requireRole="admin" requireProfileComplete>
                  <Organization />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/approvals" 
              element={
                <ProtectedRoute requireRole="admin" requireProfileComplete>
                  <Approvals />
                </ProtectedRoute>
              } 
            />

            {/* Referee routes */}
            <Route 
              path="/referee" 
              element={
                <ProtectedRoute requireRole="referee" requireProfileComplete>
                  <RefereeDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/referee/honor" 
              element={
                <ProtectedRoute requireRole="referee" requireProfileComplete>
                  <RefereeHonor />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/referee/profile" 
              element={
                <ProtectedRoute requireRole="referee" requireProfileComplete>
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
