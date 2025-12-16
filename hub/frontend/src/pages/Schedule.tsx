import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import '../styles/Schedule.css';
import '../styles/Robots.css'; // Reuse table styles

interface Appointment {
    id: number;
    client_name: string;
    seller_name: string;
    date: string;
    time: string;
    status: 'scheduled' | 'completed' | 'cancelled';
}

const Schedule = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newAppointment, setNewAppointment] = useState({
        client_name: '',
        seller_name: '',
        date: '',
        time: '',
        status: 'scheduled'
    });

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select('*')
                .order('date', { ascending: true });

            if (error) throw error;
            setAppointments(data || []);
        } catch (error) {
            console.error('Error fetching appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAppointment = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('appointments')
                .insert([newAppointment]);

            if (error) throw error;

            setIsModalOpen(false);
            setNewAppointment({
                client_name: '',
                seller_name: '',
                date: '',
                time: '',
                status: 'scheduled'
            });
            fetchAppointments();
        } catch (error) {
            console.error('Error creating appointment:', error);
            alert('Erro ao criar agendamento');
        }
    };

    const filteredAppointments = filterStatus === 'all'
        ? appointments
        : appointments.filter(app => app.status === filterStatus);

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Agendamentos</h1>
                <button className="submit-button" style={{ width: 'auto' }} onClick={() => setIsModalOpen(true)}>
                    <Plus size={16} style={{ marginRight: '0.5rem' }} />
                    Novo Agendamento
                </button>
            </div>

            <div className="schedule-filters">
                <select
                    className="filter-select"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                >
                    <option value="all">Todos os Status</option>
                    <option value="scheduled">Agendado</option>
                    <option value="completed">Realizado</option>
                    <option value="cancelled">Cancelado</option>
                </select>
            </div>

            {loading ? (
                <p>Carregando...</p>
            ) : (
                <div className="robots-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Vendedor</th>
                                <th>Data</th>
                                <th>Hora</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAppointments.map((app) => (
                                <tr key={app.id}>
                                    <td>{app.client_name}</td>
                                    <td>{app.seller_name}</td>
                                    <td>{new Date(app.date).toLocaleDateString()}</td>
                                    <td>{app.time}</td>
                                    <td>
                                        <span className={`schedule-status ${app.status === 'scheduled' ? 'status-scheduled' :
                                            app.status === 'completed' ? 'status-completed' : 'status-cancelled'
                                            }`}>
                                            {app.status === 'scheduled' ? 'Agendado' : app.status === 'completed' ? 'Realizado' : 'Cancelado'}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="action-button">
                                            Editar
                                        </button>
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
                            <h2>Novo Agendamento</h2>
                            <button onClick={() => setIsModalOpen(false)} className="close-button">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateAppointment}>
                            <div className="form-group">
                                <label className="form-label">Cliente</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={newAppointment.client_name}
                                    onChange={e => setNewAppointment({ ...newAppointment, client_name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Vendedor</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={newAppointment.seller_name}
                                    onChange={e => setNewAppointment({ ...newAppointment, seller_name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Data</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={newAppointment.date}
                                    onChange={e => setNewAppointment({ ...newAppointment, date: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Hora</label>
                                <input
                                    type="time"
                                    className="form-input"
                                    value={newAppointment.time}
                                    onChange={e => setNewAppointment({ ...newAppointment, time: e.target.value })}
                                    required
                                />
                            </div>
                            <button type="submit" className="submit-button">Criar Agendamento</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Schedule;
