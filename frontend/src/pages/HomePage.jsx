import { ChatWidget } from '../components/ChatWidget';

export const HomePage = () => {
    return (
        <div className="min-h-screen bg-[#070514] text-white flex flex-col items-center selection:bg-purple-600 selection:text-white">
            {/* Header Navbar */}
            <header className="w-full bg-[#0d0a20] text-indigo-100 p-4 border-b border-purple-900/30 flex justify-between items-center px-10 shadow-[0_4px_30px_rgba(139,92,246,0.1)] backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="Epsilon Intelligence Logo" className="w-10 h-10 object-contain drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
                    <div className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Epsilon Intelligence</div>
                </div>
                <nav className="space-x-8 hidden md:block font-medium">
                    <a href="#" className="hover:text-purple-300 transition-colors">Productos</a>
                    <a href="#" className="hover:text-purple-300 transition-colors">Soluciones</a>
                    <a href="#" className="hover:text-purple-300 transition-colors">Soporte</a>
                </nav>
            </header>

            {/* Hero Section */}
            <main className="flex-1 flex flex-col items-center text-center justify-center p-8 mt-10 max-w-4xl relative">
                {/* Purple glow behind text */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none -z-10"></div>
                
                <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white via-indigo-200 to-purple-400 mb-6 leading-tight drop-shadow-sm">
                    Equipamiento y Software B2B de Alto Rendimiento
                </h1>
                <p className="text-xl text-indigo-200/80 mb-10 max-w-2xl font-light">
                    Descubre nuestro catálogo de servidores web, firewalls empresariales y herramientas SaaS. Nuestro asistente virtual está listo para guiarte.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 w-full">
                    <div className="bg-[#120e2b] p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-purple-800/30 flex flex-col items-center hover:-translate-y-1 hover:border-purple-500/50 transition-all duration-300 group">
                        <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">💻</div>
                        <h3 className="font-bold text-white tracking-wide">Hardware Empresarial</h3>
                        <p className="text-sm text-indigo-300/70 mt-2 font-light">Servidores, firewalls y equipos de red.</p>
                    </div>
                    <div className="bg-[#120e2b] p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-purple-800/30 flex flex-col items-center hover:-translate-y-1 hover:border-blue-500/50 transition-all duration-300 group">
                        <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">☁️</div>
                        <h3 className="font-bold text-white tracking-wide">Software SaaS</h3>
                        <p className="text-sm text-indigo-300/70 mt-2 font-light">Licencias y sistemas en la nube.</p>
                    </div>
                    <div className="bg-[#120e2b] p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-purple-800/30 flex flex-col items-center hover:-translate-y-1 hover:border-purple-500/50 transition-all duration-300 group">
                        <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🤖</div>
                        <h3 className="font-bold text-white tracking-wide">Asesoría Inteligente</h3>
                        <p className="text-sm text-indigo-300/70 mt-2 font-light">Chatbot 24/7 disponible para dudas.</p>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="w-full bg-[#05040d] text-indigo-400/50 p-6 text-center mt-auto border-t border-purple-900/20 text-sm font-light">
                <p>&copy; 2026 Epsilon Intelligence. Todos los derechos reservados.</p>
            </footer>

            {/* Embedded B2C Chat Widget */}
            <ChatWidget adminMode={false} />
        </div>
    );
};
