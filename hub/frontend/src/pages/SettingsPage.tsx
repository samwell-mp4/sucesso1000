import { useState } from 'react';
import { Save } from 'lucide-react';
import '../styles/Settings.css';

const SettingsPage = () => {
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState({
        defaultCommission: 10,
        allowNewRegistrations: true,
        maintenanceMode: false
    });

    const handleSave = async () => {
        setLoading(true);
        try {
            // In a real app, we would save this to a 'settings' table
            // For now, we'll just simulate a save
            await new Promise(resolve => setTimeout(resolve, 1000));
            alert('Configurações salvas com sucesso!');
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Erro ao salvar configurações');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Configurações</h1>
            </div>

            <div className="settings-container">
                <div className="settings-card">
                    <h2>Geral</h2>
                    <div className="form-group">
                        <label className="form-label">Comissão Padrão (%)</label>
                        <input
                            type="number"
                            className="form-input"
                            value={settings.defaultCommission}
                            onChange={e => setSettings({ ...settings, defaultCommission: Number(e.target.value) })}
                        />
                    </div>
                    <div className="form-group">
                        <label className="toggle-label">
                            <input
                                type="checkbox"
                                checked={settings.allowNewRegistrations}
                                onChange={e => setSettings({ ...settings, allowNewRegistrations: e.target.checked })}
                            />
                            Permitir Novos Cadastros
                        </label>
                    </div>
                    <div className="form-group">
                        <label className="toggle-label">
                            <input
                                type="checkbox"
                                checked={settings.maintenanceMode}
                                onChange={e => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                            />
                            Modo de Manutenção
                        </label>
                    </div>
                    <button
                        className="submit-button"
                        onClick={handleSave}
                        disabled={loading}
                    >
                        <Save size={16} style={{ marginRight: '0.5rem' }} />
                        {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
