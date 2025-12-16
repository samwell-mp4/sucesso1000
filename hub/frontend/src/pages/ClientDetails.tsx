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
    ArrowLeft
} from 'lucide-react';
import '../styles/ClientDetails.css';

import ClientTraffic from './ClientTraffic';
import ClientDocuments from './ClientDocuments';

// Placeholder components for tabs (will be implemented in separate files or inline for now)
const ClientOverview = ({ client }: { client: any }) => (
    <div className="tab-content">
        <h2>Visão Geral</h2>
        <div className="overview-grid">
            <div className="info-card">
                <h3>Informações da Empresa</h3>
                <p><strong>Nome:</strong> {client.name}</p>
                <p><strong>Plano:</strong> {client.plan}</p>
                <p><strong>Status:</strong> <span className={`status-badge status-${client.status}`}>{client.status}</span></p>
                <p><strong>Vendedor:</strong> {client.seller}</p>
                <p><strong>Início:</strong> {new Date(client.start_date).toLocaleDateString()}</p>
            </div>
            <div className="info-card">
                <h3>Observações</h3>
                <p>{client.observations || 'Nenhuma observação registrada.'}</p>
            </div>
        </div>
    </div>
);

const ClientRobots = ({ clientId }: { clientId: string }) => (
    <div className="tab-content">
        <h2>Robôs Vinculados</h2>
        <p>Lista de robôs do cliente {clientId} (Em breve)</p>
    </div>
);

const ClientFinancial = ({ clientId }: { clientId: string }) => (
    <div className="tab-content">
        <h2>Financeiro do Cliente</h2>
        <p>Receitas e Despesas do cliente {clientId} (Em breve)</p>
    </div>
);

const ClientHistory = ({ clientId }: { clientId: string }) => (
    <div className="tab-content">
        <h2>Histórico</h2>
        <p>Log de atividades do cliente {clientId} (Em breve)</p>
    </div>
);

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

    if (loading) return <div className="loading">Carregando...</div>;
    if (!client) return <div className="error">Cliente não encontrado</div>;

    const tabs = [
        { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
        { id: 'robots', label: 'Robôs', icon: Bot },
        { id: 'traffic', label: 'Tráfego', icon: Megaphone },
        { id: 'financial', label: 'Financeiro', icon: DollarSign },
        { id: 'documents', label: 'Documentos', icon: FileText },
        { id: 'history', label: 'Histórico', icon: History },
    ];

    return (
        <div className="client-details-page">
            <div className="page-header">
                <button className="back-button" onClick={() => navigate('/clients')}>
                    <ArrowLeft size={20} />
                    Voltar
                </button>
                <h1 className="page-title">{client.name}</h1>
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
                    {activeTab === 'overview' && <ClientOverview client={client} />}
                    {activeTab === 'robots' && <ClientRobots clientId={id!} />}
                    {activeTab === 'traffic' && <ClientTraffic clientId={id!} />}
                    {activeTab === 'financial' && <ClientFinancial clientId={id!} />}
                    {activeTab === 'documents' && <ClientDocuments clientId={id!} />}
                    {activeTab === 'history' && <ClientHistory clientId={id!} />}
                </div>
            </div>
        </div>
    );
};

export default ClientDetails;
