import React, { useEffect, useState } from "react";
import {
  Search,
  Flag,
  Trash2,
  RotateCcw,
  Eye,
  X,
} from "lucide-react";
import { api, endpoints, getErrorMessage } from "../lib/api";

interface AdminListing {
  id: number;
  title: string;
  description: string;
  category: string;
  quantity: string;
  pickup_location: string;
  expiry_time?: string;
  status: string;
  is_flagged: boolean;
  moderation_notes?: string;
  donor_id: number;
  donor_name: string;
  created_at: string;
}

export function AdminListings() {
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<Record<string, any> | null>(null);

  const loadListings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(endpoints.admin.listings, {
        params: {
          search: search || undefined,
          category: categoryFilter !== "all" ? categoryFilter : undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          flagged_only: flaggedOnly || undefined,
        },
      });
      setListings(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, [search, categoryFilter, statusFilter, flaggedOnly]);

  const handleFlagToggle = async (item: AdminListing) => {
    try {
      await api.patch(endpoints.admin.listingDetail(item.id), {
        is_flagged: !item.is_flagged,
        moderation_notes: !item.is_flagged
          ? "Marked suspicious by administrator for review"
          : "Cleared by administrator",
      });
      loadListings();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleSoftRemove = async (id: number) => {
    try {
      await api.delete(endpoints.admin.listingDetail(id));
      loadListings();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleRestore = async (id: number) => {
    try {
      await api.post(endpoints.admin.listingRestore(id));
      loadListings();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const openListingDetail = async (id: number) => {
    try {
      const res = await api.get(endpoints.admin.listingDetail(id));
      setDetailData(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="px-8 py-7 max-w-[1360px] mx-auto space-y-6">
      <div>
        <p className="text-[11px] font-bold tracking-[0.14em] text-[#C84614] uppercase mb-1.5">
          SURPLUS INVENTORY MODERATION
        </p>
        <h1 className="font-display text-[28px] font-extrabold text-[#1C1B18] tracking-[-0.02em]">
          Food Listing Management ({total})
        </h1>
        <p className="text-[13.5px] text-[#7D776F] mt-1">
          Inspect donor listings, flag suspicious items for review, soft-remove invalid listings, or restore archived items.
        </p>
      </div>

      {error && (
        <div className="bg-[#FCEEE9] border border-[#F2C9B9] text-[#A83B18] text-[13px] px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#8A847C] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by listing title, donor, or pickup location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white pl-10 pr-4 py-2.5 rounded-xl border border-[#EAE6DF] text-[13.5px] focus:outline-none focus:border-[#C84614]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white border border-[#EAE6DF] rounded-xl px-3.5 py-2 text-[13px] font-medium"
          >
            <option value="all">All Categories</option>
            <option value="cooked_meals">Cooked Meals</option>
            <option value="bakery">Bakery</option>
            <option value="produce">Produce</option>
            <option value="packaged">Packaged</option>
            <option value="dairy">Dairy</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-[#EAE6DF] rounded-xl px-3.5 py-2 text-[13px] font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="available">Available</option>
            <option value="requested">Requested</option>
            <option value="claimed">Claimed</option>
            <option value="completed">Completed</option>
            <option value="expired">Expired</option>
            <option value="removed">Removed (Archived)</option>
          </select>

          <button
            type="button"
            onClick={() => setFlaggedOnly(!flaggedOnly)}
            className={`px-3.5 py-2 rounded-xl border text-[12.5px] font-semibold cursor-pointer ${
              flaggedOnly
                ? "bg-[#FCEEE9] border-[#C84614] text-[#C84614]"
                : "bg-white border-[#EAE6DF] text-[#4A4640]"
            }`}
          >
            Flagged Only
          </button>
        </div>
      </div>

      {/* Listings Table */}
      <div className="bg-white border border-[#EAE6DF] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#EAE6DF] bg-[#FAF9F6] text-[11px] font-bold tracking-[0.08em] text-[#7D776F] uppercase">
                <th className="py-3.5 px-4">ID</th>
                <th className="py-3.5 px-4">Listing &amp; Category</th>
                <th className="py-3.5 px-4">Donor</th>
                <th className="py-3.5 px-4">Quantity &amp; Location</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EDE6] text-[13px]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#7D776F]">
                    Loading food listings...
                  </td>
                </tr>
              ) : listings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#7D776F]">
                    No food listings found matching the criteria.
                  </td>
                </tr>
              ) : (
                listings.map((l) => (
                  <tr key={l.id} className="hover:bg-[#FAF9F6]">
                    <td className="py-3.5 px-4 font-mono text-[12px] text-[#7D776F]">
                      #{l.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-[#1C1B18]">
                        {l.title}{" "}
                        {l.is_flagged && (
                          <span className="text-[11px] font-semibold text-[#C84614] ml-1">
                            [Flagged for Review]
                          </span>
                        )}
                      </p>
                      <p className="text-[12px] text-[#7D776F] capitalize">
                        {(l.category || "cooked_meals").replace("_", " ")}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-[#4A4640] font-medium">
                      {l.donor_name} (#{l.donor_id})
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-[#1C1B18]">{l.quantity}</p>
                      <p className="text-[12px] text-[#7D776F]">{l.pickup_location}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[12px] font-semibold capitalize ${
                          l.status === "available"
                            ? "text-[#2E7D52]"
                            : l.status === "removed"
                            ? "text-[#A83B18]"
                            : "text-[#3B66B0]"
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openListingDetail(l.id)}
                          title="View full listing details & requests"
                          className="p-2 rounded-lg border border-[#EAE6DF] hover:bg-[#F5F3EE] text-[#4A4640] cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFlagToggle(l)}
                          title={l.is_flagged ? "Unflag listing" : "Flag suspicious listing"}
                          className={`p-2 rounded-lg border cursor-pointer ${
                            l.is_flagged
                              ? "bg-[#FCEEE9] border-[#C84614] text-[#C84614]"
                              : "border-[#EAE6DF] hover:bg-[#FDF3E6] text-[#C87A1E]"
                          }`}
                        >
                          <Flag className="w-3.5 h-3.5" />
                        </button>
                        {l.status !== "removed" ? (
                          <button
                            type="button"
                            onClick={() => handleSoftRemove(l.id)}
                            title="Soft-remove listing"
                            className="p-2 rounded-lg border border-[#EAE6DF] hover:bg-[#FCEEE9] text-[#A83B18] cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRestore(l.id)}
                            title="Restore listing"
                            className="p-2 rounded-lg border border-[#EAE6DF] hover:bg-[#E8F3EC] text-[#2E7D52] cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Listing Detail Modal */}
      {detailData && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE6DF] rounded-2xl max-w-xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold tracking-[0.12em] text-[#C84614] uppercase">
                  LISTING INSPECTION
                </p>
                <h3 className="font-display text-[20px] font-extrabold text-[#1C1B18]">
                  {detailData.listing.title} (#{detailData.listing.id})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailData(null)}
                className="p-1.5 rounded-lg hover:bg-[#F5F3EE] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-[13px] space-y-1.5 text-[#4A4640]">
              <p>
                <strong>Donor:</strong> {detailData.donor?.full_name || detailData.listing.donor_name} (
                {detailData.donor?.email || "—"})
              </p>
              <p>
                <strong>Quantity:</strong> {detailData.listing.quantity}
              </p>
              <p>
                <strong>Pickup Location:</strong> {detailData.listing.pickup_location}
              </p>
              <p>
                <strong>Status:</strong> {detailData.listing.status}
              </p>
              <p>
                <strong>Description:</strong> {detailData.listing.description || "None"}
              </p>
            </div>

            <div>
              <h4 className="font-display font-bold text-[14px] text-[#1C1B18] mb-2">
                Associated Requests ({(detailData.requests || []).length})
              </h4>
              {(detailData.requests || []).length === 0 ? (
                <p className="text-[12.5px] text-[#7D776F]">No requests for this listing.</p>
              ) : (
                <div className="space-y-2">
                  {detailData.requests.map((r: any) => (
                    <div
                      key={r.id}
                      className="p-3 rounded-xl bg-[#FAF9F6] border border-[#EAE6DF] text-[12.5px] flex justify-between"
                    >
                      <span>
                        #{r.id} · {r.requester_name} ({r.notes || "No note"})
                      </span>
                      <span className="font-semibold capitalize">{r.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
