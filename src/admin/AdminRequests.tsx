import React, { useEffect, useState } from "react";
import { Search, AlertTriangle, Eye, ShieldAlert, X } from "lucide-react";
import { api, endpoints, getErrorMessage } from "../lib/api";

interface AdminRequestRecord {
  id: number;
  listing_id: number;
  listing_title: string;
  donor_id?: number | null;
  donor_name?: string | null;
  requester_id: number;
  requester_name: string;
  requested_quantity?: string;
  notes?: string;
  status: string;
  is_disputed: boolean;
  moderation_note?: string;
  created_at: string;
}

export function AdminRequests() {
  const [requests, setRequests] = useState<AdminRequestRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [disputedOnly, setDisputedOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [detailModal, setDetailModal] = useState<Record<string, any> | null>(null);
  const [moderateModal, setModerateModal] = useState<AdminRequestRecord | null>(null);
  const [modStatus, setModStatus] = useState("");
  const [modDisputed, setModDisputed] = useState(false);
  const [modNote, setModNote] = useState("");

  const loadRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(endpoints.admin.requests, {
        params: {
          search: search || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          disputed_only: disputedOnly || undefined,
        },
      });
      setRequests(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [search, statusFilter, disputedOnly]);

  const openDetail = async (id: number) => {
    try {
      const res = await api.get(endpoints.admin.requestDetail(id));
      setDetailModal(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const openModerate = (r: AdminRequestRecord) => {
    setModerateModal(r);
    setModStatus(r.status);
    setModDisputed(r.is_disputed);
    setModNote(r.moderation_note || "");
  };

  const handleSaveModeration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moderateModal) return;
    try {
      await api.patch(endpoints.admin.requestModerate(moderateModal.id), {
        status: modStatus,
        is_disputed: modDisputed,
        moderation_note: modNote,
      });
      setModerateModal(null);
      loadRequests();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="px-8 py-7 max-w-[1360px] mx-auto space-y-6">
      <div>
        <p className="text-[11px] font-bold tracking-[0.14em] text-[#C84614] uppercase mb-1.5">
          REQUEST COORDINATION &amp; DISPUTE OVERSIGHT
        </p>
        <h1 className="font-display text-[28px] font-extrabold text-[#1C1B18] tracking-[-0.02em]">
          Food Request Management ({total})
        </h1>
        <p className="text-[13.5px] text-[#7D776F] mt-1">
          Monitor NGO food requests, inspect donor-recipient linkages, and investigate disputed requests.
        </p>
      </div>

      {error && (
        <div className="bg-[#FCEEE9] border border-[#F2C9B9] text-[#A83B18] text-[13px] px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#8A847C] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by listing title, recipient, or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white pl-10 pr-4 py-2.5 rounded-xl border border-[#EAE6DF] text-[13.5px] focus:outline-none focus:border-[#C84614]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-[#EAE6DF] rounded-xl px-3.5 py-2 text-[13px] font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>

          <button
            type="button"
            onClick={() => setDisputedOnly(!disputedOnly)}
            className={`px-3.5 py-2 rounded-xl border text-[12.5px] font-semibold cursor-pointer ${
              disputedOnly
                ? "bg-[#FCEEE9] border-[#C84614] text-[#C84614]"
                : "bg-white border-[#EAE6DF] text-[#4A4640]"
            }`}
          >
            Disputed / Flagged Only
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#EAE6DF] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#EAE6DF] bg-[#FAF9F6] text-[11px] font-bold tracking-[0.08em] text-[#7D776F] uppercase">
                <th className="py-3.5 px-4">ID</th>
                <th className="py-3.5 px-4">Associated Food Listing</th>
                <th className="py-3.5 px-4">Donor</th>
                <th className="py-3.5 px-4">Recipient (NGO)</th>
                <th className="py-3.5 px-4">Quantity &amp; Status</th>
                <th className="py-3.5 px-4 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EDE6] text-[13px]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#7D776F]">
                    Loading food requests...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#7D776F]">
                    No food requests match the current filters.
                  </td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.id} className="hover:bg-[#FAF9F6]">
                    <td className="py-3.5 px-4 font-mono text-[12px] text-[#7D776F]">
                      #{r.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-[#1C1B18]">
                        {r.listing_title}{" "}
                        {r.is_disputed && (
                          <span className="text-[11px] font-semibold text-[#C84614]">
                            [Disputed]
                          </span>
                        )}
                      </p>
                      <p className="text-[12px] text-[#7D776F]">
                        Listing #{r.listing_id} {r.notes ? `· "${r.notes}"` : ""}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-[#4A4640]">
                      {r.donor_name || "Donor"}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#1C1B18]">
                      {r.requester_name} (#{r.requester_id})
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-[#1C1B18]">
                        {r.requested_quantity || "1"}
                      </p>
                      <span
                        className={`text-[12px] font-semibold capitalize ${
                          r.status === "accepted" ||
                          r.status === "completed" ||
                          r.status === "delivered" ||
                          r.status === "fulfilled"
                            ? "text-[#2E7D52]"
                            : r.status === "rejected" || r.status === "cancelled"
                            ? "text-[#A83B18]"
                            : "text-[#C87A1E]"
                        }`}
                      >
                        {r.status === "rejected" ? "declined" : r.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openDetail(r.id)}
                          title="Inspect request details"
                          className="p-2 rounded-lg border border-[#EAE6DF] hover:bg-[#F5F3EE] text-[#4A4640] cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openModerate(r)}
                          title="Investigate or moderate request"
                          className="p-2 rounded-lg border border-[#EAE6DF] hover:bg-[#FCEEE9] text-[#C84614] cursor-pointer"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request Detail Modal */}
      {detailModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE6DF] rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <h3 className="font-display font-bold text-[18px] text-[#1C1B18]">
                Request #{detailModal.request.id} — {detailModal.request.listing_title}
              </h3>
              <button
                type="button"
                onClick={() => setDetailModal(null)}
                className="p-1 rounded-lg hover:bg-[#F5F3EE] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-[13px] space-y-1.5 text-[#4A4640]">
              <p>
                <strong>Recipient (NGO):</strong> {detailModal.request.requester_name}
              </p>
              <p>
                <strong>Donor:</strong> {detailModal.request.donor_name}
              </p>
              <p>
                <strong>Status:</strong> {detailModal.request.status}
              </p>
              <p>
                <strong>Notes:</strong> {detailModal.request.notes || "None"}
              </p>
              <p>
                <strong>Moderation Note:</strong>{" "}
                {detailModal.request.moderation_note || "None"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Moderate Request Modal */}
      {moderateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveModeration}
            className="bg-white border border-[#EAE6DF] rounded-2xl max-w-md w-full p-6 space-y-4"
          >
            <h3 className="font-display font-bold text-[18px] text-[#1C1B18]">
              Moderate Request #{moderateModal.id}
            </h3>
            <p className="text-[12.5px] text-[#7D776F]">
              Ordinary request acceptance remains part of the Donor workflow. Use moderation to flag disputed requests or cancel invalid requests.
            </p>
            <div>
              <label className="block text-[12px] font-semibold text-[#4A4640] mb-1">
                Administrative status
              </label>
              <select
                value={modStatus}
                onChange={(e) => setModStatus(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#EAE6DF] text-[13px]"
              >
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
                <option value="under_review">Under Review</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-[13px] font-medium text-[#1C1B18] cursor-pointer">
              <input
                type="checkbox"
                checked={modDisputed}
                onChange={(e) => setModDisputed(e.target.checked)}
              />
              <span>Mark request as disputed / under investigation</span>
            </label>
            <div>
              <label className="block text-[12px] font-semibold text-[#4A4640] mb-1">
                Moderation notes
              </label>
              <input
                type="text"
                value={modNote}
                onChange={(e) => setModNote(e.target.value)}
                placeholder="Investigation notes..."
                className="w-full px-3.5 py-2 rounded-xl border border-[#EAE6DF] text-[13px]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModerateModal(null)}
                className="px-4 py-2 rounded-xl text-[13px] font-medium text-[#6E6A63] hover:bg-[#F5F3EE] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#C84614] text-white text-[13px] font-semibold cursor-pointer"
              >
                Save Moderation
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
