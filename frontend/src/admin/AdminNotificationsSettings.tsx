import React, { useState, useEffect } from "react";
import { Bell, Send, Save, RefreshCw, ShieldAlert } from "lucide-react";
import { api, endpoints } from "../lib/api";

export default function AdminNotificationsSettings({
  mode,
  showToast,
}: {
  mode: "notifications" | "settings";
  showToast: (msg: string, tone?: string) => void;
}) {
  const [settings, setSettings] = useState<Record<string, string>>({
    platform_name: "ANNAPURNA",
    platform_description: "Community Food Rescue & Redistribution Platform",
    support_email: "support@annapurna.org",
    support_phone: "+91 800-555-FOOD",
    default_expiry_hours: "24",
    enable_notifications: "true",
    maintenance_mode: "false",
    allow_new_registrations: "true",
  });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [targetRole, setTargetRole] = useState("all");
  const [targetUserId, setTargetUserId] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      if (mode === "settings") {
        const res = await api.get(endpoints.admin.settings);
        if (res.data?.settings) {
          setSettings((prev) => ({ ...prev, ...res.data.settings }));
        }
      } else {
        const res = await api.get("/admin/notifications");
        setNotifications(res.data?.items || []);
      }
    } catch {
      showToast("Failed to load platform configuration", "danger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [mode]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(endpoints.admin.settings, { settings });
      showToast("Platform settings saved and logged to audit trail", "success");
      loadData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Failed to update settings", "danger");
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    try {
      const payload: any = {
        message: broadcastMessage.trim(),
        target_role: targetRole,
      };
      if (targetUserId.trim()) {
        payload.target_user_id = Number(targetUserId.trim());
      }
      const res = await api.post(endpoints.admin.broadcastNotification, payload);
      showToast(res.data?.message || "Announcement broadcasted", "success");
      setBroadcastMessage("");
      setTargetUserId("");
      loadData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Failed to broadcast announcement", "danger");
    }
  };

  if (mode === "notifications") {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold tracking-[0.12em] text-[#8E8B82] uppercase mb-1">COMMUNICATIONS CENTER</p>
            <h1 className="text-[28px] font-serif font-bold text-[#1C1B18]">Platform Announcements & Alerts</h1>
            <p className="text-[14px] text-[#5A5852]">Send targeted alerts or platform-wide broadcasts to Donors, NGOs, and Volunteers.</p>
          </div>
          <button onClick={loadData} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#EBE8E0] bg-white text-[13px] font-semibold text-[#1C1B18] hover:bg-[#F9F8F5]">
            <RefreshCw className="w-4 h-4 text-[#C84614]" /> Refresh
          </button>
        </div>

        {/* Broadcast Composer */}
        <form onSubmit={handleSendBroadcast} className="bg-white rounded-2xl border border-[#EBE8E0] p-6 space-y-4">
          <div className="flex items-center gap-2 text-[16px] font-bold text-[#1C1B18]">
            <Send className="w-4 h-4 text-[#C84614]" /> Dispatch System Announcement
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-bold text-[#5A5852] mb-1">Target Audience Role</label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#EBE8E0] text-[13px] bg-white"
              >
                <option value="all">All Active Platform Users</option>
                <option value="Donor">Donors Only</option>
                <option value="NGO">NGOs / Recipients Only</option>
                <option value="Volunteer">Volunteers Only</option>
                <option value="Admin">Administrators Only</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[#5A5852] mb-1">Specific User ID (Optional override)</label>
              <input
                type="number"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                placeholder="Leave blank to broadcast to role group"
                className="w-full px-3.5 py-2 rounded-xl border border-[#EBE8E0] text-[13px]"
              />
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-bold text-[#5A5852] mb-1">Announcement Message</label>
            <textarea
              required
              rows={3}
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="Write a clear announcement or emergency food rescue dispatch notice..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#EBE8E0] text-[13px]"
            />
          </div>
          <div className="flex justify-end">
            <button type="submit" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C84614] text-white text-[13px] font-semibold hover:bg-[#B03B0E]">
              <Bell className="w-4 h-4" /> Send Broadcast Notification
            </button>
          </div>
        </form>

        {/* Recent Sent Notifications */}
        <div className="bg-white rounded-2xl border border-[#EBE8E0] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#EBE8E0] font-bold text-[15px] text-[#1C1B18]">
            Recent Platform Notifications ({notifications.length})
          </div>
          <div className="divide-y divide-[#EBE8E0]">
            {loading ? (
              <div className="p-8 text-center text-[#8E8B82] text-[13px]">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-[#8E8B82] text-[13px]">No notifications recorded yet.</div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="p-4 flex items-start justify-between gap-4 hover:bg-[#F9F8F5]/60">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[13px] text-[#1C1B18]">{n.user_name}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#F3F1EC] text-[#5A5852]">{n.user_role}</span>
                      <span className="text-[11px] text-[#8E8B82]">{n.user_email}</span>
                    </div>
                    <p className="text-[13px] text-[#5A5852] mt-1">{n.message}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${n.is_read ? "bg-[#F3F1EC] text-[#8E8B82]" : "bg-[#FDEEE7] text-[#C84614]"}`}>
                      {n.is_read ? "Read" : "Unread"}
                    </span>
                    <p className="text-[11px] text-[#8E8B82] mt-1">
                      {n.created_at ? new Date(n.created_at).toLocaleString() : ""}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-[0.12em] text-[#8E8B82] uppercase mb-1">SYSTEM CONFIGURATION</p>
          <h1 className="text-[28px] font-serif font-bold text-[#1C1B18]">Platform Settings</h1>
          <p className="text-[14px] text-[#5A5852]">Configure global platform parameters, default food expiry windows, and registration policies.</p>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl border border-[#EBE8E0] p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-[12px] font-bold text-[#5A5852] mb-1">Platform Name</label>
            <input
              type="text"
              value={settings.platform_name || ""}
              onChange={(e) => setSettings({ ...settings, platform_name: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-[#EBE8E0] text-[13px]"
            />
          </div>
          <div>
            <label className="block text-[12px] font-bold text-[#5A5852] mb-1">Default Food Listing Expiry Window (Hours)</label>
            <input
              type="number"
              value={settings.default_expiry_hours || "24"}
              onChange={(e) => setSettings({ ...settings, default_expiry_hours: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-[#EBE8E0] text-[13px]"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[12px] font-bold text-[#5A5852] mb-1">Platform Description</label>
            <input
              type="text"
              value={settings.platform_description || ""}
              onChange={(e) => setSettings({ ...settings, platform_description: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-[#EBE8E0] text-[13px]"
            />
          </div>
          <div>
            <label className="block text-[12px] font-bold text-[#5A5852] mb-1">Support Contact Email</label>
            <input
              type="email"
              value={settings.support_email || ""}
              onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-[#EBE8E0] text-[13px]"
            />
          </div>
          <div>
            <label className="block text-[12px] font-bold text-[#5A5852] mb-1">Support Hotline / Phone</label>
            <input
              type="text"
              value={settings.support_phone || ""}
              onChange={(e) => setSettings({ ...settings, support_phone: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-[#EBE8E0] text-[13px]"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-[#EBE8E0] grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="flex items-center justify-between p-4 rounded-xl border border-[#EBE8E0] bg-[#F9F8F5] cursor-pointer">
            <div>
              <div className="text-[13px] font-bold text-[#1C1B18]">Enable Notifications</div>
              <div className="text-[11px] text-[#8E8B82]">Automated workflow alerts</div>
            </div>
            <input
              type="checkbox"
              checked={settings.enable_notifications === "true"}
              onChange={(e) => setSettings({ ...settings, enable_notifications: e.target.checked ? "true" : "false" })}
              className="w-4 h-4 accent-[#C84614]"
            />
          </label>
          <label className="flex items-center justify-between p-4 rounded-xl border border-[#EBE8E0] bg-[#F9F8F5] cursor-pointer">
            <div>
              <div className="text-[13px] font-bold text-[#1C1B18]">Allow Public Registrations</div>
              <div className="text-[11px] text-[#8E8B82]">New Donor/NGO/Volunteer signups</div>
            </div>
            <input
              type="checkbox"
              checked={settings.allow_new_registrations === "true"}
              onChange={(e) => setSettings({ ...settings, allow_new_registrations: e.target.checked ? "true" : "false" })}
              className="w-4 h-4 accent-[#C84614]"
            />
          </label>
          <label className="flex items-center justify-between p-4 rounded-xl border border-[#F5C2C7] bg-[#FDE8E8]/40 cursor-pointer">
            <div>
              <div className="text-[13px] font-bold text-[#B42318] flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" /> Maintenance Mode</div>
              <div className="text-[11px] text-[#B42318]/80">Restrict non-admin mutations</div>
            </div>
            <input
              type="checkbox"
              checked={settings.maintenance_mode === "true"}
              onChange={(e) => setSettings({ ...settings, maintenance_mode: e.target.checked ? "true" : "false" })}
              className="w-4 h-4 accent-[#B42318]"
            />
          </label>
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C84614] text-white text-[13px] font-semibold hover:bg-[#B03B0E]">
            <Save className="w-4 h-4" /> Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
}
