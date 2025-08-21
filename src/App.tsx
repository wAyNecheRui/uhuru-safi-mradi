import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import Landing from "./pages/Landing";
import About from "./pages/About";
import HowItWorks from "./pages/HowItWorks";
import Contact from "./pages/Contact";
import CitizenDashboard from "./pages/citizen/CitizenDashboard";
import ContractorDashboard from "./pages/contractor/ContractorDashboard";
import GovernmentDashboard from "./pages/government/GovernmentDashboard";
import CitizenReportIssue from "./pages/citizen/CitizenReportIssue";
import CitizenTrackReports from "./pages/citizen/CitizenTrackReports";
import CitizenCommunityVoting from "./pages/citizen/CitizenCommunityVoting";
import CitizenSkillsRegistration from "./pages/citizen/CitizenSkillsRegistration";
import CitizenWorkforce from "./pages/citizen/CitizenWorkforce";
import CitizenUSSD from "./pages/citizen/CitizenUSSD";
import ContractorBidding from "./pages/contractor/ContractorBidding";
import ContractorProjects from "./pages/contractor/ContractorProjects";
import ContractorVerification from "./pages/contractor/ContractorVerification";
import GovernmentProjects from "./pages/government/GovernmentProjects";
import GovernmentReports from "./pages/government/GovernmentReports";
import GovernmentEscrow from "./pages/government/GovernmentEscrow";
import GovernmentVerification from "./pages/government/GovernmentVerification";
import GovernmentPaymentTransparency from "./pages/government/GovernmentPaymentTransparency";
import GovernmentBlockchain from "./pages/government/GovernmentBlockchain";
import GovernmentEACC from "./pages/government/GovernmentEACC";
import GovernmentBenchmarks from "./pages/government/GovernmentBenchmarks";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import ContractorDatabasePage from "./pages/ContractorDatabase";
import WorkforcePage from "./pages/WorkforcePage";
import AnalyticsPage from "./pages/AnalyticsPage";
import { AuthProvider } from "./contexts/AuthContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  console.log('App component rendering...');
  
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/about" element={<About />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/contractor-database" element={<ContractorDatabasePage />} />
                <Route path="/workforce" element={<WorkforcePage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                
                {/* Citizen Routes */}
                <Route path="/citizen" element={<CitizenDashboard />} />
                <Route path="/citizen/report" element={<CitizenReportIssue />} />
                <Route path="/citizen/track" element={<CitizenTrackReports />} />
                <Route path="/citizen/voting" element={<CitizenCommunityVoting />} />
                <Route path="/citizen/skills" element={<CitizenSkillsRegistration />} />
                <Route path="/citizen/workforce" element={<CitizenWorkforce />} />
                <Route path="/citizen/ussd" element={<CitizenUSSD />} />
                
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
                <Route path="/government/verification" element={<GovernmentVerification />} />
                <Route path="/government/payments" element={<GovernmentPaymentTransparency />} />
                <Route path="/government/blockchain" element={<GovernmentBlockchain />} />
                <Route path="/government/eacc" element={<GovernmentEACC />} />
                <Route path="/government/benchmarks" element={<GovernmentBenchmarks />} />
                
                {/* Catch-all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
