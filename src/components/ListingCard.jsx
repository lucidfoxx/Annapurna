import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge.jsx";

// A single food listing shown in the feed and on "My Listings".
export default function ListingCard({ listing }) {
  return (
    <article className="card listing-card">
      <div className="listing-card-top">
        <StatusBadge status={listing.status} />
        <span className="listing-type">{listing.food_type}</span>
      </div>

      <h3 className="listing-title">
        <Link to={`/listing/${listing.id}`}>{listing.title}</Link>
      </h3>

      <p className="listing-desc">{listing.description}</p>

      <dl className="listing-meta">
        <div>
          <dt>Quantity</dt>
          <dd>{listing.quantity}</dd>
        </div>
        <div>
          <dt>Area</dt>
          <dd>{listing.area}</dd>
        </div>
        <div>
          <dt>Pickup</dt>
          <dd>{listing.pickup_window}</dd>
        </div>
      </dl>

      <footer className="listing-card-footer">
        <span className="listing-donor">By {listing.donor_name}</span>
        <Link className="btn btn-primary btn-sm" to={`/listing/${listing.id}`}>
          View
        </Link>
      </footer>
    </article>
  );
}
