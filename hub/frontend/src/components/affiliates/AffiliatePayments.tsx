import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Search, X, Upload, Calendar, DollarSign, User } from 'lucide-react';
import { format } from 'date-fns';

interface Payment {
    id: string;
    affiliate_id: string;
    amount: number;
    period_start: string;
    period_end: string;
    payment_method: string;
    payment_date: string;
    receipt_url: string;
    status: 'Pendente' | 'Pago' | 'Retido';
    created_at: string;
    affiliates: {
        name: string;
        pix_key: string;
    };
}

interface AffiliateOption {
    id: string;
    name: string;
    pix_key: string;
}

const AffiliatePayments: React.FC = () => {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [affiliates, setAffiliates] = useState<AffiliateOption[]>([]);

    const [formData, setFormData] = useState({
        affiliate_id: '',
        amount: '',
        period_start: '',
        period_end: '',
        payment_method: 'PIX',
        payment_date: new Date().toISOString().slice(0, 10),
        receipt_url: '',
        status: 'Pago'
    });

    useEffect(() => {
        fetchPayments();
        fetchAffiliates();
    }, []);

    const fetchPayments = async () => {
        try {
            const { data, error } = await supabase
                .from('affiliate_payments')
                .select(`
                    *,
                    affiliates (name, pix_key)
                `)
                .order('payment_date', { ascending: false });

            if (error) throw error;
            setPayments(data || []);
        } catch (error) {
            console.error('Error fetching payments:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAffiliates = async () => {
        try {
            const { data } = await supabase
                .from('affiliates')
                .select('id, name, pix_key')
                .eq('status', 'Ativo')
                .order('name');
            setAffiliates(data || []);
        } catch (error) {
            console.error('Error fetching affiliates:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('affiliate_payments')
                .insert([{
                    affiliate_id: formData.affiliate_id,
                    amount: parseFloat(formData.amount),
                    period_start: formData.period_start || null,
                    period_end: formData.period_end || null,
                    payment_method: formData.payment_method,
                    payment_date: formData.payment_date,
                    receipt_url: formData.receipt_url,
                    status: formData.status
                }]);

            if (error) throw error;

            setIsModalOpen(false);
            resetForm();
            fetchPayments();
        } catch (error) {
            console.error('Error creating payment:', error);
            alert('Erro ao registrar pagamento');
        }
    };

    const resetForm = () => {
        setFormData({
            affiliate_id: '',
            amount: '',
            period_start: '',
            period_end: '',
            payment_method: 'PIX',
            payment_date: new Date().toISOString().slice(0, 10),
            receipt_url: '',
            status: 'Pago'
        });
    };

    const filteredPayments = payments.filter(payment =>
        payment.affiliates?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="tab-content">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-white">Pagamentos Realizados</h2>
                    <p className="text-gray-400">Histórico de pagamentos aos seus afiliados.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium"
                >
                    <Plus size={18} />
                    Novo Pagamento
                </button>
            </div>

            <div className="filters-bar">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por afiliado..."
                        className="search-input pl-10 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="financial-table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Afiliado</th>
                            <th>Data Pagamento</th>
                            <th>Período</th>
                            <th>Método</th>
                            <th>Valor</th>
                            <th>Status</th>
                            <th>Comprovante</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="text-center py-8 text-gray-400">Carregando...</td>
                            </tr>
                        ) : filteredPayments.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center py-8 text-gray-400">Nenhum pagamento registrado.</td>
                            </tr>
                        ) : (
                            filteredPayments.map((payment) => (
                                <tr key={payment.id}>
                                    <td className="font-medium text-white">
                                        {payment.affiliates?.name || 'N/A'}
                                        <div className="text-xs text-gray-500">{payment.affiliates?.pix_key}</div>
                                    </td>
                                    <td>{format(new Date(payment.payment_date), 'dd/MM/yyyy')}</td>
                                    <td className="text-xs text-gray-400">
                                        {payment.period_start && payment.period_end
                                            ? `${format(new Date(payment.period_start), 'dd/MM')} - ${format(new Date(payment.period_end), 'dd/MM')}`
                                            : '-'}
                                    </td>
                                    <td>{payment.payment_method}</td>
                                    <td className="font-bold text-green-400">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payment.amount)}
                                    </td>
                                    <td>
                                        <span className={`status-badge ${payment.status === 'Pago' ? 'status-active' : 'status-pending'}`}>
                                            {payment.status}
                                        </span>
                                    </td>
                                    <td>
                                        {payment.receipt_url ? (
                                            <a href={payment.receipt_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline flex items-center gap-1">
                                                <Upload size={14} /> Ver
                                            </a>
                                        ) : (
                                            <span className="text-gray-600">-</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* New Payment Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Registrar Pagamento</h2>
                            <button onClick={() => setIsModalOpen(false)} className="close-button">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Afiliado</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                    <select
                                        className="form-input pl-10"
                                        value={formData.affiliate_id}
                                        onChange={e => setFormData({ ...formData, affiliate_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Selecione um afiliado...</option>
                                        {affiliates.map(affiliate => (
                                            <option key={affiliate.id} value={affiliate.id}>
                                                {affiliate.name} {affiliate.pix_key ? `(PIX: ${affiliate.pix_key})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Valor (R$)</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="form-input pl-10"
                                            value={formData.amount}
                                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Data Pagamento</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="date"
                                            className="form-input pl-10"
                                            value={formData.payment_date}
                                            onChange={e => setFormData({ ...formData, payment_date: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Período Início</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={formData.period_start}
                                        onChange={e => setFormData({ ...formData, period_start: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Período Fim</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={formData.period_end}
                                        onChange={e => setFormData({ ...formData, period_end: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Método de Pagamento</label>
                                <select
                                    className="form-input"
                                    value={formData.payment_method}
                                    onChange={e => setFormData({ ...formData, payment_method: e.target.value })}
                                >
                                    <option value="PIX">PIX</option>
                                    <option value="Transferência">Transferência Bancária</option>
                                    <option value="Dinheiro">Dinheiro</option>
                                    <option value="Outro">Outro</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Link do Comprovante (Opcional)</label>
                                <div className="relative">
                                    <Upload className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        className="form-input pl-10"
                                        value={formData.receipt_url}
                                        onChange={e => setFormData({ ...formData, receipt_url: e.target.value })}
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>

                            <button type="submit" className="submit-button full-width mt-4">
                                Registrar Pagamento
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AffiliatePayments;
