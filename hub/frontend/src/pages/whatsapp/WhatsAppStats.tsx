import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
    MessageCircle,
    Users,
    Send,
    Activity,
    ArrowUpRight,
    Clock,
    CheckCircle,
    AlertCircle,
    Plus,
    MoreHorizontal
} from 'lucide-react';
import WhatsAppMessageModal from '../../components/WhatsAppMessageModal';
import '../../styles/WhatsAppStats.css';

const WhatsAppStats = () => {
    const { user } = useAuth();

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (!user) {
        return <div className="loading-container">Carregando usuário...</div>;
    }

    // Mock Data for Stats
    const stats = [
        { label: 'Mensagens Enviadas', value: '1,234', icon: Send, color: 'blue', trend: '+12%' },
        { label: 'Conversas Ativas', value: '42', icon: MessageCircle, color: 'green', trend: '+5%' },
        { label: 'Grupos Gerenciados', value: '8', icon: Users, color: 'purple', trend: '0%' },
        { label: 'Taxa de Resposta', value: '98%', icon: Activity, color: 'orange', trend: '+2%' },
    ];

    // Mock Data for Recent Activity
    const recentActivity = [
        { id: 1, type: 'message', content: 'Disparo em massa finalizado', time: '10 min atrás', status: 'success' },
        { id: 2, type: 'group', content: 'Novo membro em "Vendas VIP"', time: '32 min atrás', status: 'info' },
        { id: 3, type: 'robot', content: 'Robô "Winnie" pausado', time: '2h atrás', status: 'warning' },
        { id: 4, type: 'message', content: 'Campanha "Black Friday" agendada', time: '5h atrás', status: 'success' },
        { id: 5, type: 'message', content: 'Resposta automática enviada para 5 clientes', time: '6h atrás', status: 'success' },
    ];

    return (
        <div className="whatsapp-stats-container">
            <header className="stats-header">
                <div>
                    <h1 className="page-title">Whatsapp</h1>
                    <p className="page-subtitle">Métricas e status da sua operação.</p>
                </div>
                <div className="header-actions">
                    <button className="action-btn secondary">
                        <Users size={18} />
                        Gerenciar Grupos
                    </button>
                    <button className="action-btn primary" onClick={() => setIsModalOpen(true)}>
                        <Plus size={18} />
                        Novo Disparo
                    </button>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="stats-grid">
                {stats.map((stat, index) => (
                    <div key={index} className="stat-card">
                        <div className={`stat-icon ${stat.color}`}>
                            <stat.icon size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">{stat.label}</span>
                            <div className="stat-value-row">
                                <span className="stat-value">{stat.value}</span>
                                <span className="stat-trend positive">
                                    <ArrowUpRight size={14} />
                                    {stat.trend}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="content-grid">
                {/* Recent Activity */}
                <div className="dashboard-section activity-section">
                    <div className="section-header">
                        <h2>Atividade Recente</h2>
                        <button className="icon-btn">
                            <MoreHorizontal size={20} />
                        </button>
                    </div>
                    <div className="activity-list">
                        {recentActivity.map((activity) => (
                            <div key={activity.id} className="activity-item">
                                <div className={`activity-icon ${activity.status}`}>
                                    {activity.status === 'success' && <CheckCircle size={16} />}
                                    {activity.status === 'warning' && <AlertCircle size={16} />}
                                    {activity.status === 'info' && <Clock size={16} />}
                                </div>
                                <div className="activity-content">
                                    <p>{activity.content}</p>
                                    <span>{activity.time}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Performance / Tips Section */}
                <div className="dashboard-section tips-section">
                    <div className="section-header">
                        <h2>Insights</h2>
                    </div>
                    <div className="tips-content">
                        <div className="tip-card">
                            <div className="tip-icon">💡</div>
                            <div>
                                <strong>Horários de Pico</strong>
                                <p>Seus clientes respondem mais entre 18h e 20h.</p>
                            </div>
                        </div>
                        <div className="tip-card">
                            <div className="tip-icon">🚀</div>
                            <div>
                                <strong>Dica de Engajamento</strong>
                                <p>Agende seus disparos em massa para terça-feira de manhã para maior conversão.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <WhatsAppMessageModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
};

export default WhatsAppStats;
