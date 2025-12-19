import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    LayoutDashboard,
    Bot,
    Users,
    Calendar,
    MessageSquare,
    DollarSign,
    UserCheck,
    Settings,
    LogOut,
    User,
    MessageCircle
} from 'lucide-react';
import '../styles/Sidebar.css';

import { X } from 'lucide-react';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
    const { user, logout } = useAuth();
    const isAdmin = user?.role === 'admin';

    const navItems = [
        { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
        { to: "/clients", icon: Users, label: "Clientes" },
        { to: "/robots", icon: Bot, label: "Robôs" },
        { to: "/schedule", icon: Calendar, label: "Agendamentos" },
        { to: "/conversations", icon: MessageSquare, label: "Conversas" },
        { to: "/whatsapp-marketing", icon: MessageCircle, label: "WhatsApp" },
        { to: "/financial", icon: DollarSign, label: "Financeiro" },
        // { to: "/traffic", icon: Megaphone, label: "Tráfego Pago" }, // Future
        { to: "/affiliates", icon: UserCheck, label: "Afiliados" },
        // { to: "/documents", icon: FileText, label: "Documentos" }, // Future
    ];

    if (isAdmin) {
        navItems.push({ to: "/settings", icon: Settings, label: "Configurações" });
    }

    return (
        <>
            <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="logo-container">
                        <div className="logo-icon">
                            <LayoutDashboard size={24} />
                        </div>
                        <h2>Sucesso1000</h2>
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
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            onClick={onClose}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="user-avatar">
                            <User size={20} />
                        </div>
                        <div className="user-details">
                            <span className="user-name">{user?.name || 'Usuário'}</span>
                            <span className="user-role">{isAdmin ? 'Admin' : 'Vendedor'}</span>
                        </div>
                    </div>
                    <button onClick={logout} className="logout-button" title="Sair">
                        <LogOut size={18} />
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
