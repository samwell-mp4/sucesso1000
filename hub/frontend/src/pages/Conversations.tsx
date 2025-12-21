import { useState, useEffect, useRef } from 'react';
import { User, Send, Search, Loader2, ChevronLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import '../styles/Conversations.css';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'contact';
    timestamp: Date;
}

interface ChatData {
    id: number;
    numero: string;
    ai_memory: string;
    human_memory: string;
}

const Conversations = () => {
    const [chats, setChats] = useState<ChatData[]>([]);
    const [selectedNumber, setSelectedNumber] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showChatOnMobile, setShowChatOnMobile] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchChats();
    }, []);

    useEffect(() => {
        if (selectedNumber) {
            updateConsolidatedMessages(selectedNumber);
        }
    }, [selectedNumber, chats]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchChats = async () => {
        setLoading(true);
        try {
            // Fetch everything ordered by ID ascending for easier chronological joining
            const { data, error } = await supabase
                .from('chat_memory_whatsapp')
                .select('*')
                .order('id', { ascending: true });

            if (error) throw error;

            setChats(data || []);

            // Auto-select the first unique number if none selected
            if (data && data.length > 0 && !selectedNumber) {
                // Find the latest number to show it first
                const latestNumber = data[data.length - 1].numero;
                setSelectedNumber(latestNumber);
            }
        } catch (error) {
            console.error('Error fetching chats:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateConsolidatedMessages = (number: string) => {
        const chatsForNumber = chats.filter(c => c.numero === number);
        const allMessages: Message[] = [];

        // Join ALL records for this number in order
        chatsForNumber.forEach((chat) => {
            if (chat.ai_memory) {
                // AI/Robot is now 'user' (Green/Right)
                allMessages.push({
                    id: `ai-${chat.id}`,
                    text: chat.ai_memory,
                    sender: 'user',
                    timestamp: new Date()
                });
            }
            if (chat.human_memory) {
                // Human/Contact is now 'contact' (Gray/Left)
                allMessages.push({
                    id: `human-${chat.id}`,
                    text: chat.human_memory,
                    sender: 'contact',
                    timestamp: new Date()
                });
            }
        });

        setMessages(allMessages);
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedNumber || sending) return;
        setSending(true);

        try {
            // Update the LAST record for this number or create a new one?
            // Usually we update the current turn.
            const chatsForNumber = chats.filter(c => c.numero === selectedNumber);
            const lastChat = chatsForNumber[chatsForNumber.length - 1];

            if (lastChat) {
                // When we send from the Hub, we act as the AI/Robot
                const updatedAiMemory = lastChat.ai_memory
                    ? `${lastChat.ai_memory}\n${newMessage}`
                    : newMessage;

                const { error } = await supabase
                    .from('chat_memory_whatsapp')
                    .update({ ai_memory: updatedAiMemory })
                    .eq('id', lastChat.id);

                if (error) throw error;
            } else {
                // If somehow we have a number but no chat record
                const { error } = await supabase
                    .from('chat_memory_whatsapp')
                    .insert({ numero: selectedNumber, human_memory: newMessage });

                if (error) throw error;
            }

            await fetchChats();
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Erro ao enviar mensagem');
        } finally {
            setSending(false);
        }
    };

    const formatPhoneNumber = (numero: string): string => {
        const cleanNumber = numero.replace('@s.whatsapp.net', '');
        if (cleanNumber.length >= 12) {
            return `+${cleanNumber.slice(0, 2)} (${cleanNumber.slice(2, 4)}) ${cleanNumber.slice(4, 9)}-${cleanNumber.slice(9)}`;
        }
        return cleanNumber;
    };

    // Grouping chats by unique number to avoid duplicates in sidebar
    // Sort numbers by the ID of their most recent message
    const uniqueNumbers = Array.from(new Set(chats.map(c => c.numero)));

    const uniqueChats = uniqueNumbers.map(num => {
        const chatsForNum = chats.filter(c => c.numero === num);
        return chatsForNum[chatsForNum.length - 1]; // Latest record
    }).sort((a, b) => b.id - a.id); // Newest conversations on top

    const filteredChats = uniqueChats.filter(chat =>
        chat.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chat.human_memory?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chat.ai_memory?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading && chats.length === 0) {
        return (
            <div className="loading-container">
                <Loader2 size={40} className="animate-spin" />
                <p>Carregando conversas...</p>
            </div>
        );
    }

    return (
        <div className="conversations-container">
            <div className={`chat-list ${showChatOnMobile ? 'mobile-hide' : 'mobile-show'}`}>
                <div className="chat-list-header">
                    <h2>Conversas</h2>
                    <div className="chat-search">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Buscar conversa..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="chat-list-items">
                    {filteredChats.length === 0 ? (
                        <div className="empty-state">
                            <p>Nenhuma conversa encontrada</p>
                        </div>
                    ) : (
                        filteredChats.map((chat) => (
                            <div
                                key={chat.numero}
                                className={`chat-list-item ${selectedNumber === chat.numero ? 'active' : ''}`}
                                onClick={() => {
                                    setSelectedNumber(chat.numero);
                                    setShowChatOnMobile(true);
                                }}
                            >
                                <div className="chat-avatar">
                                    <User size={24} />
                                </div>
                                <div className="chat-info">
                                    <div className="chat-name">{formatPhoneNumber(chat.numero)}</div>
                                    <div className="chat-last-message">
                                        {chat.human_memory || chat.ai_memory || 'Sem mensagens'}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className={`chat-window ${showChatOnMobile ? 'mobile-show' : 'mobile-hide'}`}>
                {selectedNumber ? (
                    <>
                        <div className="chat-header">
                            <div className="chat-header-info">
                                <button
                                    className="mobile-back-button"
                                    onClick={() => setShowChatOnMobile(false)}
                                >
                                    <ChevronLeft size={24} />
                                </button>
                                <div className="chat-header-avatar">
                                    <User size={32} />
                                </div>
                                <div>
                                    <h3>{formatPhoneNumber(selectedNumber)}</h3>
                                    <p className="chat-header-status">Online</p>
                                </div>
                            </div>
                        </div>

                        <div className="chat-messages">
                            {messages.length === 0 ? (
                                <div className="empty-messages">
                                    <p>Histórico vazio.</p>
                                </div>
                            ) : (
                                messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`message-bubble ${message.sender}`}
                                    >
                                        <div className="message-text">{message.text}</div>
                                        <div className="message-time">
                                            {message.timestamp.toLocaleTimeString('pt-BR', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="chat-input-container">
                            <input
                                type="text"
                                placeholder="Digite uma mensagem..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                className="chat-input"
                                disabled={sending}
                            />
                            <button
                                onClick={handleSendMessage}
                                className="send-button"
                                disabled={sending || !newMessage.trim()}
                            >
                                {sending ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : (
                                    <Send size={20} />
                                )}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="no-chat-selected">
                        <User size={64} />
                        <p>Selecione uma conversa para começar</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Conversations;
