import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    MessageCircle,
    Users,
    Megaphone,
    Camera,
    Send,
    X,
    Paperclip,
    Image as ImageIcon,
    FileText,
    Video,
    Mic
} from 'lucide-react';
import '../styles/WhatsAppMarketing.css';

type ActionType = 'individual' | 'group' | 'mass' | 'profile_pic' | null;

const WhatsAppMarketing = () => {
    const { user } = useAuth();
    const [activeAction, setActiveAction] = useState<ActionType>(null);
    const [loading, setLoading] = useState(false);

    // Form States
    const [webhookUrl, setWebhookUrl] = useState('');
    const [number, setNumber] = useState('');
    const [groupId, setGroupId] = useState('');
    const [numbersList, setNumbersList] = useState('');
    const [message, setMessage] = useState('');
    const [mediaType, setMediaType] = useState('text'); // text, image, video, audio, document
    const [base64, setBase64] = useState('');
    const [fileName, setFileName] = useState('');

    if (!user) {
        return <div className="flex items-center justify-center h-full text-white">Carregando usuário...</div>;
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFileName(file.name);
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setBase64(base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!webhookUrl) {
            alert('Por favor, insira a URL do Webhook.');
            return;
        }

        setLoading(true);

        const payload: any = {
            action: activeAction,
            type: mediaType,
            message: message,
            base64: base64,
            fileName: fileName,
        };

        if (activeAction === 'individual') payload.number = number;
        if (activeAction === 'group') payload.groupId = groupId;
        if (activeAction === 'mass') payload.numbers = numbersList.split(',').map(n => n.trim());
        if (activeAction === 'profile_pic') payload.type = 'image';

        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                alert('Solicitação enviada com sucesso!');
                closeModal();
            } else {
                alert('Erro ao enviar solicitação.');
            }
        } catch (error) {
            console.error('Erro no webhook:', error);
            alert('Erro ao conectar com o webhook.');
        } finally {
            setLoading(false);
        }
    };

    const closeModal = () => {
        setActiveAction(null);
        setNumber('');
        setGroupId('');
        setNumbersList('');
        setMessage('');
        setMediaType('text');
        setBase64('');
        setFileName('');
    };

    const renderModalContent = () => {
        switch (activeAction) {
            case 'individual':
                return (
                    <>
                        <h3 className="modal-title">Enviar Mensagem Individual</h3>
                        <div className="form-group">
                            <label>Número (com DDI e DDD)</label>
                            <input
                                type="text"
                                placeholder="5511999999999"
                                value={number}
                                onChange={e => setNumber(e.target.value)}
                                required
                            />
                        </div>
                    </>
                );
            case 'group':
                return (
                    <>
                        <h3 className="modal-title">Enviar em Grupo</h3>
                        <div className="form-group">
                            <label>ID do Grupo</label>
                            <input
                                type="text"
                                placeholder="123456789@g.us"
                                value={groupId}
                                onChange={e => setGroupId(e.target.value)}
                                required
                            />
                        </div>
                    </>
                );
            case 'mass':
                return (
                    <>
                        <h3 className="modal-title">Disparo em Massa</h3>
                        <div className="form-group">
                            <label>Lista de Números (separados por vírgula)</label>
                            <textarea
                                placeholder="5511999999999, 5511888888888..."
                                value={numbersList}
                                onChange={e => setNumbersList(e.target.value)}
                                required
                                className="h-24"
                            />
                        </div>
                    </>
                );
            case 'profile_pic':
                return (
                    <>
                        <h3 className="modal-title">Trocar Foto de Perfil</h3>
                        <div className="form-group">
                            <label>Nova Foto</label>
                            <div className="file-upload-container">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    id="profile-upload"
                                    className="hidden"
                                />
                                <label htmlFor="profile-upload" className="file-upload-btn">
                                    <Camera size={20} />
                                    {fileName || 'Escolher Imagem'}
                                </label>
                            </div>
                        </div>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className="whatsapp-marketing-container p-8 h-full overflow-y-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">WhatsApp Marketing</h1>
                <p className="text-gray-400">Ferramentas avançadas para suas campanhas no WhatsApp.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="feature-card" onClick={() => setActiveAction('individual')}>
                    <div className="icon-wrapper bg-blue-500/20 text-blue-400">
                        <MessageCircle size={32} />
                    </div>
                    <h3>Enviar Individual</h3>
                    <p>Envie mensagens diretas para um contato específico.</p>
                </div>

                <div className="feature-card" onClick={() => setActiveAction('group')}>
                    <div className="icon-wrapper bg-purple-500/20 text-purple-400">
                        <Users size={32} />
                    </div>
                    <h3>Enviar em Grupo</h3>
                    <p>Envie mensagens para grupos onde você é admin.</p>
                </div>

                <div className="feature-card" onClick={() => setActiveAction('mass')}>
                    <div className="icon-wrapper bg-green-500/20 text-green-400">
                        <Megaphone size={32} />
                    </div>
                    <h3>Disparo em Massa</h3>
                    <p>Envie a mesma mensagem para múltiplos contatos.</p>
                </div>

                <div className="feature-card" onClick={() => setActiveAction('profile_pic')}>
                    <div className="icon-wrapper bg-pink-500/20 text-pink-400">
                        <Camera size={32} />
                    </div>
                    <h3>Foto de Perfil</h3>
                    <p>Atualize a foto de perfil do seu número conectado.</p>
                </div>
            </div>

            {activeAction && (
                <div className="modal-overlay">
                    <div className="modal-content animate-scale-in">
                        <button className="modal-close" onClick={closeModal}>
                            <X size={24} />
                        </button>

                        <form onSubmit={handleSubmit}>
                            {renderModalContent()}

                            {activeAction !== 'profile_pic' && (
                                <>
                                    <div className="form-group mt-4">
                                        <label>Tipo de Mensagem</label>
                                        <div className="type-selector">
                                            <button type="button" className={mediaType === 'text' ? 'active' : ''} onClick={() => setMediaType('text')}><FileText size={16} /> Texto</button>
                                            <button type="button" className={mediaType === 'image' ? 'active' : ''} onClick={() => setMediaType('image')}><ImageIcon size={16} /> Imagem</button>
                                            <button type="button" className={mediaType === 'video' ? 'active' : ''} onClick={() => setMediaType('video')}><Video size={16} /> Vídeo</button>
                                            <button type="button" className={mediaType === 'audio' ? 'active' : ''} onClick={() => setMediaType('audio')}><Mic size={16} /> Áudio</button>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Mensagem / Legenda</label>
                                        <textarea
                                            value={message}
                                            onChange={e => setMessage(e.target.value)}
                                            placeholder="Digite sua mensagem..."
                                            className="h-32"
                                        />
                                    </div>

                                    {mediaType !== 'text' && (
                                        <div className="form-group">
                                            <label>Anexo (Arquivo)</label>
                                            <div className="file-upload-container">
                                                <input
                                                    type="file"
                                                    onChange={handleFileChange}
                                                    id="media-upload"
                                                    className="hidden"
                                                />
                                                <label htmlFor="media-upload" className="file-upload-btn">
                                                    <Paperclip size={20} />
                                                    {fileName || 'Escolher Arquivo'}
                                                </label>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            <div className="form-group mt-6 border-t border-gray-700 pt-4">
                                <label className="text-xs text-gray-400 uppercase tracking-wider">Configuração do Webhook</label>
                                <input
                                    type="url"
                                    placeholder="https://n8n.seu-dominio.com/webhook/..."
                                    value={webhookUrl}
                                    onChange={e => setWebhookUrl(e.target.value)}
                                    required
                                    className="bg-black/30 border-gray-700 text-xs"
                                />
                            </div>

                            <button type="submit" className="submit-btn" disabled={loading}>
                                {loading ? 'Enviando...' : (
                                    <>
                                        <Send size={18} />
                                        Enviar Solicitação
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WhatsAppMarketing;
