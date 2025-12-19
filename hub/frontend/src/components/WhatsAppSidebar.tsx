import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    LayoutDashboard,
    Bot,
    Settings,
    User,
    ArrowLeft,
    Zap,
    MessageCircle,
    Users,
    X
} from 'lucide-react';
import '../styles/Sidebar.css';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

const WhatsAppSidebar = ({ isOpen, onClose }: SidebarProps) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const navItems = [
        { to: "/whatsapp", icon: LayoutDashboard, label: "Dashboard", end: true },
        { to: "/whatsapp/stats", icon: MessageCircle, label: "Whatsapp" },
        { to: "/whatsapp/contacts", icon: Users, label: "Contatos" },
        { to: "/whatsapp/robots", icon: Bot, label: "Meus Robôs" },
        { to: "/whatsapp/automations", icon: Zap, label: "Automações" },
        { to: "/whatsapp/conversations", icon: MessageCircle, label: "Conversas" },
        { to: "/whatsapp/settings", icon: Settings, label: "Configurações" },
    ];

    return (
        <>
            <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="logo-container">
                        <div className="logo-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                            <Bot size={24} />
                        </div>
                        <h2>WhatsApp Hub</h2>
                    </div>
                    <button className="mobile-close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            onClick={onClose}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button onClick={() => navigate('/')} className="logout-button" style={{ marginBottom: '0.5rem', width: '100%', justifyContent: 'flex-start', padding: '0.75rem' }}>
                        <ArrowLeft size={18} />
                        <span>Voltar ao Hub</span>
                    </button>

                    <div className="user-info">
                        <div className="user-avatar">
                            <User size={20} />
                        </div>
                        <div className="user-details">
                            <span className="user-name">{user?.name || 'Usuário'}</span>
                            <span className="user-role">WhatsApp Admin</span>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default WhatsAppSidebar;
