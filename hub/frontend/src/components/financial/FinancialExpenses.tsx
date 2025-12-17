import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Search, Trash2 } from 'lucide-react';

interface Expense {
    id: string;
    description: string;
    value: number;
    date: string;
    category_id: string;
    payment_method: string;
    status: 'Pago' | 'Pendente';
    category?: { name: string; color: string };
}

interface Category {
    id: string;
    name: string;
    color: string;
}

interface FinancialExpensesProps {
    autoOpen?: boolean;
    onCloseAutoOpen?: () => void;
}

const FinancialExpenses = ({ autoOpen, onCloseAutoOpen }: FinancialExpensesProps) => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newExpense, setNewExpense] = useState({
        description: '',
        value: 0,
        date: new Date().toISOString().split('T')[0],
        category_id: '',
        payment_method: 'Pix',
        status: 'Pago'
    });

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (autoOpen) {
            setIsModalOpen(true);
            if (onCloseAutoOpen) onCloseAutoOpen();
        }
    }, [autoOpen, onCloseAutoOpen]);

    const fetchData = async () => {
        try {
            const [expensesRes, categoriesRes] = await Promise.all([
                supabase.from('expenses').select('*, category:expense_categories(name, color)').order('date', { ascending: false }),
                supabase.from('expense_categories').select('*')
            ]);

            if (expensesRes.error) throw expensesRes.error;
            if (categoriesRes.error) throw categoriesRes.error;

            setExpenses(expensesRes.data || []);
            setCategories(categoriesRes.data || []);

            if (categoriesRes.data && categoriesRes.data.length > 0) {
                setNewExpense(prev => ({ ...prev, category_id: categoriesRes.data[0].id }));
            }
        } catch (error) {
            console.error('Error fetching expenses:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...newExpense,
                category_id: newExpense.category_id === '' ? null : newExpense.category_id
            };

            const { error } = await supabase
                .from('expenses')
                .insert([payload]);

            if (error) throw error;

            setIsModalOpen(false);
            setNewExpense({
                description: '',
                value: 0,
                date: new Date().toISOString().split('T')[0],
                category_id: categories[0]?.id || '',
                payment_method: 'Pix',
                status: 'Pago'
            });
            fetchData();
        } catch (error) {
            console.error('Error creating expense:', error);
            alert('Erro ao criar despesa: ' + error.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta despesa?')) return;
        try {
            const { error } = await supabase.from('expenses').delete().eq('id', id);
            if (error) throw error;
            fetchData();
        } catch (error) {
            console.error('Error deleting expense:', error);
        }
    };

    return (
        <div className="financial-expenses">
            <div className="filters-bar">
                <Search size={20} className="text-gray-400" />
                <input type="text" placeholder="Buscar despesas..." className="search-input" />
                <button className="submit-button" onClick={() => setIsModalOpen(true)}>
                    <Plus size={16} className="mr-2" />
                    Nova Despesa
                </button>
            </div>

            <div className="financial-table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Descrição</th>
                            <th>Categoria</th>
                            <th>Data</th>
                            <th>Valor</th>
                            <th>Método</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {expenses.map(expense => (
                            <tr key={expense.id}>
                                <td className="font-medium text-white">{expense.description}</td>
                                <td>
                                    <span
                                        className="px-2 py-1 rounded text-xs font-semibold"
                                        style={{
                                            backgroundColor: expense.category?.color + '20',
                                            color: expense.category?.color
                                        }}
                                    >
                                        {expense.category?.name || 'Sem Categoria'}
                                    </span>
                                </td>
                                <td>{new Date(expense.date).toLocaleDateString()}</td>
                                <td className="font-bold text-red-400">- R$ {expense.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                <td>{expense.payment_method}</td>
                                <td>
                                    <span className={`status-badge ${expense.status === 'Pago' ? 'status-active' : 'status-warning'}`}>
                                        {expense.status}
                                    </span>
                                </td>
                                <td>
                                    <button
                                        className="icon-button delete"
                                        onClick={() => handleDelete(expense.id)}
                                    >
                                        <Trash2 size={18} />
                                    </button>
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
                            <h2>Nova Despesa</h2>
                            <button onClick={() => setIsModalOpen(false)} className="close-button">×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Descrição</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={newExpense.description}
                                    onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Valor (R$)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={newExpense.value}
                                    onChange={e => setNewExpense({ ...newExpense, value: parseFloat(e.target.value) })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Categoria</label>
                                <select
                                    className="form-input"
                                    value={newExpense.category_id}
                                    onChange={e => setNewExpense({ ...newExpense, category_id: e.target.value })}
                                >
                                    <option value="">Selecione uma categoria...</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Data</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={newExpense.date}
                                    onChange={e => setNewExpense({ ...newExpense, date: e.target.value })}
                                    required
                                />
                            </div>
                            <button type="submit" className="submit-button full-width">Salvar Despesa</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinancialExpenses;
