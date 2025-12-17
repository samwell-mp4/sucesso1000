import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Check, DollarSign, TrendingUp, AlertCircle, X } from 'lucide-react';
import { logClientAction } from '../utils/logger';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import '../styles/ClientDetails.css';

interface FinancialRecord {
    id: string;
    type: string;
    value: number;
    due_date: string;
    payment_method: string;
    status: 'Pendente' | 'Pago' | 'Atrasado';
}

const ClientFinancial = ({ clientId }: { clientId: string }) => {
    const [records, setRecords] = useState<FinancialRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newRecord, setNewRecord] = useState({
        type: 'Mensalidade',
        value: 0,
        due_date: new Date().toISOString().split('T')[0],
        payment_method: 'Pix',
        status: 'Pendente'
    });

    useEffect(() => {
        fetchRecords();
    }, [clientId]);

    const fetchRecords = async () => {
        try {
            const { data, error } = await supabase
                .from('financial_records')
                .select('*')
                .eq('client_id', clientId)
                .order('due_date', { ascending: false });

            if (error) throw error;
            setRecords(data || []);
        } catch (error) {
            console.error('Error fetching financial records:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('financial_records')
                .insert([{ ...newRecord, client_id: clientId }]);

            if (error) throw error;

            await logClientAction(clientId, 'Novo Registro Financeiro', `Registro de R$ ${newRecord.value} (${newRecord.type}) criado.`);

            setIsModalOpen(false);
            setNewRecord({
                type: 'Mensalidade',
                value: 0,
                due_date: new Date().toISOString().split('T')[0],
                payment_method: 'Pix',
                status: 'Pendente'
            });
            fetchRecords();
        } catch (error) {
            console.error('Error creating financial record:', error);
            alert('Erro ao criar registro financeiro');
        }
    };

    const markAsPaid = async (id: string, value: number) => {
        try {
            const { error } = await supabase
                .from('financial_records')
                .update({ status: 'Pago' })
                .eq('id', id);

            if (error) throw error;

            await logClientAction(clientId, 'Pagamento Recebido', `Registro de R$ ${value} marcado como pago.`);
            fetchRecords();
        } catch (error) {
            console.error('Error updating record:', error);
        }
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'Pago': return 'text-green-500 bg-green-500/10';
            case 'Pendente': return 'text-yellow-500 bg-yellow-500/10';
            case 'Atrasado': return 'text-red-500 bg-red-500/10';
            default: return 'text-gray-500 bg-gray-500/10';
        }
    };

    // Metrics Calculation
    const totalPaid = records.filter(r => r.status === 'Pago').reduce((acc, curr) => acc + Number(curr.value), 0);
    const totalPending = records.filter(r => r.status === 'Pendente').reduce((acc, curr) => acc + Number(curr.value), 0);
    const totalOverdue = records.filter(r => r.status === 'Atrasado').reduce((acc, curr) => acc + Number(curr.value), 0);

    // Chart Data Preparation
    const monthlyRevenue = records
        .filter(r => r.status === 'Pago')
        .reduce((acc: any, curr) => {
            const month = new Date(curr.due_date).toLocaleString('pt-BR', { month: 'short' });
            acc[month] = (acc[month] || 0) + Number(curr.value);
            return acc;
        }, {});

    const barChartData = Object.keys(monthlyRevenue).map(key => ({
        name: key,
        value: monthlyRevenue[key]
    })).slice(-6); // Last 6 months

    const statusDistribution = [
        { name: 'Pago', value: records.filter(r => r.status === 'Pago').length, color: '#10b981' },
        { name: 'Pendente', value: records.filter(r => r.status === 'Pendente').length, color: '#f59e0b' },
        { name: 'Atrasado', value: records.filter(r => r.status === 'Atrasado').length, color: '#ef4444' }
    ].filter(item => item.value > 0);

    return (
        <div className="tab-content">
            <div className="tab-header-actions">
                <h2>Visão Financeira</h2>
                <button className="submit-button" onClick={() => setIsModalOpen(true)}>
                    <Plus size={16} style={{ marginRight: '0.5rem' }} />
                    Novo Lançamento
                </button>
            </div>

            {/* Metrics Cards */}
            <div className="overview-stats-grid">
                <div className="stat-card card-gradient-green">
                    <div className="stat-header">
                        <TrendingUp size={20} className="text-green-500" />
                        <h3>Total Recebido</h3>
                    </div>
                    <div className="stat-value">R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                </div>
                <div className="stat-card card-gradient-yellow">
                    <div className="stat-header">
                        <DollarSign size={20} className="text-yellow-500" />
                        <h3>Pendente</h3>
                    </div>
                    <div className="stat-value">R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                </div>
                <div className="stat-card card-gradient-blue" style={{ borderColor: 'rgba(239, 68, 68, 0.2)', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)' }}>
                    <div className="stat-header">
                        <AlertCircle size={20} className="text-red-500" />
                        <h3 style={{ color: '#ef4444' }}>Atrasado</h3>
                    </div>
                    <div className="stat-value">R$ {totalOverdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                </div>
            </div>

            {/* Charts Section */}
            {records.length > 0 && (
                <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div className="chart-card" style={{ backgroundColor: '#0f1115', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <h3 className="text-lg font-semibold text-white mb-4">Receita Mensal</h3>
                        <div style={{ height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barChartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="name" stroke="#9ca3af" />
                                    <YAxis stroke="#9ca3af" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="chart-card" style={{ backgroundColor: '#0f1115', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <h3 className="text-lg font-semibold text-white mb-4">Status dos Pagamentos</h3>
                        <div style={{ height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {statusDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* Records Table */}
            <div className="financial-table-container">
                {loading ? (
                    <p className="p-4 text-gray-400">Carregando financeiro...</p>
                ) : records.length === 0 ? (
                    <div className="empty-state p-8 text-center">
                        <p className="text-gray-400">Nenhum registro financeiro encontrado.</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Tipo</th>
                                <th>Valor</th>
                                <th>Vencimento</th>
                                <th>Método</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map(record => (
                                <tr key={record.id}>
                                    <td>{record.type}</td>
                                    <td className="font-medium text-white">R$ {record.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
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
                                                onClick={() => markAsPaid(record.id, record.value)}
                                            >
                                                <Check size={18} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Novo Lançamento</h2>
                            <button onClick={() => setIsModalOpen(false)} className="close-button">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Tipo</label>
                                <select
                                    className="form-input"
                                    value={newRecord.type}
                                    onChange={e => setNewRecord({ ...newRecord, type: e.target.value })}
                                >
                                    <option value="Mensalidade">Mensalidade</option>
                                    <option value="Implementação">Implementação</option>
                                    <option value="Extra">Extra</option>
                                </select>
                            </div>
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
                            <button type="submit" className="submit-button full-width">Salvar</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientFinancial;
