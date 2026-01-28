import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn, useUser } from '@clerk/clerk-react';

// Context Providers
import { ToastProvider } from './context/ToastContext';

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

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  console.warn('Missing Publishable Key');
}

function App() {
  return (
    <ErrorBoundary>
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

                {/* Auth Routes */}
                <Route path="/login" element={<Login />} />

                {/* Protected Routes */}
                <Route
                  element={
                    <>
                      <SignedIn>
                        <DashboardLayout />
                      </SignedIn>
                      <SignedOut>
                        <RedirectToSignIn />
                      </SignedOut>
                    </>
                  }
                >
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/projects/:id" element={<ProjectDetails />} />
                  <Route path="/projects/:projectId/new-template" element={<Builder />} />
                  <Route path="/projects/:projectId/templates/:templateId" element={<Builder />} />
                  <Route path="/templates" element={<Templates />} />
                  <Route path="/cloud-scanner" element={<CloudScanner />} />
                  <Route path="/connections" element={<CloudConnections />} />
                  <Route path="/recommendations" element={<Recommendations />} />
                  <Route path="/infrastructure-map" element={<InfrastructureMap />} />
                  <Route path="/cost-control" element={<CostControl />} />
                  <Route path="/invoices" element={<Invoices />} />
                </Route>
              </Routes>

              {/* Global Toast Container */}
              <ToastContainer />
            </div>
          </ToastProvider>
        </ClerkProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
