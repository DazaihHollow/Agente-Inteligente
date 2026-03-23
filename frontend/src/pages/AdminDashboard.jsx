import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, FileText, Edit, Save, X, Search, ChevronDown, Calendar, MessageSquare, Package, TrendingUp, Sparkles, Bot, Trash2, Plus, RefreshCw } from 'lucide-react';
import { ChatWindow } from '../widgets/chat/ui/ChatWindow';

const AdminDashboard = () => {
    // Tab State
    const [activeTab, setActiveTab] = useState('sales'); // default to sales as requested

    // Inventory State
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

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAllData();
    }, [selectedMonth, selectedYear, selectedCustomer]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [statsRes, productsRes, salesRes, customersRes] = await Promise.all([
                axios.get('http://localhost:8000/reports/stats'),
                axios.get('http://localhost:8000/intelligence/products'),
                axios.get(`http://localhost:8000/reports/sales?month=${selectedMonth}&year=${selectedYear}&customer_name=${selectedCustomer}`),
                axios.get('http://localhost:8000/reports/customers')
            ]);
            setStats(statsRes.data);
            setProducts(productsRes.data);
            setSalesStats(salesRes.data);
            setCustomers(customersRes.data);
        } catch (error) {
            console.error("Error fetching admin data:", error);
        }
        setLoading(false);
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

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-[#070514] text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            <span className="ml-3 text-indigo-200 font-medium">Cargando inteligencia de negocio...</span>
        </div>
    );

    return (
        <div className={`bg-[#070514] text-white selection:bg-purple-600 ${activeTab === 'custom' ? 'h-screen overflow-hidden' : 'min-h-screen pb-20'}`}>
            {/* Header / Tabs */}
            <div className="bg-[#0d0a20]/90 border-b border-purple-900/30 sticky top-0 z-10 shadow-[0_4px_30px_rgba(139,92,246,0.1)] backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center gap-3">
                            <img src="/logo.png" alt="Epsilon Intelligence Logo" className="w-10 h-10 object-contain drop-shadow-[0_0_15px_rgba(168,85,247,0.5)] hover:scale-105 transition-transform" />
                            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-200 tracking-tight">Epsilon<span className="text-purple-400">Dash</span></h1>
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
                                        ? 'border-purple-500 text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]'
                                        : 'border-transparent text-indigo-300/50 hover:text-white hover:border-purple-800'
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
                            <h2 className="text-xl font-bold text-white drop-shadow-sm">Resumen General de Ventas</h2>
                            <div className="flex gap-4">
                                <select
                                    value={selectedCustomer}
                                    onChange={(e) => setSelectedCustomer(e.target.value)}
                                    className="bg-[#120e2b] text-white border border-purple-800/30 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none min-w-[150px] shadow-sm cursor-pointer"
                                >
                                    <option value="Todos">Todos los clientes</option>
                                    {customers.map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                    className="bg-[#120e2b] text-white border border-purple-800/30 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none shadow-sm cursor-pointer"
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
                                    className="bg-[#120e2b] text-white border border-purple-800/30 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none shadow-sm cursor-pointer"
                                >
                                    <option value={2024}>2024</option>
                                    <option value={2025}>2025</option>
                                    <option value={2026}>2026</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <div className="bg-[#120e2b] p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-purple-800/30 hover:border-purple-500/50 hover:shadow-purple-900/20 transition-all duration-300">
                                <div className="text-indigo-300/70 text-sm mb-1 uppercase tracking-wider font-semibold">Ganancias Totales</div>
                                <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-purple-200 drop-shadow-sm">${salesStats?.total_profit?.toLocaleString()}</div>
                            </div>
                            <div className="bg-[#120e2b] p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-purple-800/30 hover:border-blue-500/50 hover:shadow-blue-900/20 transition-all duration-300">
                                <div className="text-indigo-300/70 text-sm mb-1 uppercase tracking-wider font-semibold">Productos Vendidos</div>
                                <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-purple-200 drop-shadow-sm">{salesStats?.total_sold}</div>
                            </div>
                            <div className="bg-[#120e2b] p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-purple-800/30 hover:border-purple-500/50 hover:shadow-purple-900/20 transition-all duration-300">
                                <div className="text-indigo-300/70 text-sm mb-1 uppercase tracking-wider font-semibold">Ticket Promedio</div>
                                <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-purple-200 drop-shadow-sm">
                                    ${salesStats?.total_sold ? (salesStats.total_profit / salesStats.total_sold).toFixed(2) : 0}
                                </div>
                            </div>
                            <div className="bg-[#120e2b] p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-purple-800/30 hover:border-blue-500/50 hover:shadow-blue-900/20 transition-all duration-300">
                                <div className="text-indigo-300/70 text-sm mb-1 uppercase tracking-wider font-semibold">Clientes Activos</div>
                                <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-purple-200 drop-shadow-sm">{salesStats?.total_clients || 0}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-[#120e2b] p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-purple-800/30">
                                <h3 className="text-lg font-bold text-white mb-6 tracking-wide drop-shadow-sm">Hardware vs Software</h3>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={salesStats?.breakdown || []}
                                                dataKey="total"
                                                nameKey="category"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={100}
                                                label={{ fill: '#e2e8f0', fontSize: 12, fontWeight: 'bold' }}
                                                stroke="none"
                                            >
                                                {salesStats?.breakdown.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#8B5CF6' : index === 1 ? '#3B82F6' : '#C084FC'} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ backgroundColor: '#070514', borderColor: '#4C1D95', borderRadius: '12px', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                                            <Legend wrapperStyle={{ color: '#c7d2fe' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="bg-[#120e2b] p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-purple-800/30 overflow-hidden">
                                <h3 className="text-lg font-bold text-white mb-6 tracking-wide drop-shadow-sm">Desempeño por Vendedor</h3>
                                <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                                    {(salesStats?.seller_stats || []).map((seller) => (
                                        <div key={seller.name} className="p-4 bg-[#0d0a20] rounded-xl border border-purple-900/30 hover:border-purple-500/50 transition-colors">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="font-bold text-purple-100">{seller.name}</span>
                                                <span className="text-purple-400 font-black">${seller.total.toLocaleString()}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div className="flex justify-between p-2 bg-[#1a153a] rounded-lg border border-purple-800/20">
                                                    <span className="text-indigo-300">Software</span>
                                                    <span className="font-bold text-blue-400">${seller.software.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between p-2 bg-[#1a153a] rounded-lg border border-purple-800/20">
                                                    <span className="text-indigo-300">Hardware</span>
                                                    <span className="font-bold text-blue-400">${seller.hardware.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {(!salesStats?.seller_stats || salesStats.seller_stats.length === 0) && (
                                        <div className="text-center py-10 text-purple-300/50 italic">No hay datos de vendedores</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* INVENTORY TAB */}
                {activeTab === 'inventory' && (
                    <div className="animate-in fade-in duration-300">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-xl font-bold text-white drop-shadow-sm">Cerebro del Agente (Base de Conocimiento)</h2>
                            <div className="flex gap-4">
                                <button onClick={handleAddNew} className="bg-[#1a153a] text-purple-300 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#231d4d] border border-purple-800/50 hover:border-purple-500/50 transition font-bold shadow-sm">
                                    <Plus size={18} /> Añadir Regla Manual
                                </button>
                                <button onClick={() => handleDownload('pdf')} className="bg-[#120e2b] border border-red-900/50 text-red-400 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-900/20 transition">
                                    <FileText size={18} /> PDF
                                </button>
                                <button onClick={() => handleDownload('excel')} className="bg-[#120e2b] border border-green-900/50 text-green-400 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-900/20 transition">
                                    <Download size={18} /> Excel
                                </button>
                            </div>
                        </div>

                        <div className="bg-[#120e2b] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-purple-800/30 overflow-hidden">
                            <table className="min-w-full divide-y divide-purple-900/30">
                                <thead className="bg-[#0d0a20]">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-purple-300 uppercase tracking-wider">Concepto Sincronizado</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-purple-300 uppercase tracking-wider">Visibilidad</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-purple-300 uppercase tracking-wider">Instrucción IA (Oculta)</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-purple-300 uppercase tracking-wider">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-[#120e2b] divide-y divide-purple-900/20">
                                    {products.map((product) => (
                                        <tr key={product.id} className="hover:bg-[#1a153a] transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-white">{product.name}</div>
                                                <div className="text-xs text-indigo-200/70 truncate max-w-xs">{product.description}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${product.access_level === 'public' ? 'bg-green-900/30 text-green-400 border-green-800/50' : 'bg-red-900/30 text-red-400 border-red-800/50'
                                                    }`}>
                                                    {product.access_level.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-purple-300 max-w-[200px] truncate">{product.agent_instruction || <span className="text-indigo-300/50 italic">Sin instrucción especial...</span>}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right flex justify-end gap-2">
                                                <button onClick={() => handleRecalculate(product.id)} className="text-amber-500 hover:bg-amber-900/30 p-2 rounded-full transition" title="Recalcular Vector IA">
                                                    <RefreshCw size={18} />
                                                </button>
                                                <button onClick={() => handleEdit(product)} className="text-purple-400 hover:bg-purple-900/30 p-2 rounded-full transition" title="Editar Contexto">
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

                {/* CUSTOM TAB (IA DRIVEN) */}
                {activeTab === 'custom' && (
                    <div className="animate-in zoom-in-95 duration-300 flex-1 flex flex-col min-h-0">
                        <ChatWindow userRole="admin" />
                    </div>
                )}
            </main>

            {/* Edit Modal (Existing logic) */}
            {editingProduct && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#120e2b] rounded-2xl p-8 max-w-md w-full shadow-[0_10px_40px_rgba(139,92,246,0.2)] border border-purple-800/50">
                        <h2 className="text-2xl font-black text-white mb-6 drop-shadow-sm">{editingProduct.id ? 'Afinar Contexto del Asistente' : 'Añadir Regla Manual'}</h2>

                        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                            <div>
                                <label className="block text-sm font-bold text-indigo-200/80 mb-2 uppercase tracking-wide">Concepto (Ej. Producto)</label>
                                <input
                                    type="text"
                                    value={editingProduct.name}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                                    className="w-full bg-[#0d0a20] border border-purple-800/30 text-white rounded-xl p-3 focus:ring-2 focus:ring-purple-500 outline-none hover:border-purple-600/50 transition placeholder-purple-900/50"
                                    placeholder="Nombre del producto o regla"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-indigo-200/80 mb-2 uppercase tracking-wide">Descripción</label>
                                <textarea
                                    value={editingProduct.description || ''}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                                    className="w-full bg-[#0d0a20] border border-purple-800/30 text-white rounded-xl p-3 focus:ring-2 focus:ring-purple-500 outline-none hover:border-purple-600/50 transition placeholder-purple-900/50"
                                    rows="2"
                                    placeholder="Descripción general"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-indigo-200/80 mb-2 uppercase tracking-wide">Precio ($)</label>
                                    <input
                                        type="number"
                                        value={editingProduct.price || 0}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })}
                                        className="w-full bg-[#0d0a20] border border-purple-800/30 text-white rounded-xl p-3 focus:ring-2 focus:ring-purple-500 outline-none hover:border-purple-600/50 transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-indigo-200/80 mb-2 uppercase tracking-wide">Stock Relevante</label>
                                    <input
                                        type="number"
                                        value={editingProduct.stock || 0}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) })}
                                        className="w-full bg-[#0d0a20] border border-purple-800/30 text-white rounded-xl p-3 focus:ring-2 focus:ring-purple-500 outline-none hover:border-purple-600/50 transition"
                                    />
                                </div>
                            </div>
                            
                            <div className="bg-purple-900/20 p-4 rounded-xl border border-purple-500/30">
                                <label className="block text-sm font-bold text-purple-300 mb-2 uppercase tracking-wide flex items-center gap-2">
                                    <Bot size={16} /> Instrucción Oculta para el Agente (RAG)
                                </label>
                                <p className="text-xs text-purple-200/70 mb-2">Dicta cómo debe responder la IA cuando se mencione este concepto.</p>
                                <textarea
                                    value={editingProduct.agent_instruction || ''}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, agent_instruction: e.target.value })}
                                    className="w-full bg-[#0a0818] border border-purple-800/30 text-white rounded-xl p-3 focus:ring-2 focus:ring-purple-500 outline-none hover:border-purple-600/50 transition text-sm placeholder-purple-900/50"
                                    rows="3"
                                    placeholder="Ej. 'Si el usuario pregunta por Alpha System, infórmale del 20% de descuento y prioriza soporte VIP.'"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-indigo-200/80 mb-2 uppercase tracking-wide">Nivel de Visibilidad</label>
                                <select
                                    value={editingProduct.access_level}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, access_level: e.target.value })}
                                    className="w-full bg-[#0d0a20] border border-purple-800/30 text-white rounded-xl p-3 focus:ring-2 focus:ring-purple-500 outline-none hover:border-purple-600/50 transition cursor-pointer"
                                >
                                    <option value="public">🌐 Público (Visible para clientes)</option>
                                    <option value="private">🔒 Privado (Solo uso interno)</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-10 flex justify-end gap-4">
                            <button onClick={() => setEditingProduct(null)} className="px-6 py-3 font-bold text-indigo-300/60 hover:text-indigo-100 transition-colors">Cancelar</button>
                            <button onClick={handleSave} className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:from-purple-500 hover:to-blue-500 shadow-lg shadow-purple-900/50 flex items-center gap-2 border border-purple-500/50 transition-all cursor-pointer">
                                <Save size={18} /> {editingProduct.id ? 'Guardar Cambios' : 'Crear Producto'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
