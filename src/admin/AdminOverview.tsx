import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Package,
  ClipboardList,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Activity,
  RefreshCw,
  ArrowRight,
  Scale,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { api, endpoints, getErrorMessage } from "../lib/api";

interface DashboardStats {
  total_users: number;
  total_donors: number;
  total_recipients: number;
  total_volunteers: number;
  total_admins: number;
  total_listings: number;
  available_listings: number;
  flagged_listings: number;
  expired_listings: number;
  pending_requests: number;
  accepted_requests: number;
  rejected_requests: number;
  disputed_requests: number;
  completed_donations: number;
  active_volunteers: number;
  total_quantity_donated: number;
  total_quantity_redistributed: number;
  total_platform_activity: number;
  donation_activity_chart: { stage: string; count: number }[];
  user_registration_chart: { role: string; count: number }[];
  request_status_chart: { status: string; count: number }[];
}

interface DashboardActivity {
  recent_registrations: {
    id: number;
    full_name: string;
    email: string;
    role: string;
    status: string;
    created_at: string;
  }[];
  recent_listings: {
    id: number;
    title: string;
    category: string;
    quantity: string;
    status: string;
    donor_name: string;
    is_flagged: boolean;
    created_at: string;
  }[];
  recent_requests: {
    id: number;
    listing_id: number;
    listing_title: string;
    requester_name: string;
    status: string;
    is_disputed: boolean;
    created_at: string;
  }[];
  recent_activity: {
    id: number;
    admin_email: string;
    action: string;
    entity_type: string;
    entity_id: string;
    created_at: string;
  }[];
}

