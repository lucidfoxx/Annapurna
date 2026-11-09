import React, { useEffect, useState } from "react";
import {
  ShieldCheck,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  ExternalLink,
  AlertTriangle,
  Building2,
  Phone,
  MapPin,
  X,
} from "lucide-react";
import { api, endpoints, getErrorMessage } from "../lib/api";

interface NgoVerificationItem {
  id: number;
  full_name: string;
  email: string;
  phone?: string | null;
  organization?: string | null;
  address?: string | null;
  verification_status: "pending" | "approved" | "rejected";
  license_number?: string | null;
  license_document_url?: string | null;
  verified_at?: string | null;
  rejection_reason?: string | null;
  created_at: string;
}

const REJECTION_PRESETS = [
  "Invalid license number",
  "Blurry document",
  "Expired certificate",
  "Organization name mismatch on certificate",
  "Other (Specify custom reason)",
];

export function AdminNgoVerifications({
  showToast,
}: {
  showToast?: (msg: string, tone?: string) => void;
}) {
  const [items, setItems] = useState<NgoVerificationItem[]>([]);
  const [counts, setCounts] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    all: 0,
  });
  const [statusTab, setStatusTab] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [actionBusyId, setActionBusyId] = useState<number | null>(null);
  const [banner, setBanner] = useState<{ text: string; tone: "success" | "danger" } | null>(null);

  // Document preview modal
  const [previewNgo, setPreviewNgo] = useState<NgoVerificationItem | null>(null);

  // Reject license modal
  const [rejectTarget, setRejectTarget] = useState<NgoVerificationItem | null>(null);
  const [rejectPreset, setRejectPreset] = useState(REJECTION_PRESETS[0]);
  const [rejectCustomNote, setRejectCustomNote] = useState("");
  const [rejectError, setRejectError] = useState<string | null>(null);

  const notify = (msg: string, tone: "success" | "danger" = "success") => {
    setBanner({ text: msg, tone });
    if (showToast) showToast(msg, tone === "danger" ? "danger" : "info");
    setTimeout(() => setBanner(null), 4500);
  };

  const fetchVerifications = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(endpoints.admin.ngoVerifications(statusTab), {
        params: { search: search.trim() || undefined },
      });
      setItems(Array.isArray(res.data?.items) ? res.data.items : []);
      if (res.data?.counts) {
        setCounts(res.data.counts);
      }
    } catch (err) {
      notify(getErrorMessage(err, "Failed to load NGO license verifications."), "danger");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, [statusTab]);

  const handleApprove = async (ngo: NgoVerificationItem) => {
    setActionBusyId(ngo.id);
    try {
      await api.patch(endpoints.admin.verifyNgo(ngo.id), {
        status: "approved",
      });
      notify(
        `Approved license for ${ngo.full_name} (${ngo.license_number || "Verified"}). Full claim & request access unlocked.`
      );
      await fetchVerifications();
    } catch (err) {
      notify(getErrorMessage(err, "Could not approve NGO license."), "danger");
    } finally {
      setActionBusyId(null);
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectTarget) return;
    const isCustom = rejectPreset.startsWith("Other");
    const finalReason = isCustom
      ? rejectCustomNote.trim()
      : rejectCustomNote.trim()
      ? `${rejectPreset} — ${rejectCustomNote.trim()}`
      : rejectPreset;

    if (!finalReason) {
      setRejectError("Please provide a clear rejection reason for the NGO.");
      return;
    }

    setActionBusyId(rejectTarget.id);
    setRejectError(null);
    try {
      await api.patch(endpoints.admin.verifyNgo(rejectTarget.id), {
        status: "rejected",
        rejection_reason: finalReason,
      });
      notify(`Rejected license for ${rejectTarget.full_name}. Reason recorded and sent.`, "danger");
      setRejectTarget(null);
      setRejectCustomNote("");
      await fetchVerifications();
    } catch (err) {
      setRejectError(getErrorMessage(err, "Failed to reject NGO license."));
    } finally {
      setActionBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.13em] text-[#C84614] mb-1">
            COMPLIANCE & TRUST GATEKEEPING
          </div>
          <h1 className="text-[28px] font-serif font-bold text-[#1C1B18] leading-tight">
            NGO License Verification
          </h1>
          <p className="text-[13px] text-[#5A5852] mt-1">
            Inspect NGO registration certificates and government licenses before granting food claiming or broadcast request privileges.
          </p>
        </div>

        <button
          onClick={fetchVerifications}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#E6E3DA] text-[13px] font-semibold text-[#1C1B18] hover:bg-[#F3F1EC] whitespace-nowrap shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh Queue
        </button>
      </div>

      {banner && (
        <div
          className={`p-4 rounded-xl border text-[13px] font-medium flex items-center justify-between ${
            banner.tone === "danger"
              ? "bg-[#FDE8E8] border-[#F5C2C7] text-[#B42318]"
              : "bg-[#E8F5E9] border-[#B7E1C1] text-[#1E6F3D]"
          }`}
        >
          <span>{banner.text}</span>
          <button onClick={() => setBanner(null)} className="text-xs underline ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Status Filter Tabs & Search */}
      <div className="bg-white rounded-2xl border border-[#EBE8E0] p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 bg-[#F4F2EC] p-1 rounded-xl">
          {(
            [
              { id: "pending", label: "Pending Review", count: counts.pending },
              { id: "approved", label: "Approved", count: counts.approved },
              { id: "rejected", label: "Rejected", count: counts.rejected },
              { id: "all", label: "All NGOs", count: counts.all },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusTab(tab.id)}
              className={`px-3.5 py-2 rounded-lg text-[12px] font-semibold transition-all whitespace-nowrap shrink-0 flex items-center gap-2 ${
                statusTab === tab.id
                  ? "bg-[#1C1B18] text-white shadow-xs"
                  : "text-[#5A5852] hover:text-[#1C1B18]"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[11px] font-bold tabular-nums ${
                  statusTab === tab.id
                    ? "bg-white/20 text-white"
                    : tab.id === "pending" && tab.count > 0
                    ? "bg-[#FEF3C7] text-[#B45309]"
                    : "bg-[#E6E3DA] text-[#5A5852]"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchVerifications();
          }}
          className="flex items-center gap-2 min-w-[280px] flex-1 max-w-md"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8E8B82] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search NGO name, license #, or email..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E6E3DA] bg-[#F9F8F5] text-[13px] text-[#1C1B18] focus:outline-none focus:border-[#C84614]"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-[#1C1B18] text-white text-[12px] font-semibold whitespace-nowrap shrink-0"
          >
            Search
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#EBE8E0] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#EBE8E0] bg-[#F9F8F5] text-[11px] font-bold uppercase tracking-wider text-[#8E8B82]">
                <th className="py-3.5 px-5">NGO Name & Contact</th>
                <th className="py-3.5 px-4">License Number</th>
                <th className="py-3.5 px-4">Registered Date</th>
                <th className="py-3.5 px-4">License Certificate</th>
                <th className="py-3.5 px-4">Verification Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBE8E0] text-[13px]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#8E8B82]">
                    Loading NGO license verification queue...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#8E8B82]">
                    No NGO accounts found in the <strong>{statusTab}</strong> verification queue.
                  </td>
                </tr>
              ) : (
                items.map((ngo) => {
                  const status = ngo.verification_status || "pending";
                  return (
                    <tr key={ngo.id} className="hover:bg-[#FAF9F6] transition-colors">
                      <td className="py-4 px-5">
                        <div className="font-bold text-[#1C1B18] text-[14px]">
                          {ngo.full_name}
                        </div>
                        <div className="text-[12px] text-[#5A5852] flex items-center gap-2 mt-0.5">
                          <span>{ngo.email}</span>
                          {ngo.organization && (
                            <span className="inline-flex items-center gap-1 text-[#8E8B82]">
                              · <Building2 className="w-3 h-3" /> {ngo.organization}
                            </span>
                          )}
                        </div>
                        {(ngo.phone || ngo.address) && (
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-[#8E8B82]">
                            {ngo.phone && (
                              <span className="inline-flex items-center gap-1">
                                <Phone className="w-3 h-3" /> {ngo.phone}
                              </span>
                            )}
                            {ngo.address && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {ngo.address}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4 font-mono text-[12px] font-semibold text-[#1C1B18] tabular-nums">
                        {ngo.license_number ? (
                          <span className="px-2.5 py-1 rounded-lg bg-[#F4F2EC] border border-[#E6E3DA]">
                            {ngo.license_number}
                          </span>
                        ) : (
                          <span className="text-[#B42318] text-[11px]">Not Submitted</span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-[12px] text-[#5A5852] tabular-nums whitespace-nowrap">
                        {ngo.created_at
                          ? new Date(ngo.created_at).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "—"}
                      </td>

                      <td className="py-4 px-4">
                        <button
                          onClick={() => setPreviewNgo(ngo)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FDEEE7] text-[#C84614] hover:bg-[#fbd9c9] text-[12px] font-semibold whitespace-nowrap shrink-0"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Inspect Certificate
                        </button>
                      </td>

                      <td className="py-4 px-4">
                        {status === "approved" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#E8F5E9] text-[#1E6F3D] text-[11px] font-bold uppercase tracking-wider">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                          </span>
                        )}
                        {status === "pending" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FEF3C7] text-[#B45309] text-[11px] font-bold uppercase tracking-wider">
                            <Clock className="w-3.5 h-3.5" /> Pending Review
                          </span>
                        )}
                        {status === "rejected" && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FDE8E8] text-[#B42318] text-[11px] font-bold uppercase tracking-wider">
                              <XCircle className="w-3.5 h-3.5" /> Rejected
                            </span>
                            {ngo.rejection_reason && (
                              <div className="text-[11px] text-[#B42318] max-w-[220px] leading-snug">
                                Reason: {ngo.rejection_reason}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          {status !== "approved" && (
                            <button
                              disabled={actionBusyId === ngo.id}
                              onClick={() => handleApprove(ngo)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1E6F3D] hover:bg-[#175830] text-white text-[12px] font-semibold disabled:opacity-50 whitespace-nowrap shrink-0"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Approve License
                            </button>
                          )}
                          {status !== "rejected" && (
                            <button
                              disabled={actionBusyId === ngo.id}
                              onClick={() => {
                                setRejectTarget(ngo);
                                setRejectPreset(REJECTION_PRESETS[0]);
                                setRejectCustomNote("");
                                setRejectError(null);
                              }}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FDE8E8] hover:bg-[#fbd1d1] text-[#B42318] text-[12px] font-semibold disabled:opacity-50 whitespace-nowrap shrink-0"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Reject License
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Preview Modal */}
      {previewNgo && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#EBE8E0] max-w-2xl w-full p-6 space-y-5 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 border-b border-[#EBE8E0] pb-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#C84614]">
                  OFFICIAL REGISTRATION DOSSIER
                </div>
                <h3 className="text-[20px] font-serif font-bold text-[#1C1B18]">
                  {previewNgo.full_name}
                </h3>
                <p className="text-[12px] text-[#5A5852]">
                  License Number:{" "}
                  <strong className="font-mono text-[#1C1B18]">
                    {previewNgo.license_number || "N/A"}
                  </strong>
                </p>
              </div>
              <button
                onClick={() => setPreviewNgo(null)}
                className="p-1.5 rounded-lg text-[#8E8B82] hover:text-[#1C1B18] hover:bg-[#F3F1EC]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#F9F8F5] p-4 rounded-xl border border-[#EBE8E0] text-[12px]">
              <div>
                <div className="text-[#8E8B82] font-semibold">Legal Organization</div>
                <div className="font-bold text-[#1C1B18] mt-0.5">
                  {previewNgo.organization || previewNgo.full_name}
                </div>
              </div>
              <div>
                <div className="text-[#8E8B82] font-semibold">Authorized Contact</div>
                <div className="font-bold text-[#1C1B18] mt-0.5">
                  {previewNgo.phone || "Not provided"} · {previewNgo.email}
                </div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-[#8E8B82] font-semibold">Operating Address</div>
                <div className="font-bold text-[#1C1B18] mt-0.5">
                  {previewNgo.address || "Registered Community Distribution Hub"}
                </div>
              </div>
            </div>

            {/* Document Preview Surface */}
            <div className="rounded-xl border border-[#E6E3DA] bg-[#FAF9F6] p-5 space-y-4">
              {previewNgo.license_document_url?.startsWith("data:image/") ? (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#8E8B82]">
                    Uploaded Registration Certificate Image
                  </div>
                  <img
                    src={previewNgo.license_document_url}
                    alt="NGO License Certificate"
                    className="max-h-[340px] w-auto mx-auto rounded-lg border border-[#E6E3DA] object-contain"
                  />
                </div>
              ) : (
                <div className="border-2 border-dashed border-[#D8D4C8] rounded-xl p-6 bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-[#FDEEE7] text-[#C84614] flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[13px] font-bold text-[#1C1B18]">
                          Government NGO Trust & Food Safety Registration Certificate
                        </div>
                        <div className="text-[11px] text-[#5A5852] font-mono">
                          Ref: {previewNgo.license_number || "PENDING-DOC"}
                        </div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-md bg-[#E8F5E9] text-[#1E6F3D] text-[10px] font-bold uppercase">
                      Digital Dossier
                    </span>
                  </div>
                  <div className="text-[12px] text-[#5A5852] leading-relaxed border-t border-[#EBE8E0] pt-3">
                    This certifies that <strong>{previewNgo.organization || previewNgo.full_name}</strong> is registered under license{" "}
                    <strong className="font-mono">{previewNgo.license_number || "N/A"}</strong> at{" "}
                    <strong>{previewNgo.address || "Verified Operating Address"}</strong> for charitable food collection and community redistribution.
                  </div>
                  {previewNgo.license_document_url && (
                    <div className="pt-2 flex items-center justify-between text-[11px] text-[#8E8B82]">
                      <span className="truncate max-w-[380px]">
                        File URI: {previewNgo.license_document_url}
                      </span>
                      {previewNgo.license_document_url.startsWith("http") && (
                        <a
                          href={previewNgo.license_document_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[#C84614] font-semibold hover:underline"
                        >
                          Open Document <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setPreviewNgo(null)}
                className="px-4 py-2 rounded-xl border border-[#E6E3DA] text-[12px] font-semibold text-[#5A5852]"
              >
                Close Preview
              </button>
              {previewNgo.verification_status !== "approved" && (
                <button
                  onClick={() => {
                    const target = previewNgo;
                    setPreviewNgo(null);
                    handleApprove(target);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1E6F3D] text-white text-[12px] font-semibold"
                >
                  <CheckCircle2 className="w-4 h-4" /> Approve License Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject License Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmReject}
            className="bg-white rounded-2xl border border-[#EBE8E0] max-w-md w-full p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FDE8E8] text-[#B42318] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[18px] font-serif font-bold text-[#1C1B18]">
                  Reject NGO License Verification
                </h3>
                <p className="text-[12px] text-[#5A5852] mt-0.5">
                  Specify why <strong>{rejectTarget.full_name}</strong> ({rejectTarget.license_number || "No License #"}) cannot be verified. The NGO will be notified immediately.
                </p>
              </div>
            </div>

            {rejectError && (
              <div className="p-3 rounded-xl bg-[#FDE8E8] text-[#B42318] text-[12px] font-medium">
                {rejectError}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5A5852] mb-1.5">
                Primary Rejection Reason *
              </label>
              <select
                value={rejectPreset}
                onChange={(e) => setRejectPreset(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E3DA] bg-[#F9F8F5] text-[13px] text-[#1C1B18]"
              >
                {REJECTION_PRESETS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5A5852] mb-1.5">
                Additional Remediation Instructions {rejectPreset.startsWith("Other") ? "*" : "(Optional)"}
              </label>
              <textarea
                rows={3}
                value={rejectCustomNote}
                onChange={(e) => setRejectCustomNote(e.target.value)}
                placeholder="Explain what the NGO must fix or re-upload to pass verification..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E3DA] bg-[#F9F8F5] text-[13px] text-[#1C1B18]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="px-4 py-2 rounded-xl border border-[#E6E3DA] text-[12px] font-semibold text-[#5A5852]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionBusyId === rejectTarget.id}
                className="px-4 py-2 rounded-xl bg-[#B42318] hover:bg-[#911b12] text-white text-[12px] font-semibold disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
