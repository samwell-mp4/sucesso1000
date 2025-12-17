import { supabase } from '../lib/supabase';

export const logClientAction = async (
    clientId: string,
    action: string,
    details: string,
    performedBy: string = 'Sistema'
) => {
    try {
        await supabase.from('client_history').insert([{
            client_id: clientId,
            action,
            details,
            performed_by: performedBy
        }]);
    } catch (error) {
        console.error('Error logging action:', error);
    }
};
