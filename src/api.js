// ---------------------------------------------------------------------------
// SharePlate API layer
// ---------------------------------------------------------------------------
// All data calls live here so pages never talk to the backend directly.
//
// For now every function uses fake ("mock") data kept in memory. When the
// FastAPI backend is ready, replace the body of each function with a real
// fetch() call to the matching route, for example:
//
//   const res = await fetch("/listings");
//   return res.json();
//
// The routes we will use are documented above each function so the frontend
// and backend stay in sync.
// ---------------------------------------------------------------------------

const LATENCY = 300; // fake network delay (milliseconds)

// ---- Fake demo accounts ---------------------------------------------------
// These are fictional users for testing only.
export const demoAccounts = [
  { name: "Maya Patel", email: "maya@demo.com", password: "demo123", role: "donor" },
  { name: "Helping Hands NGO", email: "helping@demo.com", password: "demo123", role: "recipient" },
  { name: "Sam Lee", email: "sam@demo.com", password: "demo123", role: "volunteer" },
];

// All registered users (mock "database").
let users = [
  { id: 1, name: "Maya Patel", email: "maya@demo.com", password: "demo123", role: "donor", phone: "555-0101" },
  { id: 2, name: "Helping Hands NGO", email: "helping@demo.com", password: "demo123", role: "recipient", phone: "555-0102" },
  { id: 3, name: "Sam Lee", email: "sam@demo.com", password: "demo123", role: "volunteer", phone: "555-0103" },
  { id: 4, name: "Sunrise Bakery", email: "sunrise@demo.com", password: "demo123", role: "donor", phone: "555-0104" },
  { id: 5, name: "Green Grocer", email: "green@demo.com", password: "demo123", role: "donor", phone: "555-0105" },
  { id: 6, name: "Hope Kitchen", email: "hope@demo.com", password: "demo123", role: "recipient", phone: "555-0106" },
];

let nextUserId = 7;

// All food listings (mock "database").
let listings = [
  {
    id: 1,
    donor_id: 1,
    donor_name: "Maya Patel",
    title: "Fresh vegetable boxes",
    description: "Surplus seasonal vegetables from today's market. Please bring your own bags.",
    food_type: "Vegetables",
    quantity: "12 boxes",
    area: "Downtown",
    address: "12 Market Street, Downtown",
    pickup_window: "Today, 5:00 PM - 7:00 PM",
    status: "available",
    pickup_code: "4821",
    created_at: "2026-11-08T08:30:00.000Z",
  },
  {
    id: 2,
    donor_id: 4,
    donor_name: "Sunrise Bakery",
    title: "Assorted bread loaves",
    description: "Freshly baked bread left over from this morning. Best consumed today or frozen.",
    food_type: "Bakery",
    quantity: "30 loaves",
    area: "Riverside",
    address: "8 River Road, Riverside",
    pickup_window: "Today, 4:00 PM - 6:00 PM",
    status: "available",
    pickup_code: "7350",
    created_at: "2026-11-08T09:15:00.000Z",
  },
  {
    id: 3,
    donor_id: 1,
    donor_name: "Maya Patel",
    title: "Cooked rice and dal",
    description: "Freshly cooked rice and dal prepared for a cancelled event. Still warm.",
    food_type: "Cooked meals",
    quantity: "40 portions",
    area: "Downtown",
    address: "45 Oak Avenue, Downtown",
    pickup_window: "Today, 6:00 PM - 8:00 PM",
    status: "requested",
    pickup_code: "1294",
    created_at: "2026-11-08T10:00:00.000Z",
  },
  {
    id: 4,
    donor_id: 5,
    donor_name: "Green Grocer",
    title: "Milk cartons (expiring soon)",
    description: "Sealed milk cartons nearing their best-before date. Refrigerated since delivery.",
    food_type: "Dairy",
    quantity: "24 cartons",
    area: "Northside",
    address: "3 Hill Street, Northside",
    pickup_window: "Tomorrow, 9:00 AM - 11:00 AM",
    status: "accepted",
    pickup_code: "6632",
    created_at: "2026-11-07T14:20:00.000Z",
  },
  {
    id: 5,
    donor_id: 4,
    donor_name: "Sunrise Bakery",
    title: "Fruit crates",
    description: "Mixed fruit crates with slightly bruised pieces, perfect for smoothies or desserts.",
    food_type: "Fruit",
    quantity: "6 crates",
    area: "Riverside",
    address: "8 River Road, Riverside",
    pickup_window: "Today, 2:00 PM - 4:00 PM",
    status: "collected",
    pickup_code: "9081",
    created_at: "2026-11-07T11:00:00.000Z",
  },
  {
    id: 6,
    donor_id: 1,
    donor_name: "Maya Patel",
    title: "Sandwich trays",
    description: "Assorted vegetarian sandwich trays prepared for an office lunch that was cancelled.",
    food_type: "Cooked meals",
    quantity: "8 trays",
    area: "Downtown",
    address: "45 Oak Avenue, Downtown",
    pickup_window: "Yesterday, 12:00 PM - 2:00 PM",
    status: "completed",
    pickup_code: "2147",
    created_at: "2026-11-06T09:00:00.000Z",
  },
  {
    id: 7,
    donor_id: 5,
    donor_name: "Green Grocer",
    title: "Canned goods",
    description: "A mix of canned beans and vegetables with slightly damaged labels.",
    food_type: "Pantry",
    quantity: "15 cans",
    area: "Northside",
    address: "3 Hill Street, Northside",
    pickup_window: "Today, 10:00 AM - 12:00 PM",
    status: "cancelled",
    pickup_code: "5503",
    created_at: "2026-11-07T08:00:00.000Z",
  },
  {
    id: 8,
    donor_id: 1,
    donor_name: "Maya Patel",
    title: "Yogurt packs",
    description: "Individual yogurt cups that reached their use-by date this morning.",
    food_type: "Dairy",
    quantity: "18 cups",
    area: "Downtown",
    address: "45 Oak Avenue, Downtown",
    pickup_window: "Yesterday, 8:00 AM - 10:00 AM",
    status: "expired",
    pickup_code: "8012",
    created_at: "2026-11-05T07:00:00.000Z",
  },
];

