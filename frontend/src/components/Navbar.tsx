import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-tech">Tech</span>
          <span className="logo-verse">verse</span>
        </Link>
        <ul className="navbar-menu">
          <li><Link to="/" className="navbar-link">Home</Link></li>
          <li><Link to="/editor" className="navbar-link">Editor</Link></li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
