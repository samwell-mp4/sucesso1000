import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MessageSquare, Calendar, User } from 'lucide-react';
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

const ClientCRM = ({ clientId }: { clientId: string }) => {
    const [notes, setNotes] = useState<CRMNote[]>([]);
    const [loading, setLoading] = useState(true);
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

    const handleSubmit = async (e: React.FormEvent) => {
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

    return (
        <div className="tab-content">
            <div className="crm-container">
                <div className="crm-input-section">
                    <h3>Nova Anotação</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <textarea
                                className="form-input"
                                placeholder="Digite sua observação..."
                                value={newNote.content}
                                onChange={e => setNewNote({ ...newNote, content: e.target.value })}
                                required
                                rows={3}
                            />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Tipo</label>
                                <select
                                    className="form-input"
                                    value={newNote.type}
                                    onChange={e => setNewNote({ ...newNote, type: e.target.value })}
                                >
                                    <option value="Observação">Observação</option>
                                    <option value="Contato">Contato</option>
                                    <option value="Recusa">Recusa</option>
                                    <option value="Cancelamento">Cancelamento</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Próxima Ação</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={newNote.next_action}
                                    onChange={e => setNewNote({ ...newNote, next_action: e.target.value })}
                                    placeholder="Ex: Ligar novamente"
                                />
                            </div>
                            <div className="form-group">
                                <label>Follow-up</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={newNote.follow_up_date}
                                    onChange={e => setNewNote({ ...newNote, follow_up_date: e.target.value })}
                                />
                            </div>
                        </div>
                        <button type="submit" className="submit-button">Adicionar Nota</button>
                    </form>
                </div>

                <div className="crm-timeline">
                    <h3>Histórico de Relacionamento</h3>
                    {loading ? (
                        <p>Carregando...</p>
                    ) : notes.length === 0 ? (
                        <p className="text-gray-500">Nenhuma anotação encontrada.</p>
                    ) : (
                        <div className="timeline-list">
                            {notes.map(note => (
                                <div key={note.id} className="timeline-item">
                                    <div className="timeline-icon">
                                        <MessageSquare size={16} />
                                    </div>
                                    <div className="timeline-content">
                                        <div className="timeline-header">
                                            <span className="note-type">{note.type}</span>
                                            <span className="note-date">
                                                {new Date(note.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="note-text">{note.content}</p>
                                        {(note.next_action || note.follow_up_date) && (
                                            <div className="note-footer">
                                                {note.next_action && (
                                                    <span className="note-action">
                                                        <strong>Próximo:</strong> {note.next_action}
                                                    </span>
                                                )}
                                                {note.follow_up_date && (
                                                    <span className="note-followup">
                                                        <Calendar size={12} className="inline mr-1" />
                                                        {new Date(note.follow_up_date).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        <div className="note-author">
                                            <User size={12} className="inline mr-1" />
                                            {note.created_by || 'Sistema'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClientCRM;