export function AdminOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<DashboardActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, actRes] = await Promise.all([
        api.get(endpoints.admin.dashboardStats),
        api.get(endpoints.admin.dashboardActivity),
      ]);
      setStats(statsRes.data);
      setActivity(actRes.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const maxDonationChart = Math.max(
    1,
    ...(stats?.donation_activity_chart.map((d) => d.count) || [1])
  );
  const maxUserChart = Math.max(
    1,
    ...(stats?.user_registration_chart.map((u) => u.count) || [1])
  );
  const maxRequestChart = Math.max(
    1,
    ...(stats?.request_status_chart.map((r) => r.count) || [1])
  );

  return (
    <div className="px-8 py-7 max-w-[1360px] mx-auto space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-[0.14em] text-[#C84614] uppercase mb-1.5">
            CENTRALIZED PLATFORM CONTROL
          </p>
          <h1 className="font-display text-[30px] font-extrabold text-[#1C1B18] tracking-[-0.025em]">
            Admin Dashboard Overview
          </h1>
          <p className="text-[13.5px] text-[#7D776F] mt-1">
            Live database metrics, role distribution, moderation queues, and system activity.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchOverview}
          className="bg-[#C84614] hover:bg-[#B03C10] text-white text-[13px] font-semibold px-4 py-2.5 rounded-xl inline-flex items-center gap-2 transition-colors cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh live metrics</span>
        </button>
      </div>

      {error && (
        <div className="bg-[#FCEEE9] border border-[#F2C9B9] text-[#A83B18] text-[13px] px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Primary 14 Platform Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#EAE6DF] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-[#FCEEE9] text-[#C84614] flex items-center justify-center">
              <Users className="w-[18px] h-[18px]" />
            </div>
            <span className="text-[11.5px] font-semibold text-[#8A847C]">
              {stats?.total_admins ?? 0} Admin(s)
            </span>
          </div>
          <p className="text-[12px] font-medium text-[#6E6A63]">Total registered users</p>
          <p className="font-display text-[28px] font-extrabold text-[#1C1B18] my-0.5">
            {stats?.total_users ?? 0}
          </p>
          <p className="text-[11.5px] text-[#7D776F]">
            {stats?.total_donors ?? 0} Donors · {stats?.total_recipients ?? 0} Recipients ·{" "}
            {stats?.total_volunteers ?? 0} Volunteers
          </p>
        </div>

        <div className="bg-white border border-[#EAE6DF] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-[#E8F3EC] text-[#2E7D52] flex items-center justify-center">
              <Package className="w-[18px] h-[18px]" />
            </div>
            <span className="text-[11.5px] font-semibold text-[#2E7D52]">
              {stats?.available_listings ?? 0} Available
            </span>
          </div>
          <p className="text-[12px] font-medium text-[#6E6A63]">Total food listings</p>
          <p className="font-display text-[28px] font-extrabold text-[#1C1B18] my-0.5">
            {stats?.total_listings ?? 0}
          </p>
          <p className="text-[11.5px] text-[#7D776F]">
            {stats?.flagged_listings ?? 0} Flagged · {stats?.expired_listings ?? 0} Expired
          </p>
        </div>

        <div className="bg-white border border-[#EAE6DF] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-[#FDF3E6] text-[#C87A1E] flex items-center justify-center">
              <ClipboardList className="w-[18px] h-[18px]" />
            </div>
            <span className="text-[11.5px] font-semibold text-[#C87A1E]">
              {stats?.pending_requests ?? 0} Pending
            </span>
          </div>
          <p className="text-[12px] font-medium text-[#6E6A63]">Food requests breakdown</p>
          <p className="font-display text-[28px] font-extrabold text-[#1C1B18] my-0.5">
            {(stats?.pending_requests ?? 0) +
              (stats?.accepted_requests ?? 0) +
              (stats?.rejected_requests ?? 0)}
          </p>
          <p className="text-[11.5px] text-[#7D776F]">
            {stats?.accepted_requests ?? 0} Accepted · {stats?.rejected_requests ?? 0} Rejected ·{" "}
            {stats?.disputed_requests ?? 0} Disputed
          </p>
        </div>

        <div className="bg-white border border-[#EAE6DF] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-[#ECF2FB] text-[#3B66B0] flex items-center justify-center">
              <Truck className="w-[18px] h-[18px]" />
            </div>
            <span className="text-[11.5px] font-semibold text-[#3B66B0]">
              {stats?.active_volunteers ?? 0} Active volunteers
            </span>
          </div>
          <p className="text-[12px] font-medium text-[#6E6A63]">Completed donations</p>
          <p className="font-display text-[28px] font-extrabold text-[#1C1B18] my-0.5">
            {stats?.completed_donations ?? 0}
          </p>
          <p className="text-[11.5px] text-[#7D776F]">
            Verified end-to-end volunteer deliveries
          </p>
        </div>
      </div>

      {/* Secondary Quantity & Activity Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#EAE6DF] rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#FAF9F6] border border-[#EAE6DF] flex items-center justify-center text-[#C84614] shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11.5px] text-[#7D776F] font-medium">Total quantity donated</p>
            <p className="font-display text-[20px] font-extrabold text-[#1C1B18]">
              {stats?.total_quantity_donated ?? 0} units
            </p>
          </div>
        </div>

        <div className="bg-white border border-[#EAE6DF] rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#FAF9F6] border border-[#EAE6DF] flex items-center justify-center text-[#2E7D52] shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11.5px] text-[#7D776F] font-medium">
              Quantity redistributed
            </p>
            <p className="font-display text-[20px] font-extrabold text-[#1C1B18]">
              {stats?.total_quantity_redistributed ?? 0} units
            </p>
          </div>
        </div>

        <div className="bg-white border border-[#EAE6DF] rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#FAF9F6] border border-[#EAE6DF] flex items-center justify-center text-[#3B66B0] shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11.5px] text-[#7D776F] font-medium">Total platform activity</p>
            <p className="font-display text-[20px] font-extrabold text-[#1C1B18]">
              {stats?.total_platform_activity ?? 0} events
            </p>
          </div>
        </div>

        <div className="bg-white border border-[#EAE6DF] rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#FAF9F6] border border-[#EAE6DF] flex items-center justify-center text-[#C87A1E] shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11.5px] text-[#7D776F] font-medium">Moderation alerts</p>
            <p className="font-display text-[20px] font-extrabold text-[#1C1B18]">
              {(stats?.flagged_listings ?? 0) + (stats?.disputed_requests ?? 0)} items
            </p>
          </div>
        </div>
      </div>

      {/* 3 Analytical Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Chart 1: Donation Activity Pipeline */}
        <div className="bg-white border border-[#EAE6DF] rounded-2xl p-5">
          <h3 className="font-display text-[15.5px] font-bold text-[#1C1B18] mb-1">
            Donation Lifecycle Activity
          </h3>
          <p className="text-[12px] text-[#7D776F] mb-4">
            Food listings by current operational status
          </p>
          <div className="space-y-3">
            {(stats?.donation_activity_chart || []).map((item) => {
              const pct = Math.round((item.count / maxDonationChart) * 100);
              return (
                <div key={item.stage}>
                  <div className="flex justify-between text-[12px] mb-1">
                    <span className="font-medium text-[#4A4640]">{item.stage}</span>
                    <span className="font-bold text-[#1C1B18]">{item.count}</span>
                  </div>
                  <div className="w-full h-2.5 bg-[#F5F3EE] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#C84614] rounded-full transition-all"
                      style={{ width: `${Math.max(pct, item.count > 0 ? 8 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: User Registration Distribution */}
        <div className="bg-white border border-[#EAE6DF] rounded-2xl p-5">
          <h3 className="font-display text-[15.5px] font-bold text-[#1C1B18] mb-1">
            Registered Users by Role
          </h3>
          <p className="text-[12px] text-[#7D776F] mb-4">
            Active role breakdown across the platform
          </p>
          <div className="space-y-3">
            {(stats?.user_registration_chart || []).map((item) => {
              const pct = Math.round((item.count / maxUserChart) * 100);
              return (
                <div key={item.role}>
                  <div className="flex justify-between text-[12px] mb-1">
                    <span className="font-medium text-[#4A4640]">{item.role}</span>
                    <span className="font-bold text-[#1C1B18]">{item.count}</span>
                  </div>
                  <div className="w-full h-2.5 bg-[#F5F3EE] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#2E7D52] rounded-full transition-all"
                      style={{ width: `${Math.max(pct, item.count > 0 ? 8 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 3: Food Request Status */}
        <div className="bg-white border border-[#EAE6DF] rounded-2xl p-5">
          <h3 className="font-display text-[15.5px] font-bold text-[#1C1B18] mb-1">
            Food Request Status Chart
          </h3>
          <p className="text-[12px] text-[#7D776F] mb-4">
            Coordination outcomes and disputed requests
          </p>
          <div className="space-y-3">
            {(stats?.request_status_chart || []).map((item) => {
              const pct = Math.round((item.count / maxRequestChart) * 100);
              return (
                <div key={item.status}>
                  <div className="flex justify-between text-[12px] mb-1">
                    <span className="font-medium text-[#4A4640]">{item.status}</span>
                    <span className="font-bold text-[#1C1B18]">{item.count}</span>
                  </div>
                  <div className="w-full h-2.5 bg-[#F5F3EE] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#3B66B0] rounded-full transition-all"
                      style={{ width: `${Math.max(pct, item.count > 0 ? 8 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Platform Activity & Recent Entities Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Registrations */}
        <div className="bg-white border border-[#EAE6DF] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-[15.5px] font-bold text-[#1C1B18]">
              Recent User Registrations
            </h3>
            <Link
              to="/admin/users"
              className="text-[12px] font-semibold text-[#C84614] inline-flex items-center gap-1 hover:underline"
            >
              <span>Manage users</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-[#F0EDE6]">
            {(activity?.recent_registrations || []).map((u) => (
              <div key={u.id} className="py-2.5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[13px] font-bold text-[#1C1B18]">{u.full_name}</p>
                  <p className="text-[11.5px] text-[#7D776F]">{u.email}</p>
                </div>
                <div className="text-right">
                  <span className="text-[11.5px] font-semibold text-[#C84614]">{u.role}</span>
                  <p className="text-[11px] text-[#8A847C] capitalize">{u.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Audit / Admin Activity */}
        <div className="bg-white border border-[#EAE6DF] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-[15.5px] font-bold text-[#1C1B18]">
              Recent Administrative Audit Trail
            </h3>
            <Link
              to="/admin/audit-logs"
              className="text-[12px] font-semibold text-[#C84614] inline-flex items-center gap-1 hover:underline"
            >
              <span>All audit logs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {(activity?.recent_activity || []).length === 0 ? (
            <p className="text-[12.5px] text-[#7D776F] py-4">
              No administrative actions recorded yet.
            </p>
          ) : (
            <div className="divide-y divide-[#F0EDE6]">
              {(activity?.recent_activity || []).map((a) => (
                <div key={a.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[12.5px] font-bold text-[#1C1B18]">{a.action}</p>
                    <p className="text-[11.5px] text-[#7D776F]">
                      {a.entity_type} #{a.entity_id} · by {a.admin_email}
                    </p>
                  </div>
                  <span className="text-[11px] text-[#8A847C]">
                    {a.created_at ? new Date(a.created_at).toLocaleTimeString() : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Food Listings */}
        <div className="bg-white border border-[#EAE6DF] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-[15.5px] font-bold text-[#1C1B18]">
              Recent Food Listings
            </h3>
            <Link
              to="/admin/listings"
              className="text-[12px] font-semibold text-[#C84614] inline-flex items-center gap-1 hover:underline"
            >
              <span>Moderate listings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {(activity?.recent_listings || []).length === 0 ? (
            <p className="text-[12.5px] text-[#7D776F] py-4">
              No food listings created yet.
            </p>
          ) : (
            <div className="divide-y divide-[#F0EDE6]">
              {(activity?.recent_listings || []).map((l) => (
                <div key={l.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-bold text-[#1C1B18]">
                      {l.title}{" "}
                      {l.is_flagged && (
                        <span className="text-[11px] text-[#C84614] font-semibold">
                          [Flagged]
                        </span>
                      )}
                    </p>
                    <p className="text-[11.5px] text-[#7D776F]">
                      {l.quantity} · Donor: {l.donor_name}
                    </p>
                  </div>
                  <span className="text-[11.5px] font-semibold capitalize text-[#2E7D52]">
                    {l.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Food Requests */}
        <div className="bg-white border border-[#EAE6DF] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-[15.5px] font-bold text-[#1C1B18]">
              Recent Food Requests
            </h3>
            <Link
              to="/admin/requests"
              className="text-[12px] font-semibold text-[#C84614] inline-flex items-center gap-1 hover:underline"
            >
              <span>Manage requests</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {(activity?.recent_requests || []).length === 0 ? (
            <p className="text-[12.5px] text-[#7D776F] py-4">
              No food requests submitted yet.
            </p>
          ) : (
            <div className="divide-y divide-[#F0EDE6]">
              {(activity?.recent_requests || []).map((r) => (
                <div key={r.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-bold text-[#1C1B18]">
                      {r.listing_title}{" "}
                      {r.is_disputed && (
                        <span className="text-[11px] text-[#C84614] font-semibold">
                          [Disputed]
                        </span>
                      )}
                    </p>
                    <p className="text-[11.5px] text-[#7D776F]">
                      Requested by {r.requester_name}
                    </p>
                  </div>
                  <span className="text-[11.5px] font-semibold capitalize text-[#3B66B0]">
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