// All pickup requests (mock "database").
let requests = [
  {
    id: 1,
    listing_id: 3,
    recipient_id: 2,
    recipient_name: "Helping Hands NGO",
    message: "We can serve 40 people at tonight's community dinner.",
    status: "pending",
    created_at: "2026-11-08T10:30:00.000Z",
  },
  {
    id: 2,
    listing_id: 4,
    recipient_id: 6,
    recipient_name: "Hope Kitchen",
    message: "We need milk for our breakfast program.",
    status: "accepted",
    created_at: "2026-11-07T15:00:00.000Z",
  },
  {
    id: 3,
    listing_id: 5,
    recipient_id: 2,
    recipient_name: "Helping Hands NGO",
    message: "Our van is available for pickup this afternoon.",
    status: "accepted",
    created_at: "2026-11-07T11:30:00.000Z",
  },
  {
    id: 4,
    listing_id: 6,
    recipient_id: 6,
    recipient_name: "Hope Kitchen",
    message: "These will be perfect for our lunch service.",
    status: "accepted",
    created_at: "2026-11-06T09:45:00.000Z",
  },
  {
    id: 5,
    listing_id: 1,
    recipient_id: 2,
    recipient_name: "Helping Hands NGO",
    message: "We can pick these up around 6 PM.",
    status: "declined",
    created_at: "2026-11-08T09:00:00.000Z",
  },
];

let nextRequestId = 6;

// ---- Small helpers --------------------------------------------------------

// Simulate a short network delay so loading states can be tested.
const wait = (value) => new Promise((resolve) => setTimeout(() => resolve(value), LATENCY));

// Remove the password before sending a user to the UI.
function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
  };
}

// Read the current user from the saved demo token.
function currentUser() {
  const token = localStorage.getItem("shareplate_token");
  if (!token) return null;
  const id = Number(token.replace("demo-token-", ""));
  return users.find((user) => user.id === id) || null;
}

function requireUser() {
  const user = currentUser();
  if (!user) throw new Error("You must be logged in.");
  return user;
}

function requireRole(role) {
  const user = requireUser();
  if (user.role !== role) throw new Error(`Only a ${role} can do this.`);
  return user;
}

function findListing(id) {
  const listing = listings.find((item) => item.id === Number(id));
  if (!listing) throw new Error("Listing not found.");
  return listing;
}

// Hide the pickup code unless the current user is the donor who owns it.
function publicListing(listing) {
  const user = currentUser();
  const copy = { ...listing };
  if (!user || user.id !== listing.donor_id) {
    delete copy.pickup_code;
  }
  return copy;
}

