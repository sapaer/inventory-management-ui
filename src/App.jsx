import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import PartForm from "./pages/PartForm";
import LowStocks from "./pages/LowStocks";
import Insights from "./pages/Insights";
import Settings from "./pages/Settings";
import ShopSetup from "./pages/ShopSetup";
import { needsShopSetup } from "./utils";

function Gate({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <div className="content">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (needsShopSetup(user)) return <Navigate to="/setup" replace />;
  return children;
}

function SetupGate({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <div className="content">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!needsShopSetup(user)) return <Navigate to="/" replace />;
  return children;
}

function PublicOnly({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <div className="content">Loading…</div>;
  if (user && needsShopSetup(user)) return <Navigate to="/setup" replace />;
  if (user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
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
        <Route path="/" element={<Dashboard />} />
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
