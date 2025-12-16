import { useState, useEffect } from 'react';
import { Edit2, Trash2, Plus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import '../styles/Affiliates.css';
import '../styles/Robots.css'; // Reuse table styles

interface Affiliate {
    id: number;
    name: string;
    email: string;
    code: string;
    sales: number;
    total_sold: number;
    status: string;
}

const Affiliates = () => {
    const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newAffiliate, setNewAffiliate] = useState({
        name: '',
        email: '',
        code: '',
        sales: 0,
        total_sold: 0,
        status: 'active'
    });

    useEffect(() => {
        fetchAffiliates();
    }, []);

    const fetchAffiliates = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'seller') // Assuming there's a role column or we filter by some other means
                .order('name', { ascending: true });

            if (error) throw error;
            setAffiliates(data || []);
        } catch (error) {
            console.error('Error fetching affiliates:', error);
            // Fallback for demo if table structure is different
            setAffiliates([]);
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (id: number, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;

            setAffiliates(affiliates.map(aff =>
                aff.id === id ? { ...aff, status: newStatus } : aff
            ));
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Erro ao atualizar status');
        }
    };

    const handleCreateAffiliate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // In a real app, creating a user usually involves Auth API
            // Here we just insert into profiles for the demo
            const { error } = await supabase
                .from('profiles')
                .insert([{ ...newAffiliate, role: 'seller', status: 'active' }]);

            if (error) throw error;

            setIsModalOpen(false);
            setNewAffiliate({
                name: '',
                email: '',
                code: '',
                sales: 0,
                total_sold: 0,
                status: 'active'
            });
            fetchAffiliates();
        } catch (error) {
            console.error('Error creating affiliate:', error);
            alert('Erro ao criar afiliado');
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Afiliados / Vendedores</h1>
                <button className="submit-button" style={{ width: 'auto' }} onClick={() => setIsModalOpen(true)}>
                    <Plus size={16} style={{ marginRight: '0.5rem' }} />
                    Novo Vendedor
                </button>
            </div>

            {loading ? (
                <p>Carregando...</p>
            ) : (
                <div className="robots-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Email</th>
                                <th>Código</th>
                                <th>Vendas</th>
                                <th>Total Vendido</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {affiliates.map((aff) => (
                                <tr key={aff.id}>
                                    <td>
                                        <div className="client-name">{aff.name}</div>
                                    </td>
                                    <td>{aff.email}</td>
                                    <td>
                                        <span className="status-badge status-warning">{aff.code}</span>
                                    </td>
                                    <td>{aff.sales}</td>
                                    <td>R$ {aff.total_sold.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                    <td>
                                        <label className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={aff.status === 'active'}
                                                onChange={() => toggleStatus(aff.id, aff.status)}
                                            />
                                            <span className="slider"></span>
                                        </label>
                                    </td>
                                    <td>
                                        <button className="action-button" style={{ marginRight: '1rem' }}>
                                            <Edit2 size={16} />
                                        </button>
                                        <button className="action-button" style={{ color: '#ef4444' }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Novo Vendedor</h2>
                            <button onClick={() => setIsModalOpen(false)} className="close-button">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateAffiliate}>
                            <div className="form-group">
                                <label className="form-label">Nome</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={newAffiliate.name}
                                    onChange={e => setNewAffiliate({ ...newAffiliate, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    value={newAffiliate.email}
                                    onChange={e => setNewAffiliate({ ...newAffiliate, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Código de Afiliado</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={newAffiliate.code}
                                    onChange={e => setNewAffiliate({ ...newAffiliate, code: e.target.value })}
                                    required
                                />
                            </div>
                            <button type="submit" className="submit-button">Criar Vendedor</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Affiliates;
