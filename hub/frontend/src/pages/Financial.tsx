import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { DollarSign, TrendingUp, TrendingDown, PieChart } from 'lucide-react';
import '../styles/ClientDetails.css'; // Reuse tab styles
import '../styles/Robots.css'; // Reuse table styles

const Financial = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(false); // Placeholder for now

    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: PieChart },
        { id: 'income', label: 'Receitas', icon: TrendingUp },
        { id: 'expenses', label: 'Despesas', icon: TrendingDown },
    ];

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Financeiro</h1>
                <button className="submit-button" style={{ width: 'auto' }}>
                    <DollarSign size={16} style={{ marginRight: '0.5rem' }} />
                    Nova Transação
                </button>
            </div>

            <div className="tabs-container">
                <div className="tabs-header">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="tabs-content-area">
                    {activeTab === 'dashboard' && (
                        <div className="tab-content">
                            <h2>Visão Geral Financeira</h2>
                            <p>Gráficos e totais (Em breve)</p>
                        </div>
                    )}
                    {activeTab === 'income' && (
                        <div className="tab-content">
                            <h2>Receitas</h2>
                            <p>Lista de receitas (Em breve)</p>
                        </div>
                    )}
                    {activeTab === 'expenses' && (
                        <div className="tab-content">
                            <h2>Despesas</h2>
                            <p>Lista de despesas (Em breve)</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Financial;
