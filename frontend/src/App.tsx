import React, { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Link,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Sprout,
  LayoutGrid,
  Package,
  ClipboardList,
  HandHeart,
  Activity,
  CircleHelp,
  LogOut,
  Bell,
  Plus,
  Sparkles,
  ArrowRight,
  Leaf,
  RefreshCw,
  Utensils,
  Clock,
  Search,
  MapPin,
  Check,
  X,
  Truck,
  Lock,
  ShieldAlert,
  Building2,
  UserCheck,
  Trash2,
  ShieldCheck,
  AlertCircle,
  Trophy,
  Star,
  Upload,
} from "lucide-react";
import { AuthProvider, useAuth, UserRole } from "./context/AuthContext";
import { api, endpoints, getErrorMessage } from "./lib/api";
import AdminLayout from "./admin/AdminLayout";
import {
  LeaderboardPage,
  NgoLeaveReviewModal,
  NgoVerificationGateBanner,
} from "./LeaderboardPage";

interface Listing {
  id: number | string;
  title: string;
  description?: string;
  category?: string;
  quantity?: string | number;
  pickup_location?: string;
  expiry_time?: string;
  status?: string;
  donor_id?: number;
  donor_name?: string;
  claimed_by_ngo_id?: number | null;
  claimed_by_ngo_name?: string | null;
  claimed_at?: string | null;
  volunteer_name?: string | null;
  distribution_proof?: string | null;
  cancellation_reason?: string | null;
  cancelled_at?: string | null;
  pickup_status?: string;
  pickup_failure_reason?: string | null;
  delivery_status?: string;
  delivery_failure_reason?: string | null;
  verified_by_volunteer_id?: number | null;
  created_at?: string;
}

interface DonationRequest {
  id: number | string;
  listing_id?: number | string | null;
  listing_title?: string;
  requester_id?: number;
  requester_name?: string;
  ngo_id?: number | null;
  ngo_name?: string | null;
  quantity?: string;
  requested_quantity?: string;
  required_by?: string | null;
  urgency_level?: string | null;
  request_type?: "listing_claim" | "open_broadcast";
  notes?: string;
  status?: string;
  moderation_note?: string | null;
  created_at?: string;
}

interface NgoClaimRecord {
  id: number | string;
  listing_id?: number | string | null;
  listing_title: string;
  donor_id?: number | null;
  donor_name: string;
  pickup_location: string;
  quantity: string;
  status: string;
  claim_status?: string;
  raw_request_status?: string;
  request_type?: "listing_claim" | "open_broadcast";
  urgency_level?: string | null;
  required_by?: string | null;
  notes?: string;
  cancellation_reason?: string | null;
  pickup_status?: string;
  pickup_failure_reason?: string | null;
  delivery_status?: string;
  delivery_failure_reason?: string | null;
  volunteer_name?: string | null;
  distribution_proof?: string | null;
  has_reviewed?: boolean;
  review_rating?: number | null;
  review_comment?: string | null;
  review_tags?: string[];
  created_at?: string;
}

interface Handover {
  id: number | string;
  request_id?: number | string;
  listing_id?: number | string;
  listing_title?: string;
  donor_name?: string | null;
  ngo_name?: string | null;
  quantity?: string | number | null;
  pickup_location?: string;
  dropoff_location?: string;
  volunteer_id?: number | null;
  volunteer_name?: string;
  status?: string;
  pickup_status?: string;
  pickup_failure_reason?: string | null;
  delivery_status?: string;
  delivery_failure_reason?: string | null;
  verified_by_volunteer_id?: number | null;
  verified_at?: string | null;
  distribution_proof?: string | null;
  notes?: string | null;
  created_at?: string;
}

function PlateIllustration() {
  return (
    <div className="relative flex items-center justify-center w-[310px] h-[190px] shrink-0 select-none">
      {/* Dark olive background circle */}
      <div className="w-[168px] h-[168px] rounded-full bg-[#353834] absolute right-5 top-1/2 -translate-y-1/2" />

      {/* Less waste floating badge (top right) */}
      <div className="absolute top-3 right-0 z-20 bg-white text-[#1C1B18] text-[12px] font-semibold px-3.5 py-1.5 rounded-xl shadow-md flex items-center gap-1.5">
        <Leaf className="w-3.5 h-3.5 text-[#2E7D52]" />
        <span>Less waste</span>
      </div>

      {/* Main cream plate */}
      <div className="w-[164px] h-[164px] rounded-full bg-[#F5F2EB] border-[12px] border-[#EAE4D7] shadow-lg flex items-center justify-center relative z-10 -translate-x-3">
        <div className="w-[112px] h-[112px] rounded-full border border-[#DED8CA] flex items-center justify-center relative">
          {/* Minimalist Fork, Knife & Leaf SVG */}
          <svg
            width="58"
            height="64"
            viewBox="0 0 58 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Fork (left, tilted slightly) */}
            <g transform="rotate(-10 22 36)">
              <path
                d="M15 16V27C15 30.5 17.5 33 21 33C24.5 33 27 30.5 27 27V16"
                stroke="#C84A20"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M21 16V50"
                stroke="#C84A20"
                strokeWidth="2.6"
                strokeLinecap="round"
              />
            </g>
            {/* Knife (right, tilted slightly) */}
            <g transform="rotate(-10 36 36)">
              <path
                d="M36 16C31.5 19 31.5 29 31.5 33H36V16Z"
                stroke="#C84A20"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M36 16V50"
                stroke="#C84A20"
                strokeWidth="2.6"
                strokeLinecap="round"
              />
            </g>
            {/* Green Leaf (top right) */}
            <path
              d="M39 14C39 8.5 45 5 51 6C51 12 47.5 17.5 41 17.5C39.8 17.5 39 16 39 14Z"
              stroke="#2E7D52"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M39 17L46 10.5"
              stroke="#2E7D52"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {/* More good floating badge (bottom left) */}
      <div className="absolute bottom-2 left-0 z-20 bg-white text-[#1C1B18] text-[12px] font-semibold px-3.5 py-1.5 rounded-xl shadow-md flex items-center gap-1.5">
        <HandHeart className="w-3.5 h-3.5 text-[#2E7D52]" />
        <span>More good</span>
      </div>
    </div>
  );
}

/* ============================================================================
   AUTH PAGE: LOGIN & REGISTER (WITH 3 DISTINCT ROLES)
   ============================================================================ */
