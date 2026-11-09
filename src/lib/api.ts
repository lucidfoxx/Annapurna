import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("shareplate_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const endpoints = {
  events: {
    stream: `${API_BASE_URL}/events/stream`,
  },
  auth: {
    register: "/auth/register",
    login: "/auth/login",
    me: "/auth/me",
    ngoLicense: "/auth/ngo-license",
    bootstrapStatus: "/auth/bootstrap-status",
    bootstrapAdmin: "/auth/bootstrap-admin",
  },
  donations: {
    my: (status: "active" | "past" = "active") => `/donations/my-donations?status=${status}`,
    myDonations: (status: "active" | "past" = "active") => `/donations/my-donations?status=${status}`,
    adminAll: "/donations/admin/all",
    claim: (id: string | number) => `/donations/${id}/claim`,
    cancel: (id: string | number) => `/donations/${id}/cancel`,
    createReview: (id: string | number) => `/donations/${id}/reviews`,
  },
  leaderboard: {
    list: (period: "all" | "monthly" | "weekly" = "all", sort: "points" | "donations" = "points") =>
      `/leaderboard?period=${period}&sort=${sort}`,
  },
  restaurants: {
    reviews: (id: string | number) => `/restaurants/${id}/reviews`,
  },
  claims: {
    my: (status: "active" | "past" = "active") => `/claims/my-claims?status=${status}`,
    myClaims: (status: "active" | "past" = "active") => `/claims/my-claims?status=${status}`,
  },
  listings: {
    list: "/listings",
    create: "/listings",
    delete: (id: string | number) => `/listings/${id}`,
  },
  requests: {
    list: "/requests",
    create: "/requests",
    accept: (id: string | number) => `/requests/${id}/accept`,
    reject: (id: string | number) => `/requests/${id}/reject`,
    fulfill: (id: string | number) => `/requests/${id}/fulfill`,
  },
  handovers: {
    available: "/handovers/available",
    my: "/handovers/my",
    assign: (id: string | number) => `/handovers/${id}/assign`,
    pickup: (id: string | number) => `/handovers/${id}/pickup`,
    deliver: (id: string | number) => `/handovers/${id}/deliver`,
  },
  deliveries: {
    verifyPickup: (id: string | number) => `/deliveries/${id}/verify-pickup`,
    verifyDelivery: (id: string | number) => `/deliveries/${id}/verify-delivery`,
  },
  notifications: {
    list: "/notifications",
    markRead: (id: string | number) => `/notifications/${id}/read`,
  },
  extras: {
    impact: "/extras/impact",
  },
  admin: {
    dashboardStats: "/admin/dashboard/stats",
    dashboardActivity: "/admin/dashboard/activity",
    ngoVerifications: (status: string = "all") => `/admin/ngos/verifications?status=${status}`,
    verifyNgo: (id: string | number) => `/admin/ngos/${id}/verify`,
    users: "/admin/users",
    userDetail: (id: string | number) => `/admin/users/${id}`,
    userRole: (id: string | number) => `/admin/users/${id}/role`,
    userStatus: (id: string | number) => `/admin/users/${id}/status`,
    listings: "/admin/listings",
    listingDetail: (id: string | number) => `/admin/listings/${id}`,
    listingRestore: (id: string | number) => `/admin/listings/${id}/restore`,
    requests: "/admin/requests",
    requestDetail: (id: string | number) => `/admin/requests/${id}`,
    requestModerate: (id: string | number) => `/admin/requests/${id}/moderate`,
    volunteers: "/admin/volunteers",
    volunteerDetail: (id: string | number) => `/admin/volunteers/${id}`,
    volunteerAssignments: (id: string | number) => `/admin/volunteers/${id}/assignments`,
    handoverReassign: (id: string | number) =>
      `/admin/volunteers/handovers/${id}/reassign`,
    donations: "/admin/donations",
    donationDetail: (id: string | number) => `/admin/donations/${id}`,
    databaseTables: "/admin/database/tables",
    databaseStats: "/admin/database/stats",
    databaseEntity: (entity: string) => `/admin/database/${entity}`,
    databaseRecord: (entity: string, id: string | number) =>
      `/admin/database/${entity}/${id}`,
    databaseExport: (entity: string) => `/admin/database/export/${entity}`,
    auditLogs: "/admin/audit-logs",
    settings: "/admin/settings",
    broadcastNotification: "/admin/notifications/broadcast",
  },
};

export function getErrorMessage(error: unknown, fallback = "Unable to reach the server."): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail.map((item) => item?.msg || JSON.stringify(item)).join(", ");
    }
    if (error.response?.data?.message) return String(error.response.data.message);
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
