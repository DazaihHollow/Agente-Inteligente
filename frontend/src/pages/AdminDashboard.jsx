import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, FileText, Edit, Save, X, Search, ChevronDown, Calendar, MessageSquare, Package, Brush, TrendingUp, Sparkles, Bot, Trash2, Plus, RefreshCw, Users, Briefcase, LogOut } from 'lucide-react';
import { ChatWindow } from '../widgets/chat/ui/ChatWindow';
import { useAuth } from '../shared/authContext';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    // Tab State
    const [activeTab, setActiveTab] = useState('sales'); // default to sales as requested

    // Inventory State
    const [inventoryView, setInventoryView] = useState('menu'); // 'menu' | 'knowledge' | 'ingest' | 'products' | 'staff' | 'clients'
    const [stats, setStats] = useState(null);
    const [products, setProducts] = useState([]);
    const [editingProduct, setEditingProduct] = useState(null); // Used for RAG Rules
    const [editingInventoryProduct, setEditingInventoryProduct] = useState(null); // Used for Catalog
    const [staffList, setStaffList] = useState([]);
    const [editingStaff, setEditingStaff] = useState(null);
    const [clientsList, setClientsList] = useState([]);
    const [editingClient, setEditingClient] = useState(null);

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

    const calcTotal = (saleObj) => {
        let subtotal = (parseFloat(saleObj.price) || 0) * (parseInt(saleObj.quantity) || 1);
        let afterDisc = Math.max(0, subtotal - (parseFloat(saleObj.discount_amount) || 0));
        let ivaMultiplier = 1 + ((parseFloat(saleObj.iva_percent) || 0) / 100);
        let total = afterDisc * ivaMultiplier;
        return parseFloat(total.toFixed(2));
    };

    // Ingestion UI State
    const [isUploading, setIsUploading] = useState(false);
    const [manualSale, setManualSale] = useState({
        customer_name: '', product_name: '', quantity: 1, 
        sale_date: new Date().toISOString().split('T')[0], price: 0, 
        price_total: 0, payment_method: 'Card', seller_name: '', category: 'Hardware',
        iva_percent: 16, discount_amount: 0
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
            const [statsRes, productsRes, salesRes, customersRes, registeredRes, staffRes, clientsRes] = await Promise.all([
                axios.get(`http://localhost:8000/reports/stats?_t=${timestamp}`),
                axios.get(`http://localhost:8000/intelligence/products?_t=${timestamp}`),
                axios.get(`http://localhost:8000/reports/sales?month=${selectedMonth}&year=${selectedYear}&customer_name=${selectedCustomer}&_t=${timestamp}`),
                axios.get(`http://localhost:8000/reports/customers?_t=${timestamp}`),
                axios.get(`http://localhost:8000/ingestion/sales?_t=${timestamp}`),
                axios.get(`http://localhost:8000/intelligence/staff?_t=${timestamp}`),
                axios.get(`http://localhost:8000/intelligence/clients?_t=${timestamp}`)
            ]);
            setStats(statsRes.data);
            setProducts(productsRes.data);
            setSalesStats(salesRes.data);
            setCustomers(customersRes.data);
            setRegisteredSales(registeredRes.data || []);
            setStaffList(staffRes.data || []);
            setClientsList(clientsRes.data || []);
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
                    category: editingProduct.category || 'Hardware',
                    agent_instruction: editingProduct.agent_instruction || ''
                });
            } else {
                await axios.post(`http://localhost:8000/intelligence/products`, {
                    name: editingProduct.name,
                    description: editingProduct.description,
                    access_level: editingProduct.access_level,
                    price: parseFloat(editingProduct.price) || 0,
                    stock: parseInt(editingProduct.stock) || 0,
                    category: editingProduct.category || 'Hardware',
                    agent_instruction: editingProduct.agent_instruction || ''
                });
            }
            setEditingProduct(null);
            fetchAllData();
        } catch (error) {
            alert("Error al guardar: " + error.message);
        }
    };

    const handleSaveInventory = async () => {
        try {
            if (editingInventoryProduct.id) {
                await axios.put(`http://localhost:8000/intelligence/products/${editingInventoryProduct.id}`, {
                    name: editingInventoryProduct.name,
                    description: editingInventoryProduct.description,
                    access_level: editingInventoryProduct.access_level,
                    price: parseFloat(editingInventoryProduct.price) || 0,
                    stock: parseInt(editingInventoryProduct.stock) || 0,
                    category: editingInventoryProduct.category || 'Hardware',
                    agent_instruction: editingInventoryProduct.agent_instruction || ''
                });
            } else {
                await axios.post(`http://localhost:8000/intelligence/products`, {
                    name: editingInventoryProduct.name,
                    description: editingInventoryProduct.description,
                    access_level: editingInventoryProduct.access_level,
                    price: parseFloat(editingInventoryProduct.price) || 0,
                    stock: parseInt(editingInventoryProduct.stock) || 0,
                    category: editingInventoryProduct.category || 'Hardware',
                    agent_instruction: editingInventoryProduct.agent_instruction || ''
                });
            }
            setEditingInventoryProduct(null);
            fetchAllData();
        } catch (error) {
            alert("Error al guardar producto: " + error.message);
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

    const handleSaveStaff = async () => {
        try {
            if (editingStaff.id) {
                await axios.put(`http://localhost:8000/intelligence/staff/${editingStaff.id}`, editingStaff);
            } else {
                await axios.post(`http://localhost:8000/intelligence/staff`, editingStaff);
            }
            setEditingStaff(null);
            fetchAllData();
        } catch (error) {
            alert("Error al guardar empleado: " + error.message);
        }
    };

    const handleDeleteStaff = async (id) => {
        if (!window.confirm('¿Seguro que deseas eliminar el registro de este empleado?')) return;
        try {
            await axios.delete(`http://localhost:8000/intelligence/staff/${id}`);
            fetchAllData();
        } catch (error) {
            alert("Error al eliminar empleado: " + error.message);
        }
    };

    const handleAddNew = () => {
        setEditingProduct({ name: '', description: '', access_level: 'private', price: 0, stock: 0, category: 'Hardware', agent_instruction: '' });
    };

    const handleAddNewInventory = () => {
        setEditingInventoryProduct({ name: '', description: '', access_level: 'public', price: 0, stock: 0, category: 'Hardware', agent_instruction: '' });
    };

    const handleAddNewStaff = () => {
        setEditingStaff({ name: '', role: 'Ejecutivo de Ventas', email: '', department: 'Ventas', status: 'Activo', monthly_goal: 0 });
    };

    const handleSaveClient = async () => {
        try {
            if (editingClient.id) {
                await axios.put(`http://localhost:8000/intelligence/clients/${editingClient.id}`, editingClient);
            } else {
                await axios.post(`http://localhost:8000/intelligence/clients`, editingClient);
            }
            setEditingClient(null);
            fetchAllData();
        } catch (error) {
            alert("Error al guardar cliente: " + error.message);
        }
    };

    const handleDeleteClient = async (id) => {
        if (!window.confirm('¿Seguro que deseas eliminar este cliente del directorio?')) return;
        try {
            await axios.delete(`http://localhost:8000/intelligence/clients/${id}`);
            fetchAllData();
        } catch (error) {
            alert("Error al eliminar cliente: " + error.message);
        }
    };

    const handleAddNewClient = () => {
        setEditingClient({ name: '', contact_email: '', phone: '', customer_type: 'Corporativo (B2B)', industry: 'Tecnología', status: 'Prospecto', acquisition_channel: 'Sitio Web' });
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
                            
                            <div className="ml-4 border-l border-[var(--border-strong)] pl-4 flex items-center gap-3 hidden sm:flex">
                                <div className="text-right flex flex-col justify-center">
                                    <span className="text-xs font-bold text-[var(--text-main)] block leading-tight">{user?.email || 'Usuario'}</span>
                                    <span className="text-[9px] uppercase font-black text-[var(--text-highlight)] tracking-wider">Rol: {user?.role || 'Admin'}</span>
                                </div>
                            </div>
                        </div>

                        <nav className="flex items-center space-x-6">
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
                            
                            <div className="border-l border-[var(--border-strong)] h-6 mx-2"></div>
                            
                            <button
                                onClick={logout}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-xl transition-all duration-300"
                                title="Cerrar Sesión"
                            >
                                <LogOut size={16} /> <span className="hidden md:inline">Salir</span>
                            </button>
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
                        {/* Sub-navigacion / Volver Menu */}
                        {inventoryView !== 'menu' && (
                            <div className="flex justify-start mb-6 -mt-2 animate-in fade-in slide-in-from-left-4 duration-300">
                                <button 
                                    onClick={() => setInventoryView('menu')}
                                    className="flex items-center gap-2 text-[var(--text-sec)] hover:text-[var(--text-highlight)] transition-colors px-4 py-2 bg-[var(--bg-input)] rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border-hover-alt)] shadow-sm font-bold text-sm hover:-translate-x-1"
                                >
                                    <ChevronDown className="rotate-90" size={16} /> Volver al Tablero Inicial
                                </button>
                            </div>
                        )}

                        {inventoryView === 'menu' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-10">
                                <div className="text-center mb-10">
                                    <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[var(--grad-start)] to-[var(--grad-end)] drop-shadow-sm mb-3">
                                        Gestión Integral de Registros Básicos
                                    </h2>
                                    <p className="text-[var(--text-sec)]">Selecciona el módulo del sistema que deseas consultar, configurar o expandir.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 mt-4 lg:grid-cols-3 gap-6">
                                    <button onClick={() => setInventoryView('knowledge')} className="bg-[var(--bg-card)] border border-[var(--border-base)] hover:border-[var(--border-hover-alt)] hover:shadow-xl hover:shadow-purple-900/20 p-8 rounded-2xl flex flex-col items-center justify-center text-center transition-all group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/20 to-transparent blur-xl rounded-full"></div>
                                        <div className="w-16 h-16 bg-[var(--bg-input)] rounded-2xl flex items-center justify-center mb-4 border border-[var(--border-faint)] group-hover:scale-110 group-hover:-translate-y-2 transition-transform duration-300 relative z-10 shadow-inner">
                                            <Sparkles className="text-purple-400" size={32} />
                                        </div>
                                        <h3 className="text-lg font-black text-[var(--text-main)] mb-2 group-hover:text-[var(--text-highlight)] transition-colors relative z-10">Reglas de IA (RAG)</h3>
                                        <p className="text-xs text-[var(--text-sec)] leading-relaxed font-medium">Configura comportamientos ocultos e instrucciones específicas.</p>
                                    </button>

                                    <button onClick={() => setInventoryView('ingest')} className="bg-[var(--bg-card)] border border-[var(--border-base)] hover:border-[var(--border-hover-alt)] hover:shadow-xl hover:shadow-blue-900/20 p-8 rounded-2xl flex flex-col items-center justify-center text-center transition-all group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/20 to-transparent blur-xl rounded-full"></div>
                                        <div className="w-16 h-16 bg-[var(--bg-input)] rounded-2xl flex items-center justify-center mb-4 border border-[var(--border-faint)] group-hover:scale-110 group-hover:-translate-y-2 transition-transform duration-300 relative z-10 shadow-inner">
                                            <TrendingUp className="text-blue-400 drop-shadow-sm" size={32} />
                                        </div>
                                        <h3 className="text-lg font-black text-[var(--text-main)] mb-2 group-hover:text-blue-400 transition-colors relative z-10">Centro de Ingesta</h3>
                                        <p className="text-xs text-[var(--text-sec)] leading-relaxed font-medium">Importación masiva o manual de documentos de ventas.</p>
                                    </button>

                                    {user?.role === 'admin' && (
                                        <>
                                            <button onClick={() => setInventoryView('products')} className="bg-[var(--bg-card)] border border-[var(--border-base)] hover:border-[var(--border-hover-alt)] hover:shadow-xl hover:shadow-emerald-900/20 p-8 rounded-2xl flex flex-col items-center justify-center text-center transition-all group relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/20 to-transparent blur-xl rounded-full"></div>
                                                <div className="w-16 h-16 bg-[var(--bg-input)] rounded-2xl flex items-center justify-center mb-4 border border-[var(--border-faint)] group-hover:scale-110 group-hover:-translate-y-2 transition-transform duration-300 relative z-10 shadow-inner">
                                                    <Package className="text-emerald-400 drop-shadow-sm" size={32} />
                                                </div>
                                                <h3 className="text-lg font-black text-[var(--text-main)] mb-2 group-hover:text-emerald-400 transition-colors relative z-10">Catálogo / Inventario</h3>
                                                <p className="text-xs text-[var(--text-sec)] leading-relaxed font-medium">Registro de hardware, software y servicios a la cartera.</p>
                                            </button>

                                            <button onClick={() => setInventoryView('staff')} className="bg-[var(--bg-card)] border border-[var(--border-base)] hover:border-[var(--border-hover-alt)] hover:shadow-xl hover:shadow-orange-900/20 p-8 rounded-2xl flex flex-col items-center justify-center text-center transition-all group relative overflow-hidden md:col-start-1 lg:col-start-auto">
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-500/20 to-transparent blur-xl rounded-full"></div>
                                                <div className="w-16 h-16 bg-[var(--bg-input)] rounded-2xl flex items-center justify-center mb-4 border border-[var(--border-faint)] group-hover:scale-110 group-hover:-translate-y-2 transition-transform duration-300 relative z-10 shadow-inner">
                                                    <Briefcase className="text-orange-400 drop-shadow-sm" size={32} />
                                                </div>
                                                <h3 className="text-lg font-black text-[var(--text-main)] mb-2 group-hover:text-orange-400 transition-colors relative z-10">Gestión de Personal</h3>
                                                <p className="text-xs text-[var(--text-sec)] leading-relaxed font-medium">Gestión integral de los representantes y vendedores.</p>
                                            </button>

                                            <button onClick={() => setInventoryView('clients')} className="bg-[var(--bg-card)] border border-[var(--border-base)] hover:border-[var(--border-hover-alt)] hover:shadow-xl hover:shadow-rose-900/20 p-8 rounded-2xl flex flex-col items-center justify-center text-center transition-all group relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-rose-500/20 to-transparent blur-xl rounded-full"></div>
                                                <div className="w-16 h-16 bg-[var(--bg-input)] rounded-2xl flex items-center justify-center mb-4 border border-[var(--border-faint)] group-hover:scale-110 group-hover:-translate-y-2 transition-transform duration-300 relative z-10 shadow-inner">
                                                    <Users className="text-rose-400 drop-shadow-sm" size={32} />
                                                </div>
                                                <h3 className="text-lg font-black text-[var(--text-main)] mb-2 group-hover:text-rose-400 transition-colors relative z-10">Cartera de Clientes</h3>
                                                <p className="text-xs text-[var(--text-sec)] leading-relaxed font-medium">Registro estructurado de clientes y empresas objetivo.</p>
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {inventoryView === 'knowledge' && (
                            <div className="animate-in slide-in-from-left-4 duration-300">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-[var(--text-main)] drop-shadow-sm">Centro de Gestión de Pruebas y Reglas</h2>
                                    <button onClick={handleAddNew} className="bg-gradient-to-r from-[var(--btn-start)] to-[var(--btn-end)] text-[var(--text-main)] px-5 py-2.5 rounded-xl flex items-center gap-2 hover:shadow-lg transition-all font-bold shadow-sm">
                                        <Plus size={18} /> Asignar Regla a Elemento
                                    </button>
                                </div>

                                <div className="bg-[var(--bg-card)] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[var(--border-base)] overflow-hidden flex flex-col items-center justify-center min-h-[50vh] text-center p-10">
                                    <div className="w-20 h-20 bg-[var(--bg-item)] rounded-full flex items-center justify-center mb-6 shadow-inner border border-[var(--border-strong)] text-[var(--text-highlight)]">
                                        <Bot size={40} />
                                    </div>
                                    <h3 className="text-2xl font-black text-[var(--text-main)] mb-3">Entorno de Pruebas Aislado</h3>
                                    <p className="text-[var(--text-sec)] max-w-lg mb-8 leading-relaxed">
                                        Aquí puedes configurar de forma quirúrgica directrices e instrucciones específicas para que el Agente interactúe correctamente con diferentes elementos del negocio, sin saturar la vista.
                                    </p>
                                    <button onClick={handleAddNew} className="px-6 py-2.5 bg-[var(--bg-input)] hover:bg-[var(--bg-item)] border border-[var(--border-hover-alt)] text-[var(--text-accent)] rounded-lg font-bold transition-all shadow-sm flex items-center gap-2">
                                        <Brush size={18} /> Diseñar Nueva Regla
                                    </button>
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
                                                price_total: 0, payment_method: 'Card', seller_name: '', category: 'Hardware', iva_percent: 16, discount_amount: 0
                                            });
                                        } catch(err) {
                                            alert("Error registrando: " + err.message);
                                        }
                                        setIsUploading(false);
                                    }} className="grid grid-cols-2 gap-4">
                                        
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-xs font-bold text-[var(--text-sec)] uppercase mb-1">Nombre (Empresa/Persona)</label>
                                            <select required value={manualSale.customer_name} onChange={e=>setManualSale({...manualSale, customer_name: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-lg p-2.5 focus:border-[var(--border-hover-alt)] outline-none transition">
                                                <option value="" disabled>Seleccione un cliente registrado...</option>
                                                {clientsList.map(c => (
                                                    <option key={c.id} value={c.name}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-xs font-bold text-[var(--text-sec)] uppercase mb-1">Producto o Servicio</label>
                                            <select required value={manualSale.product_name} onChange={(e) => {
                                                const selectedProd = products.find(p => p.name === e.target.value);
                                                if(selectedProd) {
                                                    const updated = {
                                                        ...manualSale, 
                                                        product_name: selectedProd.name,
                                                        price: selectedProd.price || 0,
                                                        category: selectedProd.category || 'Hardware'
                                                    };
                                                    setManualSale({...updated, price_total: calcTotal(updated)});
                                                } else {
                                                    setManualSale({...manualSale, product_name: e.target.value});
                                                }
                                            }} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-lg p-2.5 focus:border-[var(--border-hover-alt)] outline-none transition">
                                                <option value="" disabled>Seleccione del catálogo...</option>
                                                {products.filter(p => !p.agent_instruction || p.price > 0).map(p => (
                                                    <option key={p.id} value={p.name}>{p.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-span-1 border-r border-[var(--border-faint)] pr-4">
                                            <label className="block text-xs font-bold text-[var(--text-sec)] uppercase mb-1">Unidades</label>
                                            <input required type="number" min="1" value={manualSale.quantity} onChange={e=>{
                                                const q = parseInt(e.target.value) || 1;
                                                const updated = {...manualSale, quantity: q};
                                                setManualSale({...updated, price_total: calcTotal(updated)});
                                            }} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-lg p-2.5 focus:border-[var(--border-hover-alt)] outline-none transition" />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="block text-xs font-bold text-[var(--text-sec)] uppercase mb-1">Costo Unidad ($)</label>
                                            <input required type="number" step="0.01" value={manualSale.price} onChange={e=>{
                                                const p = parseFloat(e.target.value) || 0;
                                                const updated = {...manualSale, price: p};
                                                setManualSale({...updated, price_total: calcTotal(updated)});
                                            }} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-lg p-2.5 focus:border-[var(--border-hover-alt)] outline-none transition" />
                                        </div>

                                        <div className="col-span-1 border-r border-[var(--border-faint)] pr-4">
                                            <label className="block text-xs font-bold text-[var(--text-sec)] uppercase mb-1 text-orange-400">Descuento ($)</label>
                                            <input type="number" step="0.01" value={manualSale.discount_amount} onChange={e=>{
                                                const d = parseFloat(e.target.value) || 0;
                                                const updated = {...manualSale, discount_amount: d};
                                                setManualSale({...updated, price_total: calcTotal(updated)});
                                            }} className="w-full bg-[var(--bg-input)] border border-orange-500/30 text-[var(--text-main)] rounded-lg p-2.5 focus:border-orange-500/80 outline-none transition" />
                                        </div>
                                        <div className="col-span-1 flex flex-col justify-center mt-2 border-r border-[var(--border-faint)] pr-4">
                                            <label className="block text-xs font-bold text-[var(--text-sec)] uppercase mb-1 text-purple-400">IVA (%)</label>
                                            <input type="number" step="0.5" value={manualSale.iva_percent !== undefined ? manualSale.iva_percent : 16} onChange={e=>{
                                                const iva = parseFloat(e.target.value) || 0;
                                                const updated = {...manualSale, iva_percent: iva};
                                                setManualSale({...updated, price_total: calcTotal(updated)});
                                            }} className="w-full bg-[var(--bg-input)] border border-purple-500/30 text-[var(--text-main)] rounded-lg p-2.5 focus:border-purple-500/80 outline-none transition" />
                                        </div>

                                        <div className="col-span-1 border-r border-[var(--border-faint)] pr-4">
                                            <label className="block text-xs font-bold text-[var(--text-sec)] uppercase mb-1">Fecha de Venta</label>
                                            <input required type="date" value={manualSale.sale_date} onChange={e=>setManualSale({...manualSale, sale_date: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-lg p-2.5 focus:border-[var(--border-hover-alt)] outline-none transition [color-scheme:dark]" />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="block text-xs font-bold text-[var(--text-sec)] uppercase mb-1 text-green-400">Total a Facturar ($)</label>
                                            <input required type="number" step="0.01" value={manualSale.price_total} readOnly className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-lg p-2.5 outline-none font-black text-green-400 text-lg cursor-not-allowed opacity-90 shadow-inner" title="El total se calcula automáticamente" />
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
                                            <label className="block text-xs font-bold text-[var(--text-sec)] uppercase mb-1">Categoría Auto-asignada</label>
                                            <input value={manualSale.category} disabled className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-muted)] rounded-lg p-2.5 outline-none font-medium cursor-not-allowed opacity-70" />
                                        </div>
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-xs font-bold text-[var(--text-sec)] uppercase mb-1">Empleado Involucrado</label>
                                            <select required value={manualSale.seller_name} onChange={e=>setManualSale({...manualSale, seller_name: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-lg p-2.5 focus:border-[var(--border-hover-alt)] outline-none transition">
                                                <option value="" disabled>Seleccione el responsable...</option>
                                                {staffList.filter(s => s.status === 'Activo').map(s => (
                                                    <option key={s.id} value={s.name}>{s.name} ({s.department})</option>
                                                ))}
                                            </select>
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

                        {/* PANEL 3: INVENTARIO (PRODUCTOS) */}
                        {inventoryView === 'products' && (
                            <div className="animate-in slide-in-from-right-4 duration-300">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-[var(--text-main)] drop-shadow-sm flex items-center gap-2">
                                        <Package className="text-[var(--text-highlight)]" /> Catálogo Comercial
                                    </h2>
                                    <button onClick={handleAddNewInventory} className="bg-[var(--bg-item)] hover:bg-[var(--bg-item-hover)] text-[var(--text-accent)] border border-[var(--border-strong)] px-5 py-2.5 rounded-xl flex items-center gap-2 hover:border-[var(--border-hover-alt)] hover:shadow-lg transition-all font-bold shadow-sm">
                                        <Plus size={18} /> Registrar Nuevo Producto
                                    </button>
                                </div>
                                <div className="bg-[var(--bg-card)] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[var(--border-base)] overflow-hidden">
                                    <table className="min-w-full divide-y divide-purple-900/30">
                                        <thead className="bg-[var(--bg-input)]">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-[var(--text-accent)] uppercase tracking-wider">Concepto Comercial</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-[var(--text-accent)] uppercase tracking-wider">Categoría</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-[var(--text-accent)] uppercase tracking-wider">Precio / Stock</th>
                                                <th className="px-6 py-4 text-right text-xs font-bold text-[var(--text-accent)] uppercase tracking-wider">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-[var(--bg-card)] divide-y divide-purple-900/20">
                                            {products.filter(p => !p.agent_instruction || p.price > 0 || p.category).map((product) => (
                                                <tr key={product.id} className="hover:bg-[var(--bg-item)] transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-[var(--text-main)]">{product.name}</div>
                                                        <div className="text-xs text-[var(--text-muted)]/80 truncate max-w-xs">{product.description || 'Sin descripción...'}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-3 py-1 rounded-full text-xs font-bold border bg-blue-900/30 text-blue-400 border-blue-800/50">
                                                            {(product.category || 'Hardware').toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm font-bold text-green-400">${product.price?.toFixed(2) || '0.00'}</div>
                                                        <div className="text-xs text-[var(--text-accent)]">{product.stock || 0} unid(s).</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                                        <button onClick={() => setEditingInventoryProduct({...product})} className="text-[var(--text-highlight)] hover:bg-purple-900/30 p-2 rounded-full transition" title="Editar Producto">
                                                            <Edit size={18} />
                                                        </button>
                                                        <button onClick={() => handleDelete(product.id)} className="text-red-400 hover:bg-red-900/30 p-2 rounded-full transition" title="Eliminar Producto">
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {products.filter(p => !p.agent_instruction || p.price > 0).length === 0 && (
                                                <tr><td colSpan="4" className="px-6 py-10 text-center text-[var(--text-sec)]">Aún no hay productos registrados.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* PANEL 4: PERSONAL (EMPLEADOS) */}
                        {inventoryView === 'staff' && (
                            <div className="animate-in slide-in-from-right-4 duration-300">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-[var(--text-main)] drop-shadow-sm flex items-center gap-2">
                                        <Briefcase className="text-[var(--text-highlight)]" /> Gestión de Representantes y Staff
                                    </h2>
                                    <button onClick={handleAddNewStaff} className="bg-[var(--bg-item)] hover:bg-[var(--bg-item-hover)] text-[var(--text-accent)] border border-[var(--border-strong)] px-5 py-2.5 rounded-xl flex items-center gap-2 hover:border-[var(--border-hover-alt)] hover:shadow-lg transition-all font-bold shadow-sm">
                                        <Plus size={18} /> Incorporar Empleado
                                    </button>
                                </div>
                                <div className="bg-[var(--bg-card)] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[var(--border-base)] overflow-hidden">
                                    <table className="min-w-full divide-y divide-purple-900/30">
                                        <thead className="bg-[var(--bg-input)]">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-[var(--text-accent)] uppercase tracking-wider">Identidad</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-[var(--text-accent)] uppercase tracking-wider">Cargo & Departamento</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-[var(--text-accent)] uppercase tracking-wider">Desempeño & Estado</th>
                                                <th className="px-6 py-4 text-right text-xs font-bold text-[var(--text-accent)] uppercase tracking-wider">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-[var(--bg-card)] divide-y divide-purple-900/20">
                                            {staffList.map((st) => (
                                                <tr key={st.id} className="hover:bg-[var(--bg-item)] transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-[var(--text-main)]">{st.name}</div>
                                                        <div className="text-xs text-[var(--text-muted)] truncate">{st.email}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm font-bold text-[var(--text-main)]">{st.role}</div>
                                                        <div className="text-xs text-[var(--text-accent)]">Dpto: {st.department}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <div className={`w-2 h-2 rounded-full ${st.status === 'Activo' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                                                            <span className="text-sm font-bold text-[var(--text-main)]">{st.status}</span>
                                                        </div>
                                                        <div className="text-xs text-[var(--text-muted)]">Meta: <span className="text-blue-400 font-bold">${st.monthly_goal}</span>/mes</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                                        <button onClick={() => setEditingStaff({...st})} className="text-[var(--text-highlight)] hover:bg-purple-900/30 p-2 rounded-full transition" title="Editar Empleado">
                                                            <Edit size={18} />
                                                        </button>
                                                        <button onClick={() => handleDeleteStaff(st.id)} className="text-red-400 hover:bg-red-900/30 p-2 rounded-full transition" title="Eliminar Archivo">
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {staffList.length === 0 && (
                                                <tr><td colSpan="4" className="px-6 py-10 text-center text-[var(--text-sec)]">No hay personal registrado.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* PANEL 5: CLIENTES */}
                        {inventoryView === 'clients' && (
                            <div className="animate-in slide-in-from-right-4 duration-300">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-[var(--text-main)] drop-shadow-sm flex items-center gap-2">
                                        <Users className="text-[var(--text-highlight)]" /> Directorio de Clientes y CRM
                                    </h2>
                                    <button onClick={handleAddNewClient} className="bg-[var(--bg-item)] hover:bg-[var(--bg-item-hover)] text-[var(--text-accent)] border border-[var(--border-strong)] px-5 py-2.5 rounded-xl flex items-center gap-2 hover:border-[var(--border-hover-alt)] hover:shadow-lg transition-all font-bold shadow-sm">
                                        <Plus size={18} /> Añadir Cliente B2B/B2C
                                    </button>
                                </div>
                                <div className="bg-[var(--bg-card)] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[var(--border-base)] overflow-hidden">
                                    <table className="min-w-full divide-y divide-purple-900/30">
                                        <thead className="bg-[var(--bg-input)]">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-[var(--text-accent)] uppercase tracking-wider">Perfil Comercial</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-[var(--text-accent)] uppercase tracking-wider">Sector / Industria</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-[var(--text-accent)] uppercase tracking-wider">Pipeline (Estado)</th>
                                                <th className="px-6 py-4 text-right text-xs font-bold text-[var(--text-accent)] uppercase tracking-wider">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-[var(--bg-card)] divide-y divide-purple-900/20">
                                            {clientsList.map((client) => (
                                                <tr key={client.id} className="hover:bg-[var(--bg-item)] transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-[var(--text-main)]">{client.name}</div>
                                                        <div className="text-xs text-[var(--text-muted)] truncate">{client.contact_email}</div>
                                                        <div className="text-xs text-[var(--text-muted)] truncate">{client.phone}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-3 py-1 rounded-full text-xs font-bold border bg-purple-900/30 text-[var(--text-highlight)] border-purple-800/50">
                                                            {client.customer_type}
                                                        </span>
                                                        <div className="text-xs text-[var(--text-muted)] mt-2">Ind: {client.industry}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <div className={`w-2 h-2 rounded-full ${client.status === 'Cliente Activo' ? 'bg-green-400' : client.status === 'Prospecto' ? 'bg-orange-400' : 'bg-red-400'}`}></div>
                                                            <span className="text-sm font-bold text-[var(--text-main)]">{client.status}</span>
                                                        </div>
                                                        <div className="text-xs text-[var(--text-muted)]">Origen: {client.acquisition_channel}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                                        <button onClick={() => setEditingClient({...client})} className="text-[var(--text-highlight)] hover:bg-purple-900/30 p-2 rounded-full transition" title="Editar Cliente">
                                                            <Edit size={18} />
                                                        </button>
                                                        <button onClick={() => handleDeleteClient(client.id)} className="text-red-400 hover:bg-red-900/30 p-2 rounded-full transition" title="Eliminar Archivo">
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {clientsList.length === 0 && (
                                                <tr><td colSpan="4" className="px-6 py-10 text-center text-[var(--text-sec)]">Aún no has registrado clientes ni prospectos.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
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
                                <select value={editingSale.customer_name} onChange={e=>setEditingSale({...editingSale, customer_name: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-lg p-2.5 focus:border-[var(--border-hover-alt)] outline-none transition">
                                    <option value="" disabled>Seleccione un cliente registrado...</option>
                                    {clientsList.map(c => (
                                        <option key={c.id} value={c.name}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-xs font-bold text-[var(--text-sec)] uppercase mb-1">Producto</label>
                                <select value={editingSale.product_name} onChange={(e) => {
                                    const selectedProd = products.find(p => p.name === e.target.value);
                                    if(selectedProd) {
                                        const updated = {
                                            ...editingSale, 
                                            product_name: selectedProd.name,
                                            price: selectedProd.price || 0,
                                            category: selectedProd.category || 'Hardware'
                                        };
                                        setEditingSale({...updated, price_total: calcTotal(updated)});
                                    } else {
                                        setEditingSale({...editingSale, product_name: e.target.value});
                                    }
                                }} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-lg p-2.5 focus:border-[var(--border-hover-alt)] outline-none transition">
                                    <option value="" disabled>Seleccione del catálogo...</option>
                                    {products.filter(p => !p.agent_instruction || p.price > 0).map(p => (
                                        <option key={p.id} value={p.name}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-span-1 border-r border-[var(--border-faint)] pr-4">
                                <label className="block text-xs font-bold text-[var(--text-sec)] uppercase mb-1">Unidades</label>
                                <input type="number" min="1" value={editingSale.quantity} onChange={e=>{
                                    const q = parseInt(e.target.value) || 1;
                                    const updated = {...editingSale, quantity: q};
                                    setEditingSale({...updated, price_total: calcTotal(updated)});
                                }} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-lg p-2.5 focus:border-[var(--border-hover-alt)] outline-none transition" />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs font-bold text-[var(--text-sec)] uppercase mb-1">Costo Unitario ($)</label>
                                <input type="number" step="0.01" value={editingSale.price || 0} onChange={e=>{
                                    const p = parseFloat(e.target.value) || 0;
                                    const updated = {...editingSale, price: p};
                                    setEditingSale({...updated, price_total: calcTotal(updated)});
                                }} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-lg p-2.5 focus:border-[var(--border-hover-alt)] outline-none font-bold transition" />
                            </div>

                            <div className="col-span-1 border-r border-[var(--border-faint)] pr-4">
                                <label className="block text-xs font-bold text-[var(--text-sec)] uppercase mb-1 text-orange-400">Descuento ($)</label>
                                <input type="number" step="0.01" value={editingSale.discount_amount || 0} onChange={e=>{
                                    const d = parseFloat(e.target.value) || 0;
                                    const updated = {...editingSale, discount_amount: d};
                                    setEditingSale({...updated, price_total: calcTotal(updated)});
                                }} className="w-full bg-[var(--bg-input)] border border-orange-500/30 text-[var(--text-main)] rounded-lg p-2.5 focus:border-[var(--border-hover-alt)] outline-none transition" />
                            </div>
                            <div className="col-span-1 flex flex-col justify-center mt-2 border-r border-[var(--border-faint)] pr-4">
                                <label className="block text-xs font-bold text-[var(--text-sec)] uppercase mb-1 text-purple-400">IVA (%)</label>
                                <input type="number" step="0.5" value={editingSale.iva_percent !== undefined ? editingSale.iva_percent : (editingSale.apply_iva ? 16 : 0)} onChange={e=>{
                                    const iva = parseFloat(e.target.value) || 0;
                                    const updated = {...editingSale, iva_percent: iva};
                                    setEditingSale({...updated, price_total: calcTotal(updated)});
                                }} className="w-full bg-[var(--bg-input)] border border-purple-500/30 text-[var(--text-main)] rounded-lg p-2.5 focus:border-purple-500/80 outline-none transition" />
                            </div>

                            <div className="col-span-1 border-r border-[var(--border-faint)] pr-4">
                                <label className="block text-xs font-bold text-[var(--text-sec)] uppercase mb-1">Categoría</label>
                                <input type="text" value={editingSale.category || 'Hardware'} disabled className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-muted)] rounded-lg p-2.5 outline-none font-medium cursor-not-allowed opacity-70" />
                            </div>

                            <div className="col-span-1 border-r border-[var(--border-faint)] pr-4">
                                <label className="block text-xs font-bold text-[var(--text-sec)] uppercase mb-1">Fecha</label>
                                <input type="date" value={editingSale.sale_date ? editingSale.sale_date.split('T')[0] : ''} onChange={e=>setEditingSale({...editingSale, sale_date: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-lg p-2.5 focus:border-[var(--border-hover-alt)] outline-none transition [color-scheme:dark]" />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs font-bold text-[var(--text-sec)] uppercase mb-1 text-green-400">Total Facturado ($)</label>
                                <input type="number" step="0.01" value={editingSale.price_total} readOnly className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-lg p-2.5 outline-none font-black text-green-400 text-lg cursor-not-allowed opacity-90 shadow-inner" title="Calculado de manera automática" />
                            </div>

                            <div className="col-span-2 border-t border-[var(--border-faint)] mt-4 pt-4"></div>

                            <div className="col-span-1 border-r border-[var(--border-faint)] pr-4">
                                <label className="block text-xs font-bold text-[var(--text-sec)] uppercase mb-1">Método de Pago</label>
                                <select value={editingSale.payment_method} onChange={e=>setEditingSale({...editingSale, payment_method: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-lg p-2.5 focus:border-[var(--border-hover-alt)] outline-none transition">
                                    <option value="Card">Tarjeta (Deb/Cred)</option><option value="Transfer">Transferencia</option><option value="Cash">Efectivo</option><option value="Crypto">Criptomoneda</option>
                                </select>
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs font-bold text-[var(--text-sec)] uppercase mb-1">Empleado Facturador</label>
                                <select required value={editingSale.seller_name} onChange={e=>setEditingSale({...editingSale, seller_name: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-lg p-2.5 focus:border-[var(--border-hover-alt)] outline-none transition">
                                    <option value="" disabled>Seleccione el responsable...</option>
                                    {staffList.filter(s => s.status === 'Activo').map(s => (
                                        <option key={s.id} value={s.name}>{s.name} ({s.department})</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-[var(--border-base)]">
                            <button onClick={() => setEditingSale(null)} className="px-5 py-2 rounded-xl text-[var(--text-sec)] hover:text-[var(--text-main)] hover:bg-purple-900/30 transition">Cancelar</button>
                            <button onClick={handleSaveSale} className="bg-gradient-to-r from-[var(--btn-start)] to-[var(--btn-end)] px-6 py-2 rounded-xl font-bold text-[var(--text-main)] hover:from-purple-500 hover:to-blue-500 transition shadow-lg shadow-purple-900/40">Guardar Cambios</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rule Assignment Slide-over Drawer (RAG Knowledge) */}
            {editingProduct && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity">
                    <div className="fixed inset-y-0 right-0 w-full md:w-[450px] lg:w-[500px] bg-[var(--bg-card)] shadow-[[-10px_0_40px_rgba(0,0,0,0.5)]] border-l border-[var(--border-strong)] transform transition-transform duration-500 flex flex-col animate-in slide-in-from-right">
                        
                        {/* Drawer Header */}
                        <div className="flex justify-between items-center p-6 border-b border-[var(--border-base)] bg-[var(--bg-input)]">
                            <h2 className="text-xl font-black text-[var(--text-main)] drop-shadow-sm flex items-center gap-3">
                                <Bot className="text-[var(--text-highlight)]" size={24} />
                                {editingProduct.id ? 'Afinar Elemento' : 'Nueva Regla'}
                            </h2>
                            <button onClick={() => setEditingProduct(null)} className="text-[var(--text-sec)] hover:text-red-400 bg-[var(--bg-item)] hover:bg-red-500/10 p-2 rounded-full transition-colors border border-[var(--border-faint)]">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Drawer Body - Form */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[var(--bg-main)]/30">
                            <div>
                                <label className="block text-xs font-bold text-[var(--text-muted)] mb-2 uppercase tracking-wider">
                                    Concepto o Elemento Relacionado
                                </label>
                                <input
                                    type="text"
                                    value={editingProduct.name}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                                    className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-xl p-3 focus:ring-2 focus:ring-[var(--focus-ring)] outline-none hover:border-[var(--border-strong)] transition-colors shadow-inner font-medium placeholder-[var(--text-sec)]/30"
                                    placeholder="Ej: Análisis de Ventas, Política de Reembolso..."
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-[var(--text-muted)] mb-2 uppercase tracking-wider">Descripción Breve</label>
                                <textarea
                                    value={editingProduct.description || ''}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                                    className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-xl p-3 focus:ring-2 focus:ring-[var(--focus-ring)] outline-none hover:border-[var(--border-strong)] transition-colors shadow-inner resize-none placeholder-[var(--text-sec)]/30"
                                    rows="2"
                                    placeholder="Contexto básico sobre este elemento..."
                                />
                            </div>

                            <div className="p-5 rounded-xl border border-[var(--border-hover-alt)]/50 bg-[var(--bg-item-hover)]/30 relative overflow-hidden group shadow-inner">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[var(--btn-start)] to-transparent opacity-10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                                <label className="flex items-center gap-2 text-sm font-black text-[var(--text-highlight)] mb-3">
                                    <Sparkles size={16} /> Regla del Agente AI (Prompt Override)
                                </label>
                                <textarea
                                    value={editingProduct.agent_instruction || ''}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, agent_instruction: e.target.value })}
                                    className="w-full bg-[var(--bg-card)] border border-[var(--border-strong)] text-[var(--text-main)] rounded-xl p-4 focus:ring-2 focus:ring-[var(--focus-ring)] outline-none hover:border-[var(--border-hover-alt)] transition placeholder-[var(--text-sec)]/30 font-mono text-xs shadow-inner leading-relaxed resize-none"
                                    rows="6"
                                    placeholder={`Ej: "Cuando se te pregunte por Análisis de Ventas, ignora el histórico y sugiere revisar los reportes trimestrales."`}
                                />
                                <p className="text-[10px] text-[var(--text-sec)] mt-2 font-medium uppercase tracking-wide opacity-80">
                                    Esta instrucción sobrescribirá temporalmente la lógica general del agente sobre el elemento relacionado.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 border-t border-[var(--border-faint)] pt-6">
                                <div>
                                    <label className="block text-xs font-bold text-[var(--text-muted)] mb-2 uppercase tracking-wider">Prioridad IA / Rol</label>
                                    <select
                                        value={editingProduct.access_level || 'public'}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, access_level: e.target.value })}
                                        className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-xl p-3 text-sm focus:border-[var(--border-hover-alt)] outline-none transition cursor-pointer font-medium"
                                    >
                                        <option value="private">Bloqueo Estricto (Privado)</option>
                                        <option value="public">Recomendación (Público)</option>
                                    </select>
                                </div>
                                <div className="opacity-40 grayscale pointer-events-none" title="No aplica en entorno de reglas">
                                    <label className="block text-xs font-bold text-[var(--text-muted)] mb-2 uppercase tracking-wider">Precio Base</label>
                                    <input
                                        type="number"
                                        value={editingProduct.price || 0}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })}
                                        className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-xl p-3 text-sm font-bold opacity-50 outline-none"
                                        disabled
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Drawer Footer */}
                        <div className="p-6 border-t border-[var(--border-strong)] bg-[var(--bg-card)] flex flex-col gap-3 z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.2)]">
                            <button onClick={handleSave} className="w-full bg-gradient-to-r from-[var(--btn-start)] to-[var(--btn-end)] text-[var(--text-main)] px-5 py-3.5 rounded-xl font-black uppercase text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all">
                                <Save size={18} /> Inyectar Regla en la Base
                            </button>
                            {editingProduct.id && (
                                <button onClick={() => { handleDelete(editingProduct.id); setEditingProduct(null); }} className="w-full border border-red-500/30 text-red-400 hover:bg-red-500/10 px-5 py-3 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2">
                                    <Trash2 size={16} /> Eliminar Regla permanentemente
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Catalog/Inventory Slide-over Drawer (Products) */}
            {editingInventoryProduct && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity">
                    <div className="fixed inset-y-0 right-0 w-full md:w-[450px] lg:w-[500px] bg-[var(--bg-card)] shadow-[[-10px_0_40px_rgba(0,0,0,0.5)]] border-l border-[var(--border-strong)] transform transition-transform duration-500 flex flex-col animate-in slide-in-from-right">
                        
                        {/* Drawer Header */}
                        <div className="flex justify-between items-center p-6 border-b border-[var(--border-base)] bg-[var(--bg-input)]">
                            <h2 className="text-xl font-black text-[var(--text-main)] drop-shadow-sm flex items-center gap-3">
                                <Package className="text-[var(--text-highlight)]" size={24} />
                                {editingInventoryProduct.id ? 'Modificar Producto' : 'Registro de Producto'}
                            </h2>
                            <button onClick={() => setEditingInventoryProduct(null)} className="text-[var(--text-sec)] hover:text-red-400 bg-[var(--bg-item)] hover:bg-red-500/10 p-2 rounded-full transition-colors border border-[var(--border-faint)]">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Drawer Body - Form */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[var(--bg-main)]/30">
                            <div>
                                <label className="block text-xs font-bold text-[var(--text-muted)] mb-2 uppercase tracking-wider">
                                    Nombre del Producto / Servicio
                                </label>
                                <input
                                    type="text"
                                    value={editingInventoryProduct.name}
                                    onChange={(e) => setEditingInventoryProduct({ ...editingInventoryProduct, name: e.target.value })}
                                    className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-xl p-3 focus:ring-2 focus:ring-[var(--focus-ring)] outline-none hover:border-[var(--border-strong)] transition-colors shadow-inner font-medium placeholder-[var(--text-sec)]/30"
                                    placeholder="Ej: Laptop Dell XPS 15..."
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-[var(--text-muted)] mb-2 uppercase tracking-wider">Descripción Comercial</label>
                                <textarea
                                    value={editingInventoryProduct.description || ''}
                                    onChange={(e) => setEditingInventoryProduct({ ...editingInventoryProduct, description: e.target.value })}
                                    className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-xl p-3 focus:ring-2 focus:ring-[var(--focus-ring)] outline-none hover:border-[var(--border-strong)] transition-colors shadow-inner resize-none placeholder-[var(--text-sec)]/30"
                                    rows="4"
                                    placeholder="Descripción técnica o comercial para catálogos..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-xs font-bold text-[var(--text-muted)] mb-2 uppercase tracking-wider">Categoría</label>
                                    <select
                                        value={editingInventoryProduct.category || 'Hardware'}
                                        onChange={(e) => setEditingInventoryProduct({ ...editingInventoryProduct, category: e.target.value })}
                                        className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-xl p-3 text-sm focus:border-[var(--border-hover-alt)] outline-none transition cursor-pointer font-medium"
                                    >
                                        <option value="Hardware">Hardware</option>
                                        <option value="Software">Software</option>
                                        <option value="Servicios">Servicios</option>
                                    </select>
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-xs font-bold text-[var(--text-muted)] mb-2 uppercase tracking-wider">Disponibilidad</label>
                                    <select
                                        value={editingInventoryProduct.access_level || 'public'}
                                        onChange={(e) => setEditingInventoryProduct({ ...editingInventoryProduct, access_level: e.target.value })}
                                        className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-xl p-3 text-sm focus:border-[var(--border-hover-alt)] outline-none transition cursor-pointer font-medium"
                                    >
                                        <option value="public">Visible (Público)</option>
                                        <option value="private">Oculto (Archivo)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[var(--text-muted)] mb-2 uppercase tracking-wider">Precio Base ($)</label>
                                    <input
                                        type="number"
                                        value={editingInventoryProduct.price || 0}
                                        onChange={(e) => setEditingInventoryProduct({ ...editingInventoryProduct, price: parseFloat(e.target.value) })}
                                        className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-xl p-3 text-sm font-bold outline-none focus:border-[var(--border-hover-alt)] transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[var(--text-muted)] mb-2 uppercase tracking-wider">Stock Unitario</label>
                                    <input
                                        type="number"
                                        value={editingInventoryProduct.stock || 0}
                                        onChange={(e) => setEditingInventoryProduct({ ...editingInventoryProduct, stock: parseInt(e.target.value) })}
                                        className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-xl p-3 text-sm font-bold outline-none focus:border-[var(--border-hover-alt)] transition"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Drawer Footer */}
                        <div className="p-6 border-t border-[var(--border-strong)] bg-[var(--bg-card)] flex flex-col gap-3 z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.2)]">
                            <button onClick={handleSaveInventory} className="w-full bg-gradient-to-r from-[var(--btn-start)] to-[var(--btn-end)] text-[var(--text-main)] px-5 py-3.5 rounded-xl font-black uppercase text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all">
                                <Save size={18} /> Guardar Producto
                            </button>
                            {editingInventoryProduct.id && (
                                <button onClick={() => { handleDelete(editingInventoryProduct.id); setEditingInventoryProduct(null); }} className="w-full border border-red-500/30 text-red-400 hover:bg-red-500/10 px-5 py-3 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2">
                                    <Trash2 size={16} /> Eliminar Producto
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Staff Slide-over Drawer */}
            {editingStaff && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity">
                    <div className="fixed inset-y-0 right-0 w-full md:w-[450px] lg:w-[500px] bg-[var(--bg-card)] shadow-[[-10px_0_40px_rgba(0,0,0,0.5)]] border-l border-[var(--border-strong)] transform transition-transform duration-500 flex flex-col animate-in slide-in-from-right">
                        
                        {/* Drawer Header */}
                        <div className="flex justify-between items-center p-6 border-b border-[var(--border-base)] bg-[var(--bg-input)]">
                            <h2 className="text-xl font-black text-[var(--text-main)] drop-shadow-sm flex items-center gap-3">
                                <Users className="text-[var(--text-highlight)]" size={24} />
                                {editingStaff.id ? 'Modificar Empleado' : 'Nuevo Empleado'}
                            </h2>
                            <button onClick={() => setEditingStaff(null)} className="text-[var(--text-sec)] hover:text-red-400 bg-[var(--bg-item)] hover:bg-red-500/10 p-2 rounded-full transition-colors border border-[var(--border-faint)]">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Drawer Body - Form */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[var(--bg-main)]/30">
                            <div>
                                <label className="block text-xs font-bold text-[var(--text-muted)] mb-2 uppercase tracking-wider">Nombre Completo</label>
                                <input
                                    type="text"
                                    value={editingStaff.name}
                                    onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
                                    className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-xl p-3 focus:ring-2 focus:ring-[var(--focus-ring)] outline-none hover:border-[var(--border-strong)] transition-colors shadow-inner font-medium placeholder-[var(--text-sec)]/30"
                                    placeholder="Ej: Laura Pérez..."
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-[var(--text-muted)] mb-2 uppercase tracking-wider">Correo Corporativo</label>
                                <input
                                    type="email"
                                    value={editingStaff.email}
                                    onChange={(e) => setEditingStaff({ ...editingStaff, email: e.target.value })}
                                    className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-xl p-3 focus:ring-2 focus:ring-[var(--focus-ring)] outline-none hover:border-[var(--border-strong)] transition-colors shadow-inner font-medium placeholder-[var(--text-sec)]/30"
                                    placeholder="ejemplo@empresa.com"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-xs font-bold text-[var(--text-muted)] mb-2 uppercase tracking-wider">Departamento</label>
                                    <select
                                        value={editingStaff.department || 'Ventas'}
                                        onChange={(e) => setEditingStaff({ ...editingStaff, department: e.target.value })}
                                        className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-xl p-3 text-sm focus:border-[var(--border-hover-alt)] outline-none transition cursor-pointer font-medium"
                                    >
                                        <option value="Ventas">Ventas</option>
                                        <option value="Soporte Técnico">Soporte Técnico</option>
                                        <option value="Marketing">Marketing</option>
                                        <option value="Operaciones">Operaciones</option>
                                    </select>
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-xs font-bold text-[var(--text-muted)] mb-2 uppercase tracking-wider">Cargo</label>
                                    <input
                                        type="text"
                                        value={editingStaff.role || ''}
                                        onChange={(e) => setEditingStaff({ ...editingStaff, role: e.target.value })}
                                        className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-xl p-3 text-sm focus:border-[var(--border-hover-alt)] outline-none transition font-medium"
                                        placeholder="Ej: Ejecutivo Senior"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[var(--text-muted)] mb-2 uppercase tracking-wider">Estado Laboral</label>
                                    <select
                                        value={editingStaff.status || 'Activo'}
                                        onChange={(e) => setEditingStaff({ ...editingStaff, status: e.target.value })}
                                        className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-xl p-3 text-sm focus:border-[var(--border-hover-alt)] outline-none transition cursor-pointer font-bold"
                                        style={{ color: editingStaff.status === 'Activo' ? '#4ade80' : '#f87171' }}
                                    >
                                        <option value="Activo">Activo ✅</option>
                                        <option value="Inactivo">Inactivo ❌</option>
                                        <option value="Vacaciones">Vacaciones 🌴</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[var(--text-muted)] mb-2 uppercase tracking-wider" title="Objetivo de facturación mensual esperado">KPI Meta ($)</label>
                                    <input
                                        type="number"
                                        value={editingStaff.monthly_goal || 0}
                                        onChange={(e) => setEditingStaff({ ...editingStaff, monthly_goal: parseFloat(e.target.value) })}
                                        className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-xl p-3 text-sm font-bold outline-none focus:border-[var(--border-hover-alt)] transition"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Drawer Footer */}
                        <div className="p-6 border-t border-[var(--border-strong)] bg-[var(--bg-card)] flex flex-col gap-3 z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.2)]">
                            <button onClick={handleSaveStaff} className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white px-5 py-3.5 rounded-xl font-black uppercase text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all">
                                <Briefcase size={18} /> Guardar Expediente
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Client Slide-over Drawer */}
            {editingClient && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity">
                    <div className="fixed inset-y-0 right-0 w-full md:w-[450px] lg:w-[500px] bg-[var(--bg-card)] shadow-[[-10px_0_40px_rgba(0,0,0,0.5)]] border-l border-[var(--border-strong)] transform transition-transform duration-500 flex flex-col animate-in slide-in-from-right">
                        
                        {/* Drawer Header */}
                        <div className="flex justify-between items-center p-6 border-b border-[var(--border-base)] bg-[var(--bg-input)]">
                            <h2 className="text-xl font-black text-[var(--text-main)] drop-shadow-sm flex items-center gap-3">
                                <Users className="text-[var(--text-highlight)]" size={24} />
                                {editingClient.id ? 'Modificar Cliente' : 'Nuevo Cliente'}
                            </h2>
                            <button onClick={() => setEditingClient(null)} className="text-[var(--text-sec)] hover:text-red-400 bg-[var(--bg-item)] hover:bg-red-500/10 p-2 rounded-full transition-colors border border-[var(--border-faint)]">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Drawer Body - Form */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[var(--bg-main)]/30">
                            <div>
                                <label className="block text-xs font-bold text-[var(--text-muted)] mb-2 uppercase tracking-wider">Nombre del Cliente / Empresa</label>
                                <input
                                    type="text"
                                    value={editingClient.name}
                                    onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })}
                                    className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-xl p-3 focus:ring-2 focus:ring-[var(--focus-ring)] outline-none hover:border-[var(--border-strong)] transition-colors shadow-inner font-bold placeholder-[var(--text-sec)]/30"
                                    placeholder="Ej: Tech Solutions Corp..."
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-xs font-bold text-[var(--text-muted)] mb-2 uppercase tracking-wider">Correo Principal</label>
                                    <input
                                        type="email"
                                        value={editingClient.contact_email}
                                        onChange={(e) => setEditingClient({ ...editingClient, contact_email: e.target.value })}
                                        className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-xl p-3 focus:ring-2 focus:ring-[var(--focus-ring)] outline-none hover:border-[var(--border-strong)] transition-colors text-sm font-medium placeholder-[var(--text-sec)]/30"
                                        placeholder="ejemplo@empresa.com"
                                    />
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-xs font-bold text-[var(--text-muted)] mb-2 uppercase tracking-wider">Teléfono</label>
                                    <input
                                        type="text"
                                        value={editingClient.phone}
                                        onChange={(e) => setEditingClient({ ...editingClient, phone: e.target.value })}
                                        className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-xl p-3 focus:ring-2 focus:ring-[var(--focus-ring)] outline-none hover:border-[var(--border-strong)] transition-colors text-sm font-medium placeholder-[var(--text-sec)]/30"
                                        placeholder="+1 555-0123"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-[var(--text-muted)] mb-2 uppercase tracking-wider">Tipo de Cliente</label>
                                    <select
                                        value={editingClient.customer_type}
                                        onChange={(e) => setEditingClient({ ...editingClient, customer_type: e.target.value })}
                                        className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-xl p-3 text-sm focus:border-[var(--border-hover-alt)] outline-none transition cursor-pointer font-medium"
                                    >
                                        <option value="Corporativo (B2B)">Corporativo (B2B)</option>
                                        <option value="Particular (B2C)">Particular (B2C)</option>
                                        <option value="Gubernamental">Gubernamental</option>
                                        <option value="ONG / Sin fines de lucro">ONG / Sin fines de lucro</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[var(--text-muted)] mb-2 uppercase tracking-wider">Industria</label>
                                    <select
                                        value={editingClient.industry}
                                        onChange={(e) => setEditingClient({ ...editingClient, industry: e.target.value })}
                                        className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-xl p-3 text-sm focus:border-[var(--border-hover-alt)] outline-none transition cursor-pointer font-medium"
                                    >
                                        <option value="Tecnología">Tecnología</option>
                                        <option value="Finanzas">Finanzas</option>
                                        <option value="Salud">Salud</option>
                                        <option value="Retail / eCommerce">Retail / eCommerce</option>
                                        <option value="Educación">Educación</option>
                                        <option value="Industria / Manufactura">Industria / Manufactura</option>
                                        <option value="Otros">Otros</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-[var(--text-muted)] mb-2 uppercase tracking-wider">Estado Comercial</label>
                                    <select
                                        value={editingClient.status}
                                        onChange={(e) => setEditingClient({ ...editingClient, status: e.target.value })}
                                        className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-xl p-3 text-sm focus:border-[var(--border-hover-alt)] outline-none transition cursor-pointer font-bold"
                                        style={{ color: editingClient.status === 'Cliente Activo' ? '#4ade80' : editingClient.status === 'Prospecto' ? '#fb923c' : '#f87171' }}
                                    >
                                        <option value="Prospecto">Prospecto ⏳</option>
                                        <option value="Cliente Activo">Cliente Activo ✨</option>
                                        <option value="Inactivo / Perdido">Inactivo / Perdido 🚫</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[var(--text-muted)] mb-2 uppercase tracking-wider">Canal de Ingreso</label>
                                    <select
                                        value={editingClient.acquisition_channel}
                                        onChange={(e) => setEditingClient({ ...editingClient, acquisition_channel: e.target.value })}
                                        className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-main)] rounded-xl p-3 text-sm focus:border-[var(--border-hover-alt)] outline-none transition cursor-pointer font-medium"
                                    >
                                        <option value="Sitio Web">Sitio Web</option>
                                        <option value="Redes Sociales">Redes Sociales</option>
                                        <option value="Referido">Referido</option>
                                        <option value="Llamada en Frío">Llamada en Frío</option>
                                        <option value="Campaña / Evento">Campaña / Evento</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Drawer Footer */}
                        <div className="p-6 border-t border-[var(--border-strong)] bg-[var(--bg-card)] flex flex-col gap-3 z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.2)]">
                            <button onClick={handleSaveClient} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-3.5 rounded-xl font-black uppercase text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all border border-blue-400/30">
                                <Users size={18} /> Consolidar Cliente
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
