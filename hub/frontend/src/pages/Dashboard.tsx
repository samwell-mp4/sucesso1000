import { useState, useEffect } from 'react';
import {
    Users,
    Bot,
    MessageSquare,
    DollarSign,
    TrendingUp,
    TrendingDown
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Legend
} from 'recharts';
import { supabase } from '../lib/supabase';
import '../styles/Dashboard.css';

const Dashboard = () => {
    const [stats, setStats] = useState({
        clients: 0,
        robots: 0,
        conversations: 0,
        revenue: 0,
        expenses: 0
    });
    const [loading, setLoading] = useState(true);

    // Mock data for charts (replace with real data later)
    const financialData = [
        { name: 'Jan', receita: 4000, despesa: 2400 },
        { name: 'Fev', receita: 3000, despesa: 1398 },
        { name: 'Mar', receita: 2000, despesa: 9800 },
        { name: 'Abr', receita: 2780, despesa: 3908 },
        { name: 'Mai', receita: 1890, despesa: 4800 },
        { name: 'Jun', receita: 2390, despesa: 3800 },
        { name: 'Jul', receita: 3490, despesa: 4300 },
    ];

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            // Fetch counts
            const { count: clientsCount } = await supabase.from('clients').select('*', { count: 'exact', head: true });
            const { count: robotsCount } = await supabase.from('robots').select('*', { count: 'exact', head: true });
            const { count: conversationsCount } = await supabase.from('conversations').select('*', { count: 'exact', head: true });

            // Fetch financial totals (mock for now or simple sum)
            // const { data: income } = await supabase.from('income').select('value');
            // const { data: expenses } = await supabase.from('expenses').select('value');

            setStats({
                clients: clientsCount || 0,
                robots: robotsCount || 0,
                conversations: conversationsCount || 0,
                revenue: 15400, // Mock
                expenses: 8200  // Mock
            });
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const KPICard = ({ title, value, icon: Icon, trend, color }: any) => (
        <div className="kpi-card">
            <div className="kpi-header">
                <div className={`kpi-icon-wrapper ${color}`}>
                    <Icon size={24} />
                </div>
                {trend && (
                    <span className={`kpi-trend ${trend > 0 ? 'positive' : 'negative'}`}>
                        {trend > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {Math.abs(trend)}%
                    </span>
                )}
            </div>
            <div className="kpi-content">
                <h3 className="kpi-value">{typeof value === 'number' && value > 1000 ? `R$ ${value.toLocaleString()}` : value}</h3>
                <p className="kpi-title">{title}</p>
            </div>
        </div>
    );

    return (
        <div className="dashboard-container">
            <div className="page-header">
                <h1 className="page-title">Dashboard</h1>
                <div className="date-filter">
                    <select className="form-input" style={{ width: 'auto' }}>
                        <option>Últimos 30 dias</option>
                        <option>Este Mês</option>
                        <option>Este Ano</option>
                    </select>
                </div>
            </div>

            <div className="kpi-grid">
                <KPICard
                    title="Clientes Ativos"
                    value={stats.clients}
                    icon={Users}
                    trend={12}
                    color="blue"
                />
                <KPICard
                    title="Robôs em Operação"
                    value={stats.robots}
                    icon={Bot}
                    trend={5}
                    color="purple"
                />
                <KPICard
                    title="Conversas Hoje"
                    value={stats.conversations}
                    icon={MessageSquare}
                    trend={-2}
                    color="orange"
                />
                <KPICard
                    title="Receita Mensal"
                    value={stats.revenue}
                    icon={DollarSign}
                    trend={8.5}
                    color="green"
                />
            </div>

            <div className="charts-grid">
                <div className="chart-card">
                    <h3>Receita x Despesas</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <AreaChart data={financialData}>
                                <defs>
                                    <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorDespesa" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip />
                                <Legend />
                                <Area type="monotone" dataKey="receita" stroke="#10b981" fillOpacity={1} fill="url(#colorReceita)" name="Receita" />
                                <Area type="monotone" dataKey="despesa" stroke="#ef4444" fillOpacity={1} fill="url(#colorDespesa)" name="Despesa" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-card">
                    <h3>Crescimento de Clientes</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={financialData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: '#f3f4f6' }} />
                                <Bar dataKey="receita" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Novos Clientes" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
