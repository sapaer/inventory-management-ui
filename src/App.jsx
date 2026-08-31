import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Loader from "./components/Loader";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import PartForm from "./pages/PartForm";
import LowStocks from "./pages/LowStocks";
import Insights from "./pages/Insights";
import Settings from "./pages/Settings";
import ShopSetup from "./pages/ShopSetup";
import Help from "./pages/Help";
import Contact from "./pages/Contact";
import Terms from "./pages/Terms";
import { needsShopSetup } from "./utils";

function Gate({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;
  if (needsShopSetup(user)) return <Navigate to="/setup" replace />;
  return children;
}

function SetupGate({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;
  if (!needsShopSetup(user)) return <Navigate to="/dashboard" replace />;
  return children;
}

function PublicOnly({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <Loader />;
  if (user && needsShopSetup(user)) return <Navigate to="/setup" replace />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

/** Logged-in users skip marketing and go straight into the product. */
function Home() {
  const { user, ready } = useAuth();
  if (!ready) return <Loader />;
  if (user && needsShopSetup(user)) return <Navigate to="/setup" replace />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Landing />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/welcome" element={<Landing />} />
      <Route path="/help" element={<Help />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/terms" element={<Terms />} />
      <Route
        path="/login"
        element={
          <PublicOnly>
            <Login />
          </PublicOnly>
        }
      />
      <Route
        path="/setup"
        element={
          <SetupGate>
            <ShopSetup />
          </SetupGate>
        }
      />
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
        <Route path="/insights" element={<Insights />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
