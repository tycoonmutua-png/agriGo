import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import DashboardLayout      from "./layouts/DashboardLayout";
import CustomerLayout       from "./layouts/CustomerLayout";
import ProtectedRoute       from "./components/ProtectedRoute";
import Login                from "./pages/auth/Login";
import Register             from "./pages/auth/Register";
import CustomerRegister     from "./pages/auth/CustomerRegister";
import StaffRegister        from "./pages/auth/StaffRegister";
import Dashboard            from "./pages/Dashboard";
import Products             from "./pages/Products";
import Orders               from "./pages/Orders";
import Customers            from "./pages/Customers";
import Sales                from "./pages/Sales";
import Settings             from "./pages/Settings";
import Profile              from "./pages/Profile";
import Checkout             from "./pages/Checkout";
import StaffApproval        from "./pages/StaffApproval";
import MyReceipts           from "./pages/MyReceipts";
import CustomerProfile      from "./pages/Customerprofile";
import CustomerSettings     from "./pages/Customersettings";
import "./App.css";

const GOOGLE_CLIENT_ID = "301453670877-pg5rq3ttkinp3faa95l4efhut238564f.apps.googleusercontent.com";

const DASHBOARD_ROLES = [
  "admin",
  "stock_manager",
  "stock_supervisor",
  "orders_manager",
  "sales_agent",
  "cashier",
];

const CUSTOMER_ROLES = ["customer", "farmer", "buyer", "supplier", "expert"];

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <Routes>
          {/* ── Public auth routes ── */}
          <Route path="/login"             element={<Login />} />
          <Route path="/register"          element={<Register />} />
          <Route path="/register/customer" element={<CustomerRegister />} />
          <Route path="/register/staff"    element={<StaffRegister />} />

          {/* ── Checkout (any authenticated user) ── */}
          <Route element={<ProtectedRoute />}>
            <Route path="/checkout" element={<Checkout />} />
          </Route>

          {/* ── Customer pages ── */}
          <Route element={<ProtectedRoute allowedRoles={CUSTOMER_ROLES} />}>
            <Route element={<CustomerLayout />}>
              <Route path="/shop"              element={<Products />} />
              <Route path="/my-receipts"       element={<MyReceipts />} />
              <Route path="/customer-profile"  element={<CustomerProfile />} />
              <Route path="/customer-settings" element={<CustomerSettings />} />
            </Route>
          </Route>

          {/* ── Admin / Staff dashboard ── */}
          <Route element={<ProtectedRoute allowedRoles={DASHBOARD_ROLES} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard"      element={<Dashboard />} />
              <Route path="/products"       element={<Products />} />
              <Route path="/orders"         element={<Orders />} />
              <Route path="/customers"      element={<Customers />} />
              <Route path="/sales"          element={<Sales />} />
              <Route path="/settings"       element={<Settings />} />
              <Route path="/profile"        element={<Profile />} />
              <Route path="/staff-approval" element={<StaffApproval />} />
            </Route>
          </Route>

          {/* ── Fallback ── */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}