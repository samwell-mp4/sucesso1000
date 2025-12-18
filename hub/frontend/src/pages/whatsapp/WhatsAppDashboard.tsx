import { useAuth } from '../../contexts/AuthContext';
import ClientWhatsAppRobot from '../../components/ClientWhatsAppRobot';
import '../../styles/WhatsAppDashboard.css';

const WhatsAppDashboard = () => {
    const { user } = useAuth();

    if (!user) {
        return <div className="flex items-center justify-center h-full text-white">Carregando usuário...</div>;
    }

    return (
        <div className="whatsapp-dashboard-container h-full">
            <ClientWhatsAppRobot clientId={user.id} />
        </div>
    );
};

export default WhatsAppDashboard;
