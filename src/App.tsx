import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthProvider } from "./contexts/AuthContext";

// Lazy load all pages for better initial load performance
const Landing = lazy(() => import("./pages/Landing"));
const About = lazy(() => import("./pages/About"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const Contact = lazy(() => import("./pages/Contact"));
const Auth = lazy(() => import("./pages/Auth"));
const ContractorDatabasePage = lazy(() => import("./pages/ContractorDatabase"));
const WorkforcePage = lazy(() => import("./pages/WorkforcePage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Citizen Routes
const CitizenDashboard = lazy(() => import("./pages/citizen/CitizenDashboard"));
const CitizenReportIssue = lazy(() => import("./pages/citizen/CitizenReportIssue"));
const CitizenTrackReports = lazy(() => import("./pages/citizen/CitizenTrackReports"));
const CitizenCommunityVoting = lazy(() => import("./pages/citizen/CitizenCommunityVoting"));
const CitizenSkillsRegistration = lazy(() => import("./pages/citizen/CitizenSkillsRegistration"));
const CitizenWorkforce = lazy(() => import("./pages/citizen/CitizenWorkforce"));
const CitizenUSSD = lazy(() => import("./pages/citizen/CitizenUSSD"));

// Contractor Routes
const ContractorDashboard = lazy(() => import("./pages/contractor/ContractorDashboard"));
const ContractorBidding = lazy(() => import("./pages/contractor/ContractorBidding"));
const ContractorProjects = lazy(() => import("./pages/contractor/ContractorProjects"));
const ContractorVerification = lazy(() => import("./pages/contractor/ContractorVerification"));
const ContractorTemplates = lazy(() => import("./pages/contractor/ContractorTemplates"));
const ContractorBidTracking = lazy(() => import("./pages/contractor/ContractorBidTracking"));

// Government Routes
const GovernmentDashboard = lazy(() => import("./pages/government/GovernmentDashboard"));
const GovernmentProjects = lazy(() => import("./pages/government/GovernmentProjects"));
const GovernmentReports = lazy(() => import("./pages/government/GovernmentReports"));
const GovernmentEscrow = lazy(() => import("./pages/government/GovernmentEscrow"));
const GovernmentVerification = lazy(() => import("./pages/government/GovernmentVerification"));
const GovernmentPaymentTransparency = lazy(() => import("./pages/government/GovernmentPaymentTransparency"));
const GovernmentBlockchain = lazy(() => import("./pages/government/GovernmentBlockchain"));
const GovernmentEACC = lazy(() => import("./pages/government/GovernmentEACC"));
const GovernmentBenchmarks = lazy(() => import("./pages/government/GovernmentBenchmarks"));
const GovernmentVerificationRequests = lazy(() => import("./pages/government/GovernmentVerificationRequests"));

// Loading component for suspense
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
    },
  },
});

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
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
                  <Route path="/contractor/templates" element={<ContractorTemplates />} />
                  <Route path="/contractor/tracking" element={<ContractorBidTracking />} />
                  
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
                  <Route path="/government/verification-requests" element={<GovernmentVerificationRequests />} />
                  
                  {/* Catch-all route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
