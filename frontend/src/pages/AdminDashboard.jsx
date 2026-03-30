import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, FileText, Edit, Save, X, Search, ChevronDown, Calendar, MessageSquare, Package, Brush, TrendingUp, Sparkles, Bot, Trash2, Plus, RefreshCw } from 'lucide-react';
import { ChatWindow } from '../widgets/chat/ui/ChatWindow';

const AdminDashboard = () => {
    // Tab State
    const [activeTab, setActiveTab] = useState('sales'); // default to sales as requested

    // Inventory State
    const [inventoryView, setInventoryView] = useState('knowledge'); // 'knowledge' | 'ingest'
    const [stats, setStats] = useState(null);
    const [products, setProducts] = useState([]);
    const [editingProduct, setEditingProduct] = useState(null);

    // Sales State
    const [salesStats, setSalesStats] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(0); // 0 for all year
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState('Todos');

    // Custom Dashboard State
    const [customQuery, setCustomQuery] = useState('');
    const [customData, setCustomData] = useState(null);
    const [customLoading, setCustomLoading] = useState(false);
    
    const [chartFilter, setChartFilter] = useState('Todos');
    const [sellerFilter, setSellerFilter] = useState('');

    // Currency and Exchange Rates State
    const [revenueCurrency, setRevenueCurrency] = useState('USD');
    const [activeTheme, setActiveTheme] = useState('oscuro');
    const [showThemeMenu, setShowThemeMenu] = useState(false);

    const [bcvRates, setBcvRates] = useState({
        USD: 55.74, 
        EUR: 58.21
    });

    const getConvertedAmount = (amount) => {
        if (!amount) return 0;
        if (revenueCurrency === 'USD') return amount;
        if (revenueCurrency === 'VES') return amount * bcvRates.USD;
        if (revenueCurrency === 'EUR') return amount * (bcvRates.USD / bcvRates.EUR);
        return amount;
    };

    const formatCurrency = (amount) => {
        const val = getConvertedAmount(amount);
        const prefix = revenueCurrency === 'USD' ? '$' : revenueCurrency === 'EUR' ? '€' : 'Bs. ';
        const locale = revenueCurrency === 'USD' ? 'en-US' : revenueCurrency === 'EUR' ? 'es-ES' : 'es-VE';
        return `${prefix}${val.toLocaleString(locale, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    };

    // Ingestion UI State
    const [isUploading, setIsUploading] = useState(false);
    const [manualSale, setManualSale] = useState({
        customer_name: '', product_name: '', quantity: 1, 
        sale_date: new Date().toISOString().split('T')[0], price: 0, 
        price_total: 0, payment_method: 'Card', seller_name: '', category: 'Hardware'
    });
    
    // Histórico
    const [registeredSales, setRegisteredSales] = useState([]);
    const [salesSearch, setSalesSearch] = useState('');
    const [editingSale, setEditingSale] = useState(null);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAllData();
    }, [selectedMonth, selectedYear, selectedCustomer]);

    useEffect(() => {
        const fetchBcvRates = async () => {
            try {
                const [usdRes, eurRes] = await Promise.all([
                    axios.get('https://ve.dolarapi.com/v1/dolares'),
                    axios.get('https://ve.dolarapi.com/v1/euros')
                ]);
                
                const usdOficial = usdRes.data.find(d => d.fuente === 'oficial')?.promedio || 55.74;
                const eurOficial = eurRes.data.find(d => d.fuente === 'oficial')?.promedio || 58.21;
                
                setBcvRates({ USD: usdOficial, EUR: eurOficial });
            } catch (error) {
                console.error("Error fetching BCV rates from dolarapi.com:", error);
            }
        };
        fetchBcvRates();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const timestamp = new Date().getTime();
            const [statsRes, productsRes, salesRes, customersRes, registeredRes] = await Promise.all([
                axios.get(`http://localhost:8000/reports/stats?_t=${timestamp}`),
                axios.get(`http://localhost:8000/intelligence/products?_t=${timestamp}`),
                axios.get(`http://localhost:8000/reports/sales?month=${selectedMonth}&year=${selectedYear}&customer_name=${selectedCustomer}&_t=${timestamp}`),
                axios.get(`http://localhost:8000/reports/customers?_t=${timestamp}`),
                axios.get(`http://localhost:8000/ingestion/sales?_t=${timestamp}`)
            ]);
            setStats(statsRes.data);
            setProducts(productsRes.data);
            setSalesStats(salesRes.data);
            setCustomers(customersRes.data);
            setRegisteredSales(registeredRes.data || []);
        } catch (error) {
            console.error("Error fetching admin data:", error);
        }
        setLoading(false);
    };

    const handleSaveSale = async () => {
        try {
            await axios.put(`http://localhost:8000/ingestion/sales/${editingSale.id}`, editingSale);
            setEditingSale(null);
            fetchAllData();
            alert("Venta histórica actualizada.");
        } catch (err) {
            alert("Error al editar venta: " + err.message);
        }
    };

    const handleDeleteSale = async (id) => {
        if (!window.confirm('¿Seguro que deseas eliminar esta venta permanentemente?')) return;
        try {
            await axios.delete(`http://localhost:8000/ingestion/sales/${id}`);
            fetchAllData();
        } catch (err) {
            alert("Error eliminando venta: " + err.message);
        }
    };

    const handleCustomAnalyze = async () => {
        if (!customQuery) return;
        setCustomLoading(true);
        try {
            const response = await axios.post('http://localhost:8000/reports/custom', { prompt: customQuery });
            setCustomData(response.data);
        } catch (error) {
            console.error("Error fetching custom dashboard:", error);
            alert("Error al generar el dashboard personalizado.");
        }
        setCustomLoading(false);
    };

    const handleCustomExport = async (format) => {
        if (!customData || !customData.data) return;
        try {
            const response = await axios.post('http://localhost:8000/reports/export-custom', {
                title: customData.title,
                data: customData.data,
                format: format
            }, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `custom_report.${format === 'excel' ? 'xlsx' : 'pdf'}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Error exporting custom data:", error);
            alert("Error al exportar.");
        }
    };

    const handleDownload = (type) => {
        const url = type === 'pdf' ? 'http://localhost:8000/reports/pdf' : 'http://localhost:8000/reports/excel';
        window.open(url, '_blank');
    };

    const handleEdit = (product) => {
        setEditingProduct({ ...product });
    };

    const handleSave = async () => {
        try {
            if (editingProduct.id) {
                await axios.put(`http://localhost:8000/intelligence/products/${editingProduct.id}`, {
                    name: editingProduct.name,
                    description: editingProduct.description,
                    access_level: editingProduct.access_level,
                    price: parseFloat(editingProduct.price) || 0,
                    stock: parseInt(editingProduct.stock) || 0,
                    agent_instruction: editingProduct.agent_instruction || ''
                });
            } else {
                await axios.post(`http://localhost:8000/intelligence/products`, {
                    name: editingProduct.name,
                    description: editingProduct.description,
                    access_level: editingProduct.access_level,
                    price: parseFloat(editingProduct.price) || 0,
                    stock: parseInt(editingProduct.stock) || 0,
                    agent_instruction: editingProduct.agent_instruction || ''
                });
            }
            setEditingProduct(null);
            fetchAllData();
        } catch (error) {
            alert("Error al guardar: " + error.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Seguro que deseas eliminar este producto?')) return;
        try {
            await axios.delete(`http://localhost:8000/intelligence/products/${id}`);
            fetchAllData();
        } catch (error) {
            alert("Error eliminando: " + error.message);
        }
    };

    const handleAddNew = () => {
        setEditingProduct({ name: '', description: '', access_level: 'private', price: 0, stock: 0, agent_instruction: '' });
    };

    const handleRecalculate = async (id) => {
        try {
            await axios.post(`http://localhost:8000/intelligence/products/${id}/recalculate`);
            alert("Vector de IA recalculado con éxito para este producto.");
        } catch (error) {
            alert("Error recalculando vector: " + error.message);
        }
    };

    const getChartColor = (index) => {
        const colors = ['#8B5CF6', '#3B82F6', '#C084FC', '#F59E0B', '#10B981', '#F472B6'];
        return colors[index % colors.length];
    };

    const filteredChartData = (salesStats?.breakdown || []).filter(d => 
        chartFilter === 'Todos' ? true : d.category.toLowerCase() === chartFilter.toLowerCase()
    );

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-[var(--bg-main)] text-[var(--text-main)]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--border-hover-alt)]"></div>
            <span className="ml-3 text-[var(--text-muted)] font-medium">Cargando inteligencia de negocio...</span>
        </div>
    );

    return (
        <div className={`theme-${activeTheme} bg-[var(--bg-main)] text-[var(--text-main)] selection:bg-[var(--selection)] transition-colors duration-500 ${activeTab === 'custom' ? 'h-screen overflow-hidden' : 'min-h-screen pb-20'}`}>

            <style>{`
                .theme-oscuro {
                    --bg-main: #070514;
                    --bg-nav: rgba(13, 10, 32, 0.9);
                    --bg-card: #120e2b;
                    --bg-input: #0d0a20;
                    --bg-item: #1a153a;
                    --bg-item-hover: #231d4d;
                    --border-subtle: rgba(88, 28, 135, 0.3);
                    --border-base: rgba(107, 33, 168, 0.3);
                    --border-strong: rgba(107, 33, 168, 0.5);
                    --border-faint: rgba(107, 33, 168, 0.2);
                    --border-hover: rgba(168, 85, 247, 0.5);
                    --border-hover-alt: rgba(107, 33, 168, 1);
                    --text-main: #ffffff;
                    --text-muted: #c7d2fe;
                    --text-sec: #a5b4fc;
                    --text-accent: #d8b4fe;
                    --text-highlight: #c084fc;
                    --text-bright: #f3e8ff;
                    --grad-start: #ffffff;
                    --grad-end: #e9d5ff;
                    --btn-start: #6366f1;
                    --btn-end: #9333ea;
                    --selection: #9333ea;
                    --focus-ring: #a855f7;
                }
                .theme-claro {
                    --bg-main: #f1f5f9;
                    --bg-nav: rgba(255, 255, 255, 0.9);
                    --bg-card: #ffffff;
                    --bg-input: #f8fafc;
                    --bg-item: #e2e8f0;
                    --bg-item-hover: #cbd5e1;
                    --border-subtle: rgba(203, 213, 225, 0.8);
                    --border-base: rgba(203, 213, 225, 0.9);
                    --border-strong: rgba(148, 163, 184, 0.8);
                    --border-faint: rgba(226, 232, 240, 1);
                    --border-hover: rgba(59, 130, 246, 0.5);
                    --border-hover-alt: rgba(148, 163, 184, 1);
                    --text-main: #0f172a;
                    --text-muted: #64748b;
                    --text-sec: #475569;
                    --text-accent: #2563eb;
                    --text-highlight: #1d4ed8;
                    --text-bright: #1e293b;
                    --grad-start: #1e293b;
                    --grad-end: #475569;
                    --btn-start: #3b82f6;
                    --btn-end: #2563eb;
                    --selection: #bfdbfe;
                    --focus-ring: #60a5fa;
                }
                .theme-nebulosa {
                    --bg-main: #0a0118;
                    --bg-nav: rgba(10, 1, 24, 0.9);
                    --bg-card: #15022e;
                    --bg-input: #0e0121;
                    --bg-item: #1f0445;
                    --bg-item-hover: #2d0663;
                    --border-subtle: rgba(236, 72, 153, 0.2);
                    --border-base: rgba(236, 72, 153, 0.3);
                    --border-strong: rgba(236, 72, 153, 0.5);
                    --border-faint: rgba(236, 72, 153, 0.1);
                    --border-hover: rgba(244, 114, 182, 0.5);
                    --border-hover-alt: rgba(236, 72, 153, 1);
                    --text-main: #ffffff;
                    --text-muted: #fbcfe8;
                    --text-sec: #f9a8d4;
                    --text-accent: #f472b6;
                    --text-highlight: #ec4899;
                    --text-bright: #fdf2f8;
                    --grad-start: #ffffff;
                    --grad-end: #fbcfe8;
                    --btn-start: #db2777;
                    --btn-end: #9d174d;
                    --selection: #db2777;
                    --focus-ring: #f472b6;
                }
                .theme-oceanico {
                    --bg-main: #020617;
                    --bg-nav: rgba(2, 6, 23, 0.9);
                    --bg-card: #0f172a;
                    --bg-input: #020617;
                    --bg-item: #1e293b;
                    --bg-item-hover: #334155;
                    --border-subtle: rgba(14, 165, 233, 0.2);
                    --border-base: rgba(14, 165, 233, 0.3);
                    --border-strong: rgba(14, 165, 233, 0.5);
                    --border-faint: rgba(14, 165, 233, 0.1);
                    --border-hover: rgba(56, 189, 248, 0.5);
                    --border-hover-alt: rgba(14, 165, 233, 1);
                    --text-main: #ffffff;
                    --text-muted: #bae6fd;
                    --text-sec: #7dd3fc;
                    --text-accent: #38bdf8;
                    --text-highlight: #0ea5e9;
                    --text-bright: #f0f9ff;
                    --grad-start: #ffffff;
                    --grad-end: #bae6fd;
                    --btn-start: #0284c7;
                    --btn-end: #0369a1;
                    --selection: #0284c7;
                    --focus-ring: #38bdf8;
                }
                .theme-aurora {
                    --bg-main: #042f2e;
                    --bg-nav: rgba(4, 47, 46, 0.9);
                    --bg-card: #134e4a;
                    --bg-input: #042f2e;
                    --bg-item: #115e59;
                    --bg-item-hover: #0f766e;
                    --border-subtle: rgba(52, 211, 153, 0.2);
                    --border-base: rgba(52, 211, 153, 0.3);
                    --border-strong: rgba(52, 211, 153, 0.5);
                    --border-faint: rgba(52, 211, 153, 0.1);
                    --border-hover: rgba(16, 185, 129, 0.5);
                    --border-hover-alt: rgba(52, 211, 153, 1);
                    --text-main: #ffffff;
                    --text-muted: #a7f3d0;
                    --text-sec: #6ee7b7;
                    --text-accent: #34d399;
                    --text-highlight: #10b981;
                    --text-bright: #ecfdf5;
                    --grad-start: #ffffff;
                    --grad-end: #a7f3d0;
                    --btn-start: #059669;
                    --btn-end: #047857;
                    --selection: #059669;
                    --focus-ring: #34d399;
                }
            `}</style>

            {/* Header / Tabs */}
            <div className="bg-[var(--bg-nav)] border-b border-[var(--border-subtle)] sticky top-0 z-10 shadow-[0_4px_30px_rgba(139,92,246,0.1)] backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center gap-3">
                            <img src="/logo.png" alt="Epsilon Intelligence Logo" className="w-10 h-10 object-contain drop-shadow-[0_0_15px_rgba(168,85,247,0.5)] hover:scale-105 transition-transform" />
                            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[var(--grad-start)] to-[var(--grad-end)] tracking-tight">Epsilon <span className="text-[var(--text-highlight)]">Intelligence</span></h1>
                            
                            {/* Theme Selector */}
                            <div className="relative ml-4">
                                <button 
                                    onClick={() => setShowThemeMenu(!showThemeMenu)}
                                    className="p-2 bg-[var(--bg-card)] border border-[var(--border-strong)] rounded-full text-[var(--text-accent)] hover:text-[var(--text-highlight)] transition-colors shadow-sm cursor-pointer"
                                >
                                    <Brush size={18} />
                                </button>
                                {showThemeMenu && (
                                    <div className="absolute top-12 left-0 w-48 bg-[var(--bg-card)] border border-[var(--border-strong)] shadow-xl rounded-xl z-50 overflow-hidden" onMouseLeave={() => setShowThemeMenu(false)}>
                                        <div className="px-3 py-2 text-xs font-bold text-[var(--text-sec)] bg-[var(--bg-input)] uppercase border-b border-[var(--border-faint)]">
                                            Temas Visuales
                                        </div>
                                        {[
                                            { id: 'oscuro', name: 'Modo Oscuro (Actual)', color: '#8B5CF6' },
                                            { id: 'claro', name: 'Modo Claro', color: '#3B82F6' },
                                            { id: 'nebulosa', name: 'Nebulosa Rosa', color: '#EC4899' },
                                            { id: 'oceanico', name: 'Oceánico Profundo', color: '#0EA5E9' },
                                            { id: 'aurora', name: 'Aurora Esmeralda', color: '#10B981' }
                                        ].map(t => (
                                            <button 
                                                key={t.id}
                                                onClick={() => { setActiveTheme(t.id); setShowThemeMenu(false); }}
                                                className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between hover:bg-[var(--bg-item-hover)] transition-colors border-b border-[var(--border-faint)] last:border-b-0 ${activeTheme === t.id ? 'font-bold text-[var(--text-main)] bg-[var(--bg-input)]' : 'text-[var(--text-sec)]'}`}
                                            >
                                                <span>{t.name}</span>
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }}></div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <nav className="flex space-x-8">
                            {[
                                { id: 'inventory', label: 'Conocimiento (BD)', icon: Package },
                                { id: 'sales', label: 'Ventas', icon: TrendingUp },
                                { id: 'custom', label: 'Agente', icon: Bot },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-all duration-300 ${activeTab === tab.id
                                        ? 'border-[var(--border-hover-alt)] text-[var(--text-highlight)] drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]'
                                        : 'border-transparent text-[var(--text-sec)]/50 hover:text-[var(--text-main)] hover:border-[var(--border-hover-alt)]'
                                        }`}
                                >
                                    <tab.icon size={18} />
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>
            </div>

            <main className={activeTab === 'custom' ? "flex flex-col h-[calc(100vh-5rem)] w-full" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"}>

                {/* SALES TAB */}
                {activeTab === 'sales' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-xl font-bold text-[var(--text-main)] drop-shadow-sm">Resumen General de Ventas</h2>
                            <div className="flex gap-4">
                                <select
                                    value={selectedCustomer}
                                    onChange={(e) => setSelectedCustomer(e.target.value)}
                                    className="bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-base)] rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-transparent outline-none min-w-[150px] shadow-sm cursor-pointer"
                                >
                                    <option value="Todos">Todos los clientes</option>
                                    {customers.map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                    className="bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-base)] rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-transparent outline-none shadow-sm cursor-pointer"
                                >
                                    <option value={0}>Todos los meses</option>
                                    {Array.from({ length: 12 }, (_, i) => (
                                        <option key={i + 1} value={i + 1}>
                                            {new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date(2024, i))}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                    className="bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-base)] rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-transparent outline-none shadow-sm cursor-pointer"
                                >
                                    <option value={2024}>2024</option>
                                    <option value={2025}>2025</option>
                                    <option value={2026}>2026</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <div className="bg-[var(--bg-card)] p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[var(--border-base)] hover:border-[var(--border-hover)] hover:shadow-purple-900/20 transition-all duration-300 relative group">
                                <div className="flex justify-between items-center mb-1">
                                    <div className="text-[var(--text-sec)]/70 text-sm uppercase tracking-wider font-semibold">Ganancias Totales</div>
                                </div>
                                <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[var(--grad-start)] to-[var(--grad-end)] drop-shadow-sm">
                                    {formatCurrency(salesStats?.total_profit)}
                                </div>
                            </div>
                            <div className="bg-[var(--bg-card)] p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[var(--border-base)] hover:border-blue-500/50 hover:shadow-blue-900/20 transition-all duration-300">
                                <div className="text-[var(--text-sec)]/70 text-sm mb-1 uppercase tracking-wider font-semibold">Productos Vendidos</div>
                                <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[var(--grad-start)] to-[var(--grad-end)] drop-shadow-sm">{salesStats?.total_sold}</div>
                            </div>
                            <div className="bg-[var(--bg-card)] p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[var(--border-base)] hover:border-[var(--border-hover)] hover:shadow-purple-900/20 transition-all duration-300 relative group">
                                <div className="flex justify-between items-center mb-1">
                                    <div className="text-[var(--text-sec)]/70 text-sm uppercase tracking-wider font-semibold">Tasa Oficial BCV</div>
                                    <select 
                                        value={revenueCurrency} 
                                        onChange={e=>setRevenueCurrency(e.target.value)}
                                        className="bg-[var(--bg-input)] border border-[var(--border-strong)] rounded p-1 text-[10px] text-[var(--text-sec)] outline-none focus:border-[var(--border-hover-alt)] cursor-pointer"
                                    >
                                        <option value="USD">Dólares (USD)</option>
                                        <option value="VES">Bolívares (VES)</option>
                                        <option value="EUR">Euros (EUR)</option>
                                    </select>
                                </div>
                                <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[var(--grad-start)] to-[var(--grad-end)] drop-shadow-sm">
                                    Bs. {revenueCurrency === 'EUR' ? bcvRates.EUR.toFixed(2) : bcvRates.USD.toFixed(2)}
                                </div>
                            </div>
                            <div className="bg-[var(--bg-card)] p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[var(--border-base)] hover:border-blue-500/50 hover:shadow-blue-900/20 transition-all duration-300">
                                <div className="text-[var(--text-sec)]/70 text-sm mb-1 uppercase tracking-wider font-semibold">Clientes Activos</div>
                                <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[var(--grad-start)] to-[var(--grad-end)] drop-shadow-sm">{salesStats?.total_clients || 0}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-[var(--bg-card)] p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[var(--border-base)] flex flex-col">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold text-[var(--text-main)] tracking-wide drop-shadow-sm">Gráfico de Ganancias</h3>
                                    <select 
                                        value={chartFilter} 
                                        onChange={e=>setChartFilter(e.target.value)}
                                        className="bg-[var(--bg-input)] border border-[var(--border-strong)] rounded-lg p-1.5 text-xs text-[var(--text-sec)] outline-none focus:border-[var(--border-hover-alt)]"
                                    >
                                        <option value="Todos">Todas las Categorías</option>
                                        <option value="Hardware">Hardware</option>
                                        <option value="Software">Software</option>
                                        <option value="Servicios">Servicios</option>
                                    </select>
                                </div>
                                <div className="h-80 flex-1 flex items-center">
                                    <div className="w-1/2 h-full relative">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={filteredChartData}
                                                    dataKey="total"
                                                    nameKey="category"
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={50}
                                                    outerRadius={90}
                                                    stroke="none"
                                                    paddingAngle={5}
                                                >
                                                    {filteredChartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={getChartColor(index)} />
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={{ backgroundColor: '#070514', borderColor: '#4C1D95', borderRadius: '12px', color: '#fff' }} itemStyle={{ color: '#fff' }} formatter={(val) => formatCurrency(val)} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="w-1/2 h-full flex flex-col justify-center space-y-6 pl-6 overflow-y-auto custom-scrollbar">
                                        {filteredChartData.map((entry, index) => (
                                            <div key={`legend-${index}`} className="flex flex-col border-b border-[var(--border-faint)] pb-3 hover:bg-purple-900/10 p-2 rounded-lg transition-colors">
                                                <div className="flex justify-between items-center w-full mb-1">
                                                    <span className="font-bold text-[var(--text-main)] text-sm tracking-wide">{entry.category.toUpperCase()}</span>
                                                    <div className="w-4 h-4 rounded shadow-sm shadow-[#120e2b]" style={{ backgroundColor: getChartColor(index) }}></div>
                                                </div>
                                                <span className="text-[var(--text-accent)] text-sm font-black tracking-wider">({formatCurrency(entry.total)})</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="bg-[var(--bg-card)] p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[var(--border-base)] overflow-hidden flex flex-col">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold text-[var(--text-main)] tracking-wide drop-shadow-sm">Desempeño por Vendedor</h3>
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-highlight)]/50" size={14} />
                                        <input 
                                            type="text" 
                                            placeholder="Filtrar vendedor..." 
                                            value={sellerFilter}
                                            onChange={e=>setSellerFilter(e.target.value)}
                                            className="bg-[var(--bg-input)] border border-[var(--border-strong)] rounded-lg pl-8 p-1.5 text-xs text-[var(--text-main)] focus:border-[var(--border-hover-alt)] outline-none w-40"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar flex-1">
                                    {(salesStats?.seller_stats || []).filter(s => s.name.toLowerCase().includes(sellerFilter.toLowerCase())).map((seller) => (
                                        <div key={seller.name} className="p-4 bg-[var(--bg-input)] rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border-hover)] transition-colors">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="font-bold text-[var(--text-bright)]">{seller.name}</span>
                                                <span className="text-[var(--text-highlight)] font-black">{formatCurrency(seller.total)}</span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 text-xs">
                                                <div className="flex justify-between p-2 bg-[var(--bg-item)] rounded-lg border border-[var(--border-faint)]">
                                                    <span className="text-[var(--text-sec)]">Software</span>
                                                    <span className="font-bold text-blue-400">{formatCurrency(seller.software)}</span>
                                                </div>
                                                <div className="flex justify-between p-2 bg-[var(--bg-item)] rounded-lg border border-[var(--border-faint)]">
                                                    <span className="text-[var(--text-sec)]">Hardware</span>
                                                    <span className="font-bold text-blue-400">{formatCurrency(seller.hardware)}</span>
                                                </div>
                                                <div className="flex justify-between p-2 bg-[var(--bg-item)] rounded-lg border border-[var(--border-faint)]">
                                                    <span className="text-[var(--text-sec)]">Servicios</span>
                                                    <span className="font-bold text-blue-400">{formatCurrency(seller.servicios || 0)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {(salesStats?.seller_stats || []).filter(s => s.name.toLowerCase().includes(sellerFilter.toLowerCase())).length === 0 && (
                                        <div className="text-center py-10 text-[var(--text-accent)]/50 italic">No se encontraron vendedores</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* INVENTORY TAB */}
                {activeTab === 'inventory' && (
                    <div className="animate-in fade-in duration-300">
                        {/* Sub-navigacion */}
                        <div className="flex justify-center mb-8">
                            <div className="bg-[var(--bg-card)] p-1 rounded-xl border border-[var(--border-subtle)] inline-flex shadow-sm">
                                <button 
                                    onClick={() => setInventoryView('knowledge')}
                                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${inventoryView === 'knowledge' ? 'bg-purple-600/20 text-[var(--text-accent)] border border-[var(--border-hover-alt)]/30' : 'text-[var(--text-sec)]/50 hover:text-[var(--text-main)]'}`}
                                >
                                    Gestión de Reglas (RAG)
                                </button>
                                <button 
                                    onClick={() => setInventoryView('ingest')}
                                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${inventoryView === 'ingest' ? 'bg-purple-600/20 text-[var(--text-accent)] border border-[var(--border-hover-alt)]/30' : 'text-[var(--text-sec)]/50 hover:text-[var(--text-main)]'}`}
                                >
                                    Centro de Ingesta (Ventas)
                                </button>
                            </div>
                        </div>

                        {inventoryView === 'knowledge' && (
                            <div className="animate-in slide-in-from-left-4 duration-300">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-[var(--text-main)] drop-shadow-sm">Base de Conocimiento</h2>
                                    <div className="flex gap-4">
                                        <button onClick={handleAddNew} className="bg-[var(--bg-item)] text-[var(--text-accent)] px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[var(--bg-item-hover)] border border-[var(--border-strong)] hover:border-[var(--border-hover)] transition font-bold shadow-sm">
                                            <Plus size={18} /> Añadir Regla Manual
                                        </button>
                                        <button onClick={() => handleDownload('pdf')} className="bg-[var(--bg-card)] border border-red-900/50 text-red-400 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-900/20 transition">
                                            <FileText size={18} /> PDF
                                        </button>
                                        <button onClick={() => handleDownload('excel')} className="bg-[var(--bg-card)] border border-green-900/50 text-green-400 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-900/20 transition">
                                            <Download size={18} /> Excel
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-[var(--bg-card)] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[var(--border-base)] overflow-hidden">
                                    <table className="min-w-full divide-y divide-purple-900/30">
                                        <thead className="bg-[var(--bg-input)]">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-[var(--text-accent)] uppercase tracking-wider">Concepto Sincronizado</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-[var(--text-accent)] uppercase tracking-wider">Visibilidad</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-[var(--text-accent)] uppercase tracking-wider">Instrucción IA (Oculta)</th>
                                                <th className="px-6 py-4 text-right text-xs font-bold text-[var(--text-accent)] uppercase tracking-wider">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-[var(--bg-card)] divide-y divide-purple-900/20">
                                            {products.map((product) => (
                                                <tr key={product.id} className="hover:bg-[var(--bg-item)] transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-[var(--text-main)]">{product.name}</div>
                                                        <div className="text-xs text-[var(--text-muted)]/70 truncate max-w-xs">{product.description}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${product.access_level === 'public' ? 'bg-green-900/30 text-green-400 border-green-800/50' : 'bg-red-900/30 text-red-400 border-red-800/50'
                                                            }`}>
                                                            {product.access_level.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm font-medium text-[var(--text-accent)] max-w-[200px] truncate">{product.agent_instruction || <span className="text-[var(--text-sec)]/50 italic">Sin instrucción especial...</span>}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                                        <button onClick={() => handleRecalculate(product.id)} className="text-amber-500 hover:bg-amber-900/30 p-2 rounded-full transition" title="Recalcular Vector IA">
                                                            <RefreshCw size={18} />
                                                        </button>
                                                        <button onClick={() => handleEdit(product)} className="text-[var(--text-highlight)] hover:bg-purple-900/30 p-2 rounded-full transition" title="Editar Contexto">
                                                            <Edit size={18} />
                                                        </button>
                                                        <button onClick={() => handleDelete(product.id)} className="text-red-400 hover:bg-red-900/30 p-2 rounded-full transition" title="Eliminar Conocimiento">
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {inventoryView === 'ingest' && (
                            <div className="animate-in slide-in-from-right-4 duration-300 grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* PANEL 1: CARGA MASIVA (EXCEL/CSV) */}
                                <div className="bg-[var(--bg-card)] p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[var(--border-base)] flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 bg-gradient-to-br from-[var(--btn-start)] to-[var(--btn-end)] rounded-full flex items-center justify-center mb-6 shadow-lg shadow-purple-900/50">
                                        <Download className="text-[var(--text-main)]" size={32} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-[var(--text-main)] mb-2">Importación Masiva</h3>
                                    <p className="text-[var(--text-muted)]/70 mb-8 max-w-sm">
                                        Sube un archivo Excel (.xlsx) o CSV con tu historial de ventas. La IA vectorizará automáticamente cada registro.
                                    </p>
                                    
                                    <label className="w-full flex-col cursor-pointer">
                                        <div className="w-full relative group">
                                            <div className="absolute inset-0 bg-gradient-to-r from-[var(--btn-start)] to-[var(--btn-end)] rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
                                            <div className="relative border-2 border-dashed border-[var(--border-hover-alt)]/50 rounded-xl p-8 hover:bg-purple-900/10 transition-colors w-full flex flex-col items-center justify-center bg-[var(--bg-input)]">
                                                <FileText className="text-[var(--text-highlight)] mb-3" size={32} />
                                                <span className="text-[var(--text-accent)] font-bold mb-1 block">Seleccionar Archivo</span>
                                                <span className="text-xs text-indigo-400/60 block">Soporta .xlsx y .csv</span>
                                                <input 
                                                    type="file" 
                                                    accept=".xlsx,.csv" 
                                                    className="hidden" 
                                                    onChange={async (e) => {
                                                        const file = e.target.files[0];
                                                        if (!file) return;
                                                        setIsUploading(true);
                                                        const formData = new FormData();
                                                        formData.append('file', file);
                                                        try {
                                                            const res = await axios.post('http://localhost:8000/ingestion/upload-sales', formData, {
                                                                headers: { 'Content-Type': 'multipart/form-data' }
                                                            });
                                                            alert(res.data.message);
                                                            fetchAllData();
                                                        } catch(err) {
                                                            alert('Error al subir el archivo: ' + err.message);
                                                        }
                                                        setIsUploading(false);
                                                        e.target.value = '';
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </label>
                                </div>

                                {/* PANEL 2: VENTA MANUAL */}
                                <div className="bg-[var(--bg-card)] p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[var(--border-base)]">
                                    <h3 className="text-xl font-bold text-[var(--text-main)] mb-6 border-b border-[var(--border-base)] pb-4 flex items-center gap-3">
                                        <Edit className="text-[var(--text-highlight)]" /> Registro de Venta Manual
                                    </h3>
                                    
                                    <form onSubmit={async (e) => {
                                        e.preventDefault();
                                        setIsUploading(true);
                                        try {
                                            const res = await axios.post('http://localhost:8000/ingestion/manual-sale', manualSale);
                                            alert(res.data.message);
                                            fetchAllData();
                                            // Reset
                                            setManualSale({
                                                customer_name: '', product_name: '', quantity: 1, 
                                                sale_date: new Date().toISOString().split('T')[0], price: 0, 
                                                price_total: 0, payment_method: 'Card', seller_name: '', category: 'Hardware'
                                            });
                                        } catch(err) {
                                            alert("Error registrando: " + err.message);
                                        }
                                        setIsUploading(false);
                                    }} className="grid grid-cols-2 gap-4">
                                        
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-xs font-bold text-[var(--text-sec)] uppercase mb-1">Nombre (Empresa/Persona)</label>
                                            <input required type="text" value={manualSale.customer_name} onChange={e=>setManualSale({...manualSale, customer_name: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-lg p-2.5 focus:border-[var(--border-hover-alt)] outline-none transition" />
                                        </div>
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-xs font-bold text-[var(--text-sec)] uppercase mb-1">Producto o Servicio</label>
                                            <input required type="text" value={manualSale.product_name} onChange={e=>setManualSale({...manualSale, product_name: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-lg p-2.5 focus:border-[var(--border-hover-alt)] outline-none transition" />
                                        </div>

                                        <div className="col-span-1">
                                            <label className="block text-xs font-bold text-[var(--text-sec)] uppercase mb-1">Unidades</label>
                                            <input required type="number" min="1" value={manualSale.quantity} onChange={e=>{
                                                const q = parseInt(e.target.value) || 1;
                                                setManualSale({...manualSale, quantity: q, price_total: manualSale.price * q});
                                            }} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-lg p-2.5 focus:border-[var(--border-hover-alt)] outline-none transition" />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="block text-xs font-bold text-[var(--text-sec)] uppercase mb-1">Fecha de Venta</label>
                                            <input required type="date" value={manualSale.sale_date} onChange={e=>setManualSale({...manualSale, sale_date: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-lg p-2.5 focus:border-[var(--border-hover-alt)] outline-none transition [color-scheme:dark]" />
                                        </div>

                                        <div className="col-span-1">
                                            <label className="block text-xs font-bold text-[var(--text-sec)] uppercase mb-1">Costo Unidad ($)</label>
                                            <input required type="number" step="0.01" value={manualSale.price} onChange={e=>{
                                                const p = parseFloat(e.target.value);
                                                setManualSale({...manualSale, price: p, price_total: p * manualSale.quantity});
                                            }} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-lg p-2.5 focus:border-[var(--border-hover-alt)] outline-none transition" />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="block text-xs font-bold text-[var(--text-sec)] uppercase mb-1">Costo Total ($)</label>
                                            <input required type="number" step="0.01" value={manualSale.price_total} onChange={e=>setManualSale({...manualSale, price_total: parseFloat(e.target.value)})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-lg p-2.5 focus:border-[var(--border-hover-alt)] outline-none transition font-bold text-[var(--text-accent)]" />
                                        </div>

                                        <div className="col-span-1">
                                            <label className="block text-xs font-bold text-[var(--text-sec)] uppercase mb-1">Método de Pago</label>
                                            <select value={manualSale.payment_method} onChange={e=>setManualSale({...manualSale, payment_method: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-lg p-2.5 focus:border-[var(--border-hover-alt)] outline-none transition">
                                                <option value="Card">Tarjeta (Deb/Cred)</option>
                                                <option value="Transfer">Transferencia</option>
                                                <option value="Cash">Efectivo</option>
                                                <option value="Crypto">Criptomoneda</option>
                                            </select>
                                        </div>
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-xs font-bold text-[var(--text-sec)] uppercase mb-1">Categoría</label>
                                            <select value={manualSale.category} onChange={e=>setManualSale({...manualSale, category: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-lg p-2.5 focus:border-[var(--border-hover-alt)] outline-none transition">
                                                <option value="Hardware">Hardware</option>
                                                <option value="Software">Software</option>
                                                <option value="Servicios">Servicios</option>
                                            </select>
                                        </div>
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-xs font-bold text-[var(--text-sec)] uppercase mb-1">Empleado</label>
                                            <input required type="text" value={manualSale.seller_name} onChange={e=>setManualSale({...manualSale, seller_name: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-lg p-2.5 focus:border-[var(--border-hover-alt)] outline-none transition" />
                                        </div>

                                        <div className="col-span-2 mt-4">
                                            <button type="submit" disabled={isUploading} className="w-full bg-gradient-to-r from-[var(--btn-start)] to-[var(--btn-end)] text-[var(--text-main)] py-3 rounded-lg font-bold hover:from-purple-500 hover:to-blue-500 shadow-lg shadow-purple-900/50 flex items-center justify-center gap-2 border border-[var(--border-hover-alt)]/50 transition relative overflow-hidden group">
                                                <Save size={18} className="relative z-10" /> <span className="relative z-10">Registrar Venta e IA</span>
                                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                            </button>
                                        </div>
                                    </form>
                                </div>
                                
                                {/* HISTORICO COLAPAN-2 */}
                                <div className="col-span-1 lg:col-span-2 mt-4">
                                    <details className="bg-[var(--bg-card)] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[var(--border-base)] group">
                                        <summary className="cursor-pointer p-6 list-none flex items-center justify-between">
                                            <h3 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-3">
                                                <Calendar className="text-[var(--text-highlight)]" /> Histórico de Datos Registrados
                                            </h3>
                                            <div className="flex items-center gap-4">
                                                <div className="relative group-open:opacity-100 opacity-0 transition-opacity" onClick={e=>e.preventDefault()}>
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-highlight)]/50" size={16} />
                                                    <input 
                                                        type="text" 
                                                        placeholder="Buscar cliente/producto..." 
                                                        className="bg-[var(--bg-input)] border border-[var(--border-strong)] rounded-lg pl-9 p-2 text-sm text-[var(--text-main)] focus:border-[var(--border-hover-alt)] outline-none w-64"
                                                        value={salesSearch}
                                                        onChange={(e)=>setSalesSearch(e.target.value)}
                                                    />
                                                </div>
                                                <ChevronDown className="text-[var(--text-sec)] group-open:rotate-180 transition-transform" />
                                            </div>
                                        </summary>
                                        
                                        <div className="p-6 pt-0 border-t border-[var(--border-faint)]">
                                            <div className="overflow-x-auto max-h-[40vh] custom-scrollbar">
                                                <table className="min-w-full divide-y divide-purple-900/30 table-fixed">
                                                    <thead className="bg-[var(--bg-input)] sticky top-0">
                                                        <tr>
                                                            <th className="px-4 py-3 text-left text-xs font-bold text-[var(--text-accent)] uppercase">Fecha</th>
                                                            <th className="px-4 py-3 text-left text-xs font-bold text-[var(--text-accent)] uppercase">Cliente</th>
                                                            <th className="px-4 py-3 text-left text-xs font-bold text-[var(--text-accent)] uppercase">Producto</th>
                                                            <th className="px-4 py-3 text-right text-xs font-bold text-[var(--text-accent)] uppercase">Total</th>
                                                            <th className="px-4 py-3 text-right text-xs font-bold text-[var(--text-accent)] uppercase">Acción</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-purple-900/20">
                                                        {registeredSales
                                                            .filter(s => 
                                                                (s.customer_name||'').toLowerCase().includes(salesSearch.toLowerCase()) || 
                                                                (s.product_name||'').toLowerCase().includes(salesSearch.toLowerCase())
                                                            )
                                                            .map(s => (
                                                            <tr key={s.id} className="hover:bg-[var(--bg-item)] transition-colors">
                                                                <td className="px-4 py-3 text-sm text-[var(--text-muted)]">{s.sale_date}</td>
                                                                <td className="px-4 py-3 text-sm font-bold text-[var(--text-main)] truncate">{s.customer_name}</td>
                                                                <td className="px-4 py-3 text-sm text-[var(--text-muted)] truncate">{s.product_name} <span className="text-xs text-purple-500 ml-1">x{s.quantity}</span></td>
                                                                <td className="px-4 py-3 text-sm text-green-400 font-bold text-right">${s.price_total}</td>
                                                                <td className="px-4 py-3 text-right flex justify-end gap-2">
                                                                    <button onClick={() => setEditingSale(s)} className="text-[var(--text-highlight)] hover:bg-purple-900/30 p-2 rounded-full"><Edit size={16} /></button>
                                                                    <button onClick={() => handleDeleteSale(s.id)} className="text-red-400 hover:bg-red-900/30 p-2 rounded-full"><Trash2 size={16} /></button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {registeredSales.length===0 && <tr><td colSpan="5" className="px-4 py-8 text-center text-[var(--text-sec)]/50">No hay ventas registradas</td></tr>}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </details>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* CUSTOM TAB (IA DRIVEN) */}
                {activeTab === 'custom' && (
                    <div className="animate-in zoom-in-95 duration-300 flex-1 flex flex-col min-h-0">
                        <ChatWindow userRole="admin" />
                    </div>
                )}
            </main>

            {/* Sale Edit Modal */}
            {editingSale && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[var(--bg-card)] rounded-2xl p-8 max-w-2xl w-full shadow-[0_10px_40px_rgba(139,92,246,0.2)] border border-[var(--border-strong)]">
                        <h2 className="text-2xl font-black text-[var(--text-main)] mb-6 drop-shadow-sm flex items-center gap-2"><Edit size={24} className="text-[var(--text-highlight)]" /> Editar Registro Histórico</h2>
                        
                        <div className="grid grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-xs font-bold text-[var(--text-sec)] uppercase mb-1">Cliente</label>
                                <input type="text" value={editingSale.customer_name} onChange={e=>setEditingSale({...editingSale, customer_name: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-lg p-2.5 focus:border-[var(--border-hover-alt)] outline-none transition" />
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-xs font-bold text-[var(--text-sec)] uppercase mb-1">Producto</label>
                                <input type="text" value={editingSale.product_name} onChange={e=>setEditingSale({...editingSale, product_name: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-lg p-2.5 focus:border-[var(--border-hover-alt)] outline-none transition" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[var(--text-sec)] uppercase mb-1">Cantidad</label>
                                <input type="number" min="1" value={editingSale.quantity} onChange={e=>{
                                    const q = parseInt(e.target.value) || 1;
                                    setEditingSale({...editingSale, quantity: q, price_total: editingSale.price * q});
                                }} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-lg p-2.5 focus:border-[var(--border-hover-alt)] outline-none transition" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[var(--text-sec)] uppercase mb-1">Fecha</label>
                                <input type="date" value={editingSale.sale_date} onChange={e=>setEditingSale({...editingSale, sale_date: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-lg p-2.5 focus:border-[var(--border-hover-alt)] outline-none transition [color-scheme:dark]" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[var(--text-sec)] uppercase mb-1">Costo Total ($)</label>
                                <input type="number" step="0.01" value={editingSale.price_total} onChange={e=>setEditingSale({...editingSale, price_total: parseFloat(e.target.value)})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-lg p-2.5 focus:border-[var(--border-hover-alt)] outline-none font-bold text-[var(--text-accent)] transition" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[var(--text-sec)] uppercase mb-1">Método de Pago</label>
                                <select value={editingSale.payment_method} onChange={e=>setEditingSale({...editingSale, payment_method: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-lg p-2.5 focus:border-[var(--border-hover-alt)] outline-none transition">
                                    <option value="Card">Tarjeta (Deb/Cred)</option><option value="Transfer">Transferencia</option><option value="Cash">Efectivo</option><option value="Crypto">Criptomoneda</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[var(--text-sec)] uppercase mb-1">Categoría</label>
                                <select value={editingSale.category} onChange={e=>setEditingSale({...editingSale, category: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-lg p-2.5 focus:border-[var(--border-hover-alt)] outline-none transition">
                                    <option value="Hardware">Hardware</option><option value="Software">Software</option><option value="Servicios">Servicios</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[var(--text-sec)] uppercase mb-1">Empleado</label>
                                <input type="text" value={editingSale.seller_name} onChange={e=>setEditingSale({...editingSale, seller_name: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-lg p-2.5 focus:border-[var(--border-hover-alt)] outline-none transition" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-[var(--border-base)]">
                            <button onClick={() => setEditingSale(null)} className="px-5 py-2 rounded-xl text-[var(--text-sec)] hover:text-[var(--text-main)] hover:bg-purple-900/30 transition">Cancelar</button>
                            <button onClick={handleSaveSale} className="bg-gradient-to-r from-[var(--btn-start)] to-[var(--btn-end)] px-6 py-2 rounded-xl font-bold text-[var(--text-main)] hover:from-purple-500 hover:to-blue-500 transition shadow-lg shadow-purple-900/40">Guardar Cambios</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal (Existing logic) */}
            {editingProduct && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[var(--bg-card)] rounded-2xl p-8 max-w-md w-full shadow-[0_10px_40px_rgba(139,92,246,0.2)] border border-[var(--border-strong)]">
                        <h2 className="text-2xl font-black text-[var(--text-main)] mb-6 drop-shadow-sm">{editingProduct.id ? 'Afinar Contexto del Asistente' : 'Añadir Regla Manual'}</h2>

                        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                            <div>
                                <label className="block text-sm font-bold text-[var(--text-muted)]/80 mb-2 uppercase tracking-wide">Concepto (Ej. Producto)</label>
                                <input
                                    type="text"
                                    value={editingProduct.name}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                                    className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-xl p-3 focus:ring-2 focus:ring-[var(--focus-ring)] outline-none hover:border-purple-600/50 transition placeholder-purple-900/50"
                                    placeholder="Nombre del producto o regla"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-[var(--text-muted)]/80 mb-2 uppercase tracking-wide">Descripción</label>
                                <textarea
                                    value={editingProduct.description || ''}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                                    className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-xl p-3 focus:ring-2 focus:ring-[var(--focus-ring)] outline-none hover:border-purple-600/50 transition placeholder-purple-900/50"
                                    rows="2"
                                    placeholder="Descripción general"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-[var(--text-muted)]/80 mb-2 uppercase tracking-wide">Precio ($)</label>
                                    <input
                                        type="number"
                                        value={editingProduct.price || 0}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })}
                                        className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-xl p-3 focus:ring-2 focus:ring-[var(--focus-ring)] outline-none hover:border-purple-600/50 transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[var(--text-muted)]/80 mb-2 uppercase tracking-wide">Stock Relevante</label>
                                    <input
                                        type="number"
                                        value={editingProduct.stock || 0}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) })}
                                        className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-xl p-3 focus:ring-2 focus:ring-[var(--focus-ring)] outline-none hover:border-purple-600/50 transition"
                                    />
                                </div>
                            </div>
                            
                            <div className="bg-purple-900/20 p-4 rounded-xl border border-[var(--border-hover-alt)]/30">
                                <label className="block text-sm font-bold text-[var(--text-accent)] mb-2 uppercase tracking-wide flex items-center gap-2">
                                    <Bot size={16} /> Instrucción Oculta para el Agente (RAG)
                                </label>
                                <p className="text-xs text-purple-200/70 mb-2">Dicta cómo debe responder la IA cuando se mencione este concepto.</p>
                                <textarea
                                    value={editingProduct.agent_instruction || ''}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, agent_instruction: e.target.value })}
                                    className="w-full bg-[#0a0818] border border-[var(--border-base)] text-[var(--text-main)] rounded-xl p-3 focus:ring-2 focus:ring-[var(--focus-ring)] outline-none hover:border-purple-600/50 transition text-sm placeholder-purple-900/50"
                                    rows="3"
                                    placeholder="Ej. 'Si el usuario pregunta por Alpha System, infórmale del 20% de descuento y prioriza soporte VIP.'"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-[var(--text-muted)]/80 mb-2 uppercase tracking-wide">Nivel de Visibilidad</label>
                                <select
                                    value={editingProduct.access_level}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, access_level: e.target.value })}
                                    className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-xl p-3 focus:ring-2 focus:ring-[var(--focus-ring)] outline-none hover:border-purple-600/50 transition cursor-pointer"
                                >
                                    <option value="public">🌐 Público (Visible para clientes)</option>
                                    <option value="private">🔒 Privado (Solo uso interno)</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-10 flex justify-end gap-4">
                            <button onClick={() => setEditingProduct(null)} className="px-6 py-3 font-bold text-[var(--text-sec)]/60 hover:text-indigo-100 transition-colors">Cancelar</button>
                            <button onClick={handleSave} className="bg-gradient-to-r from-[var(--btn-start)] to-[var(--btn-end)] text-[var(--text-main)] px-8 py-3 rounded-xl font-bold hover:from-purple-500 hover:to-blue-500 shadow-lg shadow-purple-900/50 flex items-center gap-2 border border-[var(--border-hover-alt)]/50 transition-all cursor-pointer">
                                <Save size={18} /> {editingProduct.id ? 'Guardar Cambios' : 'Crear Producto'}
                            </button>
                        </div>
                    </div>
        </div>
            )}
            
            {/* Global Uploading Full Screen Blocking Overlay */}
            {isUploading && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-4 z-[100]">
                    <div className="relative">
                        <img src="/logo.png" alt="Loading" className="w-24 h-24 object-contain animate-bounce drop-shadow-[0_0_30px_rgba(168,85,247,0.8)]" />
                        <div className="absolute inset-0 border-4 border-transparent border-t-purple-500 border-b-blue-500 rounded-full animate-spin -m-4"></div>
                    </div>
                    <div className="mt-8 text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 animate-pulse">
                        Vectorizando Conocimiento en la IA...
                    </div>
                    <p className="text-[var(--text-sec)]/60 mt-2 font-medium">Por favor no cierres esta ventana.</p>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
