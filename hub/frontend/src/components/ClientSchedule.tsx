import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Calendar, X, Trash2, Edit2 } from 'lucide-react';
import { logClientAction } from '../utils/logger';
import '../styles/ClientDetails.css';

interface ScheduleItem {
    id: string;
    title: string;
    description: string;
    event_date: string;
    type: 'Manutenção' | 'Relatório' | 'Reunião' | 'Outro';
    status: 'Pendente' | 'Concluído' | 'Cancelado';
}

const ClientSchedule = ({ clientId }: { clientId: string }) => {
    const [events, setEvents] = useState<ScheduleItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<ScheduleItem | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        event_date: new Date().toISOString().slice(0, 16), // Format for datetime-local
        type: 'Manutenção',
        status: 'Pendente'
    });

    useEffect(() => {
        fetchEvents();
    }, [clientId]);

    const fetchEvents = async () => {
        try {
            const { data, error } = await supabase
                .from('client_schedules')
                .select('*')
                .eq('client_id', clientId)
                .order('event_date', { ascending: true });

            if (error) throw error;
            setEvents(data || []);
        } catch (error) {
            console.error('Error fetching schedule:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingEvent) {
                const { error } = await supabase
                    .from('client_schedules')
                    .update({
                        ...formData,
                        event_date: new Date(formData.event_date).toISOString()
                    })
                    .eq('id', editingEvent.id);

                if (error) throw error;
                await logClientAction(clientId, 'Agendamento', `Evento "${formData.title}" atualizado.`);
            } else {
                const { error } = await supabase
                    .from('client_schedules')
                    .insert([{
                        ...formData,
                        client_id: clientId,
                        event_date: new Date(formData.event_date).toISOString()
                    }]);

                if (error) throw error;
                await logClientAction(clientId, 'Agendamento', `Novo evento agendado: ${formData.title}`);
            }

            setIsModalOpen(false);
            setEditingEvent(null);
            setFormData({
                title: '',
                description: '',
                event_date: new Date().toISOString().slice(0, 16),
                type: 'Manutenção',
                status: 'Pendente'
            });
            fetchEvents();
        } catch (error) {
            console.error('Error saving event:', error);
            alert('Erro ao salvar agendamento');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja remover este agendamento?')) return;
        try {
            const { error } = await supabase
                .from('client_schedules')
                .delete()
                .eq('id', id);

            if (error) throw error;
            await logClientAction(clientId, 'Agendamento', 'Evento removido da agenda.');
            fetchEvents();
        } catch (error) {
            console.error('Error deleting event:', error);
        }
    };

    const openEdit = (event: ScheduleItem) => {
        setEditingEvent(event);
        setFormData({
            title: event.title,
            description: event.description || '',
            event_date: new Date(event.event_date).toISOString().slice(0, 16),
            type: event.type as any,
            status: event.status as any
        });
        setIsModalOpen(true);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Concluído': return 'status-active';
            case 'Pendente': return 'status-pending';
            case 'Cancelado': return 'status-inactive';
            default: return 'status-inactive';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'Manutenção': return 'text-blue-400';
            case 'Relatório': return 'text-purple-400';
            case 'Reunião': return 'text-green-400';
            default: return 'text-gray-400';
        }
    };

    return (
        <div className="tab-content">
            <div className="tab-header-actions">
                <h2>Agenda do Cliente</h2>
                <button className="submit-button" onClick={() => setIsModalOpen(true)}>
                    <Plus size={16} style={{ marginRight: '0.5rem' }} />
                    Novo Agendamento
                </button>
            </div>

            {loading ? (
                <p>Carregando agenda...</p>
            ) : events.length === 0 ? (
                <div className="empty-state">
                    <Calendar size={48} color="var(--text-secondary)" />
                    <p>Nenhum agendamento encontrado.</p>
                </div>
            ) : (
                <div className="financial-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Data/Hora</th>
                                <th>Título</th>
                                <th>Tipo</th>
                                <th>Descrição</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.map(event => (
                                <tr key={event.id}>
                                    <td>
                                        {new Date(event.event_date).toLocaleDateString()} <br />
                                        <span className="text-xs text-gray-500">
                                            {new Date(event.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </td>
                                    <td className="font-medium text-white">{event.title}</td>
                                    <td className={getTypeColor(event.type)}>{event.type}</td>
                                    <td className="text-sm text-gray-400 max-w-xs truncate" title={event.description}>
                                        {event.description || '-'}
                                    </td>
                                    <td>
                                        <span className={`status-badge ${getStatusColor(event.status)}`}>
                                            {event.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex gap-2">
                                            <button onClick={() => openEdit(event)} className="icon-button" title="Editar">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(event.id)} className="icon-button delete" title="Excluir">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>{editingEvent ? 'Editar Agendamento' : 'Novo Agendamento'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="close-button">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Título</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    required
                                    placeholder="Ex: Manutenção Mensal"
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Data e Hora</label>
                                    <input
                                        type="datetime-local"
                                        className="form-input"
                                        value={formData.event_date}
                                        onChange={e => setFormData({ ...formData, event_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Tipo</label>
                                    <select
                                        className="form-input"
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                    >
                                        <option value="Manutenção">Manutenção</option>
                                        <option value="Relatório">Relatório</option>
                                        <option value="Reunião">Reunião</option>
                                        <option value="Outro">Outro</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Status</label>
                                <select
                                    className="form-input"
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                                >
                                    <option value="Pendente">Pendente</option>
                                    <option value="Concluído">Concluído</option>
                                    <option value="Cancelado">Cancelado</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Descrição</label>
                                <textarea
                                    className="form-input"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    placeholder="Detalhes do agendamento..."
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

export default ClientSchedule;
