import React, { useState, useEffect } from "react";
import { Search, Eye, RefreshCw, X, ShieldCheck } from "lucide-react";
import { api, endpoints } from "../lib/api";

export default function AdminAuditLogs({ showToast }: { showToast: (msg: string, tone?: string) => void }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get(endpoints.admin.auditLogs, {
        params: { page, limit: 20, search, action: actionFilter, entity_type: entityFilter },
      });
      setLogs(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch {
      showToast("Failed to load audit logs", "danger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [page, actionFilter, entityFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-[0.12em] text-[#8E8B82] uppercase mb-1">SECURITY & COMPLIANCE</p>
          <h1 className="text-[28px] font-serif font-bold text-[#1C1B18]">Immutable Audit Logs</h1>
          <p className="text-[14px] text-[#5A5852]">Complete chronological record of all administrative actions, role changes, and moderation decisions.</p>
        </div>
        <button onClick={loadLogs} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#EBE8E0] bg-white text-[13px] font-semibold text-[#1C1B18] hover:bg-[#F9F8F5]">
          <RefreshCw className="w-4 h-4 text-[#C84614]" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-[#EBE8E0] p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-[#8E8B82] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (setPage(1), loadLogs())}
            placeholder="Search by action, entity, details, or IP address..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#EBE8E0] text-[13px] focus:outline-none focus:border-[#C84614]"
          />
        </div>
        <select
          value={entityFilter}
          onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
          className="px-3.5 py-2 rounded-xl border border-[#EBE8E0] text-[13px] bg-white text-[#1C1B18]"
        >
          <option value="all">All Entities</option>
          <option value="user">User</option>
          <option value="food_listing">Food Listing</option>
          <option value="donation_request">Donation Request</option>
          <option value="volunteer_handover">Volunteer Handover</option>
          <option value="platform_setting">Platform Setting</option>
          <option value="notification">Notification</option>
        </select>
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          className="px-3.5 py-2 rounded-xl border border-[#EBE8E0] text-[13px] bg-white text-[#1C1B18]"
        >
          <option value="all">All Actions</option>
          <option value="USER_ROLE_CHANGE">USER_ROLE_CHANGE</option>
          <option value="USER_STATUS_CHANGE">USER_STATUS_CHANGE</option>
          <option value="USER_DELETE">USER_DELETE</option>
          <option value="LISTING_FLAG">LISTING_FLAG</option>
          <option value="LISTING_REMOVE">LISTING_REMOVE</option>
          <option value="REQUEST_MODERATE">REQUEST_MODERATE</option>
          <option value="VOLUNTEER_ASSIGN">VOLUNTEER_ASSIGN</option>
          <option value="DATABASE_CSV_EXPORT">DATABASE_CSV_EXPORT</option>
          <option value="PLATFORM_SETTINGS_UPDATE">PLATFORM_SETTINGS_UPDATE</option>
          <option value="NOTIFICATION_BROADCAST">NOTIFICATION_BROADCAST</option>
        </select>
        <button onClick={() => { setPage(1); loadLogs(); }} className="px-4 py-2 rounded-xl bg-[#1C1B18] text-white text-[13px] font-semibold">
          Search
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#EBE8E0] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#EBE8E0] bg-[#F9F8F5] text-[11px] font-bold tracking-wider uppercase text-[#8E8B82]">
                <th className="py-3.5 px-4">Log ID</th>
                <th className="py-3.5 px-4">Administrator</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Target Entity</th>
                <th className="py-3.5 px-4">Summary Details</th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBE8E0] text-[13px]">
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center text-[#8E8B82]">Loading audit trail...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-[#8E8B82]">No audit log entries match your criteria.</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F9F8F5]/60">
                    <td className="py-3.5 px-4 font-mono text-[12px] text-[#8E8B82]">#{log.id}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#1C1B18]">{log.admin_name}</div>
                      <div className="text-[11px] text-[#8E8B82]">{log.admin_email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FDEEE7] text-[#C84614]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-[#1C1B18]">{log.entity_type}</span>
                      {log.entity_id ? <span className="text-[#8E8B82] ml-1">#{log.entity_id}</span> : null}
                    </td>
                    <td className="py-3.5 px-4 text-[#5A5852] max-w-[300px] truncate">{log.details}</td>
                    <td className="py-3.5 px-4 text-[12px] text-[#8E8B82]">
                      {log.created_at ? new Date(log.created_at).toLocaleString() : "—"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#EBE8E0] text-[12px] font-semibold text-[#1C1B18] hover:bg-[#F9F8F5]"
                      >
                        <Eye className="w-3.5 h-3.5" /> Diff
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-[#EBE8E0] flex items-center justify-between text-[12px] text-[#8E8B82]">
          <span>Total immutable audit records: {total}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1 rounded-lg border border-[#EBE8E0] disabled:opacity-40">Prev</button>
            <span className="px-2 py-1">Page {page}</span>
            <button disabled={page * 20 >= total} onClick={() => setPage(page + 1)} className="px-3 py-1 rounded-lg border border-[#EBE8E0] disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>

      {/* Audit Detail / Before & After JSON Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#EBE8E0] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#C84614]" />
                <h3 className="text-[18px] font-bold text-[#1C1B18]">Audit Log #{selectedLog.id} — {selectedLog.action}</h3>
              </div>
              <button onClick={() => setSelectedLog(null)} className="p-1 rounded-lg hover:bg-[#F3F1EC]"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-[13px] bg-[#F9F8F5] p-4 rounded-xl border border-[#EBE8E0]">
              <div><span className="text-[#8E8B82]">Admin:</span> <strong>{selectedLog.admin_name} ({selectedLog.admin_email})</strong></div>
              <div><span className="text-[#8E8B82]">Target:</span> <strong>{selectedLog.entity_type} #{selectedLog.entity_id || "—"}</strong></div>
              <div><span className="text-[#8E8B82]">IP Address:</span> <strong>{selectedLog.ip_address || "127.0.0.1"}</strong></div>
              <div><span className="text-[#8E8B82]">Timestamp:</span> <strong>{selectedLog.created_at ? new Date(selectedLog.created_at).toLocaleString() : "—"}</strong></div>
              <div className="col-span-2"><span className="text-[#8E8B82]">Summary:</span> <strong>{selectedLog.details}</strong></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase text-[#8E8B82] mb-1.5">Before State (JSON)</p>
                <pre className="p-3 rounded-xl bg-[#1C1B18] text-[#F9F8F5] text-[12px] font-mono overflow-x-auto min-h-[120px]">
                  {selectedLog.before_value || "// No previous state recorded"}
                </pre>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase text-[#8E8B82] mb-1.5">After State (JSON)</p>
                <pre className="p-3 rounded-xl bg-[#1C1B18] text-[#86EFAC] text-[12px] font-mono overflow-x-auto min-h-[120px]">
                  {selectedLog.after_value || "// No subsequent state recorded"}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
