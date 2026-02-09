
import React, { useState, useRef } from 'react';
import { useFunnel } from '../context/FunnelContext';
import { PageConfig } from '../types';
import { Layout, Download, Plus, Search, Palette, Upload, Settings, Copy, GripVertical, Undo2, Redo2, FlaskConical, Bot, Radio, LayoutTemplate, Trash2, Image as ImageIcon, ShieldCheck, AlertCircle, AlertTriangle, ChevronDown, ChevronUp, GitBranch, BarChart3 } from 'lucide-react';

interface SidebarProps {
    currentView: 'editor' | 'theme' | 'layout' | 'split-test' | 'events' | 'ai-assistant' | 'templates' | 'assets' | 'flow';
    onViewChange: (view: 'editor' | 'theme' | 'layout' | 'split-test' | 'events' | 'ai-assistant' | 'templates' | 'assets' | 'flow') => void;
}

const getQuizPhase = (path: string) => {
  const num = parseInt(path, 10);
  if (isNaN(num) || num <= 5) return { name: 'Identity', color: '#8b5cf6', letter: 'I' };
  if (num <= 15) return { name: 'Behavioral', color: '#3b82f6', letter: 'B' };
  if (num <= 25) return { name: 'Problem', color: '#f59e0b', letter: 'P' };
  return { name: 'Visualization', color: '#22c55e', letter: 'V' };
};

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const { config, activePageId, setActivePageId, addPage, duplicatePage, reorderPages, deletePage, downloadConfig, copyToClipboard, loadConfig, undo, redo, canUndo, canRedo, validateConfig } = useFunnel();
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [validationResults, setValidationResults] = useState<{ type: string; field: string; message: string; pageId?: string }[]>([]);

  const [showStats, setShowStats] = useState(false);

  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const handleAddPage = () => {
      const newId = `new-page-${Date.now()}`;
      const pageKeys = Object.keys(config.pages).filter(k => k !== '__template_preview__');
      const pageCount = pageKeys.length;

      // Smart template selection based on position in funnel
      let suggestedTemplate = 'image_button_template';
      let suggestedName = 'New Page';

      if (pageCount === 0) {
          suggestedTemplate = 'image_bullets_hero_template';
          suggestedName = 'Hero Landing';
      } else if (pageCount < 5) {
          suggestedTemplate = 'pick_hero_template';
          suggestedName = 'Question ' + (pageCount + 1);
      } else if (pageCount < 15) {
          suggestedTemplate = 'pick_single_item_template';
          suggestedName = 'Question ' + (pageCount + 1);
      } else if (pageCount < 25) {
          suggestedTemplate = 'pick_single_item_template';
          suggestedName = 'Question ' + (pageCount + 1);
      } else {
          suggestedTemplate = 'image_content_button_template';
          suggestedName = 'Results Page';
      }

      // Detect most commonly used template in recent pages
      const recentTemplates = pageKeys.slice(-5).map(k => config.pages[k]?.template).filter(Boolean);
      const templateCounts: Record<string, number> = {};
      recentTemplates.forEach(t => { templateCounts[t] = (templateCounts[t] || 0) + 1; });
      const mostUsedRecent = Object.entries(templateCounts).sort(([,a], [,b]) => b - a)[0];
      if (mostUsedRecent && mostUsedRecent[1] >= 3) {
          suggestedTemplate = mostUsedRecent[0];
      }

      addPage(newId, {
          name: suggestedName,
          path: (pageCount + 1).toString(),
          template: suggestedTemplate,
          template_data: {
              _title_text: "New Page Title",
              _sub_title_text: "Description goes here"
          },
          header: true
      });
      onViewChange('editor');
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
      setDraggedItem(id);
      e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      if (!draggedItem || draggedItem === targetId) return;

      const keys = Object.keys(config.pages);
      const fromIndex = keys.indexOf(draggedItem);
      const toIndex = keys.indexOf(targetId);

      if (fromIndex === -1 || toIndex === -1) return;

      const newOrder = [...keys];
      newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, draggedItem);

      reorderPages(newOrder);
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setDraggedItem(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          loadConfig(file);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleValidate = () => {
      const results = validateConfig();
      setValidationResults(results);
      setShowValidation(true);
  };

  const filteredPages = (Object.entries(config.pages) as [string, PageConfig][])
    .filter(([key, page]) =>
      // Hide the template preview page from sidebar list
      key !== '__template_preview__' &&
      ((page?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
       key.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  const errorCount = validationResults.filter(r => r.type === 'error').length;
  const warningCount = validationResults.filter(r => r.type === 'warning').length;

  return (
    <div className="flex flex-col h-full bg-[#1a1c23] text-white w-64 border-r border-gray-800 flex-shrink-0 z-30">
      <div className="p-4 border-b border-gray-800 bg-[#1a1c23]">
        <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
                <Layout className="text-[#f51721]" />
                <h1 className="font-bold text-lg tracking-tight">Funny Builder</h1>
            </div>
            <div className="flex gap-1">
                <button
                    type="button"
                    onClick={undo}
                    disabled={!canUndo}
                    className={`p-1 rounded hover:bg-gray-700 transition-colors ${!canUndo ? 'opacity-30 cursor-not-allowed' : 'text-gray-300'}`}
                    title="Undo (Ctrl+Z)"
                >
                    <Undo2 size={14} />
                </button>
                <button
                    type="button"
                    onClick={redo}
                    disabled={!canRedo}
                    className={`p-1 rounded hover:bg-gray-700 transition-colors ${!canRedo ? 'opacity-30 cursor-not-allowed' : 'text-gray-300'}`}
                    title="Redo (Ctrl+Y)"
                >
                    <Redo2 size={14} />
                </button>
            </div>
        </div>
        <p className="text-xs text-gray-500">v{config.version} &bull; {config.brand}</p>
      </div>

      <div className="p-2 border-b border-gray-800">
           <div className="grid grid-cols-3 gap-1 p-1 bg-gray-800 rounded-lg">
                <button
                    type="button"
                    onClick={() => onViewChange('editor')}
                    className={`flex flex-col items-center justify-center gap-1 py-2 px-1 text-[9px] font-bold rounded-md transition-all ${currentView === 'editor' ? 'bg-[#f51721] text-white shadow' : 'text-gray-400 hover:text-white'}`}
                >
                    <Layout size={14} /> Steps
                </button>
                <button
                    type="button"
                    onClick={() => onViewChange('templates')}
                    className={`flex flex-col items-center justify-center gap-1 py-2 px-1 text-[9px] font-bold rounded-md transition-all ${currentView === 'templates' ? 'bg-[#f51721] text-white shadow' : 'text-gray-400 hover:text-white'}`}
                >
                    <LayoutTemplate size={14} /> Tmpls
                </button>
                <button
                    type="button"
                    onClick={() => onViewChange('layout')}
                    className={`flex flex-col items-center justify-center gap-1 py-2 px-1 text-[9px] font-bold rounded-md transition-all ${currentView === 'layout' ? 'bg-[#f51721] text-white shadow' : 'text-gray-400 hover:text-white'}`}
                >
                    <Settings size={14} /> Layout
                </button>
                <button
                    type="button"
                    onClick={() => onViewChange('theme')}
                    className={`flex flex-col items-center justify-center gap-1 py-2 px-1 text-[9px] font-bold rounded-md transition-all ${currentView === 'theme' ? 'bg-[#f51721] text-white shadow' : 'text-gray-400 hover:text-white'}`}
                >
                    <Palette size={14} /> Theme
                </button>
                <button
                    type="button"
                    onClick={() => onViewChange('events')}
                    className={`flex flex-col items-center justify-center gap-1 py-2 px-1 text-[9px] font-bold rounded-md transition-all ${currentView === 'events' ? 'bg-[#f51721] text-white shadow' : 'text-gray-400 hover:text-white'}`}
                >
                    <Radio size={14} /> Events
                </button>
                <button
                    type="button"
                    onClick={() => onViewChange('split-test')}
                    className={`flex flex-col items-center justify-center gap-1 py-2 px-1 text-[9px] font-bold rounded-md transition-all ${currentView === 'split-test' ? 'bg-[#f51721] text-white shadow' : 'text-gray-400 hover:text-white'}`}
                >
                    <FlaskConical size={14} /> A/B
                </button>
                <button
                    type="button"
                    onClick={() => onViewChange('assets')}
                    className={`flex flex-col items-center justify-center gap-1 py-2 px-1 text-[9px] font-bold rounded-md transition-all ${currentView === 'assets' ? 'bg-[#f51721] text-white shadow' : 'text-gray-400 hover:text-white'}`}
                >
                    <ImageIcon size={14} /> Asset QC
                </button>
                <button
                    type="button"
                    onClick={() => onViewChange('flow')}
                    className={`flex flex-col items-center justify-center gap-1 py-2 px-1 text-[9px] font-bold rounded-md transition-all ${currentView === 'flow' ? 'bg-[#f51721] text-white shadow' : 'text-gray-400 hover:text-white'}`}
                >
                    <GitBranch size={14} /> Flow
                </button>
                <button
                    type="button"
                    onClick={() => onViewChange('ai-assistant')}
                    className={`flex flex-col items-center justify-center gap-1 py-2 px-1 text-[9px] font-bold rounded-md transition-all ${currentView === 'ai-assistant' ? 'bg-[#f51721] text-white shadow' : 'text-gray-400 hover:text-white'}`}
                >
                    <Bot size={14} /> AI
                </button>
           </div>
      </div>

      {/* Search + page count */}
      <div className="px-3 pt-2 pb-1">
          <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search steps..."
                className="w-full bg-gray-800 border-none rounded-lg py-2 pl-9 pr-14 text-sm text-gray-300 placeholder-gray-500 focus:ring-1 focus:ring-[#f51721]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[10px] text-gray-500 font-mono">{filteredPages.length} steps</span>
          </div>
      </div>

      {/* Quiz Phase Distribution Bar — compact */}
      {(() => {
        const allPages = Object.entries(config.pages).filter(([k]) => k !== '__template_preview__');
        const totalPages = allPages.length;
        if (totalPages === 0) return null;
        const identityCount = allPages.filter(([, p]) => { const n = parseInt((p as PageConfig)?.path || '0', 10); return !isNaN(n) && n >= 1 && n <= 5; }).length;
        const behavioralCount = allPages.filter(([, p]) => { const n = parseInt((p as PageConfig)?.path || '0', 10); return n >= 6 && n <= 15; }).length;
        const problemCount = allPages.filter(([, p]) => { const n = parseInt((p as PageConfig)?.path || '0', 10); return n >= 16 && n <= 25; }).length;
        const vizCount = allPages.filter(([, p]) => { const n = parseInt((p as PageConfig)?.path || '0', 10); return n >= 26; }).length;
        const phases = [
          { name: 'Identity', letter: 'I', color: '#8b5cf6', count: identityCount },
          { name: 'Behavioral', letter: 'B', color: '#3b82f6', count: behavioralCount },
          { name: 'Problem', letter: 'P', color: '#f59e0b', count: problemCount },
          { name: 'Visualization', letter: 'V', color: '#22c55e', count: vizCount },
        ].filter(ph => ph.count > 0);
        return (
          <div className="px-3 pb-1">
            <div className="flex h-4 rounded-md overflow-hidden gap-px">
              {phases.map(ph => (
                <div
                  key={ph.letter}
                  className="flex items-center justify-center text-[8px] font-bold text-white"
                  style={{ backgroundColor: ph.color, flex: ph.count }}
                  title={`${ph.name} Phase: ${ph.count} page${ph.count !== 1 ? 's' : ''}`}
                >
                  {ph.letter}:{ph.count}
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* === PAGE LIST — this is the main scrollable area === */}
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5 custom-scrollbar min-h-0">
        {filteredPages.map(([key, page]) => (
          <div
            key={key}
            draggable={!searchTerm}
            onDragStart={(e) => handleDragStart(e, key)}
            onDragOver={(e) => handleDragOver(e, key)}
            onDrop={handleDrop}
            onClick={() => { setActivePageId(key); onViewChange('editor'); }}
            className={`w-full px-2 py-1.5 rounded-lg text-[13px] transition-all flex items-center gap-1.5 group relative cursor-pointer ${
              activePageId === key && currentView === 'editor'
                ? 'bg-gray-800 text-white font-medium border-l-2 border-[#f51721]'
                : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
            } ${draggedItem === key ? 'opacity-50' : ''}`}
          >
            <div className={`cursor-move opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ${searchTerm ? 'hidden' : ''}`}>
                <GripVertical size={10} className="text-gray-600" />
            </div>

            <span className={`font-mono text-[9px] w-4 h-4 flex items-center justify-center rounded flex-shrink-0 ${activePageId === key ? 'bg-gray-700 text-gray-300' : 'bg-gray-800 text-gray-600'}`}>{page?.path || '?'}</span>
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: getQuizPhase(page?.path || '').color }}
              title={`${getQuizPhase(page?.path || '').name} Phase`}
            />
            <span className="truncate flex-1 select-none">{page?.name || 'Untitled'}</span>

            {/* Route indicator — shows on hover */}
            {(() => {
                const currentPathNum = parseInt(page?.path || '0');
                // Find events owned by this page
                let routeTarget: string | null = null;
                let isSeq = false;
                let hasCond = false;
                if (page?.template_data && config.event_routing) {
                    for (const val of Object.values(page.template_data)) {
                        if (typeof val === 'string' && config.event_routing[val]?.route?.to) {
                            routeTarget = config.event_routing[val].route.to;
                            isSeq = parseInt(routeTarget!) === currentPathNum + 1;
                            hasCond = Array.isArray(config.event_routing[val]?.route?.conditions) && config.event_routing[val].route.conditions.length > 0;
                            break;
                        }
                    }
                }
                if (!routeTarget) return null;
                return (
                    <span
                        className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 flex-shrink-0"
                        title={isSeq ? `Routes to next page (${routeTarget})` : `Custom route to page ${routeTarget}`}
                    >
                        {hasCond ? (
                            <GitBranch size={8} className="text-purple-400" />
                        ) : isSeq ? (
                            <span className="text-[7px] font-bold text-green-400">&#9654;{routeTarget}</span>
                        ) : (
                            <span className="text-[7px] font-bold text-amber-400">&#9654;{routeTarget}</span>
                        )}
                    </span>
                );
            })()}

            <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 transition-opacity flex-shrink-0">
                <button
                    type="button"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); duplicatePage(key); }}
                    className="p-0.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-all"
                    title="Duplicate Page"
                >
                    <Copy size={11} />
                </button>
                 <button
                    type="button"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                        e.stopPropagation();
                        if(window.confirm('Are you sure you want to delete this page?')) {
                             deletePage(key);
                        }
                    }}
                    className="p-0.5 hover:bg-red-900/50 rounded text-gray-400 hover:text-red-400 transition-all"
                    title="Delete Page"
                >
                    <Trash2 size={11} />
                </button>
            </div>
          </div>
        ))}
      </div>

      {/* === BOTTOM BAR — compact, fixed height === */}
      <div className="border-t border-gray-800 bg-[#1a1c23] flex-shrink-0">
        {/* Add + Validate row */}
        <div className="px-3 pt-2 pb-1 flex gap-2">
            <button
                type="button"
                onClick={handleAddPage}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-dashed border-gray-600 text-gray-400 hover:border-gray-400 hover:text-white transition-all text-xs font-medium"
            >
                <Plus size={14} /> Add Step
            </button>
            <button
                type="button"
                onClick={handleValidate}
                className="flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-bold rounded-lg border border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                title="Validate Config"
            >
                <ShieldCheck size={13} />
                {validationResults.length > 0 && (
                    <span className={`px-1 py-0.5 rounded-full text-[9px] font-bold ${errorCount > 0 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                        {errorCount > 0 ? errorCount : '✓'}
                    </span>
                )}
            </button>
        </div>

        {/* Validation results (expandable) */}
        {showValidation && validationResults.length > 0 && (
            <div className="mx-3 mb-1 max-h-24 overflow-y-auto space-y-1 bg-gray-900 rounded-lg p-2">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">
                        {errorCount} errors, {warningCount} warnings
                    </span>
                    <button onClick={() => setShowValidation(false)} className="text-gray-600 hover:text-gray-400">
                        <ChevronUp size={12} />
                    </button>
                </div>
                {validationResults.map((r, i) => (
                    <div key={i} className={`flex items-start gap-2 text-[10px] p-1 rounded ${r.type === 'error' ? 'bg-red-900/20 text-red-300' : 'bg-amber-900/20 text-amber-300'}`}>
                        {r.type === 'error' ? <AlertCircle size={10} className="flex-shrink-0 mt-0.5" /> : <AlertTriangle size={10} className="flex-shrink-0 mt-0.5" />}
                        <span>
                            {r.pageId && <strong className="text-gray-400">[{config.pages[r.pageId]?.name || r.pageId}] </strong>}
                            {r.message}
                        </span>
                    </div>
                ))}
            </div>
        )}
        {showValidation && validationResults.length === 0 && (
            <div className="mx-3 mb-1 p-1.5 bg-green-900/20 rounded-lg flex items-center gap-2 text-green-400 text-[10px] font-bold">
                <ShieldCheck size={12} /> Config valid!
            </div>
        )}

        {/* Config Stats — collapsible inline */}
        <div className="px-3 pb-1">
            <button
                type="button"
                onClick={() => setShowStats(!showStats)}
                className="w-full flex items-center gap-1.5 text-[10px] font-medium text-gray-500 hover:text-gray-300 transition-colors py-0.5"
            >
                <BarChart3 size={10} />
                <span>Stats</span>
                {(() => {
                    const pageKeys = Object.keys(config.pages).filter(k => k !== '__template_preview__');
                    return <span className="text-gray-600">{pageKeys.length}p · {Object.keys(config.templates).length}t · {Object.keys(config.event_routing || {}).length}e</span>;
                })()}
                <span className="ml-auto">{showStats ? <ChevronUp size={9} /> : <ChevronDown size={9} />}</span>
            </button>
            {showStats && (() => {
                const pageKeys = Object.keys(config.pages).filter(k => k !== '__template_preview__');
                const hasABTest = !!config.split_test?.experiment_id;
                const variationCount = config.split_test?.variations?.length || 0;
                return (
                    <div className="mt-1 bg-gray-800/50 rounded-lg p-2 text-[9px] text-gray-400 space-y-0.5 border border-gray-700/50">
                        <div>Brand: {config.brand} v{config.version} · A/B: {hasABTest ? <span className="text-green-400">{variationCount} var</span> : <span className="text-gray-600">off</span>}</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {Object.keys(config.templates)
                                .filter(k => k !== 'header' && k !== 'footer')
                                .map(templateKey => {
                                    const usageCount = (Object.values(config.pages) as PageConfig[]).filter(p => p.template === templateKey).length;
                                    return (
                                        <span
                                            key={templateKey}
                                            className={`text-[8px] px-1 py-0.5 rounded ${usageCount > 0 ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}
                                            title={`${templateKey}: ${usageCount} pages`}
                                        >
                                            {templateKey.replace(/_template$/, '').replace(/_/g, ' ').slice(0, 12)} {usageCount}
                                        </span>
                                    );
                                })
                            }
                        </div>
                    </div>
                );
            })()}
        </div>

        {/* Download + actions */}
        <div className="px-3 pb-3 space-y-1.5">
            <button
                type="button"
                onClick={downloadConfig}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#f51721] text-white font-bold rounded-full hover:bg-red-700 transition-colors shadow-lg shadow-red-900/20 text-sm"
            >
                <Download size={15} /> Download Config
            </button>
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => copyToClipboard(config)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[11px] text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors border border-gray-700"
                >
                    Copy
                </button>
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[11px] text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors border border-gray-700"
                >
                    <Upload size={11} /> Import
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".json,.txt"
                    className="hidden"
                />
            </div>
        </div>
      </div>
    </div>
  );
};
