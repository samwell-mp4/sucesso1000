import React from 'react';
import { Users, DollarSign, TrendingUp } from 'lucide-react';

const AffiliatesDashboard: React.FC = () => {
    // Mock data for now, will connect to Supabase later
    const metrics = [
        {
            title: 'Total de Afiliados',
            value: '12',
            trend: '+2 este mês',
            trendUp: true,
            icon: <Users size={24} color="#3b82f6" />,
            iconBg: 'rgba(59, 130, 246, 0.1)'
        },
        {
            title: 'Vendas (Mês)',
            value: 'R$ 45.200',
            trend: '+15% vs mês anterior',
            trendUp: true,
            icon: <TrendingUp size={24} color="#10b981" />,
            iconBg: 'rgba(16, 185, 129, 0.1)'
        },
        {
            title: 'Comissões Pendentes',
            value: 'R$ 8.450',
            trend: 'Aguardando liberação',
            trendUp: false,
            icon: <DollarSign size={24} color="#f59e0b" />,
            iconBg: 'rgba(245, 158, 11, 0.1)'
        },
        {
            title: 'Comissões Pagas',
            value: 'R$ 12.300',
            trend: 'Últimos 30 dias',
            trendUp: true,
            icon: <DollarSign size={24} color="#8b5cf6" />,
            iconBg: 'rgba(139, 92, 246, 0.1)'
        }
    ];

    return (
        <div className="financial-dashboard-grid">
            {metrics.map((metric, index) => (
                <div key={index} className="metric-card">
                    <div className="metric-header">
                        <span>{metric.title}</span>
                        <div style={{ backgroundColor: metric.iconBg, padding: '8px', borderRadius: '8px' }}>
                            {metric.icon}
                        </div>
                    </div>
                    <div className="metric-value">{metric.value}</div>
                    <div className={`metric-trend ${metric.trendUp ? 'trend-up' : 'trend-down'}`}>
                        {metric.trend}
                    </div>
                </div>
            ))}

            {/* Placeholder for Charts */}
            <div className="chart-container" style={{ gridColumn: 'span 2' }}>
                <div className="chart-header">
                    <h3>Vendas por Afiliado</h3>
                </div>
                <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
                    Gráfico de Vendas (Em breve)
                </div>
            </div>

            <div className="chart-container" style={{ gridColumn: 'span 2' }}>
                <div className="chart-header">
                    <h3>Comissões Geradas</h3>
                </div>
                <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
                    Gráfico de Comissões (Em breve)
                </div>
            </div>
        </div>
    );
};

export default AffiliatesDashboard;
