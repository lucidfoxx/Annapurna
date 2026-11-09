import React, { useEffect, useState } from "react";
import {
  Trophy,
  Medal,
  Award,
  Star,
  Utensils,
  PackageCheck,
  Sparkles,
  MessageSquareQuote,
  X,
  RefreshCw,
  ShieldAlert,
  Clock,
  FileText,
  Upload,
  CheckCircle2,
} from "lucide-react";
import { api, endpoints, getErrorMessage } from "./lib/api";
import { useAuth } from "./context/AuthContext";

export interface ReviewItem {
  id: number;
  donation_id: number;
  restaurant_id: number;
  ngo_id: number;
  ngo_name: string;
  rating: number;
  comment?: string | null;
  tags?: string[];
  created_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  badge: "Gold" | "Silver" | "Bronze" | null;
  donor_id: number;
  donor_name: string;
  organization: string;
  completed_donations: number;
  estimated_meals: number;
  base_points: number;
  volume_points: number;
  consistency_bonus: number;
  total_points: number;
  average_rating: number;
  review_count: number;
  recent_reviews: ReviewItem[];
}

const REVIEW_TAG_OPTIONS = [
  "Well Packaged",
  "Punctual Handover",
  "Fresh Quality",
  "Generous Portions",
  "Hygienic Containers",
];

/* ============================================================================
   NGO LICENSE VERIFICATION BANNER & RE-SUBMISSION MODAL
   ============================================================================ */
