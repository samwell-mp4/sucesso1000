import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import '../styles/Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError('Falha no login. Verifique suas credenciais.');
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1 className="login-title">Sucesso1000 Hub</h1>
                    <p className="login-subtitle">Acesso Administrativo</p>
                </div>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <div className="input-wrapper">
                            <div className="input-icon">
                                <Mail size={20} />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="form-input"
                                placeholder="seu@email.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Senha</label>
                        <div className="input-wrapper">
                            <div className="input-icon">
                                <Lock size={20} />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="form-input"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="submit-button"
                    >
                        Entrar
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
