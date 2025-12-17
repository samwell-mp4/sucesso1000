import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Search, Filter, Download, Check, AlertCircle, Calendar } from 'lucide-react';
import { logClientAction } from '../../utils/logger';

interface FinancialRecord {
    id: string;
    client_id: string;
    type: string;
    value: number;
    due_date: string;
    payment_method: string;
    status: 'Pendente' | 'Pago' | 'Atrasado';
    client?: { name: string };
}

interface FinancialIncomeProps {
    autoOpen?: boolean;
    onCloseAutoOpen?: () => void;
}

const FinancialIncome = ({ autoOpen, onCloseAutoOpen }: FinancialIncomeProps) => {
    const [records, setRecords] = useState<FinancialRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [clients, setClients] = useState<{ id: string, name: string }[]>([]);
    const [newRecord, setNewRecord] = useState({
        client_id: '',
        type: 'Mensalidade',
        value: 0,
        due_date: new Date().toISOString().split('T')[0],
        payment_method: 'Pix',
        status: 'Pendente'
    });

    useEffect(() => {
        fetchRecords();
        fetchClients();
    }, []);

    useEffect(() => {
        if (autoOpen) {
            setIsModalOpen(true);
            if (onCloseAutoOpen) onCloseAutoOpen();
        }
    }, [autoOpen, onCloseAutoOpen]);

    const fetchClients = async () => {
        const { data } = await supabase.from('clients').select('id, name').order('name');
        setClients(data || []);
        if (data && data.length > 0) {
            setNewRecord(prev => ({ ...prev, client_id: data[0].id }));
        }
    };

    const fetchRecords = async () => {
        try {
            const { data, error } = await supabase
                .from('financial_records')
                .select('*, client:clients(name)')
                .order('due_date', { ascending: false });

            if (error) throw error;
            setRecords(data || []);
        } catch (error) {
            console.error('Error fetching income records:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('financial_records')
                .insert([newRecord]);

            if (error) throw error;

            setIsModalOpen(false);
            setNewRecord({
                client_id: clients[0]?.id || '',
                type: 'Mensalidade',
                value: 0,
                due_date: new Date().toISOString().split('T')[0],
                payment_method: 'Pix',
                status: 'Pendente'
            });
            fetchRecords();
        } catch (error) {
            console.error('Error creating record:', error);
            alert('Erro ao criar receita');
        }
    };

    const markAsPaid = async (id: string, clientId: string, value: number) => {
        try {
            const { error } = await supabase
                .from('financial_records')
                .update({ status: 'Pago', payment_date: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;
            await logClientAction(clientId, 'Financeiro', `Pagamento de R$ ${value} recebido.`);
            fetchRecords();
        } catch (error) {
            console.error('Error updating record:', error);
        }
    };

    const filteredRecords = records.filter(record => {
        const clientName = record.client?.name || '';
        const matchesSearch = clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.type.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'Pago': return 'status-active';
            case 'Pendente': return 'status-warning';
            case 'Atrasado': return 'status-inactive';
            default: return '';
        }
    };

    return (
        <div className="financial-income">
            <div className="filters-bar">
                <Search size={20} className="text-gray-400" />
                <input
                    type="text"
                    placeholder="Buscar por cliente ou tipo..."
                    className="search-input"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
                <select
                    className="filter-select"
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                >
                    <option value="all">Todos os Status</option>
                    <option value="Pago">Pago</option>
                    <option value="Pendente">Pendente</option>
                    <option value="Atrasado">Atrasado</option>
                </select>
                <button className="submit-button" onClick={() => setIsModalOpen(true)}>
                    <Plus size={16} className="mr-2" />
                    Nova Receita
                </button>
            </div>

            <div className="financial-table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Cliente</th>
                            <th>Tipo</th>
                            <th>Valor</th>
                            <th>Vencimento</th>
                            <th>Método</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRecords.map(record => (
                            <tr key={record.id}>
                                <td className="font-medium text-white">{record.client?.name || 'Cliente Removido'}</td>
                                <td>{record.type}</td>
                                <td className="font-bold text-white">R$ {record.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                <td>{new Date(record.due_date).toLocaleDateString()}</td>
                                <td>{record.payment_method}</td>
                                <td>
                                    <span className={`status-badge ${getStatusClass(record.status)}`}>
                                        {record.status}
                                    </span>
                                </td>
                                <td>
                                    {record.status !== 'Pago' && (
                                        <button
                                            className="icon-button success"
                                            title="Marcar como Pago"
                                            onClick={() => markAsPaid(record.id, record.client_id, record.value)}
                                        >
                                            <Check size={18} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Nova Receita</h2>
                            <button onClick={() => setIsModalOpen(false)} className="close-button">×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Cliente</label>
                                <select
                                    className="form-input"
                                    value={newRecord.client_id}
                                    onChange={e => setNewRecord({ ...newRecord, client_id: e.target.value })}
                                    required
                                >
                                    {clients.map(client => (
                                        <option key={client.id} value={client.id}>{client.name || 'Sem Nome'}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Tipo</label>
                                <select
                                    className="form-input"
                                    value={newRecord.type}
                                    onChange={e => setNewRecord({ ...newRecord, type: e.target.value })}
                                >
                                    <option value="Mensalidade">Mensalidade</option>
                                    <option value="Implementação">Implementação</option>
                                    <option value="Anual">Anual</option>
                                    <option value="Extra">Extra</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="form-label">Valor (R$)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={newRecord.value}
                                        onChange={e => setNewRecord({ ...newRecord, value: parseFloat(e.target.value) })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Vencimento</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={newRecord.due_date}
                                        onChange={e => setNewRecord({ ...newRecord, due_date: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Método de Pagamento</label>
                                <select
                                    className="form-input"
                                    value={newRecord.payment_method}
                                    onChange={e => setNewRecord({ ...newRecord, payment_method: e.target.value })}
                                >
                                    <option value="Pix">Pix</option>
                                    <option value="Boleto">Boleto</option>
                                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                                    <option value="Transferência">Transferência</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Status</label>
                                <select
                                    className="form-input"
                                    value={newRecord.status}
                                    onChange={e => setNewRecord({ ...newRecord, status: e.target.value as any })}
                                >
                                    <option value="Pendente">Pendente</option>
                                    <option value="Pago">Pago</option>
                                    <option value="Atrasado">Atrasado</option>
                                </select>
                            </div>
                            <button type="submit" className="submit-button full-width">Salvar Receita</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinancialIncome;
