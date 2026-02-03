import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        <Link to={isAuthenticated ? "/feed" : "/"} className="navbar-logo">
          <span className="logo-icon">⚡</span>
          Techverse
        </Link>
        <ul className="navbar-menu">
          {!isAuthenticated && (
            <li>
              <Link 
                to="/" 
                className={`navbar-link ${isActive('/') ? 'active' : ''}`}
              >
                Home
              </Link>
            </li>
          )}
          
          {isAuthenticated && (
            <li>
              <Link 
                to="/feed" 
                className={`navbar-link ${isActive('/feed') ? 'active' : ''}`}
              >
                Feed
              </Link>
            </li>
          )}
          
          <li>
            <Link 
              to="/posts" 
              className={`navbar-link ${isActive('/posts') ? 'active' : ''}`}
            >
              Blogs
            </Link>
          </li>

          {isAuthenticated && (
            <li>
              <Link 
                to="/editor" 
                className={`navbar-link ${isActive('/editor') || location.pathname.startsWith('/editor') ? 'active' : ''}`}
              >
                Write
              </Link>
            </li>
          )}

          {isAuthenticated && (
            <li>
              <Link 
                to="/open-world" 
                className={`navbar-link ${isActive('/open-world') ? 'active' : ''}`}
              >
                Open World
              </Link>
            </li>
          )}

          {!isAuthenticated && (
            <li>
              <Link 
                to="/about" 
                className={`navbar-link ${isActive('/about') ? 'active' : ''}`}
              >
                About
              </Link>
            </li>
          )}
        </ul>
        
        <div className="navbar-auth">
          {isAuthenticated ? (
            <div className="user-menu">
              <button 
                className="user-button" 
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <span className="user-avatar">
                  {user?.display_name?.charAt(0).toUpperCase() || 'U'}
                </span>
                <span className="user-name">{user?.display_name}</span>
              </button>
              {menuOpen && (
                <div className="user-dropdown">
                  <div className="dropdown-header">
                    <span className="dropdown-name">{user?.display_name}</span>
                    <span className="dropdown-email">{user?.email}</span>
                  </div>
                  <div className="dropdown-divider"></div>
                  <Link to="/editor" className="dropdown-item" onClick={() => setMenuOpen(false)}>
                    My Blogs
                  </Link>
                  <button className="dropdown-item" onClick={() => { logout(); setMenuOpen(false); }}>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/signin" className="btn btn-ghost">Sign In</Link>
              <Link to="/signup" className="btn btn-primary">Create Account</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
