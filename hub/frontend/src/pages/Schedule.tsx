import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    X,
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    CheckCircle,
    Clock,
    User,
    Briefcase,
    ExternalLink,
    Edit2,
    AlertTriangle
} from 'lucide-react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    isToday,
    isAfter
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import '../styles/Schedule.css';

interface ScheduleItem {
    id: string;
    client_id: string;
    title: string;
    description: string;
    event_date: string;
    type: 'Manutenção' | 'Relatório' | 'Reunião' | 'Outro';
    status: 'Pendente' | 'Concluído' | 'Cancelado';
    clients?: {
        name: string;
        company_name: string;
    };
}

interface ClientOption {
    id: string;
    name: string;
    company_name: string;
}

interface ServiceOption {
    id: string;
    name: string;
}

const Schedule = () => {
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<ScheduleItem[]>([]);

    // Modals
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<ScheduleItem | null>(null);

    // Filters
    const [selectedTypes, setSelectedTypes] = useState<string[]>(['Manutenção', 'Relatório', 'Reunião', 'Outro']);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['Pendente', 'Concluído', 'Cancelado']);

    // Form Data
    const [clients, setClients] = useState<ClientOption[]>([]);
    const [clientServices, setClientServices] = useState<ServiceOption[]>([]);
    const [formData, setFormData] = useState({
        client_id: '',
        title: '',
        description: '',
        event_date: new Date().toISOString().slice(0, 16),
        type: 'Manutenção',
        status: 'Pendente',
        service_id: ''
    });

    useEffect(() => {
        fetchEvents();
        fetchClients();
    }, [currentDate]);

    useEffect(() => {
        if (formData.client_id) {
            fetchClientServices(formData.client_id);
        }
    }, [formData.client_id]);

    const fetchEvents = async () => {
        const start = startOfMonth(currentDate).toISOString();
        const end = endOfMonth(currentDate).toISOString();

        try {
            const { data, error } = await supabase
                .from('client_schedules')
                .select(`
                    *,
                    clients (name, company_name)
                `)
                .gte('event_date', start)
                .lte('event_date', end)
                .order('event_date', { ascending: true });

            if (error) throw error;
            setEvents(data || []);
        } catch (error) {
            console.error('Error fetching schedule:', error);
        }
    };

    const fetchClients = async () => {
        try {
            const { data } = await supabase
                .from('clients')
                .select('id, name, company_name')
                .order('name');
            setClients(data || []);
        } catch (error) {
            console.error('Error fetching clients:', error);
        }
    };

    const fetchClientServices = async (clientId: string) => {
        try {
            const { data } = await supabase
                .from('client_services')
                .select('id, name')
                .eq('client_id', clientId)
                .eq('status', 'Ativo');
            setClientServices(data || []);
        } catch (error) {
            console.error('Error fetching services:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('client_schedules')
                .insert([{
                    client_id: formData.client_id,
                    title: formData.title,
                    description: formData.description + (formData.service_id ? `\n\nServiço Relacionado: ${clientServices.find(s => s.id === formData.service_id)?.name}` : ''),
                    event_date: new Date(formData.event_date).toISOString(),
                    type: formData.type,
                    status: formData.status
                }]);

            if (error) throw error;

            setIsModalOpen(false);
            resetForm();
            fetchEvents();
        } catch (error) {
            console.error('Error creating event:', error);
            alert('Erro ao criar agendamento');
        }
    };

    const resetForm = () => {
        setFormData({
            client_id: '',
            title: '',
            description: '',
            event_date: new Date().toISOString().slice(0, 16),
            type: 'Manutenção',
            status: 'Pendente',
            service_id: ''
        });
    };

    const handleDayClick = (day: Date) => {
        const now = new Date();
        const eventDate = new Date(day);
        eventDate.setHours(now.getHours(), now.getMinutes());

        setFormData(prev => ({
            ...prev,
            event_date: eventDate.toISOString().slice(0, 16)
        }));
        setIsModalOpen(true);
    };

    const handleEventClick = (event: ScheduleItem) => {
        setSelectedEvent(event);
        setIsDetailsModalOpen(true);
    };

    const handleGoToClient = () => {
        if (selectedEvent?.client_id) {
            navigate(`/clients/${selectedEvent.client_id}`);
        }
    };

    const toggleTypeFilter = (type: string) => {
        setSelectedTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    const toggleStatusFilter = (status: string) => {
        setSelectedStatuses(prev =>
            prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
        );
    };

    // Calendar Generation
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    const filteredEvents = events.filter(event =>
        selectedTypes.includes(event.type) && selectedStatuses.includes(event.status)
    );

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'Manutenção': return 'blue';
            case 'Relatório': return 'purple';
            case 'Reunião': return 'green';
            case 'Outro': return 'orange';
            default: return 'gray';
        }
    };

    // Stats Calculation
    const today = new Date();
    const eventsToday = events.filter(e => isSameDay(new Date(e.event_date), today)).length;
    const pendingMaintenance = events.filter(e => e.type === 'Manutenção' && e.status === 'Pendente').length;
    const nextMeeting = events
        .filter(e => e.type === 'Reunião' && isAfter(new Date(e.event_date), today))
        .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())[0];

    return (
        <div className="calendar-layout">
            {/* Sidebar */}
            <aside className="calendar-sidebar">
                <div className="sidebar-header">
                    <h2>Filtros</h2>
                </div>

                <div className="filter-section">
                    <h3>Tipos de Evento</h3>
                    <div className="filter-options">
                        {['Manutenção', 'Relatório', 'Reunião', 'Outro'].map(type => (
                            <label key={type} className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={selectedTypes.includes(type)}
                                    onChange={() => toggleTypeFilter(type)}
                                />
                                <span className={`dot dot-${getTypeColor(type)}`}></span>
                                {type}
                            </label>
                        ))}
                    </div>
                </div>

                <div className="filter-section">
                    <h3>Status</h3>
                    <div className="filter-options">
                        {['Pendente', 'Concluído', 'Cancelado'].map(status => (
                            <label key={status} className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={selectedStatuses.includes(status)}
                                    onChange={() => toggleStatusFilter(status)}
                                />
                                {status}
                            </label>
                        ))}
                    </div>
                </div>

                <button className="submit-button full-width mt-4" onClick={() => setIsModalOpen(true)}>
                    <Plus size={16} className="mr-2" />
                    Novo Evento
                </button>
            </aside>

            {/* Main Content */}
            <main className="calendar-main-container">
                <div className="calendar-grid-wrapper">
                    <header className="calendar-header">
                        <div className="calendar-nav">
                            <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="nav-button">
                                <ChevronLeft size={20} />
                            </button>
                            <h2>{format(currentDate, 'MMMM yyyy', { locale: ptBR })}</h2>
                            <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="nav-button">
                                <ChevronRight size={20} />
                            </button>
                        </div>
                        <button onClick={() => setCurrentDate(new Date())} className="today-button">
                            Hoje
                        </button>
                    </header>

                    <div className="calendar-grid">
                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                            <div key={day} className="weekday-header">{day}</div>
                        ))}

                        {calendarDays.map(day => {
                            const dayEvents = filteredEvents.filter(event => isSameDay(new Date(event.event_date), day));
                            const isCurrentMonth = isSameMonth(day, monthStart);

                            return (
                                <div
                                    key={day.toISOString()}
                                    className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday(day) ? 'is-today' : ''}`}
                                    onClick={() => handleDayClick(day)}
                                >
                                    <span className="day-number">{format(day, 'd')}</span>
                                    <div className="day-events">
                                        {dayEvents.map(event => (
                                            <div
                                                key={event.id}
                                                className={`event-bar bg-${getTypeColor(event.type)}`}
                                                title={`${event.title} - ${event.clients?.company_name || 'Cliente'}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEventClick(event);
                                                }}
                                            >
                                                {event.title}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Useful Info Section */}
                <div className="useful-info-section">
                    <div className="info-card">
                        <div className="info-icon bg-blue-soft">
                            <CalendarIcon size={20} className="text-blue" />
                        </div>
                        <div className="info-content">
                            <h4>Eventos Hoje</h4>
                            <p>{eventsToday}</p>
                        </div>
                    </div>

                    <div className="info-card">
                        <div className="info-icon bg-orange-soft">
                            <AlertTriangle size={20} className="text-orange" />
                        </div>
                        <div className="info-content">
                            <h4>Manutenções Pendentes</h4>
                            <p>{pendingMaintenance}</p>
                        </div>
                    </div>

                    <div className="info-card">
                        <div className="info-icon bg-green-soft">
                            <User size={20} className="text-green" />
                        </div>
                        <div className="info-content">
                            <h4>Próxima Reunião</h4>
                            <p className="text-sm">
                                {nextMeeting
                                    ? `${format(new Date(nextMeeting.event_date), "dd/MM 'às' HH:mm")} - ${nextMeeting.clients?.company_name}`
                                    : 'Nenhuma agendada'}
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            {/* New Event Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Novo Evento</h2>
                            <button onClick={() => setIsModalOpen(false)} className="close-button">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Cliente</label>
                                <select
                                    className="form-input"
                                    value={formData.client_id}
                                    onChange={e => setFormData({ ...formData, client_id: e.target.value })}
                                    required
                                >
                                    <option value="">Selecione um cliente...</option>
                                    {clients.map(client => (
                                        <option key={client.id} value={client.id}>
                                            {client.company_name || client.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {formData.client_id && clientServices.length > 0 && (
                                <div className="form-group">
                                    <label className="form-label">Vincular Serviço</label>
                                    <select
                                        className="form-input"
                                        value={formData.service_id}
                                        onChange={e => {
                                            const service = clientServices.find(s => s.id === e.target.value);
                                            setFormData({
                                                ...formData,
                                                service_id: e.target.value,
                                                title: service ? `${formData.type} - ${service.name}` : formData.title
                                            });
                                        }}
                                    >
                                        <option value="">Nenhum serviço vinculado</option>
                                        {clientServices.map(service => (
                                            <option key={service.id} value={service.id}>
                                                {service.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="form-row">
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
                            </div>

                            <div className="form-group">
                                <label className="form-label">Título</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Descrição</label>
                                <textarea
                                    className="form-input"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                />
                            </div>

                            <button type="submit" className="submit-button full-width">
                                Agendar
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Event Details Modal */}
            {isDetailsModalOpen && selectedEvent && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <div className="flex items-center gap-3">
                                <span className={`dot dot-${getTypeColor(selectedEvent.type)} w-4 h-4`}></span>
                                <h2>{selectedEvent.type}</h2>
                            </div>
                            <button onClick={() => setIsDetailsModalOpen(false)} className="close-button">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="event-details">
                            <h3 className="text-xl font-bold text-white mb-4">{selectedEvent.title}</h3>

                            <div className="detail-row">
                                <Clock size={18} className="text-gray-400" />
                                <span>{format(new Date(selectedEvent.event_date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</span>
                            </div>

                            <div className="detail-row">
                                <Briefcase size={18} className="text-gray-400" />
                                <span>{selectedEvent.clients?.company_name || 'Cliente Desconhecido'}</span>
                            </div>

                            <div className="detail-row">
                                <CheckCircle size={18} className="text-gray-400" />
                                <span className={`status-badge status-${selectedEvent.status === 'Concluído' ? 'active' : selectedEvent.status === 'Pendente' ? 'pending' : 'inactive'}`}>
                                    {selectedEvent.status}
                                </span>
                            </div>

                            {selectedEvent.description && (
                                <div className="detail-description mt-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                                    <p className="text-gray-300 text-sm whitespace-pre-wrap">{selectedEvent.description}</p>
                                </div>
                            )}

                            <div className="modal-actions mt-6 grid grid-cols-2 gap-4">
                                <button
                                    className="action-button secondary flex justify-center items-center gap-2"
                                    onClick={() => {
                                        // Implement edit logic here later
                                        alert('Funcionalidade de edição em breve');
                                    }}
                                >
                                    <Edit2 size={16} />
                                    Editar
                                </button>
                                <button
                                    className="submit-button flex justify-center items-center gap-2"
                                    onClick={handleGoToClient}
                                >
                                    <ExternalLink size={16} />
                                    Ir para Cliente
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Schedule;
