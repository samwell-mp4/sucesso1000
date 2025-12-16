import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import '../styles/Sales.css';
import '../styles/Robots.css'; // Reuse table styles

interface Sale {
    id: number;
    client_name: string;
    product: string;
    value: number;
    commission: number;
    seller_name: string;
    date: string;
    status: 'completed' | 'pending';
}

const Sales = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSales();
    }, [user]);

    const fetchSales = async () => {
        try {
            let query = supabase
                .from('sales')
                .select('*')
                .order('date', { ascending: false });

            if (!isAdmin && user) {
                // Filter by seller name (assuming seller_name matches user name or part of it)
                // In a real app, we should use user ID relation
                query = query.ilike('seller_name', `%${user.name.split(' ')[0]}%`);
            }

            const { data, error } = await query;

            if (error) throw error;
            setSales(data || []);
        } catch (error) {
            console.error('Error fetching sales:', error);
        } finally {
            setLoading(false);
        }
    };

    const totalSales = sales.reduce((acc, curr) => acc + curr.value, 0);
    const totalCommission = sales.reduce((acc, curr) => acc + curr.commission, 0);

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Vendas</h1>
                {isAdmin && <button className="submit-button" style={{ width: 'auto' }}>Exportar Relatório</button>}
            </div>

            {loading ? (
                <p>Carregando...</p>
            ) : (
                <>
                    <div className="sales-summary">
                        <div className="summary-card">
                            <p className="summary-label">Total Vendido</p>
                            <p className="summary-value">R$ {totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                        {isAdmin && (
                            <div className="summary-card">
                                <p className="summary-label">Total Comissões</p>
                                <p className="summary-value commission-value">R$ {totalCommission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </div>
                        )}
                        <div className="summary-card">
                            <p className="summary-label">Vendas Realizadas</p>
                            <p className="summary-value">{sales.length}</p>
                        </div>
                    </div>

                    <div className="sales-table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Cliente</th>
                                    <th>Produto</th>
                                    <th>Valor</th>
                                    {isAdmin && <th>Comissão</th>}
                                    <th>Vendedor</th>
                                    <th>Data</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sales.map((sale) => (
                                    <tr key={sale.id}>
                                        <td>{sale.client_name}</td>
                                        <td>{sale.product}</td>
                                        <td>R$ {sale.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                        {isAdmin && <td className="commission-value">R$ {sale.commission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>}
                                        <td>{sale.seller_name}</td>
                                        <td>{new Date(sale.date).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`robot-status ${sale.status === 'completed' ? 'status-active' : 'status-offline'}`}>
                                                {sale.status === 'completed' ? 'Confirmado' : 'Pendente'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

export default Sales;
