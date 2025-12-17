import { useState } from 'react';
import { LayoutDashboard, TrendingUp, TrendingDown, FileText, Settings, Package } from 'lucide-react';
import FinancialDashboard from '../components/financial/FinancialDashboard';
import FinancialIncome from '../components/financial/FinancialIncome';
import FinancialExpenses from '../components/financial/FinancialExpenses';
import FinancialPlans from '../components/financial/FinancialPlans';
import '../styles/Financial.css';

const Financial = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [autoOpenModal, setAutoOpenModal] = useState<string | null>(null);

    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'income', label: 'Receitas', icon: TrendingUp },
        { id: 'expenses', label: 'Despesas', icon: TrendingDown },
        { id: 'plans', label: 'Planos', icon: Package },
        { id: 'contracts', label: 'Contratos', icon: FileText },
        { id: 'settings', label: 'Configurações', icon: Settings },
    ];

    return (
        <div className="financial-page">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
                <div className="financial-header mb-0">
                    <h1>Módulo Financeiro</h1>
                    <p>Gestão completa de receitas, despesas e contratos.</p>
                </div>

            </div>

            <div className="tabs-container mt-0">
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
                    {activeTab === 'dashboard' && <FinancialDashboard />}
                    {activeTab === 'income' && (
                        <FinancialIncome
                            autoOpen={autoOpenModal === 'income'}
                            onCloseAutoOpen={() => setAutoOpenModal(null)}
                        />
                    )}
                    {activeTab === 'expenses' && (
                        <FinancialExpenses
                            autoOpen={autoOpenModal === 'expenses'}
                            onCloseAutoOpen={() => setAutoOpenModal(null)}
                        />
                    )}
                    {activeTab === 'plans' && <FinancialPlans />}
                    {activeTab === 'contracts' && <div className="placeholder-tab">Módulo de Contratos em desenvolvimento</div>}
                    {activeTab === 'settings' && <div className="placeholder-tab">Configurações em desenvolvimento</div>}
                </div>
            </div>
        </div>
    );
};

export default Financial;
