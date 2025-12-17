import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Bot, Plus, Play, Pause, Trash2, X, Settings, Edit2 } from 'lucide-react';
import { logClientAction } from '../utils/logger';
import '../styles/ClientDetails.css';

interface Robot {
    id: string;
    name: string;
    type: 'Atendimento' | 'Prospecção' | 'Agendamento' | 'Outro';
    status: 'active' | 'inactive' | 'maintenance';
    instance_id: string;
    webhook_url: string;
}

const ClientRobots = ({ clientId }: { clientId?: string }) => {
    const [robots, setRobots] = useState<Robot[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRobot, setEditingRobot] = useState<Robot | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        type: 'Atendimento',
        status: 'active',
        instance_id: '',
        webhook_url: ''
    });

    useEffect(() => {
        fetchRobots();
    }, [clientId]);

    useEffect(() => {
        if (editingRobot) {
            setFormData({
                name: editingRobot.name,
                type: editingRobot.type as any,
                status: editingRobot.status as any,
                instance_id: editingRobot.instance_id || '',
                webhook_url: editingRobot.webhook_url || ''
            });
            setIsModalOpen(true);
        } else {
            setFormData({
                name: '',
                type: 'Atendimento',
                status: 'active',
                instance_id: '',
                webhook_url: ''
            });
        }
    }, [editingRobot]);

    const fetchRobots = async () => {
        try {
            let query = supabase
                .from('client_robots')
                .select('*')
                .order('created_at', { ascending: false });

            if (clientId) {
                query = query.eq('client_id', clientId);
            }

            const { data, error } = await query;

            if (error) throw error;
            setRobots(data || []);
        } catch (error) {
            console.error('Error fetching robots:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingRobot) {
                // Update existing robot
                const { error } = await supabase
                    .from('client_robots')
                    .update({
                        name: formData.name,
                        type: formData.type,
                        instance_id: formData.instance_id,
                        webhook_url: formData.webhook_url
                    })
                    .eq('id', editingRobot.id);

                if (error) throw error;
                if (clientId) {
                    await logClientAction(clientId, 'Robô', `Robô atualizado: ${formData.name}`);
                }
            } else {
                // Create new robot
                const { error } = await supabase
                    .from('client_robots')
                    .insert([{ ...formData, client_id: clientId }]);

                if (error) throw error;
                if (clientId) {
                    await logClientAction(clientId, 'Robô', `Novo robô criado: ${formData.name} (${formData.type})`);
                }
            }

            closeModal();
            fetchRobots();
        } catch (error) {
            console.error('Error saving robot:', error);
            alert('Erro ao salvar robô');
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingRobot(null);
    };

    const toggleStatus = async (id: string, currentStatus: string) => {
        try {
            const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
            const { error } = await supabase
                .from('client_robots')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;

            if (clientId) {
                await logClientAction(clientId, 'Robô', `Robô ${newStatus === 'active' ? 'ativado' : 'desativado'}`);
            }
            fetchRobots();
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este robô?')) return;
        try {
            const { error } = await supabase
                .from('client_robots')
                .delete()
                .eq('id', id);

            if (error) throw error;
            if (clientId) {
                await logClientAction(clientId, 'Robô', 'Robô excluído');
            }
            fetchRobots();
        } catch (error) {
            console.error('Error deleting robot:', error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'status-active';
            case 'inactive': return 'status-inactive';
            case 'maintenance': return 'status-warning';
            default: return 'status-inactive';
        }
    };

    return (
        <div className="tab-content">
            <div className="tab-header-actions">
                <h2>Robôs Vinculados</h2>
                <button className="submit-button" onClick={() => setIsModalOpen(true)}>
                    <Plus size={16} style={{ marginRight: '0.5rem' }} />
                    Novo Robô
                </button>
            </div>

            {loading ? (
                <p>Carregando robôs...</p>
            ) : robots.length === 0 ? (
                <div className="empty-state">
                    <Bot size={48} color="var(--text-secondary)" />
                    <p>Nenhum robô vinculado a este cliente.</p>
                </div>
            ) : (
                <div className="campaigns-grid">
                    {robots.map(robot => (
                        <div key={robot.id} className="campaign-card">
                            <div className="campaign-header">
                                <div className="platform-badge">
                                    <Bot size={16} className="mr-2 text-primary" />
                                    {robot.name}
                                </div>
                                <div className={`status-badge ${getStatusColor(robot.status)}`}>
                                    {robot.status === 'active' ? 'Ativo' : robot.status === 'maintenance' ? 'Manutenção' : 'Inativo'}
                                </div>
                            </div>

                            <div className="campaign-body">
                                <div className="campaign-metric">
                                    <span className="metric-label">Tipo</span>
                                    <span className="metric-value">{robot.type}</span>
                                </div>
                                <div className="campaign-metric">
                                    <span className="metric-label">Instância ID</span>
                                    <span className="metric-value text-xs">{robot.instance_id || '-'}</span>
                                </div>
                                <div className="campaign-metric">
                                    <span className="metric-label">Webhook</span>
                                    <span className="metric-value text-xs" title={robot.webhook_url}>
                                        {robot.webhook_url ? 'Configurado' : '-'}
                                    </span>
                                </div>
                            </div>

                            <div className="campaign-footer">
                                <button
                                    className={`icon-button ${robot.status === 'active' ? 'pause' : 'play'}`}
                                    onClick={() => toggleStatus(robot.id, robot.status)}
                                    title={robot.status === 'active' ? 'Desativar' : 'Ativar'}
                                >
                                    {robot.status === 'active' ? <Pause size={18} /> : <Play size={18} />}
                                </button>
                                <button
                                    className="icon-button"
                                    title="Configurações"
                                    onClick={() => setEditingRobot(robot)}
                                >
                                    <Settings size={18} />
                                </button>
                                <button
                                    className="icon-button delete"
                                    title="Excluir"
                                    onClick={() => handleDelete(robot.id)}
                                >
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
                            <h2>{editingRobot ? 'Editar Robô' : 'Novo Robô'}</h2>
                            <button onClick={closeModal} className="close-button">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Nome do Robô</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="Ex: Atendente Virtual"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Tipo</label>
                                <select
                                    className="form-input"
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                >
                                    <option value="Atendimento">Atendimento</option>
                                    <option value="Prospecção">Prospecção</option>
                                    <option value="Agendamento">Agendamento</option>
                                    <option value="Outro">Outro</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">ID da Instância (Typebot/Evolution)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.instance_id}
                                    onChange={e => setFormData({ ...formData, instance_id: e.target.value })}
                                    placeholder="Opcional"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Webhook URL</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.webhook_url}
                                    onChange={e => setFormData({ ...formData, webhook_url: e.target.value })}
                                    placeholder="https://..."
                                />
                            </div>
                            <button type="submit" className="submit-button">
                                {editingRobot ? 'Salvar Alterações' : 'Criar Robô'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientRobots;
