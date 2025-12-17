import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Megaphone, Plus, Play, Pause, Trash2, X } from 'lucide-react';
import { logClientAction } from '../utils/logger';
import '../styles/ClientDetails.css';

interface Campaign {
    id: string;
    platform: 'Google Ads' | 'Meta Ads' | 'TikTok Ads';
    status: 'active' | 'paused';
    monthly_budget: number;
    objective: string;
    start_date: string;
    manager: string;
}

const ClientTraffic = ({ clientId }: { clientId: string }) => {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newCampaign, setNewCampaign] = useState({
        platform: 'Google Ads',
        status: 'active',
        monthly_budget: 0,
        objective: '',
        start_date: new Date().toISOString().split('T')[0],
        manager: ''
    });

    useEffect(() => {
        fetchCampaigns();
    }, [clientId]);

    const fetchCampaigns = async () => {
        try {
            const { data, error } = await supabase
                .from('traffic_campaigns')
                .select('*')
                .eq('client_id', clientId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCampaigns(data || []);
        } catch (error) {
            console.error('Error fetching campaigns:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCampaign = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('traffic_campaigns')
                .insert([{ ...newCampaign, client_id: clientId }]);

            if (error) throw error;

            await logClientAction(clientId, 'Tráfego', `Nova campanha criada: ${newCampaign.platform} - ${newCampaign.objective}`);

            setIsModalOpen(false);
            setNewCampaign({
                platform: 'Google Ads',
                status: 'active',
                monthly_budget: 0,
                objective: '',
                start_date: new Date().toISOString().split('T')[0],
                manager: ''
            });
            fetchCampaigns();
        } catch (error) {
            console.error('Error creating campaign:', error);
            alert('Erro ao criar campanha');
        }
    };

    const toggleStatus = async (id: string, currentStatus: string) => {
        try {
            const newStatus = currentStatus === 'active' ? 'paused' : 'active';
            const { error } = await supabase
                .from('traffic_campaigns')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;

            await logClientAction(clientId, 'Tráfego', `Campanha ${newStatus === 'active' ? 'ativada' : 'pausada'}`);
            fetchCampaigns();
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    return (
        <div className="tab-content">
            <div className="tab-header-actions">
                <h2>Gestão de Tráfego</h2>
                <button className="submit-button" onClick={() => setIsModalOpen(true)}>
                    <Plus size={16} style={{ marginRight: '0.5rem' }} />
                    Nova Campanha
                </button>
            </div>

            {loading ? (
                <p>Carregando campanhas...</p>
            ) : campaigns.length === 0 ? (
                <div className="empty-state">
                    <Megaphone size={48} color="var(--text-secondary)" />
                    <p>Nenhuma campanha ativa para este cliente.</p>
                </div>
            ) : (
                <div className="campaigns-grid">
                    {campaigns.map(campaign => (
                        <div key={campaign.id} className="campaign-card">
                            <div className="campaign-header">
                                <div className={`platform-badge ${campaign.platform.toLowerCase().replace(' ', '-')}`}>
                                    {campaign.platform}
                                </div>
                                <div className={`status-badge status-${campaign.status === 'active' ? 'active' : 'inactive'}`}>
                                    {campaign.status === 'active' ? 'Ativo' : 'Pausado'}
                                </div>
                            </div>

                            <div className="campaign-body">
                                <div className="campaign-metric">
                                    <span className="metric-label">Orçamento</span>
                                    <span className="metric-value">R$ {campaign.monthly_budget.toLocaleString()}</span>
                                </div>
                                <div className="campaign-metric">
                                    <span className="metric-label">Objetivo</span>
                                    <span className="metric-value">{campaign.objective}</span>
                                </div>
                                <div className="campaign-metric">
                                    <span className="metric-label">Gestor</span>
                                    <span className="metric-value">{campaign.manager}</span>
                                </div>
                            </div>

                            <div className="campaign-footer">
                                <button
                                    className={`icon-button ${campaign.status === 'active' ? 'pause' : 'play'}`}
                                    onClick={() => toggleStatus(campaign.id, campaign.status)}
                                    title={campaign.status === 'active' ? 'Pausar' : 'Ativar'}
                                >
                                    {campaign.status === 'active' ? <Pause size={18} /> : <Play size={18} />}
                                </button>
                                <button className="icon-button delete" title="Excluir">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Nova Campanha</h2>
                            <button onClick={() => setIsModalOpen(false)} className="close-button">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateCampaign}>
                            <div className="form-group">
                                <label className="form-label">Plataforma</label>
                                <select
                                    className="form-input"
                                    value={newCampaign.platform}
                                    onChange={e => setNewCampaign({ ...newCampaign, platform: e.target.value as any })}
                                >
                                    <option value="Google Ads">Google Ads</option>
                                    <option value="Meta Ads">Meta Ads</option>
                                    <option value="TikTok Ads">TikTok Ads</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Orçamento Mensal (R$)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={newCampaign.monthly_budget}
                                    onChange={e => setNewCampaign({ ...newCampaign, monthly_budget: Number(e.target.value) })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Objetivo</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Ex: Leads, Vendas, Branding"
                                    value={newCampaign.objective}
                                    onChange={e => setNewCampaign({ ...newCampaign, objective: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Gestor Responsável</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={newCampaign.manager}
                                    onChange={e => setNewCampaign({ ...newCampaign, manager: e.target.value })}
                                    required
                                />
                            </div>
                            <button type="submit" className="submit-button">Criar Campanha</button>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .campaigns-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 1.5rem;
                }
                .campaign-card {
                    background: var(--bg-input);
                    border: 1px solid var(--border-color);
                    border-radius: var(--radius-lg);
                    padding: 1.5rem;
                    transition: all var(--transition-fast);
                }
                .campaign-card:hover {
                    border-color: var(--primary);
                    box-shadow: var(--shadow-md);
                }
                .campaign-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }
                .platform-badge {
                    font-weight: 600;
                    font-size: 0.875rem;
                    color: var(--text-main);
                    display: flex;
                    align-items: center;
                }
                .platform-badge::before {
                    content: '';
                    display: inline-block;
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    margin-right: 0.5rem;
                }
                .google-ads::before { background-color: #4285F4; }
                .meta-ads::before { background-color: #1877F2; }
                .tiktok-ads::before { background-color: #000000; border: 1px solid #333; }
                
                .campaign-body {
                    margin-bottom: 1.5rem;
                }
                .campaign-metric {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 0.75rem;
                    font-size: 0.875rem;
                }
                .metric-label {
                    color: var(--text-secondary);
                }
                .metric-value {
                    color: var(--text-main);
                    font-weight: 500;
                }
                .campaign-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 0.5rem;
                    border-top: 1px solid var(--border-color);
                    padding-top: 1rem;
                }
            `}</style>
        </div>
    );
};

export default ClientTraffic;
