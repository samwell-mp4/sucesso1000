import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Bot, ArrowRight } from 'lucide-react';
import '../styles/HubSelector.css';

const HubSelector = () => {
    const navigate = useNavigate();

    return (
        <div className="hub-selector-container">
            <div className="hub-selector-content">
                <h1 className="hub-title">Bem-vindo ao Sucesso1000</h1>
                <p className="hub-subtitle">Selecione o ambiente que deseja acessar</p>

                <div className="hub-options">
                    <div className="hub-card" onClick={() => navigate('/dashboard')}>
                        <div className="hub-icon management">
                            <LayoutDashboard size={48} />
                        </div>
                        <h2>Hub de Gestão</h2>
                        <p>Gerencie clientes, financeiro, agendamentos e afiliados.</p>
                        <button className="hub-button">
                            Acessar <ArrowRight size={16} />
                        </button>
                    </div>

                    <div className="hub-card" onClick={() => navigate('/whatsapp')}>
                        <div className="hub-icon robot">
                            <Bot size={48} />
                        </div>
                        <h2>WhatsApp Hub Robot</h2>
                        <p>Automação inteligente, controle de bots e métricas de conversas.</p>
                        <button className="hub-button">
                            Acessar <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HubSelector;
