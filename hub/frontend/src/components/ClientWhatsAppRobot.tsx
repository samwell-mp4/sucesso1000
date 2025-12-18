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
    Save
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

    useEffect(() => {
        fetchRobotConfig();
        fetchTrainings();
    }, [clientId]);

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
