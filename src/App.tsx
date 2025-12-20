import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

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
const CitizenProjects = lazy(() => import("./pages/citizen/CitizenProjects"));
const CitizenTransparency = lazy(() => import("./pages/citizen/CitizenTransparency"));
const CitizenNotifications = lazy(() => import("./pages/citizen/CitizenNotifications"));
const CitizenGuide = lazy(() => import("./pages/citizen/CitizenGuide"));

// Contractor Routes
const ContractorDashboard = lazy(() => import("./pages/contractor/ContractorDashboard"));
const ContractorBidding = lazy(() => import("./pages/contractor/ContractorBidding"));
const ContractorProjects = lazy(() => import("./pages/contractor/ContractorProjects"));
const ContractorVerification = lazy(() => import("./pages/contractor/ContractorVerification"));
const ContractorTemplates = lazy(() => import("./pages/contractor/ContractorTemplates"));
const ContractorBidTracking = lazy(() => import("./pages/contractor/ContractorBidTracking"));
const ContractorFinancials = lazy(() => import("./pages/contractor/ContractorFinancials"));
const ContractorQuality = lazy(() => import("./pages/contractor/ContractorQuality"));
const ContractorPerformance = lazy(() => import("./pages/contractor/ContractorPerformance"));
const ContractorCommunications = lazy(() => import("./pages/contractor/ContractorCommunications"));

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
const GovernmentPortfolio = lazy(() => import("./pages/government/GovernmentPortfolio"));
const GovernmentApprovalDashboard = lazy(() => import("./pages/government/GovernmentApprovalDashboard"));
const GovernmentContractorManagement = lazy(() => import("./pages/government/GovernmentContractorManagement"));
const GovernmentAnalytics = lazy(() => import("./pages/government/GovernmentAnalytics"));
const GovernmentCompliance = lazy(() => import("./pages/government/GovernmentCompliance"));
const GovernmentUserManagement = lazy(() => import("./pages/government/GovernmentUserManagement"));
const GovernmentBidApproval = lazy(() => import("./pages/government/GovernmentBidApproval"));
const GovernmentMilestones = lazy(() => import("./pages/government/GovernmentMilestones"));
const GovernmentPaymentRelease = lazy(() => import("./pages/government/GovernmentPaymentRelease"));

