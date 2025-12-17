import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Plus, Search, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import '../styles/Clients.css';
import '../styles/Robots.css'; // Reuse table styles
import { logClientAction } from '../utils/logger';
import NewClientModal from '../components/NewClientModal';

interface Client {
    id: string;
    company_name?: string; // Added company_name
    name: string;
    responsible_name: string;
    whatsapp: string;
    email: string;
    cnpj_cpf: string;
    segment: string;
    lead_origin: string;
    plan: string;
    status: string;
    seller: string;
    entry_date: string;
    // New fields
    website?: string;
    role?: string;
    cep?: string;
    address?: string;
    number?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
}

const SEGMENTS = ['Clínica', 'Informática', 'Marketing', 'E-commerce', 'Varejo', 'Indústria', 'Outro'];
const STATUSES = [
    'Lead novo', 'Em negociação', 'Proposta enviada', 'Aguardando pagamento',
    'Pago', 'Ativo', 'Em implantação', 'Em acompanhamento',
    'Pausado', 'Cancelado', 'Recusado', 'Inadimplente'
];

const Clients = () => {
    const navigate = useNavigate();
    const [clients, setClients] = useState<Client[]>([]);
    const [filteredClients, setFilteredClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [segmentFilter, setSegmentFilter] = useState('');

    useEffect(() => {
        fetchClients();
    }, []);

    useEffect(() => {
        filterClients();
    }, [clients, searchTerm, statusFilter, segmentFilter]);

    const fetchClients = async () => {
        try {
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setClients(data || []);
        } catch (error) {
            console.error('Error fetching clients:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterClients = () => {
        let result = clients;

        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(client =>
                (client.company_name || client.name || '').toLowerCase().includes(lowerTerm) ||
                client.responsible_name?.toLowerCase().includes(lowerTerm) ||
                client.email?.toLowerCase().includes(lowerTerm)
            );
        }

        if (statusFilter) {
            result = result.filter(client => client.status === statusFilter);
        }

        if (segmentFilter) {
            result = result.filter(client => client.segment === segmentFilter);
        }

        setFilteredClients(result);
    };

    const handleCreateClient = async (clientData: any) => {
        try {
            // Sanitize data before insert
            const sanitizedData = {
                ...clientData,
                affiliate_id: clientData.affiliate_id === '' ? null : clientData.affiliate_id,
                value: clientData.value || 0
            };

            const { data, error } = await supabase
                .from('clients')
                .insert([sanitizedData])
                .select()
                .single();

            if (error) throw error;

            if (data) {
                await logClientAction(data.id, 'Criação', `Cliente ${data.company_name || data.name} criado.`);
            }

            fetchClients();
        } catch (error) {
            console.error('Error creating client:', error);
            alert('Erro ao criar cliente');
            throw error; // Re-throw to be handled by the modal
        }
    };

    const handleDeleteClient = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.')) return;

        try {
            const { error } = await supabase
                .from('clients')
                .delete()
                .eq('id', id);

            if (error) throw error;

            // await logClientAction(id, 'Exclusão', 'Cliente excluído.'); // Can't log if client is deleted unless log doesn't enforce FK or we log before delete. Assuming log might fail if client gone.
            fetchClients();
        } catch (error) {
            console.error('Error deleting client:', error);
            alert('Erro ao excluir cliente');
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('clients')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;

            // Optimistic update
            setClients(clients.map(c => c.id === id ? { ...c, status: newStatus } : c));
            await logClientAction(id, 'Alteração de Status', `Status alterado para ${newStatus}`);
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Erro ao atualizar status');
            fetchClients(); // Revert on error
        }
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'Ativo': return 'status-active';
            case 'Pago': return 'status-success';
            case 'Lead novo': return 'status-info';
            case 'Em negociação': return 'status-warning';
            case 'Cancelado': return 'status-danger';
            case 'Inadimplente': return 'status-danger';
            default: return 'status-pending';
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Clientes</h1>
                <button className="submit-button" onClick={() => setIsModalOpen(true)}>
                    <Plus size={16} style={{ marginRight: '0.5rem' }} />
                    Novo Cliente
                </button>
            </div>

            <div className="filters-bar" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="search-box" style={{ position: 'relative', flex: 1 }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input
                        type="text"
                        className="form-input"
                        style={{ paddingLeft: '2.5rem' }}
                        placeholder="Buscar por nome, responsável ou email..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    className="form-input"
                    style={{ width: '200px' }}
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                >
                    <option value="">Todos os Status</option>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select
                    className="form-input"
                    style={{ width: '200px' }}
                    value={segmentFilter}
                    onChange={e => setSegmentFilter(e.target.value)}
                >
                    <option value="">Todos os Segmentos</option>
                    {SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            {loading ? (
                <p>Carregando...</p>
            ) : (
                <div className="clients-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Empresa</th>
                                <th>Responsável</th>
                                <th>Segmento</th>
                                <th>Status</th>
                                <th>Vendedor</th>
                                <th>Entrada</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredClients.map((client) => (
                                <tr key={client.id}>
                                    <td>
                                        <div
                                            className="client-name cursor-pointer hover:underline"
                                            onClick={() => navigate(`/clients/${client.id}`)}
                                        >
                                            {client.company_name || client.name}
                                        </div>
                                        <div className="text-xs text-gray-500">{client.plan}</div>
                                    </td>
                                    <td>
                                        <div
                                            className="cursor-pointer hover:underline"
                                            onClick={() => navigate(`/clients/${client.id}`)}
                                        >
                                            {client.responsible_name || '-'}
                                        </div>
                                    </td>
                                    <td>{client.segment || '-'}</td>
                                    <td>
                                        <select
                                            className={`status-badge ${getStatusClass(client.status)} cursor-pointer border-none outline-none appearance-none bg-transparent text-center`}
                                            value={client.status}
                                            onChange={(e) => handleStatusUpdate(client.id, e.target.value)}
                                            style={{ textAlignLast: 'center' }}
                                        >
                                            {STATUSES.map(s => (
                                                <option key={s} value={s} className="text-black bg-white">
                                                    {s}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td>{client.seller}</td>
                                    <td>{client.entry_date ? new Date(client.entry_date).toLocaleDateString() : '-'}</td>
                                    <td>
                                        <div className="flex gap-2">
                                            <button
                                                className="action-button"
                                                onClick={() => navigate(`/clients/${client.id}`)}
                                                title="Ver Detalhes"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                className="action-button delete hover:text-red-500 hover:bg-red-500/10"
                                                onClick={() => handleDeleteClient(client.id)}
                                                title="Excluir Cliente"
                                            >
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

            <NewClientModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleCreateClient}
            />
        </div>
    );
};

export default Clients;
