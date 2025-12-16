import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FileText, Upload, Download, Trash2, File } from 'lucide-react';
import '../styles/ClientDetails.css';

interface Document {
    id: number;
    name: string;
    type: string;
    url: string;
    uploaded_by: string;
    created_at: string;
}

const ClientDocuments = ({ clientId }: { clientId: string }) => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newDoc, setNewDoc] = useState({
        name: '',
        type: 'Contrato',
        url: '', // In a real app, this would be handled by file upload
        uploaded_by: 'Admin' // Should come from auth context
    });

    useEffect(() => {
        fetchDocuments();
    }, [clientId]);

    const fetchDocuments = async () => {
        try {
            const { data, error } = await supabase
                .from('documents')
                .select('*')
                .eq('client_id', clientId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDocuments(data || []);
        } catch (error) {
            console.error('Error fetching documents:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        // Simulate upload
        try {
            const { error } = await supabase
                .from('documents')
                .insert([{
                    ...newDoc,
                    client_id: clientId,
                    url: 'https://example.com/file.pdf' // Mock URL
                }]);

            if (error) throw error;

            setIsModalOpen(false);
            setNewDoc({ name: '', type: 'Contrato', url: '', uploaded_by: 'Admin' });
            fetchDocuments();
        } catch (error) {
            console.error('Error uploading document:', error);
            alert('Erro ao enviar documento');
        }
    };

    return (
        <div className="tab-content">
            <div className="tab-header-actions">
                <h2>Documentos</h2>
                <button className="submit-button" onClick={() => setIsModalOpen(true)}>
                    <Upload size={16} style={{ marginRight: '0.5rem' }} />
                    Upload Arquivo
                </button>
            </div>

            {loading ? (
                <p>Carregando documentos...</p>
            ) : documents.length === 0 ? (
                <div className="empty-state">
                    <FileText size={48} color="#d1d5db" />
                    <p>Nenhum documento encontrado.</p>
                </div>
            ) : (
                <div className="documents-list">
                    {documents.map(doc => (
                        <div key={doc.id} className="document-item">
                            <div className="doc-icon">
                                <File size={24} className="text-blue-500" />
                            </div>
                            <div className="doc-info">
                                <div className="doc-name">{doc.name}</div>
                                <div className="doc-meta">
                                    {doc.type} • Enviado por {doc.uploaded_by} • {new Date(doc.created_at).toLocaleDateString()}
                                </div>
                            </div>
                            <div className="doc-actions">
                                <button className="icon-button" title="Download">
                                    <Download size={18} />
                                </button>
                                <button className="icon-button delete" title="Excluir">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Novo Documento</h2>
                            <button onClick={() => setIsModalOpen(false)} className="close-button">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleUpload}>
                            <div className="form-group">
                                <label className="form-label">Nome do Arquivo</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={newDoc.name}
                                    onChange={e => setNewDoc({ ...newDoc, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Tipo</label>
                                <select
                                    className="form-input"
                                    value={newDoc.type}
                                    onChange={e => setNewDoc({ ...newDoc, type: e.target.value })}
                                >
                                    <option value="Contrato">Contrato</option>
                                    <option value="Proposta">Proposta</option>
                                    <option value="Relatório">Relatório</option>
                                    <option value="Nota Fiscal">Nota Fiscal</option>
                                    <option value="Outro">Outro</option>
                                </select>
                            </div>
                            <button type="submit" className="submit-button">Salvar Documento</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const X = ({ size }: { size: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

export default ClientDocuments;
