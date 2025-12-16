import { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import '../styles/Conversations.css';

interface Conversation {
    id: number;
    lead_name: string;
    lead_number: string;
    robot_name: string;
    seller_name: string;
    last_message: string;
    last_message_time: string;
    status: 'waiting' | 'active';
}

const Conversations = () => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchConversations();
    }, []);

    const fetchConversations = async () => {
        try {
            const { data, error } = await supabase
                .from('conversations')
                .select('*')
                .order('last_message_time', { ascending: false });

            if (error) throw error;
            setConversations(data || []);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Conversas</h1>
            </div>

            {loading ? (
                <p>Carregando...</p>
            ) : (
                <div className="conversations-list">
                    {conversations.map((conv) => (
                        <div key={conv.id} className="conversation-item">
                            <div className="conversation-avatar">
                                <User size={20} />
                            </div>
                            <div className="conversation-details">
                                <div className="conversation-header">
                                    <span className="lead-name">{conv.lead_name} ({conv.lead_number})</span>
                                    <span className="conversation-time">{new Date(conv.last_message_time).toLocaleString()}</span>
                                </div>
                                <p className="conversation-message">{conv.last_message}</p>
                                <div className="conversation-meta">
                                    <span>Robô: {conv.robot_name}</span>
                                    <span>Vendedor: {conv.seller_name}</span>
                                </div>
                            </div>
                            <div className="conversation-status-wrapper">
                                <span className={`conversation-status ${conv.status === 'waiting' ? 'status-waiting' : 'status-active'}`}>
                                    {conv.status === 'waiting' ? 'Aguardando' : 'Em andamento'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Conversations;
