
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import CitizenDashboard from "./pages/citizen/CitizenDashboard";
import ContractorDashboard from "./pages/contractor/ContractorDashboard";
import GovernmentDashboard from "./pages/government/GovernmentDashboard";
import CitizenReportIssue from "./pages/citizen/CitizenReportIssue";
import CitizenTrackReports from "./pages/citizen/CitizenTrackReports";
import CitizenCommunityVoting from "./pages/citizen/CitizenCommunityVoting";
import CitizenWorkforce from "./pages/citizen/CitizenWorkforce";
import ContractorBidding from "./pages/contractor/ContractorBidding";
import ContractorProjects from "./pages/contractor/ContractorProjects";
import ContractorVerification from "./pages/contractor/ContractorVerification";
import GovernmentProjects from "./pages/government/GovernmentProjects";
import GovernmentReports from "./pages/government/GovernmentReports";
import GovernmentEscrow from "./pages/government/GovernmentEscrow";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          
          {/* Citizen Routes */}
          <Route path="/citizen" element={<CitizenDashboard />} />
          <Route path="/citizen/report" element={<CitizenReportIssue />} />
          <Route path="/citizen/track" element={<CitizenTrackReports />} />
          <Route path="/citizen/voting" element={<CitizenCommunityVoting />} />
          <Route path="/citizen/workforce" element={<CitizenWorkforce />} />
          
          {/* Contractor Routes */}
          <Route path="/contractor" element={<ContractorDashboard />} />
          <Route path="/contractor/bidding" element={<ContractorBidding />} />
          <Route path="/contractor/projects" element={<ContractorProjects />} />
          <Route path="/contractor/verification" element={<ContractorVerification />} />
          
          {/* Government Routes */}
          <Route path="/government" element={<GovernmentDashboard />} />
          <Route path="/government/projects" element={<GovernmentProjects />} />
          <Route path="/government/reports" element={<GovernmentReports />} />
          <Route path="/government/escrow" element={<GovernmentEscrow />} />
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
