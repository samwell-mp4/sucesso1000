import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import WhatsAppSidebar from './WhatsAppSidebar';
import N8nChatWidget from './N8nChatWidget';
import '../styles/Layout.css';

const WhatsAppLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className="app-container">
            <button
                className="mobile-menu-button"
                onClick={toggleSidebar}
            >
                <Menu size={24} />
            </button>

            <WhatsAppSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {isSidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <main className="main-content">
                <Outlet />
            </main>
            <N8nChatWidget />
        </div>
    );
};

export default WhatsAppLayout;