// Build a simple timeline for a listing based on its current status.
function buildTimeline(listing) {
  const flow = ["available", "requested", "accepted", "collected", "completed"];
  const notes = {
    available: "Listing published and available for requests.",
    requested: "A recipient requested this listing.",
    accepted: "The donor accepted a request.",
    collected: "Food was collected.",
    completed: "Donation completed.",
    cancelled: "Listing cancelled by the donor.",
    expired: "Listing expired before pickup.",
  };

  let steps;
  if (listing.status === "cancelled") {
    steps = ["available", "cancelled"];
  } else if (listing.status === "expired") {
    steps = ["available", "expired"];
  } else {
    const index = flow.indexOf(listing.status);
    steps = flow.slice(0, Math.max(index, 0) + 1);
  }

  const start = new Date(listing.created_at).getTime();
  return steps.map((status, index) => ({
    id: listing.id * 100 + index,
    listing_id: listing.id,
    status,
    note: notes[status],
    created_at: new Date(start + index * 60 * 60 * 1000).toISOString(),
  }));
}

// ---- Auth ----------------------------------------------------------------

// POST /auth/register
export async function register({ name, email, password, role, phone = "" }) {
  const cleanEmail = email.trim().toLowerCase();
  if (users.some((user) => user.email === cleanEmail)) {
    throw new Error("That email is already registered.");
  }

  const user = {
    id: nextUserId++,
    name: name.trim(),
    email: cleanEmail,
    password,
    role,
    phone: phone.trim(),
  };

  users = [...users, user];
  localStorage.setItem("shareplate_token", `demo-token-${user.id}`);
  return wait({ user: publicUser(user) });
}

// POST /auth/login
export async function login({ email, password }) {
  const cleanEmail = email.trim().toLowerCase();
  const user = users.find((item) => item.email === cleanEmail && item.password === password);
  if (!user) throw new Error("Invalid email or password.");

  localStorage.setItem("shareplate_token", `demo-token-${user.id}`);
  return wait({ user: publicUser(user) });
}

// GET /auth/me
export async function me() {
  const user = currentUser();
  return wait(user ? publicUser(user) : null);
}

// Clear the saved demo session.
export function logout() {
  localStorage.removeItem("shareplate_token");
}

// ---- Listings ------------------------------------------------------------

// GET /listings?food_type=&area=&search=
export async function getListings({ food_type = "", area = "", search = "" } = {}) {
  const term = search.trim().toLowerCase();

  const result = listings.filter((listing) => {
    if (listing.status === "cancelled" || listing.status === "expired") return false;
    if (food_type && listing.food_type !== food_type) return false;
    if (area && listing.area !== area) return false;
    if (term) {
      const text = `${listing.title} ${listing.description} ${listing.donor_name}`.toLowerCase();
      if (!text.includes(term)) return false;
    }
    return true;
  });

  return wait(result.map(publicListing));
}

// GET /listings/mine
export async function getMyListings() {
  const user = requireRole("donor");
  return wait(listings.filter((listing) => listing.donor_id === user.id).map(publicListing));
}

// POST /listings
export async function createListing(data) {
  const user = requireRole("donor");
  const newId = listings.length ? Math.max(...listings.map((item) => item.id)) + 1 : 1;

  const listing = {
    id: newId,
    donor_id: user.id,
    donor_name: user.name,
    title: data.title.trim(),
    description: (data.description || "").trim(),
    food_type: data.food_type,
    quantity: data.quantity.trim(),
    area: data.area.trim(),
    address: (data.address || "").trim(),
    pickup_window: (data.pickup_window || "").trim(),
    status: "available",
    pickup_code: String(Math.floor(1000 + Math.random() * 9000)),
    created_at: new Date().toISOString(),
  };

  listings = [listing, ...listings];
  return wait(publicListing(listing));
}

// GET /listings/{id}
export async function getListing(id) {
  return wait(publicListing(findListing(id)));
}

// PUT /listings/{id}
export async function updateListing(id, data) {
  const user = requireRole("donor");
  const listing = findListing(id);

  if (listing.donor_id !== user.id) {
    throw new Error("You can only edit your own listings.");
  }

  listing.title = data.title ?? listing.title;
  listing.description = data.description ?? listing.description;
  listing.food_type = data.food_type ?? listing.food_type;
  listing.quantity = data.quantity ?? listing.quantity;
  listing.area = data.area ?? listing.area;
  listing.address = data.address ?? listing.address;
  listing.pickup_window = data.pickup_window ?? listing.pickup_window;

  return wait(publicListing(listing));
}

// POST /listings/{id}/cancel
export async function cancelListing(id) {
  const user = requireRole("donor");
  const listing = findListing(id);

  if (listing.donor_id !== user.id) {
    throw new Error("You can only cancel your own listings.");
  }
  if (!["available", "requested", "accepted"].includes(listing.status)) {
    throw new Error("This listing can no longer be cancelled.");
  }

  listing.status = "cancelled";
  return wait(publicListing(listing));
}

// ---- Requests ------------------------------------------------------------

