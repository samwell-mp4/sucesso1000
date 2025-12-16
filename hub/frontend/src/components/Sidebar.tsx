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
    FileText,
    Megaphone
} from 'lucide-react';
import '../styles/Sidebar.css';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const isAdmin = user?.role === 'admin';

    const navItems = [
        { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
        { to: "/clients", icon: Users, label: "Clientes" },
        { to: "/robots", icon: Bot, label: "Robôs" },
        { to: "/schedule", icon: Calendar, label: "Agendamentos" },
        { to: "/conversations", icon: MessageSquare, label: "Conversas" },
        { to: "/financial", icon: DollarSign, label: "Financeiro" },
        // { to: "/traffic", icon: Megaphone, label: "Tráfego Pago" }, // Future
        { to: "/affiliates", icon: UserCheck, label: "Afiliados" },
        // { to: "/documents", icon: FileText, label: "Documentos" }, // Future
    ];

    if (isAdmin) {
        navItems.push({ to: "/settings", icon: Settings, label: "Configurações" });
    }

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="logo-container">
                    <div className="logo-icon">S</div>
                    <h1 className="sidebar-logo">Sucesso1000</h1>
                </div>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        <item.icon className="nav-icon" size={20} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="user-info">
                    <div className="user-avatar">
                        <User size={20} color="#fff" />
                    </div>
                    <div className="user-details">
                        <div className="user-name">{user?.name}</div>
                        <div className="user-role">{user?.role === 'admin' ? 'Admin' : 'Vendedor'}</div>
                    </div>
                </div>
                <button onClick={logout} className="logout-button">
                    <LogOut size={18} />
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
