import React from 'react';
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
    User
} from 'lucide-react';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const isAdmin = user?.role === 'admin';

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <h1 className="sidebar-title">Sucesso1000</h1>
            </div>

            <nav className="sidebar-nav">
                <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <LayoutDashboard className="nav-icon" size={20} />
                    <span>Dashboard</span>
                </NavLink>

                <NavLink to="/robots" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Bot className="nav-icon" size={20} />
                    <span>Robôs</span>
                </NavLink>

                <NavLink to="/clients" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Users className="nav-icon" size={20} />
                    <span>Clientes</span>
                </NavLink>

                <NavLink to="/schedule" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Calendar className="nav-icon" size={20} />
                    <span>Agendamentos</span>
                </NavLink>

                <NavLink to="/conversations" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <MessageSquare className="nav-icon" size={20} />
                    <span>Conversas</span>
                </NavLink>

                <NavLink to="/sales" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <DollarSign className="nav-icon" size={20} />
                    <span>Vendas</span>
                </NavLink>

                <NavLink to="/affiliates" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <UserCheck className="nav-icon" size={20} />
                    <span>Afiliados</span>
                </NavLink>

                {isAdmin && (
                    <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Settings className="nav-icon" size={20} />
                        <span>Configurações</span>
                    </NavLink>
                )}
            </nav>

            <div className="sidebar-footer">
                <div className="user-info">
                    <div className="user-avatar">
                        <User size={20} color="#d1d5db" />
                    </div>
                    <div className="user-details">
                        <div className="user-name">{user?.name}</div>
                        <div className="user-role">{user?.role === 'admin' ? 'Administrador' : 'Vendedor'}</div>
                    </div>
                </div>
                <button onClick={logout} className="logout-button">
                    <LogOut size={16} style={{ marginRight: '0.5rem' }} />
                    Sair
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