function AuthPage({ initialMode = "login" }: { initialMode?: "login" | "register" }) {
  const { login, register, logout, bootstrapAdmin } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "admin_login" | "register" | "bootstrap">(initialMode);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"Donor" | "NGO" | "Volunteer">("Donor");
  const [phone, setPhone] = useState("");
  const [organization, setOrganization] = useState("");
  const [address, setAddress] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseDocumentUrl, setLicenseDocumentUrl] = useState("");
  const [licenseFileName, setLicenseFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hasAdmin, setHasAdmin] = useState<boolean>(true);

  useEffect(() => {
    setMode(initialMode);
    setError(null);
  }, [initialMode]);

  useEffect(() => {
    api
      .get(endpoints.auth.bootstrapStatus)
      .then((res) => {
        if (res.data && typeof res.data.has_admin === "boolean") {
          setHasAdmin(res.data.has_admin);
        }
      })
      .catch(() => {});
  }, []);

  const handleCertificateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLicenseFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setLicenseDocumentUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "login" || mode === "admin_login") {
        await login(email, password);
        const stored = localStorage.getItem("shareplate_user");
        const parsed = stored ? JSON.parse(stored) : null;
        if (mode === "admin_login" && parsed?.role !== "Admin") {
          logout();
          setError("Access denied: This account does not have Administrator privileges.");
          setSubmitting(false);
          return;
        }
        if (parsed?.role === "Admin") {
          navigate("/admin", { replace: true });
          return;
        }
      } else if (mode === "bootstrap") {
        await bootstrapAdmin({
          full_name: fullName,
          email,
          password,
        });
        setHasAdmin(true);
        navigate("/admin", { replace: true });
        return;
      } else {
        if (role === "NGO" && !licenseNumber.trim()) {
          setError("Official NGO Registration / License Number is mandatory for NGO onboarding.");
          setSubmitting(false);
          return;
        }
        await register({
          full_name: fullName,
          email,
          password,
          role,
          phone: phone.trim() || undefined,
          organization: organization.trim() || fullName.trim(),
          address: address.trim() || undefined,
          license_number: role === "NGO" ? licenseNumber.trim() : undefined,
          license_document_url:
            role === "NGO"
              ? licenseDocumentUrl.trim() ||
                `https://cert.annapurna.org/certificates/${encodeURIComponent(
                  licenseNumber.trim()
                )}.pdf`
              : undefined,
        });
      }
      navigate("/", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPassword: string, targetPath = "/") => {
    setError(null);
    setSubmitting(true);
    try {
      await login(demoEmail, demoPassword);
      navigate(targetPath, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const roles: {
    id: "Donor" | "NGO" | "Volunteer";
    title: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      id: "Donor",
      title: "Donor",
      subtitle: "Post surplus food listings & review incoming requests",
      icon: Package,
    },
    {
      id: "NGO",
      title: "NGO / Recipient",
      subtitle: "Browse available surplus & request food for communities",
      icon: Building2,
    },
    {
      id: "Volunteer",
      title: "Volunteer",
      subtitle: "Claim rescue runs & confirm pickup and delivery",
      icon: Truck,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F9F8F5] text-[#1C1B18] flex flex-col lg:flex-row">
      {/* Left Brand & Role Overview Panel */}
      <div className="lg:w-[48%] bg-[#282A27] text-white p-8 lg:p-14 flex flex-col justify-between relative overflow-hidden">
        <div>
          {/* Brand Header */}
          <div className="flex items-center gap-3 mb-12">
            <img
              src="/assets/aistudio/image_3f793f15.png"
              alt="ANNAPURNA Logo"
              className="w-11 h-11 rounded-[12px] object-cover shadow-2xs shrink-0"
            />
            <div>
              <div className="font-display font-bold text-[18px] text-white leading-none tracking-[-0.02em]">
                ANNAPURNA
              </div>
              <div className="text-[9.5px] font-semibold tracking-[0.14em] text-[#B8B4AC] uppercase mt-1.5">
                CONNECTING FOOD &amp; HOPE
              </div>
            </div>
          </div>

          <div className="max-w-[460px]">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#E06D44]" />
              <span className="text-[10.5px] font-bold tracking-[0.14em] text-[#B8B4AC] uppercase">
                THE GOOD FOOD MOVEMENT
              </span>
            </div>

            <h1 className="font-display text-[36px] font-extrabold leading-[1.12] tracking-[-0.02em] mb-4">
              <span className="text-white block">Surplus food has a</span>
              <span className="text-[#E06338] block">place to go.</span>
            </h1>

            <p className="text-[14px] text-[#B8B4AC] leading-[1.6] mb-8">
              ANNAPURNA provides dedicated, role-isolated workspaces for
              Donors, NGOs, Volunteers, and Platform Administrators. Sign in with
              your role to access your portal.
            </p>
          </div>

          <div className="my-4 flex justify-center lg:justify-start">
            <PlateIllustration />
          </div>
        </div>

        {/* 4 Role Isolation Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 pt-6 border-t border-[#3A3D39]">
          <div className="bg-[#313430] rounded-xl p-3.5">
            <p className="text-[11px] font-bold tracking-[0.1em] text-[#E06338] uppercase">
              01 · DONOR UI
            </p>
            <p className="text-[12px] text-[#D8D5CE] mt-1 leading-snug">
              Post surplus listings &amp; approve or decline NGO requests.
            </p>
          </div>
          <div className="bg-[#313430] rounded-xl p-3.5">
            <p className="text-[11px] font-bold tracking-[0.1em] text-[#58B37E] uppercase">
              02 · NGO UI
            </p>
            <p className="text-[12px] text-[#D8D5CE] mt-1 leading-snug">
              Discover available food &amp; submit community pickup requests.
            </p>
          </div>
          <div className="bg-[#313430] rounded-xl p-3.5">
            <p className="text-[11px] font-bold tracking-[0.1em] text-[#7BA4E8] uppercase">
              03 · VOLUNTEER UI
            </p>
            <p className="text-[12px] text-[#D8D5CE] mt-1 leading-snug">
              Claim approved handovers &amp; verify pickup and delivery.
            </p>
          </div>
          <div className="bg-[#313430] rounded-xl p-3.5 border border-[#E06338]/30">
            <p className="text-[11px] font-bold tracking-[0.1em] text-[#F59E0B] uppercase">
              04 · ADMIN CONSOLE
            </p>
            <p className="text-[12px] text-[#D8D5CE] mt-1 leading-snug">
              Centralized RBAC governance, moderation, database &amp; audit logs.
            </p>
          </div>
        </div>
      </div>

      {/* Right Authentication Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[460px]">
          <div className="bg-white border border-[#EAE6DF] rounded-[20px] p-7 sm:p-8 shadow-2xs">
            {/* Mode Switcher with Dedicated Admin Login Option */}
            <div className="grid grid-cols-3 gap-1.5 bg-[#F5F3EE] p-1 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
                className={`py-2 rounded-lg text-[12.5px] font-semibold transition-colors cursor-pointer ${
                  mode === "login"
                    ? "bg-white text-[#1C1B18] shadow-2xs"
                    : "text-[#6E6A63] hover:text-[#1C1B18]"
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("admin_login");
                  setEmail("admin@shareplate.org");
                  setPassword("password123");
                  setError(null);
                }}
                className={`py-2 rounded-lg text-[12.5px] font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  mode === "admin_login"
                    ? "bg-[#1C1B18] text-white shadow-2xs"
                    : "text-[#C84A20] hover:text-[#1C1B18]"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin login</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setError(null);
                }}
                className={`py-2 rounded-lg text-[12.5px] font-semibold transition-colors cursor-pointer ${
                  mode === "register"
                    ? "bg-white text-[#1C1B18] shadow-2xs"
                    : "text-[#6E6A63] hover:text-[#1C1B18]"
                }`}
              >
                Create account
              </button>
            </div>

            <div className="mb-6">
              <p className="text-[11px] font-bold tracking-[0.13em] text-[#8A847C] uppercase mb-1">
                {mode === "login"
                  ? "WELCOME BACK"
                  : mode === "admin_login"
                  ? "PLATFORM GOVERNANCE · RBAC"
                  : mode === "bootstrap"
                  ? "ONE-TIME INITIAL ADMIN SETUP"
                  : "JOIN THE NETWORK"}
              </p>
              <h2 className="font-display text-[24px] font-extrabold text-[#1C1B18] tracking-[-0.02em]">
                {mode === "login"
                  ? "Sign in to your workspace"
                  : mode === "admin_login"
                  ? "Administrator Sign In"
                  : mode === "bootstrap"
                  ? "Initialize First Administrator"
                  : "Create your ANNAPURNA account"}
              </h2>
              <p className="text-[13px] text-[#7D776F] mt-1">
                {mode === "login"
                  ? "Enter your credentials to unlock your role-specific dashboard."
                  : mode === "admin_login"
                  ? "Sign in with an authorized Administrator account to access the Platform Management Console (/admin)."
                  : mode === "bootstrap"
                  ? "No administrator exists yet. Create or promote the first Admin account to unlock /admin."
                  : "Select your role carefully — each account accesses its own dedicated UI."}
              </p>
            </div>

            {mode === "admin_login" && (
              <div className="mb-5 p-3.5 rounded-xl bg-[#FAF9F6] border border-[#EAE6DF] flex items-center justify-between gap-3">
                <div className="text-[12px] text-[#4A4640]">
                  <span className="font-bold text-[#1C1B18] block">Default Admin Credentials</span>
                  Email: <code className="font-mono text-[#C84A20]">admin@shareplate.org</code> · Pass: <code className="font-mono">password123</code>
                </div>
                <button
                  type="button"
                  onClick={() => handleDemoLogin("admin@shareplate.org", "password123", "/admin")}
                  className="px-3 py-1.5 rounded-lg bg-[#1C1B18] hover:bg-[#33312B] text-white text-[11.5px] font-semibold shrink-0 cursor-pointer"
                >
                  Instant Admin Sign In
                </button>
              </div>
            )}

            {!hasAdmin && mode !== "bootstrap" && (
              <div className="mb-5 p-3.5 rounded-xl bg-[#FDEEE7] border border-[#F5D0C5] flex items-center justify-between gap-3">
                <div className="text-[12px] text-[#1C1B18]">
                  <strong className="text-[#C84614] block">First-Time Platform Setup</strong>
                  No administrator account detected in database.
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMode("bootstrap");
                    setError(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#C84614] text-white text-[11.5px] font-semibold shrink-0 cursor-pointer"
                >
                  Initialize Admin
                </button>
              </div>
            )}

            {error && (
              <div className="mb-5 bg-[#FCEEE9] border border-[#F2C9B9] text-[#A83B18] text-[13px] px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {(mode === "register" || mode === "bootstrap") && (
                <div>
                  <label className="block text-[12px] font-semibold text-[#4A4640] mb-1.5">
                    Full name or organization
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Platform Administrator"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE6DF] text-[13.5px] focus:outline-none focus:border-[#C84A20]"
                  />
                </div>
              )}

              <div>
                <label className="block text-[12px] font-semibold text-[#4A4640] mb-1.5">
                  {mode === "admin_login" ? "Administrator email" : "Email address"}
                </label>
                <input
                  type="email"
                  required
                  placeholder={mode === "admin_login" ? "admin@shareplate.org" : "you@annapurna.org"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE6DF] text-[13.5px] focus:outline-none focus:border-[#C84A20]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#4A4640] mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE6DF] text-[13.5px] focus:outline-none focus:border-[#C84A20]"
                />
              </div>

              {mode === "register" && (
                <div>
                  <label className="block text-[12px] font-semibold text-[#4A4640] mb-2">
                    Choose your workspace role
                  </label>
                  <div className="space-y-2">
                    {roles.map((r) => {
                      const Icon = r.icon;
                      const selected = role === r.id;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setRole(r.id)}
                          className={`w-full text-left p-3.5 rounded-xl border transition-colors flex items-start gap-3 cursor-pointer ${
                            selected
                              ? "bg-[#FCEEE9] border-[#C84A20]"
                              : "bg-[#FAF9F6] border-[#EAE6DF] hover:border-[#D5CFC4]"
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                              selected
                                ? "bg-[#C84A20] text-white"
                                : "bg-white text-[#6E6A63] border border-[#EAE6DF]"
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[13px] font-bold text-[#1C1B18]">
                                {r.title}
                              </span>
                              {selected && (
                                <span className="text-[11px] font-semibold text-[#C84A20]">
                                  Selected
                                </span>
                              )}
                            </div>
                            <p className="text-[12px] text-[#7D776F] mt-0.5 leading-snug">
                              {r.subtitle}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {mode === "register" && role === "NGO" && (
                <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#EAE6DF] space-y-3">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#2E7D52]">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Mandatory NGO License Verification Details</span>
                  </div>
                  <p className="text-[11.5px] text-[#7D776F] leading-snug">
                    New NGO accounts start in <strong>pending</strong> status until an administrator verifies your registration certificate.
                  </p>

                  <div>
                    <label className="block text-[12px] font-semibold text-[#1C1B18] mb-1">
                      Official NGO Registration / License Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. NGO-MH-2026-90412"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#EAE6DF] bg-white text-[13px] focus:outline-none focus:border-[#2E7D52]"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-[#1C1B18] mb-1">
                      Registration Certificate Upload (PDF, JPG, PNG) *
                    </label>
                    <label className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border-2 border-dashed border-[#D5CFC4] bg-white text-[12px] font-semibold text-[#4A4640] hover:border-[#2E7D52] cursor-pointer">
                      <Upload className="w-4 h-4 text-[#2E7D52]" />
                      <span className="truncate">
                        {licenseFileName
                          ? `Uploaded: ${licenseFileName}`
                          : "Select Government ID / NGO Certificate"}
                      </span>
                      <input
                        type="file"
                        accept=".pdf,image/png,image/jpeg,image/jpg"
                        onChange={handleCertificateUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11.5px] font-semibold text-[#1C1B18] mb-1">
                        Authorized Contact Phone *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="+91 98201 44510"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#EAE6DF] bg-white text-[12.5px]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11.5px] font-semibold text-[#1C1B18] mb-1">
                        Operating Address *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Street & City Hub"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#EAE6DF] bg-white text-[12.5px]"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className={`w-full disabled:opacity-60 text-white text-[13.5px] font-semibold py-2.5 rounded-xl transition-colors cursor-pointer mt-2 ${
                  mode === "admin_login"
                    ? "bg-[#1C1B18] hover:bg-[#33312B]"
                    : "bg-[#C84A20] hover:bg-[#B33F19]"
                }`}
              >
                {submitting
                  ? "Please wait..."
                  : mode === "login"
                  ? "Sign in to workspace"
                  : mode === "admin_login"
                  ? "Sign in to Admin Console"
                  : mode === "bootstrap"
                  ? "Initialize First Administrator Account"
                  : `Create ${role} account`}
              </button>
            </form>

            {/* Quick Demo Login Accounts for testing the 4 isolated UIs */}
            <div className="mt-6 pt-6 border-t border-[#EAE6DF]">
              <p className="text-[11px] font-bold tracking-[0.11em] text-[#8A847C] uppercase mb-2.5">
                QUICK DEMO ACCOUNTS (ROLES + NGO VERIFICATION STATES)
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleDemoLogin("donor1@shareplate.org", "password123", "/")}
                  className="p-2.5 rounded-xl border border-[#EAE6DF] hover:border-[#C84A20] hover:bg-[#FCEEE9] text-left transition-colors cursor-pointer"
                >
                  <p className="text-[12px] font-bold text-[#1C1B18]">Green Harvest</p>
                  <p className="text-[11px] text-[#C84A20] font-medium">Donor #1 UI</p>
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleDemoLogin("ngo1@shareplate.org", "password123", "/")}
                  className="p-2.5 rounded-xl border border-[#EAE6DF] hover:border-[#2E7D52] hover:bg-[#E8F3EC] text-left transition-colors cursor-pointer"
                >
                  <p className="text-[12px] font-bold text-[#1C1B18]">Hope Kitchen</p>
                  <p className="text-[11px] text-[#2E7D52] font-medium">Verified NGO</p>
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleDemoLogin("ngo_pending@shareplate.org", "password123", "/")}
                  className="p-2.5 rounded-xl border border-[#FDE68A] bg-[#FEF3C7]/40 hover:border-[#D97706] text-left transition-colors cursor-pointer"
                >
                  <p className="text-[12px] font-bold text-[#1C1B18]">Sunrise Relief</p>
                  <p className="text-[11px] text-[#B45309] font-medium">Pending NGO</p>
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleDemoLogin("volunteer1@shareplate.org", "password123", "/")}
                  className="p-2.5 rounded-xl border border-[#EAE6DF] hover:border-[#3B66B0] hover:bg-[#ECF2FB] text-left transition-colors cursor-pointer"
                >
                  <p className="text-[12px] font-bold text-[#1C1B18]">Alex Volunteer</p>
                  <p className="text-[11px] text-[#3B66B0] font-medium">Volunteer UI</p>
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleDemoLogin("admin@shareplate.org", "password123", "/admin")}
                  className="p-2.5 rounded-xl border border-[#1C1B18]/20 bg-[#FAF9F6] hover:border-[#1C1B18] hover:bg-[#F0EDE6] text-left transition-colors cursor-pointer sm:col-span-2"
                >
                  <p className="text-[12px] font-bold text-[#1C1B18] flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#C84A20] shrink-0" />
                    <span>Platform Admin Console (/admin &amp; NGO Verifications)</span>
                  </p>
                  <p className="text-[11px] text-[#1C1B18] font-semibold">Approve / Reject NGO Licenses &amp; Manage Platform</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   ROLE ACCESS RESTRICTED VIEW (ENFORCES STRICT ISOLATION BETWEEN THE 3 USERS)
   ============================================================================ */
function RoleRestrictedView({
  requiredRoles,
  featureName,
}: {
  requiredRoles: UserRole[];
  featureName: string;
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="px-8 py-12 max-w-[720px] mx-auto">
      <div className="bg-white border border-[#EAE6DF] rounded-[20px] p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#FCEEE9] text-[#C84A20] flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <p className="text-[11px] font-bold tracking-[0.13em] text-[#C84A20] uppercase mb-1.5">
          ROLE ACCESS RESTRICTED
        </p>
        <h2 className="font-display text-[24px] font-extrabold text-[#1C1B18] tracking-[-0.02em]">
          {featureName} requires a {requiredRoles.join(" or ")} account
        </h2>
        <p className="text-[13.5px] text-[#7D776F] mt-2 max-w-[480px] mx-auto leading-relaxed">
          You are currently signed in as{" "}
          <span className="font-semibold text-[#1C1B18]">{user?.full_name}</span> (
          <span className="font-semibold text-[#C84A20]">{user?.role} UI</span>). One
          user role cannot access another role&apos;s workspace until they sign in with
          that role.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="px-4 py-2.5 rounded-xl bg-[#F5F3EE] hover:bg-[#EAE6DF] text-[#1C1B18] text-[13px] font-semibold transition-colors cursor-pointer"
          >
            Back to {user?.role} Overview
          </button>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="px-4 py-2.5 rounded-xl bg-[#C84A20] hover:bg-[#B33F19] text-white text-[13px] font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out &amp; switch to {requiredRoles[0]}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   SHARED STATUS BADGE & CALLOUT HELPERS
   ============================================================================ */
function StatusBadge({ status }: { status?: string }) {
  const s = (status || "available").toLowerCase();
  if (s === "available" || s === "open") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-[#E8F3EC] text-[#2E7D52]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D52]" />
        {s}
      </span>
    );
  }
  if (s === "claimed" || s === "requested" || s === "assigned" || s === "pending") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-[#FDF3E6] text-[#C87A1E]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#C87A1E]" />
        {s.replace("_", " ")}
      </span>
    );
  }
  if (s === "in_transit" || s === "picked_up") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-[#ECF2FB] text-[#3B66B0]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#3B66B0] animate-pulse" />
        In Transit
      </span>
    );
  }
  if (s === "delivered" || s === "completed" || s === "fulfilled" || s === "accepted") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-[#E8F3EC] text-[#1E5E3A]">
        <Check className="w-3 h-3" />
        {s.replace("_", " ")}
      </span>
    );
  }
  if (
    s === "cancelled" ||
    s === "pickup_failed" ||
    s === "delivery_failed" ||
    s === "failed_delivery" ||
    s === "rejected"
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-[#FCEEE9] text-[#A83B18]">
        <AlertCircle className="w-3 h-3" />
        {s.replace("_", " ")}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-[#F2EFE9] text-[#6E6A63]">
      {s.replace("_", " ")}
    </span>
  );
}

/* ============================================================================
   USER 1 UI: DONOR / RESTAURANT WORKSPACE (STRICT RBAC + ACTIVE/PAST + CANCELLATION MODAL)
   ============================================================================ */
function DonorOverviewPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeDonations, setActiveDonations] = useState<Listing[]>([]);
  const [pastDonations, setPastDonations] = useState<Listing[]>([]);
  const [openNgoRequests, setOpenNgoRequests] = useState<DonationRequest[]>([]);
  const [foodRescued, setFoodRescued] = useState<number>(0);
  const [handoversCount, setHandoversCount] = useState<number>(0);
  const [requestsCount, setRequestsCount] = useState<number>(0);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    setRefreshing(true);
    try {
      const [activeRes, pastRes, requestsRes, handoversRes, impactRes] = await Promise.allSettled([
        api.get(endpoints.donations.myDonations("active")),
        api.get(endpoints.donations.myDonations("past")),
        api.get(endpoints.requests.list),
        api.get(endpoints.handovers.my),
        api.get(endpoints.extras.impact),
      ]);

      if (activeRes.status === "fulfilled" && Array.isArray(activeRes.value.data)) {
        setActiveDonations(activeRes.value.data);
      } else {
        setActiveDonations([]);
      }

      if (pastRes.status === "fulfilled" && Array.isArray(pastRes.value.data)) {
        setPastDonations(pastRes.value.data);
      } else {
        setPastDonations([]);
      }

      if (requestsRes.status === "fulfilled" && Array.isArray(requestsRes.value.data)) {
        const allReqs: DonationRequest[] = requestsRes.value.data;
        setRequestsCount(allReqs.length);
        setOpenNgoRequests(
          allReqs.filter(
            (r) => r.request_type === "open_broadcast" && (r.status === "open" || r.status === "pending")
          )
        );
      } else {
        setRequestsCount(0);
        setOpenNgoRequests([]);
      }

      if (handoversRes.status === "fulfilled" && Array.isArray(handoversRes.value.data)) {
        setHandoversCount(
          handoversRes.value.data.filter(
            (h: Handover) =>
              h.status?.toLowerCase() === "delivered" || h.status?.toLowerCase() === "completed"
          ).length
        );
      } else {
        setHandoversCount(0);
      }

      if (impactRes.status === "fulfilled" && impactRes.value.data && typeof impactRes.value.data === "object") {
        const d = impactRes.value.data;
        const rescued = Number(d.food_rescued ?? d.total_food_rescued ?? d.meals_rescued ?? 0);
        setFoodRescued(Number.isNaN(rescued) ? 0 : rescued);
      } else {
        setFoodRescued(0);
      }
    } catch {
      setActiveDonations([]);
      setPastDonations([]);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <div className="px-8 py-7 max-w-[1240px] mx-auto">
      {/* Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-[11px] font-bold tracking-[0.13em] text-[#8A847C] uppercase mb-1.5">
            RESTAURANT DONOR WORKSPACE · {user?.full_name || "YOUR RESTAURANT"}
          </p>
          <h1 className="font-display text-[32px] font-extrabold text-[#1C1B18] tracking-[-0.025em] leading-tight">
            Good morning.
          </h1>
          <p className="text-[14px] text-[#7D776F] mt-1">
            Manage your restaurant&apos;s active food donations, historical batches, and urgent NGO meal requests.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => navigate("/requests")}
            className="bg-white border border-[#EAE6DF] hover:bg-[#F5F3EE] text-[#1C1B18] text-[13px] font-semibold px-4 py-2.5 rounded-xl inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <ClipboardList className="w-4 h-4 text-[#C84A20]" />
            <span>NGO Requests ({requestsCount})</span>
          </button>
          <button
            onClick={() => navigate("/listings")}
            className="bg-[#C84A20] hover:bg-[#B33F19] text-white text-[13px] font-semibold px-4 py-2.5 rounded-xl inline-flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add a listing</span>
          </button>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="bg-[#282A27] rounded-[20px] px-9 py-8 mb-8 relative overflow-hidden flex flex-col md:flex-row items-center justify-between min-h-[246px]">
        <div className="max-w-[460px] z-10">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#E06D44]" />
            <span className="text-[10.5px] font-bold tracking-[0.14em] text-[#B8B4AC] uppercase">
              THE GOOD FOOD MOVEMENT
            </span>
          </div>

          <h2 className="font-display text-[33px] font-extrabold leading-[1.14] tracking-[-0.02em] mb-3.5">
            <span className="text-white block">Surplus food has a</span>
            <span className="text-[#E06338] block">place to go.</span>
          </h2>

          <p className="text-[13.5px] text-[#B8B4AC] leading-[1.6] mb-5 max-w-[420px]">
            Connect what you have with the people who need it. Every listing
            makes a difference.
          </p>

          <Link
            to="/listings"
            className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#E06338] hover:text-[#F07348] transition-colors"
          >
            <span>Manage my active &amp; past donations</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <PlateIllustration />
      </div>

      {/* Your impact, in motion */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-[17px] font-bold text-[#1C1B18]">
              Your restaurant&apos;s impact, in motion
            </h3>
            <p className="text-[12.5px] text-[#7D776F] mt-0.5">
              Scoped strictly to your restaurant&apos;s donations ({user?.full_name})
            </p>
          </div>

          <button
            onClick={fetchDashboard}
            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#C84A20] hover:text-[#A83B18] transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#EAE6DF] rounded-2xl p-5">
            <div className="w-9 h-9 rounded-xl bg-[#FCEEE9] text-[#C84A20] flex items-center justify-center mb-4">
              <Package className="w-[18px] h-[18px]" />
            </div>
            <p className="text-[12px] font-medium text-[#6E6A63]">Active donations</p>
            <p className="font-display text-[28px] font-extrabold text-[#1C1B18] leading-tight my-1">
              {activeDonations.length}
            </p>
            <p className="text-[11.5px] text-[#8A847C]">Available, claimed, or in transit</p>
          </div>

          <div className="bg-white border border-[#EAE6DF] rounded-2xl p-5">
            <div className="w-9 h-9 rounded-xl bg-[#E8F3EC] text-[#2E7D52] flex items-center justify-center mb-4">
              <HandHeart className="w-[18px] h-[18px]" />
            </div>
            <p className="text-[12px] font-medium text-[#6E6A63]">Past donations</p>
            <p className="font-display text-[28px] font-extrabold text-[#1C1B18] leading-tight my-1">
              {pastDonations.length}
            </p>
            <p className="text-[11.5px] text-[#8A847C]">Delivered, cancelled, or closed</p>
          </div>

          <div className="bg-white border border-[#EAE6DF] rounded-2xl p-5">
            <div className="w-9 h-9 rounded-xl bg-[#ECF2FB] text-[#3B66B0] flex items-center justify-center mb-4">
              <Utensils className="w-[18px] h-[18px]" />
            </div>
            <p className="text-[12px] font-medium text-[#6E6A63]">Successful handovers</p>
            <p className="font-display text-[28px] font-extrabold text-[#1C1B18] leading-tight my-1">
              {handoversCount || foodRescued}
            </p>
            <p className="text-[11.5px] text-[#8A847C]">Completed volunteer deliveries</p>
          </div>

          <div className="bg-white border border-[#EAE6DF] rounded-2xl p-5">
            <div className="w-9 h-9 rounded-xl bg-[#FDF3E6] text-[#C87A1E] flex items-center justify-center mb-4">
              <Clock className="w-[18px] h-[18px]" />
            </div>
            <p className="text-[12px] font-medium text-[#6E6A63]">Incoming NGO requests</p>
            <p className="font-display text-[28px] font-extrabold text-[#1C1B18] leading-tight my-1">
              {requestsCount}
            </p>
            <p className="text-[11.5px] text-[#8A847C]">Direct claims &amp; open broadcasts</p>
          </div>
        </div>
      </div>

      {/* Prominent Active Donations Section */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-[17px] font-bold text-[#1C1B18]">
              Your Active Donations
            </h3>
            <p className="text-[12.5px] text-[#7D776F]">
              Live batches currently available, claimed by an NGO, or in transit with a volunteer
            </p>
          </div>
          <Link
            to="/listings"
            className="text-[12.5px] font-semibold text-[#C84A20] hover:underline"
          >
            Open Active &amp; Past Donations →
          </Link>
        </div>

        {activeDonations.length === 0 ? (
          <div className="bg-white border border-[#EAE6DF] rounded-2xl p-6 text-center">
            <p className="text-[13.5px] font-semibold text-[#1C1B18]">
              No active donations right now
            </p>
            <p className="text-[12.5px] text-[#7D776F] mt-1">
              Post a new surplus listing or view your Past Donations history.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeDonations.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="bg-white border border-[#EAE6DF] rounded-2xl p-5 flex items-start justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-display font-bold text-[15px] text-[#1C1B18]">
                      {item.title}
                    </h4>
                  </div>
                  <p className="text-[12.5px] font-semibold text-[#4A4640]">
                    Quantity: {item.quantity || "Standard batch"}
                  </p>
                  {item.pickup_location && (
                    <p className="text-[12px] text-[#7D776F] mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#8A847C]" />
                      {item.pickup_location}
                    </p>
                  )}
                  {item.claimed_by_ngo_name && (
                    <p className="text-[12px] text-[#2E7D52] font-medium mt-1">
                      Claimed by NGO: {item.claimed_by_ngo_name}
                    </p>
                  )}
                </div>
                <StatusBadge status={item.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Urgent Open NGO Broadcast Requests */}
      {openNgoRequests.length > 0 && (
        <div className="mt-8 bg-[#FDF3E6]/70 border border-[#F3D9B1] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#C87A1E]">
                LIVE NGO FOOD REQUEST FEED
              </span>
              <h3 className="font-display text-[16px] font-bold text-[#1C1B18]">
                Local NGOs needing food donations right now
              </h3>
            </div>
            <Link
              to="/requests"
              className="text-[12.5px] font-semibold text-[#C84A20] hover:underline"
            >
              Fulfill requests →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {openNgoRequests.slice(0, 4).map((req) => (
              <div
                key={req.id}
                className="bg-white border border-[#EAE6DF] rounded-xl p-4 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-[14px] text-[#1C1B18]">
                      {req.ngo_name || req.requester_name}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10.5px] font-bold uppercase bg-[#FCEEE9] text-[#C84A20]">
                      {req.urgency_level || "Normal"}
                    </span>
                  </div>
                  <p className="text-[12.5px] text-[#4A4640] font-semibold mt-0.5">
                    Needs: {req.quantity} · By: {req.required_by || "ASAP"}
                  </p>
                  {req.notes && (
                    <p className="text-[12px] text-[#7D776F] mt-0.5">{req.notes}</p>
                  )}
                </div>
                <button
                  onClick={() => navigate("/requests")}
                  className="px-3 py-1.5 rounded-xl bg-[#C84A20] text-white text-[12px] font-semibold shrink-0 cursor-pointer"
                >
                  Respond
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const CANCELLATION_REASONS = [
  "Food spoiled / failed quality check",
  "Emergency restaurant closure",
  "Quantity miscalculation / no surplus left",
  "Claimed in-person by local walk-in shelter",
  "Other",
];

function DonorListingsPage() {
  const { user } = useAuth();
  const [viewTab, setViewTab] = useState<"active" | "past">("active");
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Cancellation Modal State
  const [cancelTarget, setCancelTarget] = useState<Listing | null>(null);
  const [selectedCancelReason, setSelectedCancelReason] = useState<string>(CANCELLATION_REASONS[0]);
  const [customCancelNote, setCustomCancelNote] = useState<string>("");
  const [submittingCancel, setSubmittingCancel] = useState(false);

  const loadListings = async (tab: "active" | "past" = viewTab) => {
    setLoading(true);
    try {
      const res = await api.get(endpoints.donations.myDonations(tab));
      if (Array.isArray(res.data)) {
        setListings(res.data);
      }
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setStatusFilter("all");
    loadListings(viewTab);
  }, [viewTab]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    try {
      await api.post(endpoints.listings.create, {
        title,
        description,
        quantity,
        pickup_location: pickupLocation,
      });
      setTitle("");
      setDescription("");
      setQuantity("");
      setPickupLocation("");
      setShowCreate(false);
      setViewTab("active");
      setSuccessMsg("Food donation listing published to your Active Donations!");
      loadListings("active");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const openCancelModal = (item: Listing) => {
    setCancelTarget(item);
    setSelectedCancelReason(CANCELLATION_REASONS[0]);
    setCustomCancelNote("");
  };

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelTarget) return;

    const finalReason =
      selectedCancelReason === "Other"
        ? customCancelNote.trim()
        : customCancelNote.trim()
        ? `${selectedCancelReason} — ${customCancelNote.trim()}`
        : selectedCancelReason;

    if (!finalReason) {
      setError("A cancellation reason is mandatory.");
      return;
    }

    setSubmittingCancel(true);
    setError(null);
    try {
      await api.patch(endpoints.donations.cancel(cancelTarget.id), {
        reason: finalReason,
      });
      setCancelTarget(null);
      setSuccessMsg(
        `Donation "${cancelTarget.title}" was cancelled with reason recorded in Past Donations.`
      );
      loadListings(viewTab);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmittingCancel(false);
    }
  };

  const filtered = listings.filter((item) => {
    const matchesSearch =
      !search ||
      item.title?.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase()) ||
      item.cancellation_reason?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (item.status || "available").toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusPills =
    viewTab === "active"
      ? ["all", "available", "requested", "claimed", "in_transit"]
      : ["all", "delivered", "cancelled", "pickup_failed", "delivery_failed", "expired"];

  return (
    <div className="px-8 py-7 max-w-[1240px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-[11px] font-bold tracking-[0.13em] text-[#C84A20] uppercase mb-1.5">
            RESTAURANT PORTAL · MY DONATIONS ({user?.full_name || "OWNER VIEW ONLY"})
          </p>
          <h1 className="font-display text-[28px] font-extrabold text-[#1C1B18] tracking-[-0.02em]">
            My restaurant food donations
          </h1>
          <p className="text-[14px] text-[#7D776F] mt-1">
            View only your restaurant&apos;s active batches or switch to Past Donations for full delivery &amp; cancellation audit trails.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Active vs Past Donations Toggle */}
          <div className="inline-flex bg-white border border-[#EAE6DF] p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewTab("active")}
              className={`px-3.5 py-2 rounded-lg text-[12.5px] font-semibold transition-colors cursor-pointer ${
                viewTab === "active"
                  ? "bg-[#C84A20] text-white"
                  : "text-[#6E6A63] hover:text-[#1C1B18]"
              }`}
            >
              Active Donations
            </button>
            <button
              type="button"
              onClick={() => setViewTab("past")}
              className={`px-3.5 py-2 rounded-lg text-[12.5px] font-semibold transition-colors cursor-pointer ${
                viewTab === "past"
                  ? "bg-[#1C1B18] text-white"
                  : "text-[#6E6A63] hover:text-[#1C1B18]"
              }`}
            >
              Past Donations
            </button>
          </div>

          <button
            onClick={() => setShowCreate(!showCreate)}
            className="bg-[#C84A20] hover:bg-[#B33F19] text-white text-[13px] font-semibold px-4 py-2.5 rounded-xl inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{showCreate ? "Close form" : "Add a listing"}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-5 bg-[#FCEEE9] border border-[#F2C9B9] text-[#A83B18] text-[13px] px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="mb-5 bg-[#E8F3EC] border border-[#B8DFC6] text-[#2E7D52] text-[13px] px-4 py-3 rounded-xl">
          {successMsg}
        </div>
      )}

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="bg-white border border-[#EAE6DF] rounded-2xl p-6 mb-6 space-y-4"
        >
          <h3 className="font-display font-bold text-[16px] text-[#1C1B18]">
            Create food listing
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              required
              placeholder="Food title (e.g. Fresh Sourdough Loaves)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-[#EAE6DF] text-[13.5px] focus:outline-none focus:border-[#C84A20]"
            />
            <input
              type="text"
              required
              placeholder="Quantity (e.g. 15 meals / 8 kg)"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-[#EAE6DF] text-[13.5px] focus:outline-none focus:border-[#C84A20]"
            />
            <input
              type="text"
              placeholder="Pickup location"
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-[#EAE6DF] text-[13.5px] focus:outline-none focus:border-[#C84A20]"
            />
            <input
              type="text"
              placeholder="Description / dietary notes"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-[#EAE6DF] text-[13.5px] focus:outline-none focus:border-[#C84A20]"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 rounded-xl text-[13px] font-medium text-[#6E6A63] hover:bg-[#F5F3EE] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#C84A20] hover:bg-[#B33F19] text-white text-[13px] font-semibold px-4 py-2 rounded-xl cursor-pointer"
            >
              Publish listing
            </button>
          </div>
        </form>
      )}

      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#8A847C] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={`Search ${viewTab} donations...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white pl-10 pr-4 py-2.5 rounded-xl border border-[#EAE6DF] text-[13.5px] focus:outline-none focus:border-[#C84A20]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-white border border-[#EAE6DF] p-1 rounded-xl">
          {statusPills.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium capitalize transition-colors cursor-pointer ${
                statusFilter === status
                  ? "bg-[#FCEEE9] text-[#C84A20] font-semibold"
                  : "text-[#6E6A63] hover:text-[#1C1B18]"
              }`}
            >
              {status.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-[#EAE6DF] rounded-2xl p-10 text-center text-[13.5px] text-[#7D776F]">
          Loading your {viewTab} donations...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-[#EAE6DF] rounded-2xl p-10 text-center">
          <Package className="w-8 h-8 text-[#C84A20] mx-auto mb-3 opacity-80" />
          <p className="font-display font-bold text-[15px] text-[#1C1B18]">
            {viewTab === "active"
              ? "No active food donations found"
              : "No past food donations found"}
          </p>
          <p className="text-[13px] text-[#7D776F] mt-1">
            {viewTab === "active"
              ? 'Click "Add a listing" above to share surplus food with partner NGOs.'
              : "Completed, delivered, failed, or cancelled donations will appear here with full audit reasons."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-[#EAE6DF] rounded-2xl p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <h4 className="font-display font-bold text-[15.5px] text-[#1C1B18]">
                    {item.title}
                  </h4>
                  <StatusBadge status={item.status} />
                </div>

                {item.quantity && (
                  <p className="text-[12.5px] font-semibold text-[#4A4640] mb-1.5">
                    Quantity: {item.quantity}
                  </p>
                )}
                {item.description && (
                  <p className="text-[13px] text-[#7D776F] mb-3">{item.description}</p>
                )}
                {item.pickup_location && (
                  <p className="text-[12px] text-[#8A847C] flex items-center gap-1.5 mb-2">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.pickup_location}</span>
                  </p>
                )}

                {item.claimed_by_ngo_name && (
                  <p className="text-[12px] text-[#2E7D52] font-medium mb-2">
                    Claimed by: {item.claimed_by_ngo_name}
                  </p>
                )}

                {/* Cancellation / Failure Audit Callout Box on Past Donations */}
                {item.cancellation_reason && (
                  <div className="mt-2 mb-3 p-3 rounded-xl bg-[#FCEEE9] border border-[#F2C9B9] text-[#A83B18] text-[12px]">
                    <p className="font-bold uppercase tracking-wider text-[10.5px] mb-0.5">
                      Cancellation Reason
                    </p>
                    <p>{item.cancellation_reason}</p>
                  </div>
                )}

                {item.pickup_failure_reason && (
                  <div className="mt-2 mb-3 p-3 rounded-xl bg-[#FCEEE9] border border-[#F2C9B9] text-[#A83B18] text-[12px]">
                    <p className="font-bold uppercase tracking-wider text-[10.5px] mb-0.5">
                      Volunteer Pickup Failed ({item.volunteer_name || "Volunteer"})
                    </p>
                    <p>{item.pickup_failure_reason}</p>
                  </div>
                )}

                {item.delivery_failure_reason && (
                  <div className="mt-2 mb-3 p-3 rounded-xl bg-[#FCEEE9] border border-[#F2C9B9] text-[#A83B18] text-[12px]">
                    <p className="font-bold uppercase tracking-wider text-[10.5px] mb-0.5">
                      Volunteer Delivery Failed ({item.volunteer_name || "Volunteer"})
                    </p>
                    <p>{item.delivery_failure_reason}</p>
                  </div>
                )}

                {item.distribution_proof && (
                  <div className="mt-2 mb-3 p-3 rounded-xl bg-[#E8F3EC] border border-[#B8DFC6] text-[#1E5E3A] text-[12px]">
                    <p className="font-bold uppercase tracking-wider text-[10.5px] mb-0.5">
                      Verified Distribution Note
                    </p>
                    <p>{item.distribution_proof}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#F0EDE6] mt-2">
                <span className="text-[11.5px] text-[#8A847C]">
                  {item.created_at
                    ? new Date(item.created_at).toLocaleDateString()
                    : `Owner: ${item.donor_name || user?.full_name || "You"}`}
                </span>
                {viewTab === "active" && (
                  <button
                    type="button"
                    onClick={() => openCancelModal(item)}
                    className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#A83B18] hover:underline cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancel listing</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mandatory Cancellation Reason Modal */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE6DF] rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#A83B18]">
                MANDATORY CANCELLATION AUDIT
              </span>
              <button
                onClick={() => setCancelTarget(null)}
                className="text-[#8A847C] hover:text-[#1C1B18] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <h3 className="font-display font-bold text-[18px] text-[#1C1B18] mb-1">
              Cancel &ldquo;{cancelTarget.title}&rdquo;?
            </h3>
            <p className="text-[13px] text-[#7D776F] mb-4">
              Please select a mandatory cancellation reason. This reason will be saved to your Past Donations audit log and shared with any claiming NGO.
            </p>

            <form onSubmit={handleConfirmCancel} className="space-y-3.5">
              <div>
                <label className="block text-[12px] font-semibold text-[#1C1B18] mb-1.5">
                  Reason for cancellation *
                </label>
                <select
                  value={selectedCancelReason}
                  onChange={(e) => setSelectedCancelReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE6DF] text-[13px] bg-white focus:outline-none focus:border-[#C84A20]"
                >
                  {CANCELLATION_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#1C1B18] mb-1.5">
                  {selectedCancelReason === "Other"
                    ? "Custom note (Required for Other) *"
                    : "Additional context / note (Optional)"}
                </label>
                <textarea
                  rows={3}
                  required={selectedCancelReason === "Other"}
                  placeholder="Provide details on why this batch is being cancelled..."
                  value={customCancelNote}
                  onChange={(e) => setCustomCancelNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE6DF] text-[13px] focus:outline-none focus:border-[#C84A20]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelTarget(null)}
                  className="px-4 py-2 rounded-xl text-[13px] font-medium text-[#6E6A63] hover:bg-[#F5F3EE] cursor-pointer"
                >
                  Keep Active
                </button>
                <button
                  type="submit"
                  disabled={
                    submittingCancel ||
                    (selectedCancelReason === "Other" && !customCancelNote.trim())
                  }
                  className="px-4 py-2 rounded-xl bg-[#A83B18] hover:bg-[#8E3012] disabled:opacity-50 text-white text-[13px] font-semibold cursor-pointer"
                >
                  {submittingCancel ? "Cancelling..." : "Confirm Cancellation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function DonorRequestsPage() {
  const [requests, setRequests] = useState<DonationRequest[]>([]);
  const [tab, setTab] = useState<"claims" | "broadcasts">("claims");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadRequests = async () => {
    try {
      const res = await api.get(endpoints.requests.list);
      if (Array.isArray(res.data)) {
        setRequests(res.data);
      }
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleAction = async (id: number | string, action: "accept" | "reject") => {
    setError(null);
    setSuccessMsg(null);
    try {
      const url =
        action === "accept"
          ? endpoints.requests.accept(id)
          : endpoints.requests.reject(id);
      await api.post(url);
      setSuccessMsg(
        action === "accept"
          ? "Request approved and dispatched to the Volunteer handover queue!"
          : "Request declined."
      );
      loadRequests();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleFulfillBroadcast = async (req: DonationRequest) => {
    setError(null);
    setSuccessMsg(null);
    try {
      await api.patch(endpoints.requests.fulfill(req.id));
      setSuccessMsg(
        `You pledged to fulfill ${req.ngo_name || req.requester_name}'s food request! A volunteer dispatch has been created.`
      );
      loadRequests();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const directClaims = requests.filter((r) => r.request_type !== "open_broadcast");
  const openBroadcasts = requests.filter((r) => r.request_type === "open_broadcast");

  const displayed = tab === "claims" ? directClaims : openBroadcasts;

  return (
    <div className="px-8 py-7 max-w-[1240px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-[11px] font-bold tracking-[0.13em] text-[#C84A20] uppercase mb-1.5">
            RESTAURANT PORTAL · DONATION COORDINATION
          </p>
          <h1 className="font-display text-[28px] font-extrabold text-[#1C1B18] tracking-[-0.02em]">
            NGO claims &amp; open donation requests
          </h1>
          <p className="text-[14px] text-[#7D776F] mt-1">
            Approve direct NGO claims on your listings or fulfill urgent broadcast requests posted by community NGOs.
          </p>
        </div>

        <div className="inline-flex bg-white border border-[#EAE6DF] p-1 rounded-xl">
          <button
            onClick={() => setTab("claims")}
            className={`px-3.5 py-2 rounded-lg text-[12.5px] font-semibold cursor-pointer ${
              tab === "claims"
                ? "bg-[#FCEEE9] text-[#C84A20]"
                : "text-[#6E6A63] hover:text-[#1C1B18]"
            }`}
          >
            Direct Listing Claims ({directClaims.length})
          </button>
          <button
            onClick={() => setTab("broadcasts")}
            className={`px-3.5 py-2 rounded-lg text-[12.5px] font-semibold cursor-pointer ${
              tab === "broadcasts"
                ? "bg-[#FCEEE9] text-[#C84A20]"
                : "text-[#6E6A63] hover:text-[#1C1B18]"
            }`}
          >
            NGO Broadcast Needs ({openBroadcasts.length})
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-5 bg-[#FCEEE9] border border-[#F2C9B9] text-[#A83B18] text-[13px] px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="mb-5 bg-[#E8F3EC] border border-[#B8DFC6] text-[#2E7D52] text-[13px] px-4 py-3 rounded-xl">
          {successMsg}
        </div>
      )}

      {displayed.length === 0 ? (
        <div className="bg-white border border-[#EAE6DF] rounded-2xl p-10 text-center">
          <ClipboardList className="w-8 h-8 text-[#C84A20] mx-auto mb-3 opacity-80" />
          <p className="font-display font-bold text-[15px] text-[#1C1B18]">
            {tab === "claims"
              ? "No direct NGO claims on your listings yet"
              : "No open NGO broadcast requests right now"}
          </p>
          <p className="text-[13px] text-[#7D776F] mt-1">
            {tab === "claims"
              ? "When an NGO requests one of your food listings, it will appear here for approval."
              : "When an NGO posts a 'Request Food Donation' broadcast, your restaurant can fulfill it here."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((req) => (
            <div
              key={req.id}
              className="bg-white border border-[#EAE6DF] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h4 className="font-display font-bold text-[15px] text-[#1C1B18]">
                    {req.request_type === "open_broadcast"
                      ? `${req.ngo_name || req.requester_name} — Food Request`
                      : req.listing_title || `Listing #${req.listing_id ?? req.id}`}
                  </h4>
                  <StatusBadge status={req.status || "pending"} />
                  {req.urgency_level && (
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase bg-[#FCEEE9] text-[#C84A20]">
                      Urgency: {req.urgency_level}
                    </span>
                  )}
                </div>

                <p className="text-[13px] text-[#7D776F] mt-1">
                  NGO:{" "}
                  <span className="font-semibold text-[#1C1B18]">
                    {req.ngo_name || req.requester_name || "Community NGO"}
                  </span>
                  {req.quantity ? ` · Quantity Needed: ${req.quantity}` : ""}
                  {req.required_by ? ` · Required By: ${req.required_by}` : ""}
                </p>
                {req.notes && (
                  <p className="text-[12.5px] text-[#4A4640] mt-1">
                    Notes: &ldquo;{req.notes}&rdquo;
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {req.request_type === "open_broadcast" ? (
                  req.status === "open" || req.status === "pending" ? (
                    <button
                      onClick={() => handleFulfillBroadcast(req)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C84A20] hover:bg-[#B33F19] text-white text-[12.5px] font-semibold cursor-pointer"
                    >
                      <HandHeart className="w-4 h-4" />
                      <span>Fulfill Request</span>
                    </button>
                  ) : req.status === "rejected" || req.status === "declined" ? (
                    <span className="text-[12.5px] font-semibold px-3 py-1.5 rounded-xl bg-[#FCEEE9] text-[#C84A20]">
                      Declined
                    </span>
                  ) : req.status === "cancelled" ? (
                    <span className="text-[12.5px] font-semibold px-3 py-1.5 rounded-xl bg-[#FCEEE9] text-[#A83B18]">
                      Cancelled
                    </span>
                  ) : req.status === "completed" || req.status === "delivered" ? (
                    <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold px-3 py-1.5 rounded-xl bg-[#E8F3EC] text-[#1E5E3A] border border-[#B8DFC6]">
                      <Check className="w-3.5 h-3.5" />
                      <span>Completed · Delivered</span>
                    </span>
                  ) : (
                    <span className="text-[12.5px] font-semibold px-3 py-1.5 rounded-xl bg-[#E8F3EC] text-[#2E7D52]">
                      Fulfilled · Dispatched
                    </span>
                  )
                ) : !req.status || req.status === "pending" ? (
                  <>
                    <button
                      onClick={() => handleAction(req.id, "accept")}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#E8F3EC] text-[#2E7D52] text-[12.5px] font-semibold cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Accept &amp; dispatch</span>
                    </button>
                    <button
                      onClick={() => handleAction(req.id, "reject")}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FCEEE9] text-[#C84A20] text-[12.5px] font-semibold cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </>
                ) : req.status === "completed" || req.status === "delivered" ? (
                  <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold px-3 py-1.5 rounded-xl bg-[#E8F3EC] text-[#1E5E3A] border border-[#B8DFC6]">
                    <Check className="w-3.5 h-3.5" />
                    <span>Completed · Delivered</span>
                  </span>
                ) : req.status === "accepted" ||
                  req.status === "fulfilled" ||
                  req.status === "claimed" ||
                  req.status === "assigned" ? (
                  <span className="text-[12.5px] font-semibold px-3 py-1.5 rounded-xl bg-[#E8F3EC] text-[#2E7D52]">
                    Approved · Sent to Volunteers
                  </span>
                ) : req.status === "in_transit" || req.status === "picked_up" ? (
                  <span className="text-[12.5px] font-semibold px-3 py-1.5 rounded-xl bg-[#ECF2FB] text-[#3B66B0]">
                    In Transit with Volunteer
                  </span>
                ) : req.status === "cancelled" ? (
                  <span className="text-[12.5px] font-semibold px-3 py-1.5 rounded-xl bg-[#FCEEE9] text-[#A83B18]">
                    Cancelled
                  </span>
                ) : req.status === "failed_delivery" ||
                  req.status === "delivery_failed" ||
                  req.status === "pickup_failed" ? (
                  <span className="text-[12.5px] font-semibold px-3 py-1.5 rounded-xl bg-[#FCEEE9] text-[#A83B18]">
                    Delivery / Pickup Failed
                  </span>
                ) : (
                  <span className="text-[12.5px] font-semibold px-3 py-1.5 rounded-xl bg-[#FCEEE9] text-[#C84A20]">
                    Declined
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   SHARED NGO "REQUEST FOOD DONATION" MODAL
   ============================================================================ */
function NgoRequestDonationModal({
  open,
  onClose,
  defaultNgoName,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  defaultNgoName: string;
  onSuccess: () => void;
}) {
  const [ngoName, setNgoName] = useState(defaultNgoName);
  const [quantityNeeded, setQuantityNeeded] = useState("");
  const [requiredByTime, setRequiredByTime] = useState("");
  const [urgencyLevel, setUrgencyLevel] = useState<"low" | "medium" | "high" | "critical">("high");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (defaultNgoName) setNgoName(defaultNgoName);
  }, [defaultNgoName]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantityNeeded.trim() || !requiredByTime.trim()) {
      setErr("Quantity needed and required-by deadline are mandatory.");
      return;
    }
    setSubmitting(true);
    setErr(null);
    try {
      await api.post(endpoints.requests.create, {
        ngo_name: ngoName.trim() || defaultNgoName,
        quantity_needed: quantityNeeded.trim(),
        required_by_time: requiredByTime.trim(),
        urgency_level: urgencyLevel,
        notes: notes.trim() || undefined,
      });
      setQuantityNeeded("");
      setRequiredByTime("");
      setNotes("");
      onSuccess();
      onClose();
    } catch (error) {
      setErr(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white border border-[#EAE6DF] rounded-2xl max-w-lg w-full p-6 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#2E7D52]">
            NGO BROADCAST · REQUEST FOOD DONATION
          </span>
          <button
            onClick={onClose}
            className="text-[#8A847C] hover:text-[#1C1B18] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <h3 className="font-display font-bold text-[19px] text-[#1C1B18] mb-1">
          Post a Food Donation Request
        </h3>
        <p className="text-[13px] text-[#7D776F] mb-4">
          Broadcast your organization&apos;s meal requirements directly to partner restaurants and platform administrators.
        </p>

        {err && (
          <div className="mb-4 bg-[#FCEEE9] border border-[#F2C9B9] text-[#A83B18] text-[12.5px] px-3.5 py-2.5 rounded-xl">
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[12px] font-semibold text-[#1C1B18] mb-1">
              NGO Name *
            </label>
            <input
              type="text"
              required
              value={ngoName}
              onChange={(e) => setNgoName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE6DF] text-[13px] bg-[#FAF9F6] focus:outline-none focus:border-[#2E7D52]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[12px] font-semibold text-[#1C1B18] mb-1">
                Quantity Needed (meals / kg) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 60 hot meals or 25 kg"
                value={quantityNeeded}
                onChange={(e) => setQuantityNeeded(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE6DF] text-[13px] focus:outline-none focus:border-[#2E7D52]"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#1C1B18] mb-1">
                Required By (Date &amp; Time) *
              </label>
              <input
                type="datetime-local"
                required
                value={requiredByTime}
                onChange={(e) => setRequiredByTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE6DF] text-[13px] focus:outline-none focus:border-[#2E7D52]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#1C1B18] mb-1">
              Urgency Level
            </label>
            <select
              value={urgencyLevel}
              onChange={(e) =>
                setUrgencyLevel(e.target.value as "low" | "medium" | "high" | "critical")
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE6DF] text-[13px] bg-white focus:outline-none focus:border-[#2E7D52]"
            >
              <option value="low">Low — Standard community pantry restock</option>
              <option value="medium">Medium — Needed for scheduled meal service</option>
              <option value="high">High — Urgent same-day shelter distribution</option>
              <option value="critical">Critical — Emergency relief shortage</option>
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#1C1B18] mb-1">
              Dietary Requirements &amp; Delivery Location Details
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Vegetarian preferred, drop-off at Gate 2 Community Kitchen..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE6DF] text-[13px] focus:outline-none focus:border-[#2E7D52]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-[13px] font-medium text-[#6E6A63] hover:bg-[#F5F3EE] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-[#2E7D52] hover:bg-[#256643] disabled:opacity-50 text-white text-[13px] font-semibold cursor-pointer"
            >
              {submitting ? "Posting Request..." : "Broadcast Food Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============================================================================
   USER 2 UI: NGO / RECIPIENT WORKSPACE (ACTIVE CLAIMS + PAST CLAIMS + REQUEST DONATION MODAL)
   ============================================================================ */
function NgoOverviewPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [availableListings, setAvailableListings] = useState<Listing[]>([]);
  const [activeClaims, setActiveClaims] = useState<NgoClaimRecord[]>([]);
  const [pastClaims, setPastClaims] = useState<NgoClaimRecord[]>([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [bannerMsg, setBannerMsg] = useState<string | null>(null);

  const isVerifiedNgo = user?.verification_status === "approved";

  const fetchNgoDashboard = async () => {
    setRefreshing(true);
    try {
      const [listingsRes, activeClaimsRes, pastClaimsRes] = await Promise.allSettled([
        api.get(endpoints.listings.list),
        api.get(endpoints.claims.myClaims("active")),
        api.get(endpoints.claims.myClaims("past")),
      ]);

      if (listingsRes.status === "fulfilled" && Array.isArray(listingsRes.value.data)) {
        setAvailableListings(
          listingsRes.value.data.filter(
            (l: Listing) => !l.status || l.status.toLowerCase() === "available"
          )
        );
      }

      if (activeClaimsRes.status === "fulfilled" && Array.isArray(activeClaimsRes.value.data)) {
        setActiveClaims(activeClaimsRes.value.data);
      }

      if (pastClaimsRes.status === "fulfilled" && Array.isArray(pastClaimsRes.value.data)) {
        setPastClaims(pastClaimsRes.value.data);
      }
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNgoDashboard();
  }, []);

  // Real-Time SSE listener: instantly remove any donation claimed by another NGO
  useEffect(() => {
    let es: EventSource | null = null;
    try {
      es = new EventSource(endpoints.events.stream);
      es.addEventListener("donation:claimed", (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload?.donationId !== undefined) {
            setAvailableListings((prev) =>
              prev.filter((item) => String(item.id) !== String(payload.donationId))
            );
          }
        } catch {
          // ignore malformed SSE event
        }
      });
    } catch {
      // SSE optional fallback
    }
    return () => {
      es?.close();
    };
  }, []);

  const deliveredCount = pastClaims.filter(
    (c) => (c.claim_status || c.status) === "delivered"
  ).length;

  return (
    <div className="px-8 py-7 max-w-[1240px] mx-auto">
      <NgoVerificationGateBanner />

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-[11px] font-bold tracking-[0.13em] text-[#2E7D52] uppercase mb-1.5">
            NGO RECIPIENT PORTAL · COMMUNITY DISTRIBUTION
          </p>
          <h1 className="font-display text-[32px] font-extrabold text-[#1C1B18] tracking-[-0.025em] leading-tight">
            Welcome, {user?.full_name}.
          </h1>
          <p className="text-[14px] text-[#7D776F] mt-1">
            Claim available restaurant surplus, track active deliveries, or broadcast a new Food Donation Request.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            disabled={!isVerifiedNgo}
            onClick={() => setShowRequestModal(true)}
            title={
              !isVerifiedNgo
                ? "Available once your NGO license is verified by administrators"
                : "Post a Food Donation Request"
            }
            className="bg-[#C84A20] hover:bg-[#B33F19] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[13px] font-semibold px-4 py-2.5 rounded-xl inline-flex items-center gap-2 shadow-2xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Request Food Donation</span>
          </button>
          <button
            onClick={() => navigate("/listings")}
            className="bg-[#2E7D52] hover:bg-[#256643] text-white text-[13px] font-semibold px-4 py-2.5 rounded-xl inline-flex items-center gap-2 shadow-2xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Search className="w-4 h-4" />
            <span>Browse available food</span>
          </button>
        </div>
      </div>

      {bannerMsg && (
        <div className="mb-6 bg-[#E8F3EC] border border-[#B8DFC6] text-[#2E7D52] text-[13px] px-4 py-3 rounded-xl">
          {bannerMsg}
        </div>
      )}

      {/* NGO Hero Banner */}
      <div className="bg-[#1F2D26] rounded-[20px] px-9 py-8 mb-8 relative overflow-hidden flex flex-col md:flex-row items-center justify-between min-h-[230px]">
        <div className="max-w-[490px] z-10">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-3.5 h-3.5 text-[#68C58E]" />
            <span className="text-[10.5px] font-bold tracking-[0.14em] text-[#B8C7BE] uppercase">
              PARTNER NGO NETWORK
            </span>
          </div>

          <h2 className="font-display text-[31px] font-extrabold leading-[1.14] tracking-[-0.02em] mb-3.5">
            <span className="text-white block">Source fresh surplus meals</span>
            <span className="text-[#68C58E] block">for the people you serve.</span>
          </h2>

          <p className="text-[13.5px] text-[#B8C7BE] leading-[1.6] mb-5">
            Claim available restaurant donations or post an urgent Food Donation Request so local kitchens can cook or allocate surplus for your hub.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <button
              disabled={!isVerifiedNgo}
              onClick={() => setShowRequestModal(true)}
              className="inline-flex items-center gap-2 text-[13px] font-semibold text-white bg-[#2E7D52] disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-xl cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Request Food Donation</span>
            </button>
            <Link
              to="/requests"
              className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#68C58E] hover:underline"
            >
              <span>View Active &amp; Past Claims</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/leaderboard"
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#FCD34D] hover:underline"
            >
              <Trophy className="w-4 h-4" />
              <span>Donor Leaderboard</span>
            </Link>
          </div>
        </div>

        <PlateIllustration />
      </div>

      {/* NGO Metrics */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display text-[17px] font-bold text-[#1C1B18]">
            NGO distribution metrics
          </h3>
          <p className="text-[12.5px] text-[#7D776F] mt-0.5">
            Live availability, active claims in progress, and historical audit records
          </p>
        </div>
        <button
          onClick={fetchNgoDashboard}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#2E7D52] cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-[#EAE6DF] rounded-2xl p-5">
          <div className="w-9 h-9 rounded-xl bg-[#E8F3EC] text-[#2E7D52] flex items-center justify-center mb-4">
            <Package className="w-[18px] h-[18px]" />
          </div>
          <p className="text-[12px] font-medium text-[#6E6A63]">Available food feed</p>
          <p className="font-display text-[28px] font-extrabold text-[#1C1B18] my-1 tabular-nums">
            {availableListings.length}
          </p>
          <p className="text-[11.5px] text-[#8A847C]">Ready to claim from restaurants</p>
        </div>

        <div className="bg-white border border-[#EAE6DF] rounded-2xl p-5">
          <div className="w-9 h-9 rounded-xl bg-[#FDF3E6] text-[#C87A1E] flex items-center justify-center mb-4">
            <Clock className="w-[18px] h-[18px]" />
          </div>
          <p className="text-[12px] font-medium text-[#6E6A63]">Active claims &amp; requests</p>
          <p className="font-display text-[28px] font-extrabold text-[#1C1B18] my-1 tabular-nums">
            {activeClaims.length}
          </p>
          <p className="text-[11.5px] text-[#8A847C]">In progress or in transit</p>
        </div>

        <div className="bg-white border border-[#EAE6DF] rounded-2xl p-5">
          <div className="w-9 h-9 rounded-xl bg-[#ECF2FB] text-[#3B66B0] flex items-center justify-center mb-4">
            <Check className="w-[18px] h-[18px]" />
          </div>
          <p className="text-[12px] font-medium text-[#6E6A63]">Delivered claims</p>
          <p className="font-display text-[28px] font-extrabold text-[#1C1B18] my-1 tabular-nums">
            {deliveredCount}
          </p>
          <p className="text-[11.5px] text-[#8A847C]">Verified reached beneficiaries</p>
        </div>

        <div className="bg-white border border-[#EAE6DF] rounded-2xl p-5">
          <div className="w-9 h-9 rounded-xl bg-[#FCEEE9] text-[#C84A20] flex items-center justify-center mb-4">
            <HandHeart className="w-[18px] h-[18px]" />
          </div>
          <p className="text-[12px] font-medium text-[#6E6A63]">Past claims history</p>
          <p className="font-display text-[28px] font-extrabold text-[#1C1B18] my-1 tabular-nums">
            {pastClaims.length}
          </p>
          <p className="text-[11.5px] text-[#8A847C]">Delivered, failed, or cancelled</p>
        </div>
      </div>

      {/* Active Claims in Progress */}
      <div className="bg-white border border-[#EAE6DF] rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-[16px] font-bold text-[#1C1B18]">
              Active Claims &amp; Open Donation Requests
            </h3>
            <p className="text-[12.5px] text-[#7D776F]">
              Batches currently claimed by {user?.full_name} or awaiting fulfillment
            </p>
          </div>
          <Link to="/requests" className="text-[12.5px] font-semibold text-[#2E7D52] hover:underline">
            View Active &amp; Past Claims →
          </Link>
        </div>
        {activeClaims.length === 0 ? (
          <p className="text-[13px] text-[#7D776F]">
            No active claims in progress. Browse available food below or click &ldquo;+ Request Food Donation&rdquo;.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeClaims.slice(0, 4).map((claim) => (
              <div
                key={claim.id}
                className="p-4 rounded-xl bg-[#FAF9F6] border border-[#EAE6DF] flex items-center justify-between gap-3"
              >
                <div>
                  <h4 className="font-display font-bold text-[14.5px] text-[#1C1B18]">
                    {claim.listing_title}
                  </h4>
                  <p className="text-[12px] text-[#7D776F] mt-0.5">
                    {claim.donor_name} · {claim.quantity || "Batch"}
                  </p>
                </div>
                <StatusBadge status={claim.claim_status || claim.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available food preview for NGO */}
      <div className="bg-white border border-[#EAE6DF] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-[16px] font-bold text-[#1C1B18]">
            Available surplus ready to claim now (Live Real-Time Sync)
          </h3>
          <Link to="/listings" className="text-[12.5px] font-semibold text-[#2E7D52] hover:underline">
            Browse all listings →
          </Link>
        </div>
        {availableListings.length === 0 ? (
          <p className="text-[13px] text-[#7D776F]">
            No open food listings at the moment. Use &ldquo;+ Request Food Donation&rdquo; to broadcast your needs to restaurants.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {availableListings.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-[#FAF9F6] border border-[#EAE6DF] flex items-center justify-between gap-3"
              >
                <div>
                  <h4 className="font-display font-bold text-[14.5px] text-[#1C1B18]">
                    {item.title}
                  </h4>
                  <p className="text-[12px] text-[#7D776F] mt-0.5">
                    {item.donor_name ? `${item.donor_name} · ` : ""}
                    {item.quantity ? `${item.quantity} · ` : ""}
                    {item.pickup_location || "Community Hub"}
                  </p>
                </div>
                <button
                  disabled={!isVerifiedNgo}
                  onClick={() => navigate("/listings")}
                  className="px-3 py-1.5 rounded-lg bg-[#2E7D52] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[12px] font-semibold cursor-pointer shrink-0"
                >
                  {isVerifiedNgo ? "Claim" : "Verification Required"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <NgoRequestDonationModal
        open={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        defaultNgoName={user?.full_name || "Partner NGO"}
        onSuccess={() => {
          setBannerMsg("Your Food Donation Request has been broadcast to all restaurants and admins!");
          fetchNgoDashboard();
        }}
      />
    </div>
  );
}

function NgoBrowseFoodPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [search, setSearch] = useState("");
  const [notesById, setNotesById] = useState<Record<string, string>>({});
  const [claimingId, setClaimingId] = useState<string | number | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [raceConflictAlert, setRaceConflictAlert] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isVerifiedNgo = user?.verification_status === "approved";

  const loadListings = async () => {
    try {
      const res = await api.get(endpoints.listings.list);
      if (Array.isArray(res.data)) {
        setListings(res.data);
      }
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  useEffect(() => {
    loadListings();
  }, []);

  // Real-time SSE listener: immediately remove or gray out any donation claimed by another NGO
  useEffect(() => {
    let es: EventSource | null = null;
    try {
      es = new EventSource(endpoints.events.stream);
      es.addEventListener("donation:claimed", (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload?.donationId !== undefined) {
            setListings((prev) =>
              prev.filter((item) => String(item.id) !== String(payload.donationId))
            );
          }
        } catch {
          // ignore malformed event
        }
      });
    } catch {
      // ignore SSE setup errors
    }
    return () => {
      es?.close();
    };
  }, []);

  const handleRequestFood = async (listing: Listing) => {
    setError(null);
    setRaceConflictAlert(null);
    setSuccessMsg(null);
    setClaimingId(listing.id);
    try {
      await api.patch(endpoints.donations.claim(listing.id), {
        notes: notesById[String(listing.id)] || "Community distribution pickup",
      });
      // Immediately remove claimed card from available feed
      setListings((prev) => prev.filter((item) => String(item.id) !== String(listing.id)));
      setSuccessMsg(`Claimed "${listing.title}" atomically! Track it under Active Claims.`);
      loadListings();
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        // HTTP 409 Conflict Interceptor: Lost the concurrency race condition
        setRaceConflictAlert("Just missed it! Another NGO claimed this batch seconds ago.");
        setListings((prev) => prev.filter((item) => String(item.id) !== String(listing.id)));
        loadListings();
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setClaimingId(null);
    }
  };

  const filtered = listings.filter((item) => {
    const isAvail = !item.status || item.status.toLowerCase() === "available";
    const matchesSearch =
      !search ||
      item.title?.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase()) ||
      item.donor_name?.toLowerCase().includes(search.toLowerCase());
    return isAvail && matchesSearch;
  });

  return (
    <div className="px-8 py-7 max-w-[1240px] mx-auto">
      <NgoVerificationGateBanner />

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-[11px] font-bold tracking-[0.13em] text-[#2E7D52] uppercase mb-1.5">
            NGO RECIPIENT PORTAL · ATOMIC CLAIM &amp; REAL-TIME FEED
          </p>
          <h1 className="font-display text-[28px] font-extrabold text-[#1C1B18] tracking-[-0.02em]">
            Browse &amp; claim available food
          </h1>
          <p className="text-[14px] text-[#7D776F] mt-1">
            Claim active restaurant surplus listings with concurrency-safe atomic locking or post a custom Food Donation Request.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            disabled={!isVerifiedNgo}
            onClick={() => setShowRequestModal(true)}
            className="bg-[#C84A20] hover:bg-[#B33F19] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[13px] font-semibold px-4 py-2.5 rounded-xl inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Request Food Donation</span>
          </button>
          <button
            onClick={() => navigate("/requests")}
            className="bg-white border border-[#EAE6DF] hover:bg-[#F5F3EE] text-[#1C1B18] text-[13px] font-semibold px-4 py-2.5 rounded-xl inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <ClipboardList className="w-4 h-4 text-[#2E7D52]" />
            <span>Active &amp; Past Claims</span>
          </button>
        </div>
      </div>

      {raceConflictAlert && (
        <div className="mb-5 bg-[#FEF3C7] border border-[#F59E0B] text-[#92400E] text-[13.5px] font-semibold px-4 py-3.5 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-[#D97706] shrink-0" />
            <span>{raceConflictAlert}</span>
          </div>
          <button
            onClick={() => setRaceConflictAlert(null)}
            className="text-xs underline font-semibold shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="mb-5 bg-[#FCEEE9] border border-[#F2C9B9] text-[#A83B18] text-[13px] px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="mb-5 bg-[#E8F3EC] border border-[#B8DFC6] text-[#2E7D52] text-[13px] px-4 py-3 rounded-xl">
          {successMsg}
        </div>
      )}

      <div className="relative max-w-md mb-6">
        <Search className="w-4 h-4 text-[#8A847C] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search available food by title, restaurant, or notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white pl-10 pr-4 py-2.5 rounded-xl border border-[#EAE6DF] text-[13.5px] focus:outline-none focus:border-[#2E7D52]"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-[#EAE6DF] rounded-2xl p-10 text-center">
          <Package className="w-8 h-8 text-[#2E7D52] mx-auto mb-3 opacity-80" />
          <p className="font-display font-bold text-[15px] text-[#1C1B18]">
            No matching available food listings right now
          </p>
          <p className="text-[13px] text-[#7D776F] mt-1 mb-4">
            Need meals urgently? Post an open Food Donation Request to notify local restaurants.
          </p>
          <button
            disabled={!isVerifiedNgo}
            onClick={() => setShowRequestModal(true)}
            className="bg-[#C84A20] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[13px] font-semibold px-4 py-2 rounded-xl cursor-pointer"
          >
            + Request Food Donation
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const isAvailable = !item.status || item.status.toLowerCase() === "available";
            const isBusy = claimingId === item.id;
            return (
              <div
                key={item.id}
                className="bg-white border border-[#EAE6DF] rounded-2xl p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-display font-bold text-[15px] text-[#1C1B18]">
                      {item.title}
                    </h4>
                    <StatusBadge status={item.status || "available"} />
                  </div>
                  {item.donor_name && (
                    <p className="text-[12px] font-semibold text-[#2E7D52] mb-1">
                      Restaurant: {item.donor_name}
                    </p>
                  )}
                  {item.quantity && (
                    <p className="text-[12.5px] font-semibold text-[#4A4640] mb-1">
                      Quantity: {item.quantity}
                    </p>
                  )}
                  {item.description && (
                    <p className="text-[13px] text-[#7D776F] mb-3">{item.description}</p>
                  )}
                  {item.pickup_location && (
                    <p className="text-[12px] text-[#8A847C] flex items-center gap-1.5 mb-3">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{item.pickup_location}</span>
                    </p>
                  )}
                  {isAvailable && isVerifiedNgo && (
                    <input
                      type="text"
                      placeholder="Add delivery note (optional)..."
                      value={notesById[String(item.id)] || ""}
                      onChange={(e) =>
                        setNotesById((prev) => ({
                          ...prev,
                          [String(item.id)]: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 mb-3 rounded-xl border border-[#EAE6DF] text-[12.5px] focus:outline-none focus:border-[#2E7D52]"
                    />
                  )}
                </div>

                <button
                  disabled={!isAvailable || !isVerifiedNgo || isBusy}
                  onClick={() => handleRequestFood(item)}
                  className={`w-full text-[12.5px] font-semibold py-2.5 rounded-xl transition-colors ${
                    isAvailable && isVerifiedNgo
                      ? "bg-[#2E7D52] hover:bg-[#256643] text-white cursor-pointer"
                      : "bg-[#F5F3EE] text-[#8A847C] cursor-not-allowed"
                  }`}
                >
                  {!isVerifiedNgo
                    ? "License Verification Pending"
                    : isBusy
                    ? "Locking Claim..."
                    : isAvailable
                    ? "Claim food batch"
                    : `Status: ${item.status}`}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <NgoRequestDonationModal
        open={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        defaultNgoName={user?.full_name || "Partner NGO"}
        onSuccess={() => {
          setSuccessMsg("Food Donation Request posted! View it in Active Claims.");
        }}
      />
    </div>
  );
}

function NgoMyRequestsPage() {
  const { user } = useAuth();
  const [viewTab, setViewTab] = useState<"active" | "past">("active");
  const [claims, setClaims] = useState<NgoClaimRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<NgoClaimRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isVerifiedNgo = user?.verification_status === "approved";

  const loadClaims = async (tab: "active" | "past" = viewTab) => {
    setLoading(true);
    try {
      const res = await api.get(endpoints.claims.myClaims(tab));
      if (Array.isArray(res.data)) {
        setClaims(res.data);
      }
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClaims(viewTab);
  }, [viewTab]);

  return (
    <div className="px-8 py-7 max-w-[1240px] mx-auto">
      <NgoVerificationGateBanner />

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-[11px] font-bold tracking-[0.13em] text-[#2E7D52] uppercase mb-1.5">
            NGO RECIPIENT PORTAL · CLAIMS, REVIEWS &amp; AUDIT HISTORY
          </p>
          <h1 className="font-display text-[28px] font-extrabold text-[#1C1B18] tracking-[-0.02em]">
            {viewTab === "active" ? "Active claims &amp; open requests" : "Past claims &amp; donor reviews"}
          </h1>
          <p className="text-[14px] text-[#7D776F] mt-1">
            Track live batches claimed by {user?.full_name} or inspect Past Claims and leave verified ratings for restaurants.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="inline-flex bg-white border border-[#EAE6DF] p-1 rounded-xl">
            <button
              onClick={() => setViewTab("active")}
              className={`px-3.5 py-2 rounded-lg text-[12.5px] font-semibold cursor-pointer ${
                viewTab === "active"
                  ? "bg-[#2E7D52] text-white"
                  : "text-[#6E6A63] hover:text-[#1C1B18]"
              }`}
            >
              Active Claims
            </button>
            <button
              onClick={() => setViewTab("past")}
              className={`px-3.5 py-2 rounded-lg text-[12.5px] font-semibold cursor-pointer ${
                viewTab === "past"
                  ? "bg-[#1C1B18] text-white"
                  : "text-[#6E6A63] hover:text-[#1C1B18]"
              }`}
            >
              Past Claims
            </button>
          </div>

          <button
            disabled={!isVerifiedNgo}
            onClick={() => setShowRequestModal(true)}
            className="bg-[#C84A20] hover:bg-[#B33F19] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[13px] font-semibold px-4 py-2.5 rounded-xl inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Request Food</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-5 bg-[#FCEEE9] border border-[#F2C9B9] text-[#A83B18] text-[13px] px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="mb-5 bg-[#E8F3EC] border border-[#B8DFC6] text-[#2E7D52] text-[13px] px-4 py-3 rounded-xl">
          {successMsg}
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-[#EAE6DF] rounded-2xl p-10 text-center text-[13.5px] text-[#7D776F]">
          Loading {viewTab} claims...
        </div>
      ) : claims.length === 0 ? (
        <div className="bg-white border border-[#EAE6DF] rounded-2xl p-10 text-center">
          <ClipboardList className="w-8 h-8 text-[#2E7D52] mx-auto mb-3 opacity-80" />
          <p className="font-display font-bold text-[15px] text-[#1C1B18]">
            {viewTab === "active"
              ? "No active claims or open requests right now"
              : "No past claims in your history yet"}
          </p>
          <p className="text-[13px] text-[#7D776F] mt-1">
            {viewTab === "active"
              ? 'Visit "Browse food" to claim surplus listings or click "+ Request Food" to broadcast a need.'
              : "Completed deliveries, failed deliveries, and cancelled batches claimed by your NGO will be archived here."}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {claims.map((claim) => {
            const effStatus = (claim.claim_status || claim.status || "").toLowerCase();
            const isDelivered = effStatus === "delivered" || effStatus === "completed";

            return (
              <div
                key={claim.id}
                className="bg-white border border-[#EAE6DF] rounded-2xl p-5 flex flex-col justify-between gap-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h4 className="font-display font-bold text-[15.5px] text-[#1C1B18]">
                        {claim.listing_title}
                      </h4>
                      <StatusBadge status={claim.claim_status || claim.status} />
                      {claim.request_type === "open_broadcast" && (
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase bg-[#ECF2FB] text-[#3B66B0]">
                          Broadcast Request · {claim.urgency_level || "Normal"}
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] text-[#7D776F] mt-1">
                      Source:{" "}
                      <span className="font-semibold text-[#1C1B18]">
                        {claim.donor_name || "Community Network"}
                      </span>
                      {claim.quantity ? ` · Quantity: ${claim.quantity}` : ""}
                      {claim.required_by ? ` · Required By: ${claim.required_by}` : ""}
                      {claim.volunteer_name ? ` · Volunteer: ${claim.volunteer_name}` : ""}
                    </p>
                    {claim.notes && (
                      <p className="text-[12.5px] text-[#4A4640] mt-1">
                        Note: &ldquo;{claim.notes}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col sm:items-end gap-2 shrink-0">
                    <div className="text-[11.5px] text-[#8A847C] tabular-nums">
                      {claim.created_at
                        ? new Date(claim.created_at).toLocaleString()
                        : ""}
                    </div>

                    {/* Review Button / Rated Badge on Delivered Claims */}
                    {isDelivered && claim.listing_id && (
                      claim.has_reviewed ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FEF3C7] border border-[#F59E0B]/40 text-[#B45309] text-[12px] font-bold tabular-nums">
                          <Star className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                          <span>Reviewed ({claim.review_rating || 5}/5 Stars)</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => setReviewTarget(claim)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#C84A20] hover:bg-[#B33F19] text-white text-[12px] font-semibold cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <Star className="w-3.5 h-3.5" />
                          <span>Leave a Review</span>
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Audit Reason Callouts on Past Claims */}
                {claim.cancellation_reason && (
                  <div className="p-3 rounded-xl bg-[#FCEEE9] border border-[#F2C9B9] text-[#A83B18] text-[12.5px]">
                    <span className="font-bold uppercase text-[10.5px] tracking-wider block mb-0.5">
                      Restaurant Cancellation Reason
                    </span>
                    {claim.cancellation_reason}
                  </div>
                )}

                {claim.pickup_failure_reason && (
                  <div className="p-3 rounded-xl bg-[#FCEEE9] border border-[#F2C9B9] text-[#A83B18] text-[12.5px]">
                    <span className="font-bold uppercase text-[10.5px] tracking-wider block mb-0.5">
                      Volunteer Pickup Failed Reason
                    </span>
                    {claim.pickup_failure_reason}
                  </div>
                )}

                {claim.delivery_failure_reason && (
                  <div className="p-3 rounded-xl bg-[#FCEEE9] border border-[#F2C9B9] text-[#A83B18] text-[12.5px]">
                    <span className="font-bold uppercase text-[10.5px] tracking-wider block mb-0.5">
                      Volunteer Delivery Failure Reason
                    </span>
                    {claim.delivery_failure_reason}
                  </div>
                )}

                {claim.distribution_proof && (
                  <div className="p-3 rounded-xl bg-[#E8F3EC] border border-[#B8DFC6] text-[#1E5E3A] text-[12.5px]">
                    <span className="font-bold uppercase text-[10.5px] tracking-wider block mb-0.5">
                      Volunteer Distribution Proof
                    </span>
                    {claim.distribution_proof}
                  </div>
                )}

                {claim.has_reviewed && claim.review_comment && (
                  <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#EAE6DF] text-[#1C1B18] text-[12.5px]">
                    <span className="font-bold uppercase text-[10.5px] tracking-wider text-[#C84A20] block mb-0.5">
                      Your Verified NGO Review ({claim.review_rating}/5 Stars)
                    </span>
                    &ldquo;{claim.review_comment}&rdquo;
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {reviewTarget && reviewTarget.listing_id && (
        <NgoLeaveReviewModal
          open={Boolean(reviewTarget)}
          onClose={() => setReviewTarget(null)}
          donationId={reviewTarget.listing_id}
          listingTitle={reviewTarget.listing_title}
          donorName={reviewTarget.donor_name || "Restaurant Partner"}
          onSuccess={() => {
            setSuccessMsg(
              `Thank you! Your verified review for ${reviewTarget.donor_name} is now live on the Donor Leaderboard.`
            );
            loadClaims(viewTab);
          }}
        />
      )}

      <NgoRequestDonationModal
        open={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        defaultNgoName={user?.full_name || "Partner NGO"}
        onSuccess={() => {
          setSuccessMsg("Food Donation Request broadcast created!");
          setViewTab("active");
          loadClaims("active");
        }}
      />
    </div>
  );
}

/* ============================================================================
   USER 3 UI: VOLUNTEER WORKSPACE (BIDIRECTIONAL PICKUP & DELIVERY VERIFICATION)
   ============================================================================ */
function VolunteerOverviewPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [availableRuns, setAvailableRuns] = useState<Handover[]>([]);
  const [myRuns, setMyRuns] = useState<Handover[]>([]);
  const [foodRescued, setFoodRescued] = useState<number>(0);
  const [refreshing, setRefreshing] = useState(false);

  const fetchVolunteerDashboard = async () => {
    setRefreshing(true);
    try {
      const [availRes, myRes, impactRes] = await Promise.allSettled([
        api.get(endpoints.handovers.available),
        api.get(endpoints.handovers.my),
        api.get(endpoints.extras.impact),
      ]);

      if (availRes.status === "fulfilled" && Array.isArray(availRes.value.data)) {
        setAvailableRuns(availRes.value.data);
      }
      if (myRes.status === "fulfilled" && Array.isArray(myRes.value.data)) {
        setMyRuns(myRes.value.data);
      }
      if (impactRes.status === "fulfilled" && impactRes.value.data) {
        const d = impactRes.value.data;
        const val = Number(d.food_rescued ?? d.total_food_rescued ?? d.meals_rescued ?? 0);
        setFoodRescued(Number.isNaN(val) ? 0 : val);
      }
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVolunteerDashboard();
  }, []);

  const activeAssigned = myRuns.filter(
    (h) => h.status === "assigned" || h.status === "picked_up" || h.status === "in_transit"
  ).length;
  const completedRuns = myRuns.filter((h) => h.status === "delivered").length;

  return (
    <div className="px-8 py-7 max-w-[1240px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-[11px] font-bold tracking-[0.13em] text-[#3B66B0] uppercase mb-1.5">
            VOLUNTEER DISPATCH PORTAL · RESCUE LOGISTICS
          </p>
          <h1 className="font-display text-[32px] font-extrabold text-[#1C1B18] tracking-[-0.025em] leading-tight">
            Ready to roll, {user?.full_name}.
          </h1>
          <p className="text-[14px] text-[#7D776F] mt-1">
            Verify restaurant pickups, report pickup exceptions, and confirm final beneficiary distribution.
          </p>
        </div>

        <button
          onClick={() => navigate("/handovers")}
          className="bg-[#3B66B0] hover:bg-[#2F5391] text-white text-[13px] font-semibold px-4 py-2.5 rounded-xl inline-flex items-center gap-2 shadow-2xs transition-colors cursor-pointer shrink-0"
        >
          <Truck className="w-4 h-4" />
          <span>Open verification queue</span>
        </button>
      </div>

      {/* Volunteer Hero Banner */}
      <div className="bg-[#212733] rounded-[20px] px-9 py-8 mb-8 relative overflow-hidden flex flex-col md:flex-row items-center justify-between min-h-[230px]">
        <div className="max-w-[490px] z-10">
          <div className="flex items-center gap-2 mb-3">
            <Truck className="w-3.5 h-3.5 text-[#7BA4E8]" />
            <span className="text-[10.5px] font-bold tracking-[0.14em] text-[#B6C2D9] uppercase">
              VOLUNTEER LOGISTICS CORPS
            </span>
          </div>

          <h2 className="font-display text-[31px] font-extrabold leading-[1.14] tracking-[-0.02em] mb-3.5">
            <span className="text-white block">Bridge the last mile</span>
            <span className="text-[#7BA4E8] block">with full audit verification.</span>
          </h2>

          <p className="text-[13.5px] text-[#B6C2D9] leading-[1.6] mb-5">
            Verify both positive and negative outcomes at pickup and final delivery so restaurants, NGOs, and admins have real-time accountability.
          </p>

          <Link
            to="/handovers"
            className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#7BA4E8] hover:underline"
          >
            <span>Open volunteer verification queue</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <PlateIllustration />
      </div>

      {/* Volunteer Metrics */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display text-[17px] font-bold text-[#1C1B18]">
            Your dispatch activity
          </h3>
          <p className="text-[12.5px] text-[#7D776F] mt-0.5">
            Live transport queue and verified handover count
          </p>
        </div>
        <button
          onClick={fetchVolunteerDashboard}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#3B66B0] cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-[#EAE6DF] rounded-2xl p-5">
          <div className="w-9 h-9 rounded-xl bg-[#ECF2FB] text-[#3B66B0] flex items-center justify-center mb-4">
            <Truck className="w-[18px] h-[18px]" />
          </div>
          <p className="text-[12px] font-medium text-[#6E6A63]">Available runs</p>
          <p className="font-display text-[28px] font-extrabold text-[#1C1B18] my-1">
            {availableRuns.length}
          </p>
          <p className="text-[11.5px] text-[#8A847C]">Waiting for a volunteer</p>
        </div>

        <div className="bg-white border border-[#EAE6DF] rounded-2xl p-5">
          <div className="w-9 h-9 rounded-xl bg-[#FDF3E6] text-[#C87A1E] flex items-center justify-center mb-4">
            <Clock className="w-[18px] h-[18px]" />
          </div>
          <p className="text-[12px] font-medium text-[#6E6A63]">Active runs</p>
          <p className="font-display text-[28px] font-extrabold text-[#1C1B18] my-1">
            {activeAssigned}
          </p>
          <p className="text-[11.5px] text-[#8A847C]">Assigned or in transit</p>
        </div>

        <div className="bg-white border border-[#EAE6DF] rounded-2xl p-5">
          <div className="w-9 h-9 rounded-xl bg-[#E8F3EC] text-[#2E7D52] flex items-center justify-center mb-4">
            <UserCheck className="w-[18px] h-[18px]" />
          </div>
          <p className="text-[12px] font-medium text-[#6E6A63]">Verified deliveries</p>
          <p className="font-display text-[28px] font-extrabold text-[#1C1B18] my-1">
            {completedRuns}
          </p>
          <p className="text-[11.5px] text-[#8A847C]">Reached beneficiaries</p>
        </div>

        <div className="bg-white border border-[#EAE6DF] rounded-2xl p-5">
          <div className="w-9 h-9 rounded-xl bg-[#FCEEE9] text-[#C84A20] flex items-center justify-center mb-4">
            <HandHeart className="w-[18px] h-[18px]" />
          </div>
          <p className="text-[12px] font-medium text-[#6E6A63]">Network food rescued</p>
          <p className="font-display text-[28px] font-extrabold text-[#1C1B18] my-1">
            {foodRescued}
          </p>
          <p className="text-[11.5px] text-[#8A847C]">Total network impact</p>
        </div>
      </div>
    </div>
  );
}

const PICKUP_FAILURE_REASONS = [
  "Restaurant was closed",
  "Food was already gone/spoiled",
  "Restaurant refused handover",
  "Other",
];

const DELIVERY_FAILURE_REASONS = [
  "Beneficiaries could not be located",
  "Food spoiled / damaged during transit",
  "Safety / security concern at distribution point",
  "NGO was unreachable",
  "Other",
];

function HandoversPage() {
  const [handovers, setHandovers] = useState<Handover[]>([]);
  const [tab, setTab] = useState<"available" | "my">("available");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State for Pickup / Delivery Failure or Delivery Proof
  const [failureModal, setFailureModal] = useState<{
    type: "pickup_failed" | "delivery_failed";
    handover: Handover;
  } | null>(null);
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [customReasonNote, setCustomReasonNote] = useState<string>("");
  const [submittingModal, setSubmittingModal] = useState(false);

  // Optional Distribution Proof Modal when marking Delivered
  const [deliverConfirmTarget, setDeliverConfirmTarget] = useState<Handover | null>(null);
  const [distributionProof, setDistributionProof] = useState<string>("");

  const loadHandovers = async (currentTab: "available" | "my") => {
    try {
      const url =
        currentTab === "available"
          ? endpoints.handovers.available
          : endpoints.handovers.my;
      const res = await api.get(url);
      if (Array.isArray(res.data)) {
        setHandovers(res.data);
      }
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  useEffect(() => {
    loadHandovers(tab);
  }, [tab]);

  const handleAssign = async (id: number | string) => {
    setError(null);
    setSuccessMsg(null);
    try {
      await api.post(endpoints.handovers.assign(id));
      setSuccessMsg("Rescue run assigned to you! Verify pickup at the restaurant.");
      setTab("my");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleVerifyPickupSuccess = async (h: Handover) => {
    setError(null);
    setSuccessMsg(null);
    try {
      await api.patch(endpoints.deliveries.verifyPickup(h.id), {
        status: "claimed",
      });
      setSuccessMsg(
        `Marked "${h.listing_title || `Handover #${h.id}`}" as Picked Up / Claimed from Restaurant!`
      );
      loadHandovers(tab);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const openFailureModal = (type: "pickup_failed" | "delivery_failed", handover: Handover) => {
    setFailureModal({ type, handover });
    setSelectedReason(
      type === "pickup_failed" ? PICKUP_FAILURE_REASONS[0] : DELIVERY_FAILURE_REASONS[0]
    );
    setCustomReasonNote("");
  };

  const handleSubmitFailure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!failureModal) return;

    const finalReason =
      selectedReason === "Other"
        ? customReasonNote.trim()
        : customReasonNote.trim()
        ? `${selectedReason} — ${customReasonNote.trim()}`
        : selectedReason;

    if (!finalReason) {
      setError("A failure reason is mandatory.");
      return;
    }

    setSubmittingModal(true);
    setError(null);
    try {
      if (failureModal.type === "pickup_failed") {
        await api.patch(endpoints.deliveries.verifyPickup(failureModal.handover.id), {
          status: "pickup_failed",
          reason: finalReason,
        });
        setSuccessMsg("Pickup failure recorded and synced to Restaurant, NGO, and Admin logs.");
      } else {
        await api.patch(endpoints.deliveries.verifyDelivery(failureModal.handover.id), {
          status: "delivery_failed",
          reason: finalReason,
        });
        setSuccessMsg("Delivery failure recorded and synced to Restaurant, NGO, and Admin logs.");
      }
      setFailureModal(null);
      loadHandovers(tab);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmittingModal(false);
    }
  };

  const handleConfirmDelivered = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliverConfirmTarget) return;
    setSubmittingModal(true);
    setError(null);
    try {
      await api.patch(endpoints.deliveries.verifyDelivery(deliverConfirmTarget.id), {
        status: "delivered",
        distribution_proof:
          distributionProof.trim() || "Verified handover to NGO & community beneficiaries",
      });
      setDeliverConfirmTarget(null);
      setDistributionProof("");
      setSuccessMsg("Confirmed food reached beneficiaries! Audit log updated.");
      loadHandovers(tab);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmittingModal(false);
    }
  };

  return (
    <div className="px-8 py-7 max-w-[1240px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-[11px] font-bold tracking-[0.13em] text-[#3B66B0] uppercase mb-1.5">
            VOLUNTEER DISPATCH PORTAL · BIDIRECTIONAL VERIFICATION
          </p>
          <h1 className="font-display text-[28px] font-extrabold text-[#1C1B18] tracking-[-0.02em]">
            Volunteer handovers &amp; verification
          </h1>
          <p className="text-[14px] text-[#7D776F] mt-1">
            Confirm restaurant pickup or report pickup exceptions, then verify final beneficiary delivery or report delivery failure.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-white border border-[#EAE6DF] p-1 rounded-xl">
          <button
            onClick={() => setTab("available")}
            className={`px-3.5 py-1.5 rounded-lg text-[12.5px] font-medium cursor-pointer ${
              tab === "available"
                ? "bg-[#FCEEE9] text-[#C84A20] font-semibold"
                : "text-[#6E6A63]"
            }`}
          >
            Available runs
          </button>
          <button
            onClick={() => setTab("my")}
            className={`px-3.5 py-1.5 rounded-lg text-[12.5px] font-medium cursor-pointer ${
              tab === "my"
                ? "bg-[#FCEEE9] text-[#C84A20] font-semibold"
                : "text-[#6E6A63]"
            }`}
          >
            My handovers
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-5 bg-[#FCEEE9] border border-[#F2C9B9] text-[#A83B18] text-[13px] px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="mb-5 bg-[#E8F3EC] border border-[#B8DFC6] text-[#2E7D52] text-[13px] px-4 py-3 rounded-xl">
          {successMsg}
        </div>
      )}

      {handovers.length === 0 ? (
        <div className="bg-white border border-[#EAE6DF] rounded-2xl p-10 text-center">
          <Truck className="w-8 h-8 text-[#C84A20] mx-auto mb-3 opacity-80" />
          <p className="font-display font-bold text-[15px] text-[#1C1B18]">
            No handovers in this queue
          </p>
          <p className="text-[13px] text-[#7D776F] mt-1">
            Accepted donation requests ready for volunteer transport will show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {handovers.map((h) => {
            const st = (h.status || "available").toLowerCase();
            const isPickedUp = st === "picked_up" || st === "in_transit";
            const isClosed =
              st === "delivered" || st === "pickup_failed" || st === "delivery_failed";

            return (
              <div
                key={h.id}
                className="bg-white border border-[#EAE6DF] rounded-2xl p-5 flex flex-col gap-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5 mb-1">
                      <h4 className="font-display font-bold text-[15.5px] text-[#1C1B18]">
                        {h.listing_title || `Handover #${h.id}`}
                      </h4>
                      <StatusBadge status={h.status || "available"} />
                      {h.quantity && (
                        <span className="text-[12px] font-semibold text-[#4A4640]">
                          · {h.quantity}
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] text-[#7D776F]">
                      <span className="font-semibold text-[#1C1B18]">
                        Restaurant: {h.donor_name || h.pickup_location || "Donor"}
                      </span>{" "}
                      →{" "}
                      <span className="font-semibold text-[#2E7D52]">
                        NGO: {h.ngo_name || h.dropoff_location || "Recipient Hub"}
                      </span>
                    </p>
                    <p className="text-[12px] text-[#8A847C] mt-0.5">
                      Route: {h.pickup_location || "Restaurant Pickup"} →{" "}
                      {h.dropoff_location || "NGO Distribution Point"}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {tab === "available" ? (
                      <button
                        onClick={() => handleAssign(h.id)}
                        className="px-4 py-2 rounded-xl bg-[#C84A20] hover:bg-[#B33F19] text-white text-[12.5px] font-semibold cursor-pointer"
                      >
                        Claim Rescue Run
                      </button>
                    ) : isClosed ? (
                      <StatusBadge status={h.status} />
                    ) : !isPickedUp ? (
                      /* Step A: Restaurant Pickup / Claim Verification */
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleVerifyPickupSuccess(h)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2E7D52] hover:bg-[#256643] text-white text-[12.5px] font-semibold cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Mark Picked Up / Claimed from Restaurant</span>
                        </button>
                        <button
                          onClick={() => openFailureModal("pickup_failed", h)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FCEEE9] hover:bg-[#F7DCD2] text-[#A83B18] text-[12.5px] font-semibold cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Report Not Claimed / Pickup Failed</span>
                        </button>
                      </div>
                    ) : (
                      /* Step B: Final Distribution / Reached Beneficiaries Verification */
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => {
                            setDeliverConfirmTarget(h);
                            setDistributionProof("");
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2E7D52] hover:bg-[#256643] text-white text-[12.5px] font-semibold cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Confirm Delivered / Reached Beneficiaries</span>
                        </button>
                        <button
                          onClick={() => openFailureModal("delivery_failed", h)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FCEEE9] hover:bg-[#F7DCD2] text-[#A83B18] text-[12.5px] font-semibold cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Report Delivery Failed / Food Not Reached</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Callout boxes if failure or proof was recorded */}
                {h.pickup_failure_reason && (
                  <div className="p-3 rounded-xl bg-[#FCEEE9] border border-[#F2C9B9] text-[#A83B18] text-[12px]">
                    <span className="font-bold uppercase text-[10.5px] tracking-wider block mb-0.5">
                      Pickup Failure Reason Recorded
                    </span>
                    {h.pickup_failure_reason}
                  </div>
                )}

                {h.delivery_failure_reason && (
                  <div className="p-3 rounded-xl bg-[#FCEEE9] border border-[#F2C9B9] text-[#A83B18] text-[12px]">
                    <span className="font-bold uppercase text-[10.5px] tracking-wider block mb-0.5">
                      Delivery Failure Reason Recorded
                    </span>
                    {h.delivery_failure_reason}
                  </div>
                )}

                {h.distribution_proof && (
                  <div className="p-3 rounded-xl bg-[#E8F3EC] border border-[#B8DFC6] text-[#1E5E3A] text-[12px]">
                    <span className="font-bold uppercase text-[10.5px] tracking-wider block mb-0.5">
                      Verified Distribution Proof
                    </span>
                    {h.distribution_proof}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Mandatory Pickup / Delivery Failure Reason Modal */}
      {failureModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE6DF] rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#A83B18]">
                {failureModal.type === "pickup_failed"
                  ? "STEP A · PICKUP EXCEPTION REPORT"
                  : "STEP B · DELIVERY FAILURE REPORT"}
              </span>
              <button
                onClick={() => setFailureModal(null)}
                className="text-[#8A847C] hover:text-[#1C1B18] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h3 className="font-display font-bold text-[18px] text-[#1C1B18] mb-1">
              {failureModal.type === "pickup_failed"
                ? "Report Pickup Failed / Not Claimed"
                : "Report Delivery Failed / Food Not Reached"}
            </h3>
            <p className="text-[13px] text-[#7D776F] mb-4">
              Select a mandatory reason. This will immediately update the Restaurant, NGO, and Admin audit logs.
            </p>

            <form onSubmit={handleSubmitFailure} className="space-y-3.5">
              <div>
                <label className="block text-[12px] font-semibold text-[#1C1B18] mb-1.5">
                  Predefined Failure Reason *
                </label>
                <select
                  value={selectedReason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE6DF] text-[13px] bg-white focus:outline-none focus:border-[#C84A20]"
                >
                  {(failureModal.type === "pickup_failed"
                    ? PICKUP_FAILURE_REASONS
                    : DELIVERY_FAILURE_REASONS
                  ).map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#1C1B18] mb-1.5">
                  {selectedReason === "Other"
                    ? "Detailed explanation (Required for Other) *"
                    : "Additional field notes (Optional)"}
                </label>
                <textarea
                  rows={3}
                  required={selectedReason === "Other"}
                  placeholder="Describe what happened on site..."
                  value={customReasonNote}
                  onChange={(e) => setCustomReasonNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE6DF] text-[13px] focus:outline-none focus:border-[#C84A20]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFailureModal(null)}
                  className="px-4 py-2 rounded-xl text-[13px] font-medium text-[#6E6A63] hover:bg-[#F5F3EE] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    submittingModal ||
                    (selectedReason === "Other" && !customReasonNote.trim())
                  }
                  className="px-4 py-2 rounded-xl bg-[#A83B18] hover:bg-[#8E3012] disabled:opacity-50 text-white text-[13px] font-semibold cursor-pointer"
                >
                  {submittingModal ? "Submitting..." : "Submit Failure Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delivered / Reached Beneficiaries Modal */}
      {deliverConfirmTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE6DF] rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#2E7D52]">
                STEP B · FINAL DISTRIBUTION VERIFICATION
              </span>
              <button
                onClick={() => setDeliverConfirmTarget(null)}
                className="text-[#8A847C] hover:text-[#1C1B18] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h3 className="font-display font-bold text-[18px] text-[#1C1B18] mb-1">
              Confirm Food Reached Beneficiaries
            </h3>
            <p className="text-[13px] text-[#7D776F] mb-4">
              Verify that &ldquo;{deliverConfirmTarget.listing_title}&rdquo; was handed over at{" "}
              {deliverConfirmTarget.dropoff_location || deliverConfirmTarget.ngo_name}.
            </p>

            <form onSubmit={handleConfirmDelivered} className="space-y-3.5">
              <div>
                <label className="block text-[12px] font-semibold text-[#1C1B18] mb-1.5">
                  Distribution Proof / Handover Note (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Received by NGO coordinator Priya; 30 warm meals served at shelter."
                  value={distributionProof}
                  onChange={(e) => setDistributionProof(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE6DF] text-[13px] focus:outline-none focus:border-[#2E7D52]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeliverConfirmTarget(null)}
                  className="px-4 py-2 rounded-xl text-[13px] font-medium text-[#6E6A63] hover:bg-[#F5F3EE] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingModal}
                  className="px-4 py-2 rounded-xl bg-[#2E7D52] hover:bg-[#256643] disabled:opacity-50 text-white text-[13px] font-semibold cursor-pointer"
                >
                  {submittingModal ? "Verifying..." : "Confirm Delivered ✓"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   SHARED IMPACT PAGE
   ============================================================================ */
function ImpactPage() {
  const [impact, setImpact] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get(endpoints.extras.impact)
      .then((res) => {
        setImpact(res.data);
        setError(null);
      })
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  return (
    <div className="px-8 py-7 max-w-[1240px] mx-auto">
      <div className="mb-6">
        <p className="text-[11px] font-bold tracking-[0.13em] text-[#8A847C] uppercase mb-1.5">
          COMMUNITY METRICS
        </p>
        <h1 className="font-display text-[28px] font-extrabold text-[#1C1B18] tracking-[-0.02em]">
          Impact
        </h1>
        <p className="text-[14px] text-[#7D776F] mt-1">
          Track food rescued, successful deliveries, and community reach.
        </p>
      </div>

      {error && (
        <div className="mb-5 bg-[#FCEEE9] border border-[#F2C9B9] text-[#A83B18] text-[13px] px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#EAE6DF] rounded-2xl p-6">
          <p className="text-[12px] font-medium text-[#6E6A63]">Food rescued</p>
          <p className="font-display text-[30px] font-extrabold text-[#1C1B18] my-1">
            {String(Number(impact?.food_rescued ?? impact?.total_food_rescued))}
          </p>
          <p className="text-[12px] text-[#8A847C]">Reported across all donors</p>
        </div>
        <div className="bg-white border border-[#EAE6DF] rounded-2xl p-6">
          <p className="text-[12px] font-medium text-[#6E6A63]">
            Completed handovers
          </p>
          <p className="font-display text-[30px] font-extrabold text-[#1C1B18] my-1">
            {Number(impact?.successful_handovers ?? impact?.completed_handovers ?? 0)}
          </p>
          <p className="text-[12px] text-[#8A847C]">Verified volunteer runs</p>
        </div>
        <div className="bg-white border border-[#EAE6DF] rounded-2xl p-6">
          <p className="text-[12px] font-medium text-[#6E6A63]">
            Active listings
          </p>
          <p className="font-display text-[30px] font-extrabold text-[#1C1B18] my-1">
            {Number(impact?.available_listings ?? 0)}
          </p>
          <p className="text-[12px] text-[#8A847C]">Currently open on ANNAPURNA</p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   APP SHELL WITH ROLE-SPECIFIC SIDEBAR & STRICT ROUTE ISOLATION
   ============================================================================ */
function AppShell() {
  const { user, token, isLoading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9F8F5] flex items-center justify-center text-[13.5px] font-medium text-[#7D776F]">
        Loading your workspace...
      </div>
    );
  }

  // Unauthenticated users cannot access any workspace route
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  const role: UserRole = user.role;

  // Redirect Admin users directly to /admin unless they explicitly requested ?workspace=1
  if (role === "Admin" && location.pathname === "/" && !location.search.includes("workspace=1")) {
    return <Navigate to="/admin" replace />;
  }

  // Role-specific navigation items + locked items showing what requires another login
  const navItemsByRole: Record<
    UserRole,
    {
      to: string;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      hasDot?: boolean;
      lockedFor?: UserRole[];
    }[]
  > = {
    Donor: [
      { to: "/", label: "Overview", icon: LayoutGrid },
      { to: "/listings", label: "Food listings", icon: Package },
      { to: "/requests", label: "Requests", icon: ClipboardList, hasDot: true },
      { to: "/leaderboard", label: "Donor Leaderboard", icon: Trophy },
      { to: "/handovers", label: "Volunteer handovers", icon: HandHeart, lockedFor: ["Volunteer"] },
      { to: "/impact", label: "Impact", icon: Activity },
    ],
    NGO: [
      { to: "/", label: "NGO Overview", icon: LayoutGrid },
      { to: "/listings", label: "Browse food", icon: Package },
      { to: "/requests", label: "My requests", icon: ClipboardList, hasDot: true },
      { to: "/leaderboard", label: "Donor Leaderboard", icon: Trophy },
      { to: "/handovers", label: "Volunteer handovers", icon: HandHeart, lockedFor: ["Volunteer"] },
      { to: "/impact", label: "Impact", icon: Activity },
    ],
    Volunteer: [
      { to: "/", label: "Dispatch Overview", icon: LayoutGrid },
      { to: "/handovers", label: "Volunteer handovers", icon: HandHeart, hasDot: true },
      { to: "/leaderboard", label: "Donor Leaderboard", icon: Trophy },
      { to: "/listings", label: "Food listings", icon: Package, lockedFor: ["Donor", "NGO"] },
      { to: "/requests", label: "Requests", icon: ClipboardList, lockedFor: ["Donor", "NGO"] },
      { to: "/impact", label: "Impact", icon: Activity },
    ],
    Admin: [
      { to: "/admin", label: "Admin Console", icon: ShieldCheck, hasDot: true },
      { to: "/admin/verifications", label: "NGO Verifications", icon: ShieldCheck },
      { to: "/?workspace=1", label: "Network Overview", icon: LayoutGrid },
      { to: "/leaderboard", label: "Donor Leaderboard", icon: Trophy },
      { to: "/listings", label: "Food listings", icon: Package },
      { to: "/requests", label: "Requests", icon: ClipboardList },
      { to: "/handovers", label: "Volunteer handovers", icon: HandHeart },
      { to: "/impact", label: "Impact", icon: Activity },
    ],
  };

  const navItems = navItemsByRole[role] || navItemsByRole.Donor;
  const userInitial = (user.full_name || "U").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen flex bg-[#F9F8F5] text-[#1C1B18]">
      {/* Left Sidebar */}
      <aside className="w-[252px] shrink-0 bg-white border-r border-[#EAE6DF] flex flex-col justify-between min-h-screen">
        <div>
          {/* Brand Logo */}
          <div className="px-5 pt-5 pb-6 flex items-center gap-3">
            <img
              src="/assets/aistudio/image_3f793f15.png"
              alt="ANNAPURNA Logo"
              className="w-10 h-10 rounded-[12px] object-cover shadow-2xs shrink-0"
            />
            <div>
              <div className="font-display font-bold text-[17px] text-[#1C1B18] leading-none tracking-[-0.02em]">
                ANNAPURNA
              </div>
              <div className="text-[9.5px] font-semibold tracking-[0.14em] text-[#8A847C] uppercase mt-1.5">
                CONNECTING FOOD &amp; HOPE
              </div>
            </div>
          </div>

          {/* Workspace Nav */}
          <div className="px-3">
            <div className="px-3 text-[10.5px] font-bold tracking-[0.12em] text-[#8A847C] uppercase mb-2.5">
              WORKSPACE · {role.toUpperCase()} UI
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.to === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(item.to);
                const isLocked = Boolean(item.lockedFor);

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] transition-colors ${
                      isActive
                        ? "bg-[#FCEEE9] text-[#C84A20] font-semibold"
                        : isLocked
                        ? "text-[#9A948C] hover:bg-[#F5F3EE] font-medium"
                        : "text-[#4A4640] hover:bg-[#F5F3EE] font-medium"
                    }`}
                  >
                    <Icon
                      className={`w-[18px] h-[18px] ${
                        isActive
                          ? "text-[#C84A20]"
                          : isLocked
                          ? "text-[#B0AAA0]"
                          : "text-[#5A554E]"
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                    {isLocked ? (
                      <Lock className="w-3.5 h-3.5 text-[#B0AAA0] ml-auto shrink-0" />
                    ) : (
                      item.hasDot && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C84A20] ml-auto shrink-0" />
                      )
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom Sidebar Area */}
        <div>
          {/* Small actions callout */}
          <div className="mx-3 mb-3 p-4 rounded-2xl bg-[#F5F3EE] border border-[#EAE6DF]">
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-[#C84A20] shadow-2xs mb-3">
              <HandHeart className="w-4 h-4" />
            </div>
            <p className="text-[12.5px] font-bold text-[#1C1B18] mb-1">
              Small actions. Real impact.
            </p>
            <p className="text-[11.5px] text-[#7D776F] leading-[1.45]">
              Every rescued meal is a step towards less waste.
            </p>
          </div>

          {/* API documentation link */}
          <a
            href="http://127.0.0.1:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="px-5 py-3 flex items-center gap-3 text-[13px] font-medium text-[#4A4640] hover:text-[#1C1B18] border-t border-[#F0EDE6] transition-colors"
          >
            <CircleHelp className="w-[17px] h-[17px] text-[#7D776F]" />
            <span>API documentation</span>
          </a>

          {/* User Profile Footer */}
          <div className="p-3 border-t border-[#EAE6DF]">
            <div className="flex items-center justify-between px-2 py-1.5 rounded-xl bg-[#FAF9F6]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-[#FCEEE9] text-[#C84A20] font-bold text-[13px] flex items-center justify-center shrink-0">
                  {userInitial}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-[#1C1B18] truncate leading-tight">
                    {user.full_name}
                  </p>
                  <p className="text-[11.5px] text-[#7D776F] leading-tight mt-0.5">
                    {user.role}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                title="Sign out"
                className="p-1.5 text-[#7D776F] hover:text-[#1C1B18] rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-[60px] bg-white border-b border-[#EAE6DF] px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center text-[13px]">
            <span className="text-[#8A847C] font-medium">Workspace</span>
            <span className="text-[#C8C3B9] mx-2.5">/</span>
            <span className="font-semibold text-[#2A2825]">
              {role === "Donor"
                ? "Community network"
                : role === "NGO"
                ? "NGO Recipient Portal"
                : "Volunteer Dispatch Portal"}
            </span>
          </div>

          <div className="flex items-center">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2E7D52]" />
              <span className="text-[12.5px] font-medium text-[#5A554E]">
                {role === "Donor"
                  ? "Network workspace"
                  : `${role} workspace`}
              </span>
            </div>

            <div className="h-5 w-px bg-[#E5E0D6] mx-4" />

            <button
              type="button"
              aria-label="Notifications"
              className="p-1.5 text-[#5A554E] hover:text-[#1C1B18] rounded-lg transition-colors cursor-pointer"
            >
              <Bell className="w-[18px] h-[18px]" />
            </button>

            <div className="w-8 h-8 rounded-full bg-[#FCEEE9] text-[#C84A20] font-bold text-[12.5px] flex items-center justify-center ml-3">
              {userInitial}
            </div>
          </div>
        </header>

        {/* Page Routes (Strictly Isolated by Logged-in Role) */}
        <main className="flex-1">
          <Routes>
            <Route
              path="/"
              element={
                role === "Donor" ? (
                  <DonorOverviewPage />
                ) : role === "NGO" ? (
                  <NgoOverviewPage />
                ) : (
                  <VolunteerOverviewPage />
                )
              }
            />
            <Route
              path="/listings"
              element={
                role === "Donor" ? (
                  <DonorListingsPage />
                ) : role === "NGO" ? (
                  <NgoBrowseFoodPage />
                ) : (
                  <RoleRestrictedView
                    requiredRoles={["Donor", "NGO"]}
                    featureName="Food Listings"
                  />
                )
              }
            />
            <Route
              path="/requests"
              element={
                role === "Donor" ? (
                  <DonorRequestsPage />
                ) : role === "NGO" ? (
                  <NgoMyRequestsPage />
                ) : (
                  <RoleRestrictedView
                    requiredRoles={["Donor", "NGO"]}
                    featureName="Donation Requests"
                  />
                )
              }
            />
            <Route
              path="/handovers"
              element={
                role === "Volunteer" ? (
                  <HandoversPage />
                ) : (
                  <RoleRestrictedView
                    requiredRoles={["Volunteer"]}
                    featureName="Volunteer Handovers"
                  />
                )
              }
            />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/ranks" element={<LeaderboardPage />} />
            <Route path="/impact" element={<ImpactPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user, token } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          token && user ? (
            <Navigate to={user.role === "Admin" ? "/admin" : "/"} replace />
          ) : (
            <AuthPage initialMode="login" />
          )
        }
      />
      <Route
        path="/register"
        element={
          token && user ? (
            <Navigate to={user.role === "Admin" ? "/admin" : "/"} replace />
          ) : (
            <AuthPage initialMode="register" />
          )
        }
      />
      <Route path="/admin/*" element={<AdminLayout />} />
      <Route path="/*" element={<AppShell />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
