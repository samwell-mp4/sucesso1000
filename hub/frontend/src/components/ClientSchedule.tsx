import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Calendar, X, Trash2, Edit2, CheckCircle, Clock, Power } from 'lucide-react';
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
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

    // Mock Automations State
    const [automations, setAutomations] = useState([
        { id: 'bot', label: 'Bot de WhatsApp Ativo', active: true },
        { id: 'confirm', label: 'Confirmação de Reunião', active: true },
        { id: 'followup', label: 'Follow-up Automático', active: false },
        { id: 'reactivate', label: 'Reativação de Leads', active: false },
    ]);

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

    const toggleAutomation = (id: string) => {
        setAutomations(automations.map(a => a.id === id ? { ...a, active: !a.active } : a));
        // Log action
        const automation = automations.find(a => a.id === id);
        if (automation) {
            logClientAction(clientId, 'Automação', `${automation.label} ${!automation.active ? 'ativada' : 'desativada'}`);
        }
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

    const now = new Date();
    const upcomingEvents = events.filter(e => new Date(e.event_date) >= now);
    const pastEvents = events.filter(e => new Date(e.event_date) < now).reverse(); // Most recent past first

    const displayedEvents = activeTab === 'upcoming' ? upcomingEvents : pastEvents;

    return (
        <div className="tab-content">
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Column: Automations */}
                <div className="lg:w-1/3 space-y-6">
                    <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Power size={20} className="text-[var(--primary)]" />
                            <h3 className="text-lg font-semibold text-[var(--text-main)]">Automações Ativas</h3>
                        </div>
                        <div className="space-y-3">
                            {automations.map(auto => (
                                <div key={auto.id} className="flex items-center justify-between p-3 bg-[var(--bg-background)] rounded-lg border border-[var(--border-color)]">
                                    <span className="text-sm font-medium text-[var(--text-main)]">{auto.label}</span>
                                    <button
                                        onClick={() => toggleAutomation(auto.id)}
                                        className={`relative w-10 h-5 rounded-full transition-colors ${auto.active ? 'bg-green-500' : 'bg-gray-600'}`}
                                    >
                                        <span className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform ${auto.active ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-5">
                        <h3 className="text-lg font-semibold text-[var(--text-main)] mb-4">Resumo</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-[var(--bg-background)] rounded-lg text-center">
                                <div className="text-2xl font-bold text-[var(--primary)]">{upcomingEvents.length}</div>
                                <div className="text-xs text-[var(--text-secondary)]">Próximas</div>
                            </div>
                            <div className="p-3 bg-[var(--bg-background)] rounded-lg text-center">
                                <div className="text-2xl font-bold text-[var(--text-main)]">{pastEvents.length}</div>
                                <div className="text-xs text-[var(--text-secondary)]">Realizadas</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Schedule */}
                <div className="lg:w-2/3">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-[var(--text-main)]">Agenda & Reuniões</h2>
                        <button className="submit-button" onClick={() => setIsModalOpen(true)}>
                            <Plus size={16} style={{ marginRight: '0.5rem' }} />
                            Novo
                        </button>
                    </div>

                    <div className="flex gap-2 mb-4">
                        <button
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'upcoming' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'}`}
                            onClick={() => setActiveTab('upcoming')}
                        >
                            Próximas
                        </button>
                        <button
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'past' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'}`}
                            onClick={() => setActiveTab('past')}
                        >
                            Realizadas
                        </button>
                    </div>

                    {loading ? (
                        <p>Carregando agenda...</p>
                    ) : displayedEvents.length === 0 ? (
                        <div className="empty-state bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-8 text-center">
                            <Calendar size={48} color="var(--text-secondary)" className="mx-auto mb-4" />
                            <p className="text-[var(--text-secondary)]">Nenhum agendamento encontrado.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {displayedEvents.map(event => (
                                <div key={event.id} className="bg-[var(--bg-card)] p-4 rounded-xl border border-[var(--border-color)] hover:border-[var(--primary)] transition-colors flex flex-col md:flex-row gap-4">
                                    <div className="flex-shrink-0 flex flex-col items-center justify-center bg-[var(--bg-background)] rounded-lg p-3 min-w-[80px]">
                                        <span className="text-xs text-[var(--text-secondary)] uppercase">{new Date(event.event_date).toLocaleString('default', { month: 'short' })}</span>
                                        <span className="text-xl font-bold text-[var(--text-main)]">{new Date(event.event_date).getDate()}</span>
                                        <span className="text-xs text-[var(--text-secondary)]">{new Date(event.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>

                                    <div className="flex-grow">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold text-[var(--text-main)] text-lg">{event.title}</h4>
                                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--bg-background)] ${getTypeColor(event.type)}`}>
                                                    {event.type}
                                                </span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => openEdit(event)} className="text-[var(--text-secondary)] hover:text-[var(--text-main)]">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(event.id)} className="text-[var(--text-secondary)] hover:text-red-500">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-sm text-[var(--text-secondary)] mt-2 line-clamp-2">{event.description || 'Sem descrição.'}</p>
                                        <div className="mt-3 flex items-center gap-2">
                                            <span className={`status-badge ${getStatusColor(event.status)}`}>
                                                {event.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

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
