import { useState } from 'react';
import { supabase } from '../lib/supabase';

const SeedData = () => {
    const [status, setStatus] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const addLog = (msg: string) => setStatus(prev => [...prev, msg]);

    const handleSeed = async () => {
        setLoading(true);
        setStatus([]);
        addLog('Iniciando processo de seed...');

        try {
            // 1. Create Admin User
            addLog('Tentando criar/logar usuário admin...');
            const { error: authError } = await supabase.auth.signUp({
                email: 'admin@google.com',
                password: 'admin123',
                options: {
                    data: { name: 'Admin User', role: 'admin' }
                }
            });

            if (authError) {
                if (authError.message.includes('already registered')) {
                    addLog('Usuário já existe. Tentando login...');
                    const { error: loginError } = await supabase.auth.signInWithPassword({
                        email: 'admin@google.com',
                        password: 'admin123',
                    });
                    if (loginError) throw loginError;
                    addLog('Login realizado com sucesso!');
                } else {
                    throw authError;
                }
            } else {
                addLog('Usuário admin criado com sucesso!');
            }

            // 2. Insert Robots
            addLog('Inserindo Robôs...');
            const robots = [
                { client_name: 'Empresa A', type: 'Atendimento', status: 'active', last_connection: new Date().toISOString() },
                { client_name: 'Empresa B', type: 'Vendas', status: 'offline', last_connection: new Date().toISOString() },
                { client_name: 'Empresa C', type: 'Agendamento', status: 'active', last_connection: new Date().toISOString() },
            ];
            const { error: robotsError } = await supabase.from('robots').insert(robots);
            if (robotsError) addLog(`Erro ao inserir robôs: ${robotsError.message}`);
            else addLog('Robôs inseridos!');

            // 3. Insert Clients
            addLog('Inserindo Clientes...');
            const clients = [
                { name: 'Cliente Alpha', plan: 'Enterprise', status: 'active', seller: 'Vendedor 1', start_date: '2024-01-01' },
                { name: 'Cliente Beta', plan: 'Premium', status: 'pending', seller: 'Vendedor 2', start_date: '2024-02-15' },
                { name: 'Cliente Gamma', plan: 'Básico', status: 'inactive', seller: 'Vendedor 1', start_date: '2024-03-10' },
            ];
            const { error: clientsError } = await supabase.from('clients').insert(clients);
            if (clientsError) addLog(`Erro ao inserir clientes: ${clientsError.message}`);
            else addLog('Clientes inseridos!');

            // 4. Insert Appointments
            addLog('Inserindo Agendamentos...');
            const appointments = [
                { client_name: 'Cliente Alpha', seller_name: 'Vendedor 1', date: '2024-12-20', time: '10:00', status: 'scheduled' },
                { client_name: 'Cliente Beta', seller_name: 'Vendedor 2', date: '2024-12-21', time: '14:30', status: 'completed' },
                { client_name: 'Cliente Gamma', seller_name: 'Vendedor 1', date: '2024-12-22', time: '09:00', status: 'cancelled' },
            ];
            const { error: appError } = await supabase.from('appointments').insert(appointments);
            if (appError) addLog(`Erro ao inserir agendamentos: ${appError.message}`);
            else addLog('Agendamentos inseridos!');

            // 5. Insert Conversations
            addLog('Inserindo Conversas...');
            const conversations = [
                { lead_name: 'João Silva', lead_number: '11999999999', robot_name: 'Bot Vendas', seller_name: 'Vendedor 1', last_message: 'Tenho interesse', last_message_time: new Date().toISOString(), status: 'waiting' },
                { lead_name: 'Maria Souza', lead_number: '11888888888', robot_name: 'Bot Suporte', seller_name: 'Vendedor 2', last_message: 'Obrigado', last_message_time: new Date().toISOString(), status: 'active' },
                { lead_name: 'Pedro Santos', lead_number: '11777777777', robot_name: 'Bot Agendamento', seller_name: 'Vendedor 1', last_message: 'Qual o preço?', last_message_time: new Date().toISOString(), status: 'waiting' },
            ];
            const { error: convError } = await supabase.from('conversations').insert(conversations);
            if (convError) addLog(`Erro ao inserir conversas: ${convError.message}`);
            else addLog('Conversas inseridas!');

            // 6. Insert Sales
            addLog('Inserindo Vendas...');
            const sales = [
                { client_name: 'Cliente Alpha', product: 'Plano Anual', value: 5000, commission: 500, seller_name: 'Vendedor 1', date: '2024-12-01', status: 'completed' },
                { client_name: 'Cliente Beta', product: 'Setup Inicial', value: 1000, commission: 100, seller_name: 'Vendedor 2', date: '2024-12-05', status: 'pending' },
                { client_name: 'Cliente Delta', product: 'Consultoria', value: 2500, commission: 250, seller_name: 'Vendedor 1', date: '2024-12-10', status: 'completed' },
            ];
            const { error: salesError } = await supabase.from('sales').insert(sales);
            if (salesError) addLog(`Erro ao inserir vendas: ${salesError.message}`);
            else addLog('Vendas inseridas!');

            // 7. Insert Affiliates (Profiles)
            addLog('Inserindo Afiliados...');
            // Note: In Supabase, profiles are usually linked to auth.users. 
            // We'll try to insert into 'profiles' directly if it's a separate table, 
            // or we might need to create auth users for them too.
            // Assuming 'profiles' is a standalone table for this demo or linked via trigger.
            const affiliates = [
                { name: 'Vendedor 1', email: 'vendedor1@teste.com', role: 'seller', status: 'active', sales: 10, total_sold: 15000, code: 'VEND1' },
                { name: 'Vendedor 2', email: 'vendedor2@teste.com', role: 'seller', status: 'active', sales: 5, total_sold: 5000, code: 'VEND2' },
                { name: 'Vendedor 3', email: 'vendedor3@teste.com', role: 'seller', status: 'inactive', sales: 0, total_sold: 0, code: 'VEND3' },
            ];
            const { error: affError } = await supabase.from('profiles').insert(affiliates);
            if (affError) {
                addLog(`Erro ao inserir afiliados (pode ser restrição de chave estrangeira se profiles for ligado a auth): ${affError.message}`);
            } else {
                addLog('Afiliados inseridos!');
            }

            addLog('Processo finalizado!');

        } catch (error: any) {
            console.error(error);
            addLog(`ERRO FATAL: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
            <h1>Gerador de Dados de Teste</h1>
            <p>Este script irá criar o usuário admin e popular o banco de dados.</p>

            <button
                onClick={handleSeed}
                disabled={loading}
                style={{
                    padding: '10px 20px',
                    fontSize: '16px',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    marginBottom: '20px'
                }}
            >
                {loading ? 'Processando...' : 'Gerar Dados'}
            </button>

            <div style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '5px', minHeight: '200px' }}>
                <h3>Log:</h3>
                {status.map((msg, i) => (
                    <div key={i} style={{ marginBottom: '5px', fontFamily: 'monospace' }}>{msg}</div>
                ))}
            </div>
        </div>
    );
};

export default SeedData;
