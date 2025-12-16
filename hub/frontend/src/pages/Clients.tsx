import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Plus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import '../styles/Clients.css';
import '../styles/Robots.css'; // Reuse table styles

interface Client {
    id: number;
    name: string;
    plan: string;
    status: 'active' | 'inactive' | 'pending';
    seller: string;
    start_date: string;
}

const Clients = () => {
    const navigate = useNavigate();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newClient, setNewClient] = useState({
        name: '',
        plan: 'Básico',
        status: 'active',
        seller: '',
        start_date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .order('id', { ascending: false });

            if (error) throw error;
            setClients(data || []);
        } catch (error) {
            console.error('Error fetching clients:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateClient = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('clients')
                .insert([newClient]);

            if (error) throw error;

            setIsModalOpen(false);
            setNewClient({
                name: '',
                plan: 'Básico',
                status: 'active',
                seller: '',
                start_date: new Date().toISOString().split('T')[0]
            });
            fetchClients();
        } catch (error) {
            console.error('Error creating client:', error);
            alert('Erro ao criar cliente');
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Clientes</h1>
                <button className="submit-button" style={{ width: 'auto' }} onClick={() => setIsModalOpen(true)}>
                    <Plus size={16} style={{ marginRight: '0.5rem' }} />
                    Novo Cliente
                </button>
            </div>

            {loading ? (
                <p>Carregando...</p>
            ) : (
                <div className="clients-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Empresa</th>
                                <th>Plano</th>
                                <th>Status</th>
                                <th>Vendedor</th>
                                <th>Início</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clients.map((client) => (
                                <tr key={client.id}>
                                    <td>
                                        <div className="client-name">{client.name}</div>
                                    </td>
                                    <td>
                                        <span className="client-plan">{client.plan}</span>
                                    </td>
                                    <td>
                                        <span className={`client-status ${client.status === 'active' ? 'client-status-active' :
                                            client.status === 'pending' ? 'client-status-pending' : 'client-status-inactive'
                                            }`}>
                                            {client.status === 'active' ? 'Ativo' : client.status === 'pending' ? 'Pendente' : 'Inativo'}
                                        </span>
                                    </td>
                                    <td>{client.seller}</td>
                                    <td>{new Date(client.start_date).toLocaleDateString()}</td>
                                    <td>
                                        <button
                                            className="action-button"
                                            onClick={() => navigate(`/clients/${client.id}`)}
                                        >
                                            <Eye size={16} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
                                            Ver
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
                            <h2>Novo Cliente</h2>
                            <button onClick={() => setIsModalOpen(false)} className="close-button">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateClient}>
                            <div className="form-group">
                                <label className="form-label">Nome da Empresa</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={newClient.name}
                                    onChange={e => setNewClient({ ...newClient, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Plano</label>
                                <select
                                    className="form-input"
                                    value={newClient.plan}
                                    onChange={e => setNewClient({ ...newClient, plan: e.target.value })}
                                >
                                    <option value="Básico">Básico</option>
                                    <option value="Premium">Premium</option>
                                    <option value="Enterprise">Enterprise</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Vendedor</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={newClient.seller}
                                    onChange={e => setNewClient({ ...newClient, seller: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Data de Início</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={newClient.start_date}
                                    onChange={e => setNewClient({ ...newClient, start_date: e.target.value })}
                                    required
                                />
                            </div>
                            <button type="submit" className="submit-button">Criar Cliente</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Clients;
