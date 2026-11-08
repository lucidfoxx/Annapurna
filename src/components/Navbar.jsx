import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// The navigation links change depending on the user's role.
const LINKS_BY_ROLE = {
  donor: [
    { to: "/", label: "Feed" },
    { to: "/create", label: "Create Listing" },
    { to: "/my-listings", label: "My Listings" },
    { to: "/dashboard", label: "Dashboard" },
  ],
  recipient: [
    { to: "/", label: "Feed" },
    { to: "/my-requests", label: "My Requests" },
    { to: "/dashboard", label: "Dashboard" },
  ],
  volunteer: [
    { to: "/", label: "Feed" },
    { to: "/dashboard", label: "Dashboard" },
  ],
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = user ? LINKS_BY_ROLE[user.role] || [] : [];

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="brand-mark">SP</span>
          <span className="brand-text">SharePlate</span>
        </Link>

        <nav className="navbar-links">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) => `nav-link${isActive ? " nav-link-active" : ""}`}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="navbar-user">
          {user ? (
            <>
              <span className="user-name">{user.name}</span>
              <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link className="btn btn-secondary btn-sm" to="/login">
                Login
              </Link>
              <Link className="btn btn-primary btn-sm" to="/register">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
