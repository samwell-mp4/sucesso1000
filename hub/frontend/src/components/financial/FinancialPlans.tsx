import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Check, Edit2, Trash2, Package } from 'lucide-react';

interface Plan {
    id: string;
    name: string;
    price_implementation: number;
    price_monthly: number;
    price_annual: number;
    features: string[];
    status: 'active' | 'inactive';
}

const FinancialPlans = () => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        price_implementation: 0,
        price_monthly: 0,
        price_annual: 0,
        features: '',
        status: 'active'
    });

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const { data, error } = await supabase
                .from('plans')
                .select('*')
                .order('price_monthly', { ascending: true });

            if (error) throw error;
            setPlans(data || []);
        } catch (error) {
            console.error('Error fetching plans:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (editingPlan) {
            setFormData({
                name: editingPlan.name,
                price_implementation: editingPlan.price_implementation,
                price_monthly: editingPlan.price_monthly,
                price_annual: editingPlan.price_annual,
                features: Array.isArray(editingPlan.features) ? editingPlan.features.join('\n') : '',
                status: editingPlan.status
            });
            setIsModalOpen(true);
        } else {
            setFormData({
                name: '',
                price_implementation: 0,
                price_monthly: 0,
                price_annual: 0,
                features: '',
                status: 'active'
            });
        }
    }, [editingPlan]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const featuresArray = formData.features.split('\n').filter(f => f.trim() !== '');

            const planData = {
                name: formData.name,
                price_implementation: formData.price_implementation,
                price_monthly: formData.price_monthly,
                price_annual: formData.price_annual,
                features: featuresArray,
                status: formData.status
            };

            if (editingPlan) {
                const { error } = await supabase
                    .from('plans')
                    .update(planData)
                    .eq('id', editingPlan.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('plans')
                    .insert([planData]);
                if (error) throw error;
            }

            setIsModalOpen(false);
            setEditingPlan(null);
            fetchPlans();
        } catch (error) {
            console.error('Error saving plan:', error);
            alert('Erro ao salvar plano');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este plano?')) return;
        try {
            const { error } = await supabase.from('plans').delete().eq('id', id);
            if (error) throw error;
            fetchPlans();
        } catch (error) {
            console.error('Error deleting plan:', error);
        }
    };

    return (
        <div className="financial-plans">
            <div className="filters-bar" style={{ justifyContent: 'flex-end' }}>
                <button className="submit-button" onClick={() => setIsModalOpen(true)}>
                    <Plus size={16} className="mr-2" />
                    Novo Plano
                </button>
            </div>

            <div className="plans-grid">
                {plans.map(plan => (
                    <div key={plan.id} className={`plan-card ${plan.status === 'active' ? 'active' : ''}`}>
                        <div className="plan-header">
                            <h3>{plan.name}</h3>
                            <div className="plan-price">
                                R$ {plan.price_monthly.toLocaleString('pt-BR')}
                                <span className="plan-period">/mês</span>
                            </div>
                            <div className="text-sm text-gray-400 mt-2">
                                + R$ {plan.price_implementation.toLocaleString('pt-BR')} (Setup)
                            </div>
                        </div>

                        <ul className="plan-features">
                            {Array.isArray(plan.features) && plan.features.map((feature, index) => (
                                <li key={index}>
                                    <Check size={16} className="feature-check" />
                                    {feature}
                                </li>
                            ))}
                        </ul>

                        <div className="flex gap-2 mt-auto pt-4 border-t border-gray-800">
                            <button
                                className="icon-button flex-1"
                                onClick={() => setEditingPlan(plan)}
                            >
                                <Edit2 size={18} className="mr-2" /> Editar
                            </button>
                            <button
                                className="icon-button delete"
                                onClick={() => handleDelete(plan.id)}
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>{editingPlan ? 'Editar Plano' : 'Novo Plano'}</h2>
                            <button onClick={() => { setIsModalOpen(false); setEditingPlan(null); }} className="close-button">×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Nome do Plano</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="Ex: GPT Plus"
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="form-group">
                                    <label className="form-label">Setup (R$)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={formData.price_implementation}
                                        onChange={e => setFormData({ ...formData, price_implementation: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Mensal (R$)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={formData.price_monthly}
                                        onChange={e => setFormData({ ...formData, price_monthly: parseFloat(e.target.value) })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Anual (R$)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={formData.price_annual}
                                        onChange={e => setFormData({ ...formData, price_annual: parseFloat(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Recursos (um por linha)</label>
                                <textarea
                                    className="form-input"
                                    rows={5}
                                    value={formData.features}
                                    onChange={e => setFormData({ ...formData, features: e.target.value })}
                                    placeholder="3 Robôs&#10;Suporte VIP&#10;API Ilimitada"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Status</label>
                                <select
                                    className="form-input"
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                                >
                                    <option value="active">Ativo</option>
                                    <option value="inactive">Inativo</option>
                                </select>
                            </div>
                            <button type="submit" className="submit-button full-width">
                                {editingPlan ? 'Salvar Alterações' : 'Criar Plano'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinancialPlans;
