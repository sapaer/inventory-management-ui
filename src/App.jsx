import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import BottomTabBar from "./components/BottomTabBar";
import Layout from "./components/Layout";
import Loader from "./components/Loader";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import PartForm from "./pages/PartForm";
import LowStocks from "./pages/LowStocks";
import StockUpdate from "./pages/StockUpdate";
import Insights from "./pages/Insights";
import Account from "./pages/Account";
import AccountSetup from "./pages/AccountSetup";
import Help from "./pages/Help";
import Faqs from "./pages/Faqs";
import Contact from "./pages/Contact";
import Terms from "./pages/Terms";
import { needsShopSetup } from "./utils";

/** Any signed-in user may use the app. Shop setup is a first-run nudge, not a wall. */
function Gate({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <Loader />;
  if (!user) return <Navigate to="/auth?mode=login" replace />;
  return children;
}

/** Setup is a one-time screen; send anyone who's already done it into the app. */
function SetupGate({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <Loader />;
  if (!user) return <Navigate to="/auth?mode=login" replace />;
  if (!needsShopSetup(user)) return <Navigate to="/dashboard" replace />;
  return children;
}

function PublicOnly({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <Loader />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

/**
 * The app never scrolls the document itself (every page is a fixed shell
 * with its own internally-scrolling pane — .content signed-in, .lp-scroll
 * public), so the browser's own scroll-to-top-on-navigate never applies
 * here, and .content in particular is a persistent element shared across
 * all the routes nested under Layout (Dashboard/Inventory/Account/...) —
 * switching between them leaves scrollTop wherever it was on the last
 * page. Reset whichever pane is mounted on every route change instead.
 *
 * Keyed on location.key, not pathname — a click on a Link back to the
 * page you're already on (e.g. the footer's Help link while already on
 * /help, scrolled down to see the footer) still pushes a new history
 * entry with its own key even though the path is unchanged, so this
 * still fires there; keying on pathname alone would miss it.
 */
function ScrollToTop() {
  const { key } = useLocation();
  useEffect(() => {
    document.querySelector(".content, .lp-scroll")?.scrollTo(0, 0);
  }, [key]);
  return null;
}

/** Logged-in users skip marketing and go straight into the product. */
function Home() {
  const { user, ready } = useAuth();
  if (!ready) return <Loader />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Landing />;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/welcome" element={<Landing />} />
        <Route path="/help" element={<Help />} />
        <Route path="/help/faqs" element={<Faqs />} />
        <Route path="/faqs" element={<Navigate to="/help/faqs" replace />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/terms" element={<Terms />} />
        <Route
          path="/auth"
          element={
            <PublicOnly>
              <Auth />
            </PublicOnly>
          }
        />
        <Route path="/login" element={<Navigate to="/auth?mode=login" replace />} />
        <Route path="/signup" element={<Navigate to="/auth?mode=signup" replace />} />
        <Route
          path="/account-setup"
          element={
            <SetupGate>
              <AccountSetup />
            </SetupGate>
          }
        />
        <Route path="/setup" element={<Navigate to="/account-setup" replace />} />
        <Route
          element={
            <Gate>
              <Layout />
            </Gate>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/inventory/new" element={<PartForm />} />
          <Route path="/inventory/:id/edit" element={<PartForm />} />
          <Route path="/low-stocks" element={<LowStocks />} />
          <Route path="/stock-update" element={<StockUpdate />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/account" element={<Account />} />
          <Route path="/profile" element={<Navigate to="/account" replace />} />
          <Route path="/settings" element={<Navigate to="/account" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {/* Global signed-in bottom nav for phones — lives outside <Routes> so it
          stays mounted on standalone pages too. Logged-out phones use SiteFooter. */}
      <BottomTabBar />
    </>
  );
}
