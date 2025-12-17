import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
    LayoutDashboard,
    Bot,
    Megaphone,
    DollarSign,
    FileText,
    History,
    ArrowLeft,
    Users,
    Briefcase,
    MapPin,
    Building,
    Calendar
} from 'lucide-react';
import '../styles/ClientDetails.css';

import ClientTraffic from './ClientTraffic';
import ClientServices from '../components/ClientServices';
import ClientFinancial from '../components/ClientFinancial';
import ClientDocuments from '../components/ClientDocuments';
import ClientCRM from '../components/ClientCRM';
import ClientHistory from '../components/ClientHistory';
import ClientRobots from '../components/ClientRobots';
import ClientSchedule from '../components/ClientSchedule';

const ClientOverview = ({ client, clientId }: { client: any, clientId: string }) => {
    const [stats, setStats] = useState({
        activeServices: 0,
        pendingFinancial: 0,
        nextTask: null as any
    });

    useEffect(() => {
        const fetchStats = async () => {
            // Active Services
            const { count: servicesCount } = await supabase
                .from('client_services')
                .select('*', { count: 'exact', head: true })
                .eq('client_id', clientId)
                .eq('status', 'Ativo');

            // Pending Financial
            const { data: financialData } = await supabase
                .from('financial_records')
                .select('value')
                .eq('client_id', clientId)
                .eq('status', 'Pendente');

            const totalPending = financialData?.reduce((acc, curr) => acc + Number(curr.value), 0) || 0;

            // Next Task
            const { data: taskData } = await supabase
                .from('client_schedules')
                .select('*')
                .eq('client_id', clientId)
                .eq('status', 'Pendente')
                .gte('event_date', new Date().toISOString())
                .order('event_date', { ascending: true })
                .limit(1)
                .single();

            setStats({
                activeServices: servicesCount || 0,
                pendingFinancial: totalPending,
                nextTask: taskData
            });
        };

        fetchStats();
    }, [clientId]);

    return (
        <div className="tab-content">
            <h2>Visão Geral</h2>

            {/* Quick Stats Row */}
            {/* Quick Stats Row */}
            <div className="overview-stats-grid">
                <div className="stat-card card-gradient-green">
                    <div className="stat-header">
                        <Briefcase size={20} className="text-green-500" />
                        <h3>Serviços Ativos</h3>
                    </div>
                    <div className="stat-value">{stats.activeServices}</div>
                </div>
                <div className="stat-card card-gradient-yellow">
                    <div className="stat-header">
                        <DollarSign size={20} className="text-yellow-500" />
                        <h3>Pendente Financeiro</h3>
                    </div>
                    <div className="stat-value">R$ {stats.pendingFinancial.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                </div>
                <div className="stat-card card-gradient-blue">
                    <div className="stat-header">
                        <Calendar size={20} className="text-blue-500" />
                        <h3>Próxima Tarefa</h3>
                    </div>
                    {stats.nextTask ? (
                        <div className="stat-content">
                            <div className="stat-title">{stats.nextTask.title}</div>
                            <div className="stat-subtitle">
                                {new Date(stats.nextTask.event_date).toLocaleDateString()}
                            </div>
                        </div>
                    ) : (
                        <div className="stat-empty">Nenhuma tarefa agendada</div>
                    )}
                </div>
            </div>

            <div className="overview-grid">
                <div className="stat-card card-gradient-indigo">
                    <div className="stat-header">
                        <Building size={20} className="text-indigo-500" />
                        <h3>Informações da Empresa</h3>
                    </div>
                    <div className="stat-content">
                        <div className="detail-row">
                            <span className="detail-label">Nome:</span>
                            <span className="detail-value">{client.company_name || client.name}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Segmento:</span>
                            <span className="detail-value">{client.segment || '-'}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">CNPJ/CPF:</span>
                            <span className="detail-value">{client.cnpj_cpf || '-'}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Site/Social:</span>
                            <span className="detail-value">
                                {client.website ? (
                                    <a href={client.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
                                        {client.website}
                                    </a>
                                ) : '-'}
                            </span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Plano:</span>
                            <span className="detail-value">{client.plan}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Status:</span>
                            <span className={`status-badge status-${client.status === 'Ativo' ? 'active' : client.status === 'Lead novo' ? 'info' : 'pending'}`}>
                                {client.status}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="stat-card card-gradient-purple">
                    <div className="stat-header">
                        <Users size={20} className="text-purple-500" />
                        <h3>Contato Principal</h3>
                    </div>
                    <div className="stat-content">
                        <div className="detail-row">
                            <span className="detail-label">Responsável:</span>
                            <span className="detail-value">{client.responsible_name || '-'}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Cargo:</span>
                            <span className="detail-value">{client.role || '-'}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Email:</span>
                            <span className="detail-value">{client.email || '-'}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">WhatsApp:</span>
                            <span className="detail-value">{client.whatsapp || '-'}</span>
                        </div>
                    </div>
                </div>

                <div className="stat-card card-gradient-teal">
                    <div className="stat-header">
                        <MapPin size={20} className="text-teal-500" />
                        <h3>Endereço</h3>
                    </div>
                    <div className="stat-content">
                        <div className="detail-row">
                            <span className="detail-label">CEP:</span>
                            <span className="detail-value">{client.cep || '-'}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Cidade/UF:</span>
                            <span className="detail-value">{client.city && client.state ? `${client.city}/${client.state}` : '-'}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Endereço:</span>
                            <span className="detail-value">{client.address || '-'}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Número:</span>
                            <span className="detail-value">{client.number || '-'}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Bairro:</span>
                            <span className="detail-value">{client.neighborhood || '-'}</span>
                        </div>
                    </div>
                </div>

                <div className="stat-card card-gradient-orange">
                    <div className="stat-header">
                        <DollarSign size={20} className="text-orange-500" />
                        <h3>Comercial</h3>
                    </div>
                    <div className="stat-content">
                        <div className="detail-row">
                            <span className="detail-label">Origem:</span>
                            <span className="detail-value">{client.lead_origin || '-'}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Vendedor:</span>
                            <span className="detail-value">{client.seller || '-'}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Data Entrada:</span>
                            <span className="detail-value">{client.entry_date ? new Date(client.entry_date).toLocaleDateString() : '-'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ClientDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [client, setClient] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        fetchClientDetails();
    }, [id]);

    const fetchClientDetails = async () => {
        if (!id) return;
        try {
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setClient(data);
        } catch (error) {
            console.error('Error fetching client:', error);
            // navigate('/clients'); // Redirect if not found
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading" style={{ padding: '2rem', color: 'var(--text-main)' }}>Carregando...</div>;
    if (!client) return <div className="error" style={{ padding: '2rem', color: 'var(--danger)' }}>Cliente não encontrado</div>;

    const tabs = [
        { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
        { id: 'services', label: 'Serviços', icon: Briefcase },
        { id: 'schedule', label: 'Agenda', icon: Calendar },
        { id: 'robots', label: 'Robôs', icon: Bot },
        { id: 'traffic', label: 'Tráfego', icon: Megaphone },
        { id: 'financial', label: 'Financeiro', icon: DollarSign },
        { id: 'documents', label: 'Documentos', icon: FileText },
        { id: 'crm', label: 'CRM', icon: Users },
        { id: 'history', label: 'Histórico', icon: History },
    ];

    return (
        <div className="client-details-page">
            <div className="page-header">
                <button className="back-button" onClick={() => navigate('/clients')}>
                    <ArrowLeft size={20} />
                    Voltar
                </button>
                <h1 className="page-title">{client.company_name || client.name}</h1>
            </div>

            <div className="tabs-container">
                <div className="tabs-header">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="tabs-content-area">
                    {activeTab === 'overview' && <ClientOverview client={client} clientId={id!} />}
                    {activeTab === 'services' && <ClientServices clientId={id!} />}
                    {activeTab === 'schedule' && <ClientSchedule clientId={id!} />}
                    {activeTab === 'robots' && <ClientRobots clientId={id!} />}
                    {activeTab === 'traffic' && <ClientTraffic clientId={id!} />}
                    {activeTab === 'financial' && <ClientFinancial clientId={id!} />}
                    {activeTab === 'documents' && <ClientDocuments clientId={id!} clientData={client} />}
                    {activeTab === 'crm' && <ClientCRM clientId={id!} />}
                    {activeTab === 'history' && <ClientHistory clientId={id!} />}
                </div>
            </div>
        </div>
    );
};

export default ClientDetails;
