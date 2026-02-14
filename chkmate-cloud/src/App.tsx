import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn, useUser } from '@clerk/clerk-react';

// Context Providers
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { DashboardModeProvider, useDashboardMode } from './context/DashboardModeContext';

// Components
import DashboardLayout from './components/DashboardLayout';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastContainer } from './components/Toast';

// Analytics
import { initAnalytics, identifyUser, resetAnalytics, trackEvent, AnalyticsEvents } from './lib/analytics';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import Builder from './pages/Builder';
import Templates from './pages/Templates';
import Invoices from './pages/Invoices';
import LandingPage from './pages/LandingPage';
import CloudScanner from './pages/CloudScanner';
import CloudConnections from './pages/CloudConnections';
import SmartChat from './pages/SmartChat';

// Case Studies
import CaseStudyADSG from './pages/CaseStudyADSG';
import CaseStudyVendorsify from './pages/CaseStudyVendorsify';
import CaseStudySGH from './pages/CaseStudySGH';
import CaseStudyLumi from './pages/CaseStudyLumi';
import CaseStudyAFC from './pages/CaseStudyAFC';
import CaseStudyAEMENA from './pages/CaseStudyAEMENA';
import Recommendations from './pages/Recommendations';
import InfrastructureMap from './pages/InfrastructureMap';
import CostControl from './pages/CostControl';
import AgentSessions from './pages/AgentSessions';
import Deployments from './pages/Deployments';
import DeploymentCredentials from './pages/DeploymentCredentials';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Refund from './pages/Refund';
import Documentation from './pages/Documentation';
import Pricing from './pages/Pricing';
import SimplifiedDashboard from './pages/SimplifiedDashboard';
import SimpleDeployWizard from './pages/SimpleDeployWizard';
import SimpleResources from './pages/SimpleResources';
import SimpleCosts from './pages/SimpleCosts';
import SimpleGuides from './pages/SimpleGuides';
import GitHubConnections from './pages/GitHubConnections';
import SimpleGitHub from './pages/SimpleGitHub';

// Initialize analytics on app load
initAnalytics();

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

/**
 * Component to handle user identification with PostHog
 * Must be inside ClerkProvider to access useUser hook
 */
function AnalyticsIdentifier() {
  const { user, isSignedIn } = useUser();

  useEffect(() => {
    if (isSignedIn && user) {
      // Identify user in PostHog
      identifyUser(user.id, {
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName || undefined,
        createdAt: user.createdAt,
        plan: 'hobby', // Default plan, will be updated when we add Stripe
      });

      // Track login if this is a new session
      trackEvent(AnalyticsEvents.LOGIN_COMPLETED, {
        auth_provider: user.primaryEmailAddress?.verification?.strategy || 'unknown',
      });
    } else if (!isSignedIn) {
      // Reset analytics on logout
      resetAnalytics();
    }
  }, [isSignedIn, user]);

  return null;
}

/**
 * Dashboard route that switches between Full and Simplified views
 */
function DashboardRouter() {
  const { mode } = useDashboardMode();
  return mode === 'simplified' ? <SimplifiedDashboard /> : <Dashboard />;
}

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  console.warn('Missing Publishable Key');
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
      <Router>
        <ClerkProvider publishableKey={clerkPubKey}>
          <ToastProvider>
            {/* Analytics user identification */}
            <AnalyticsIdentifier />

            <div className="bg-slate-950 min-h-screen text-slate-100 font-sans selection:bg-brand-500/30">
              <ScrollToTop />
              <Routes>
                {/* Public Routes */}
                <Route
                  path="/"
                  element={
                    <>
                      <SignedIn>
                        <Navigate to="/dashboard" replace />
                      </SignedIn>
                      <SignedOut>
                        <LandingPage />
                      </SignedOut>
                    </>
                  }
                />
                <Route path="/case-studies/adsg" element={<CaseStudyADSG />} />
                <Route path="/case-studies/vendorsify" element={<CaseStudyVendorsify />} />
                <Route path="/case-studies/sgh" element={<CaseStudySGH />} />
                <Route path="/case-studies/lumi" element={<CaseStudyLumi />} />
                <Route path="/case-studies/afc" element={<CaseStudyAFC />} />
                <Route path="/case-studies/ae-mena" element={<CaseStudyAEMENA />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/refund" element={<Refund />} />
                <Route path="/docs" element={<Documentation />} />
                <Route path="/pricing" element={<Pricing />} />

                {/* Auth Routes */}
                <Route path="/login" element={<Login />} />

                {/* Protected Routes */}
                <Route
                  element={
                    <>
                      <SignedIn>
                        <DashboardModeProvider>
                          <DashboardLayout />
                        </DashboardModeProvider>
                      </SignedIn>
                      <SignedOut>
                        <RedirectToSignIn />
                      </SignedOut>
                    </>
                  }
                >
                  {/* Dashboard — mode-aware */}
                  <Route path="/dashboard" element={<DashboardRouter />} />

                  {/* Full mode routes */}
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/projects/:id" element={<ProjectDetails />} />
                  <Route path="/projects/:projectId/new-template" element={<Builder />} />
                  <Route path="/projects/:projectId/templates/:templateId" element={<Builder />} />
                  <Route path="/blueprints" element={<Templates />} />
                  <Route path="/chat" element={<SmartChat />} />
                  <Route path="/cloud-scanner" element={<CloudScanner />} />
                  <Route path="/connections" element={<CloudConnections />} />
                  <Route path="/recommendations" element={<Recommendations />} />
                  <Route path="/infrastructure-map" element={<InfrastructureMap />} />
                  <Route path="/cost-control" element={<CostControl />} />
                  <Route path="/agent/sessions" element={<AgentSessions />} />
                  <Route path="/deploy" element={<Deployments />} />
                  <Route path="/deploy/credentials" element={<DeploymentCredentials />} />
                  <Route path="/invoices" element={<Invoices />} />
                  <Route path="/github" element={<GitHubConnections />} />

                  {/* Simplified mode routes */}
                  <Route path="/simple/deploy" element={<SimpleDeployWizard />} />
                  <Route path="/simple/resources" element={<SimpleResources />} />
                  <Route path="/simple/costs" element={<SimpleCosts />} />
                  <Route path="/simple/guides" element={<SimpleGuides />} />
                  <Route path="/simple/github" element={<SimpleGitHub />} />
                </Route>
              </Routes>

              {/* Global Toast Container */}
              <ToastContainer />
            </div>
          </ToastProvider>
        </ClerkProvider>
      </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