// Minimal loader for lazy routes
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
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
                  <Route
                    path="/citizen"
                    element={
                      <ProtectedRoute allowedRoles={["citizen"]}>
                        <CitizenDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/citizen/report"
                    element={
                      <ProtectedRoute allowedRoles={["citizen"]}>
                        <CitizenReportIssue />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/citizen/track"
                    element={
                      <ProtectedRoute allowedRoles={["citizen"]}>
                        <CitizenTrackReports />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/citizen/voting"
                    element={
                      <ProtectedRoute allowedRoles={["citizen"]}>
                        <CitizenCommunityVoting />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/citizen/skills"
                    element={
                      <ProtectedRoute allowedRoles={["citizen"]}>
                        <CitizenSkillsRegistration />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/citizen/workforce"
                    element={
                      <ProtectedRoute allowedRoles={["citizen"]}>
                        <CitizenWorkforce />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/citizen/ussd"
                    element={
                      <ProtectedRoute allowedRoles={["citizen"]}>
                        <CitizenUSSD />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/citizen/projects"
                    element={
                      <ProtectedRoute allowedRoles={["citizen"]}>
                        <CitizenProjects />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/citizen/transparency"
                    element={
                      <ProtectedRoute allowedRoles={["citizen"]}>
                        <CitizenTransparency />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/citizen/notifications"
                    element={
                      <ProtectedRoute allowedRoles={["citizen"]}>
                        <CitizenNotifications />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/citizen/guide"
                    element={
                      <ProtectedRoute allowedRoles={["citizen"]}>
                        <CitizenGuide />
                      </ProtectedRoute>
                    }
                  />
                  
                  {/* Contractor Routes */}
                  <Route
                    path="/contractor"
                    element={
                      <ProtectedRoute allowedRoles={["contractor"]}>
                        <ContractorDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/contractor/bidding"
                    element={
                      <ProtectedRoute allowedRoles={["contractor"]}>
                        <ContractorBidding />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/contractor/projects"
                    element={
                      <ProtectedRoute allowedRoles={["contractor"]}>
                        <ContractorProjects />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/contractor/verification"
                    element={
                      <ProtectedRoute allowedRoles={["contractor"]}>
                        <ContractorVerification />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/contractor/templates"
                    element={
                      <ProtectedRoute allowedRoles={["contractor"]}>
                        <ContractorTemplates />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/contractor/tracking"
                    element={
                      <ProtectedRoute allowedRoles={["contractor"]}>
                        <ContractorBidTracking />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/contractor/financials"
                    element={
                      <ProtectedRoute allowedRoles={["contractor"]}>
                        <ContractorFinancials />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/contractor/quality"
                    element={
                      <ProtectedRoute allowedRoles={["contractor"]}>
                        <ContractorQuality />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/contractor/performance"
                    element={
                      <ProtectedRoute allowedRoles={["contractor"]}>
                        <ContractorPerformance />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/contractor/communications"
                    element={
                      <ProtectedRoute allowedRoles={["contractor"]}>
                        <ContractorCommunications />
                      </ProtectedRoute>
                    }
                  />
                  
                  {/* Government Routes */}
                  <Route
                    path="/government"
                    element={
                      <ProtectedRoute allowedRoles={["government", "admin"]}>
                        <GovernmentDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/government/projects"
                    element={
                      <ProtectedRoute allowedRoles={["government", "admin"]}>
                        <GovernmentProjects />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/government/reports"
                    element={
                      <ProtectedRoute allowedRoles={["government", "admin"]}>
                        <GovernmentReports />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/government/escrow"
                    element={
                      <ProtectedRoute allowedRoles={["government", "admin"]}>
                        <GovernmentEscrow />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/government/verification"
                    element={
                      <ProtectedRoute allowedRoles={["government", "admin"]}>
                        <GovernmentVerification />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/government/payments"
                    element={
                      <ProtectedRoute allowedRoles={["government", "admin"]}>
                        <GovernmentPaymentTransparency />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/government/blockchain"
                    element={
                      <ProtectedRoute allowedRoles={["government", "admin"]}>
                        <GovernmentBlockchain />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/government/eacc"
                    element={
                      <ProtectedRoute allowedRoles={["government", "admin"]}>
                        <GovernmentEACC />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/government/benchmarks"
                    element={
                      <ProtectedRoute allowedRoles={["government", "admin"]}>
                        <GovernmentBenchmarks />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/government/verification-requests"
                    element={
                      <ProtectedRoute allowedRoles={["government", "admin"]}>
                        <GovernmentVerificationRequests />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/government/portfolio"
                    element={
                      <ProtectedRoute allowedRoles={["government", "admin"]}>
                        <GovernmentPortfolio />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/government/approvals"
                    element={
                      <ProtectedRoute allowedRoles={["government", "admin"]}>
                        <GovernmentApprovalDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/government/contractors"
                    element={
                      <ProtectedRoute allowedRoles={["government", "admin"]}>
                        <GovernmentContractorManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/government/analytics"
                    element={
                      <ProtectedRoute allowedRoles={["government", "admin"]}>
                        <GovernmentAnalytics />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/government/compliance"
                    element={
                      <ProtectedRoute allowedRoles={["government", "admin"]}>
                        <GovernmentCompliance />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/government/users"
                    element={
                      <ProtectedRoute allowedRoles={["government", "admin"]}>
                        <GovernmentUserManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/government/bid-approval"
                    element={
                      <ProtectedRoute allowedRoles={["government", "admin"]}>
                        <GovernmentBidApproval />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/government/milestones"
                    element={
                      <ProtectedRoute allowedRoles={["government", "admin"]}>
                        <GovernmentMilestones />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/government/payment-release"
                    element={
                      <ProtectedRoute allowedRoles={["government", "admin"]}>
                        <GovernmentPaymentRelease />
                      </ProtectedRoute>
                    }
                  />
                  
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
