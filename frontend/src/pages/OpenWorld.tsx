import { useAuth } from '../contexts/AuthContext';
import './OpenWorld.css';

const OpenWorld = () => {
  const { user } = useAuth();

  return (
    <div className="open-world-container">
      <div className="world-header">
        <h1>Open World</h1>
        <p className="world-subtitle">Explore the Techverse in 3D (Coming Soon)</p>
      </div>
      
      <div className="world-content">
        <div className="world-card placeholder">
          <div className="world-icon">🌍</div>
          <h2>Welcome, {user?.display_name || 'Traveler'}</h2>
          <p>
            The Open World is currently under construction. 
            Soon you will be able to explore a virtual space, meet other tech enthusiasts, 
            and attend virtual events.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OpenWorld;
