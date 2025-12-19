import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Bot,
    Activity,
    MessageSquare,
    Settings,
    Power,
    User,
    Briefcase,
    BookOpen,
    Zap,
    Link,
    Share2,
    Sliders,
    Calendar,
    ShoppingBag,
    Headphones,
    Globe,
    FileText,
    Video,
    Mic,
    Edit3,
    Save,
    LifeBuoy
} from 'lucide-react';
import { logClientAction } from '../utils/logger';
import '../styles/ClientWhatsAppRobot.css';

interface RobotConfig {
    status: 'online' | 'offline' | 'maintenance';
    name: string;
    communication_style: 'formal' | 'normal' | 'informal';
    behavior: string;
    purpose: 'support' | 'sales' | 'personal';
    health: 'excellent' | 'good' | 'warning' | 'critical';
    // New Settings
    transfer_to_human: boolean;
    use_emojis: boolean;
    sign_responses: boolean;
    restrict_topics: boolean;
    split_responses: boolean;
    allow_reminders: boolean;
    smart_training_search: boolean;
    timezone: string;
    response_time: string;
    interaction_limit: string;
}

// ... (TRAINING_CATEGORIES remains same)

const TRAINING_CATEGORIES = [
    'Personalidade',
    'Comunicação & Tom',
    'Sentimento & Empatia',
    'Regras & Regulamentos',
    'Negócio do Cliente',
    'Serviços & Ofertas',
    'Limites & Segurança',
    'Escalonamento Humano',
    'Aprendizado',
    'Horário de Funcionamento'
];

