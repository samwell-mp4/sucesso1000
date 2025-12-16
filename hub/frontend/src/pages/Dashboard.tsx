import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Bot, Users, Calendar, MessageSquare, DollarSign } from 'lucide-react';
import '../styles/Dashboard.css';

const Dashboard = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    // Mock data
    const stats = [
        { label: 'Robôs Ativos', value: '124', icon: Bot, color: '#3b82f6', bg: '#eff6ff' },
        { label: 'Clientes Ativos', value: '85', icon: Users, color: '#10b981', bg: '#ecfdf5' },
        { label: 'Reuniões Hoje', value: '4', icon: Calendar, color: '#f59e0b', bg: '#fffbeb' },
        { label: 'Conversas Ativas', value: '28', icon: MessageSquare, color: '#8b5cf6', bg: '#f5f3ff' },
    ];

    if (isAdmin) {
        stats.push({ label: 'Vendas do Mês', value: 'R$ 45.200', icon: DollarSign, color: '#ec4899', bg: '#fdf2f8' });
    }

    return (
        <div>
            <div className="dashboard-header">
                <h1 className="dashboard-title">Dashboard</h1>
                <p className="dashboard-subtitle">Bem-vindo de volta, {user?.name}</p>
            </div>

            <div className="stats-grid">
                {stats.map((stat, index) => (
                    <div key={index} className="stat-card">
                        <div className="stat-icon-wrapper" style={{ backgroundColor: stat.bg }}>
                            <stat.icon size={24} color={stat.color} />
                        </div>
                        <div className="stat-content">
                            <p className="stat-label">{stat.label}</p>
                            <p className="stat-value">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="dashboard-section">
                <h2 className="section-title">Últimas Atividades</h2>
                <div className="recent-activity-list">
                    <div className="activity-item">
                        <div className="activity-info">
                            <span className="activity-text">Novo cliente cadastrado: <strong>Empresa XYZ</strong></span>
                            <span className="activity-time">Há 2 horas</span>
                        </div>
                        <span className="status-badge status-success">Novo Cliente</span>
                    </div>
                    <div className="activity-item">
                        <div className="activity-info">
                            <span className="activity-text">Robô <strong>Bot-001</strong> desconectado</span>
                            <span className="activity-time">Há 4 horas</span>
                        </div>
                        <span className="status-badge status-warning">Alerta</span>
                    </div>
                    <div className="activity-item">
                        <div className="activity-info">
                            <span className="activity-text">Venda realizada por <strong>João Silva</strong></span>
                            <span className="activity-time">Há 5 horas</span>
                        </div>
                        <span className="status-badge status-success">Venda</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
