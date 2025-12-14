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
