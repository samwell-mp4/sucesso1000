import { useState, useEffect } from 'react';
import { Search, RefreshCw, User, Phone, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import WhatsAppMessageModal from '../../components/WhatsAppMessageModal';
import '../../styles/WhatsAppContacts.css';

interface Contact {
    id?: number;
    numeroContato: string;
    name: string;
    picture: string;
    status?: string;
    tags?: string[];
    lastInteraction?: string;
}

const STATUS_OPTIONS = [
    { label: 'Lead novo', value: 'Lead novo', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    { label: 'Em negociação', value: 'Em negociação', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    { label: 'Proposta enviada', value: 'Proposta enviada', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    { label: 'Aguardando pagamento', value: 'Aguardando pagamento', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    { label: 'Ativo', value: 'Ativo', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
];

const WhatsAppContacts = () => {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [openStatusMenu, setOpenStatusMenu] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPhone, setSelectedPhone] = useState('');

    const UPDATE_INTERVAL = 30 * 60 * 1000; // 30 minutes

    // Helper to generate mock CRM data (only for tags/interaction now)
    const enrichWithMockCRMData = (contact: any): Contact => {
        const allTags = ['Quente', 'Novo', 'Retorno', 'Interessado', 'VIP'];

        // Deterministic pseudo-random based on phone number length/char code
        const seed = contact.numero?.length || 0;
        const tags = [allTags[seed % allTags.length]];
        if (seed % 2 === 0) tags.push(allTags[(seed + 1) % allTags.length]);

        return {
            id: contact.id,
            numeroContato: contact.numero,
            name: contact.nome,
            picture: contact.url,
            status: contact.status || 'Lead novo', // Use DB status or default
            tags: tags,
            lastInteraction: 'Hoje, 14:30' // Mocked
        };
    };

    const fetchContacts = async () => {
        setLoading(true);
        console.log('Fetching contacts from Supabase...');
        try {
            // 1. Fetch raw contacts from the ephemeral table
            const { data: rawContacts, error: rawError } = await supabase
                .from('contatos')
                .select('id, numero, nome, url');

            if (rawError) throw rawError;

            // 2. Fetch persistent details (status, tags)
            const { data: details, error: detailsError } = await supabase
                .from('contact_details')
                .select('numero, status, tags');

            if (detailsError) throw detailsError;

            // 3. Merge data
            const detailsMap = new Map(details?.map(d => [d.numero, d]));

            const mergedContacts: Contact[] = (rawContacts || []).map(contact => {
                const detail = detailsMap.get(contact.numero);
                // Use persistent status if available, otherwise default
                const status = detail?.status || 'Lead novo';
                const tags = detail?.tags || enrichWithMockCRMData(contact).tags; // Keep mock tags if no persistent ones yet

                return {
                    id: contact.id,
                    numeroContato: contact.numero,
                    name: contact.nome,
                    picture: contact.url,
                    status: status,
                    tags: tags,
                    lastInteraction: 'Hoje, 14:30' // Still mocked for now
                };
            });

            setContacts(mergedContacts);
            setLastUpdated(new Date());

        } catch (error) {
            console.error('Unexpected error fetching contacts:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateContactStatus = async (numero: string, newStatus: string) => {
        try {
            // Optimistic update
            setContacts(prev => prev.map(c =>
                c.numeroContato === numero ? { ...c, status: newStatus } : c
            ));
            setOpenStatusMenu(null);

            // Upsert into persistent table
            const { error } = await supabase
                .from('contact_details')
                .upsert({
                    numero: numero,
                    status: newStatus,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'numero' });

            if (error) {
                console.error('Error updating status:', error);
                // Revert on error
                fetchContacts();
            }
        } catch (error) {
            console.error('Error updating status:', error);
            fetchContacts();
        }
    };

    useEffect(() => {
        fetchContacts();
        const intervalId = setInterval(fetchContacts, UPDATE_INTERVAL);

        const handleClickOutside = () => setOpenStatusMenu(null);
        document.addEventListener('click', handleClickOutside);

        return () => {
            clearInterval(intervalId);
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    const handleContactClick = (phone: string) => {
        setSelectedPhone(phone);
        setIsModalOpen(true);
    };

    const toggleSelection = (e: React.MouseEvent, phone: string) => {
        e.stopPropagation();
        setSelectedContacts(prev =>
            prev.includes(phone)
                ? prev.filter(p => p !== phone)
                : [...prev, phone]
        );
    };

    const handleStatusClick = (e: React.MouseEvent, numero: string) => {
        e.stopPropagation();
        setOpenStatusMenu(openStatusMenu === numero ? null : numero);
    };

    // Calculate Statistics
    const stats = {
        total: contacts.length,
        byStatus: contacts.reduce((acc, contact) => {
            const status = contact.status || 'Lead novo';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>)
    };

    const filteredContacts = contacts.filter(contact => {
        const matchesSearch = contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            contact.numeroContato?.includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || contact.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleUpdate = async () => {
        setLoading(true);
        try {
            const webhookUrl = 'https://evolution-n8n.o9g2gq.easypanel.host/webhook/8795dcee-4727-4021-8fdb-bc316e5653a8';
            console.log('Triggering update webhook...');
            await fetch(webhookUrl, { method: 'POST' });
            console.log('Webhook triggered successfully. Fetching updated data from Supabase...');
            await fetchContacts();
        } catch (error) {
            console.error('Error triggering update webhook:', error);
            await fetchContacts();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="whatsapp-contacts-container">
            <header className="contacts-header">
                <div>
                    <h1 className="page-title">Contatos</h1>
                    <p className="page-subtitle">Gerencie sua lista de contatos do WhatsApp.</p>
                </div>
                <div className="header-actions">
                    <div className="search-bar">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Buscar contato..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="action-btn secondary" onClick={handleUpdate} disabled={loading}>
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        Atualizar
                    </button>
                </div>
            </header>

            {/* Statistics Section */}
            <div className="stats-grid">
                <div className="stat-card total">
                    <div className="stat-icon">
                        <User size={20} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Total</span>
                        <span className="stat-value">{stats.total}</span>
                    </div>
                </div>
                {STATUS_OPTIONS.map(option => (
                    <div key={option.value} className="stat-card" style={{ borderColor: option.color.includes('blue') ? 'rgba(59, 130, 246, 0.3)' : option.color.includes('yellow') ? 'rgba(234, 179, 8, 0.3)' : option.color.includes('purple') ? 'rgba(168, 85, 247, 0.3)' : option.color.includes('orange') ? 'rgba(249, 115, 22, 0.3)' : 'rgba(34, 197, 94, 0.3)' }}>
                        <div className={`stat-dot ${option.color.split(' ')[0].replace('/20', '')}`}></div>
                        <div className="stat-info">
                            <span className="stat-label">{option.label}</span>
                            <span className="stat-value">{stats.byStatus[option.value] || 0}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter Tabs */}
            <div className="filter-tabs">
                <button
                    className={`filter-tab ${statusFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('all')}
                >
                    Todos
                </button>
                {STATUS_OPTIONS.map(option => (
                    <button
                        key={option.value}
                        className={`filter-tab ${statusFilter === option.value ? 'active' : ''}`}
                        onClick={() => setStatusFilter(option.value)}
                    >
                        {option.label}
                        <span className="filter-count">{stats.byStatus[option.value] || 0}</span>
                    </button>
                ))}
            </div>

            {loading && contacts.length === 0 ? (
                <div className="loading-state">
                    <Loader2 size={40} className="animate-spin" />
                    <p>Carregando contatos...</p>
                </div>
            ) : (
                <>
                    <div className="contacts-grid">
                        {filteredContacts.map((contact, index) => (
                            <div
                                key={index}
                                className={`contact-card ${selectedContacts.includes(contact.numeroContato) ? 'selected' : ''}`}
                            >
                                <div className="card-header">
                                    <div
                                        className="contact-avatar"
                                        onClick={(e) => toggleSelection(e, contact.numeroContato)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {contact.picture ? (
                                            <img src={contact.picture} alt={contact.name} />
                                        ) : (
                                            <div className="avatar-placeholder">
                                                <User size={24} />
                                            </div>
                                        )}
                                        {selectedContacts.includes(contact.numeroContato) && (
                                            <div className="selection-indicator">
                                                <CheckCircle size={16} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="contact-main-info">
                                        <h3 className="contact-name">{contact.name || 'Desconhecido'}</h3>
                                        <span className="contact-phone">
                                            <Phone size={12} />
                                            <span className="phone-text">{contact.numeroContato}</span>
                                        </span>
                                    </div>

                                    <div className="status-container" style={{ position: 'relative' }}>
                                        <div
                                            className={`status-badge ${STATUS_OPTIONS.find(o => o.value === contact.status)?.color || 'bg-gray-500/20 text-gray-400'}`}
                                            onClick={(e) => handleStatusClick(e, contact.numeroContato)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {contact.status || 'Lead novo'}
                                        </div>

                                        {openStatusMenu === contact.numeroContato && (
                                            <div className="status-menu">
                                                {STATUS_OPTIONS.map(option => (
                                                    <div
                                                        key={option.value}
                                                        className="status-option"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            updateContactStatus(contact.numeroContato, option.value);
                                                        }}
                                                    >
                                                        <span className={`status-dot ${option.color.split(' ')[0].replace('/20', '')}`}></span>
                                                        {option.label}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="card-body">
                                    <div className="tags-container">
                                        {contact.tags?.map(tag => (
                                            <span key={tag} className="tag-chip">{tag}</span>
                                        ))}
                                    </div>
                                    <div className="last-interaction">
                                        <span className="label">Última interação:</span>
                                        <span className="value">{contact.lastInteraction}</span>
                                    </div>
                                </div>

                                <div className="card-footer">
                                    <button
                                        className="send-message-btn"
                                        onClick={() => handleContactClick(contact.numeroContato)}
                                    >
                                        <span className="icon">💬</span> Enviar Mensagem
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    {lastUpdated && (
                        <div className="last-updated">
                            Última atualização: {lastUpdated.toLocaleTimeString()}
                        </div>
                    )}
                </>
            )}

            <WhatsAppMessageModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                initialPhoneNumber={selectedPhone}
            />
        </div>
    );
};

export default WhatsAppContacts;
