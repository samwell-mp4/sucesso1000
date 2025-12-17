import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { CheckCircle, XCircle, Search, Filter, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

interface Commission {
    id: string;
    affiliate_id: string;
    client_id: string;
    sale_type: string;
    base_value: number;
    commission_rate: number;
    commission_value: number;
    status: 'Pendente' | 'Aprovada' | 'Paga' | 'Cancelada';
    created_at: string;
    affiliates: {
        name: string;
    };
    clients: {
        company_name: string;
        name: string;
    };
}

const CommissionsList: React.FC = () => {
    const [commissions, setCommissions] = useState<Commission[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        fetchCommissions();
    }, []);

    const fetchCommissions = async () => {
        try {
            const { data, error } = await supabase
                .from('commissions')
                .select(`
                    *,
                    affiliates (name),
                    clients (company_name, name)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCommissions(data || []);
        } catch (error) {
            console.error('Error fetching commissions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('commissions')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;
            fetchCommissions();
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Erro ao atualizar status da comissão');
        }
    };

    const filteredCommissions = commissions.filter(commission => {
        const matchesSearch =
            commission.affiliates?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            commission.clients?.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || commission.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Aprovada': return 'status-active';
            case 'Paga': return 'status-info';
            case 'Pendente': return 'status-pending';
            case 'Cancelada': return 'status-inactive';
            default: return '';
        }
    };

    return (
        <div className="tab-content">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-white">Gestão de Comissões</h2>
                    <p className="text-gray-400">Aprove e gerencie as comissões dos seus afiliados.</p>
                </div>
            </div>

            <div className="filters-bar">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por afiliado ou cliente..."
                        className="search-input pl-10 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-gray-400" />
                    <select
                        className="filter-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Todos os Status</option>
                        <option value="Pendente">Pendente</option>
                        <option value="Aprovada">Aprovada</option>
                        <option value="Paga">Paga</option>
                        <option value="Cancelada">Cancelada</option>
                    </select>
                </div>
            </div>

            <div className="financial-table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Afiliado</th>
                            <th>Cliente</th>
                            <th>Tipo</th>
                            <th>Valor Base</th>
                            <th>Comissão</th>
                            <th>Status</th>
                            <th>Data</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={8} className="text-center py-8 text-gray-400">Carregando...</td>
                            </tr>
                        ) : filteredCommissions.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="text-center py-8 text-gray-400">Nenhuma comissão encontrada.</td>
                            </tr>
                        ) : (
                            filteredCommissions.map((commission) => (
                                <tr key={commission.id}>
                                    <td className="font-medium text-white">{commission.affiliates?.name || 'N/A'}</td>
                                    <td>{commission.clients?.company_name || commission.clients?.name || 'N/A'}</td>
                                    <td>{commission.sale_type}</td>
                                    <td>
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(commission.base_value)}
                                    </td>
                                    <td className="font-bold text-green-400">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(commission.commission_value)}
                                        <span className="text-xs text-gray-500 ml-1">({commission.commission_rate}%)</span>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${getStatusColor(commission.status)}`}>
                                            {commission.status}
                                        </span>
                                    </td>
                                    <td>{format(new Date(commission.created_at), 'dd/MM/yyyy')}</td>
                                    <td>
                                        <div className="flex gap-2">
                                            {commission.status === 'Pendente' && (
                                                <>
                                                    <button
                                                        onClick={() => handleStatusUpdate(commission.id, 'Aprovada')}
                                                        className="icon-button success"
                                                        title="Aprovar"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(commission.id, 'Cancelada')}
                                                        className="icon-button delete"
                                                        title="Rejeitar"
                                                    >
                                                        <XCircle size={18} />
                                                    </button>
                                                </>
                                            )}
                                            {commission.status === 'Aprovada' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(commission.id, 'Paga')}
                                                    className="icon-button text-blue-400 hover:bg-blue-400/10"
                                                    title="Marcar como Paga"
                                                >
                                                    <DollarSign size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CommissionsList;
