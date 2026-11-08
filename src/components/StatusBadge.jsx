// Human-friendly labels for each listing status.
const LABELS = {
  available: "Available",
  requested: "Requested",
  accepted: "Accepted",
  collected: "Collected",
  completed: "Completed",
  cancelled: "Cancelled",
  expired: "Expired",
};

export default function StatusBadge({ status }) {
  const label = LABELS[status] || status;
  return <span className={`badge badge-${status}`}>{label}</span>;
}
