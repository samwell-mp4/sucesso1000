import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { logClientAction } from '../utils/logger';
import '../styles/ClientDetails.css';

interface Service {
    id: string;
    name: string;
    category: string;
    description: string;
    value: number;
    type: 'Implementação' | 'Mensalidade' | 'Projeto único';
    status: 'Ativo' | 'Em produção' | 'Concluído' | 'Cancelado';
}

const CATEGORIES = [
    'Agentes IA', 'Sites / Landing Pages', 'SEO / Google Meu Negócio',
    'VSL / VSL Pró', 'PPT Pró', 'Design Gráfico', 'Copywriting',
    'E-books', 'Mockups', 'Branding / Logotipo', 'Tráfego Pago', 'Outros'
];

const TYPES = ['Implementação', 'Mensalidade', 'Projeto único'];
const STATUSES = ['Ativo', 'Em produção', 'Concluído', 'Cancelado'];

const ClientServices = ({ clientId }: { clientId: string }) => {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [formData, setFormData] = useState<Partial<Service>>({
        name: '',
        category: CATEGORIES[0],
        description: '',
        value: 0,
        type: 'Mensalidade',
        status: 'Em produção'
    });

    useEffect(() => {
        fetchServices();
    }, [clientId]);

    const fetchServices = async () => {
        try {
            const { data, error } = await supabase
                .from('client_services')
                .select('*')
                .eq('client_id', clientId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setServices(data || []);
        } catch (error) {
            console.error('Error fetching services:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingService) {
                const { error } = await supabase
                    .from('client_services')
                    .update(formData)
                    .eq('id', editingService.id);
                if (error) throw error;
                await logClientAction(clientId, 'Edição de Serviço', `Serviço ${formData.name} atualizado.`);
            } else {
                // Insert Service
                const { data: serviceData, error: serviceError } = await supabase
                    .from('client_services')
                    .insert([{ ...formData, client_id: clientId }])
                    .select()
                    .single();

                if (serviceError) throw serviceError;

                await logClientAction(clientId, 'Novo Serviço', `Serviço ${formData.name} adicionado.`);

                // Auto-create Financial Record
                if (serviceData) {
                    const financialType = formData.type === 'Projeto único' ? 'Implementação' :
                        formData.type === 'Mensalidade' ? 'Mensalidade' : 'Implementação';

                    const dueDate = new Date();
                    if (financialType === 'Mensalidade') {
                        dueDate.setDate(dueDate.getDate() + 30); // 30 days for monthly
                    } else {
                        dueDate.setDate(dueDate.getDate() + 5); // 5 days for implementation
                    }

                    await supabase.from('financial_records').insert([{
                        client_id: clientId,
                        service_id: serviceData.id,
                        type: financialType,
                        value: formData.value,
                        due_date: dueDate.toISOString().split('T')[0],
                        status: 'Pendente',
                        payment_method: 'Pix' // Default
                    }]);

                    await logClientAction(clientId, 'Financeiro Automático', `Registro financeiro criado para ${formData.name}.`);
                }
            }

            setIsModalOpen(false);
            setEditingService(null);
            setFormData({
                name: '',
                category: CATEGORIES[0],
                description: '',
                value: 0,
                type: 'Mensalidade',
                status: 'Em produção'
            });
            fetchServices();
        } catch (error) {
            console.error('Error saving service:', error);
            alert('Erro ao salvar serviço');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja remover este serviço?')) return;
        try {
            const { error } = await supabase
                .from('client_services')
                .delete()
                .eq('id', id);
            if (error) throw error;
            await logClientAction(clientId, 'Remoção de Serviço', `Serviço removido.`);
            fetchServices();
        } catch (error) {
            console.error('Error deleting service:', error);
        }
    };

    const openEdit = (service: Service) => {
        setEditingService(service);
        setFormData(service);
        setIsModalOpen(true);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Ativo': return 'text-green-500 bg-green-100';
            case 'Em produção': return 'text-blue-500 bg-blue-100';
            case 'Concluído': return 'text-gray-500 bg-gray-100';
            case 'Cancelado': return 'text-red-500 bg-red-100';
            default: return 'text-gray-500';
        }
    };

    return (
        <div className="tab-content">
            <div className="tab-header-actions">
                <h2>Serviços Contratados</h2>
                <button className="submit-button" onClick={() => setIsModalOpen(true)}>
                    <Plus size={16} className="mr-2" />
                    Novo Serviço
                </button>
            </div>

            {loading ? (
                <p>Carregando serviços...</p>
            ) : services.length === 0 ? (
                <div className="empty-state">
                    <p>Nenhum serviço cadastrado.</p>
                </div>
            ) : (
                <div className="services-grid">
                    {services.map(service => (
                        <div key={service.id} className="service-card">
                            <div className="service-header">
                                <span className="service-category">{service.category}</span>
                                <div className="service-actions">
                                    <button onClick={() => openEdit(service)} className="icon-button">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(service.id)} className="icon-button delete">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <h3 className="service-name">{service.name}</h3>
                            <p className="service-desc">{service.description}</p>
                            <div className="service-meta">
                                <div className="service-price">
                                    R$ {service.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    <span className="service-type">/{service.type}</span>
                                </div>
                                <span className={`status-badge ${getStatusColor(service.status)}`}>
                                    {service.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>{editingService ? 'Editar Serviço' : 'Novo Serviço'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="close-button">×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Nome do Serviço</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Categoria</label>
                                    <select
                                        className="form-input"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Tipo</label>
                                    <select
                                        className="form-input"
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                    >
                                        {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Valor (R$)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={formData.value}
                                        onChange={e => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select
                                        className="form-input"
                                        value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                                    >
                                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Descrição</label>
                                <textarea
                                    className="form-input"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                />
                            </div>
                            <button type="submit" className="submit-button">Salvar</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientServices;
