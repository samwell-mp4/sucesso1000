import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { MessageCircle, X, Send, Bot } from 'lucide-react';
import '../styles/N8nChatWidget.css';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
}

const N8nChatWidget = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            text: '👋 Olá! Sou o assistente do WhatsApp Hub Robot. Posso ajudar com automações, métricas ou configurações.',
            sender: 'bot',
            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState('');
    const [robotData, setRobotData] = useState<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initialize Session ID
    useEffect(() => {
        const storedSession = localStorage.getItem('n8n_chat_session');
        if (storedSession) {
            setSessionId(storedSession);
        } else {
            const newSession = uuidv4();
            localStorage.setItem('n8n_chat_session', newSession);
            setSessionId(newSession);
        }
    }, []);

    // Fetch Robot Data
    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            try {
                const { data: config } = await supabase
                    .from('whatsapp_robot_configs')
                    .select('*')
                    .eq('client_id', user.id)
                    .maybeSingle();

                const { data: businessInfo } = await supabase
                    .from('whatsapp_robot_business_info')
                    .select('*')
                    .eq('client_id', user.id)
                    .maybeSingle();

                const { data: trainings } = await supabase
                    .from('whatsapp_robot_trainings')
                    .select('category, content')
                    .eq('client_id', user.id);

                const sanitize = (obj: any) => {
                    const clean = { ...obj };
                    Object.keys(clean || {}).forEach(k => {
                        if (typeof clean[k] === 'string' && clean[k].length > 524) {
                            clean[k] = clean[k].substring(0, 524);
                        }
                    });
                    return clean;
                };

                setRobotData({
                    config: sanitize(config || {}),
                    business: sanitize(businessInfo || {}),
                    trainings: trainings?.reduce((acc: any, cur) => {
                        acc[cur.category] = cur.content?.substring(0, 524) || '';
                        return acc;
                    }, {})
                });
            } catch (error) {
                console.error('Error fetching robot data:', error);
            }
        };

        fetchData();
    }, [user]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading || !robotData) return;

        const userMessage = inputValue.trim();
        setInputValue('');
        setIsLoading(true);

        // Add User Message
        const newMessage: Message = {
            id: uuidv4(),
            text: userMessage,
            sender: 'user',
            timestamp: new Date()
        };
        setMessages(prev => [...prev, newMessage]);

        try {
            const payload = {
                message: userMessage,
                sessionId: sessionId,
                metadata: {
                    app: 'WhatsApp Hub Robot',
                    cliente_id: user?.id,
                    plano: 'pro',
                    origem: 'dashboard_antigravity',
                    idioma: 'pt-BR',
                    robot_config: robotData.config,
                    robot_business: robotData.business,
                    robot_trainings: robotData.trainings
                }
            };

            const response = await fetch('https://evolution-n8n.o9g2gq.easypanel.host/webhook/3e3e836c-0a45-4d0b-b8b7-47770959d90c', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();

            if (data && data.reply) {
                setMessages(prev => [...prev, {
                    id: uuidv4(),
                    text: data.reply,
                    sender: 'bot',
                    timestamp: new Date()
                }]);
            } else {
                throw new Error('Invalid response format');
            }

        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => [...prev, {
                id: uuidv4(),
                text: 'Não foi possível obter resposta agora.',
                sender: 'bot',
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (!user) return null;

    return (
        <div className="n8n-chat-widget">
            {isOpen && (
                <div className="n8n-chat-window">
                    <div className="n8n-chat-header">
                        <div className="n8n-chat-title">
                            <div className="n8n-chat-avatar">
                                <Bot size={18} />
                            </div>
                            <div className="n8n-chat-info">
                                <h3>WhatsApp Hub Robot</h3>
                                <p>Assistente Virtual</p>
                            </div>
                        </div>
                        <button className="n8n-chat-close" onClick={() => setIsOpen(false)}>
                            <X size={20} />
                        </button>
                    </div>

                    <div className="n8n-chat-messages">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`n8n-message ${msg.sender}`}>
                                {msg.text}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="n8n-message bot typing-indicator">
                                <div className="typing-dot"></div>
                                <div className="typing-dot"></div>
                                <div className="typing-dot"></div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="n8n-chat-input-area">
                        <input
                            type="text"
                            className="n8n-chat-input"
                            placeholder="Digite sua mensagem..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyPress}
                            disabled={isLoading}
                        />
                        <button
                            className="n8n-chat-send"
                            onClick={handleSendMessage}
                            disabled={!inputValue.trim() || isLoading}
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            )}

            <button className="n8n-chat-toggle" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
            </button>
        </div>
    );
};

export default N8nChatWidget;
