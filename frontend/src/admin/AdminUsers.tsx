import React, { useEffect, useState } from "react";
import {
  Search,
  Eye,
  Edit3,
  Shield,
  Ban,
  CheckCircle,
  Trash2,
  X,
} from "lucide-react";
import { api, endpoints, getErrorMessage } from "../lib/api";
import { useAuth, UserRole } from "../context/AuthContext";

interface AdminUserRecord {
  id: number;
  full_name: string;
  email: string;
  role: UserRole;
  status: string;
  phone?: string | null;
  organization?: string | null;
  is_available?: boolean;
  created_at?: string;
}

interface UserDetailPayload {
  user: AdminUserRecord;
  donation_history: {
    id: number;
    title: string;
    category: string;
    quantity: string;
    status: string;
    created_at: string;
  }[];
  request_history: {
    id: number;
    listing_id: number;
    listing_title: string;
    status: string;
    created_at: string;
  }[];
  handover_history: {
    id: number;
    listing_title: string;
    pickup_location: string;
    dropoff_location: string;
    status: string;
    created_at: string;
  }[];
  audit_history: {
    id: number;
    action: string;
    admin_email: string;
    previous_value: string | null;
    new_value: string | null;
    created_at: string;
  }[];
}

export function AdminUsers() {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Modals
  const [selectedDetail, setSelectedDetail] = useState<UserDetailPayload | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUserRecord | null>(null);
  const [editForm, setEditForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    organization: "",
    is_available: true,
  });

  const [roleModalUser, setRoleModalUser] = useState<AdminUserRecord | null>(null);
  const [targetRole, setTargetRole] = useState<UserRole>("Donor");
  const [roleReason, setRoleReason] = useState("");

  const [confirmAction, setConfirmAction] = useState<{
    type: "status" | "delete";
    user: AdminUserRecord;
    desiredStatus?: string;
  } | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(endpoints.admin.users, {
        params: {
          search: search || undefined,
          role: roleFilter !== "all" ? roleFilter : undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          page,
          page_size: 20,
        },
      });
      setUsers(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [search, roleFilter, statusFilter, page]);

  const openUserDetail = async (id: number) => {
    setError(null);
    try {
      const res = await api.get(endpoints.admin.userDetail(id));
      setSelectedDetail(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const openEditModal = (u: AdminUserRecord) => {
    setEditingUser(u);
    setEditForm({
      full_name: u.full_name,
      email: u.email,
      phone: u.phone || "",
      organization: u.organization || "",
      is_available: u.is_available ?? true,
    });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setError(null);
    try {
      await api.patch(endpoints.admin.userDetail(editingUser.id), editForm);
      setFeedback(`Updated profile for ${editForm.full_name}.`);
      setEditingUser(null);
      loadUsers();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleConfirmRoleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleModalUser) return;
    setError(null);
    try {
      await api.patch(endpoints.admin.userRole(roleModalUser.id), {
        role: targetRole,
        reason: roleReason || "Administrative role assignment",
      });
      setFeedback(`Changed ${roleModalUser.full_name}'s role to ${targetRole}.`);
      setRoleModalUser(null);
      setRoleReason("");
      loadUsers();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const executeStatusOrDelete = async () => {
    if (!confirmAction) return;
    setError(null);
    try {
      if (confirmAction.type === "status" && confirmAction.desiredStatus) {
        await api.patch(endpoints.admin.userStatus(confirmAction.user.id), {
          status: confirmAction.desiredStatus,
          reason: "Administrative status change",
        });
        setFeedback(
          `Updated ${confirmAction.user.full_name} account status to ${confirmAction.desiredStatus}.`
        );
      } else if (confirmAction.type === "delete") {
        await api.delete(endpoints.admin.userDetail(confirmAction.user.id));
        setFeedback(`Deleted account ${confirmAction.user.email}.`);
      }
      setConfirmAction(null);
      loadUsers();
    } catch (err) {
      setError(getErrorMessage(err));
      setConfirmAction(null);
    }
  };

  return (
    <div className="px-8 py-7 max-w-[1360px] mx-auto space-y-6">
      <div>
        <p className="text-[11px] font-bold tracking-[0.14em] text-[#C84614] uppercase mb-1.5">
          USER &amp; ACCESS GOVERNANCE
        </p>
        <h1 className="font-display text-[28px] font-extrabold text-[#1C1B18] tracking-[-0.02em]">
          User Management ({total})
        </h1>
        <p className="text-[13.5px] text-[#7D776F] mt-1">
          Inspect profiles, manage roles (Donor, NGO, Volunteer, Admin), and control account status with audit logging.
        </p>
      </div>

      {error && (
        <div className="bg-[#FCEEE9] border border-[#F2C9B9] text-[#A83B18] text-[13px] px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {feedback && (
        <div className="bg-[#E8F3EC] border border-[#B8DFC6] text-[#2E7D52] text-[13px] px-4 py-3 rounded-xl flex items-center justify-between">
          <span>{feedback}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-bold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#8A847C] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, organization, or ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-white pl-10 pr-4 py-2.5 rounded-xl border border-[#EAE6DF] text-[13.5px] focus:outline-none focus:border-[#C84614]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="bg-white border border-[#EAE6DF] rounded-xl px-3.5 py-2 text-[13px] font-medium text-[#1C1B18]"
          >
            <option value="all">All Roles</option>
            <option value="Donor">Donor</option>
            <option value="NGO">Recipient (NGO)</option>
            <option value="Volunteer">Volunteer</option>
            <option value="Admin">Admin</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-white border border-[#EAE6DF] rounded-xl px-3.5 py-2 text-[13px] font-medium text-[#1C1B18]"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="deactivated">Deactivated</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-[#EAE6DF] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#EAE6DF] bg-[#FAF9F6] text-[11px] font-bold tracking-[0.08em] text-[#7D776F] uppercase">
                <th className="py-3.5 px-4">ID</th>
                <th className="py-3.5 px-4">User / Organization</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Registered</th>
                <th className="py-3.5 px-4 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EDE6] text-[13px]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#7D776F]">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#7D776F]">
                    No users match the current filters.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSelf = String(u.id) === String(currentAdmin?.id);
                  return (
                    <tr key={u.id} className="hover:bg-[#FAF9F6]">
                      <td className="py-3.5 px-4 font-mono text-[12px] text-[#7D776F]">
                        #{u.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-[#1C1B18]">
                          {u.full_name}{" "}
                          {isSelf && (
                            <span className="text-[11px] font-semibold text-[#C84614]">
                              (You)
                            </span>
                          )}
                        </p>
                        <p className="text-[12px] text-[#7D776F]">
                          {u.email}
                          {u.organization ? ` · ${u.organization}` : ""}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-[#1C1B18]">{u.role}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[12px] font-semibold capitalize ${
                            u.status === "active"
                              ? "text-[#2E7D52]"
                              : u.status === "suspended"
                              ? "text-[#C87A1E]"
                              : "text-[#A83B18]"
                          }`}
                        >
                          {u.status || "active"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[12px] text-[#7D776F]">
                        {u.created_at
                          ? new Date(u.created_at).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openUserDetail(u.id)}
                            title="Inspect profile & activity"
                            className="p-2 rounded-lg border border-[#EAE6DF] hover:bg-[#F5F3EE] text-[#4A4640] cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(u)}
                            title="Edit profile"
                            className="p-2 rounded-lg border border-[#EAE6DF] hover:bg-[#F5F3EE] text-[#4A4640] cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRoleModalUser(u);
                              setTargetRole(u.role);
                              setRoleReason("");
                            }}
                            title="Change role"
                            className="p-2 rounded-lg border border-[#EAE6DF] hover:bg-[#FCEEE9] text-[#C84614] cursor-pointer"
                          >
                            <Shield className="w-3.5 h-3.5" />
                          </button>
                          {u.status === "active" ? (
                            <button
                              type="button"
                              disabled={isSelf}
                              onClick={() =>
                                setConfirmAction({
                                  type: "status",
                                  user: u,
                                  desiredStatus: "suspended",
                                })
                              }
                              title="Suspend account"
                              className="p-2 rounded-lg border border-[#EAE6DF] hover:bg-[#FDF3E6] text-[#C87A1E] disabled:opacity-40 cursor-pointer"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmAction({
                                  type: "status",
                                  user: u,
                                  desiredStatus: "active",
                                })
                              }
                              title="Restore / Activate account"
                              className="p-2 rounded-lg border border-[#EAE6DF] hover:bg-[#E8F3EC] text-[#2E7D52] cursor-pointer"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={isSelf}
                            onClick={() =>
                              setConfirmAction({
                                type: "delete",
                                user: u,
                              })
                            }
                            title="Delete account"
                            className="p-2 rounded-lg border border-[#EAE6DF] hover:bg-[#FCEEE9] text-[#A83B18] disabled:opacity-40 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* User Detail Modal */}
      {selectedDetail && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE6DF] rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold tracking-[0.12em] text-[#C84614] uppercase">
                  USER PROFILE &amp; ACTIVITY HISTORY
                </p>
                <h3 className="font-display text-[22px] font-extrabold text-[#1C1B18]">
                  {selectedDetail.user.full_name} (#{selectedDetail.user.id})
                </h3>
                <p className="text-[13px] text-[#7D776F]">
                  {selectedDetail.user.email} · Role: {selectedDetail.user.role} · Status:{" "}
                  {selectedDetail.user.status}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetail(null)}
                className="p-1.5 rounded-lg hover:bg-[#F5F3EE] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#EAE6DF]">
                <p className="text-[11.5px] text-[#7D776F]">Donations Created</p>
                <p className="font-display text-[20px] font-extrabold text-[#1C1B18]">
                  {selectedDetail.donation_history.length}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#EAE6DF]">
                <p className="text-[11.5px] text-[#7D776F]">Requests Submitted</p>
                <p className="font-display text-[20px] font-extrabold text-[#1C1B18]">
                  {selectedDetail.request_history.length}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#EAE6DF]">
                <p className="text-[11.5px] text-[#7D776F]">Volunteer Runs</p>
                <p className="font-display text-[20px] font-extrabold text-[#1C1B18]">
                  {selectedDetail.handover_history.length}
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-display font-bold text-[14px] text-[#1C1B18] mb-2">
                Recent Audit Trail for User
              </h4>
              {selectedDetail.audit_history.length === 0 ? (
                <p className="text-[12.5px] text-[#7D776F]">No administrative changes logged.</p>
              ) : (
                <div className="space-y-2">
                  {selectedDetail.audit_history.map((a) => (
                    <div
                      key={a.id}
                      className="p-3 rounded-xl bg-[#FAF9F6] border border-[#EAE6DF] text-[12px]"
                    >
                      <span className="font-bold text-[#1C1B18]">{a.action}</span> by{" "}
                      {a.admin_email}
                      {a.new_value && (
                        <div className="font-mono text-[11px] text-[#6E6A63] mt-1">
                          New: {a.new_value}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit User Profile Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveProfile}
            className="bg-white border border-[#EAE6DF] rounded-2xl max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-[18px] text-[#1C1B18]">
                Edit Profile — {editingUser.full_name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-lg hover:bg-[#F5F3EE] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#4A4640] mb-1">
                Full name
              </label>
              <input
                type="text"
                required
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-[#EAE6DF] text-[13px]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#4A4640] mb-1">
                Email address
              </label>
              <input
                type="email"
                required
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-[#EAE6DF] text-[13px]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#4A4640] mb-1">
                Organization
              </label>
              <input
                type="text"
                value={editForm.organization}
                onChange={(e) => setEditForm({ ...editForm, organization: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-[#EAE6DF] text-[13px]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#4A4640] mb-1">
                Phone
              </label>
              <input
                type="text"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-[#EAE6DF] text-[13px]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 rounded-xl text-[13px] font-medium text-[#6E6A63] hover:bg-[#F5F3EE] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#C84614] text-white text-[13px] font-semibold cursor-pointer"
              >
                Save changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Role Change Confirmation Modal */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmRoleChange}
            className="bg-white border border-[#EAE6DF] rounded-2xl max-w-md w-full p-6 space-y-4"
          >
            <h3 className="font-display font-bold text-[18px] text-[#1C1B18]">
              Change Role for {roleModalUser.full_name}
            </h3>
            <p className="text-[12.5px] text-[#7D776F]">
              Role updates immediately change the user&apos;s workspace permissions and are recorded in the platform audit log.
            </p>
            <div>
              <label className="block text-[12px] font-semibold text-[#4A4640] mb-1">
                Select new role
              </label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value as UserRole)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE6DF] text-[13px]"
              >
                <option value="Donor">Donor</option>
                <option value="NGO">Recipient (NGO)</option>
                <option value="Volunteer">Volunteer</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#4A4640] mb-1">
                Audit reason / note
              </label>
              <input
                type="text"
                placeholder="Reason for role modification..."
                value={roleReason}
                onChange={(e) => setRoleReason(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#EAE6DF] text-[13px]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRoleModalUser(null)}
                className="px-4 py-2 rounded-xl text-[13px] font-medium text-[#6E6A63] hover:bg-[#F5F3EE] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#C84614] text-white text-[13px] font-semibold cursor-pointer"
              >
                Confirm Role Change
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Status / Delete Confirmation Dialog */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE6DF] rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-display font-bold text-[18px] text-[#1C1B18]">
              Confirm Administrative Action
            </h3>
            <p className="text-[13px] text-[#7D776F]">
              {confirmAction.type === "delete"
                ? `Are you sure you want to delete user "${confirmAction.user.full_name}" (${confirmAction.user.email})?`
                : `Are you sure you want to change "${confirmAction.user.full_name}" account status to "${confirmAction.desiredStatus}"?`}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 rounded-xl text-[13px] font-medium text-[#6E6A63] hover:bg-[#F5F3EE] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeStatusOrDelete}
                className="px-4 py-2 rounded-xl bg-[#C84614] text-white text-[13px] font-semibold cursor-pointer"
              >
                Confirm Action
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