export function NgoVerificationGateBanner() {
  const { user, refreshUser } = useAuth();
  const [showResubmit, setShowResubmit] = useState(false);
  const [licenseNumber, setLicenseNumber] = useState(user?.license_number || "");
  const [documentDataUrl, setDocumentDataUrl] = useState(user?.license_document_url || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  if (!user || user.role !== "NGO" || user.verification_status === "approved") {
    return null;
  }

  const isRejected = user.verification_status === "rejected";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setDocumentDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseNumber.trim()) {
      setErr("Official NGO License Number is required.");
      return;
    }
    setSubmitting(true);
    setErr(null);
    try {
      await api.patch(endpoints.auth.ngoLicense, {
        license_number: licenseNumber.trim(),
        license_document_url: documentDataUrl.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
      });
      await refreshUser();
      setShowResubmit(false);
      setMsg("Your updated license certificate has been submitted for administrator verification.");
    } catch (error) {
      setErr(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mb-6">
      <div
        className={`rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isRejected
            ? "bg-[#FDE8E8] border-[#F5C2C7] text-[#B42318]"
            : "bg-[#FEF3C7] border-[#FDE68A] text-[#92400E]"
        }`}
      >
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
              isRejected ? "bg-[#B42318] text-white" : "bg-[#D97706] text-white"
            }`}
          >
            {isRejected ? <ShieldAlert className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {isRejected
                  ? "NGO LICENSE VERIFICATION REJECTED"
                  : "NGO LICENSE VERIFICATION PENDING"}
              </span>
              {user.license_number && (
                <span className="px-2 py-0.5 rounded-md bg-white/70 font-mono text-[11px] font-semibold">
                  License #{user.license_number}
                </span>
              )}
            </div>
            <p className="text-[13.5px] font-bold mt-1">
              Your account is currently under verification. You will be able to claim and request donations once your license is approved by our team.
            </p>
            {isRejected && user.rejection_reason && (
              <p className="text-[12.5px] mt-1 font-medium">
                Administrator Rejection Reason: <strong>{user.rejection_reason}</strong>
              </p>
            )}
            {msg && (
              <p className="text-[12px] mt-1.5 font-semibold text-[#1E6F3D]">{msg}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => refreshUser()}
            className="px-3.5 py-2 rounded-xl bg-white/80 hover:bg-white text-[#1C1B18] text-[12px] font-semibold border border-black/10 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Check Status
          </button>
          <button
            type="button"
            onClick={() => {
              setLicenseNumber(user.license_number || "");
              setDocumentDataUrl(user.license_document_url || "");
              setPhone(user.phone || "");
              setAddress(user.address || "");
              setShowResubmit(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-[#1C1B18] hover:bg-[#33312B] text-white text-[12px] font-semibold whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isRejected ? "Re-submit License" : "Update Certificate"}
          </button>
        </div>
      </div>

      {showResubmit && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form
            onSubmit={handleResubmit}
            className="bg-white rounded-2xl border border-[#EAE6DF] max-w-md w-full p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#C84A20]">
                NGO COMPLIANCE SUBMISSION
              </span>
              <button
                type="button"
                onClick={() => setShowResubmit(false)}
                className="text-[#8A847C] hover:text-[#1C1B18]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <h3 className="font-display font-bold text-[18px] text-[#1C1B18]">
              Submit NGO License &amp; Certificate
            </h3>

            {err && (
              <div className="p-3 rounded-xl bg-[#FCEEE9] text-[#A83B18] text-[12px] font-medium">
                {err}
              </div>
            )}

            <div>
              <label className="block text-[12px] font-semibold text-[#1C1B18] mb-1">
                Official NGO Registration / License Number *
              </label>
              <input
                type="text"
                required
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="e.g. NGO-MH-2026-88912"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE6DF] text-[13px]"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#1C1B18] mb-1">
                Upload Registration Certificate (PDF / JPG / PNG)
              </label>
              <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-[#D5CFC4] bg-[#FAF9F6] text-[12.5px] font-semibold text-[#4A4640] hover:border-[#C84A20] cursor-pointer">
                <Upload className="w-4 h-4 text-[#C84A20]" />
                <span>
                  {documentDataUrl
                    ? "Certificate attached (Click to replace)"
                    : "Choose certificate file"}
                </span>
                <input
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/jpg"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-semibold text-[#1C1B18] mb-1">
                  Representative Phone
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98201 44510"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#EAE6DF] text-[13px]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#1C1B18] mb-1">
                  Operating Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="City & Street Address"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#EAE6DF] text-[13px]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResubmit(false)}
                className="px-4 py-2 rounded-xl text-[13px] font-medium text-[#6E6A63]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-[#2E7D52] text-white text-[13px] font-semibold disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit for Admin Review"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   NGO "LEAVE A REVIEW" MODAL (FOR DELIVERED CLAIMS)
   ============================================================================ */
export function NgoLeaveReviewModal({
  open,
  onClose,
  donationId,
  listingTitle,
  donorName,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  donationId: number | string;
  listingTitle: string;
  donorName: string;
  onSuccess: () => void;
}) {
  const [rating, setRating] = useState<number>(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([
    "Well Packaged",
    "Fresh Quality",
  ]);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!open) return null;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErr(null);
    try {
      await api.post(endpoints.donations.createReview(donationId), {
        rating,
        comment: comment.trim() || undefined,
        tags: selectedTags,
      });
      setComment("");
      onSuccess();
      onClose();
    } catch (error) {
      setErr(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-[#EAE6DF] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#2E7D52]">
            VERIFIED DELIVERY FEEDBACK
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8A847C] hover:text-[#1C1B18] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <h3 className="font-display font-bold text-[19px] text-[#1C1B18]">
            Rate {donorName}
          </h3>
          <p className="text-[12.5px] text-[#7D776F] mt-0.5">
            Delivered batch: <strong className="text-[#1C1B18]">{listingTitle}</strong>
          </p>
        </div>

        {err && (
          <div className="p-3 rounded-xl bg-[#FCEEE9] border border-[#F2C9B9] text-[#A83B18] text-[12.5px]">
            {err}
          </div>
        )}

        {/* 1-5 Star Selector */}
        <div>
          <label className="block text-[12px] font-semibold text-[#1C1B18] mb-2">
            Overall Quality &amp; Packaging Rating *
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1 ${
                  star <= rating
                    ? "bg-[#FEF3C7] border-[#F59E0B] text-[#D97706]"
                    : "bg-[#FAF9F6] border-[#EAE6DF] text-[#C8C3B9]"
                }`}
              >
                <Star
                  className={`w-5 h-5 ${star <= rating ? "fill-[#F59E0B] text-[#F59E0B]" : ""}`}
                />
              </button>
            ))}
            <span className="ml-2 text-[13px] font-bold text-[#1C1B18] tabular-nums">
              {rating} / 5 Stars
            </span>
          </div>
        </div>

        {/* Selectable Feedback Tags */}
        <div>
          <label className="block text-[12px] font-semibold text-[#1C1B18] mb-2">
            Highlight Tags (Optional)
          </label>
          <div className="flex flex-wrap gap-2">
            {REVIEW_TAG_OPTIONS.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-colors cursor-pointer ${
                    active
                      ? "bg-[#E8F3EC] border-[#2E7D52] text-[#1E5E3A]"
                      : "bg-[#FAF9F6] border-[#EAE6DF] text-[#6E6A63]"
                  }`}
                >
                  {active ? `✓ ${tag}` : tag}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-[#1C1B18] mb-1.5">
            Review Comment (Food quality, packaging, timeliness)
          </label>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share how this donation helped your community shelter..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE6DF] text-[13px] focus:outline-none focus:border-[#2E7D52]"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-[13px] font-medium text-[#6E6A63] hover:bg-[#F5F3EE] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded-xl bg-[#2E7D52] hover:bg-[#256643] text-white text-[13px] font-semibold disabled:opacity-50 cursor-pointer"
          >
            {submitting ? "Submitting Review..." : "Publish Verified Review"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ============================================================================
   DONOR LEADERBOARD ("RANK PAGE" /leaderboard & /ranks)
   ============================================================================ */
export function LeaderboardPage() {
  const [period, setPeriod] = useState<"all" | "monthly" | "weekly">("all");
  const [sortBy, setSortBy] = useState<"points" | "donations">("points");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state for inspecting a restaurant's verified NGO reviews
  const [selectedDonor, setSelectedDonor] = useState<LeaderboardEntry | null>(null);
  const [donorReviews, setDonorReviews] = useState<ReviewItem[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await api.get(endpoints.leaderboard.list(period, sortBy));
      setEntries(Array.isArray(res.data?.items) ? res.data.items : []);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load donor leaderboard."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [period, sortBy]);

  const openReviewsDrawer = async (entry: LeaderboardEntry) => {
    setSelectedDonor(entry);
    setDonorReviews(entry.recent_reviews || []);
    setLoadingReviews(true);
    try {
      const res = await api.get(endpoints.restaurants.reviews(entry.donor_id));
      if (Array.isArray(res.data?.items)) {
        setDonorReviews(res.data.items);
      }
    } catch {
      // fallback to recent_reviews
    } finally {
      setLoadingReviews(false);
    }
  };

  const renderRankBadge = (rank: number, badge: LeaderboardEntry["badge"]) => {
    if (rank === 1 || badge === "Gold") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#FEF3C7] border border-[#F59E0B]/40 text-[#B45309] text-[12px] font-extrabold tabular-nums">
          <Trophy className="w-3.5 h-3.5 text-[#D97706]" /> #1 Gold
        </span>
      );
    }
    if (rank === 2 || badge === "Silver") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#F1F5F9] border border-[#94A3B8]/40 text-[#334155] text-[12px] font-extrabold tabular-nums">
          <Medal className="w-3.5 h-3.5 text-[#64748B]" /> #2 Silver
        </span>
      );
    }
    if (rank === 3 || badge === "Bronze") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#FFEDD5] border border-[#F97316]/40 text-[#9A3412] text-[12px] font-extrabold tabular-nums">
          <Award className="w-3.5 h-3.5 text-[#EA580C]" /> #3 Bronze
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#F5F3EE] text-[#4A4640] font-mono text-[13px] font-bold tabular-nums">
        #{rank}
      </span>
    );
  };

  return (
    <div className="px-8 py-7 max-w-[1240px] mx-auto space-y-7">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-[0.13em] text-[#C84A20] uppercase mb-1.5">
            COMMUNITY IMPACT RANKINGS &amp; VERIFIED NGO REVIEWS
          </p>
          <h1 className="font-display text-[30px] font-extrabold text-[#1C1B18] tracking-[-0.02em] leading-tight">
            Donor Leaderboard &amp; Recognition
          </h1>
          <p className="text-[13.5px] text-[#7D776F] mt-1 max-w-2xl">
            Celebrating our top restaurant partners based on completed food rescues (10 pts/delivery), meal volume saved (+1 pt per 5 meals / 2 kg), monthly consistency (+5 pts), and verified NGO ratings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Period Filter */}
          <div className="inline-flex bg-white border border-[#EAE6DF] p-1 rounded-xl">
            {(
              [
                { id: "all", label: "All Time" },
                { id: "monthly", label: "This Month" },
                { id: "weekly", label: "This Week" },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  period === p.id
                    ? "bg-[#1C1B18] text-white"
                    : "text-[#6E6A63] hover:text-[#1C1B18]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Sort Mode Toggle */}
          <div className="inline-flex bg-white border border-[#EAE6DF] p-1 rounded-xl">
            <button
              onClick={() => setSortBy("points")}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                sortBy === "points"
                  ? "bg-[#C84A20] text-white"
                  : "text-[#6E6A63] hover:text-[#1C1B18]"
              }`}
            >
              Sort: Total Points
            </button>
            <button
              onClick={() => setSortBy("donations")}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                sortBy === "donations"
                  ? "bg-[#C84A20] text-white"
                  : "text-[#6E6A63] hover:text-[#1C1B18]"
              }`}
            >
              Sort: Donations Completed
            </button>
          </div>

          <button
            onClick={fetchLeaderboard}
            className="p-2.5 rounded-xl bg-white border border-[#EAE6DF] text-[#4A4640] hover:text-[#1C1B18] cursor-pointer"
            title="Refresh Leaderboard"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-[#FCEEE9] border border-[#F2C9B9] text-[#A83B18] text-[13px] px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Top 3 Podium Cards */}
      {entries.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {entries.slice(0, 3).map((top) => (
            <div
              key={top.donor_id}
              className={`bg-white rounded-2xl border p-6 flex flex-col justify-between relative overflow-hidden ${
                top.rank === 1
                  ? "border-[#F59E0B] shadow-sm"
                  : "border-[#EAE6DF]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  {renderRankBadge(top.rank, top.badge)}
                  <div className="flex items-center gap-1 text-[12.5px] font-bold text-[#D97706] tabular-nums">
                    <Star className="w-4 h-4 fill-[#F59E0B] text-[#F59E0B]" />
                    <span>
                      {top.average_rating > 0 ? top.average_rating.toFixed(1) : "New"}
                    </span>
                    <span className="text-[#8A847C] font-normal">
                      ({top.review_count})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-2xl bg-[#FCEEE9] text-[#C84A20] font-display font-extrabold text-[16px] flex items-center justify-center shrink-0">
                    {(top.organization || top.donor_name).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display font-bold text-[17px] text-[#1C1B18] truncate">
                      {top.organization || top.donor_name}
                    </h3>
                    <p className="text-[12px] text-[#7D776F] truncate">
                      Donor Account: {top.donor_name}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-[#FAF9F6] border border-[#EAE6DF] text-center mb-4">
                  <div>
                    <div className="text-[10.5px] font-bold uppercase text-[#8A847C]">
                      Points
                    </div>
                    <div className="font-display font-extrabold text-[18px] text-[#C84A20] tabular-nums mt-0.5">
                      {top.total_points}
                    </div>
                  </div>
                  <div className="border-x border-[#EAE6DF]">
                    <div className="text-[10.5px] font-bold uppercase text-[#8A847C]">
                      Deliveries
                    </div>
                    <div className="font-display font-extrabold text-[18px] text-[#1C1B18] tabular-nums mt-0.5">
                      {top.completed_donations}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10.5px] font-bold uppercase text-[#8A847C]">
                      Meals Fed
                    </div>
                    <div className="font-display font-extrabold text-[18px] text-[#2E7D52] tabular-nums mt-0.5">
                      {top.estimated_meals}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => openReviewsDrawer(top)}
                className="w-full py-2 rounded-xl bg-[#F5F3EE] hover:bg-[#EAE6DF] text-[#1C1B18] text-[12px] font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <MessageSquareQuote className="w-3.5 h-3.5 text-[#C84A20]" />
                <span>
                  Inspect NGO Reviews ({top.review_count})
                </span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Full Leaderboard Table */}
      <div className="bg-white border border-[#EAE6DF] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#EAE6DF] flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-[16px] text-[#1C1B18]">
              Complete Restaurant &amp; Donor Rankings
            </h2>
            <p className="text-[12px] text-[#7D776F]">
              Formula: 10 pts per delivered batch + 1 pt per 5 meals (or 2 kg) + 5 bonus pts for 5+ monthly deliveries
            </p>
          </div>
          <span className="text-[12px] font-semibold text-[#8A847C] tabular-nums">
            {entries.length} Active Donors Ranked
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#EAE6DF] bg-[#FAF9F6] text-[11px] font-bold uppercase tracking-wider text-[#8A847C]">
                <th className="py-3.5 px-5">Rank</th>
                <th className="py-3.5 px-4">Restaurant / Donor</th>
                <th className="py-3.5 px-4 text-right">Completed Donations</th>
                <th className="py-3.5 px-4 text-right">Estimated Meals Fed</th>
                <th className="py-3.5 px-4 text-right">Total Points</th>
                <th className="py-3.5 px-4">Average Rating</th>
                <th className="py-3.5 px-5 text-right">Verified Reviews</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE6DF] text-[13.5px]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#7D776F]">
                    Calculating donor rankings and points...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#7D776F]">
                    No donor records found for this timeframe.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr
                    key={entry.donor_id}
                    className="hover:bg-[#FAF9F6] transition-colors"
                  >
                    <td className="py-4 px-5 whitespace-nowrap">
                      {renderRankBadge(entry.rank, entry.badge)}
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#FCEEE9] text-[#C84A20] font-bold text-[13px] flex items-center justify-center shrink-0">
                          {(entry.organization || entry.donor_name).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-[#1C1B18]">
                            {entry.organization || entry.donor_name}
                          </div>
                          <div className="text-[11.5px] text-[#7D776F]">
                            {entry.donor_name}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-right font-mono font-bold text-[#1C1B18] tabular-nums">
                      <span className="inline-flex items-center gap-1.5">
                        <PackageCheck className="w-3.5 h-3.5 text-[#2E7D52]" />
                        {entry.completed_donations}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right font-mono font-bold text-[#2E7D52] tabular-nums">
                      <span className="inline-flex items-center gap-1.5">
                        <Utensils className="w-3.5 h-3.5" />
                        {entry.estimated_meals.toLocaleString()} meals
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right tabular-nums">
                      <div className="font-display font-extrabold text-[16px] text-[#C84A20]">
                        {entry.total_points} pts
                      </div>
                      <div className="text-[10.5px] text-[#8A847C]">
                        {entry.base_points} base + {entry.volume_points} vol
                        {entry.consistency_bonus > 0
                          ? ` + ${entry.consistency_bonus} bonus`
                          : ""}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      {entry.review_count > 0 ? (
                        <div className="flex items-center gap-1.5 tabular-nums">
                          <div className="flex items-center text-[#F59E0B]">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3.5 h-3.5 ${
                                  s <= Math.round(entry.average_rating)
                                    ? "fill-[#F59E0B] text-[#F59E0B]"
                                    : "text-[#DED8CA]"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="font-bold text-[#1C1B18] text-[12.5px]">
                            {entry.average_rating.toFixed(1)}
                          </span>
                          <span className="text-[11.5px] text-[#8A847C]">
                            ({entry.review_count})
                          </span>
                        </div>
                      ) : (
                        <span className="text-[12px] text-[#8A847C]">No reviews yet</span>
                      )}
                    </td>

                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={() => openReviewsDrawer(entry)}
                        className="px-3 py-1.5 rounded-xl bg-[#F5F3EE] hover:bg-[#EAE6DF] text-[#1C1B18] text-[12px] font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        View Reviews ({entry.review_count})
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restaurant Reviews Inspection Modal */}
      {selectedDonor && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE6DF] rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-xl max-h-[88vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 border-b border-[#EAE6DF] pb-4">
              <div>
                <div className="text-[10.5px] font-bold uppercase tracking-widest text-[#C84A20]">
                  VERIFIED NGO RECIPIENT FEEDBACK
                </div>
                <h3 className="font-display font-bold text-[21px] text-[#1C1B18]">
                  {selectedDonor.organization || selectedDonor.donor_name}
                </h3>
                <div className="flex items-center gap-3 mt-1 text-[12.5px] text-[#7D776F] tabular-nums">
                  <span className="inline-flex items-center gap-1 font-bold text-[#D97706]">
                    <Star className="w-4 h-4 fill-[#F59E0B] text-[#F59E0B]" />
                    {selectedDonor.average_rating > 0
                      ? `${selectedDonor.average_rating.toFixed(1)} / 5.0`
                      : "Unrated"}
                  </span>
                  <span>·</span>
                  <span>{selectedDonor.completed_donations} Completed Deliveries</span>
                  <span>·</span>
                  <span>{selectedDonor.total_points} Total Points</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedDonor(null)}
                className="p-1.5 rounded-lg text-[#8A847C] hover:text-[#1C1B18]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingReviews ? (
              <div className="py-8 text-center text-[13px] text-[#7D776F]">
                Loading verified NGO reviews...
              </div>
            ) : donorReviews.length === 0 ? (
              <div className="py-8 text-center bg-[#FAF9F6] rounded-xl border border-[#EAE6DF] p-6">
                <p className="text-[13.5px] font-semibold text-[#1C1B18]">
                  No NGO reviews submitted yet
                </p>
                <p className="text-[12px] text-[#7D776F] mt-1">
                  Reviews can only be submitted by verified NGOs after a food donation reaches Delivered status.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {donorReviews.map((rv) => (
                  <div
                    key={rv.id}
                    className="p-4 rounded-xl bg-[#FAF9F6] border border-[#EAE6DF] space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#E8F3EC] text-[#1E5E3A] text-[11px] font-bold">
                          <CheckCircle2 className="w-3 h-3" /> {rv.ngo_name}
                        </span>
                        <span className="text-[11px] text-[#8A847C] tabular-nums">
                          Donation #{rv.donation_id}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[#F59E0B] tabular-nums">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= rv.rating
                                ? "fill-[#F59E0B] text-[#F59E0B]"
                                : "text-[#DED8CA]"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {rv.tags && rv.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {rv.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-md bg-white border border-[#EAE6DF] text-[11px] font-semibold text-[#4A4640]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {rv.comment && (
                      <p className="text-[13px] text-[#1C1B18] leading-relaxed">
                        &ldquo;{rv.comment}&rdquo;
                      </p>
                    )}

                    <div className="text-[11px] text-[#8A847C] tabular-nums">
                      Reviewed on {new Date(rv.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedDonor(null)}
                className="px-4 py-2 rounded-xl bg-[#1C1B18] text-white text-[12.5px] font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
