import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthProvider } from "./contexts/AuthContext";
import { RealtimeProvider } from "./contexts/RealtimeContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import GovernmentRoleGuard from "@/components/auth/GovernmentRoleGuard";
import { AppLayout } from "@/components/layout/AppLayout";
import { ConditionalLayout } from "@/components/layout/ConditionalLayout";
// Lazy load all pages for better initial load performance
const Landing = lazy(() => import("./pages/Landing"));
const About = lazy(() => import("./pages/About"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const Contact = lazy(() => import("./pages/Contact"));
const Auth = lazy(() => import("./pages/Auth"));
const ContractorDatabasePage = lazy(() => import("./pages/ContractorDatabase"));
const WorkforcePage = lazy(() => import("./pages/WorkforcePage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const VisualAnalytics = lazy(() => import("./pages/VisualAnalytics"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Citizen Routes
const CitizenDashboard = lazy(() => import("./pages/citizen/CitizenDashboard"));
const CitizenReportIssue = lazy(() => import("./pages/citizen/CitizenReportIssue"));
const CitizenTrackReports = lazy(() => import("./pages/citizen/CitizenTrackReports"));
const CitizenCommunityVoting = lazy(() => import("./pages/citizen/CitizenCommunityVoting"));
const CitizenSkillsRegistration = lazy(() => import("./pages/citizen/CitizenSkillsRegistration"));
const CitizenWorkforce = lazy(() => import("./pages/citizen/CitizenWorkforce"));
const CitizenMyJobs = lazy(() => import("./pages/citizen/CitizenMyJobs"));
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

const ContractorQuality = lazy(() => import("./pages/contractor/ContractorQuality"));
const ContractorPerformance = lazy(() => import("./pages/contractor/ContractorPerformance"));
const ContractorCommunications = lazy(() => import("./pages/contractor/ContractorCommunications"));
const ContractorNotifications = lazy(() => import("./pages/contractor/ContractorNotifications"));
const ContractorJobsManagement = lazy(() => import("./pages/contractor/ContractorJobsManagement"));

// Government Routes
const GovernmentDashboard = lazy(() => import("./pages/government/GovernmentDashboard"));
const GovernmentProjects = lazy(() => import("./pages/government/GovernmentProjects"));
const GovernmentReports = lazy(() => import("./pages/government/GovernmentReports"));

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
const GovernmentNotifications = lazy(() => import("./pages/government/GovernmentNotifications"));
const GovernmentLPO = lazy(() => import("./pages/government/GovernmentLPO"));
const GovernmentWithdrawals = lazy(() => import("./pages/government/GovernmentWithdrawals"));

// Public Routes
const PublicTransparencyPortal = lazy(() => import("./pages/public/PublicTransparencyPortal"));
const PublicProjects = lazy(() => import("./pages/public/PublicProjects"));
const InformationRequestPage = lazy(() => import("./pages/public/InformationRequestPage"));
const GovernmentInformationRequests = lazy(() => import("./pages/government/GovernmentInformationRequests"));
const UserGuide = lazy(() => import("./pages/UserGuide"));

// Dispute Resolution
const DisputeResolution = lazy(() => import("./pages/DisputeResolution"));

// Settings & Profile
const SettingsPage = lazy(() => import("./pages/Settings"));
const ProfilePage = lazy(() => import("./pages/Profile"));
const WalletPage = lazy(() => import("./pages/WalletPage"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));

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
          <RealtimeProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AppLayout>
                  <ConditionalLayout>
                    {/*
                      Inner ErrorBoundary keeps the app shell (layout, nav)
                      mounted when an individual lazy route chunk fails to
                      load or throws. The outer ErrorBoundary still catches
                      catastrophic failures in providers above.
                    */}
                    <ErrorBoundary>
                      <Suspense fallback={<PageLoader />}>
                      <Routes>
                        <Route path="/" element={<Landing />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/how-it-works" element={<HowItWorks />} />
                        <Route path="/contact" element={<Contact />} />
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/user-guide" element={<UserGuide />} />
                        <Route path="/terms" element={<Terms />} />
                        <Route path="/privacy" element={<Privacy />} />
                        <Route path="/settings" element={
                          <ProtectedRoute allowedRoles={["citizen", "contractor", "government", "admin"]}>
                            <SettingsPage />
                          </ProtectedRoute>
                        } />
                        <Route path="/profile" element={
                          <ProtectedRoute allowedRoles={["citizen", "contractor", "government", "admin"]}>
                            <ProfilePage />
                          </ProtectedRoute>
                        } />
                        <Route path="/contractor-database" element={
                          <ProtectedRoute allowedRoles={["government", "admin", "contractor"]}>
                            <ContractorDatabasePage />
                          </ProtectedRoute>
                        } />
                        <Route path="/workforce" element={
                          <ProtectedRoute allowedRoles={["government", "admin", "contractor"]}>
                            <WorkforcePage />
                          </ProtectedRoute>
                        } />
                        <Route path="/analytics" element={
                          <ProtectedRoute allowedRoles={["government", "admin"]}>
                            <AnalyticsPage />
                          </ProtectedRoute>
                        } />
                        <Route path="/visuals" element={
                          <ProtectedRoute allowedRoles={["citizen", "contractor", "government", "admin"]}>
                            <VisualAnalytics />
                          </ProtectedRoute>
                        } />

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
                          path="/citizen/my-jobs"
                          element={
                            <ProtectedRoute allowedRoles={["citizen"]}>
                              <CitizenMyJobs />
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
                          element={<Navigate to="/wallet" replace />}
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
                        <Route
                          path="/contractor/notifications"
                          element={
                            <ProtectedRoute allowedRoles={["contractor"]}>
                              <ContractorNotifications />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/contractor/jobs"
                          element={
                            <ProtectedRoute allowedRoles={["contractor"]}>
                              <ContractorJobsManagement />
                            </ProtectedRoute>
                          }
                        />

                        <Route
                          path="/government/*"
                          element={
                            <ProtectedRoute allowedRoles={["government", "admin"]}>
                              <GovernmentRoleGuard>
                                <Routes>
                                  <Route index element={<GovernmentDashboard />} />
                                  <Route path="projects" element={<GovernmentProjects />} />
                                  <Route path="reports" element={<GovernmentReports />} />
                                  <Route path="escrow" element={<Navigate to="/wallet" replace />} />
                                  <Route path="withdrawals" element={<GovernmentWithdrawals />} />
                                  <Route path="verification" element={<GovernmentVerification />} />
                                  <Route path="payments" element={<GovernmentPaymentTransparency />} />
                                  <Route path="blockchain" element={<GovernmentBlockchain />} />
                                  <Route path="eacc" element={<GovernmentEACC />} />
                                  <Route path="benchmarks" element={<GovernmentBenchmarks />} />
                                  <Route path="verification-requests" element={<GovernmentVerificationRequests />} />
                                  <Route path="portfolio" element={<GovernmentPortfolio />} />
                                  <Route path="approvals" element={<GovernmentApprovalDashboard />} />
                                  <Route path="contractors" element={<GovernmentContractorManagement />} />
                                  <Route path="analytics" element={<GovernmentAnalytics />} />
                                  <Route path="compliance" element={<GovernmentCompliance />} />
                                  <Route path="users" element={<GovernmentUserManagement />} />
                                  <Route path="bid-approval" element={<GovernmentBidApproval />} />
                                  <Route path="milestones" element={<GovernmentMilestones />} />
                                  <Route path="escrow-funding" element={<Navigate to="/wallet" replace />} />
                                  <Route path="notifications" element={<GovernmentNotifications />} />
                                  <Route path="lpo" element={<GovernmentLPO />} />
                                  <Route path="payment-release" element={<Navigate to="/government/withdrawals" replace />} />
                                  <Route path="info-requests" element={<GovernmentInformationRequests />} />
                                </Routes>
                              </GovernmentRoleGuard>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/disputes"
                          element={
                            <ProtectedRoute>
                              <DisputeResolution />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/wallet"
                          element={
                            <ProtectedRoute>
                              <WalletPage />
                            </ProtectedRoute>
                          }
                        />

                        {/* Public Routes */}
                        <Route path="/transparency" element={<PublicTransparencyPortal />} />
                        <Route path="/transparency/request-information" element={<InformationRequestPage />} />
                        <Route path="/projects" element={<PublicProjects />} />

                        {/* Catch-all route */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                    </ErrorBoundary>
                  </ConditionalLayout>
                </AppLayout>
              </BrowserRouter>
            </TooltipProvider>
          </RealtimeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
