import React, { useState } from 'react';
import { useAuth } from '../shared/authContext';
import { Sparkles, ArrowRight, Lock } from 'lucide-react';

export const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        try {
            await login(email, password);
        } catch (err) {
            let errorMsg = 'Error al iniciar sesión. Intenta nuevamente.';
            if (err.response?.data?.detail) {
                if (typeof err.response.data.detail === 'string') {
                    errorMsg = err.response.data.detail;
                } else if (Array.isArray(err.response.data.detail)) {
                    errorMsg = 'Error de formato en los datos ingresados.';
                }
            }
            setError(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#070514] flex items-center justify-center p-4">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/20 blur-[120px]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/20 blur-[120px]"></div>
            </div>
            
            <div className="w-full max-w-md bg-[#120e2b]/80 backdrop-blur-xl rounded-3xl border border-purple-500/30 shadow-[0_0_50px_rgba(139,92,246,0.15)] p-8 relative z-10">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-[#0d0a20] rounded-2xl border border-purple-500/30 flex items-center justify-center shadow-inner mb-4 relative group">
                        <div className="absolute inset-0 bg-purple-500/20 blur-md rounded-2xl group-hover:bg-purple-500/30 transition-all"></div>
                        <Sparkles className="text-purple-400 relative z-10" size={32} />
                    </div>
                    <h1 className="text-3xl font-black text-white text-center">Epsilon Intelligence</h1>
                    <p className="text-purple-200/60 mt-2 text-sm font-medium">B2B Management Dashboard</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-xl text-red-200 text-sm font-medium text-center">
                            {error}
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-bold text-purple-200/70 uppercase mb-2 ml-1">Correo Electrónico</label>
                        <input 
                            type="email" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="usuario@epsilon.com"
                            className="w-full bg-[#0d0a20] border border-purple-500/20 text-white rounded-xl p-4 focus:border-purple-500/80 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all placeholder:text-gray-600"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-purple-200/70 uppercase mb-2 ml-1">Contraseña</label>
                        <div className="relative">
                            <input 
                                type="password" 
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-[#0d0a20] border border-purple-500/20 text-white rounded-xl p-4 focus:border-purple-500/80 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all placeholder:text-gray-600"
                            />
                            <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-200/30" size={18} />
                        </div>
                    </div>
                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full mt-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white rounded-xl p-4 font-bold tracking-wide transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group"
                    >
                        {isSubmitting ? 'Verificando...' : 'Acceder al Sistema'}
                        {!isSubmitting && <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />}
                    </button>
                    
                    <div className="text-center pt-4 border-t border-purple-500/10 mt-6">
                        <p className="text-xs text-purple-200/40">Demo roles: admin@epsilon.com / usuario@epsilon.com (pass: admin123 / usuario123)</p>
                    </div>
                </form>
            </div>
        </div>
    );
};
