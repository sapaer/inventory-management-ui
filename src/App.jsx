import { Navigate, Route, Routes } from "react-router-dom";
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
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/welcome" element={<Landing />} />
        <Route path="/help" element={<Help />} />
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
      {/* Global, signed-in-only bottom nav for phones — lives outside <Routes>
          so it stays mounted (and covers standalone pages like Help/Contact/
          Terms too, not just the ones wrapped in Layout). */}
      <BottomTabBar />
    </>
  );
}
