import express, { Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type UserRole = "Donor" | "NGO" | "Volunteer" | "Admin";

interface UserRecord {
  id: number;
  full_name: string;
  email: string;
  password?: string;
  role: UserRole;
  status: "active" | "suspended" | "deactivated";
  phone?: string;
  organization?: string;
  address?: string;
  is_available: boolean;
  verification_status: "pending" | "approved" | "rejected";
  license_number?: string | null;
  license_document_url?: string | null;
  verified_at?: string | null;
  verified_by_admin_id?: number | null;
  rejection_reason?: string | null;
  created_at: string;
}

interface ListingRecord {
  id: number;
  title: string;
  description: string;
  category: string;
  quantity: string;
  pickup_location: string;
  expiry_time?: string;
  status:
    | "available"
    | "requested"
    | "claimed"
    | "in_transit"
    | "picked_up"
    | "delivered"
    | "completed"
    | "cancelled"
    | "expired"
    | "pickup_failed"
    | "delivery_failed"
    | "flagged"
    | "removed";
  is_flagged: boolean;
  moderation_notes?: string;
  donor_id: number;
  donor_name: string;
  claimed_by_ngo_id?: number | null;
  claimed_by_ngo_name?: string | null;
  claimed_at?: string | null;
  cancellation_reason?: string | null;
  cancelled_at?: string | null;
  pickup_status: "pending" | "claimed" | "pickup_failed";
  pickup_failure_reason?: string | null;
  delivery_status: "pending" | "in_transit" | "delivered" | "delivery_failed";
  delivery_failure_reason?: string | null;
  verified_by_volunteer_id?: number | null;
  created_at: string;
}

interface ReviewRecord {
  id: number;
  donation_id: number;
  restaurant_id: number;
  ngo_id: number;
  ngo_name: string;
  rating: number;
  comment?: string | null;
  tags: string[];
  created_at: string;
}

interface RequestRecord {
  id: number;
  listing_id?: number | null;
  listing_title: string;
  requester_id: number;
  requester_name: string;
  ngo_id?: number | null;
  ngo_name?: string | null;
  quantity?: string;
  requested_quantity?: string;
  required_by?: string | null;
  urgency_level?: string | null;
  request_type: "listing_claim" | "open_broadcast";
  notes?: string;
  status:
    | "open"
    | "fulfilled"
    | "pending"
    | "accepted"
    | "rejected"
    | "cancelled"
    | "completed"
    | "delivered"
    | "failed_delivery"
    | "expired"
    | "under_review";
  is_disputed: boolean;
  moderation_note?: string;
  created_at: string;
}

interface HandoverRecord {
  id: number;
  request_id: number;
  listing_id: number;
  listing_title: string;
  pickup_location: string;
  dropoff_location: string;
  volunteer_id: number | null;
  volunteer_name?: string;
  status:
    | "available"
    | "assigned"
    | "picked_up"
    | "in_transit"
    | "delivered"
    | "pickup_failed"
    | "delivery_failed";
  pickup_status: "pending" | "claimed" | "pickup_failed";
  pickup_failure_reason?: string | null;
  delivery_status: "pending" | "in_transit" | "delivered" | "delivery_failed";
  delivery_failure_reason?: string | null;
  verified_by_volunteer_id?: number | null;
  verified_at?: string | null;
  distribution_proof?: string | null;
  notes?: string;
  created_at: string;
}

interface NotificationRecord {
  id: number;
  user_id: number;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface AuditLogRecord {
  id: number;
  admin_id: number | null;
  admin_email: string;
  action: string;
  entity_type: string;
  entity_id: string;
  previous_value: string | null;
  new_value: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface PlatformSettingsRecord {
  id: number;
  platform_name: string;
  platform_description: string;
  support_email: string;
  support_phone: string;
  default_expiry_hours: number;
  enable_notifications: boolean;
  maintenance_mode: boolean;
  allow_new_registrations: boolean;
  updated_by_id: number | null;
  updated_at: string;
}

function normalizeRole(raw?: string, allowAdmin = true): UserRole {
  const val = String(raw || "").trim().toLowerCase();
  if (allowAdmin && (val === "admin" || val === "administrator")) return "Admin";
  if (val === "ngo" || val === "recipient" || val === "receiver") return "NGO";
  if (val === "volunteer" || val === "driver" || val === "courier") return "Volunteer";
  return "Donor";
}

function parseNumericQuantity(raw?: string): number {
  if (!raw) return 1;
  const m = String(raw).match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) || 1 : 1;
}

const nowIso = new Date().toISOString();

const users: UserRecord[] = [
  {
    id: 1,
    full_name: "Test Donor 1",
    email: "donor1@shareplate.org",
    password: "password123",
    role: "Donor",
    status: "active",
    phone: "+91 98200 11200",
    organization: "Green Harvest Kitchen",
    address: "14 Bandra West Culinary District, Mumbai",
    is_available: true,
    verification_status: "approved",
    created_at: nowIso,
  },
  {
    id: 2,
    full_name: "Hope Kitchen NGO",
    email: "ngo1@shareplate.org",
    password: "password123",
    role: "NGO",
    status: "active",
    phone: "+91 98201 44510",
    organization: "Hope Community Shelter",
    address: "42 Marine Drive Community Hub, Mumbai",
    is_available: true,
    verification_status: "approved",
    license_number: "NGO-MH-2024-88912",
    license_document_url: "https://cert.annapurna.org/certificates/NGO-MH-2024-88912.pdf",
    verified_at: nowIso,
    verified_by_admin_id: 4,
    created_at: nowIso,
  },
  {
    id: 3,
    full_name: "Alex Volunteer",
    email: "volunteer1@shareplate.org",
    password: "password123",
    role: "Volunteer",
    status: "active",
    phone: "+91 98203 99001",
    organization: "City Rescue Corps",
    is_available: true,
    verification_status: "approved",
    created_at: nowIso,
  },
  {
    id: 4,
    full_name: "Platform Admin",
    email: "admin@shareplate.org",
    password: "password123",
    role: "Admin",
    status: "active",
    organization: "ANNAPURNA Governance",
    is_available: true,
    verification_status: "approved",
    created_at: nowIso,
  },
  {
    id: 5,
    full_name: "Sunrise Community Relief",
    email: "ngo_pending@shareplate.org",
    password: "password123",
    role: "NGO",
    status: "active",
    phone: "+91 98112 77890",
    organization: "Sunrise Community Relief Trust",
    address: "18 Connaught Place Relief Wing, New Delhi",
    is_available: true,
    verification_status: "pending",
    license_number: "NGO-DL-2026-44102",
    license_document_url: "https://cert.annapurna.org/certificates/NGO-DL-2026-44102.pdf",
    created_at: nowIso,
  },
  {
    id: 6,
    full_name: "Bombay Spice Bistro",
    email: "donor2@shareplate.org",
    password: "password123",
    role: "Donor",
    status: "active",
    phone: "+91 98204 55321",
    organization: "Bombay Spice Hospitality",
    address: "88 Lower Parel Trade Center, Mumbai",
    is_available: true,
    verification_status: "approved",
    created_at: nowIso,
  },
  {
    id: 7,
    full_name: "Artisan Hearth Bakery",
    email: "donor3@shareplate.org",
    password: "password123",
    role: "Donor",
    status: "active",
    phone: "+91 98205 66789",
    organization: "Artisan Hearth Foods",
    address: "7 Kala Ghoda Heritage Lane, Mumbai",
    is_available: true,
    verification_status: "approved",
    created_at: nowIso,
  },
];

let listings: ListingRecord[] = [
  {
    id: 1,
    title: "Fresh Vegetable Biryani & Dal Tadka Trays",
    description: "Hygienically packed hot dinner trays prepared for corporate banquet surplus.",
    category: "cooked_meals",
    quantity: "65 meals",
    pickup_location: "Green Harvest Kitchen · Bandra West",
    expiry_time: "Tonight 10:30 PM",
    status: "available",
    is_flagged: false,
    donor_id: 1,
    donor_name: "Test Donor 1",
    pickup_status: "pending",
    delivery_status: "pending",
    created_at: nowIso,
  },
  {
    id: 2,
    title: "Whole Wheat Rotis & Paneer Butter Masala",
    description: "Sealed insulated containers ready for immediate NGO pickup.",
    category: "cooked_meals",
    quantity: "45 meals",
    pickup_location: "Bombay Spice Bistro · Lower Parel",
    expiry_time: "Tonight 11:00 PM",
    status: "available",
    is_flagged: false,
    donor_id: 6,
    donor_name: "Bombay Spice Bistro",
    pickup_status: "pending",
    delivery_status: "pending",
    created_at: nowIso,
  },
  {
    id: 3,
    title: "Assorted Multigrain Loaves & Savoury Rolls",
    description: "Day-fresh artisan sourdough and multigrain loaves individually wrapped.",
    category: "bakery",
    quantity: "35 meals",
    pickup_location: "Artisan Hearth Bakery · Kala Ghoda",
    expiry_time: "Tomorrow 9:00 AM",
    status: "available",
    is_flagged: false,
    donor_id: 7,
    donor_name: "Artisan Hearth Bakery",
    pickup_status: "pending",
    delivery_status: "pending",
    created_at: nowIso,
  },
  {
    id: 4,
    title: "Steamed Basmati Rice & Rajma Masala Batch",
    description: "Completed community lunch batch distributed to shelter residents.",
    category: "cooked_meals",
    quantity: "80 meals",
    pickup_location: "Green Harvest Kitchen · Bandra West",
    expiry_time: "Delivered",
    status: "delivered",
    is_flagged: false,
    donor_id: 1,
    donor_name: "Test Donor 1",
    claimed_by_ngo_id: 2,
    claimed_by_ngo_name: "Hope Kitchen NGO",
    claimed_at: nowIso,
    pickup_status: "claimed",
    delivery_status: "delivered",
    verified_by_volunteer_id: 3,
    created_at: nowIso,
  },
  {
    id: 5,
    title: "Protein Lentil Soup & Harvest Grain Bowls",
    description: "Nutritious evening meal batch delivered on schedule.",
    category: "cooked_meals",
    quantity: "55 meals",
    pickup_location: "Green Harvest Kitchen · Bandra West",
    expiry_time: "Delivered",
    status: "delivered",
    is_flagged: false,
    donor_id: 1,
    donor_name: "Test Donor 1",
    claimed_by_ngo_id: 2,
    claimed_by_ngo_name: "Hope Kitchen NGO",
    claimed_at: nowIso,
    pickup_status: "claimed",
    delivery_status: "delivered",
    verified_by_volunteer_id: 3,
    created_at: nowIso,
  },
  {
    id: 6,
    title: "Royal Veg Pulao & Mixed Raita Containers",
    description: "Event catering surplus delivered to Hope Community Shelter.",
    category: "cooked_meals",
    quantity: "60 meals",
    pickup_location: "Bombay Spice Bistro · Lower Parel",
    expiry_time: "Delivered",
    status: "delivered",
    is_flagged: false,
    donor_id: 6,
    donor_name: "Bombay Spice Bistro",
    claimed_by_ngo_id: 2,
    claimed_by_ngo_name: "Hope Kitchen NGO",
    claimed_at: nowIso,
    pickup_status: "claimed",
    delivery_status: "delivered",
    verified_by_volunteer_id: 3,
    created_at: nowIso,
  },
  {
    id: 7,
    title: "Morning Brioche & Wholegrain Sandwich Pack",
    description: "Fresh breakfast loaves distributed to morning relief camp.",
    category: "bakery",
    quantity: "40 meals",
    pickup_location: "Artisan Hearth Bakery · Kala Ghoda",
    expiry_time: "Delivered",
    status: "delivered",
    is_flagged: false,
    donor_id: 7,
    donor_name: "Artisan Hearth Bakery",
    claimed_by_ngo_id: 2,
    claimed_by_ngo_name: "Hope Kitchen NGO",
    claimed_at: nowIso,
    pickup_status: "claimed",
    delivery_status: "delivered",
    verified_by_volunteer_id: 3,
    created_at: nowIso,
  },
];

let donationRequests: RequestRecord[] = [
  {
    id: 1,
    listing_id: 4,
    listing_title: "Steamed Basmati Rice & Rajma Masala Batch",
    requester_id: 2,
    requester_name: "Hope Kitchen NGO",
    ngo_id: 2,
    ngo_name: "Hope Kitchen NGO",
    quantity: "80 meals",
    requested_quantity: "80 meals",
    urgency_level: "high",
    request_type: "listing_claim",
    notes: "Delivered to night shelter wing.",
    status: "completed",
    is_disputed: false,
    created_at: nowIso,
  },
  {
    id: 2,
    listing_id: 5,
    listing_title: "Protein Lentil Soup & Harvest Grain Bowls",
    requester_id: 2,
    requester_name: "Hope Kitchen NGO",
    ngo_id: 2,
    ngo_name: "Hope Kitchen NGO",
    quantity: "55 meals",
    requested_quantity: "55 meals",
    urgency_level: "normal",
    request_type: "listing_claim",
    notes: "Evening distribution completed.",
    status: "completed",
    is_disputed: false,
    created_at: nowIso,
  },
  {
    id: 3,
    listing_id: 6,
    listing_title: "Royal Veg Pulao & Mixed Raita Containers",
    requester_id: 2,
    requester_name: "Hope Kitchen NGO",
    ngo_id: 2,
    ngo_name: "Hope Kitchen NGO",
    quantity: "60 meals",
    requested_quantity: "60 meals",
    urgency_level: "normal",
    request_type: "listing_claim",
    notes: "Community kitchen distribution.",
    status: "completed",
    is_disputed: false,
    created_at: nowIso,
  },
  {
    id: 4,
    listing_id: 7,
    listing_title: "Morning Brioche & Wholegrain Sandwich Pack",
    requester_id: 2,
    requester_name: "Hope Kitchen NGO",
    ngo_id: 2,
    ngo_name: "Hope Kitchen NGO",
    quantity: "40 meals",
    requested_quantity: "40 meals",
    urgency_level: "normal",
    request_type: "listing_claim",
    notes: "Morning school nutrition drive.",
    status: "completed",
    is_disputed: false,
    created_at: nowIso,
  },
];

let handovers: HandoverRecord[] = [
  {
    id: 1,
    request_id: 1,
    listing_id: 4,
    listing_title: "Steamed Basmati Rice & Rajma Masala Batch",
    pickup_location: "Green Harvest Kitchen · Bandra West",
    dropoff_location: "Hope Kitchen NGO Distribution Hub",
    volunteer_id: 3,
    volunteer_name: "Alex Volunteer",
    status: "delivered",
    pickup_status: "claimed",
    delivery_status: "delivered",
    verified_by_volunteer_id: 3,
    verified_at: nowIso,
    distribution_proof: "Signed off by Shelter Coordinator R. Nair (80 beneficiaries served)",
    created_at: nowIso,
  },
  {
    id: 2,
    request_id: 2,
    listing_id: 5,
    listing_title: "Protein Lentil Soup & Harvest Grain Bowls",
    pickup_location: "Green Harvest Kitchen · Bandra West",
    dropoff_location: "Hope Kitchen NGO Distribution Hub",
    volunteer_id: 3,
    volunteer_name: "Alex Volunteer",
    status: "delivered",
    pickup_status: "claimed",
    delivery_status: "delivered",
    verified_by_volunteer_id: 3,
    verified_at: nowIso,
    distribution_proof: "Verified handover at Marine Drive Shelter Gate 2",
    created_at: nowIso,
  },
  {
    id: 3,
    request_id: 3,
    listing_id: 6,
    listing_title: "Royal Veg Pulao & Mixed Raita Containers",
    pickup_location: "Bombay Spice Bistro · Lower Parel",
    dropoff_location: "Hope Kitchen NGO Distribution Hub",
    volunteer_id: 3,
    volunteer_name: "Alex Volunteer",
    status: "delivered",
    pickup_status: "claimed",
    delivery_status: "delivered",
    verified_by_volunteer_id: 3,
    verified_at: nowIso,
    distribution_proof: "Batch received hot and intact",
    created_at: nowIso,
  },
  {
    id: 4,
    request_id: 4,
    listing_id: 7,
    listing_title: "Morning Brioche & Wholegrain Sandwich Pack",
    pickup_location: "Artisan Hearth Bakery · Kala Ghoda",
    dropoff_location: "Hope Kitchen NGO Distribution Hub",
    volunteer_id: 3,
    volunteer_name: "Alex Volunteer",
    status: "delivered",
    pickup_status: "claimed",
    delivery_status: "delivered",
    verified_by_volunteer_id: 3,
    verified_at: nowIso,
    distribution_proof: "Received by morning volunteer team",
    created_at: nowIso,
  },
];

let reviews: ReviewRecord[] = [
  {
    id: 1,
    donation_id: 4,
    restaurant_id: 1,
    ngo_id: 2,
    ngo_name: "Hope Kitchen NGO",
    rating: 5,
    comment:
      "Exceptionally fresh food, sealed in food-grade steel containers with clear allergen labels. Our shelter residents loved the meal!",
    tags: ["Well Packaged", "Punctual Handover", "Fresh Quality"],
    created_at: nowIso,
  },
  {
    id: 2,
    donation_id: 6,
    restaurant_id: 6,
    ngo_id: 2,
    ngo_name: "Hope Kitchen NGO",
    rating: 5,
    comment:
      "Bombay Spice staff had the trays warm and ready right at the pickup counter. Zero wait time for our volunteer driver.",
    tags: ["Punctual Handover", "Fresh Quality"],
    created_at: nowIso,
  },
];

let notifications: NotificationRecord[] = [];
let auditLogs: AuditLogRecord[] = [];

let platformSettings: PlatformSettingsRecord = {
  id: 1,
  platform_name: "ANNAPURNA",
  platform_description:
    "Food rescue and redistribution platform connecting food donors, NGOs/recipients, and volunteers.",
  support_email: "support@annapurna.org",
  support_phone: "+1 (555) 234-5678",
  default_expiry_hours: 24,
  enable_notifications: true,
  maintenance_mode: false,
  allow_new_registrations: true,
  updated_by_id: null,
  updated_at: nowIso,
};

let nextUserId = 8;
let nextListingId = 8;
let nextRequestId = 5;
let nextHandoverId = 5;
let nextReviewId = 3;
let nextNotificationId = 1;
let nextAuditId = 1;

// Real-Time Server-Sent Events (SSE) clients for instant claim broadcasts
const sseClients = new Set<Response>();

function broadcastSseEvent(eventName: string, payload: Record<string, unknown>) {
  const frame = `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of Array.from(sseClients)) {
    try {
      client.write(frame);
    } catch {
      sseClients.delete(client);
    }
  }
}

function sanitizeUser(u: UserRecord) {
  return {
    id: u.id,
    full_name: u.full_name,
    email: u.email,
    role: u.role,
    status: u.status || "active",
    phone: u.phone || null,
    organization: u.organization || null,
    address: u.address || null,
    is_available: Boolean(u.is_available),
    verification_status: u.verification_status || (u.role === "NGO" ? "pending" : "approved"),
    license_number: u.license_number || null,
    license_document_url: u.license_document_url || null,
    verified_at: u.verified_at || null,
    verified_by_admin_id: u.verified_by_admin_id || null,
    rejection_reason: u.rejection_reason || null,
    created_at: u.created_at,
  };
}

function ensureNgoVerified(user: UserRecord, res: Response): boolean {
  if (user.role === "NGO" && (user.verification_status || "pending") !== "approved") {
    const msg =
      user.verification_status === "rejected"
        ? `Your NGO license verification was rejected${
            user.rejection_reason ? ` (${user.rejection_reason})` : ""
          }. Please re-submit valid license documentation.`
        : "Your NGO license verification is currently pending review by administrators.";
    res.status(403).json({
      success: false,
      message: msg,
      detail: msg,
    });
    return false;
  }
  return true;
}

function getAuthenticatedUser(req: Request): UserRecord | null {
  const authHeader = req.headers.authorization || "";
  const match = authHeader.match(/shareplate-jwt-(\d+)/);
  if (!match) return null;
  const userId = Number(match[1]);
  return users.find((u) => u.id === userId) || null;
}

function requireAdminUser(req: Request, res: Response): UserRecord | null {
  const user = getAuthenticatedUser(req);
  if (!user) {
    res.status(401).json({ detail: "Not authenticated." });
    return null;
  }
  if ((user.status || "active") !== "active") {
    res.status(403).json({ detail: `Account is ${user.status}.` });
    return null;
  }
  if (user.role !== "Admin") {
    res.status(403).json({
      detail: "Access restricted: Only Admin accounts can perform this action.",
    });
    return null;
  }
  return user;
}

function countActiveAdmins(): number {
  return users.filter((u) => u.role === "Admin" && u.status === "active").length;
}

function recordAudit(
  admin: UserRecord,
  action: string,
  entity_type: string,
  entity_id: string | number,
  previous_value: unknown,
  new_value: unknown,
  req?: Request
) {
  auditLogs.unshift({
    id: nextAuditId++,
    admin_id: admin.id,
    admin_email: admin.email,
    action,
    entity_type,
    entity_id: String(entity_id),
    previous_value:
      previous_value !== undefined && previous_value !== null
        ? JSON.stringify(previous_value)
        : null,
    new_value:
      new_value !== undefined && new_value !== null
        ? JSON.stringify(new_value)
        : null,
    ip_address: req?.ip || "127.0.0.1",
    user_agent: (req?.headers["user-agent"] || "").slice(0, 250) || null,
    created_at: new Date().toISOString(),
  });
}

const ACTIVE_DONATION_STATUSES = [
  "available",
  "requested",
  "claimed",
  "in_transit",
  "picked_up",
];
const PAST_DONATION_STATUSES = [
  "delivered",
  "completed",
  "cancelled",
  "removed",
  "expired",
  "pickup_failed",
  "delivery_failed",
];

function deriveLifecycleStatus(
  listing: ListingRecord,
  reqItem?: RequestRecord,
  handover?: HandoverRecord
): string {
  if (listing.status === "removed" || listing.status === "cancelled") return "cancelled";
  if (listing.status === "expired") return "expired";
  if (reqItem && (reqItem.status === "rejected" || reqItem.status === "cancelled")) {
    return reqItem.status;
  }
  if (listing.status === "pickup_failed" || handover?.status === "pickup_failed")
    return "pickup_failed";
  if (listing.status === "delivery_failed" || handover?.status === "delivery_failed")
    return "delivery_failed";
  if (handover) {
    if (
      handover.status === "delivered" ||
      listing.status === "completed" ||
      listing.status === "delivered"
    )
      return "completed";
    if (
      handover.status === "picked_up" ||
      handover.status === "in_transit" ||
      listing.status === "in_transit"
    )
      return "in_progress";
    if (handover.status === "assigned") return "assigned";
  }
  if (reqItem) {
    if (reqItem.status === "completed" || reqItem.status === "delivered") return "completed";
    if (reqItem.status === "accepted" || reqItem.status === "fulfilled") return "accepted";
    if (reqItem.status === "pending") return "pending";
  }
  return listing.status || "available";
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true, limit: "15mb" }));

  // Real-time Server-Sent Events (SSE) endpoint for instant double-claim prevention
  app.get("/api/events/stream", (req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();
    res.write(`event: connected\ndata: ${JSON.stringify({ status: "connected" })}\n\n`);
    sseClients.add(res);
    req.on("close", () => {
      sseClients.delete(res);
    });
  });

  // Health check
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      app_name: process.env.APP_NAME || "ANNAPURNA API",
      environment: process.env.APP_ENV || "development",
    });
  });

  // One-time Admin Bootstrap Status
  app.get("/api/auth/bootstrap-status", (_req: Request, res: Response) => {
    const hasAdmin = users.some((u) => u.role === "Admin");
    res.json({ has_admin: hasAdmin });
  });

  // Controlled One-Time First Administrator Setup
  app.post("/api/auth/bootstrap-admin", (req: Request, res: Response) => {
    const hasAdmin = users.some((u) => u.role === "Admin");
    if (hasAdmin) {
      res.status(403).json({
        detail:
          "An administrator already exists. Use an existing Admin account or the promote_admin CLI.",
      });
      return;
    }

    const { full_name, email, password, phone, organization } = req.body;
    if (!email || !password || String(password).length < 8) {
      res.status(400).json({
        detail: "Email and a password of at least 8 characters are required to initialize Admin.",
      });
      return;
    }

    const cleanEmail = String(email).trim().toLowerCase();
    let targetUser = users.find((u) => u.email.toLowerCase() === cleanEmail);
    let actionLabel = "INITIAL_ADMIN_CREATED";
    let prevRole: string | null = null;

    if (targetUser) {
      prevRole = targetUser.role;
      targetUser.role = "Admin";
      targetUser.status = "active";
      targetUser.verification_status = "approved";
      targetUser.password = String(password);
      if (full_name) targetUser.full_name = String(full_name).trim();
      actionLabel = "INITIAL_ADMIN_PROMOTED";
    } else {
      targetUser = {
        id: nextUserId++,
        full_name: full_name ? String(full_name).trim() : String(email).split("@")[0],
        email: String(email).trim(),
        password: String(password),
        role: "Admin",
        status: "active",
        phone: phone ? String(phone) : undefined,
        organization: organization ? String(organization) : "Platform Administration",
        is_available: true,
        verification_status: "approved",
        created_at: new Date().toISOString(),
      };
      users.push(targetUser);
    }

    recordAudit(
      targetUser,
      actionLabel,
      "users",
      targetUser.id,
      prevRole ? { role: prevRole } : null,
      { role: "Admin", status: "active" },
      req
    );

    const token = `shareplate-jwt-${targetUser.id}`;
    res.status(201).json({
      ...sanitizeUser(targetUser),
      access_token: token,
      token_type: "bearer",
    });
  });

  // Auth: Register (Public admin registration strictly blocked; NGO defaults to verification_status = "pending")
  app.post("/api/auth/register", (req: Request, res: Response) => {
    if (!platformSettings.allow_new_registrations) {
      res.status(403).json({
        detail: "New account registrations are temporarily disabled by platform settings.",
      });
      return;
    }
    const {
      full_name,
      email,
      password,
      role,
      phone,
      organization,
      address,
      license_number,
      license_document_url,
    } = req.body;
    const rawRole = String(role || "Donor").trim().toLowerCase();
    if (rawRole === "admin" || rawRole === "administrator") {
      res.status(403).json({ detail: "Public admin registration is not permitted." });
      return;
    }
    if (!email || !password) {
      res.status(400).json({ detail: "Email and password are required." });
      return;
    }
    const existing = users.find(
      (u) => u.email.toLowerCase() === String(email).trim().toLowerCase()
    );
    if (existing) {
      res.status(400).json({ detail: "Email already registered. Please sign in instead." });
      return;
    }
    const normalizedRole = normalizeRole(role, false);
    const isNgo = normalizedRole === "NGO";
    if (isNgo && (!license_number || !String(license_number).trim())) {
      res.status(400).json({
        detail: "Official NGO Registration / License Number is required for NGO onboarding.",
      });
      return;
    }

    const newUser: UserRecord = {
      id: nextUserId++,
      full_name: full_name ? String(full_name).trim() : String(email).split("@")[0],
      email: String(email).trim(),
      password: String(password),
      role: normalizedRole,
      status: "active",
      phone: phone ? String(phone).trim() : undefined,
      organization: organization ? String(organization).trim() : undefined,
      address: address ? String(address).trim() : undefined,
      is_available: true,
      verification_status: isNgo ? "pending" : "approved",
      license_number: isNgo && license_number ? String(license_number).trim() : null,
      license_document_url:
        isNgo && license_document_url
          ? String(license_document_url).trim()
          : isNgo
          ? `https://cert.annapurna.org/certificates/${encodeURIComponent(
              String(license_number || "ngo-cert").trim()
            )}.pdf`
          : null,
      created_at: new Date().toISOString(),
    };
    users.push(newUser);
    const token = `shareplate-jwt-${newUser.id}`;
    res.status(201).json({
      ...sanitizeUser(newUser),
      access_token: token,
      token_type: "bearer",
    });
  });

  // NGO License Re-submission / Update
  app.patch("/api/auth/ngo-license", (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ detail: "Not authenticated." });
      return;
    }
    if (user.role !== "NGO") {
      res.status(403).json({ detail: "Only NGO accounts can submit license verification documents." });
      return;
    }
    const { license_number, license_document_url, phone, address, organization } = req.body;
    if (!license_number || !String(license_number).trim()) {
      res.status(400).json({ detail: "License number is required." });
      return;
    }
    user.license_number = String(license_number).trim();
    if (license_document_url) user.license_document_url = String(license_document_url).trim();
    if (phone !== undefined) user.phone = String(phone).trim();
    if (address !== undefined) user.address = String(address).trim();
    if (organization !== undefined) user.organization = String(organization).trim();
    user.verification_status = "pending";
    user.rejection_reason = null;
    res.json(sanitizeUser(user));
  });

  // Auth: Login
  app.post("/api/auth/login", (req: Request, res: Response) => {
    const username = String(req.body.username || req.body.email || "").trim();
    const password = String(req.body.password || "");
    if (!username || !password) {
      res.status(400).json({ detail: "Email and password are required." });
      return;
    }
    const user = users.find(
      (u) =>
        u.email.toLowerCase() === username.toLowerCase() ||
        u.full_name.toLowerCase() === username.toLowerCase()
    );
    if (!user || (user.password && user.password !== password)) {
      res.status(401).json({
        detail:
          "Invalid email or password. Please check your credentials or register a new account.",
      });
      return;
    }
    if ((user.status || "active") !== "active") {
      res.status(403).json({
        detail: `Your account is currently ${user.status}. Please contact an administrator.`,
      });
      return;
    }
    const token = `shareplate-jwt-${user.id}`;
    res.json({
      access_token: token,
      token_type: "bearer",
      user: sanitizeUser(user),
    });
  });

  // Auth: Current user
  app.get("/api/auth/me", (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ detail: "Not authenticated." });
      return;
    }
    if ((user.status || "active") !== "active") {
      res.status(403).json({ detail: `Account is ${user.status}.` });
      return;
    }
    res.json(sanitizeUser(user));
  });

  // Restaurant / Donor RBAC Donations Endpoint
  app.get("/api/donations/my-donations", (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    if (!user || (user.role !== "Donor" && user.role !== "Admin")) {
      res.status(403).json({
        detail: "Access restricted: Only Restaurant/Donor accounts can access my-donations.",
      });
      return;
    }
    const mode = String(req.query.status || "active").trim().toLowerCase();
    let mine = listings.filter((l) => l.donor_id === user.id && l.status !== "removed");
    if (mode === "active") {
      mine = mine.filter((l) => ACTIVE_DONATION_STATUSES.includes(l.status));
    } else if (mode === "past") {
      mine = mine.filter((l) => PAST_DONATION_STATUSES.includes(l.status));
    }
    res.json(mine);
  });

  // Admin Global Donations Endpoint
  app.get("/api/donations/admin/all", (req: Request, res: Response) => {
    if (!requireAdminUser(req, res)) return;
    const mode = String(req.query.status || "all").trim().toLowerCase();
    const donorId = req.query.donor_id ? Number(req.query.donor_id) : null;
    const ngoId = req.query.ngo_id ? Number(req.query.ngo_id) : null;
    const statusDetail = String(req.query.status_detail || "").trim().toLowerCase();
    const dateFrom = String(req.query.date_from || "").trim();
    const dateTo = String(req.query.date_to || "").trim();

    const items = listings
      .filter((l) => {
        const reqItem = donationRequests.find((r) => r.listing_id === l.id);
        const isPast = PAST_DONATION_STATUSES.includes(l.status);
        if (mode === "active" && isPast) return false;
        if (mode === "past" && !isPast) return false;
        if (donorId !== null && l.donor_id !== donorId) return false;
        if (ngoId !== null && (!reqItem || reqItem.requester_id !== ngoId)) return false;
        if (statusDetail && statusDetail !== "all" && l.status.toLowerCase() !== statusDetail)
          return false;
        if (dateFrom && l.created_at.slice(0, 10) < dateFrom) return false;
        if (dateTo && l.created_at.slice(0, 10) > dateTo) return false;
        return true;
      })
      .map((l) => {
        const reqItem = donationRequests.find((r) => r.listing_id === l.id);
        const handover = handovers.find((h) => h.listing_id === l.id);
        return {
          ...l,
          pickup_status: handover?.pickup_status || l.pickup_status || "pending",
          pickup_failure_reason:
            handover?.pickup_failure_reason || l.pickup_failure_reason || null,
          delivery_status: handover?.delivery_status || l.delivery_status || "pending",
          delivery_failure_reason:
            handover?.delivery_failure_reason || l.delivery_failure_reason || null,
          verified_by_volunteer_id:
            handover?.verified_by_volunteer_id || l.verified_by_volunteer_id || null,
          volunteer_name: handover?.volunteer_name || null,
          distribution_proof: handover?.distribution_proof || null,
          ngo_id: reqItem?.requester_id || null,
          ngo_name: reqItem?.requester_name || null,
          claim_status: reqItem?.status || null,
        };
      });

    res.json({ items, total: items.length });
  });

  // Restaurant / Donor Cancel Donation with Mandatory Reason
  app.patch("/api/donations/:listing_id/cancel", (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    if (!user || (user.role !== "Donor" && user.role !== "Admin")) {
      res.status(403).json({
        detail: "Access restricted: Only Restaurant/Donor accounts can cancel donations.",
      });
      return;
    }
    const reason = String(req.body.cancellation_reason || "").trim();
    if (!reason) {
      res.status(400).json({
        detail: "Cancellation reason is mandatory and cannot be blank.",
      });
      return;
    }
    const item = listings.find((l) => String(l.id) === String(req.params.listing_id));
    if (!item) {
      res.status(404).json({ detail: "Donation listing not found." });
      return;
    }
    if (user.role !== "Admin" && item.donor_id !== user.id) {
      res.status(403).json({ detail: "You can only cancel your own food donations." });
      return;
    }
    item.status = "cancelled";
    item.cancellation_reason = reason;
    item.cancelled_at = new Date().toISOString();

    donationRequests.forEach((r) => {
      if (r.listing_id === item.id && (r.status === "pending" || r.status === "accepted")) {
        r.status = "cancelled";
        r.moderation_note = `Cancelled by restaurant: ${reason}`;
      }
    });

    res.json(item);
  });

  // Listings: List all (strictly filtered by donor_id if logged in as Donor)
  app.get("/api/listings", (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    let visible = listings.filter((l) => l.status !== "removed");
    if (user && user.role === "Donor") {
      visible = visible.filter((l) => l.donor_id === user.id);
    }
    res.json(visible);
  });

  app.get("/api/listings/:listing_id", (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const item = listings.find((l) => String(l.id) === String(req.params.listing_id));
    if (!item) {
      res.status(404).json({ detail: "Listing not found." });
      return;
    }
    if (user && user.role === "Donor" && item.donor_id !== user.id) {
      res.status(403).json({ detail: "Access denied to another restaurant's donation." });
      return;
    }
    res.json(item);
  });

  app.post("/api/listings", (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    if (!user || (user.role !== "Donor" && user.role !== "Admin")) {
      res.status(403).json({
        detail: "Access restricted: Only Donor accounts can create surplus food listings.",
      });
      return;
    }
    const { title, description, category, quantity, pickup_location, expiry_time } = req.body;
    if (!title) {
      res.status(400).json({ detail: "Listing title is required." });
      return;
    }
    const newListing: ListingRecord = {
      id: nextListingId++,
      title: String(title),
      description: description ? String(description) : "",
      category: category ? String(category) : "cooked_meals",
      quantity: quantity !== undefined ? String(quantity) : "1",
      pickup_location: pickup_location ? String(pickup_location) : "Community Hub",
      expiry_time: expiry_time ? String(expiry_time) : undefined,
      status: "available",
      is_flagged: false,
      donor_id: user.id,
      donor_name: user.full_name,
      pickup_status: "pending",
      delivery_status: "pending",
      created_at: new Date().toISOString(),
    };
    listings.unshift(newListing);
    res.status(201).json(newListing);
  });

  app.patch("/api/listings/:listing_id", (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    if (!user || (user.role !== "Donor" && user.role !== "Admin")) {
      res.status(403).json({
        detail: "Access restricted: Only Donor accounts can update food listings.",
      });
      return;
    }
    const item = listings.find((l) => String(l.id) === String(req.params.listing_id));
    if (!item) {
      res.status(404).json({ detail: "Listing not found." });
      return;
    }
    if (user.role !== "Admin" && item.donor_id !== user.id) {
      res.status(403).json({ detail: "You can only update your own donations." });
      return;
    }
    Object.assign(item, req.body);
    res.json(item);
  });

  app.delete("/api/listings/:listing_id", (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    if (!user || (user.role !== "Donor" && user.role !== "Admin")) {
      res.status(403).json({
        detail: "Access restricted: Only Donor accounts can delete food listings.",
      });
      return;
    }
    const item = listings.find((l) => String(l.id) === String(req.params.listing_id));
    if (!item) {
      res.status(404).json({ detail: "Listing not found." });
      return;
    }
    if (user.role !== "Admin" && item.donor_id !== user.id) {
      res.status(403).json({ detail: "You can only cancel your own donations." });
      return;
    }
    item.status = "cancelled";
    item.cancellation_reason = item.cancellation_reason || "Removed by restaurant";
    item.cancelled_at = new Date().toISOString();
    res.status(204).send();
  });

  // NGO Claims Endpoint (Active vs Past Claims, with Review state)
  app.get("/api/claims/my-claims", (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    if (!user || (user.role !== "NGO" && user.role !== "Admin")) {
      res.status(403).json({
        detail: "Access restricted: Only NGO accounts can view their claims.",
      });
      return;
    }
    const mode = String(req.query.status || "active").trim().toLowerCase();
    const myClaims = donationRequests.filter(
      (r) => r.requester_id === user.id && r.request_type === "listing_claim"
    );

    const results = myClaims
      .map((c) => {
        const listing = listings.find((l) => l.id === c.listing_id);
        const handover = handovers.find((h) => h.request_id === c.id);
        const existingReview = reviews.find((rv) => rv.donation_id === c.listing_id);

        let effStatus: string = c.status;
        if (c.status === "rejected" || c.status === "cancelled") {
          effStatus = c.status;
        } else if (listing && listing.status === "cancelled") {
          effStatus = "cancelled";
        } else if (listing && (listing.status === "delivered" || listing.status === "completed")) {
          effStatus = "delivered";
        } else if (handover) {
          if (handover.status === "delivered" || handover.delivery_status === "delivered") {
            effStatus = "delivered";
          } else if (
            handover.status === "delivery_failed" ||
            handover.status === "pickup_failed" ||
            handover.delivery_status === "delivery_failed" ||
            handover.pickup_status === "pickup_failed"
          ) {
            effStatus = "failed_delivery";
          } else if (
            handover.status === "picked_up" ||
            handover.delivery_status === "in_transit"
          ) {
            effStatus = "in_transit";
          } else if (handover.status === "assigned") {
            effStatus = "assigned";
          }
        }

        return {
          id: c.id,
          listing_id: c.listing_id,
          listing_title: c.listing_title,
          donor_id: listing?.donor_id || null,
          donor_name: listing?.donor_name || "Restaurant Partner",
          pickup_location: listing?.pickup_location || "",
          quantity: c.requested_quantity || listing?.quantity || "",
          status: effStatus,
          raw_request_status: c.status,
          notes: c.notes,
          cancellation_reason: listing?.cancellation_reason || null,
          pickup_status: handover?.pickup_status || listing?.pickup_status || "pending",
          pickup_failure_reason:
            handover?.pickup_failure_reason || listing?.pickup_failure_reason || null,
          delivery_status: handover?.delivery_status || listing?.delivery_status || "pending",
          delivery_failure_reason:
            handover?.delivery_failure_reason || listing?.delivery_failure_reason || null,
          volunteer_name: handover?.volunteer_name || null,
          distribution_proof: handover?.distribution_proof || null,
          has_reviewed: Boolean(existingReview),
          review_rating: existingReview?.rating || null,
          review_comment: existingReview?.comment || null,
          review_tags: existingReview?.tags || [],
          created_at: c.created_at,
        };
      })
      .filter((item) => {
        const isPast = [
          "delivered",
          "completed",
          "failed_delivery",
          "cancelled",
          "rejected",
        ].includes(item.status);
        if (mode === "active") return !isPast;
        if (mode === "past") return isPast;
        return true;
      });

    res.json(results);
  });

  // Concurrency-Safe Atomic Claim Endpoint: PATCH /api/donations/:listing_id/claim
  const atomicClaimHandler = (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    if (!user || (user.role !== "NGO" && user.role !== "Admin")) {
      res.status(403).json({
        detail: "Access restricted: Only NGO accounts can claim food donations.",
      });
      return;
    }
    if (!ensureNgoVerified(user, res)) return;

    const listingId = Number(req.params.listing_id);
    const listing = listings.find((l) => l.id === listingId);
    if (!listing) {
      res.status(404).json({ detail: "Donation listing not found." });
      return;
    }

    // Atomic conditional check: strictly require status === "available"
    if (listing.status !== "available") {
      res.status(409).json({
        success: false,
        message: "This donation has already been claimed by another organization.",
        detail: "This donation has already been claimed by another organization.",
      });
      return;
    }

    // Perform atomic state transition in the same synchronous tick
    const claimedAt = new Date().toISOString();
    listing.status = "claimed";
    listing.claimed_by_ngo_id = user.id;
    listing.claimed_by_ngo_name = user.full_name;
    listing.claimed_at = claimedAt;

    const notes = req.body?.notes ? String(req.body.notes).trim() : "Atomic instant claim by verified NGO";
    const newReq: RequestRecord = {
      id: nextRequestId++,
      listing_id: listing.id,
      listing_title: listing.title,
      requester_id: user.id,
      requester_name: user.full_name,
      ngo_id: user.id,
      ngo_name: user.full_name,
      quantity: listing.quantity,
      requested_quantity: listing.quantity,
      urgency_level: "normal",
      request_type: "listing_claim",
      notes,
      status: "accepted",
      is_disputed: false,
      created_at: claimedAt,
    };
    donationRequests.unshift(newReq);

    const handover: HandoverRecord = {
      id: nextHandoverId++,
      request_id: newReq.id,
      listing_id: listing.id,
      listing_title: listing.title,
      pickup_location: listing.pickup_location,
      dropoff_location: `${user.full_name} Distribution Hub`,
      volunteer_id: null,
      status: "available",
      pickup_status: "pending",
      delivery_status: "pending",
      created_at: claimedAt,
    };
    handovers.unshift(handover);

    notifications.unshift({
      id: nextNotificationId++,
      user_id: listing.donor_id,
      message: `${user.full_name} claimed "${listing.title}"`,
      is_read: false,
      created_at: claimedAt,
    });

    broadcastSseEvent("donation:claimed", {
      donationId: listing.id,
      claimedByNgoId: user.id,
      claimedByNgoName: user.full_name,
      claimedAt,
    });

    res.json({
      success: true,
      message: "Donation claimed atomically.",
      donation: listing,
      request: newReq,
      handover,
    });
  };
  app.patch("/api/donations/:listing_id/claim", atomicClaimHandler);
  app.post("/api/donations/:listing_id/claim", atomicClaimHandler);

  // Requests: List (supports ?type=open_broadcast|listing_claim|all)
  const listRequestsHandler = (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const reqType = String(req.query.type || "").trim();
    let list = [...donationRequests];
    if (reqType && reqType !== "all") {
      list = list.filter((r) => r.request_type === reqType);
    }
    if (user && user.role === "NGO" && reqType !== "open_broadcast") {
      res.json(list.filter((r) => r.requester_id === user.id));
      return;
    }
    if (user && user.role === "Donor") {
      const myListingIds = new Set(
        listings.filter((l) => l.donor_id === user.id).map((l) => l.id)
      );
      res.json(
        list.filter(
          (r) =>
            r.request_type === "open_broadcast" ||
            (r.listing_id && myListingIds.has(r.listing_id))
        )
      );
      return;
    }
    res.json(list);
  };
  app.get("/api/requests", listRequestsHandler);
  app.get("/api/requests/my", listRequestsHandler);

  app.post("/api/requests", (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    if (!user || (user.role !== "NGO" && user.role !== "Admin")) {
      res.status(403).json({
        detail: "Access restricted: Only NGO accounts can submit food requests.",
      });
      return;
    }
    if (!ensureNgoVerified(user, res)) return;

    const {
      listing_id,
      ngo_name,
      quantity,
      quantity_needed,
      requested_quantity,
      required_by,
      required_by_time,
      urgency_level,
      notes,
    } = req.body;

    // Case 1: Claiming a specific restaurant listing (Atomic conditional update)
    if (listing_id !== undefined && listing_id !== null && listing_id !== "") {
      const listing = listings.find((l) => String(l.id) === String(listing_id));
      if (!listing) {
        res.status(404).json({ detail: "Listing not found." });
        return;
      }
      if (listing.status !== "available") {
        res.status(409).json({
          success: false,
          message: "This donation has already been claimed by another organization.",
          detail: "This donation has already been claimed by another organization.",
        });
        return;
      }
      const claimedAt = new Date().toISOString();
      listing.status = "claimed";
      listing.claimed_by_ngo_id = user.id;
      listing.claimed_by_ngo_name = user.full_name;
      listing.claimed_at = claimedAt;

      const qty = String(
        requested_quantity || quantity || quantity_needed || listing.quantity
      );
      const newReq: RequestRecord = {
        id: nextRequestId++,
        listing_id: listing.id,
        listing_title: listing.title,
        requester_id: user.id,
        requester_name: user.full_name,
        ngo_id: user.id,
        ngo_name: ngo_name ? String(ngo_name) : user.full_name,
        quantity: qty,
        requested_quantity: qty,
        required_by: required_by || required_by_time || null,
        urgency_level: urgency_level || "normal",
        request_type: "listing_claim",
        notes: notes ? String(notes) : undefined,
        status: "accepted",
        is_disputed: false,
        created_at: claimedAt,
      };
      donationRequests.unshift(newReq);

      const handover: HandoverRecord = {
        id: nextHandoverId++,
        request_id: newReq.id,
        listing_id: listing.id,
        listing_title: listing.title,
        pickup_location: listing.pickup_location,
        dropoff_location: `${user.full_name} Distribution Hub`,
        volunteer_id: null,
        status: "available",
        pickup_status: "pending",
        delivery_status: "pending",
        created_at: claimedAt,
      };
      handovers.unshift(handover);

      notifications.unshift({
        id: nextNotificationId++,
        user_id: listing.donor_id,
        message: `${user.full_name} claimed "${newReq.listing_title}"`,
        is_read: false,
        created_at: claimedAt,
      });

      broadcastSseEvent("donation:claimed", {
        donationId: listing.id,
        claimedByNgoId: user.id,
        claimedByNgoName: user.full_name,
        claimedAt,
      });

      res.status(201).json(newReq);
      return;
    }

    // Case 2: Open NGO Food Donation Request (Broadcast)
    const qty = String(quantity_needed || quantity || requested_quantity || "").trim();
    const reqBy = String(required_by_time || required_by || "").trim();
    if (!qty || !reqBy) {
      res.status(400).json({
        detail: "Both quantity_needed and required_by_time are required for an NGO food request.",
      });
      return;
    }
    const ngoDisplayName = String(ngo_name || user.full_name).trim();
    const newReq: RequestRecord = {
      id: nextRequestId++,
      listing_id: null,
      listing_title: `NGO Food Request · ${qty} needed by ${ngoDisplayName}`,
      requester_id: user.id,
      requester_name: ngoDisplayName,
      ngo_id: user.id,
      ngo_name: ngoDisplayName,
      quantity: qty,
      requested_quantity: qty,
      required_by: reqBy,
      urgency_level: String(urgency_level || "normal").toLowerCase(),
      request_type: "open_broadcast",
      notes: notes ? String(notes) : undefined,
      status: "open",
      is_disputed: false,
      created_at: new Date().toISOString(),
    };
    donationRequests.unshift(newReq);

    users
      .filter((u) => u.role === "Donor")
      .forEach((donor) => {
        notifications.unshift({
          id: nextNotificationId++,
          user_id: donor.id,
          message: `New NGO Food Request from ${ngoDisplayName}: ${qty} needed by ${reqBy}`,
          is_read: false,
          created_at: new Date().toISOString(),
        });
      });

    res.status(201).json(newReq);
  });

  const fulfillOpenRequestHandler = (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    if (!user || (user.role !== "Donor" && user.role !== "Admin")) {
      res.status(403).json({
        detail: "Access restricted: Only Restaurant/Donor accounts can fulfill NGO requests.",
      });
      return;
    }
    const item = donationRequests.find((r) => String(r.id) === String(req.params.request_id));
    if (!item) {
      res.status(404).json({ detail: "Request not found." });
      return;
    }
    item.status = "fulfilled";
    const newListing: ListingRecord = {
      id: nextListingId++,
      title: `Fulfilled Request: ${item.quantity || "Meals"} for ${item.ngo_name || item.requester_name}`,
      description: item.notes || "Prepared in response to NGO Food Donation Request",
      category: "cooked_meals",
      quantity: item.quantity || "25 meals",
      pickup_location: user.organization || `${user.full_name} Kitchen`,
      expiry_time: item.required_by || undefined,
      status: "claimed",
      is_flagged: false,
      donor_id: user.id,
      donor_name: user.full_name,
      pickup_status: "pending",
      delivery_status: "pending",
      created_at: new Date().toISOString(),
    };
    listings.unshift(newListing);
    item.listing_id = newListing.id;
    item.listing_title = newListing.title;

    const handover: HandoverRecord = {
      id: nextHandoverId++,
      request_id: item.id,
      listing_id: newListing.id,
      listing_title: newListing.title,
      pickup_location: newListing.pickup_location,
      dropoff_location: `${item.ngo_name || item.requester_name} Distribution Hub`,
      volunteer_id: null,
      status: "available",
      pickup_status: "pending",
      delivery_status: "pending",
      created_at: new Date().toISOString(),
    };
    handovers.unshift(handover);
    res.json(item);
  };
  app.patch("/api/requests/:request_id/fulfill", fulfillOpenRequestHandler);
  app.post("/api/requests/:request_id/fulfill", fulfillOpenRequestHandler);

  const acceptRequestHandler = (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    if (!user || (user.role !== "Donor" && user.role !== "Admin")) {
      res.status(403).json({
        detail: "Access restricted: Only Donor accounts can accept or reject requests.",
      });
      return;
    }
    const item = donationRequests.find((r) => String(r.id) === String(req.params.request_id));
    if (!item) {
      res.status(404).json({ detail: "Request not found." });
      return;
    }
    if (item.request_type === "open_broadcast" && !item.listing_id) {
      fulfillOpenRequestHandler(req, res);
      return;
    }
    item.status = "accepted";
    const listing = listings.find((l) => String(l.id) === String(item.listing_id));
    if (listing) {
      listing.status = "claimed";
    }
    const handover: HandoverRecord = {
      id: nextHandoverId++,
      request_id: item.id,
      listing_id: item.listing_id || 0,
      listing_title: item.listing_title,
      pickup_location: listing?.pickup_location || "Donor Location",
      dropoff_location: `${item.requester_name} Distribution Hub`,
      volunteer_id: null,
      status: "available",
      pickup_status: "pending",
      delivery_status: "pending",
      created_at: new Date().toISOString(),
    };
    handovers.unshift(handover);
    res.json(item);
  };
  app.patch("/api/requests/:request_id/accept", acceptRequestHandler);
  app.post("/api/requests/:request_id/accept", acceptRequestHandler);

  const rejectRequestHandler = (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    if (!user || (user.role !== "Donor" && user.role !== "Admin")) {
      res.status(403).json({
        detail: "Access restricted: Only Donor accounts can accept or reject requests.",
      });
      return;
    }
    const item = donationRequests.find((r) => String(r.id) === String(req.params.request_id));
    if (!item) {
      res.status(404).json({ detail: "Request not found." });
      return;
    }
    item.status = "rejected";
    const listing = listings.find((l) => String(l.id) === String(item.listing_id));
    if (listing) {
      listing.status = "available";
      listing.claimed_by_ngo_id = null;
      listing.claimed_by_ngo_name = null;
      listing.claimed_at = null;
    }
    handovers = handovers.filter(
      (h) => String(h.request_id) !== String(item.id) || h.status === "delivered"
    );
    res.json(item);
  };
  app.patch("/api/requests/:request_id/reject", rejectRequestHandler);
  app.post("/api/requests/:request_id/reject", rejectRequestHandler);

  // Handovers & Bidirectional Volunteer Verification
  app.get("/api/handovers/available", (_req: Request, res: Response) => {
    res.json(handovers.filter((h) => h.status === "available"));
  });

  app.get("/api/handovers/my", (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    if (user && user.role === "Volunteer") {
      res.json(
        handovers.filter((h) => h.volunteer_id === user.id || h.status !== "available")
      );
      return;
    }
    res.json(handovers.filter((h) => h.status !== "available"));
  });

  app.post("/api/handovers/:handover_id/assign", (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    if (!user || (user.role !== "Volunteer" && user.role !== "Admin")) {
      res.status(403).json({
        detail: "Access restricted: Only Volunteer accounts can claim rescue runs.",
      });
      return;
    }
    const item = handovers.find((h) => String(h.id) === String(req.params.handover_id));
    if (!item) {
      res.status(404).json({ detail: "Handover not found." });
      return;
    }
    item.volunteer_id = user.id;
    item.volunteer_name = user.full_name;
    item.status = "assigned";
    res.json(item);
  });

  // Bidirectional Pickup Verification: PATCH /api/deliveries/:id/verify-pickup
  app.patch("/api/deliveries/:handover_id/verify-pickup", (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    if (!user || (user.role !== "Volunteer" && user.role !== "Admin")) {
      res.status(403).json({
        detail: "Access restricted: Only Volunteer accounts can verify pickups.",
      });
      return;
    }
    const item = handovers.find((h) => String(h.id) === String(req.params.handover_id));
    if (!item) {
      res.status(404).json({ detail: "Delivery handover not found." });
      return;
    }
    const outcome = String(req.body.status || "").trim().toLowerCase();
    if (outcome !== "claimed" && outcome !== "pickup_failed") {
      res.status(400).json({ detail: "status must be 'claimed' or 'pickup_failed'." });
      return;
    }
    const listing = listings.find((l) => l.id === item.listing_id);
    const reqRecord = donationRequests.find((r) => r.id === item.request_id);
    const now = new Date().toISOString();

    if (outcome === "claimed") {
      item.status = "picked_up";
      item.pickup_status = "claimed";
      item.pickup_failure_reason = null;
      item.delivery_status = "in_transit";
      item.verified_by_volunteer_id = user.id;
      item.verified_at = now;
      if (listing) {
        listing.status = "in_transit";
        listing.pickup_status = "claimed";
        listing.delivery_status = "in_transit";
        listing.verified_by_volunteer_id = user.id;
      }
    } else {
      const reason = String(req.body.reason || "").trim();
      if (!reason) {
        res.status(400).json({
          detail: "A failure reason is mandatory when reporting pickup_failed.",
        });
        return;
      }
      item.status = "pickup_failed";
      item.pickup_status = "pickup_failed";
      item.pickup_failure_reason = reason;
      item.delivery_status = "delivery_failed";
      item.verified_by_volunteer_id = user.id;
      item.verified_at = now;
      if (listing) {
        listing.status = "pickup_failed";
        listing.pickup_status = "pickup_failed";
        listing.pickup_failure_reason = reason;
        listing.verified_by_volunteer_id = user.id;
      }
      if (reqRecord) {
        reqRecord.status = "failed_delivery";
        reqRecord.moderation_note = `Pickup failed: ${reason}`;
      }
    }
    res.json(item);
  });

  // Bidirectional Delivery Verification: PATCH /api/deliveries/:id/verify-delivery
  app.patch("/api/deliveries/:handover_id/verify-delivery", (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    if (!user || (user.role !== "Volunteer" && user.role !== "Admin")) {
      res.status(403).json({
        detail: "Access restricted: Only Volunteer accounts can verify deliveries.",
      });
      return;
    }
    const item = handovers.find((h) => String(h.id) === String(req.params.handover_id));
    if (!item) {
      res.status(404).json({ detail: "Delivery handover not found." });
      return;
    }
    const outcome = String(req.body.status || "").trim().toLowerCase();
    if (outcome !== "delivered" && outcome !== "delivery_failed") {
      res.status(400).json({ detail: "status must be 'delivered' or 'delivery_failed'." });
      return;
    }
    const listing = listings.find((l) => l.id === item.listing_id);
    const reqRecord = donationRequests.find((r) => r.id === item.request_id);
    const now = new Date().toISOString();

    if (outcome === "delivered") {
      item.status = "delivered";
      item.pickup_status = "claimed";
      item.delivery_status = "delivered";
      item.delivery_failure_reason = null;
      item.distribution_proof = req.body.distribution_proof
        ? String(req.body.distribution_proof).trim()
        : null;
      item.verified_by_volunteer_id = user.id;
      item.verified_at = now;
      if (listing) {
        listing.status = "delivered";
        listing.pickup_status = "claimed";
        listing.delivery_status = "delivered";
        listing.verified_by_volunteer_id = user.id;
      }
      if (reqRecord) {
        reqRecord.status = "completed";
      }
    } else {
      const reason = String(req.body.reason || "").trim();
      if (!reason) {
        res.status(400).json({
          detail: "A failure reason is mandatory when reporting delivery_failed.",
        });
        return;
      }
      item.status = "delivery_failed";
      item.delivery_status = "delivery_failed";
      item.delivery_failure_reason = reason;
      item.verified_by_volunteer_id = user.id;
      item.verified_at = now;
      if (listing) {
        listing.status = "delivery_failed";
        listing.delivery_status = "delivery_failed";
        listing.delivery_failure_reason = reason;
        listing.verified_by_volunteer_id = user.id;
      }
      if (reqRecord) {
        reqRecord.status = "failed_delivery";
        reqRecord.moderation_note = `Delivery failed: ${reason}`;
      }
    }
    res.json(item);
  });

  const pickupHandoverHandler = (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    if (!user || (user.role !== "Volunteer" && user.role !== "Admin")) {
      res.status(403).json({
        detail: "Access restricted: Only Volunteer accounts can confirm pickups.",
      });
      return;
    }
    const item = handovers.find((h) => String(h.id) === String(req.params.handover_id));
    if (!item) {
      res.status(404).json({ detail: "Handover not found." });
      return;
    }
    item.status = "picked_up";
    item.pickup_status = "claimed";
    item.delivery_status = "in_transit";
    item.verified_by_volunteer_id = user.id;
    item.verified_at = new Date().toISOString();
    const listing = listings.find((l) => String(l.id) === String(item.listing_id));
    if (listing) {
      listing.status = "in_transit";
      listing.pickup_status = "claimed";
      listing.delivery_status = "in_transit";
      listing.verified_by_volunteer_id = user.id;
    }
    res.json(item);
  };
  app.patch("/api/handovers/:handover_id/pickup", pickupHandoverHandler);
  app.post("/api/handovers/:handover_id/pickup", pickupHandoverHandler);

  const deliverHandoverHandler = (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    if (!user || (user.role !== "Volunteer" && user.role !== "Admin")) {
      res.status(403).json({
        detail: "Access restricted: Only Volunteer accounts can confirm deliveries.",
      });
      return;
    }
    const item = handovers.find((h) => String(h.id) === String(req.params.handover_id));
    if (!item) {
      res.status(404).json({ detail: "Handover not found." });
      return;
    }
    item.status = "delivered";
    item.pickup_status = "claimed";
    item.delivery_status = "delivered";
    item.verified_by_volunteer_id = user.id;
    item.verified_at = new Date().toISOString();
    const listing = listings.find((l) => String(l.id) === String(item.listing_id));
    if (listing) {
      listing.status = "delivered";
      listing.pickup_status = "claimed";
      listing.delivery_status = "delivered";
      listing.verified_by_volunteer_id = user.id;
    }
    const reqRecord = donationRequests.find((r) => r.id === item.request_id);
    if (reqRecord) {
      reqRecord.status = "completed";
    }
    res.json(item);
  };
  app.patch("/api/handovers/:handover_id/delivery", deliverHandoverHandler);
  app.post("/api/handovers/:handover_id/delivery", deliverHandoverHandler);
  app.post("/api/handovers/:handover_id/deliver", deliverHandoverHandler);

  // Notifications
  app.get("/api/notifications", (_req: Request, res: Response) => {
    res.json(notifications);
  });

  app.patch("/api/notifications/:notification_id/read", (req: Request, res: Response) => {
    const n = notifications.find(
      (item) => String(item.id) === String(req.params.notification_id)
    );
    if (!n) {
      res.status(404).json({ detail: "Notification not found." });
      return;
    }
    n.is_read = true;
    res.json(n);
  });

  app.get("/api/matching/recommendations", (_req: Request, res: Response) => {
    res.json(listings.filter((l) => l.status === "available"));
  });

  const impactHandler = (_req: Request, res: Response) => {
    const completedDeliveries = handovers.filter((h) => h.status === "delivered").length;
    const availableListings = listings.filter((l) => l.status === "available").length;
    res.json({
      available_listings: availableListings,
      successful_handovers: completedDeliveries,
      completed_handovers: completedDeliveries,
      total_requests: donationRequests.length,
      food_rescued: completedDeliveries > 0 ? completedDeliveries : undefined,
    });
  };
  app.get("/api/dashboard/impact", impactHandler);
  app.get("/api/extras/impact", impactHandler);

  /* ============================================================================
     DONOR LEADERBOARD ("RANK PAGE") & NGO REVIEW SYSTEM
     ============================================================================ */

  app.get("/api/leaderboard", (req: Request, res: Response) => {
    const period = String(req.query.period || "all").trim().toLowerCase();
    const sortBy = String(req.query.sort || "points").trim().toLowerCase();
    const nowMs = Date.now();

    const donors = users.filter((u) => u.role === "Donor" && u.status === "active");
    const board = donors.map((donor) => {
      const donorDelivered = listings.filter((l) => {
        if (l.donor_id !== donor.id) return false;
        const isCompleted =
          l.status === "delivered" ||
          l.status === "completed" ||
          l.delivery_status === "delivered" ||
          handovers.some((h) => h.listing_id === l.id && h.status === "delivered");
        if (!isCompleted) return false;
        const createdMs = new Date(l.created_at).getTime();
        if (period === "weekly" && nowMs - createdMs > 7 * 86400 * 1000) return false;
        if (period === "monthly" && nowMs - createdMs > 30 * 86400 * 1000) return false;
        return true;
      });

      const completedCount = donorDelivered.length;
      let totalMeals = 0;
      let volumePoints = 0;

      for (const item of donorDelivered) {
        const qtyVal = parseNumericQuantity(item.quantity);
        const unitStr = (item.quantity || "").toLowerCase();
        if (unitStr.includes("kg")) {
          totalMeals += Math.round(qtyVal * 2.5);
          volumePoints += Math.floor(qtyVal / 2);
        } else {
          totalMeals += Math.round(qtyVal);
          volumePoints += Math.floor(qtyVal / 5);
        }
      }

      const monthDeliveredCount = listings.filter((l) => {
        if (l.donor_id !== donor.id) return false;
        const isCompleted =
          l.status === "delivered" ||
          l.status === "completed" ||
          l.delivery_status === "delivered";
        const createdMs = new Date(l.created_at).getTime();
        return isCompleted && nowMs - createdMs <= 30 * 86400 * 1000;
      }).length;

      const basePoints = completedCount * 10;
      const consistencyBonus = monthDeliveredCount >= 5 ? 5 : 0;
      const totalPoints = basePoints + volumePoints + consistencyBonus;

      const donorReviews = reviews
        .filter((rv) => rv.restaurant_id === donor.id)
        .sort((a, b) => b.id - a.id);
      const reviewCount = donorReviews.length;
      const avgRating =
        reviewCount > 0
          ? Number(
              (
                donorReviews.reduce((acc, rv) => acc + rv.rating, 0) / reviewCount
              ).toFixed(1)
            )
          : 0;

      return {
        donor_id: donor.id,
        donor_name: donor.full_name,
        organization: donor.organization || donor.full_name,
        completed_donations: completedCount,
        estimated_meals: totalMeals,
        base_points: basePoints,
        volume_points: volumePoints,
        consistency_bonus: consistencyBonus,
        total_points: totalPoints,
        average_rating: avgRating,
        review_count: reviewCount,
        recent_reviews: donorReviews.slice(0, 5),
      };
    });

    if (sortBy === "donations") {
      board.sort(
        (a, b) =>
          b.completed_donations - a.completed_donations ||
          b.total_points - a.total_points ||
          b.estimated_meals - a.estimated_meals
      );
    } else {
      board.sort(
        (a, b) =>
          b.total_points - a.total_points ||
          b.completed_donations - a.completed_donations ||
          b.estimated_meals - a.estimated_meals
      );
    }

    const items = board.map((entry, idx) => ({
      ...entry,
      rank: idx + 1,
      badge: idx === 0 ? "Gold" : idx === 1 ? "Silver" : idx === 2 ? "Bronze" : null,
    }));

    res.json({
      period,
      sort: sortBy,
      items,
      total: items.length,
    });
  });

  app.post("/api/donations/:listing_id/reviews", (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    if (!user || (user.role !== "NGO" && user.role !== "Admin")) {
      res.status(403).json({
        detail: "Access restricted: Only NGO accounts can submit restaurant reviews.",
      });
      return;
    }

    const listingId = Number(req.params.listing_id);
    const listing = listings.find((l) => l.id === listingId);
    if (!listing) {
      res.status(404).json({ detail: "Donation listing not found." });
      return;
    }

    const handover = handovers.find((h) => h.listing_id === listing.id);
    const isDelivered =
      listing.status === "delivered" ||
      listing.status === "completed" ||
      listing.delivery_status === "delivered" ||
      handover?.status === "delivered" ||
      handover?.delivery_status === "delivered";

    if (!isDelivered) {
      res.status(400).json({
        detail: "Reviews can only be submitted after the donation reaches 'delivered' status.",
      });
      return;
    }

    const claimRecord = donationRequests.find(
      (r) => r.listing_id === listing.id && r.requester_id === user.id
    );
    if (
      user.role !== "Admin" &&
      listing.claimed_by_ngo_id !== user.id &&
      !claimRecord
    ) {
      res.status(403).json({
        detail: "You can only review donations that were claimed and received by your NGO.",
      });
      return;
    }

    const existing = reviews.find((rv) => rv.donation_id === listing.id);
    if (existing) {
      res.status(409).json({
        detail: "A review has already been submitted for this delivered donation.",
      });
      return;
    }

    const rating = Math.max(1, Math.min(5, Number(req.body.rating) || 5));
    const comment = req.body.comment ? String(req.body.comment).trim() : null;
    const tags = Array.isArray(req.body.tags)
      ? req.body.tags.map((t: unknown) => String(t).trim()).filter(Boolean)
      : [];

    const newReview: ReviewRecord = {
      id: nextReviewId++,
      donation_id: listing.id,
      restaurant_id: listing.donor_id,
      ngo_id: user.id,
      ngo_name: user.full_name,
      rating,
      comment,
      tags,
      created_at: new Date().toISOString(),
    };
    reviews.unshift(newReview);

    notifications.unshift({
      id: nextNotificationId++,
      user_id: listing.donor_id,
      message: `${user.full_name} rated your "${listing.title}" donation ${rating}/5 stars!`,
      is_read: false,
      created_at: new Date().toISOString(),
    });

    res.status(201).json(newReview);
  });

  app.get("/api/restaurants/:restaurant_id/reviews", (req: Request, res: Response) => {
    const restId = Number(req.params.restaurant_id);
    const donor = users.find((u) => u.id === restId);
    const items = reviews
      .filter((rv) => rv.restaurant_id === restId)
      .sort((a, b) => b.id - a.id);
    const avgRating =
      items.length > 0
        ? Number((items.reduce((acc, r) => acc + r.rating, 0) / items.length).toFixed(1))
        : 0;

    res.json({
      restaurant_id: restId,
      restaurant_name: donor ? donor.organization || donor.full_name : "Restaurant Partner",
      average_rating: avgRating,
      review_count: items.length,
      items,
    });
  });

  /* ============================================================================
     ADMIN PLATFORM MANAGEMENT ENDPOINTS (/api/admin/*)
     ============================================================================ */

  // Admin NGO License Verification Panel Endpoints
  app.get("/api/admin/ngos/verifications", (req: Request, res: Response) => {
    if (!requireAdminUser(req, res)) return;
    const statusFilter = String(req.query.status || "all").trim().toLowerCase();
    const search = String(req.query.search || "").trim().toLowerCase();

    let ngos = users.filter((u) => u.role === "NGO");
    if (statusFilter && statusFilter !== "all") {
      ngos = ngos.filter(
        (u) => (u.verification_status || "pending").toLowerCase() === statusFilter
      );
    }
    if (search) {
      ngos = ngos.filter(
        (u) =>
          u.full_name.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search) ||
          (u.organization || "").toLowerCase().includes(search) ||
          (u.license_number || "").toLowerCase().includes(search)
      );
    }

    const allNgos = users.filter((u) => u.role === "NGO");
    res.json({
      items: ngos.map(sanitizeUser),
      total: ngos.length,
      counts: {
        pending: allNgos.filter((u) => (u.verification_status || "pending") === "pending").length,
        approved: allNgos.filter((u) => u.verification_status === "approved").length,
        rejected: allNgos.filter((u) => u.verification_status === "rejected").length,
        all: allNgos.length,
      },
    });
  });

  app.patch("/api/admin/ngos/:ngo_id/verify", (req: Request, res: Response) => {
    const admin = requireAdminUser(req, res);
    if (!admin) return;
    const ngo = users.find(
      (u) => String(u.id) === String(req.params.ngo_id) && u.role === "NGO"
    );
    if (!ngo) {
      res.status(404).json({ detail: "NGO account not found." });
      return;
    }
    const desired = String(req.body.status || "").trim().toLowerCase();
    if (desired !== "approved" && desired !== "rejected") {
      res.status(400).json({ detail: "status must be 'approved' or 'rejected'." });
      return;
    }
    const prev = {
      verification_status: ngo.verification_status,
      rejection_reason: ngo.rejection_reason,
    };

    if (desired === "approved") {
      ngo.verification_status = "approved";
      ngo.verified_at = new Date().toISOString();
      ngo.verified_by_admin_id = admin.id;
      ngo.rejection_reason = null;

      notifications.unshift({
        id: nextNotificationId++,
        user_id: ngo.id,
        message:
          "Your NGO license has been verified and approved by administrators. You now have full access to claim and request food donations.",
        is_read: false,
        created_at: new Date().toISOString(),
      });
    } else {
      const reason = String(req.body.rejection_reason || "").trim();
      if (!reason) {
        res.status(400).json({
          detail: "A rejection_reason is mandatory when rejecting an NGO license.",
        });
        return;
      }
      ngo.verification_status = "rejected";
      ngo.verified_at = null;
      ngo.verified_by_admin_id = admin.id;
      ngo.rejection_reason = reason;

      notifications.unshift({
        id: nextNotificationId++,
        user_id: ngo.id,
        message: `Your NGO license verification was rejected. Reason: ${reason}`,
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }

    recordAudit(
      admin,
      desired === "approved" ? "NGO_LICENSE_APPROVED" : "NGO_LICENSE_REJECTED",
      "users",
      ngo.id,
      prev,
      {
        verification_status: ngo.verification_status,
        rejection_reason: ngo.rejection_reason,
      },
      req
    );

    res.json(sanitizeUser(ngo));
  });

  // 1. Admin Dashboard Stats & Activity
  app.get("/api/admin/dashboard/stats", (req: Request, res: Response) => {
    if (!requireAdminUser(req, res)) return;

    const totalUsers = users.length;
    const totalDonors = users.filter((u) => u.role === "Donor").length;
    const totalRecipients = users.filter((u) => u.role === "NGO").length;
    const totalVolunteers = users.filter((u) => u.role === "Volunteer").length;
    const totalAdmins = users.filter((u) => u.role === "Admin").length;
    const activeVolunteers = users.filter(
      (u) => u.role === "Volunteer" && u.status === "active" && u.is_available
    ).length;

    const totalListings = listings.length;
    const availableListings = listings.filter((l) => l.status === "available").length;
    const flaggedListings = listings.filter((l) => l.is_flagged || l.status === "flagged").length;
    const expiredListings = listings.filter((l) => l.status === "expired").length;

    const pendingRequests = donationRequests.filter((r) => r.status === "pending").length;
    const acceptedRequests = donationRequests.filter((r) => r.status === "accepted").length;
    const rejectedRequests = donationRequests.filter((r) => r.status === "rejected").length;
    const disputedRequests = donationRequests.filter((r) => r.is_disputed).length;

    const completedDonations = handovers.filter((h) => h.status === "delivered").length;
    const completedListingIds = new Set(
      handovers.filter((h) => h.status === "delivered").map((h) => h.listing_id)
    );

    const totalQuantityDonated = Number(
      listings
        .filter((l) => l.status !== "removed")
        .reduce((acc, l) => acc + parseNumericQuantity(l.quantity), 0)
        .toFixed(1)
    );
    const totalQuantityRedistributed = Number(
      listings
        .filter((l) => completedListingIds.has(l.id) || l.status === "completed")
        .reduce((acc, l) => acc + parseNumericQuantity(l.quantity), 0)
        .toFixed(1)
    );

    const totalPlatformActivity =
      totalUsers +
      totalListings +
      donationRequests.length +
      handovers.length +
      auditLogs.length +
      notifications.length;

    res.json({
      total_users: totalUsers,
      total_donors: totalDonors,
      total_recipients: totalRecipients,
      total_volunteers: totalVolunteers,
      total_admins: totalAdmins,
      total_listings: totalListings,
      available_listings: availableListings,
      flagged_listings: flaggedListings,
      expired_listings: expiredListings,
      pending_requests: pendingRequests,
      accepted_requests: acceptedRequests,
      rejected_requests: rejectedRequests,
      disputed_requests: disputedRequests,
      completed_donations: completedDonations,
      active_volunteers: activeVolunteers,
      total_quantity_donated: totalQuantityDonated,
      total_quantity_redistributed: totalQuantityRedistributed,
      total_platform_activity: totalPlatformActivity,
      donation_activity_chart: [
        { stage: "Available", count: availableListings },
        { stage: "Requested", count: listings.filter((l) => l.status === "requested").length },
        { stage: "Claimed", count: listings.filter((l) => l.status === "claimed").length },
        { stage: "Completed", count: listings.filter((l) => l.status === "completed").length },
        {
          stage: "Flagged/Removed",
          count: listings.filter(
            (l) => l.status === "removed" || l.status === "flagged" || l.is_flagged
          ).length,
        },
      ],
      user_registration_chart: [
        { role: "Donors", count: totalDonors },
        { role: "Recipients (NGO)", count: totalRecipients },
        { role: "Volunteers", count: totalVolunteers },
        { role: "Admins", count: totalAdmins },
      ],
      request_status_chart: [
        { status: "Pending", count: pendingRequests },
        { status: "Accepted", count: acceptedRequests },
        { status: "Rejected", count: rejectedRequests },
        { status: "Disputed", count: disputedRequests },
      ],
    });
  });

  app.get("/api/admin/dashboard/activity", (req: Request, res: Response) => {
    if (!requireAdminUser(req, res)) return;
    res.json({
      recent_registrations: [...users]
        .sort((a, b) => b.id - a.id)
        .slice(0, 6)
        .map(sanitizeUser),
      recent_listings: listings.slice(0, 6),
      recent_requests: donationRequests.slice(0, 6),
      recent_activity: auditLogs.slice(0, 8),
    });
  });

  // 2. Admin User Management
  app.get("/api/admin/users", (req: Request, res: Response) => {
    if (!requireAdminUser(req, res)) return;
    const search = String(req.query.search || "").trim().toLowerCase();
    const roleFilter = String(req.query.role || "").trim();
    const statusFilter = String(req.query.status || "").trim().toLowerCase();
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.max(1, Number(req.query.page_size) || 20);

    let filtered = [...users].sort((a, b) => b.id - a.id);
    if (search) {
      filtered = filtered.filter(
        (u) =>
          String(u.id) === search ||
          u.full_name.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search) ||
          (u.organization || "").toLowerCase().includes(search)
      );
    }
    if (roleFilter && roleFilter.toLowerCase() !== "all") {
      const norm = normalizeRole(roleFilter, true);
      filtered = filtered.filter((u) => u.role === norm);
    }
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((u) => (u.status || "active") === statusFilter);
    }

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    res.json({
      items: filtered.slice(start, start + pageSize).map(sanitizeUser),
      total,
      page,
      page_size: pageSize,
    });
  });

  app.get("/api/admin/users/:user_id", (req: Request, res: Response) => {
    if (!requireAdminUser(req, res)) return;
    const u = users.find((item) => String(item.id) === String(req.params.user_id));
    if (!u) {
      res.status(404).json({ detail: "User not found." });
      return;
    }
    res.json({
      user: sanitizeUser(u),
      donation_history: listings.filter((l) => l.donor_id === u.id),
      request_history: donationRequests.filter((r) => r.requester_id === u.id),
      handover_history: handovers.filter((h) => h.volunteer_id === u.id),
      audit_history: auditLogs.filter(
        (a) => a.entity_type === "users" && a.entity_id === String(u.id)
      ),
    });
  });

  app.patch("/api/admin/users/:user_id", (req: Request, res: Response) => {
    const admin = requireAdminUser(req, res);
    if (!admin) return;
    const u = users.find((item) => String(item.id) === String(req.params.user_id));
    if (!u) {
      res.status(404).json({ detail: "User not found." });
      return;
    }
    const prev = sanitizeUser(u);
    const { full_name, email, phone, organization, is_available } = req.body;
    if (email && String(email).trim().toLowerCase() !== u.email.toLowerCase()) {
      const conflict = users.find(
        (other) =>
          other.id !== u.id &&
          other.email.toLowerCase() === String(email).trim().toLowerCase()
      );
      if (conflict) {
        res.status(400).json({ detail: "Another account is already using this email." });
        return;
      }
      u.email = String(email).trim();
    }
    if (full_name !== undefined) u.full_name = String(full_name).trim();
    if (phone !== undefined) u.phone = phone ? String(phone) : undefined;
    if (organization !== undefined)
      u.organization = organization ? String(organization) : undefined;
    if (is_available !== undefined) u.is_available = Boolean(is_available);

    recordAudit(admin, "USER_PROFILE_UPDATED", "users", u.id, prev, sanitizeUser(u), req);
    res.json(sanitizeUser(u));
  });

  app.patch("/api/admin/users/:user_id}/role".replace("}", ""), (req: Request, res: Response) => {
    const admin = requireAdminUser(req, res);
    if (!admin) return;
    const u = users.find((item) => String(item.id) === String(req.params.user_id));
    if (!u) {
      res.status(404).json({ detail: "User not found." });
      return;
    }
    const newRole = normalizeRole(req.body.role, true);
    if (u.id === admin.id && newRole !== "Admin") {
      res.status(400).json({
        detail: "Security protection: You cannot remove your own Admin role.",
      });
      return;
    }
    if (u.role === "Admin" && newRole !== "Admin" && countActiveAdmins() <= 1) {
      res.status(400).json({
        detail: "Security protection: Cannot demote the last active administrator.",
      });
      return;
    }
    const prevRole = u.role;
    u.role = newRole;
    recordAudit(
      admin,
      "USER_ROLE_CHANGED",
      "users",
      u.id,
      { role: prevRole },
      { role: newRole, reason: req.body.reason },
      req
    );
    res.json(sanitizeUser(u));
  });

  app.patch("/api/admin/users/:user_id/status", (req: Request, res: Response) => {
    const admin = requireAdminUser(req, res);
    if (!admin) return;
    const u = users.find((item) => String(item.id) === String(req.params.user_id));
    if (!u) {
      res.status(404).json({ detail: "User not found." });
      return;
    }
    const desired = String(req.body.status || "").trim().toLowerCase() as
      | "active"
      | "suspended"
      | "deactivated";
    if (!["active", "suspended", "deactivated"].includes(desired)) {
      res.status(400).json({ detail: "Invalid status value." });
      return;
    }
    if (u.id === admin.id && desired !== "active") {
      res.status(400).json({
        detail: "Security protection: You cannot suspend or deactivate your own Admin account.",
      });
      return;
    }
    if (u.role === "Admin" && desired !== "active" && countActiveAdmins() <= 1) {
      res.status(400).json({
        detail: "Security protection: Cannot suspend or deactivate the last active administrator.",
      });
      return;
    }
    const prevStatus = u.status;
    u.status = desired;
    const actionLabel =
      desired === "active"
        ? "USER_RESTORED"
        : desired === "suspended"
        ? "USER_SUSPENDED"
        : "USER_DEACTIVATED";
    recordAudit(
      admin,
      actionLabel,
      "users",
      u.id,
      { status: prevStatus },
      { status: desired, reason: req.body.reason },
      req
    );
    res.json(sanitizeUser(u));
  });

  app.delete("/api/admin/users/:user_id", (req: Request, res: Response) => {
    const admin = requireAdminUser(req, res);
    if (!admin) return;
    const idx = users.findIndex((item) => String(item.id) === String(req.params.user_id));
    if (idx === -1) {
      res.status(404).json({ detail: "User not found." });
      return;
    }
    const target = users[idx];
    if (target.id === admin.id) {
      res.status(400).json({
        detail: "Security protection: You cannot delete your own Admin account.",
      });
      return;
    }
    if (target.role === "Admin" && countActiveAdmins() <= 1) {
      res.status(400).json({
        detail: "Security protection: Cannot delete the last active administrator.",
      });
      return;
    }
    const snapshot = sanitizeUser(target);
    users.splice(idx, 1);
    recordAudit(admin, "USER_DELETED", "users", target.id, snapshot, null, req);
    res.json({ detail: "User deleted.", deleted_id: target.id });
  });

  // 3. Admin Listing Management
  app.get("/api/admin/listings", (req: Request, res: Response) => {
    if (!requireAdminUser(req, res)) return;
    const search = String(req.query.search || "").trim().toLowerCase();
    const category = String(req.query.category || "").trim().toLowerCase();
    const statusFilter = String(req.query.status || "").trim().toLowerCase();
    const donorId = req.query.donor_id ? Number(req.query.donor_id) : null;
    const flaggedOnly = req.query.flagged_only === "true";
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.max(1, Number(req.query.page_size) || 20);

    let filtered = [...listings];
    if (search) {
      filtered = filtered.filter(
        (l) =>
          l.title.toLowerCase().includes(search) ||
          l.donor_name.toLowerCase().includes(search) ||
          l.pickup_location.toLowerCase().includes(search)
      );
    }
    if (category && category !== "all") {
      filtered = filtered.filter((l) => (l.category || "cooked_meals").toLowerCase() === category);
    }
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((l) => l.status.toLowerCase() === statusFilter);
    }
    if (donorId !== null) {
      filtered = filtered.filter((l) => l.donor_id === donorId);
    }
    if (flaggedOnly) {
      filtered = filtered.filter((l) => l.is_flagged);
    }

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    res.json({
      items: filtered.slice(start, start + pageSize),
      total,
      page,
      page_size: pageSize,
    });
  });

  app.get("/api/admin/listings/:listing_id", (req: Request, res: Response) => {
    if (!requireAdminUser(req, res)) return;
    const l = listings.find((item) => String(item.id) === String(req.params.listing_id));
    if (!l) {
      res.status(404).json({ detail: "Listing not found." });
      return;
    }
    const donor = users.find((u) => u.id === l.donor_id);
    res.json({
      listing: l,
      donor: donor ? sanitizeUser(donor) : null,
      requests: donationRequests.filter((r) => r.listing_id === l.id),
      handovers: handovers.filter((h) => h.listing_id === l.id),
    });
  });

  app.patch("/api/admin/listings/:listing_id", (req: Request, res: Response) => {
    const admin = requireAdminUser(req, res);
    if (!admin) return;
    const l = listings.find((item) => String(item.id) === String(req.params.listing_id));
    if (!l) {
      res.status(404).json({ detail: "Listing not found." });
      return;
    }
    const prev = { ...l };
    Object.assign(l, req.body);
    recordAudit(
      admin,
      req.body.is_flagged ? "LISTING_FLAGGED" : "LISTING_MODERATED",
      "food_listings",
      l.id,
      prev,
      l,
      req
    );
    res.json(l);
  });

  app.delete("/api/admin/listings/:listing_id", (req: Request, res: Response) => {
    const admin = requireAdminUser(req, res);
    if (!admin) return;
    const l = listings.find((item) => String(item.id) === String(req.params.listing_id));
    if (!l) {
      res.status(404).json({ detail: "Listing not found." });
      return;
    }
    const prevStatus = l.status;
    l.status = "removed";
    recordAudit(
      admin,
      "LISTING_REMOVED",
      "food_listings",
      l.id,
      { status: prevStatus },
      { status: "removed" },
      req
    );
    res.json(l);
  });

  app.post("/api/admin/listings/:listing_id/restore", (req: Request, res: Response) => {
    const admin = requireAdminUser(req, res);
    if (!admin) return;
    const l = listings.find((item) => String(item.id) === String(req.params.listing_id));
    if (!l) {
      res.status(404).json({ detail: "Listing not found." });
      return;
    }
    const prev = { status: l.status, is_flagged: l.is_flagged };
    l.status = "available";
    l.is_flagged = false;
    recordAudit(
      admin,
      "LISTING_RESTORED",
      "food_listings",
      l.id,
      prev,
      { status: "available", is_flagged: false },
      req
    );
    res.json(l);
  });

  // 4. Admin Request Management
  app.get("/api/admin/requests", (req: Request, res: Response) => {
    if (!requireAdminUser(req, res)) return;
    const search = String(req.query.search || "").trim().toLowerCase();
    const statusFilter = String(req.query.status || "").trim().toLowerCase();
    const disputedOnly = req.query.disputed_only === "true";
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.max(1, Number(req.query.page_size) || 20);

    let enriched = donationRequests.map((r) => {
      const listing = listings.find((l) => l.id === r.listing_id);
      return {
        ...r,
        donor_id: listing?.donor_id || null,
        donor_name: listing?.donor_name || "Donor",
        requested_quantity: r.requested_quantity || listing?.quantity || "1",
      };
    });

    if (search) {
      enriched = enriched.filter(
        (r) =>
          r.listing_title.toLowerCase().includes(search) ||
          r.requester_name.toLowerCase().includes(search) ||
          (r.notes || "").toLowerCase().includes(search)
      );
    }
    if (statusFilter && statusFilter !== "all") {
      enriched = enriched.filter((r) => r.status.toLowerCase() === statusFilter);
    }
    if (disputedOnly) {
      enriched = enriched.filter((r) => r.is_disputed);
    }

    const total = enriched.length;
    const start = (page - 1) * pageSize;
    res.json({
      items: enriched.slice(start, start + pageSize),
      total,
      page,
      page_size: pageSize,
    });
  });

  app.get("/api/admin/requests/:request_id", (req: Request, res: Response) => {
    if (!requireAdminUser(req, res)) return;
    const r = donationRequests.find(
      (item) => String(item.id) === String(req.params.request_id)
    );
    if (!r) {
      res.status(404).json({ detail: "Request not found." });
      return;
    }
    const listing = listings.find((l) => l.id === r.listing_id) || null;
    const recipient = users.find((u) => u.id === r.requester_id);
    res.json({
      request: {
        ...r,
        donor_id: listing?.donor_id || null,
        donor_name: listing?.donor_name || "Donor",
      },
      listing,
      recipient: recipient ? sanitizeUser(recipient) : null,
      handovers: handovers.filter((h) => h.request_id === r.id),
    });
  });

  app.patch("/api/admin/requests/:request_id/moderate", (req: Request, res: Response) => {
    const admin = requireAdminUser(req, res);
    if (!admin) return;
    const r = donationRequests.find(
      (item) => String(item.id) === String(req.params.request_id)
    );
    if (!r) {
      res.status(404).json({ detail: "Request not found." });
      return;
    }
    const prev = { ...r };
    if (req.body.is_disputed !== undefined) r.is_disputed = Boolean(req.body.is_disputed);
    if (req.body.moderation_note !== undefined)
      r.moderation_note = String(req.body.moderation_note);
    if (req.body.status) {
      r.status = req.body.status;
      if (req.body.status === "cancelled") {
        const listing = listings.find((l) => l.id === r.listing_id);
        if (listing && listing.status === "requested") listing.status = "available";
      }
    }
    recordAudit(admin, "REQUEST_MODERATED", "donation_requests", r.id, prev, r, req);
    res.json(r);
  });

  // 5. Admin Volunteer Management
  app.get("/api/admin/volunteers", (req: Request, res: Response) => {
    if (!requireAdminUser(req, res)) return;
    const search = String(req.query.search || "").trim().toLowerCase();
    const availability = String(req.query.availability || "").trim().toLowerCase();

    let vols = users.filter((u) => u.role === "Volunteer");
    if (search) {
      vols = vols.filter(
        (v) =>
          v.full_name.toLowerCase().includes(search) ||
          v.email.toLowerCase().includes(search)
      );
    }
    if (availability === "available") vols = vols.filter((v) => v.is_available);
    if (availability === "unavailable") vols = vols.filter((v) => !v.is_available);

    const items = vols.map((v) => {
      const vRuns = handovers.filter((h) => h.volunteer_id === v.id);
      return {
        ...sanitizeUser(v),
        assigned_runs: vRuns.filter((h) => h.status === "assigned" || h.status === "picked_up")
          .length,
        completed_deliveries: vRuns.filter((h) => h.status === "delivered").length,
        total_assignments: vRuns.length,
      };
    });

    res.json({
      items,
      total: items.length,
      pending_handovers: handovers.filter((h) => h.status !== "delivered"),
    });
  });

  app.get("/api/admin/volunteers/:volunteer_id", (req: Request, res: Response) => {
    if (!requireAdminUser(req, res)) return;
    const v = users.find(
      (u) => String(u.id) === String(req.params.volunteer_id) && u.role === "Volunteer"
    );
    if (!v) {
      res.status(404).json({ detail: "Volunteer not found." });
      return;
    }
    res.json({
      volunteer: sanitizeUser(v),
      assignments: handovers.filter((h) => h.volunteer_id === v.id),
    });
  });

  app.get("/api/admin/volunteers/:volunteer_id/assignments", (req: Request, res: Response) => {
    if (!requireAdminUser(req, res)) return;
    res.json(
      handovers.filter((h) => String(h.volunteer_id) === String(req.params.volunteer_id))
    );
  });

  app.post(
    "/api/admin/volunteers/handovers/:handover_id/reassign",
    (req: Request, res: Response) => {
      const admin = requireAdminUser(req, res);
      if (!admin) return;
      const h = handovers.find(
        (item) => String(item.id) === String(req.params.handover_id)
      );
      if (!h) {
        res.status(404).json({ detail: "Handover not found." });
        return;
      }
      const prev = { ...h };
      const { volunteer_id, status, notes } = req.body;
      if (volunteer_id !== undefined && volunteer_id !== null) {
        const vol = users.find(
          (u) => String(u.id) === String(volunteer_id) && u.role === "Volunteer"
        );
        if (!vol) {
          res.status(400).json({ detail: "Selected user is not a valid Volunteer." });
          return;
        }
        h.volunteer_id = vol.id;
        h.volunteer_name = vol.full_name;
        if (h.status === "available") h.status = "assigned";
      } else {
        h.volunteer_id = null;
        h.volunteer_name = undefined;
        h.status = "available";
      }
      if (status) h.status = status;
      if (notes !== undefined) h.notes = String(notes);

      recordAudit(admin, "VOLUNTEER_REASSIGNED", "volunteer_handovers", h.id, prev, h, req);
      res.json(h);
    }
  );

  // 6. Admin Donation & Delivery Monitoring
  app.get("/api/admin/donations", (req: Request, res: Response) => {
    if (!requireAdminUser(req, res)) return;
    const statusFilter = String(req.query.status || "").trim().toLowerCase();
    const donorId = req.query.donor_id ? Number(req.query.donor_id) : null;
    const ngoId = req.query.ngo_id ? Number(req.query.ngo_id) : null;
    const dateFrom = String(req.query.date_from || "").trim();
    const dateTo = String(req.query.date_to || "").trim();
    const search = String(req.query.search || "").trim().toLowerCase();

    let items = listings.map((l) => {
      const reqItem = donationRequests.find((r) => r.listing_id === l.id);
      const handover = handovers.find((h) => h.listing_id === l.id);
      const stage = deriveLifecycleStatus(l, reqItem, handover);
      return {
        donation_id: l.id,
        listing_id: l.id,
        listing_title: l.title,
        category: l.category,
        quantity: l.quantity,
        pickup_location: l.pickup_location,
        donor_id: l.donor_id,
        donor_name: l.donor_name,
        listing_status: l.status,
        cancellation_reason: l.cancellation_reason || null,
        cancelled_at: l.cancelled_at || null,
        pickup_status: handover?.pickup_status || l.pickup_status || "pending",
        pickup_failure_reason:
          handover?.pickup_failure_reason || l.pickup_failure_reason || null,
        delivery_status: handover?.delivery_status || l.delivery_status || "pending",
        delivery_failure_reason:
          handover?.delivery_failure_reason || l.delivery_failure_reason || null,
        verified_by_volunteer_id:
          handover?.verified_by_volunteer_id || l.verified_by_volunteer_id || null,
        distribution_proof: handover?.distribution_proof || null,
        request_id: reqItem?.id || null,
        requester_id: reqItem?.requester_id || null,
        requester_name: reqItem?.requester_name || null,
        request_status: reqItem?.status || null,
        handover_id: handover?.id || null,
        volunteer_id: handover?.volunteer_id || null,
        volunteer_name: handover?.volunteer_name || null,
        handover_status: handover?.status || null,
        lifecycle_status: stage,
        created_at: l.created_at,
      };
    });

    if (statusFilter && statusFilter !== "all") {
      if (statusFilter === "active") {
        items = items.filter(
          (d) =>
            ![
              "completed",
              "cancelled",
              "expired",
              "pickup_failed",
              "delivery_failed",
            ].includes(d.lifecycle_status.toLowerCase())
        );
      } else if (statusFilter === "past") {
        items = items.filter((d) =>
          [
            "completed",
            "cancelled",
            "expired",
            "pickup_failed",
            "delivery_failed",
          ].includes(d.lifecycle_status.toLowerCase())
        );
      } else {
        items = items.filter((d) => d.lifecycle_status.toLowerCase() === statusFilter);
      }
    }
    if (donorId !== null) {
      items = items.filter((d) => d.donor_id === donorId);
    }
    if (ngoId !== null) {
      items = items.filter((d) => d.requester_id === ngoId);
    }
    if (dateFrom) {
      items = items.filter((d) => d.created_at.slice(0, 10) >= dateFrom);
    }
    if (dateTo) {
      items = items.filter((d) => d.created_at.slice(0, 10) <= dateTo);
    }
    if (search) {
      items = items.filter((d) =>
        [
          d.listing_title,
          d.donor_name,
          d.requester_name,
          d.volunteer_name,
          d.cancellation_reason,
          d.pickup_failure_reason,
          d.delivery_failure_reason,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(search)
      );
    }

    res.json({ items, total: items.length });
  });

  app.get("/api/admin/donations/:donation_id", (req: Request, res: Response) => {
    if (!requireAdminUser(req, res)) return;
    const l = listings.find((item) => String(item.id) === String(req.params.donation_id));
    if (!l) {
      res.status(404).json({ detail: "Donation not found." });
      return;
    }
    const reqs = donationRequests.filter((r) => r.listing_id === l.id);
    const hands = handovers.filter((h) => h.listing_id === l.id);
    const primaryReq = reqs[0];
    const primaryHand = hands[0];
    const stage = deriveLifecycleStatus(l, primaryReq, primaryHand);

    res.json({
      donation_id: l.id,
      lifecycle_status: stage,
      steps: [
        {
          step: "1. Listing Created",
          completed: true,
          actor: l.donor_name,
          detail: `${l.title} (${l.quantity}) at ${l.pickup_location}`,
        },
        {
          step: "2. Recipient Requested",
          completed: Boolean(primaryReq),
          actor: primaryReq?.requester_name || "Awaiting NGO",
          detail: primaryReq?.notes || "No request submitted yet",
        },
        {
          step: "3. Donor Decision",
          completed:
            Boolean(primaryReq) &&
            ["accepted", "rejected", "fulfilled"].includes(primaryReq.status),
          actor: l.donor_name,
          detail: l.cancellation_reason
            ? `Cancelled: ${l.cancellation_reason}`
            : primaryReq
            ? `Status: ${primaryReq.status}`
            : "Pending",
        },
        {
          step: "4. Volunteer Assigned",
          completed: Boolean(primaryHand && primaryHand.volunteer_id),
          actor: primaryHand?.volunteer_name || "Unassigned",
          detail: primaryHand ? `Handover #${primaryHand.id}` : "Not dispatched",
        },
        {
          step: "5. Food Picked Up / Claimed",
          completed:
            Boolean(primaryHand) &&
            (["picked_up", "delivered"].includes(primaryHand.status) ||
              primaryHand.pickup_status === "claimed"),
          actor: primaryHand?.volunteer_name || "-",
          detail: primaryHand?.pickup_failure_reason
            ? `Pickup Failed: ${primaryHand.pickup_failure_reason}`
            : primaryHand?.pickup_location || "-",
        },
        {
          step: "6. Delivered & Verified",
          completed:
            Boolean(primaryHand) &&
            (primaryHand.status === "delivered" ||
              primaryHand.delivery_status === "delivered"),
          actor: primaryHand?.volunteer_name || "-",
          detail: primaryHand?.delivery_failure_reason
            ? `Delivery Failed: ${primaryHand.delivery_failure_reason}`
            : primaryHand?.distribution_proof || primaryHand?.dropoff_location || "-",
        },
      ],
      listing: l,
      requests: reqs,
      handovers: hands,
    });
  });

  // 7. Admin Database Management & Sanitized CSV Export
  const getEntityData = (entity: string): Record<string, unknown>[] | null => {
    switch (entity) {
      case "users":
        return users.map(sanitizeUser);
      case "food_listings":
        return listings as unknown as Record<string, unknown>[];
      case "donation_requests":
        return donationRequests as unknown as Record<string, unknown>[];
      case "volunteer_handovers":
        return handovers as unknown as Record<string, unknown>[];
      case "reviews":
        return reviews as unknown as Record<string, unknown>[];
      case "notifications":
        return notifications as unknown as Record<string, unknown>[];
      case "audit_logs":
        return auditLogs as unknown as Record<string, unknown>[];
      case "platform_settings":
        return [platformSettings as unknown as Record<string, unknown>];
      default:
        return null;
    }
  };

  const ENTITY_COLUMNS: Record<string, string[]> = {
    users: [
      "id",
      "full_name",
      "email",
      "role",
      "status",
      "verification_status",
      "license_number",
      "phone",
      "organization",
      "is_available",
      "created_at",
    ],
    food_listings: [
      "id",
      "title",
      "category",
      "quantity",
      "pickup_location",
      "status",
      "claimed_by_ngo_name",
      "is_flagged",
      "donor_id",
      "donor_name",
      "created_at",
    ],
    donation_requests: [
      "id",
      "listing_id",
      "listing_title",
      "requester_id",
      "requester_name",
      "requested_quantity",
      "status",
      "is_disputed",
      "created_at",
    ],
    volunteer_handovers: [
      "id",
      "request_id",
      "listing_id",
      "listing_title",
      "pickup_location",
      "dropoff_location",
      "volunteer_id",
      "volunteer_name",
      "status",
      "created_at",
    ],
    reviews: [
      "id",
      "donation_id",
      "restaurant_id",
      "ngo_id",
      "ngo_name",
      "rating",
      "comment",
      "created_at",
    ],
    notifications: ["id", "user_id", "message", "is_read", "created_at"],
    audit_logs: [
      "id",
      "admin_id",
      "admin_email",
      "action",
      "entity_type",
      "entity_id",
      "previous_value",
      "new_value",
      "created_at",
    ],
    platform_settings: [
      "id",
      "platform_name",
      "support_email",
      "support_phone",
      "default_expiry_hours",
      "enable_notifications",
      "maintenance_mode",
      "allow_new_registrations",
      "updated_at",
    ],
  };

  app.get("/api/admin/database/tables", (req: Request, res: Response) => {
    if (!requireAdminUser(req, res)) return;
    const tables = Object.keys(ENTITY_COLUMNS).map((entity) => ({
      entity,
      row_count: (getEntityData(entity) || []).length,
      columns: ENTITY_COLUMNS[entity],
    }));
    res.json({ tables });
  });

  app.get("/api/admin/database/stats", (req: Request, res: Response) => {
    if (!requireAdminUser(req, res)) return;
    const tableCounts: Record<string, number> = {};
    let total = 0;
    for (const entity of Object.keys(ENTITY_COLUMNS)) {
      const count = (getEntityData(entity) || []).length;
      tableCounts[entity] = count;
      total += count;
    }
    res.json({
      table_counts: tableCounts,
      total_records: total,
      engine: "ORM Managed Tables (Sanitized View)",
    });
  });

  app.get("/api/admin/database/export/:entity", (req: Request, res: Response) => {
    if (!requireAdminUser(req, res)) return;
    const entity = String(req.params.entity);
    const rows = getEntityData(entity);
    const cols = ENTITY_COLUMNS[entity];
    if (!rows || !cols) {
      res.status(404).json({ detail: `Unknown entity '${entity}'.` });
      return;
    }
    const escapeCsv = (val: unknown) => {
      if (val === null || val === undefined) return "";
      const str = String(val).replace(/"/g, '""');
      return /[,"\n]/.test(str) ? `"${str}"` : str;
    };
    const header = cols.join(",");
    const body = rows.map((row) => cols.map((c) => escapeCsv(row[c])).join(",")).join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${entity}_export.csv"`);
    res.send(`${header}\n${body}`);
  });

  app.get("/api/admin/database/:entity", (req: Request, res: Response) => {
    if (!requireAdminUser(req, res)) return;
    const entity = String(req.params.entity);
    const rows = getEntityData(entity);
    const cols = ENTITY_COLUMNS[entity];
    if (!rows || !cols) {
      res.status(404).json({ detail: `Unknown entity '${entity}'.` });
      return;
    }
    const search = String(req.query.search || "").trim().toLowerCase();
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.max(1, Number(req.query.page_size) || 20);

    let filtered = [...rows];
    if (search) {
      filtered = filtered.filter((row) =>
        Object.values(row).some(
          (val) => val !== null && val !== undefined && String(val).toLowerCase().includes(search)
        )
      );
    }
    const total = filtered.length;
    const start = (page - 1) * pageSize;
    res.json({
      entity,
      columns: cols,
      items: filtered.slice(start, start + pageSize),
      total,
      page,
      page_size: pageSize,
    });
  });

  app.get("/api/admin/database/:entity/:record_id", (req: Request, res: Response) => {
    if (!requireAdminUser(req, res)) return;
    const entity = String(req.params.entity);
    const rows = getEntityData(entity);
    if (!rows) {
      res.status(404).json({ detail: `Unknown entity '${entity}'.` });
      return;
    }
    const record = rows.find((r) => String(r.id) === String(req.params.record_id));
    if (!record) {
      res.status(404).json({ detail: "Record not found." });
      return;
    }
    res.json({ entity, record });
  });

  // 8. Admin Audit Logs
  app.get("/api/admin/audit-logs", (req: Request, res: Response) => {
    if (!requireAdminUser(req, res)) return;
    const search = String(req.query.search || "").trim().toLowerCase();
    const actionFilter = String(req.query.action || "").trim().toLowerCase();
    const entityFilter = String(req.query.entity_type || "").trim().toLowerCase();
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.max(1, Number(req.query.page_size) || 25);

    let filtered = [...auditLogs];
    if (search) {
      filtered = filtered.filter(
        (a) =>
          a.admin_email.toLowerCase().includes(search) ||
          a.action.toLowerCase().includes(search) ||
          a.entity_type.toLowerCase().includes(search) ||
          a.entity_id.toLowerCase().includes(search)
      );
    }
    if (actionFilter && actionFilter !== "all") {
      filtered = filtered.filter((a) => a.action.toLowerCase() === actionFilter);
    }
    if (entityFilter && entityFilter !== "all") {
      filtered = filtered.filter((a) => a.entity_type.toLowerCase() === entityFilter);
    }

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    res.json({
      items: filtered.slice(start, start + pageSize),
      total,
      page,
      page_size: pageSize,
    });
  });

  // 9. Admin Platform Settings & Broadcast Notifications
  app.get("/api/admin/settings", (req: Request, res: Response) => {
    if (!requireAdminUser(req, res)) return;
    res.json(platformSettings);
  });

  app.patch("/api/admin/settings", (req: Request, res: Response) => {
    const admin = requireAdminUser(req, res);
    if (!admin) return;
    const prev = { ...platformSettings };
    Object.assign(platformSettings, req.body, {
      updated_by_id: admin.id,
      updated_at: new Date().toISOString(),
    });
    recordAudit(
      admin,
      "PLATFORM_SETTINGS_UPDATED",
      "platform_settings",
      platformSettings.id,
      prev,
      platformSettings,
      req
    );
    res.json(platformSettings);
  });

  app.post("/api/admin/notifications/broadcast", (req: Request, res: Response) => {
    const admin = requireAdminUser(req, res);
    if (!admin) return;
    const { message, target_role } = req.body;
    if (!message || !String(message).trim()) {
      res.status(400).json({ detail: "Notification message is required." });
      return;
    }
    const target = String(target_role || "all").trim().toLowerCase();
    const recipients =
      target === "all"
        ? users
        : users.filter((u) => u.role.toLowerCase() === normalizeRole(target, true).toLowerCase());

    for (const u of recipients) {
      notifications.unshift({
        id: nextNotificationId++,
        user_id: u.id,
        message: `[Admin Announcement] ${String(message).trim()}`,
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }

    recordAudit(
      admin,
      "NOTIFICATION_BROADCAST",
      "notifications",
      target,
      null,
      { message: String(message).trim(), recipients_count: recipients.length },
      req
    );
    res.status(201).json({
      detail: "Broadcast notification sent.",
      recipients_count: recipients.length,
      target_role: target,
    });
  });

  // Vite middleware in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ANNAPURNA server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
