import { useState, useEffect } from 'react';
import { ExternalLink, Eye, Plus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import '../styles/Robots.css';

interface Robot {
    id: number;
    client_name: string;
    type: string;
    status: 'active' | 'offline';
    last_connection: string;
    link: string;
}

const Robots = () => {
    const [robots, setRobots] = useState<Robot[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newRobot, setNewRobot] = useState({
        client_name: '',
        type: '',
        status: 'active',
        link: ''
    });

    useEffect(() => {
        fetchRobots();
    }, []);

    const fetchRobots = async () => {
        try {
            const { data, error } = await supabase
                .from('robots')
                .select('*')
                .order('id', { ascending: false });

            if (error) throw error;
            setRobots(data || []);
        } catch (error) {
            console.error('Error fetching robots:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRobot = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('robots')
                .insert([{
                    ...newRobot,
                    last_connection: new Date().toISOString()
                }]);

            if (error) throw error;

            setIsModalOpen(false);
            setNewRobot({ client_name: '', type: '', status: 'active', link: '' });
            fetchRobots();
        } catch (error) {
            console.error('Error creating robot:', error);
            alert('Erro ao criar robô');
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Robôs</h1>
                <button className="submit-button" style={{ width: 'auto' }} onClick={() => setIsModalOpen(true)}>
                    <Plus size={16} style={{ marginRight: '0.5rem' }} />
                    Novo Robô
                </button>
            </div>

            {loading ? (
                <p>Carregando...</p>
            ) : (
                <div className="robots-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Tipo</th>
                                <th>Status</th>
                                <th>Última Conexão</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {robots.map((robot) => (
                                <tr key={robot.id}>
                                    <td>{robot.client_name}</td>
                                    <td>{robot.type}</td>
                                    <td>
                                        <span className={`robot-status ${robot.status === 'active' ? 'status-active' : 'status-offline'}`}>
                                            {robot.status === 'active' ? 'Ativo' : 'Offline'}
                                        </span>
                                    </td>
                                    <td>{new Date(robot.last_connection).toLocaleString()}</td>
                                    <td>
                                        <button className="action-button">
                                            <Eye size={16} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
                                            Detalhes
                                        </button>
                                        {robot.link && (
                                            <a href={robot.link} className="external-link" target="_blank" rel="noopener noreferrer">
                                                <ExternalLink size={16} />
                                            </a>
                                        )}
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
                            <h2>Novo Robô</h2>
                            <button onClick={() => setIsModalOpen(false)} className="close-button">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateRobot}>
                            <div className="form-group">
                                <label className="form-label">Nome do Cliente</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={newRobot.client_name}
                                    onChange={e => setNewRobot({ ...newRobot, client_name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Tipo</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={newRobot.type}
                                    onChange={e => setNewRobot({ ...newRobot, type: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Link (Opcional)</label>
                                <input
                                    type="url"
                                    className="form-input"
                                    value={newRobot.link}
                                    onChange={e => setNewRobot({ ...newRobot, link: e.target.value })}
                                />
                            </div>
                            <button type="submit" className="submit-button">Criar Robô</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Robots;