interface BusinessInfo {
    company_name: string;
    industry: string;
    website: string;
    description: string;
    target_audience: string;
}
const ClientWhatsAppRobot = ({ clientId }: { clientId: string }) => {
    const [activeTab, setActiveTab] = useState('profile');
    const [trainingTab, setTrainingTab] = useState('text'); // 'text' | 'website' | 'video' | 'document'
    const [selectedTrainingCategory, setSelectedTrainingCategory] = useState<string>(TRAINING_CATEGORIES[0]);

    const [config, setConfig] = useState<RobotConfig>({
        status: 'online',
        name: 'Winnie',
        communication_style: 'normal',
        behavior: 'Você é a Winnie, uma CRC I.A. especializada em atendimento para A Clínica Atend Já...',
        purpose: 'support',
        health: 'excellent',
        // Default Settings
        transfer_to_human: true,
        use_emojis: true,
        sign_responses: false,
        restrict_topics: false,
        split_responses: true,
        allow_reminders: true,
        smart_training_search: false,
        timezone: 'America/Sao_Paulo',
        response_time: 'immediate',
        interaction_limit: 'unlimited'
    });

    const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
        company_name: 'CRC Samwell',
        industry: '',
        website: 'https://minhaempresa.com.br',
        description: 'Você atua como CRC digital, responsável por atender leads, identificar o procedimento desejado...',
        target_audience: ''
    });

    const [trainings, setTrainings] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    // Support Center State
    const [tickets, setTickets] = useState<any[]>([]);
    const [loadingTickets, setLoadingTickets] = useState(false);
    const [newTicket, setNewTicket] = useState({
        subject: '',
        description: '',
        priority: 'medium',
        category: 'other'
    });

    // OpenAI Usage State
    const [openaiUsage, setOpenaiUsage] = useState<any>(null);
    const [loadingUsage, setLoadingUsage] = useState(false);

    useEffect(() => {
        fetchRobotConfig();
        fetchTrainings();
        fetchTickets();
        fetchOpenAIUsage();
    }, [clientId]);

    const fetchOpenAIUsage = async () => {
        try {
            setLoadingUsage(true);
            const response = await fetch('http://localhost:3001/api/openai/usage');
            if (!response.ok) throw new Error('Failed to fetch usage');
            const data = await response.json();
            setOpenaiUsage(data);
        } catch (error) {
            console.error('Error fetching OpenAI usage:', error);
        } finally {
            setLoadingUsage(false);
        }
    };

    const fetchTickets = async () => {
        try {
            setLoadingTickets(true);
            const { data, error } = await supabase
                .from('support_tickets')
                .select('*')
                .eq('client_id', clientId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTickets(data || []);
        } catch (error) {
            console.error('Error fetching tickets:', error);
        } finally {
            setLoadingTickets(false);
        }
    };

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            const { error } = await supabase
                .from('support_tickets')
                .insert([{
                    client_id: clientId,
                    ...newTicket
                }]);

            if (error) throw error;

            await logClientAction(clientId, 'Suporte', `Novo ticket criado: ${newTicket.subject}`);
            alert('Ticket criado com sucesso!');
            setNewTicket({
                subject: '',
                description: '',
                priority: 'medium',
                category: 'other'
            });
            fetchTickets();
        } catch (error) {
            console.error('Error creating ticket:', error);
            alert('Erro ao criar ticket.');
        } finally {
            setSaving(false);
        }
    };

    const fetchRobotConfig = async () => {
        try {
            // Fetch Main Config
            const { data: configData, error: configError } = await supabase
                .from('whatsapp_robot_configs')
                .select('*')
                .eq('client_id', clientId)
                .maybeSingle();

            if (configError) throw configError;

            if (configData) {
                setConfig(prev => ({ ...prev, ...configData }));
            }

            // Fetch Business Info
            const { data: businessData, error: businessError } = await supabase
                .from('whatsapp_robot_business_info')
                .select('*')
                .eq('client_id', clientId)
                .maybeSingle();

            if (businessError && businessError.code !== 'PGRST116') throw businessError;

            if (businessData) {
                setBusinessInfo(prev => ({ ...prev, ...businessData }));
            }
        } catch (error) {
            console.error('Error fetching robot config:', error);
        }
    };

    const fetchTrainings = async () => {
        try {
            const { data, error } = await supabase
                .from('whatsapp_robot_trainings')
                .select('category, content')
                .eq('client_id', clientId);

            if (error) throw error;

            const loadedTrainings: Record<string, string> = {};
            // Initialize with empty strings for all categories
            TRAINING_CATEGORIES.forEach(cat => loadedTrainings[cat] = '');

            // Fill with fetched data
            if (data) {
                data.forEach((item: any) => {
                    loadedTrainings[item.category] = item.content;
                });
            }
            setTrainings(loadedTrainings);
        } catch (error) {
            console.error('Error fetching trainings:', error);
        }
    };

    const handleToggleStatus = async () => {
        const newStatus = config.status === 'online' ? 'offline' : 'online';
        setConfig({ ...config, status: newStatus });
        await logClientAction(clientId, 'Robô', `Status alterado para ${newStatus}`);
    };

    const saveRobotConfig = async () => {
        try {
            setSaving(true);

            // 1. Save Config
            const configToSave = {
                client_id: clientId,
                name: config.name,
                behavior: config.behavior,
                communication_style: config.communication_style,
                purpose: config.purpose,
                status: config.status,
                // New Settings
                transfer_to_human: config.transfer_to_human,
                use_emojis: config.use_emojis,
                sign_responses: config.sign_responses,
                restrict_topics: config.restrict_topics,
                split_responses: config.split_responses,
                allow_reminders: config.allow_reminders,
                smart_training_search: config.smart_training_search,
                timezone: config.timezone,
                response_time: config.response_time,
                interaction_limit: config.interaction_limit
            };

            const { error: configError } = await supabase
                .from('whatsapp_robot_configs')
                .upsert(configToSave, { onConflict: 'client_id' });

            if (configError) throw configError;

            // 2. Save Business Info
            const businessToSave = {
                client_id: clientId,
                company_name: businessInfo.company_name,
                industry: businessInfo.industry,
                website: businessInfo.website,
                description: businessInfo.description,
                target_audience: businessInfo.target_audience
            };

            const { error: businessError } = await supabase
                .from('whatsapp_robot_business_info')
                .upsert(businessToSave, { onConflict: 'client_id' });

            if (businessError) throw businessError;

            // 3. Save Trainings
            const trainingUpserts = Object.entries(trainings).map(([category, content]) => ({
                client_id: clientId,
                category,
                content
            }));

            const { error: trainingError } = await supabase
                .from('whatsapp_robot_trainings')
                .upsert(trainingUpserts, { onConflict: 'client_id,category' });

            if (trainingError) throw trainingError;

            await logClientAction(clientId, 'Robô', 'Configurações e treinamentos atualizados');
            alert('Configurações salvas com sucesso!');
            window.location.reload();

        } catch (error) {
            console.error('Error saving robot config:', error);
            alert('Erro ao salvar configurações. Tente novamente.');
        } finally {
            setSaving(false);
        }
    };

    const handleTrainingChange = (content: string) => {
        setTrainings(prev => ({
            ...prev,
            [selectedTrainingCategory]: content
        }));
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return (
                    <div className="robot-glass-panel p-6 animate-fade-in">
                        <h3 className="robot-section-title">Informações Pessoais</h3>

                        <div className="robot-form-group">
                            <label className="robot-label">Nome do Agente</label>
                            <input
                                type="text"
                                value={config.name}
                                onChange={(e) => setConfig({ ...config, name: e.target.value })}
                                className="robot-input"
                                placeholder="Ex: Winnie"
                            />
                        </div>

                        <div className="robot-form-group">
                            <label className="robot-label">Comunicação</label>
                            <div className="robot-btn-group">
                                {['formal', 'normal', 'informal'].map((style) => (
                                    <button
                                        key={style}
                                        className={`robot-btn-option ${config.communication_style === style ? 'active' : ''}`}
                                        onClick={() => setConfig({ ...config, communication_style: style as any })}
                                    >
                                        {style.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="robot-form-group">
                            <label className="robot-label">Comportamento</label>
                            <textarea
                                value={config.behavior}
                                onChange={(e) => setConfig({ ...config, behavior: e.target.value })}
                                className="robot-textarea"
                                placeholder="Descreva como o agente deve se comportar durante a conversa..."
                                maxLength={524}
                            />
                            <p className="text-xs text-[var(--text-muted)] mt-2 text-right">{config.behavior.length}/524</p>
                        </div>
                    </div>
                );

            case 'work':
                return (
                    <div className="robot-glass-panel p-6 animate-fade-in">
                        <h3 className="robot-section-title">Informações sobre Trabalho</h3>

                        <div className="robot-form-group">
                            <label className="robot-label">Finalidade</label>
                            <div className="robot-purpose-grid">
                                <div
                                    className={`robot-purpose-card ${config.purpose === 'support' ? 'active' : ''}`}
                                    onClick={() => setConfig({ ...config, purpose: 'support' })}
                                >
                                    <div className="robot-purpose-header">
                                        <Headphones size={20} className="robot-purpose-icon" />
                                        <span className="robot-purpose-title">Suporte</span>
                                    </div>
                                    <p className="robot-purpose-desc">Use essa opção sempre que o objetivo for prestar suporte.</p>
                                </div>
                                <div
                                    className={`robot-purpose-card ${config.purpose === 'sales' ? 'active' : ''}`}
                                    onClick={() => setConfig({ ...config, purpose: 'sales' })}
                                >
                                    <div className="robot-purpose-header">
                                        <ShoppingBag size={20} className="robot-purpose-icon" />
                                        <span className="robot-purpose-title">Vendas</span>
                                    </div>
                                    <p className="robot-purpose-desc">Use sempre que quiser criar um agente de vendas.</p>
                                </div>
                                <div
                                    className={`robot-purpose-card ${config.purpose === 'personal' ? 'active' : ''}`}
                                    onClick={() => setConfig({ ...config, purpose: 'personal' })}
                                >
                                    <div className="robot-purpose-header">
                                        <User size={20} className="robot-purpose-icon" />
                                        <span className="robot-purpose-title">Uso Pessoal</span>
                                    </div>
                                    <p className="robot-purpose-desc">Escolha esta opção caso queira um agente pessoal.</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="robot-form-group">
                                <label className="robot-label">Presta suporte para:</label>
                                <input
                                    type="text"
                                    value={businessInfo.company_name}
                                    onChange={(e) => setBusinessInfo({ ...businessInfo, company_name: e.target.value })}
                                    className="robot-input"
                                    placeholder="Nome da Empresa"
                                />
                            </div>
                            <div className="robot-form-group">
                                <label className="robot-label">Site Oficial (opcional)</label>
                                <input
                                    type="text"
                                    value={businessInfo.website}
                                    onChange={(e) => setBusinessInfo({ ...businessInfo, website: e.target.value })}
                                    className="robot-input"
                                    placeholder="https://..."
                                />
                            </div>
                        </div>

                        <div className="robot-form-group">
                            <label className="robot-label">Descreva um pouco sobre {businessInfo.company_name || 'a empresa'}</label>
                            <textarea
                                value={businessInfo.description}
                                onChange={(e) => setBusinessInfo({ ...businessInfo, description: e.target.value })}
                                className="robot-textarea"
                                maxLength={524}
                            />
                            <p className="text-xs text-[var(--text-muted)] mt-2 text-right">{businessInfo.description?.length || 0}/524</p>
                        </div>
                    </div>
                );

            case 'training':
                return (
                    <div className="robot-glass-panel p-6 animate-fade-in">
                        <h3 className="robot-section-title">Treinamentos</h3>

                        {/* Sub-tabs for Training Types */}
                        <div className="training-tabs mb-6">
                            <div
                                className={`training-tab ${trainingTab === 'text' ? 'active' : ''}`}
                                onClick={() => setTrainingTab('text')}
                            >
                                <FileText size={16} className="mr-2" />
                                Texto
                            </div>
                            <div
                                className={`training-tab ${trainingTab === 'website' ? 'active' : ''}`}
                                onClick={() => setTrainingTab('website')}
                            >
                                <Globe size={16} className="mr-2" />
                                Website
                            </div>
                            <div
                                className={`training-tab ${trainingTab === 'video' ? 'active' : ''}`}
                                onClick={() => setTrainingTab('video')}
                            >
                                <Video size={16} className="mr-2" />
                                Video
                            </div>
                            <div
                                className={`training-tab ${trainingTab === 'document' ? 'active' : ''}`}
                                onClick={() => setTrainingTab('document')}
                            >
                                <BookOpen size={16} className="mr-2" />
                                Documento
                            </div>
                        </div>

                        {trainingTab === 'text' && (
                            <div className="training-container">
                                {/* Categories List (Sidebar) */}
                                <div className="training-sidebar">
                                    {TRAINING_CATEGORIES.map((category) => (
                                        <button
                                            key={category}
                                            onClick={() => setSelectedTrainingCategory(category)}
                                            className={`training-category-btn ${selectedTrainingCategory === category ? 'active' : 'inactive'
                                                }`}
                                        >
                                            <span>{category}</span>
                                            {trainings[category] && trainings[category].length > 0 && (
                                                <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]"></span>
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {/* Editor Area (Content) */}
                                <div className="training-content">
                                    <div className="training-editor-container">
                                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-[rgba(255,255,255,0.05)]">
                                            <h4 className="text-[var(--text-main)] font-semibold flex items-center gap-2 text-lg">
                                                <Edit3 size={20} className="text-[var(--primary)]" />
                                                {selectedTrainingCategory}
                                            </h4>
                                            <span className="text-xs text-[var(--text-muted)] bg-[rgba(255,255,255,0.05)] px-2 py-1 rounded-full border border-[rgba(255,255,255,0.05)]">
                                                {trainings[selectedTrainingCategory]?.length || 0} / 524 caracteres
                                            </span>
                                        </div>

                                        <textarea
                                            value={trainings[selectedTrainingCategory] || ''}
                                            onChange={(e) => handleTrainingChange(e.target.value)}
                                            className="robot-textarea flex-1 min-h-[400px] resize-none text-base leading-relaxed"
                                            placeholder={`Digite as instruções detalhadas para o tópico "${selectedTrainingCategory}"...\n\nExemplo:\n- Regra 1: Sempre responda com polidez.\n- Regra 2: Nunca compartilhe dados sensíveis.`}
                                            maxLength={524}
                                        />

                                        <div className="mt-4 flex items-center gap-2 text-xs text-[var(--text-secondary)] bg-[rgba(59,130,246,0.1)] p-3 rounded-md border border-blue-500/20">
                                            <div className="min-w-[4px] h-full bg-blue-500 rounded-full"></div>
                                            <p>Essas informações serão usadas para treinar o comportamento do seu robô especificamente neste tópico. Seja claro e objetivo.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {trainingTab !== 'text' && (
                            <div className="text-center py-12 text-[var(--text-secondary)] bg-[rgba(0,0,0,0.2)] rounded-lg border border-[var(--border-color)]">
                                <div className="mb-4 flex justify-center">
                                    {trainingTab === 'website' && <Globe size={48} className="opacity-20" />}
                                    {trainingTab === 'video' && <Video size={48} className="opacity-20" />}
                                    {trainingTab === 'document' && <BookOpen size={48} className="opacity-20" />}
                                </div>
                                <p>O treinamento via {trainingTab} estará disponível em breve.</p>
                            </div>
                        )}
                    </div>
                );

            case 'intents':
                return (
                    <div className="robot-glass-panel p-6 animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="robot-section-title mb-0 border-none">Intenções</h3>
                            <div className="flex gap-2">
                                <input type="text" placeholder="Buscar intenções" className="robot-input w-64" />
                                <button className="px-4 py-2 border border-[var(--border-color)] rounded-md text-[var(--text-main)] hover:bg-[rgba(255,255,255,0.05)]">Importar</button>
                                <button className="px-4 py-2 bg-[var(--primary)] text-white rounded-md font-medium hover:bg-[var(--primary-hover)]">Nova Intenção</button>
                            </div>
                        </div>

                        <div className="intent-list">
                            <div className="intent-item">
                                <div className="intent-info">
                                    <h4>Agendamento no Google Calendar</h4>
                                    <p>Webhook: https://n8n.webhook/google-calendar-booking...</p>
                                </div>
                                <button className="text-[var(--text-secondary)] hover:text-[var(--text-main)]"><Sliders size={18} /></button>
                            </div>
                            <div className="intent-item">
                                <div className="intent-info">
                                    <h4>Verificação de Pagamento</h4>
                                    <p>Webhook: https://n8n.webhook/payment-check...</p>
                                </div>
                                <button className="text-[var(--text-secondary)] hover:text-[var(--text-main)]"><Sliders size={18} /></button>
                            </div>
                            <div className="intent-item">
                                <div className="intent-info">
                                    <h4>Transbordo para Humano</h4>
                                    <p>Webhook: https://n8n.webhook/human-handoff...</p>
                                </div>
                                <button className="text-[var(--text-secondary)] hover:text-[var(--text-main)]"><Sliders size={18} /></button>
                            </div>
                        </div>
                    </div>
                );

            case 'integrations':
                return (
                    <div className="robot-glass-panel p-6 animate-fade-in">
                        <h3 className="robot-section-title">Integrações</h3>
                        <p className="text-sm text-[var(--text-secondary)] mb-6">Conecte o seu agente a outros aplicativos, isso permite que ele obtenha informações mais precisas ou agende reuniões para você.</p>

                        <div className="integration-grid">
                            <div className="integration-card">
                                <div className="integration-icon"><Mic size={24} className="text-[var(--text-main)]" /></div>
                                <h4 className="integration-name">ElevenLabs</h4>
                                <p className="integration-desc">Com ElevenLabs você dá a capacidade do seu agente responder seus clientes em áudio, tornando ainda mais humanizado.</p>
                                <button className="integration-btn connect">ATIVAR INTEGRAÇÃO</button>
                            </div>
                            <div className="integration-card">
                                <div className="integration-icon"><Calendar size={24} className="text-blue-500" /></div>
                                <h4 className="integration-name">Google Calendar</h4>
                                <p className="integration-desc">Com google calendar seu agente será capaz de agendar reuniões, criar link da chamada e já enviar os convites.</p>
                                <button className="integration-btn active">CONFIGURAR INTEGRAÇÃO</button>
                            </div>
                            <div className="integration-card">
                                <div className="integration-icon"><MessageSquare size={24} className="text-purple-500" /></div>
                                <h4 className="integration-name">Plug Chat</h4>
                                <p className="integration-desc">Caso sua IA ainda não consiga responder algumas perguntas, permita direcionar o atendimento a um humano.</p>
                                <button className="integration-btn connect">ATIVAR INTEGRAÇÃO</button>
                            </div>
                            <div className="integration-card">
                                <div className="integration-icon"><ShoppingBag size={24} className="text-pink-500" /></div>
                                <h4 className="integration-name">E-vendi</h4>
                                <p className="integration-desc">Faça sua IA ter acesso a todos os produtos da sua loja, podendo falar sobre preços, enviar fotos e links.</p>
                                <button className="integration-btn connect">ATIVAR INTEGRAÇÃO</button>
                            </div>
                        </div>
                    </div>
                );

            case 'settings':
                return (
                    <div className="robot-glass-panel p-6 animate-fade-in">
                        <h3 className="robot-section-title">Configurações Avançadas</h3>

                        <div className="settings-list">
                            {/* Toggles */}
                            <div className="setting-item">
                                <div className="setting-info">
                                    <h4>Transferir para humano</h4>
                                    <p>Habilite para que o agente possa transferir o atendimento para aba 'em espera' da equipe humana.</p>
                                </div>
                                <label className="robot-switch">
                                    <input
                                        type="checkbox"
                                        checked={config.transfer_to_human}
                                        onChange={(e) => setConfig({ ...config, transfer_to_human: e.target.checked })}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>

                            <div className="setting-item">
                                <div className="setting-info">
                                    <h4>Usar Emojis Nas Respostas</h4>
                                    <p>Defina se o agente pode utilizar emojis em suas respostas.</p>
                                </div>
                                <label className="robot-switch">
                                    <input
                                        type="checkbox"
                                        checked={config.use_emojis}
                                        onChange={(e) => setConfig({ ...config, use_emojis: e.target.checked })}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>

                            <div className="setting-item">
                                <div className="setting-info">
                                    <h4>Assinar nome do agente nas respostas</h4>
                                    <p>Ative esta opção para que o agente de IA adicione automaticamente sua assinatura em cada resposta enviada ao usuário.</p>
                                </div>
                                <label className="robot-switch">
                                    <input
                                        type="checkbox"
                                        checked={config.sign_responses}
                                        onChange={(e) => setConfig({ ...config, sign_responses: e.target.checked })}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>

                            <div className="setting-item">
                                <div className="setting-info">
                                    <h4>Restringir Temas Permitidos</h4>
                                    <p>Marque essa opção para que o agente não fale sobre outros assuntos.</p>
                                </div>
                                <label className="robot-switch">
                                    <input
                                        type="checkbox"
                                        checked={config.restrict_topics}
                                        onChange={(e) => setConfig({ ...config, restrict_topics: e.target.checked })}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>

                            <div className="setting-item">
                                <div className="setting-info">
                                    <h4>Dividir resposta em partes</h4>
                                    <p>Em caso da mensagem ficar grande, o agente pode separar em várias mensagens.</p>
                                </div>
                                <label className="robot-switch">
                                    <input
                                        type="checkbox"
                                        checked={config.split_responses}
                                        onChange={(e) => setConfig({ ...config, split_responses: e.target.checked })}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>

                            <div className="setting-item">
                                <div className="setting-info">
                                    <h4>Permitir registrar lembretes</h4>
                                    <p>Habilite essa opção para que o agente tenha a capacidade de registrar lembretes ao usuário.</p>
                                </div>
                                <label className="robot-switch">
                                    <input
                                        type="checkbox"
                                        checked={config.allow_reminders}
                                        onChange={(e) => setConfig({ ...config, allow_reminders: e.target.checked })}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>

                            <div className="setting-item">
                                <div className="setting-info">
                                    <h4 className="flex items-center gap-2">
                                        Busca inteligente do treinamento
                                        <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/30">Beta</span>
                                    </h4>
                                    <p>O agente consulta a base de treinamentos no momento certo, para trazer respostas mais precisas.</p>
                                </div>
                                <label className="robot-switch">
                                    <input
                                        type="checkbox"
                                        checked={config.smart_training_search}
                                        onChange={(e) => setConfig({ ...config, smart_training_search: e.target.checked })}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>

                            {/* Dropdowns */}
                            <div className="setting-item">
                                <div className="setting-info">
                                    <h4>Timezone do agente</h4>
                                    <p>Escolha o timezone que agente usará para datas, por exemplo agendar reuniões.</p>
                                </div>
                                <select
                                    className="robot-select"
                                    value={config.timezone}
                                    onChange={(e) => setConfig({ ...config, timezone: e.target.value })}
                                >
                                    <option value="America/Sao_Paulo">(GMT-03:00) Sao Paulo</option>
                                    <option value="UTC">UTC</option>
                                </select>
                            </div>

                            <div className="setting-item">
                                <div className="setting-info">
                                    <h4>Tempo de resposta</h4>
                                    <p>Defina um intervalo para o agente esperar e dar uma resposta.</p>
                                </div>
                                <select
                                    className="robot-select"
                                    value={config.response_time}
                                    onChange={(e) => setConfig({ ...config, response_time: e.target.value })}
                                >
                                    <option value="immediate">Imediatamente</option>
                                    <option value="5s">5 segundos</option>
                                    <option value="10s">10 segundos</option>
                                    <option value="30s">30 segundos</option>
                                </select>
                            </div>

                            <div className="setting-item">
                                <div className="setting-info">
                                    <h4>Limite de interações por atendimento</h4>
                                    <p>Defina a quantidade de interações que o agente pode aceitar por atendimento.</p>
                                </div>
                                <select
                                    className="robot-select"
                                    value={config.interaction_limit}
                                    onChange={(e) => setConfig({ ...config, interaction_limit: e.target.value })}
                                >
                                    <option value="unlimited">Sem limite</option>
                                    <option value="10">10 interações</option>
                                    <option value="20">20 interações</option>
                                    <option value="50">50 interações</option>
                                </select>
                            </div>
                        </div>
                    </div>
                );

            case 'support':
                return (
                    <div className="robot-glass-panel p-6 animate-fade-in">
                        <h3 className="robot-section-title flex items-center gap-2">
                            <LifeBuoy size={24} className="text-[var(--primary)]" />
                            Central de Suporte
                        </h3>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                            {/* Ticket List */}
                            <div className="lg:col-span-2 space-y-4">
                                <h4 className="text-lg font-medium text-[var(--text-main)] mb-4">Meus Tickets</h4>
                                {loadingTickets ? (
                                    <div className="text-center py-8 text-[var(--text-secondary)]">Carregando tickets...</div>
                                ) : tickets.length === 0 ? (
                                    <div className="text-center py-8 bg-[rgba(255,255,255,0.02)] rounded-xl border border-[rgba(255,255,255,0.05)]">
                                        <LifeBuoy size={48} className="mx-auto mb-3 text-[var(--text-muted)]" />
                                        <p className="text-[var(--text-secondary)]">Nenhum ticket encontrado.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {tickets.map(ticket => (
                                            <div key={ticket.id} className="bg-[rgba(255,255,255,0.03)] p-4 rounded-xl border border-[rgba(255,255,255,0.05)] hover:border-[var(--primary)] transition-colors">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h5 className="font-semibold text-[var(--text-main)]">{ticket.subject}</h5>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${ticket.status === 'open' ? 'bg-green-500/20 text-green-400' :
                                                        ticket.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-400' :
                                                            'bg-gray-500/20 text-gray-400'
                                                        }`}>
                                                        {ticket.status === 'open' ? 'Aberto' :
                                                            ticket.status === 'in_progress' ? 'Em Andamento' : 'Fechado'}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-3">{ticket.description}</p>
                                                <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                                                    <span className="flex items-center gap-1">
                                                        <Activity size={12} />
                                                        Prioridade: {ticket.priority}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={12} />
                                                        {new Date(ticket.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* New Ticket Form */}
                            <div className="bg-[rgba(255,255,255,0.02)] p-5 rounded-xl border border-[rgba(255,255,255,0.05)] h-fit">
                                <h4 className="text-lg font-medium text-[var(--text-main)] mb-4">Novo Ticket</h4>
                                <form onSubmit={handleCreateTicket} className="space-y-4">
                                    <div className="robot-form-group">
                                        <label className="robot-label">Assunto</label>
                                        <input
                                            type="text"
                                            required
                                            className="robot-input"
                                            value={newTicket.subject}
                                            onChange={e => setNewTicket({ ...newTicket, subject: e.target.value })}
                                            placeholder="Resumo do problema"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="robot-form-group">
                                            <label className="robot-label">Categoria</label>
                                            <select
                                                className="robot-select"
                                                value={newTicket.category}
                                                onChange={e => setNewTicket({ ...newTicket, category: e.target.value })}
                                            >
                                                <option value="other">Outro</option>
                                                <option value="bug">Erro/Bug</option>
                                                <option value="feature">Sugestão</option>
                                                <option value="billing">Financeiro</option>
                                            </select>
                                        </div>
                                        <div className="robot-form-group">
                                            <label className="robot-label">Prioridade</label>
                                            <select
                                                className="robot-select"
                                                value={newTicket.priority}
                                                onChange={e => setNewTicket({ ...newTicket, priority: e.target.value })}
                                            >
                                                <option value="low">Baixa</option>
                                                <option value="medium">Média</option>
                                                <option value="high">Alta</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="robot-form-group">
                                        <label className="robot-label">Descrição</label>
                                        <textarea
                                            required
                                            className="robot-textarea"
                                            rows={4}
                                            value={newTicket.description}
                                            onChange={e => setNewTicket({ ...newTicket, description: e.target.value })}
                                            placeholder="Detalhe o que está acontecendo..."
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="w-full py-2 px-4 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {saving ? 'Enviando...' : (
                                            <>
                                                <LifeBuoy size={18} />
                                                Abrir Ticket
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                );

            case 'usage':
                const usageData = openaiUsage?.data?.[0]?.results?.[0];
                const inputTokens = usageData?.input_tokens || 0;
                const outputTokens = usageData?.output_tokens || 0;
                const totalTokens = inputTokens + outputTokens;
                const requests = usageData?.num_model_requests || 0;

                // Estimated Cost (GPT-4o pricing: $2.50/1M input, $10.00/1M output)
                const estimatedCost = ((inputTokens / 1000000) * 2.50) + ((outputTokens / 1000000) * 10.00);

                return (
                    <div className="robot-glass-panel p-6 animate-fade-in">
                        <h3 className="robot-section-title flex items-center gap-2">
                            <Zap size={24} className="text-[var(--primary)]" />
                            Consumo de Inteligência Artificial
                        </h3>
                        <p className="text-[var(--text-secondary)] mb-6">Acompanhe o consumo de tokens e custos estimados da sua API OpenAI.</p>

                        {loadingUsage ? (
                            <div className="text-center py-12">
                                <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-[var(--text-secondary)]">Carregando dados de consumo...</p>
                            </div>
                        ) : !openaiUsage ? (
                            <div className="text-center py-12 bg-[rgba(255,255,255,0.02)] rounded-xl border border-[rgba(255,255,255,0.05)]">
                                <Zap size={48} className="mx-auto mb-3 text-[var(--text-muted)]" />
                                <p className="text-[var(--text-secondary)]">Não foi possível carregar os dados.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-[rgba(255,255,255,0.03)] p-4 rounded-xl border border-[rgba(255,255,255,0.05)]">
                                    <div className="text-sm text-[var(--text-secondary)] mb-1">Total de Tokens</div>
                                    <div className="text-2xl font-bold text-[var(--text-main)]">{totalTokens.toLocaleString()}</div>
                                </div>
                                <div className="bg-[rgba(255,255,255,0.03)] p-4 rounded-xl border border-[rgba(255,255,255,0.05)]">
                                    <div className="text-sm text-[var(--text-secondary)] mb-1">Tokens de Entrada</div>
                                    <div className="text-2xl font-bold text-blue-400">{inputTokens.toLocaleString()}</div>
                                </div>
                                <div className="bg-[rgba(255,255,255,0.03)] p-4 rounded-xl border border-[rgba(255,255,255,0.05)]">
                                    <div className="text-sm text-[var(--text-secondary)] mb-1">Tokens de Saída</div>
                                    <div className="text-2xl font-bold text-purple-400">{outputTokens.toLocaleString()}</div>
                                </div>
                                <div className="bg-[rgba(255,255,255,0.03)] p-4 rounded-xl border border-[rgba(255,255,255,0.05)]">
                                    <div className="text-sm text-[var(--text-secondary)] mb-1">Custo Estimado</div>
                                    <div className="text-2xl font-bold text-green-400">$ {estimatedCost.toFixed(4)}</div>
                                </div>

                                <div className="col-span-full mt-4 bg-[rgba(255,255,255,0.02)] p-4 rounded-xl border border-[rgba(255,255,255,0.05)] flex items-center justify-between">
                                    <div>
                                        <div className="text-sm text-[var(--text-secondary)]">Requisições Totais</div>
                                        <div className="text-xl font-bold text-[var(--text-main)]">{requests} calls</div>
                                    </div>
                                    <div className="text-xs text-[var(--text-muted)] text-right">
                                        Dados atualizados do mês atual.<br />
                                        Estimativa baseada em GPT-4o.
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );

            default:
                return <div className="text-center text-[var(--text-secondary)] mt-10">Selecione uma opção no menu lateral</div>;
        }
    };

    return (
        <div className="robot-container">
            {/* Header / Status Section */}
            <div className="robot-glass-panel robot-header">
                <div className="robot-title-group">
                    <div className={`robot-icon-wrapper ${config.status}`}>
                        <Bot size={32} color={config.status === 'online' ? 'var(--success)' : 'var(--danger)'} />
                    </div>
                    <div>
                        <h2 className="robot-title">{config.name}</h2>
                        <div className="robot-subtitle">
                            <span className={`status-dot ${config.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} style={{ backgroundColor: config.status === 'online' ? 'var(--success)' : 'var(--danger)' }}></span>
                            <span>{config.status === 'online' ? 'ONLINE' : 'PAUSADO'}</span>
                        </div>
                    </div>
                </div>

                <div className="robot-controls">
                    <div className="robot-health">
                        <div className="robot-health-label">Saúde do Sistema</div>
                        <div className="robot-health-value" style={{ color: 'var(--success)' }}>
                            <Activity size={16} />
                            Excelente
                        </div>
                    </div>
                    <div className="robot-divider"></div>
                    <button
                        onClick={handleToggleStatus}
                        className={`btn-toggle ${config.status === 'online' ? 'online' : 'offline'}`}
                    >
                        <Power size={18} />
                        {config.status === 'online' ? 'Pausar Robô' : 'Ativar Robô'}
                    </button>
                </div>
            </div>

            <div className="robot-main-layout">
                {/* Sidebar */}
                <div className="robot-sidebar">
                    <div className={`robot-sidebar-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
                        <User size={18} /> Perfil
                    </div>
                    <div className={`robot-sidebar-item ${activeTab === 'work' ? 'active' : ''}`} onClick={() => setActiveTab('work')}>
                        <Briefcase size={18} /> Trabalho
                    </div>
                    <div className={`robot-sidebar-item ${activeTab === 'training' ? 'active' : ''}`} onClick={() => setActiveTab('training')}>
                        <BookOpen size={18} /> Treinamentos
                    </div>
                    <div className={`robot-sidebar-item ${activeTab === 'intents' ? 'active' : ''}`} onClick={() => setActiveTab('intents')}>
                        <Zap size={18} /> Intenções
                    </div>
                    <div className={`robot-sidebar-item ${activeTab === 'integrations' ? 'active' : ''}`} onClick={() => setActiveTab('integrations')}>
                        <Link size={18} /> Integrações
                    </div>
                    <div className={`robot-sidebar-item ${activeTab === 'channels' ? 'active' : ''}`} onClick={() => setActiveTab('channels')}>
                        <Share2 size={18} /> Canais
                    </div>
                    <div className={`robot-sidebar-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
                        <Settings size={18} /> Configurações
                    </div>
                    <div className={`robot-sidebar-item ${activeTab === 'support' ? 'active' : ''}`} onClick={() => setActiveTab('support')}>
                        <LifeBuoy size={18} /> Suporte
                    </div>
                    <div className={`robot-sidebar-item ${activeTab === 'usage' ? 'active' : ''}`} onClick={() => setActiveTab('usage')}>
                        <Zap size={18} /> Consumo IA
                    </div>
                </div>

                {/* Content Area */}
                <div className="robot-content-area">
                    {renderContent()}

                    <div className="flex justify-end mt-4">
                        <button
                            onClick={saveRobotConfig}
                            disabled={saving}
                            className="robot-save-btn"
                        >
                            {saving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    Salvar Alterações
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientWhatsAppRobot;
