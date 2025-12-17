import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Building2, User, MapPin, DollarSign, Check } from 'lucide-react';
import '../styles/Modal.css';

import { supabase } from '../lib/supabase';

interface NewClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (clientData: any) => Promise<void>;
}

const STEPS = [
    { id: 1, title: 'Dados da Empresa', icon: Building2 },
    { id: 2, title: 'Contato', icon: User },
    { id: 3, title: 'Endereço', icon: MapPin },
    { id: 4, title: 'Comercial', icon: DollarSign }
];

const SEGMENTS = ['Clínica', 'Informática', 'Marketing', 'E-commerce', 'Varejo', 'Indústria', 'Outro'];
const ORIGINS = ['SEO', 'Google Ads', 'Instagram', 'WhatsApp', 'Indicação', 'Afiliado', 'Outro'];
const PLANS = ['Básico', 'Premium', 'Enterprise'];
const STATUSES = ['Lead novo', 'Em negociação', 'Proposta enviada', 'Aguardando pagamento', 'Ativo'];

const NewClientModal = ({ isOpen, onClose, onSave }: NewClientModalProps) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const initialFormData = {
        company_name: '',
        cnpj_cpf: '',
        segment: 'Outro',
        website: '',
        responsible_name: '',
        email: '',
        whatsapp: '',
        role: '',
        cep: '',
        address: '',
        number: '',
        neighborhood: '',
        city: '',
        state: '',
        plan: 'Básico',
        value: 0,
        status: 'Lead novo',
        seller: '',
        affiliate_id: '',
        lead_origin: 'Indicação',
        entry_date: new Date().toISOString().split('T')[0]
    };

    const [formData, setFormData] = useState(initialFormData);

    const [affiliates, setAffiliates] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setFormData(initialFormData);
            fetchAffiliates();
        }
    }, [isOpen]);

    const fetchAffiliates = async () => {
        try {
            const { data } = await supabase
                .from('affiliates')
                .select('id, name, code')
                .eq('status', 'Ativo')
                .order('name');
            setAffiliates(data || []);
        } catch (error) {
            console.error('Error fetching affiliates:', error);
        }
    };

    if (!isOpen) return null;

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNext = () => {
        if (step < STEPS.length) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // If an affiliate is selected, we can also store their name in the 'seller' text field for backward compatibility if needed,
            // or just rely on affiliate_id. The backend should handle the relation.
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content wizard-modal">
                <div className="modal-header">
                    <div className="wizard-header">
                        <h2>Novo Cliente</h2>
                        <p className="step-indicator">Passo {step} de {STEPS.length}: {STEPS[step - 1].title}</p>
                    </div>
                    <button onClick={onClose} className="close-button">
                        <X size={20} />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="wizard-progress">
                    {STEPS.map((s, index) => (
                        <div key={s.id} className={`progress-step ${step >= s.id ? 'active' : ''}`}>
                            <div className="step-icon">
                                <s.icon size={16} />
                            </div>
                            {index < STEPS.length - 1 && <div className="step-line" />}
                        </div>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="wizard-form">
                    <div className="wizard-body">
                        {step === 1 && (
                            <div className="step-content">
                                <div className="form-group">
                                    <label className="form-label">Nome da Empresa *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.company_name}
                                        onChange={e => handleChange('company_name', e.target.value)}
                                        required
                                        autoFocus
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">CNPJ / CPF</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.cnpj_cpf}
                                            onChange={e => handleChange('cnpj_cpf', e.target.value)}
                                            placeholder="00.000.000/0000-00"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Segmento</label>
                                        <select
                                            className="form-input"
                                            value={formData.segment}
                                            onChange={e => handleChange('segment', e.target.value)}
                                        >
                                            {SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Site / Instagram</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.website}
                                        onChange={e => handleChange('website', e.target.value)}
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="step-content">
                                <div className="form-group">
                                    <label className="form-label">Nome do Responsável</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.responsible_name}
                                        onChange={e => handleChange('responsible_name', e.target.value)}
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Cargo</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.role}
                                            onChange={e => handleChange('role', e.target.value)}
                                            placeholder="Ex: Sócio, Gerente"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">WhatsApp</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.whatsapp}
                                            onChange={e => handleChange('whatsapp', e.target.value)}
                                            placeholder="(00) 00000-0000"
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">E-mail</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        value={formData.email}
                                        onChange={e => handleChange('email', e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="step-content">
                                <div className="form-row">
                                    <div className="form-group" style={{ flex: '0 0 120px' }}>
                                        <label className="form-label">CEP</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.cep}
                                            onChange={e => handleChange('cep', e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Cidade</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.city}
                                            onChange={e => handleChange('city', e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group" style={{ flex: '0 0 60px' }}>
                                        <label className="form-label">UF</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.state}
                                            onChange={e => handleChange('state', e.target.value)}
                                            maxLength={2}
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group" style={{ flex: 2 }}>
                                        <label className="form-label">Endereço</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.address}
                                            onChange={e => handleChange('address', e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">Número</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.number}
                                            onChange={e => handleChange('number', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Bairro</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.neighborhood}
                                        onChange={e => handleChange('neighborhood', e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="step-content">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Plano</label>
                                        <select
                                            className="form-input"
                                            value={formData.plan}
                                            onChange={e => handleChange('plan', e.target.value)}
                                        >
                                            {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Valor (R$)</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={formData.value}
                                            onChange={e => handleChange('value', parseFloat(e.target.value))}
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Status</label>
                                        <select
                                            className="form-input"
                                            value={formData.status}
                                            onChange={e => handleChange('status', e.target.value)}
                                        >
                                            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Origem</label>
                                        <select
                                            className="form-input"
                                            value={formData.lead_origin}
                                            onChange={e => handleChange('lead_origin', e.target.value)}
                                        >
                                            {ORIGINS.map(o => <option key={o} value={o}>{o}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Vendedor / Afiliado</label>
                                    <select
                                        className="form-input"
                                        value={formData.affiliate_id || ''}
                                        onChange={e => {
                                            const affiliateId = e.target.value;
                                            const affiliate = affiliates.find(a => a.id === affiliateId);
                                            setFormData(prev => ({
                                                ...prev,
                                                affiliate_id: affiliateId,
                                                seller: affiliate ? affiliate.name : '' // Keep seller name for sync
                                            }));
                                        }}
                                    >
                                        <option value="">Selecione um vendedor...</option>
                                        {affiliates.map(affiliate => (
                                            <option key={affiliate.id} value={affiliate.id}>
                                                {affiliate.name} ({affiliate.code})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Data de Entrada</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={formData.entry_date}
                                        onChange={e => handleChange('entry_date', e.target.value)}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="wizard-footer">
                        {step > 1 ? (
                            <button type="button" onClick={handleBack} className="secondary-button">
                                <ChevronLeft size={16} className="mr-1" /> Voltar
                            </button>
                        ) : (
                            <div></div> // Spacer
                        )}

                        {step < STEPS.length ? (
                            <button type="button" onClick={handleNext} className="submit-button">
                                Próximo <ChevronRight size={16} className="ml-1" />
                            </button>
                        ) : (
                            <button type="submit" className="submit-button" disabled={loading}>
                                {loading ? 'Salvando...' : 'Finalizar Cadastro'} <Check size={16} className="ml-1" />
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <style>{`
                .wizard-modal {
                    max-width: 600px;
                    padding: 0;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    max-height: 90vh;
                }
                .modal-header {
                    padding: 1.5rem 2rem;
                    border-bottom: 1px solid var(--border-color);
                    background: var(--bg-card);
                    margin-bottom: 0;
                }
                .step-indicator {
                    font-size: 0.875rem;
                    color: var(--text-secondary);
                    margin-top: 0.25rem;
                }
                .wizard-progress {
                    display: flex;
                    justify-content: space-between;
                    padding: 1.5rem 3rem;
                    background: var(--bg-sidebar);
                }
                .progress-step {
                    display: flex;
                    align-items: center;
                    flex: 1;
                    position: relative;
                }
                .progress-step:last-child {
                    flex: 0;
                }
                .step-icon {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: var(--bg-input);
                    border: 2px solid var(--border-color);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--text-secondary);
                    z-index: 2;
                    transition: all 0.3s ease;
                }
                .progress-step.active .step-icon {
                    background: var(--primary);
                    border-color: var(--primary);
                    color: white;
                    box-shadow: 0 0 10px rgba(255, 85, 0, 0.4);
                }
                .step-line {
                    flex: 1;
                    height: 2px;
                    background: var(--border-color);
                    margin: 0 10px;
                    transition: all 0.3s ease;
                }
                .progress-step.active .step-line {
                    background: var(--primary);
                }
                .wizard-form {
                    display: flex;
                    flex-direction: column;
                    flex: 1;
                    overflow: hidden;
                }
                .wizard-body {
                    padding: 2rem;
                    overflow-y: auto;
                    flex: 1;
                }
                .wizard-footer {
                    padding: 1.5rem 2rem;
                    border-top: 1px solid var(--border-color);
                    background: var(--bg-card);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .form-row {
                    display: flex;
                    gap: 1rem;
                }
                .form-row .form-group {
                    flex: 1;
                }
                .mr-1 { margin-right: 0.25rem; }
                .ml-1 { margin-left: 0.25rem; }
            `}</style>
        </div>
    );
};

export default NewClientModal;
