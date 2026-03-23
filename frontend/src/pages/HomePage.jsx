import { ChatWidget } from '../components/ChatWidget';

export const HomePage = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center">
            {/* Header Navbar */}
            <header className="w-full bg-indigo-600 text-white p-4 shadow-md flex justify-between items-center px-10">
                <div className="text-2xl font-bold tracking-tight">TechNova Solutions</div>
                <nav className="space-x-4 hidden md:block font-medium">
                    <a href="#" className="hover:text-indigo-200">Productos</a>
                    <a href="#" className="hover:text-indigo-200">Soluciones</a>
                    <a href="#" className="hover:text-indigo-200">Soporte</a>
                </nav>
            </header>

            {/* Hero Section */}
            <main className="flex-1 flex flex-col items-center text-center justify-center p-8 mt-10 max-w-4xl">
                <h1 className="text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
                    Equipamiento y Software B2B de Alto Rendimiento
                </h1>
                <p className="text-xl text-gray-600 mb-10 max-w-2xl">
                    Descubre nuestro catálogo de servidores web, firewalls empresariales y herramientas SaaS. Nuestro asistente virtual está listo para guiarte.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 w-full">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
                        <div className="text-4xl mb-4">💻</div>
                        <h3 className="font-bold text-gray-800">Hardware Empresarial</h3>
                        <p className="text-sm text-gray-500 mt-2">Servidores, firewalls y equipos de red.</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
                        <div className="text-4xl mb-4">☁️</div>
                        <h3 className="font-bold text-gray-800">Software SaaS</h3>
                        <p className="text-sm text-gray-500 mt-2">Licencias y sistemas en la nube.</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
                        <div className="text-4xl mb-4">🤖</div>
                        <h3 className="font-bold text-gray-800">Asesoría Inteligente</h3>
                        <p className="text-sm text-gray-500 mt-2">Chatbot 24/7 disponible para dudas.</p>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="w-full bg-gray-900 text-gray-400 p-6 text-center mt-auto">
                <p>&copy; 2026 TechNova Solutions. Todos los derechos reservados.</p>
            </footer>

            {/* Embedded B2C Chat Widget */}
            <ChatWidget adminMode={false} />
        </div>
    );
};
