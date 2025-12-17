import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, MoreVertical, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import AffiliateFormModal from './AffiliateFormModal';

interface Affiliate {
    id: string;
    name: string;
    email: string;
    cpf?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    pix_key?: string;
    code: string;
    type: string;
    status: string;
    commission_rate_implementation: number;
    commission_rate_monthly: number;
    created_at: string;
}

const AffiliatesList: React.FC = () => {
    const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | undefined>(undefined);

    const fetchAffiliates = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('affiliates')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAffiliates(data || []);
        } catch (error) {
            console.error('Error fetching affiliates:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAffiliates();
    }, []);

    const handleEdit = (affiliate: Affiliate) => {
        setSelectedAffiliate(affiliate);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedAffiliate(undefined);
        setIsModalOpen(true);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Ativo':
                return <span className="status-badge status-active"><CheckCircle size={14} /> Ativo</span>;
            case 'Inativo':
                return <span className="status-badge status-inactive"><XCircle size={14} /> Inativo</span>;
            case 'Suspenso':
            case 'Bloqueado':
                return <span className="status-badge status-warning"><AlertTriangle size={14} /> {status}</span>;
            default:
                return <span className="status-badge status-inactive">{status}</span>;
        }
    };

    const filteredAffiliates = affiliates.filter(affiliate =>
        affiliate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        affiliate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        affiliate.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="financial-dashboard-grid" style={{ display: 'block' }}>
            <div className="filters-bar">
                <div className="search-container" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Search size={20} color="#9ca3af" />
                    <input
                        type="text"
                        placeholder="Buscar por nome, email ou código..."
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="action-button" onClick={handleAdd}>
                    <Plus size={20} />
                    Novo Afiliado
                </button>
            </div>

            <div className="financial-table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Código</th>
                            <th>Tipo</th>
                            <th>Comissões (Imp/Mensal)</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Carregando...</td>
                            </tr>
                        ) : filteredAffiliates.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Nenhum afiliado encontrado.</td>
                            </tr>
                        ) : (
                            filteredAffiliates.map((affiliate) => (
                                <tr key={affiliate.id}>
                                    <td>
                                        <div style={{ fontWeight: 500, color: 'white' }}>{affiliate.name}</div>
                                        <div style={{ fontSize: '0.85rem', color: '#9ca3af' }}>{affiliate.email}</div>
                                    </td>
                                    <td>
                                        <span style={{
                                            backgroundColor: 'rgba(255,255,255,0.05)',
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            fontFamily: 'monospace'
                                        }}>
                                            {affiliate.code}
                                        </span>
                                    </td>
                                    <td>{affiliate.type}</td>
                                    <td>
                                        {affiliate.commission_rate_implementation}% / {affiliate.commission_rate_monthly}%
                                    </td>
                                    <td>{getStatusBadge(affiliate.status)}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                className="icon-button"
                                                title="Editar"
                                                onClick={() => handleEdit(affiliate)}
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <AffiliateFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchAffiliates}
                affiliate={selectedAffiliate}
            />
        </div>
    );
};

export default AffiliatesList;
