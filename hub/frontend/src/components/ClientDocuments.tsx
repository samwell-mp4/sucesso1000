import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FileText, Upload, Download, Trash2, File, X, FilePlus } from 'lucide-react';
import { generatePDF } from '../utils/generatePDF';
import { logClientAction } from '../utils/logger';
import '../styles/ClientDetails.css';

interface Document {
    id: string;
    name: string;
    type: string;
    url: string;
    uploaded_by: string;
    created_at: string;
}

interface ClientDocumentsProps {
    clientId: string;
    clientData: any; // Passed from parent
}

const ClientDocuments = ({ clientId, clientData }: ClientDocumentsProps) => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newDoc, setNewDoc] = useState({
        name: '',
        type: 'Contrato',
        url: '',
        uploaded_by: 'Admin'
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
        try {
            const { error } = await supabase
                .from('documents')
                .insert([{
                    ...newDoc,
                    client_id: clientId,
                    url: 'https://example.com/file.pdf' // Mock URL
                }]);

            if (error) throw error;

            await logClientAction(clientId, 'Upload de Documento', `Documento ${newDoc.name} (${newDoc.type}) enviado.`);

            setIsModalOpen(false);
            setNewDoc({ name: '', type: 'Contrato', url: '', uploaded_by: 'Admin' });
            fetchDocuments();
        } catch (error) {
            console.error('Error uploading document:', error);
            alert('Erro ao enviar documento');
        }
    };

    const handleGeneratePDF = async (type: 'contract' | 'proposal' | 'receipt') => {
        try {
            // Fetch services for the PDF
            const { data: services } = await supabase
                .from('client_services')
                .select('*')
                .eq('client_id', clientId);

            generatePDF(type, clientData, services || []);

            // Optional: Save the generated PDF record to the database
            await supabase.from('documents').insert([{
                client_id: clientId,
                name: `${type === 'contract' ? 'Contrato' : type === 'proposal' ? 'Proposta' : 'Recibo'} - ${clientData.name}`,
                type: type === 'contract' ? 'Contrato' : type === 'proposal' ? 'Proposta' : 'Outro',
                url: 'generated_locally',
                uploaded_by: 'Sistema'
            }]);

            await logClientAction(clientId, 'Geração de PDF', `PDF de ${type} gerado automaticamente.`);

            fetchDocuments();
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Erro ao gerar PDF');
        }
    };

    return (
        <div className="tab-content">
            <div className="tab-header-actions">
                <h2>Documentos</h2>
                <div className="flex gap-2">
                    <div className="dropdown-container" style={{ position: 'relative', display: 'inline-block' }}>
                        <button className="secondary-button">
                            <FilePlus size={16} className="mr-2" />
                            Gerar PDF
                        </button>
                        <div className="dropdown-content">
                            <button onClick={() => handleGeneratePDF('proposal')}>Proposta</button>
                            <button onClick={() => handleGeneratePDF('contract')}>Contrato</button>
                            <button onClick={() => handleGeneratePDF('receipt')}>Recibo</button>
                        </div>
                    </div>
                    <button className="submit-button" onClick={() => setIsModalOpen(true)}>
                        <Upload size={16} style={{ marginRight: '0.5rem' }} />
                        Upload
                    </button>
                </div>
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

            <style>{`
                .dropdown-content {
                    display: none;
                    position: absolute;
                    background-color: white;
                    min-width: 160px;
                    box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
                    z-index: 1;
                    border-radius: 8px;
                    overflow: hidden;
                    top: 100%;
                    right: 0;
                }
                .dropdown-container:hover .dropdown-content {
                    display: block;
                }
                .dropdown-content button {
                    color: black;
                    padding: 12px 16px;
                    text-decoration: none;
                    display: block;
                    width: 100%;
                    text-align: left;
                    border: none;
                    background: none;
                    cursor: pointer;
                }
                .dropdown-content button:hover {
                    background-color: #f1f1f1;
                }
                .secondary-button {
                    background-color: #fff;
                    border: 1px solid #e5e7eb;
                    color: #374151;
                    padding: 0.5rem 1rem;
                    border-radius: 0.5rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    font-weight: 500;
                }
                .secondary-button:hover {
                    background-color: #f9fafb;
                }
            `}</style>
        </div>
    );
};

export default ClientDocuments;
