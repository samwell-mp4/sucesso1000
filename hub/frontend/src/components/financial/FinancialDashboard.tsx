import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Users, AlertCircle } from 'lucide-react';

const FinancialDashboard = () => {
    const [metrics, setMetrics] = useState({
        totalRevenue: 0,
        mrr: 0,
        expenses: 0,
        profit: 0,
        pending: 0,
        overdue: 0
    });
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // Fetch Financial Records (Income)
            const { data: incomeData } = await supabase
                .from('financial_records')
                .select('*');

            // Fetch Expenses
            const { data: expenseData } = await supabase
                .from('expenses')
                .select('*');

            if (incomeData && expenseData) {
                calculateMetrics(incomeData, expenseData);
                prepareChartData(incomeData, expenseData);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateMetrics = (income: any[], expenses: any[]) => {
        const totalRevenue = income
            .filter(r => r.status === 'Pago')
            .reduce((acc, curr) => acc + Number(curr.value), 0);

        const totalExpenses = expenses
            .filter(e => e.status === 'Pago')
            .reduce((acc, curr) => acc + Number(curr.value), 0);

        const mrr = income
            .filter(r => r.status === 'Pago' && r.type === 'Mensalidade')
            .reduce((acc, curr) => acc + Number(curr.value), 0); // Simplified MRR calculation

        const pending = income
            .filter(r => r.status === 'Pendente')
            .reduce((acc, curr) => acc + Number(curr.value), 0);

        const overdue = income
            .filter(r => r.status === 'Atrasado')
            .reduce((acc, curr) => acc + Number(curr.value), 0);

        setMetrics({
            totalRevenue,
            mrr,
            expenses: totalExpenses,
            profit: totalRevenue - totalExpenses,
            pending,
            overdue
        });
    };

    const prepareChartData = (income: any[], expenses: any[]) => {
        // Group by month (simplified for last 6 months)
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun']; // Dynamic generation needed in real app
        const data = months.map(month => ({
            name: month,
            receita: Math.floor(Math.random() * 50000) + 10000, // Placeholder logic
            despesa: Math.floor(Math.random() * 20000) + 5000,
        }));
        setRevenueData(data);
    };

    if (loading) return <div className="p-8 text-center text-gray-400">Carregando dashboard...</div>;

    return (
        <div className="financial-dashboard">
            <div className="financial-dashboard-grid">
                <div className="metric-card">
                    <div className="metric-header">
                        <span>Receita Total</span>
                        <DollarSign size={16} className="text-green-500" />
                    </div>
                    <div className="metric-value">R$ {metrics.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                    <div className="metric-trend trend-up">
                        <TrendingUp size={14} />
                        <span>+12.5% vs mês anterior</span>
                    </div>
                </div>

                <div className="metric-card">
                    <div className="metric-header">
                        <span>MRR (Recorrência)</span>
                        <TrendingUp size={16} className="text-blue-500" />
                    </div>
                    <div className="metric-value">R$ {metrics.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                    <div className="metric-trend trend-up">
                        <TrendingUp size={14} />
                        <span>+5.2% vs mês anterior</span>
                    </div>
                </div>

                <div className="metric-card">
                    <div className="metric-header">
                        <span>Despesas</span>
                        <TrendingDown size={16} className="text-red-500" />
                    </div>
                    <div className="metric-value">R$ {metrics.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                    <div className="metric-trend trend-down">
                        <TrendingDown size={14} />
                        <span>-2.1% vs mês anterior</span>
                    </div>
                </div>

                <div className="metric-card" style={{ borderColor: metrics.profit >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)' }}>
                    <div className="metric-header">
                        <span>Lucro Líquido</span>
                        <DollarSign size={16} className={metrics.profit >= 0 ? 'text-green-500' : 'text-red-500'} />
                    </div>
                    <div className={`metric-value ${metrics.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        R$ {metrics.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                </div>
            </div>

            <div className="charts-section">
                <div className="chart-container">
                    <div className="chart-header">
                        <h3>Receita x Despesas</h3>
                    </div>
                    <ResponsiveContainer width="100%" height="90%">
                        <AreaChart data={revenueData}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" stroke="#6b7280" />
                            <YAxis stroke="#6b7280" />
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                            <Area type="monotone" dataKey="receita" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" />
                            <Area type="monotone" dataKey="despesa" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-container">
                    <div className="chart-header">
                        <h3>Status de Pagamentos</h3>
                    </div>
                    <ResponsiveContainer width="100%" height="90%">
                        <PieChart>
                            <Pie
                                data={[
                                    { name: 'Pago', value: metrics.totalRevenue, color: '#10b981' },
                                    { name: 'Pendente', value: metrics.pending, color: '#f59e0b' },
                                    { name: 'Atrasado', value: metrics.overdue, color: '#ef4444' }
                                ]}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                <Cell fill="#10b981" />
                                <Cell fill="#f59e0b" />
                                <Cell fill="#ef4444" />
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default FinancialDashboard;
