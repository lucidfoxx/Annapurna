import React, { useState } from "react";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import {
  LayoutGrid,
  Users,
  Package,
  ClipboardList,
  HeartHandshake,
  Truck,
  Database,
  History,
  Bell,
  Settings,
  LogOut,
  Sprout,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { AdminOverview } from "./AdminOverview";
import { AdminUsers } from "./AdminUsers";
import { AdminListings } from "./AdminListings";
import { AdminRequests } from "./AdminRequests";
import { AdminVolunteers } from "./AdminVolunteers";
import { AdminDonations } from "./AdminDonations";
import { AdminDatabase } from "./AdminDatabase";
import AdminAuditLogs from "./AdminAuditLogs";
import AdminNotificationsSettings from "./AdminNotificationsSettings";
import { AdminNgoVerifications } from "./AdminNgoVerifications";

const NAV_ITEMS = [
  { path: "/admin", label: "Overview", icon: LayoutGrid, exact: true },
  { path: "/admin/verifications", label: "NGO License Verification", icon: ShieldCheck },
  { path: "/admin/users", label: "Users & RBAC", icon: Users },
  { path: "/admin/listings", label: "Food Listings", icon: Package },
  { path: "/admin/requests", label: "Food Requests", icon: ClipboardList },
  { path: "/admin/volunteers", label: "Volunteers", icon: HeartHandshake },
  { path: "/admin/donations", label: "Lifecycle Monitor", icon: Truck },
  { path: "/admin/database", label: "Database Explorer", icon: Database },
  { path: "/admin/audit-logs", label: "Audit Logs", icon: History },
  { path: "/admin/notifications", label: "Announcements", icon: Bell },
  { path: "/admin/settings", label: "Platform Settings", icon: Settings },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [toast, setToast] = useState<{ message: string; tone: string } | null>(null);

  const showToast = (message: string, tone = "info") => {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 4000);
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Strict RBAC enforcement on frontend route
  if (user.role !== "Admin") {
    return (
      <div className="min-h-screen bg-[#F9F8F5] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-[#EBE8E0] max-w-md w-full p-8 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-[#FDE8E8] text-[#B42318] flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-[22px] font-serif font-bold text-[#1C1B18]">Administrator Access Required</h1>
          <p className="text-[13px] text-[#5A5852]">
            Your account (<strong>{user.email}</strong> — role: <strong>{user.role}</strong>) does not have administrator privileges to access the Platform Management Console.
          </p>
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1C1B18] text-white text-[13px] font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Workspace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F9F8F5] text-[#1C1B18] font-sans">
      {/* Sidebar */}
      <aside className="w-[265px] shrink-0 bg-[#F9F8F5] border-r border-[#EBE8E0] flex flex-col justify-between p-4 select-none">
        <div>
          {/* Brand Header */}
          <div className="flex items-center gap-3 px-2 py-2 mb-6">
            <img
              src="/assets/aistudio/image_3f793f15.png"
              alt="ANNAPURNA Logo"
              className="w-10 h-10 rounded-xl object-cover shadow-sm shrink-0"
            />
            <div>
              <div className="font-bold text-[16px] leading-tight tracking-tight text-[#1C1B18]">ANNAPURNA</div>
              <div className="text-[9px] font-bold tracking-[0.14em] text-[#C84614] uppercase">ADMIN CONTROL CENTER</div>
            </div>
          </div>

          <div className="px-3 mb-2 text-[10px] font-bold tracking-[0.12em] text-[#8E8B82] uppercase">
            PLATFORM GOVERNANCE
          </div>

          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors ${
                    isActive
                      ? "bg-[#FDEEE7] text-[#C84614] font-semibold"
                      : "text-[#5A5852] hover:bg-[#F3F1EC] hover:text-[#1C1B18]"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#C84614]" : "text-[#5A5852]"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="space-y-3 pt-4 border-t border-[#EBE8E0]">
          <button
            onClick={() => navigate("/?workspace=1")}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-semibold text-[#5A5852] hover:bg-[#F3F1EC] hover:text-[#1C1B18]"
          >
            <ArrowLeft className="w-4 h-4" /> View Live Network UI
          </button>

          <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white border border-[#EBE8E0]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#FDEEE7] text-[#C84614] font-bold text-[12px] flex items-center justify-center shrink-0">
                {user.full_name?.charAt(0)?.toUpperCase() || "A"}
              </div>
              <div className="min-w-0">
                <div className="text-[12px] font-bold text-[#1C1B18] truncate">{user.full_name}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#C84614]">Administrator</div>
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              title="Sign out"
              className="p-1.5 rounded-lg text-[#8E8B82] hover:text-[#B42318] hover:bg-[#FDE8E8]/50"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 border-b border-[#EBE8E0] bg-[#F9F8F5] px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-[13px]">
            <span className="text-[#8E8B82]">Admin Console</span>
            <span className="text-[#8E8B82]">/</span>
            <span className="font-semibold text-[#1C1B18]">
              {NAV_ITEMS.find((i) => (i.exact ? location.pathname === i.path : location.pathname.startsWith(i.path)))?.label || "Overview"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F5E9] text-[#1E6F3D] text-[11px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5" /> RBAC Enforced
            </span>
          </div>
        </header>

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-5 right-5 z-50">
            <div
              className={`px-4 py-3 rounded-xl shadow-lg border text-[13px] font-semibold flex items-center gap-2 ${
                toast.tone === "danger"
                  ? "bg-[#FDE8E8] border-[#F5C2C7] text-[#B42318]"
                  : "bg-[#1C1B18] border-[#1C1B18] text-white"
              }`}
            >
              {toast.message}
            </div>
          </div>
        )}

        {/* Active Module */}
        <main className="flex-1 p-8 max-w-[1400px] w-full mx-auto">
          <Routes>
            <Route index element={<AdminOverview />} />
            <Route path="verifications" element={<AdminNgoVerifications showToast={showToast} />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="listings" element={<AdminListings />} />
            <Route path="requests" element={<AdminRequests />} />
            <Route path="volunteers" element={<AdminVolunteers />} />
            <Route path="donations" element={<AdminDonations />} />
            <Route path="database" element={<AdminDatabase />} />
            <Route path="audit-logs" element={<AdminAuditLogs showToast={showToast} />} />
            <Route path="notifications" element={<AdminNotificationsSettings mode="notifications" showToast={showToast} />} />
            <Route path="settings" element={<AdminNotificationsSettings mode="settings" showToast={showToast} />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
