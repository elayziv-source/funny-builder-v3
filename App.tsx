
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FunnelProvider, useFunnel } from './context/FunnelContext';
import { Sidebar } from './components/Sidebar';
import { StepEditor } from './components/editor/StepEditor';
import { ThemeEditor } from './components/ThemeEditor';
import { LayoutEditor } from './components/LayoutEditor';
import { SplitTestEditor } from './components/SplitTestEditor';
import { EventsEditor } from './components/EventsEditor';
import { AiAssistant } from './components/AiAssistant';
import { TemplateEditor } from './components/TemplateEditor';
import { AssetOptimizer } from './components/AssetOptimizer';
import { FunnelFlowView } from './components/FunnelFlowView';
import { LivePreview } from './components/LivePreview';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';

// --- Toast Notification Component ---
const Toast: React.FC = () => {
    const { notification, clearNotification } = useFunnel();

    if (!notification) return null;

    const icons = {
        success: <CheckCircle size={18} className="text-green-500 flex-shrink-0" />,
        error: <AlertCircle size={18} className="text-red-500 flex-shrink-0" />,
        warning: <AlertTriangle size={18} className="text-amber-500 flex-shrink-0" />,
        info: <Info size={18} className="text-blue-500 flex-shrink-0" />
    };

    const bgColors = {
        success: 'bg-green-50 border-green-200 text-green-900',
        error: 'bg-red-50 border-red-200 text-red-900',
        warning: 'bg-amber-50 border-amber-200 text-amber-900',
        info: 'bg-blue-50 border-blue-200 text-blue-900'
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border ${bgColors[notification.type]} max-w-md`}>
                {icons[notification.type]}
                <span className="text-sm font-medium flex-1">{notification.message}</span>
                <button onClick={clearNotification} className="p-0.5 hover:bg-black/5 rounded">
                    <X size={14} />
                </button>
            </div>
        </div>
    );
};

// Component to dynamically load Google Fonts based on config
const FontLoader = () => {
    const { config } = useFunnel();

    useEffect(() => {
        // Extract font families from theme.fonts config
        const fontFamilies = new Set<string>();
        if (config.theme?.fonts) {
            Object.values(config.theme.fonts).forEach(fontStr => {
                const match = (fontStr as string).match(/'([^']+)'/);
                if (match && match[1]) {
                    fontFamilies.add(match[1]);
                }
            });
        }

        if (fontFamilies.size === 0) return;

        const fontsArray = Array.from(fontFamilies);
        const query = fontsArray.map(f => `family=${f.replace(/ /g, '+')}:wght@400;700;900`).join('&');
        const href = `https://fonts.googleapis.com/css2?${query}&display=swap`;

        let link = document.querySelector(`link[href="${href}"]`);
        if (!link) {
            link = document.createElement('link');
            link.setAttribute('rel', 'stylesheet');
            link.setAttribute('href', href);
            document.head.appendChild(link);
        }
    }, [config.theme?.fonts]);

    return null;
}

const AppContent: React.FC = () => {
    const { setActivePageId } = useFunnel();
    const [view, setView] = useState<'editor' | 'theme' | 'layout' | 'split-test' | 'events' | 'ai-assistant' | 'templates' | 'assets' | 'flow'>('editor');
    const [editorWidth, setEditorWidth] = useState(500);
    const [isResizing, setIsResizing] = useState(false);
    const sidebarWidth = 256; // w-64 is 16rem = 256px

    // Auto-resize for templates and assets view
    useEffect(() => {
        if ((view === 'templates' || view === 'assets' || view === 'flow') && editorWidth < 800) {
            setEditorWidth(900);
        } else if (view !== 'templates' && view !== 'assets' && view !== 'flow' && editorWidth > 600) {
            setEditorWidth(500);
        }
    }, [view]);

    const startResizing = useCallback(() => {
        setIsResizing(true);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, []);

    const stopResizing = useCallback(() => {
        setIsResizing(false);
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
    }, []);

    const resize = useCallback((e: MouseEvent) => {
        if (isResizing) {
            const newWidth = e.clientX - sidebarWidth;
            if (newWidth > 350 && newWidth < window.innerWidth - 400) {
                setEditorWidth(newWidth);
            }
        }
    }, [isResizing]);

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', resize);
            window.addEventListener('mouseup', stopResizing);
        }
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [isResizing, resize, stopResizing]);

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-gray-50 text-[#0A0908]">
            <FontLoader />
            <Toast />
            <Sidebar currentView={view} onViewChange={setView} />
            <div className="flex flex-1 overflow-hidden relative">
                {/* Dynamic Left Panel */}
                <div
                    className="flex-shrink-0 h-full z-10 transition-all duration-75 bg-white flex flex-col"
                    style={{ width: editorWidth }}
                >
                    {view === 'editor' && <StepEditor />}
                    {view === 'theme' && <ThemeEditor />}
                    {view === 'layout' && <LayoutEditor />}
                    {view === 'split-test' && <SplitTestEditor />}
                    {view === 'events' && <EventsEditor />}
                    {view === 'ai-assistant' && <AiAssistant />}
                    {view === 'templates' && <TemplateEditor />}
                    {view === 'assets' && <AssetOptimizer />}
                    {view === 'flow' && <FunnelFlowView onSelectPage={(pageId) => { setActivePageId(pageId); setView('editor'); }} />}
                </div>

                {/* Resize Handle */}
                <div
                    className="w-1.5 h-full bg-gray-200 hover:bg-[#f51721] cursor-col-resize z-20 flex flex-col justify-center items-center transition-colors group relative flex-shrink-0"
                    onMouseDown={startResizing}
                >
                     <div className="absolute inset-y-0 -left-1 -right-1 z-10"></div> {/* Hit area */}
                     <div className="h-8 w-1 bg-gray-400 rounded-full group-hover:bg-white transition-colors"></div>
                </div>

                {/* Preview Panel (Always visible) */}
                <div className="flex-1 h-full relative bg-gray-100 shadow-inner min-w-0">
                    <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-50 pointer-events-none"></div>
                    <LivePreview />
                </div>
            </div>
        </div>
    );
}

const App: React.FC = () => {
  return (
    <FunnelProvider>
      <AppContent />
    </FunnelProvider>
  );
};

export default App;
