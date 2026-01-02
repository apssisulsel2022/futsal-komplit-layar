import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import EventSubmission from "./pages/EventSubmission";
import Referees from "./pages/Referees";
import RefereeDetail from "./pages/RefereeDetail";
import Evaluations from "./pages/Evaluations";
import Organization from "./pages/Organization";
import Approvals from "./pages/Approvals";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/events/submit" element={<EventSubmission />} />
          <Route path="/referees" element={<Referees />} />
          <Route path="/referees/:id" element={<RefereeDetail />} />
          <Route path="/evaluations" element={<Evaluations />} />
          <Route path="/organization" element={<Organization />} />
          <Route path="/approvals" element={<Approvals />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
