import { useNavigate, useLocation } from 'react-router-dom';
import './Header.css';

export default function Header() {
    const navigate = useNavigate();
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAuthenticated = !!localStorage.getItem('token');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const handleLogoClick = () => {
        if (isAuthenticated) {
            navigate('/dashboard');
        } else {
            navigate('/');
        }
    };

    // Don't show header on auth page
    if (location.pathname === '/') {
        return null;
    }

    return (
        <header className="header">
            <div className="header-container">
                <div className="header-left">
                    <div className="logo" onClick={handleLogoClick}>
                        <div className="logo-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 11H1l8-8 8 8h-8v8z"/>
                            </svg>
                        </div>
                        <h1>TaskFlow</h1>
                    </div>
                </div>

                <nav className="header-nav">
                    <ul className="nav-list">
                        <li className="nav-item">
                            <button 
                                className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
                                onClick={() => navigate('/dashboard')}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                                    <polyline points="9,22 9,12 15,12 15,22"/>
                                </svg>
                                Dashboard
                            </button>
                        </li>
                    </ul>
                </nav>

                <div className="header-right">
                    {isAuthenticated && (
                        <div className="user-menu">
                            <div className="user-info">
                                <div className="user-avatar">
                                    {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                                </div>
                                <div className="user-details">
                                    <span className="user-name">{user.name || 'User'}</span>
                                    <span className="user-email">{user.email}</span>
                                </div>
                            </div>
                            <button className="logout-btn" onClick={handleLogout}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                                    <polyline points="16,17 21,12 16,7"/>
                                    <line x1="21" y1="12" x2="9" y2="12"/>
                                </svg>
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}