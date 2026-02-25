import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, FileText, Edit, Save, X, Search, ChevronDown, Calendar, MessageSquare, Package, TrendingUp, Sparkles } from 'lucide-react';
import { ChatWidget } from '../components/ChatWidget';

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
            await axios.put(`http://localhost:8000/intelligence/products/${editingProduct.id}`, {
                name: editingProduct.name,
                description: editingProduct.description,
                access_level: editingProduct.access_level
            });
            setEditingProduct(null);
            fetchAllData();
        } catch (error) {
            alert("Error al guardar: " + error.message);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-gray-600 font-medium">Cargando inteligencia de negocio...</span>
        </div>
    );

    return (
        <div className="bg-gray-50 min-h-screen pb-20">
            {/* Header / Tabs */}
            <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-600 p-2 rounded-lg">
                                <TrendingUp className="text-white" size={24} />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Admin<span className="text-indigo-600">Dash</span></h1>
                        </div>

                        <nav className="flex space-x-8">
                            {[
                                { id: 'inventory', label: 'Inventario', icon: Package },
                                { id: 'sales', label: 'Ventas', icon: TrendingUp },
                                { id: 'custom', label: 'Personalizado', icon: Sparkles },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-all duration-200 ${activeTab === tab.id
                                        ? 'border-indigo-600 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* SALES TAB */}
                {activeTab === 'sales' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-xl font-bold text-gray-800">Resumen General de Ventas</h2>
                            <div className="flex gap-4">
                                <select
                                    value={selectedCustomer}
                                    onChange={(e) => setSelectedCustomer(e.target.value)}
                                    className="bg-white border border-gray-300 rounded-md px-4 py-2 text-sm focus:ring-indigo-500 outline-none min-w-[150px]"
                                >
                                    <option value="Todos">Todos los clientes</option>
                                    {customers.map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                    className="bg-white border border-gray-300 rounded-md px-4 py-2 text-sm focus:ring-indigo-500 outline-none"
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
                                    className="bg-white border border-gray-300 rounded-md px-4 py-2 text-sm focus:ring-indigo-500 outline-none"
                                >
                                    <option value={2024}>2024</option>
                                    <option value={2025}>2025</option>
                                    <option value={2026}>2026</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
                                <div className="text-gray-500 text-sm mb-1 uppercase tracking-wider font-semibold">Ganancias Totales</div>
                                <div className="text-3xl font-bold text-gray-900">${salesStats?.total_profit?.toLocaleString()}</div>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <div className="text-gray-500 text-sm mb-1 uppercase tracking-wider font-semibold">Productos Vendidos</div>
                                <div className="text-3xl font-bold text-gray-900">{salesStats?.total_sold}</div>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <div className="text-gray-500 text-sm mb-1 uppercase tracking-wider font-semibold">Ticket Promedio</div>
                                <div className="text-3xl font-bold text-gray-900">
                                    ${salesStats?.total_sold ? (salesStats.total_profit / salesStats.total_sold).toFixed(2) : 0}
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <div className="text-gray-500 text-sm mb-1 uppercase tracking-wider font-semibold">Clientes Activos</div>
                                <div className="text-3xl font-bold text-gray-900">{salesStats?.total_clients || 0}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-800 mb-6">Hardware vs Software</h3>
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
                                                label
                                            >
                                                {salesStats?.breakdown.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#4F46E5' : index === 1 ? '#10B981' : '#F59E0B'} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <h3 className="text-lg font-bold text-gray-800 mb-6">Desempeño por Vendedor</h3>
                                <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                                    {(salesStats?.seller_stats || []).map((seller) => (
                                        <div key={seller.name} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="font-bold text-gray-900">{seller.name}</span>
                                                <span className="text-indigo-600 font-bold">${seller.total.toLocaleString()}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div className="flex justify-between p-2 bg-white rounded-lg border border-gray-100">
                                                    <span className="text-gray-500">Software</span>
                                                    <span className="font-semibold text-green-600">${seller.software.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between p-2 bg-white rounded-lg border border-gray-100">
                                                    <span className="text-gray-500">Hardware</span>
                                                    <span className="font-semibold text-blue-600">${seller.hardware.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {(!salesStats?.seller_stats || salesStats.seller_stats.length === 0) && (
                                        <div className="text-center py-10 text-gray-400 italic">No hay datos de vendedores</div>
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
                            <h2 className="text-xl font-bold text-gray-800">Gestión de Inventario</h2>
                            <div className="flex gap-4">
                                <button onClick={() => handleDownload('pdf')} className="bg-white border border-red-200 text-red-600 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-50 transition">
                                    <FileText size={18} /> PDF
                                </button>
                                <button onClick={() => handleDownload('excel')} className="bg-white border border-green-200 text-green-600 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-50 transition">
                                    <Download size={18} /> Excel
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Producto</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Nivel de Acceso</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {products.map((product) => (
                                        <tr key={product.id} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900">{product.name}</div>
                                                <div className="text-xs text-gray-500 truncate max-w-xs">{product.description}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${product.access_level === 'public' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {product.access_level.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => handleEdit(product)} className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-full transition">
                                                    <Edit size={18} />
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
                    <div className="animate-in zoom-in-95 duration-300">
                        <div className="mb-8 flex flex-col md:flex-row gap-4 items-center">
                            <div className="relative flex-1 group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition" size={20} />
                                <input
                                    type="text"
                                    value={customQuery}
                                    onChange={(e) => setCustomQuery(e.target.value)}
                                    placeholder="Pregúntale al dashboard: 'Ventas de software en región Norte por clientes corporativos'..."
                                    className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                />
                            </div>
                            <button
                                onClick={handleCustomAnalyze}
                                disabled={customLoading}
                                className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition flex items-center gap-2 shadow-lg shadow-indigo-200 disabled:opacity-50"
                            >
                                {customLoading ? <div className="animate-spin h-5 w-5 border-2 border-white border-b-transparent rounded-full" /> : <Sparkles size={20} />}
                                Generar Dashboard
                            </button>
                        </div>

                        {customData ? (
                            <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                                {/* Dynamic KPI Cards for Custom View */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                        <div className="text-gray-500 text-xs mb-1 uppercase tracking-wider font-semibold">Profit (Filtro)</div>
                                        <div className="text-3xl font-bold text-indigo-600">${customData.kpis?.total_profit?.toLocaleString()}</div>
                                    </div>
                                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                        <div className="text-gray-500 text-xs mb-1 uppercase tracking-wider font-semibold">Unidades (Filtro)</div>
                                        <div className="text-3xl font-bold text-gray-900">{customData.kpis?.total_sold}</div>
                                    </div>
                                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                        <div className="text-gray-500 text-xs mb-1 uppercase tracking-wider font-semibold">TKT Promedio</div>
                                        <div className="text-3xl font-bold text-gray-900">${customData.kpis?.avg_ticket?.toFixed(2)}</div>
                                    </div>
                                </div>

                                <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
                                    <div className="flex justify-between items-center mb-10">
                                        <h3 className="text-2xl font-bold text-gray-800">{customData.title}</h3>
                                        <div className="relative group">
                                            <button className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg font-semibold text-gray-700 hover:bg-gray-200 transition">
                                                Exportar <ChevronDown size={16} />
                                            </button>
                                            <div className="absolute right-0 mt-2 w-48 bg-white border rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                                                <button
                                                    onClick={() => handleCustomExport('pdf')}
                                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-t-xl"
                                                >
                                                    Como PDF (.pdf)
                                                </button>
                                                <button
                                                    onClick={() => handleCustomExport('excel')}
                                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-b-xl"
                                                >
                                                    Como Excel (.xlsx)
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="h-96">
                                        {customData.data.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                {customData.chart_type === 'pie' ? (
                                                    <PieChart>
                                                        <Pie data={customData.data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label>
                                                            {customData.data.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index % 5]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip />
                                                        <Legend />
                                                    </PieChart>
                                                ) : (
                                                    <BarChart data={customData.data}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                        <XAxis dataKey="name" />
                                                        <YAxis />
                                                        <Tooltip cursor={{ fill: '#F3F4F6' }} />
                                                        <Bar dataKey="value" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                                                    </BarChart>
                                                )}
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-gray-400">
                                                No se encontraron datos para estos criterios.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white p-20 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
                                <div className="bg-indigo-50 p-4 rounded-full mb-4">
                                    <Sparkles className="text-indigo-400" size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">Dashboard de IA Inteligente</h3>
                                <p className="text-gray-500 max-w-md">Escribe una pregunta arriba para que el agente procese los datos y cree una visualización personalizada para ti.</p>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Admin Chat Integrated */}
            <ChatWidget adminMode={true} />

            {/* Edit Modal (Existing logic) */}
            {editingProduct && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
                        <h2 className="text-2xl font-bold mb-6">Editar Producto</h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Nombre del Producto</label>
                                <input
                                    type="text"
                                    value={editingProduct.name}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                                    className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none hover:border-gray-300 transition"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Nivel de Visibilidad</label>
                                <select
                                    value={editingProduct.access_level}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, access_level: e.target.value })}
                                    className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none hover:border-gray-300 transition"
                                >
                                    <option value="public">🌐 Público (Visible para clientes)</option>
                                    <option value="private">🔒 Privado (Solo uso interno)</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-10 flex justify-end gap-4">
                            <button onClick={() => setEditingProduct(null)} className="px-6 py-3 font-bold text-gray-500 hover:text-gray-700">Cancelar</button>
                            <button onClick={handleSave} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 flex items-center gap-2">
                                <Save size={18} /> Guardar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
