import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute  from "./components/ProtectedRoute";
import Login           from "./pages/auth/Login";
import Register        from "./pages/auth/Register";
import Dashboard       from "./pages/Dashboard";
import Products        from "./pages/Products";
import Orders          from "./pages/Orders";
import Customers       from "./pages/Customers";
import Sales           from "./pages/Sales";
import Settings        from "./pages/Settings";
import Profile         from "./pages/Profile";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/products"  element={<Products />} />
            <Route path="/orders"    element={<Orders />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/sales"     element={<Sales />} />
            <Route path="/settings"  element={<Settings />} />
            <Route path="/profile"   element={<Profile />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}