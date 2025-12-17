import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Activity } from 'lucide-react';
import '../styles/ClientDetails.css';

interface HistoryRecord {
    id: string;
    action: string;
    details: string;
    performed_by: string;
    created_at: string;
}

const ClientHistory = ({ clientId }: { clientId: string }) => {
    const [history, setHistory] = useState<HistoryRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, [clientId]);

    const fetchHistory = async () => {
        try {
            const { data, error } = await supabase
                .from('client_history')
                .select('*')
                .eq('client_id', clientId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setHistory(data || []);
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="tab-content">
            <h2>Histórico de Atividades</h2>
            {loading ? (
                <p>Carregando histórico...</p>
            ) : history.length === 0 ? (
                <p className="text-gray-500">Nenhum registro encontrado.</p>
            ) : (
                <div className="history-list">
                    {history.map(record => (
                        <div key={record.id} className="history-item">
                            <div className="history-icon">
                                <Activity size={16} />
                            </div>
                            <div className="history-content">
                                <div className="history-header">
                                    <span className="history-action">{record.action}</span>
                                    <span className="history-date">
                                        {new Date(record.created_at).toLocaleString()}
                                    </span>
                                </div>
                                <p className="history-details">{record.details}</p>
                                <span className="history-user">
                                    Por: {record.performed_by || 'Sistema'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ClientHistory;
