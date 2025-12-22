import React, { useState, useEffect } from 'react';
import { X, Send, Image as ImageIcon, Video, FileText, Loader2 } from 'lucide-react';
import '../styles/WhatsAppMessageModal.css';

interface WhatsAppMessageModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialPhoneNumber?: string;
}

type MediaType = 'image' | 'video' | 'pdf';

const WhatsAppMessageModal: React.FC<WhatsAppMessageModalProps> = ({ isOpen, onClose, initialPhoneNumber = '' }) => {
    const [loading, setLoading] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
    const [message, setMessage] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [mediaType, setMediaType] = useState<MediaType>('image');
    const [webhookUrl] = useState('http://localhost:3001/api/webhook-proxy');

    useEffect(() => {
        setPhoneNumber(initialPhoneNumber);
    }, [initialPhoneNumber]);

    useEffect(() => {
        // Reset selected file when media type changes
        setSelectedFile(null);
    }, [mediaType]);

    if (!isOpen) return null;

    const formatPhoneNumber = (phone: string): string => {
        let cleanPhone = phone.replace(/\D/g, '');
        if (!cleanPhone.startsWith('55')) {
            cleanPhone = '55' + cleanPhone;
        }
        return `${cleanPhone}@s.whatsapp.net`;
    };

    const convertToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const getAcceptType = (): string => {
        switch (mediaType) {
            case 'image':
                return 'image/*';
            case 'video':
                return 'video/*';
            case 'pdf':
                return 'application/pdf';
            default:
                return '*/*';
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!webhookUrl) {
            alert('Erro interno: URL do Webhook não configurada.');
            return;
        }

        if (!phoneNumber || !message) {
            alert('Preencha o número e a mensagem.');
            return;
        }

        setLoading(true);

        try {
            const formattedPhone = formatPhoneNumber(phoneNumber);
            let base64Media = null;
            let fileName = null;
            let mimeType = null;

            if (selectedFile) {
                try {
                    base64Media = await convertToBase64(selectedFile);
                    fileName = selectedFile.name;
                    mimeType = selectedFile.type;
                } catch (fileError) {
                    console.error('Error reading file:', fileError);
                    alert('Erro ao ler o arquivo.');
                    setLoading(false);
                    return;
                }
            }

            const rawBase64 = base64Media ? base64Media.split(',')[1] : null;

            const payload = {
                number: formattedPhone,
                message: message,
                base64: rawBase64,
                fileName: fileName,
                mimeType: mimeType,
                type: selectedFile ? mediaType : 'text'
            };

            console.log('Sending payload:', payload);

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                alert('Disparo enviado com sucesso!');
                onClose();
                setPhoneNumber('');
                setMessage('');
                setSelectedFile(null);
            } else {
                const errorText = await response.text();
                console.error('Webhook error:', errorText);
                alert(`Erro ao enviar disparo: ${response.status} ${response.statusText}`);
            }

        } catch (error) {
            console.error('Error sending message:', error);
            alert('Erro ao conectar com o webhook. Verifique a URL e sua conexão.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content animate-scale-in">
                <div className="modal-header">
                    <h3>Novo Disparo</h3>
                    <button className="modal-close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSend} className="modal-form">
                    <div className="form-group">
                        <label>Número do WhatsApp</label>
                        <input
                            type="text"
                            placeholder="Ex: 31988868362"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="modal-input"
                        />
                        <span className="text-xs text-gray-500 mt-1">O código 55 será adicionado automaticamente se não informado.</span>
                    </div>

                    <div className="form-group">
                        <label>Tipo de Mídia</label>
                        <div className="media-type-selector">
                            <label className={`media-type-option ${mediaType === 'image' ? 'active' : ''}`}>
                                <input
                                    type="radio"
                                    name="mediaType"
                                    value="image"
                                    checked={mediaType === 'image'}
                                    onChange={(e) => setMediaType(e.target.value as MediaType)}
                                />
                                <ImageIcon size={20} />
                                <span>Imagem</span>
                            </label>
                            <label className={`media-type-option ${mediaType === 'video' ? 'active' : ''}`}>
                                <input
                                    type="radio"
                                    name="mediaType"
                                    value="video"
                                    checked={mediaType === 'video'}
                                    onChange={(e) => setMediaType(e.target.value as MediaType)}
                                />
                                <Video size={20} />
                                <span>Vídeo</span>
                            </label>
                            <label className={`media-type-option ${mediaType === 'pdf' ? 'active' : ''}`}>
                                <input
                                    type="radio"
                                    name="mediaType"
                                    value="pdf"
                                    checked={mediaType === 'pdf'}
                                    onChange={(e) => setMediaType(e.target.value as MediaType)}
                                />
                                <FileText size={20} />
                                <span>PDF</span>
                            </label>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Mensagem</label>
                        <textarea
                            placeholder="Digite sua mensagem..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="modal-textarea"
                            rows={4}
                        />
                    </div>

                    <div className="form-group">
                        <label>Arquivo (Opcional)</label>
                        <div className="file-input-wrapper">
                            <input
                                type="file"
                                accept={getAcceptType()}
                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                id="media-upload"
                                className="hidden"
                            />
                            <label htmlFor="media-upload" className="file-label">
                                {mediaType === 'image' && <ImageIcon size={18} />}
                                {mediaType === 'video' && <Video size={18} />}
                                {mediaType === 'pdf' && <FileText size={18} />}
                                {selectedFile ? selectedFile.name : `Selecionar ${mediaType === 'image' ? 'Imagem' : mediaType === 'video' ? 'Vídeo' : 'PDF'}`}
                            </label>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-submit" disabled={loading}>
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                            Enviar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default WhatsAppMessageModal;
