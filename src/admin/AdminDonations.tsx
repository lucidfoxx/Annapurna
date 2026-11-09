import React, { useEffect, useState } from "react";
import { Search, Eye, CheckCircle2, Clock, X, AlertTriangle, Filter, Calendar } from "lucide-react";
import { api, endpoints, getErrorMessage } from "../lib/api";

interface DonationRecord {
  donation_id: number;
  listing_id: number;
  listing_title: string;
  category: string;
  quantity: string;
  pickup_location: string;
  donor_id: number;
  donor_name: string;
  listing_status: string;
  cancellation_reason?: string | null;
  cancelled_at?: string | null;
  pickup_status?: string;
  pickup_failure_reason?: string | null;
  delivery_status?: string;
  delivery_failure_reason?: string | null;
  verified_by_volunteer_id?: number | null;
  distribution_proof?: string | null;
  request_id?: number | null;
  requester_id?: number | null;
  requester_name?: string | null;
  request_status?: string | null;
  handover_id?: number | null;
  volunteer_id?: number | null;
  volunteer_name?: string | null;
  handover_status?: string | null;
  lifecycle_status: string;
  created_at: string;
}

export function AdminDonations() {
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [openNgoRequests, setOpenNgoRequests] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [viewTab, setViewTab] = useState<"active" | "past" | "all" | "ngo_requests">("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [donorFilter, setDonorFilter] = useState<string>("all");
  const [ngoFilter, setNgoFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timelineDetail, setTimelineDetail] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    api
      .get(endpoints.admin.users, { params: { page_size: 100 } })
      .then((res) => {
        if (res.data?.items) setUsersList(res.data.items);
      })
      .catch(() => {});
  }, []);

  const loadDonations = async () => {
    setLoading(true);
    setError(null);
    try {
      const effectiveStatus =
        statusFilter !== "all"
          ? statusFilter
          : viewTab === "active"
          ? "active"
          : viewTab === "past"
          ? "past"
          : undefined;

      const [donRes, reqRes] = await Promise.all([
        api.get(endpoints.admin.donations, {
          params: {
            status: effectiveStatus,
            donor_id: donorFilter !== "all" ? Number(donorFilter) : undefined,
            ngo_id: ngoFilter !== "all" ? Number(ngoFilter) : undefined,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
            search: search || undefined,
          },
        }),
        api.get(endpoints.requests.list, { params: { type: "open_broadcast" } }),
      ]);
      setDonations(donRes.data.items || []);
      if (Array.isArray(reqRes.data)) {
        setOpenNgoRequests(reqRes.data);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDonations();
  }, [viewTab, statusFilter, donorFilter, ngoFilter, dateFrom, dateTo, search]);

  const openTimeline = async (id: number) => {
    try {
      const res = await api.get(endpoints.admin.donationDetail(id));
      setTimelineDetail(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const donors = usersList.filter((u) => u.role === "Donor");
  const ngos = usersList.filter((u) => u.role === "NGO");

  return (
    <div className="px-4 py-4 max-w-[1360px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-[0.14em] text-[#C84614] uppercase mb-1.5">
            END-TO-END LIFECYCLE &amp; VERIFICATION LOGS
          </p>
          <h1 className="font-display text-[28px] font-extrabold text-[#1C1B18] tracking-[-0.02em]">
            Global Donations, Claims &amp; Verification ({donations.length})
          </h1>
          <p className="text-[13.5px] text-[#7D776F] mt-1">
            Full visibility across all restaurants&apos; active and past donations, NGO food requests, and bidirectional volunteer verification logs.
          </p>
        </div>

        {/* Global View Mode Toggle */}
        <div className="flex flex-wrap items-center gap-1.5 bg-white border border-[#EAE6DF] p-1.5 rounded-xl">
          {[
            { id: "all", label: "All Donations" },
            { id: "active", label: "Active Donations" },
            { id: "past", label: "Past Donations" },
            { id: "ngo_requests", label: `NGO Food Requests (${openNgoRequests.length})` },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setViewTab(t.id as any);
                setStatusFilter("all");
              }}
              className={`px-3.5 py-2 rounded-lg text-[12.5px] font-semibold transition-colors cursor-pointer ${
                viewTab === t.id
                  ? "bg-[#C84614] text-white"
                  : "text-[#6E6A63] hover:text-[#1C1B18]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-[#FCEEE9] border border-[#F2C9B9] text-[#A83B18] text-[13px] px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Global Filter Bar: Search, Restaurant, NGO, Status, Date Range */}
      <div className="bg-white border border-[#EAE6DF] rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-[12px] font-bold text-[#5A5852] uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5 text-[#C84614]" />
          <span>Global Admin Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8A847C] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search food, reason, actor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#FAF9F6] pl-9 pr-3 py-2 rounded-xl border border-[#EAE6DF] text-[13px] focus:outline-none focus:border-[#C84614]"
            />
          </div>

          <select
            value={donorFilter}
            onChange={(e) => setDonorFilter(e.target.value)}
            className="bg-[#FAF9F6] px-3 py-2 rounded-xl border border-[#EAE6DF] text-[13px] text-[#1C1B18]"
          >
            <option value="all">All Restaurants / Donors</option>
            {donors.map((d) => (
              <option key={d.id} value={String(d.id)}>
                {d.full_name} ({d.email})
              </option>
            ))}
          </select>

          <select
            value={ngoFilter}
            onChange={(e) => setNgoFilter(e.target.value)}
            className="bg-[#FAF9F6] px-3 py-2 rounded-xl border border-[#EAE6DF] text-[13px] text-[#1C1B18]"
          >
            <option value="all">All NGOs / Recipients</option>
            {ngos.map((n) => (
              <option key={n.id} value={String(n.id)}>
                {n.full_name} ({n.email})
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#FAF9F6] px-3 py-2 rounded-xl border border-[#EAE6DF] text-[13px] text-[#1C1B18]"
          >
            <option value="all">All Lifecycle Statuses</option>
            <option value="available">Available</option>
            <option value="pending">Pending Claim</option>
            <option value="accepted">Accepted / Claimed</option>
            <option value="assigned">Volunteer Assigned</option>
            <option value="in_progress">In Transit / Picked Up</option>
            <option value="completed">Delivered / Completed</option>
            <option value="pickup_failed">Pickup Failed</option>
            <option value="delivery_failed">Delivery Failed</option>
            <option value="cancelled">Cancelled by Restaurant</option>
            <option value="expired">Expired</option>
          </select>

          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              title="From date"
              className="w-full bg-[#FAF9F6] px-2.5 py-2 rounded-xl border border-[#EAE6DF] text-[12px]"
            />
            <span className="text-[#8A847C] text-[12px]">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              title="To date"
              className="w-full bg-[#FAF9F6] px-2.5 py-2 rounded-xl border border-[#EAE6DF] text-[12px]"
            />
          </div>
        </div>
      </div>

      {viewTab === "ngo_requests" ? (
        <div className="bg-white border border-[#EAE6DF] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#EAE6DF] flex items-center justify-between">
            <h3 className="font-display font-bold text-[16px] text-[#1C1B18]">
              Broadcast NGO Food Donation Requests ({openNgoRequests.length})
            </h3>
          </div>
          {openNgoRequests.length === 0 ? (
            <div className="p-10 text-center text-[13.5px] text-[#7D776F]">
              No open NGO broadcast food requests have been posted yet.
            </div>
          ) : (
            <div className="divide-y divide-[#F0EDE6]">
              {openNgoRequests.map((req) => (
                <div key={req.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-display font-bold text-[15px] text-[#1C1B18]">
                        {req.ngo_name || req.requester_name}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold uppercase ${
                          req.urgency_level === "critical"
                            ? "bg-[#FCEEE9] text-[#A83B18]"
                            : req.urgency_level === "high"
                            ? "bg-[#FDF3E6] text-[#C87A1E]"
                            : "bg-[#E8F3EC] text-[#2E7D52]"
                        }`}
                      >
                        {req.urgency_level || "normal"} urgency
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-[#F5F3EE] text-[#4A4640] text-[11px] font-semibold uppercase">
                        Status: {req.status}
                      </span>
                    </div>
                    <p className="text-[13px] font-semibold text-[#C84614] mt-1">
                      Quantity Needed: {req.quantity || req.requested_quantity} · Required By:{" "}
                      {req.required_by || "Immediate"}
                    </p>
                    {req.notes && (
                      <p className="text-[12.5px] text-[#6E6A63] mt-1">
                        Notes / Dietary / Location: &ldquo;{req.notes}&rdquo;
                      </p>
                    )}
                  </div>
                  <div className="text-[12px] text-[#8A847C] shrink-0">
                    Posted {req.created_at ? new Date(req.created_at).toLocaleString() : ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Donations & Volunteer Verification Table */
        <div className="bg-white border border-[#EAE6DF] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#EAE6DF] bg-[#FAF9F6] text-[11px] font-bold tracking-[0.1em] text-[#8A847C] uppercase">
                  <th className="py-3.5 px-5">Donation</th>
                  <th className="py-3.5 px-4">Restaurant (Donor)</th>
                  <th className="py-3.5 px-4">NGO Claim</th>
                  <th className="py-3.5 px-4">Volunteer &amp; Verification</th>
                  <th className="py-3.5 px-4">Lifecycle Stage</th>
                  <th className="py-3.5 px-4">Reason / Proof Callout</th>
                  <th className="py-3.5 px-5 text-right">Timeline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EDE6] text-[13px]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-[#7D776F]">
                      Loading donation lifecycle records...
                    </td>
                  </tr>
                ) : donations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-[#7D776F]">
                      No donation records match the selected filters.
                    </td>
                  </tr>
                ) : (
                  donations.map((d) => {
                    const failureOrCancelReason =
                      d.cancellation_reason ||
                      d.pickup_failure_reason ||
                      d.delivery_failure_reason;
                    return (
                      <tr key={d.donation_id} className="hover:bg-[#FAF9F6] transition-colors">
                        <td className="py-3.5 px-5">
                          <p className="font-bold text-[#1C1B18]">{d.listing_title}</p>
                          <p className="text-[11.5px] text-[#7D776F]">
                            {d.quantity} · {d.pickup_location}
                          </p>
                          <p className="text-[11px] text-[#8A847C]">
                            {d.created_at ? new Date(d.created_at).toLocaleDateString() : ""}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-[#1C1B18]">{d.donor_name}</td>
                        <td className="py-3.5 px-4">
                          {d.requester_name ? (
                            <div>
                              <p className="font-medium text-[#1C1B18]">{d.requester_name}</p>
                              <p className="text-[11px] text-[#7D776F] capitalize">
                                Claim: {d.request_status}
                              </p>
                            </div>
                          ) : (
                            <span className="text-[#8A847C]">Unclaimed</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {d.volunteer_name ? (
                            <div>
                              <p className="font-medium text-[#1C1B18]">{d.volunteer_name}</p>
                              <p className="text-[11px] text-[#7D776F]">
                                Pickup: <strong>{d.pickup_status || "pending"}</strong> · Delivery:{" "}
                                <strong>{d.delivery_status || "pending"}</strong>
                              </p>
                            </div>
                          ) : (
                            <span className="text-[#8A847C]">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase ${
                              d.lifecycle_status === "completed"
                                ? "bg-[#E8F3EC] text-[#2E7D52]"
                                : d.lifecycle_status === "in_progress" ||
                                  d.lifecycle_status === "assigned"
                                ? "bg-[#ECF2FB] text-[#3B66B0]"
                                : [
                                    "cancelled",
                                    "rejected",
                                    "expired",
                                    "pickup_failed",
                                    "delivery_failed",
                                  ].includes(d.lifecycle_status)
                                ? "bg-[#FCEEE9] text-[#A83B18]"
                                : "bg-[#FDF3E6] text-[#C87A1E]"
                            }`}
                          >
                            {d.lifecycle_status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 max-w-[260px]">
                          {failureOrCancelReason ? (
                            <div className="p-2 rounded-lg bg-[#FCEEE9] border border-[#F2C9B9] text-[#A83B18] text-[11.5px]">
                              <span className="font-bold block">
                                {d.cancellation_reason
                                  ? "Cancelled by Restaurant:"
                                  : d.pickup_failure_reason
                                  ? "Pickup Failed:"
                                  : "Delivery Failed:"}
                              </span>
                              <span>{failureOrCancelReason}</span>
                            </div>
                          ) : d.distribution_proof ? (
                            <div className="p-2 rounded-lg bg-[#E8F3EC] border border-[#B8DFC6] text-[#2E7D52] text-[11.5px]">
                              <span className="font-bold block">Verified Proof:</span>
                              <span>{d.distribution_proof}</span>
                            </div>
                          ) : (
                            <span className="text-[11.5px] text-[#8A847C]">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <button
                            type="button"
                            onClick={() => openTimeline(d.donation_id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-[#C84614] bg-[#FCEEE9] hover:bg-[#F7DFD6] cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lifecycle Timeline Modal */}
      {timelineDetail && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE6DF] rounded-2xl max-w-2xl w-full p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[11px] font-bold tracking-[0.12em] text-[#C84614] uppercase">
                  DONATION LIFECYCLE PIPELINE
                </p>
                <h3 className="font-display font-bold text-[18px] text-[#1C1B18]">
                  {timelineDetail.listing?.title} (ID #{timelineDetail.donation_id})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTimelineDetail(null)}
                className="p-1.5 text-[#7D776F] hover:text-[#1C1B18] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {(timelineDetail.listing?.cancellation_reason ||
              timelineDetail.listing?.pickup_failure_reason ||
              timelineDetail.listing?.delivery_failure_reason) && (
              <div className="mb-4 p-4 rounded-xl bg-[#FCEEE9] border border-[#F2C9B9] text-[#A83B18] text-[13px] flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Exception / Failure Reason Recorded</p>
                  {timelineDetail.listing?.cancellation_reason && (
                    <p>Cancellation Reason: {timelineDetail.listing.cancellation_reason}</p>
                  )}
                  {timelineDetail.listing?.pickup_failure_reason && (
                    <p>Pickup Failure Reason: {timelineDetail.listing.pickup_failure_reason}</p>
                  )}
                  {timelineDetail.listing?.delivery_failure_reason && (
                    <p>Delivery Failure Reason: {timelineDetail.listing.delivery_failure_reason}</p>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-3 my-4">
              {(timelineDetail.steps || []).map((s: any, idx: number) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                    s.completed
                      ? "bg-[#E8F3EC]/50 border-[#B8DFC6]"
                      : "bg-[#FAF9F6] border-[#EAE6DF]"
                  }`}
                >
                  <div className="mt-0.5">
                    {s.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-[#2E7D52]" />
                    ) : (
                      <Clock className="w-5 h-5 text-[#8A847C]" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-display font-bold text-[14px] text-[#1C1B18]">
                        {s.step}
                      </p>
                      <span className="text-[12px] font-semibold text-[#6E6A63]">
                        Actor: {s.actor}
                      </span>
                    </div>
                    <p className="text-[12.5px] text-[#7D776F] mt-0.5">{s.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