// POST /listings/{id}/requests
export async function createRequest(listingId, { message = "" } = {}) {
  const user = requireRole("recipient");
  const listing = findListing(listingId);

  if (!["available", "requested"].includes(listing.status)) {
    throw new Error("This listing is not open for requests.");
  }

  const duplicate = requests.find(
    (item) =>
      item.listing_id === listing.id &&
      item.recipient_id === user.id &&
      item.status === "pending"
  );
  if (duplicate) throw new Error("You already have a pending request for this listing.");

  const request = {
    id: nextRequestId++,
    listing_id: listing.id,
    recipient_id: user.id,
    recipient_name: user.name,
    message: message.trim(),
    status: "pending",
    created_at: new Date().toISOString(),
  };

  requests = [request, ...requests];
  listing.status = "requested";
  return wait({ ...request });
}

// GET /listings/{id}/requests
export async function getListingRequests(listingId) {
  const user = requireUser();
  const listing = findListing(listingId);

  if (listing.donor_id !== user.id && user.role !== "recipient") {
    throw new Error("You are not allowed to view these requests.");
  }

  return wait(requests.filter((item) => item.listing_id === listing.id).map((item) => ({ ...item })));
}

// GET /requests/mine
export async function getMyRequests() {
  const user = requireRole("recipient");
  return wait(
    requests
      .filter((item) => item.recipient_id === user.id)
      .map((item) => {
        const listing = listings.find((entry) => entry.id === item.listing_id);
        return { ...item, listing: listing ? publicListing(listing) : null };
      })
  );
}

// POST /requests/{id}/accept
export async function acceptRequest(requestId) {
  const user = requireRole("donor");
  const request = requests.find((item) => item.id === Number(requestId));
  if (!request) throw new Error("Request not found.");

  const listing = findListing(request.listing_id);
  if (listing.donor_id !== user.id) throw new Error("Only the donor can accept this request.");
  if (request.status !== "pending") throw new Error("This request is no longer pending.");

  request.status = "accepted";
  requests.forEach((item) => {
    if (item.listing_id === listing.id && item.id !== request.id && item.status === "pending") {
      item.status = "declined";
    }
  });
  listing.status = "accepted";

  return wait({ ...request });
}

// POST /requests/{id}/decline
export async function declineRequest(requestId) {
  const user = requireRole("donor");
  const request = requests.find((item) => item.id === Number(requestId));
  if (!request) throw new Error("Request not found.");

  const listing = findListing(request.listing_id);
  if (listing.donor_id !== user.id) throw new Error("Only the donor can decline this request.");
  if (request.status !== "pending") throw new Error("This request is no longer pending.");

  request.status = "declined";

  const stillPending = requests.some(
    (item) => item.listing_id === listing.id && item.status === "pending"
  );
  if (!stillPending && listing.status === "requested") {
    listing.status = "available";
  }

  return wait({ ...request });
}

// ---- Handover ------------------------------------------------------------

// POST /listings/{id}/collect
export async function collectListing(listingId, pickupCode) {
  const user = requireUser();
  const listing = findListing(listingId);

  if (!["donor", "volunteer"].includes(user.role)) {
    throw new Error("Only a donor or volunteer can confirm collection.");
  }
  if (listing.status !== "accepted") {
    throw new Error("This listing is not ready for collection.");
  }
  if (listing.pickup_code !== String(pickupCode).trim()) {
    throw new Error("Incorrect pickup code.");
  }

  listing.status = "collected";
  return wait(publicListing(listing));
}

// POST /listings/{id}/complete
export async function completeListing(listingId) {
  const user = requireUser();
  const listing = findListing(listingId);

  if (listing.donor_id !== user.id && user.role !== "volunteer") {
    throw new Error("Only the donor or a volunteer can complete this listing.");
  }
  if (listing.status !== "collected") {
    throw new Error("Only collected listings can be completed.");
  }

  listing.status = "completed";
  return wait(publicListing(listing));
}

// GET /listings/{id}/timeline
export async function getTimeline(listingId) {
  return wait(buildTimeline(findListing(listingId)));
}

// ---- Stats ---------------------------------------------------------------

// GET /stats
export async function getStats() {
  const user = requireUser();

  let visible = listings;
  if (user.role === "donor") {
    visible = listings.filter((listing) => listing.donor_id === user.id);
  }

  const count = (status) => visible.filter((listing) => listing.status === status).length;

  return wait({
    total_listings: visible.length,
    available: count("available"),
    requested: count("requested"),
    accepted: count("accepted"),
    collected: count("collected"),
    completed: count("completed"),
    cancelled: count("cancelled"),
    expired: count("expired"),
    meals_saved: count("completed") * 25,
  });
}
