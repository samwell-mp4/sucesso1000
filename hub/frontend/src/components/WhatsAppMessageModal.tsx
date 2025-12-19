import React, { useState, useEffect } from 'react';
import { X, Send, Image as ImageIcon, Loader2 } from 'lucide-react';
import '../styles/WhatsAppMessageModal.css';

interface WhatsAppMessageModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialPhoneNumber?: string;
}

const WhatsAppMessageModal: React.FC<WhatsAppMessageModalProps> = ({ isOpen, onClose, initialPhoneNumber = '' }) => {
    const [loading, setLoading] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
    const [message, setMessage] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [webhookUrl] = useState('https://evolution-n8n.o9g2gq.easypanel.host/webhook/7e550a60-9584-4023-addd-1e1f22fff289');

    useEffect(() => {
        setPhoneNumber(initialPhoneNumber);
    }, [initialPhoneNumber]);

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
            let base64Image = null;
            let fileName = null;
            let mimeType = null;

            if (selectedFile) {
                try {
                    base64Image = await convertToBase64(selectedFile);
                    fileName = selectedFile.name;
                    mimeType = selectedFile.type;
                } catch (fileError) {
                    console.error('Error reading file:', fileError);
                    alert('Erro ao ler o arquivo de imagem.');
                    setLoading(false);
                    return;
                }
            }

            const rawBase64 = base64Image ? base64Image.split(',')[1] : null;

            const payload = {
                number: formattedPhone,
                message: message,
                image: base64Image,
                media: rawBase64,
                base64: rawBase64,
                fileName: fileName,
                mediatype: mimeType,
                mimeType: mimeType,
                type: selectedFile ? 'image' : 'text'
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
                        <label>Imagem (Opcional)</label>
                        <div className="file-input-wrapper">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                id="image-upload"
                                className="hidden"
                            />
                            <label htmlFor="image-upload" className="file-label">
                                <ImageIcon size={18} />
                                {selectedFile ? selectedFile.name : 'Selecionar Imagem'}
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
