import { Routes, Route, Link } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Feed from "./pages/Feed.jsx";
import CreateListing from "./pages/CreateListing.jsx";
import MyListings from "./pages/MyListings.jsx";
import MyRequests from "./pages/MyRequests.jsx";
import ListingDetail from "./pages/ListingDetail.jsx";
import Dashboard from "./pages/Dashboard.jsx";

// Simple fallback for unknown URLs.
function NotFound() {
  return (
    <section className="page-section">
      <h1 className="page-title">Page not found</h1>
      <p className="page-subtitle">The page you are looking for does not exist.</p>
      <Link className="btn btn-primary" to="/">
        Back to Feed
      </Link>
    </section>
  );
}

export default function App() {
  return (
    <div className="app">
      <Navbar />

      <main className="page">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Feed />} />
          <Route path="/create" element={<CreateListing />} />
          <Route path="/my-listings" element={<MyListings />} />
          <Route path="/my-requests" element={<MyRequests />} />
          <Route path="/listing/:id" element={<ListingDetail />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}
