import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, DollarSign, CreditCard, Settings } from 'lucide-react';
import '../../styles/Financial.css'; // Reusing Financial styles for consistency

const AffiliatesLayout: React.FC = () => {
    return (
        <div className="financial-page">
            <div className="financial-header">
                <h1>Módulo de Afiliados</h1>
                <p>Gerencie vendedores, comissões e pagamentos em um só lugar.</p>
            </div>

            <div className="financial-tabs">
                <NavLink
                    to="/affiliates"
                    end
                    className={({ isActive }) => `financial-tab ${isActive ? 'active' : ''}`}
                >
                    <LayoutDashboard size={18} />
                    Dashboard
                </NavLink>
                <NavLink
                    to="/affiliates/list"
                    className={({ isActive }) => `financial-tab ${isActive ? 'active' : ''}`}
                >
                    <Users size={18} />
                    Afiliados
                </NavLink>
                <NavLink
                    to="/affiliates/commissions"
                    className={({ isActive }) => `financial-tab ${isActive ? 'active' : ''}`}
                >
                    <DollarSign size={18} />
                    Comissões
                </NavLink>
                <NavLink
                    to="/affiliates/payments"
                    className={({ isActive }) => `financial-tab ${isActive ? 'active' : ''}`}
                >
                    <CreditCard size={18} />
                    Pagamentos
                </NavLink>
            </div>

            <div className="financial-content">
                <Outlet />
            </div>
        </div>
    );
};

export default AffiliatesLayout;
