import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, User, MapPin, DollarSign, CreditCard } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import '../../styles/Modal.css';

interface AffiliateFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    affiliate?: any; // If provided, it's edit mode
}

const AffiliateFormModal: React.FC<AffiliateFormModalProps> = ({ isOpen, onClose, onSuccess, affiliate }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        cpf: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pix_key: '',
        code: '',
        type: 'Afiliado',
        commission_rate_implementation: 0,
        commission_rate_monthly: 0,
        status: 'Ativo'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (affiliate) {
            setFormData({
                name: affiliate.name,
                email: affiliate.email,
                cpf: affiliate.cpf || '',
                phone: affiliate.phone || '',
                address: affiliate.address || '',
                city: affiliate.city || '',
                state: affiliate.state || '',
                pix_key: affiliate.pix_key || '',
                code: affiliate.code,
                type: affiliate.type,
                commission_rate_implementation: affiliate.commission_rate_implementation,
                commission_rate_monthly: affiliate.commission_rate_monthly,
                status: affiliate.status
            });
        } else {
            setFormData({
                name: '',
                email: '',
                cpf: '',
                phone: '',
                address: '',
                city: '',
                state: '',
                pix_key: '',
                code: '',
                type: 'Afiliado',
                commission_rate_implementation: 0,
                commission_rate_monthly: 0,
                status: 'Ativo'
            });
        }
        setError(null);
    }, [affiliate, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name.includes('rate') ? parseFloat(value) : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (affiliate) {
                const { error } = await supabase
                    .from('affiliates')
                    .update(formData)
                    .eq('id', affiliate.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('affiliates')
                    .insert([formData]);
                if (error) throw error;
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error saving affiliate:', err);
            setError(err.message || 'Erro ao salvar afiliado.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content modal-lg">
                <div className="modal-header">
                    <h2>{affiliate ? 'Editar Afiliado' : 'Novo Afiliado'}</h2>
                    <button className="close-button" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    {error && (
                        <div className="error-message">
                            <AlertCircle size={20} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="form-sections-container">
                        {/* Dados Pessoais */}
                        <div className="form-section">
                            <div className="section-header">
                                <User size={18} />
                                <h3>Dados Pessoais</h3>
                            </div>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>Nome Completo</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        placeholder="Ex: João Silva"
                                        className="premium-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>CPF</label>
                                    <input
                                        type="text"
                                        name="cpf"
                                        value={formData.cpf}
                                        onChange={handleChange}
                                        placeholder="000.000.000-00"
                                        className="premium-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Telefone / WhatsApp</label>
                                    <input
                                        type="text"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="(00) 00000-0000"
                                        className="premium-input"
                                    />
                                </div>
                                <div className="form-group full-width">
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        placeholder="joao@email.com"
                                        className="premium-input"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Endereço */}
                        <div className="form-section">
                            <div className="section-header">
                                <MapPin size={18} />
                                <h3>Endereço</h3>
                            </div>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>Endereço Completo</label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="Rua, Número, Bairro"
                                        className="premium-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Cidade</label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        placeholder="Cidade"
                                        className="premium-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Estado</label>
                                    <input
                                        type="text"
                                        name="state"
                                        value={formData.state}
                                        onChange={handleChange}
                                        placeholder="UF"
                                        className="premium-input"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Configurações de Afiliado */}
                        <div className="form-section">
                            <div className="section-header">
                                <DollarSign size={18} />
                                <h3>Configurações de Afiliado</h3>
                            </div>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Código (Único)</label>
                                    <input
                                        type="text"
                                        name="code"
                                        value={formData.code}
                                        onChange={handleChange}
                                        required
                                        placeholder="Ex: JOAO10"
                                        className="premium-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Tipo</label>
                                    <select name="type" value={formData.type} onChange={handleChange} className="premium-select">
                                        <option value="Afiliado">Afiliado Externo</option>
                                        <option value="Vendedor Interno">Vendedor Interno</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select name="status" value={formData.status} onChange={handleChange} className="premium-select">
                                        <option value="Ativo">Ativo</option>
                                        <option value="Inativo">Inativo</option>
                                        <option value="Suspenso">Suspenso</option>
                                        <option value="Bloqueado">Bloqueado</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Chave PIX</label>
                                    <input
                                        type="text"
                                        name="pix_key"
                                        value={formData.pix_key}
                                        onChange={handleChange}
                                        placeholder="CPF, Email ou Aleatória"
                                        className="premium-input"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Comissões */}
                        <div className="form-section">
                            <div className="section-header">
                                <CreditCard size={18} />
                                <h3>Comissões (%)</h3>
                            </div>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Implementação (%)</label>
                                    <div className="input-suffix-group">
                                        <input
                                            type="number"
                                            name="commission_rate_implementation"
                                            value={formData.commission_rate_implementation}
                                            onChange={handleChange}
                                            min="0"
                                            max="100"
                                            step="0.1"
                                            className="premium-input"
                                        />
                                        <span className="suffix">%</span>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Mensalidade (%)</label>
                                    <div className="input-suffix-group">
                                        <input
                                            type="number"
                                            name="commission_rate_monthly"
                                            value={formData.commission_rate_monthly}
                                            onChange={handleChange}
                                            min="0"
                                            max="100"
                                            step="0.1"
                                            className="premium-input"
                                        />
                                        <span className="suffix">%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="cancel-button" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="save-button" disabled={loading}>
                            <Save size={20} />
                            {loading ? 'Salvando...' : 'Salvar Afiliado'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AffiliateFormModal;
