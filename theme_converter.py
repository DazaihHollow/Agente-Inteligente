import re

file_path = r'c:\Users\Miguiel Amaya Vargas\Desktop\Project Agent\Agente-Inteligente\frontend\src\pages\AdminDashboard.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add theme state
theme_state = """    const [activeTheme, setActiveTheme] = useState('oscuro');
    const [showThemeMenu, setShowThemeMenu] = useState(false);
"""
if "const [activeTheme" not in content:
    content = content.replace("    const [revenueCurrency, setRevenueCurrency] = useState('USD');", "    const [revenueCurrency, setRevenueCurrency] = useState('USD');\n" + theme_state)

# Replace hardcoded colors with CSS variables (Tailwind arbitrary values)
replacements = {
    # Backgrounds
    r'bg-\[\#070514\]': 'bg-[var(--bg-main)]',
    r'bg-\[\#120e2b\]': 'bg-[var(--bg-card)]',
    r'bg-\[\#0d0a20\]/90': 'bg-[var(--bg-nav)]',
    r'bg-\[\#0d0a20\]': 'bg-[var(--bg-input)]',
    r'bg-\[\#1a153a\]': 'bg-[var(--bg-item)]',
    r'bg-\[\#231d4d\]': 'bg-[var(--bg-item-hover)]',
    r'hover:bg-\[\#231d4d\]': 'hover:bg-[var(--bg-item-hover)]',
    r'hover:bg-\[\#1a153a\]': 'hover:bg-[var(--bg-item-hover)]',
    # Borders
    r'border-purple-900/30': 'border-[var(--border-subtle)]',
    r'border-purple-800/30': 'border-[var(--border-base)]',
    r'border-purple-800/50': 'border-[var(--border-strong)]',
    r'border-purple-800/20': 'border-[var(--border-faint)]',
    r'border-purple-900/20': 'border-[var(--border-faint)]',
    r'hover:border-purple-500/50': 'hover:border-[var(--border-hover)]',
    r'hover:border-purple-800': 'hover:border-[var(--border-hover-alt)]',
    r'border-purple-500': 'border-[var(--border-hover-alt)]',
    # Texts
    r'text-white': 'text-[var(--text-main)]',
    r'text-indigo-200': 'text-[var(--text-muted)]',
    r'text-indigo-300': 'text-[var(--text-sec)]',
    r'text-purple-300': 'text-[var(--text-accent)]',
    r'text-purple-400': 'text-[var(--text-highlight)]',
    r'text-purple-100': 'text-[var(--text-bright)]',
    # Specific text shades
    r'text-indigo-300/50': 'text-[var(--text-sec)] opacity-50',
    r'text-indigo-300/70': 'text-[var(--text-sec)] opacity-70',
    # Gradients and shadows
    r'from-white to-indigo-200': 'from-[var(--grad-start)] to-[var(--grad-end)]',
    r'from-white to-purple-200': 'from-[var(--grad-start)] to-[var(--grad-end)]',
    r'from-indigo-500 to-purple-600': 'from-[var(--btn-start)] to-[var(--btn-end)]',
    r'from-purple-600 to-blue-600': 'from-[var(--btn-start)] to-[var(--btn-end)]',
    # Selection
    r'selection:bg-purple-600': 'selection:bg-[var(--selection)]',
    # Ring
    r'focus:ring-purple-500': 'focus:ring-[var(--focus-ring)]',
}

for k, v in replacements.items():
    content = re.sub(k, v, content)

# But wait, there are SVG icons imported like Package, TrendingUp, Bot, FileText, Download, Edit, Trash2, Plus, RefreshCw, Search
# I need to insert the Brush icon too!
if "Brush" not in content:
    content = content.replace("Package,", "Package, Brush,")

# Render the styles dynamically
style_block = """
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
"""

# Replace top wrapper to include theme
if "className={`theme-${activeTheme} bg-[var(--bg-main)]" not in content:
    content = content.replace("className={`bg-[var(--bg-main)] text-[var(--text-main)] selection:bg-[var(--selection)]", "className={`theme-${activeTheme} bg-[var(--bg-main)] text-[var(--text-main)] selection:bg-[var(--selection)] transition-colors duration-500")

    content = content.replace("className={`bg-[#070514] text-[var(--text-main)] selection:bg-[var(--selection)]", "className={`theme-${activeTheme} bg-[var(--bg-main)] text-[var(--text-main)] selection:bg-[var(--selection)] transition-colors duration-500")

    content = content.replace("className={`bg-[var(--bg-main)] text-white selection:bg-purple-600", "className={`theme-${activeTheme} bg-[var(--bg-main)] text-[var(--text-main)] selection:bg-[var(--selection)] transition-colors duration-500")

    content = content.replace("className={`bg-[#070514] text-white selection:bg-purple-600", "className={`theme-${activeTheme} bg-[var(--bg-main)] text-[var(--text-main)] selection:bg-[var(--selection)] transition-colors duration-500")


# Add the style block right after the first div (or wrap the main div contents)
if ".theme-oscuro {" not in content:
    # insert after the main <div className={`theme-${activeTheme}...
    # find exactly that line
    pattern = r'(className=\{`theme-\$\{activeTheme\}[^`]*`\}[^>]*>)'
    content = re.sub(pattern, r'\1\n' + style_block, content)

# Add the Paintbrush button and menu right after the logo
button_html = """
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
"""

# Insert right after the logo section:
logo_pattern = r'(<h1[^>]*>Epsilon <span[^>]*>Intelligence</span></h1>\s*.*?</div>)'
if "Theme Selector" not in content:
    content = re.sub(logo_pattern, r'\1\n' + button_html, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Theme integration complete.")
