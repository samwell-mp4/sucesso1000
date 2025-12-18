import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MessageSquare, Calendar, User, Phone, Mail, Tag } from 'lucide-react';
import { logClientAction } from '../utils/logger';
import '../styles/ClientDetails.css';

interface CRMNote {
    id: string;
    content: string;
    type: 'Observação' | 'Contato' | 'Recusa' | 'Cancelamento';
    next_action?: string;
    follow_up_date?: string;
    created_by?: string;
    created_at: string;
}

// Mock interface for Leads (since we don't have a table yet)
interface Lead {
    id: string;
    name: string;
    source: 'WhatsApp' | 'Instagram' | 'Site' | 'Indicação';
    status: 'Novo' | 'Em contato' | 'Reunião marcada' | 'Fechado' | 'Perdido';
    phone?: string;
    email?: string;
    created_at: string;
}

const ClientCRM = ({ clientId }: { clientId: string }) => {
    const [notes, setNotes] = useState<CRMNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'leads' | 'history'>('leads');

    // Mock Leads Data
    const [leads] = useState<Lead[]>([
        { id: '1', name: 'João Silva', source: 'WhatsApp', status: 'Novo', phone: '(11) 99999-9999', created_at: new Date().toISOString() },
        { id: '2', name: 'Maria Souza', source: 'Instagram', status: 'Em contato', email: 'maria@email.com', created_at: new Date(Date.now() - 86400000).toISOString() },
        { id: '3', name: 'Tech Solutions', source: 'Site', status: 'Reunião marcada', phone: '(11) 3333-3333', created_at: new Date(Date.now() - 172800000).toISOString() },
        { id: '4', name: 'Pedro Santos', source: 'Indicação', status: 'Perdido', created_at: new Date(Date.now() - 259200000).toISOString() },
    ]);

    const [newNote, setNewNote] = useState({
        content: '',
        type: 'Observação',
        next_action: '',
        follow_up_date: ''
    });

    useEffect(() => {
        fetchNotes();
    }, [clientId]);

    const fetchNotes = async () => {
        try {
            const { data, error } = await supabase
                .from('crm_notes')
                .select('*')
                .eq('client_id', clientId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setNotes(data || []);
        } catch (error) {
            console.error('Error fetching CRM notes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitNote = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('crm_notes')
                .insert([{
                    ...newNote,
                    client_id: clientId,
                    created_by: 'Admin' // Should come from auth context
                }]);

            if (error) throw error;

            await logClientAction(clientId, 'CRM', `Nova nota de CRM: ${newNote.type}`);

            setNewNote({
                content: '',
                type: 'Observação',
                next_action: '',
                follow_up_date: ''
            });
            fetchNotes();
        } catch (error) {
            console.error('Error adding note:', error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Novo': return 'bg-blue-500/20 text-blue-500';
            case 'Em contato': return 'bg-yellow-500/20 text-yellow-500';
            case 'Reunião marcada': return 'bg-purple-500/20 text-purple-500';
            case 'Fechado': return 'bg-green-500/20 text-green-500';
            case 'Perdido': return 'bg-red-500/20 text-red-500';
            default: return 'bg-gray-500/20 text-gray-500';
        }
    };

    return (
        <div className="tab-content">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[var(--text-main)]">Leads & Contatos</h2>
                <div className="flex gap-2">
                    <button
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'leads' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'}`}
                        onClick={() => setActiveTab('leads')}
                    >
                        Lista de Leads
                    </button>
                    <button
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'history' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'}`}
                        onClick={() => setActiveTab('history')}
                    >
                        Histórico de Interações
                    </button>
                </div>
            </div>

            {activeTab === 'leads' ? (
                <div className="space-y-4">
                    {/* Leads Stats / Filter Bar could go here */}
                    <div className="flex gap-4 mb-4 overflow-x-auto pb-2">
                        {['Todos', 'Novo', 'Em contato', 'Reunião marcada', 'Fechado'].map(status => (
                            <button key={status} className="px-3 py-1 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-xs text-[var(--text-secondary)] hover:border-[var(--primary)] whitespace-nowrap">
                                {status}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {leads.map(lead => (
                            <div key={lead.id} className="bg-[var(--bg-card)] p-4 rounded-xl border border-[var(--border-color)] hover:border-[var(--primary)] transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-full bg-[var(--bg-background)] text-[var(--text-secondary)]">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-[var(--text-main)]">{lead.name}</h3>
                                        <div className="flex flex-wrap gap-3 mt-1 text-sm text-[var(--text-secondary)]">
                                            <span className="flex items-center gap-1"><Tag size={12} /> {lead.source}</span>
                                            {lead.phone && <span className="flex items-center gap-1"><Phone size={12} /> {lead.phone}</span>}
                                            {lead.email && <span className="flex items-center gap-1"><Mail size={12} /> {lead.email}</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                                        {lead.status}
                                    </span>
                                    <button className="text-[var(--text-secondary)] hover:text-[var(--primary)]">
                                        <MessageSquare size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="crm-container">
                    <div className="crm-input-section mb-8">
                        <h3 className="text-lg font-semibold mb-4">Nova Interação</h3>
                        <form onSubmit={handleSubmitNote}>
                            <div className="form-group mb-4">
                                <textarea
                                    className="form-input w-full p-3 rounded-lg bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)]"
                                    placeholder="Digite sua observação..."
                                    value={newNote.content}
                                    onChange={e => setNewNote({ ...newNote, content: e.target.value })}
                                    required
                                    rows={3}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div className="form-group">
                                    <label className="block text-sm text-[var(--text-secondary)] mb-1">Tipo</label>
                                    <select
                                        className="form-input w-full p-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)]"
                                        value={newNote.type}
                                        onChange={e => setNewNote({ ...newNote, type: e.target.value as any })}
                                    >
                                        <option value="Observação">Observação</option>
                                        <option value="Contato">Contato</option>
                                        <option value="Recusa">Recusa</option>
                                        <option value="Cancelamento">Cancelamento</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="block text-sm text-[var(--text-secondary)] mb-1">Próxima Ação</label>
                                    <input
                                        type="text"
                                        className="form-input w-full p-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)]"
                                        value={newNote.next_action}
                                        onChange={e => setNewNote({ ...newNote, next_action: e.target.value })}
                                        placeholder="Ex: Ligar novamente"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="block text-sm text-[var(--text-secondary)] mb-1">Follow-up</label>
                                    <input
                                        type="date"
                                        className="form-input w-full p-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)]"
                                        value={newNote.follow_up_date}
                                        onChange={e => setNewNote({ ...newNote, follow_up_date: e.target.value })}
                                    />
                                </div>
                            </div>
                            <button type="submit" className="submit-button bg-[var(--primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--primary-dark)] transition-colors">
                                Adicionar Nota
                            </button>
                        </form>
                    </div>

                    <div className="crm-timeline">
                        <h3 className="text-lg font-semibold mb-4">Histórico</h3>
                        {loading ? (
                            <p>Carregando...</p>
                        ) : notes.length === 0 ? (
                            <p className="text-gray-500">Nenhuma anotação encontrada.</p>
                        ) : (
                            <div className="space-y-4">
                                {notes.map(note => (
                                    <div key={note.id} className="timeline-item flex gap-4 p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]">
                                        <div className="timeline-icon mt-1">
                                            <div className="p-2 bg-[var(--bg-background)] rounded-full text-[var(--primary)]">
                                                <MessageSquare size={16} />
                                            </div>
                                        </div>
                                        <div className="timeline-content flex-1">
                                            <div className="timeline-header flex justify-between items-start mb-2">
                                                <span className="font-medium text-[var(--primary)]">{note.type}</span>
                                                <span className="text-xs text-[var(--text-secondary)]">
                                                    {new Date(note.created_at).toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="text-[var(--text-main)] mb-3">{note.content}</p>
                                            {(note.next_action || note.follow_up_date) && (
                                                <div className="note-footer flex gap-4 text-sm text-[var(--text-secondary)] bg-[var(--bg-background)] p-2 rounded-lg">
                                                    {note.next_action && (
                                                        <span className="note-action">
                                                            <strong>Próximo:</strong> {note.next_action}
                                                        </span>
                                                    )}
                                                    {note.follow_up_date && (
                                                        <span className="note-followup flex items-center gap-1">
                                                            <Calendar size={12} />
                                                            {new Date(note.follow_up_date).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            <div className="note-author mt-2 text-xs text-[var(--text-secondary)] flex items-center gap-1">
                                                <User size={12} />
                                                {note.created_by || 'Sistema'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientCRM;
