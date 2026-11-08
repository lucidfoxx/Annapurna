// A small message that appears in the corner of the screen.
// Usage: <Toast message="Saved!" type="success" onClose={() => setMessage("")} />
export default function Toast({ message, type = "success", onClose }) {
  if (!message) return null;

  return (
    <div className={`toast toast-${type}`} role="status">
      <span>{message}</span>
      {onClose && (
        <button className="toast-close" onClick={onClose} aria-label="Dismiss message">
          ×
        </button>
      )}
    </div>
  );
}
