import React, { useEffect, useState } from "react";
import { Search, Truck, Eye, Ban, CheckCircle, X } from "lucide-react";
import { api, endpoints, getErrorMessage } from "../lib/api";

interface VolunteerSummary {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  organization?: string;
  status: string;
  is_available: boolean;
  assigned_runs: number;
  completed_deliveries: number;
  total_assignments: number;
  created_at: string;
}

interface PendingHandover {
  id: number;
  request_id: number;
  listing_id: number;
  listing_title: string;
  pickup_location: string;
  dropoff_location: string;
  volunteer_id: number | null;
  volunteer_name?: string;
  status: string;
  created_at: string;
}

export function AdminVolunteers() {
  const [volunteers, setVolunteers] = useState<VolunteerSummary[]>([]);
  const [pendingHandovers, setPendingHandovers] = useState<PendingHandover[]>([]);
  const [search, setSearch] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVolunteer, setSelectedVolunteer] = useState<Record<string, any> | null>(null);

  const loadVolunteers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(endpoints.admin.volunteers, {
        params: {
          search: search || undefined,
          availability: availabilityFilter !== "all" ? availabilityFilter : undefined,
        },
      });
      setVolunteers(res.data.items || []);
      setPendingHandovers(res.data.pending_handovers || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVolunteers();
  }, [search, availabilityFilter]);

  const openVolunteerModal = async (id: number) => {
    try {
      const res = await api.get(endpoints.admin.volunteerDetail(id));
      setSelectedVolunteer(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const toggleVolunteerAccountStatus = async (v: VolunteerSummary) => {
    try {
      const nextStatus = v.status === "active" ? "deactivated" : "active";
      await api.patch(endpoints.admin.userStatus(v.id), {
        status: nextStatus,
        reason: "Volunteer management status update",
      });
      loadVolunteers();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleReassignHandover = async (
    handoverId: number,
    volunteerId: number | null
  ) => {
    try {
      await api.post(endpoints.admin.handoverReassign(handoverId), {
        volunteer_id: volunteerId,
      });
      loadVolunteers();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="px-8 py-7 max-w-[1360px] mx-auto space-y-7">
      <div>
        <p className="text-[11px] font-bold tracking-[0.14em] text-[#C84614] uppercase mb-1.5">
          FLEET &amp; DISPATCH COORDINATION
        </p>
        <h1 className="font-display text-[28px] font-extrabold text-[#1C1B18] tracking-[-0.02em]">
          Volunteer Management ({volunteers.length})
        </h1>
        <p className="text-[13.5px] text-[#7D776F] mt-1">
          View volunteer availability, track assigned pickups and completed deliveries, and assign or reassign active handovers.
        </p>
      </div>

      {error && (
        <div className="bg-[#FCEEE9] border border-[#F2C9B9] text-[#A83B18] text-[13px] px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Search & Availability Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#8A847C] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search volunteers by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white pl-10 pr-4 py-2.5 rounded-xl border border-[#EAE6DF] text-[13.5px] focus:outline-none focus:border-[#C84614]"
          />
        </div>

        <select
          value={availabilityFilter}
          onChange={(e) => setAvailabilityFilter(e.target.value)}
          className="bg-white border border-[#EAE6DF] rounded-xl px-3.5 py-2 text-[13px] font-medium"
        >
          <option value="all">All Availability</option>
          <option value="available">Available</option>
          <option value="unavailable">Unavailable</option>
        </select>
      </div>

      {/* Volunteers Table */}
      <div className="bg-white border border-[#EAE6DF] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#EAE6DF] bg-[#FAF9F6] text-[11px] font-bold tracking-[0.08em] text-[#7D776F] uppercase">
                <th className="py-3.5 px-4">ID</th>
                <th className="py-3.5 px-4">Volunteer</th>
                <th className="py-3.5 px-4">Availability</th>
                <th className="py-3.5 px-4">Active Pickups</th>
                <th className="py-3.5 px-4">Completed Deliveries</th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EDE6] text-[13px]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#7D776F]">
                    Loading volunteers...
                  </td>
                </tr>
              ) : volunteers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#7D776F]">
                    No volunteers found.
                  </td>
                </tr>
              ) : (
                volunteers.map((v) => (
                  <tr key={v.id} className="hover:bg-[#FAF9F6]">
                    <td className="py-3.5 px-4 font-mono text-[12px] text-[#7D776F]">
                      #{v.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-[#1C1B18]">{v.full_name}</p>
                      <p className="text-[12px] text-[#7D776F]">{v.email}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[12px] font-semibold ${
                          v.is_available ? "text-[#2E7D52]" : "text-[#8A847C]"
                        }`}
                      >
                        {v.is_available ? "Available" : "Offline"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#3B66B0]">
                      {v.assigned_runs}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#2E7D52]">
                      {v.completed_deliveries}
                    </td>
                    <td className="py-3.5 px-4 capitalize font-semibold text-[12px]">
                      {v.status}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openVolunteerModal(v.id)}
                          title="View assignment history"
                          className="p-2 rounded-lg border border-[#EAE6DF] hover:bg-[#F5F3EE] text-[#4A4640] cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleVolunteerAccountStatus(v)}
                          title={
                            v.status === "active"
                              ? "Deactivate volunteer"
                              : "Restore volunteer"
                          }
                          className="p-2 rounded-lg border border-[#EAE6DF] hover:bg-[#FCEEE9] text-[#C84614] cursor-pointer"
                        >
                          {v.status === "active" ? (
                            <Ban className="w-3.5 h-3.5" />
                          ) : (
                            <CheckCircle className="w-3.5 h-3.5" />
                          )}
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

      {/* Pending / Active Handovers Dispatch & Reassignment Queue */}
      <div className="bg-white border border-[#EAE6DF] rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Truck className="w-4 h-4 text-[#C84614]" />
          <h3 className="font-display font-bold text-[16px] text-[#1C1B18]">
            Active &amp; Pending Handover Assignments ({pendingHandovers.length})
          </h3>
        </div>
        {pendingHandovers.length === 0 ? (
          <p className="text-[13px] text-[#7D776F]">
            No pending or in-transit handovers require volunteer assignment right now.
          </p>
        ) : (
          <div className="space-y-3">
            {pendingHandovers.map((h) => (
              <div
                key={h.id}
                className="p-4 rounded-xl bg-[#FAF9F6] border border-[#EAE6DF] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <p className="font-bold text-[14px] text-[#1C1B18]">
                    Handover #{h.id} · {h.listing_title}
                  </p>
                  <p className="text-[12.5px] text-[#7D776F]">
                    {h.pickup_location} → {h.dropoff_location} · Status:{" "}
                    <span className="font-semibold text-[#3B66B0]">{h.status}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-[#6E6A63]">Assign Volunteer:</span>
                  <select
                    value={h.volunteer_id ?? ""}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : null;
                      handleReassignHandover(h.id, val);
                    }}
                    className="bg-white border border-[#EAE6DF] rounded-xl px-3 py-1.5 text-[12.5px] font-medium"
                  >
                    <option value="">Unassigned (Available Queue)</option>
                    {volunteers
                      .filter((v) => v.status === "active")
                      .map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.full_name} (#{v.id})
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Volunteer Profile & Assignments Modal */}
      {selectedVolunteer && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE6DF] rounded-2xl max-w-xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold tracking-[0.12em] text-[#C84614] uppercase">
                  VOLUNTEER ASSIGNMENT HISTORY
                </p>
                <h3 className="font-display text-[20px] font-extrabold text-[#1C1B18]">
                  {selectedVolunteer.volunteer.full_name}
                </h3>
                <p className="text-[12.5px] text-[#7D776F]">
                  {selectedVolunteer.volunteer.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVolunteer(null)}
                className="p-1.5 rounded-lg hover:bg-[#F5F3EE] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {(selectedVolunteer.assignments || []).length === 0 ? (
              <p className="text-[13px] text-[#7D776F]">
                No pickups or deliveries assigned to this volunteer yet.
              </p>
            ) : (
              <div className="space-y-2">
                {selectedVolunteer.assignments.map((a: any) => (
                  <div
                    key={a.id}
                    className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#EAE6DF] text-[12.5px] flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-[#1C1B18]">{a.listing_title}</p>
                      <p className="text-[#7D776F]">
                        {a.pickup_location} → {a.dropoff_location}
                      </p>
                    </div>
                    <span className="font-semibold capitalize text-[#2E7D52]">
                      {a.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
