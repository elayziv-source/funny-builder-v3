
import React, { useState, useMemo } from 'react';
import { useFunnel } from '../context/FunnelContext';
import { PageConfig } from '../types';
import { ExportMenu } from './ui/ExportMenu';
import { Plus, Trash2, Radio, Target, Activity, Search, ChevronDown, ChevronUp, ArrowRight, Database, Megaphone, GitBranch, MousePointer, Scroll, Copy, Filter, Zap } from 'lucide-react';

// --- Event Pattern Detection ---

type EventPattern = 'navigate' | 'capture' | 'broadcast' | 'multi_single' | 'multi_submit' | 'scroll' | 'checkout' | 'condition';

const detectPatterns = (logic: any): EventPattern[] => {
    const patterns: EventPattern[] = [];
    if (logic.route?.to) patterns.push('navigate');
    if (logic.route?.conditions?.length) patterns.push('condition');
    if (logic.quiz_answer) patterns.push('capture');
    if (logic.broadcast && Object.keys(logic.broadcast).length > 0) patterns.push('broadcast');
    if (logic.scroll) patterns.push('scroll');
    if (logic.checkout) patterns.push('checkout');
    return patterns;
};

const PATTERN_CONFIG: Record<EventPattern, { label: string; color: string; bg: string }> = {
    navigate: { label: 'Route', color: '#2563eb', bg: '#dbeafe' },
    condition: { label: 'Conditional', color: '#7c3aed', bg: '#ede9fe' },
    capture: { label: 'Data', color: '#059669', bg: '#d1fae5' },
    broadcast: { label: 'Pixel', color: '#d97706', bg: '#fef3c7' },
    multi_single: { label: 'Multi-Store', color: '#0891b2', bg: '#cffafe' },
    multi_submit: { label: 'Multi-Nav', color: '#0891b2', bg: '#cffafe' },
    scroll: { label: 'Scroll', color: '#6b7280', bg: '#f3f4f6' },
    checkout: { label: 'Checkout', color: '#dc2626', bg: '#fee2e2' },
};

// --- Condition Operators ---
const CONDITION_OPERATORS = [
    { value: 'eq', label: '= Equals' },
    { value: 'neq', label: '≠ Not Equals' },
    { value: 'gt', label: '> Greater Than' },
    { value: 'lt', label: '< Less Than' },
    { value: 'gte', label: '≥ Greater or Equal' },
    { value: 'lte', label: '≤ Less or Equal' },
    { value: 'contains', label: '∋ Contains' },
    { value: 'not_between', label: '∉ Not Between' },
    { value: 'empty', label: '∅ Is Empty' },
    { value: 'present', label: '✓ Has Value' },
];

// --- Quick-Add Templates ---
const EVENT_TEMPLATES = [
    {
        label: 'Single Select → Navigate',
        icon: <MousePointer size={12} />,
        create: (suffix: string) => ({
            [`${suffix}_selected`]: {
                route: { to: '' },
                quiz_answer: suffix,
                broadcast: { db: { event_name: `${suffix}_selected` } }
            }
        })
    },
    {
        label: 'Multi-Select (Store + Navigate)',
        icon: <GitBranch size={12} />,
        create: (suffix: string) => ({
            [`single_${suffix}_selected`]: { quiz_answer: suffix },
            [`${suffix}_selected`]: { route: { to: '' } }
        })
    },
    {
        label: 'Interstitial (View → Next)',
        icon: <ArrowRight size={12} />,
        create: (suffix: string) => ({
            [`${suffix}_seen`]: { route: { to: '' } }
        })
    },
    {
        label: 'Input + Validate',
        icon: <Database size={12} />,
        create: (suffix: string) => ({
            [`${suffix}_input`]: { quiz_answer: suffix },
            [`${suffix}_selected`]: { route: { to: '' } }
        })
    },
    {
        label: 'Broadcast Only (Pixel Fire)',
        icon: <Megaphone size={12} />,
        create: (suffix: string) => ({
            [suffix]: {
                broadcast: {
                    facebook: { event_name: suffix },
                    db: { event_name: suffix }
                }
            }
        })
    },
    {
        label: 'Conditional Branch',
        icon: <GitBranch size={12} />,
        create: (suffix: string) => ({
            [`${suffix}_selected`]: {
                route: {
                    to: '',
                    conditions: [
                        { field: suffix, operator: 'eq', value: '', target: '' }
                    ]
                },
                quiz_answer: suffix
            }
        })
    },
    {
        label: 'Personalized Fork (Age/Type)',
        icon: <Filter size={12} />,
        create: (suffix: string) => ({
            [`${suffix}_selected`]: {
                route: {
                    to: '',
                    conditions: [
                        { field: suffix, operator: 'eq', value: 'option_1', target: '' },
                        { field: suffix, operator: 'eq', value: 'option_2', target: '' },
                        { field: suffix, operator: 'eq', value: 'option_3', target: '' },
                    ]
                },
                quiz_answer: suffix,
                broadcast: {
                    db: { event_name: `${suffix}_selected` },
                    facebook: { event_name: `QuizFork_${suffix}` }
                }
            }
        })
    },
];

export const EventsEditor: React.FC = () => {
    const { config, updateEvents, downloadAsText, copyToClipboard } = useFunnel();

    const eventRouting = config.event_routing || {};
    const broadcastTargets = config.broadcast_targets || {};

    const [activeTab, setActiveTab] = useState<'routing' | 'targets'>('routing');
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [quickAddSuffix, setQuickAddSuffix] = useState('');
    const [filterPattern, setFilterPattern] = useState<EventPattern | 'all'>('all');

    // Build page → event reference map
    const pageEventMap = useMemo(() => {
        const map: Record<string, string[]> = {};
        (Object.entries(config.pages) as [string, PageConfig][]).forEach(([pageId, page]) => {
            if (!page.template_data) return;
            Object.values(page.template_data).forEach((val) => {
                if (typeof val === 'string' && eventRouting[val]) {
                    if (!map[val]) map[val] = [];
                    if (!map[val].includes(page.name || pageId)) {
                        map[val].push(page.name || pageId);
                    }
                }
            });
        });
        return map;
    }, [config.pages, eventRouting]);

    // Available paths for dropdowns
    const availablePaths = useMemo(() => {
        return (Object.entries(config.pages) as [string, PageConfig][])
            .filter(([key]) => key !== '__template_preview__')
            .map(([key, page]) => ({
                path: page.path,
                name: page.name || key
            }))
            .sort((a, b) => parseInt(a.path) - parseInt(b.path));
    }, [config.pages]);

    const handleRoutingChange = (key: string, field: string, value: any) => {
        const newRouting = { ...eventRouting };
        if (!newRouting[key]) newRouting[key] = {};

        if (field.includes('.')) {
            const parts = field.split('.');
            let current = newRouting[key];
            for (let i = 0; i < parts.length - 1; i++) {
                if (!current[parts[i]]) current[parts[i]] = {};
                current = current[parts[i]];
            }
            current[parts[parts.length - 1]] = value;
        } else {
            newRouting[key][field] = value;
        }
        updateEvents({ event_routing: newRouting });
    };

    const deleteRouting = (key: string) => {
        const newRouting = { ...eventRouting };
        delete newRouting[key];
        updateEvents({ event_routing: newRouting });
    };

    const addRouting = () => {
        const key = `new_event_${Date.now()}`;
        const newRouting = { ...eventRouting, [key]: { route: { to: '' } } };
        updateEvents({ event_routing: newRouting });
        setExpandedEvents(prev => new Set([...prev, key]));
    };

    const addFromTemplate = (template: typeof EVENT_TEMPLATES[0]) => {
        const suffix = quickAddSuffix.trim() || `event_${Date.now()}`;
        const newEvents = template.create(suffix);
        const newRouting = { ...eventRouting, ...newEvents };
        updateEvents({ event_routing: newRouting });
        setShowQuickAdd(false);
        setQuickAddSuffix('');
        // Expand newly added
        Object.keys(newEvents).forEach(k => setExpandedEvents(prev => new Set([...prev, k])));
    };

    const duplicateEvent = (eventName: string) => {
        const newName = `${eventName}_copy`;
        if (eventRouting[newName]) return;
        const newRouting = { ...eventRouting, [newName]: JSON.parse(JSON.stringify(eventRouting[eventName])) };
        updateEvents({ event_routing: newRouting });
        setExpandedEvents(prev => new Set([...prev, newName]));
    };

    // --- Condition Management ---
    const addCondition = (eventName: string) => {
        const newRouting = { ...eventRouting };
        const logic = { ...newRouting[eventName] };
        if (!logic.route) logic.route = { to: '' };
        if (!logic.route.conditions) logic.route.conditions = [];
        logic.route.conditions = [...logic.route.conditions, { field: '', operator: 'eq', value: '', target: '' }];
        newRouting[eventName] = logic;
        updateEvents({ event_routing: newRouting });
    };

    const updateCondition = (eventName: string, index: number, updates: any) => {
        const newRouting = { ...eventRouting };
        const logic = { ...newRouting[eventName] };
        const conditions = [...(logic.route?.conditions || [])];
        conditions[index] = { ...conditions[index], ...updates };
        logic.route = { ...logic.route, conditions };
        newRouting[eventName] = logic;
        updateEvents({ event_routing: newRouting });
    };

    const removeCondition = (eventName: string, index: number) => {
        const newRouting = { ...eventRouting };
        const logic = { ...newRouting[eventName] };
        const conditions = [...(logic.route?.conditions || [])];
        conditions.splice(index, 1);
        logic.route = { ...logic.route, conditions };
        newRouting[eventName] = logic;
        updateEvents({ event_routing: newRouting });
    };

    const handleTargetChange = (key: string, field: string, value: any) => {
        const newTargets = { ...broadcastTargets };
        if (!newTargets[key]) newTargets[key] = {};
        newTargets[key][field] = value;
        updateEvents({ broadcast_targets: newTargets });
    };

    const toggleExpand = (key: string) => {
        setExpandedEvents(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    // Filter events
    const filteredEvents = useMemo(() => {
        return Object.entries(eventRouting).filter(([name, logic]: [string, any]) => {
            const matchesSearch = !searchTerm || name.toLowerCase().includes(searchTerm.toLowerCase());
            const patterns = detectPatterns(logic);
            const matchesFilter = filterPattern === 'all' || patterns.includes(filterPattern);
            return matchesSearch && matchesFilter;
        });
    }, [eventRouting, searchTerm, filterPattern]);

    // Stats
    const stats = useMemo(() => {
        const all = Object.values(eventRouting);
        return {
            total: all.length,
            routes: all.filter((l: any) => l.route?.to).length,
            captures: all.filter((l: any) => l.quiz_answer).length,
            broadcasts: all.filter((l: any) => l.broadcast).length,
            conditions: all.filter((l: any) => l.route?.conditions?.length).length,
        };
    }, [eventRouting]);

    return (
        <div className="h-full overflow-y-auto bg-white border-l border-gray-200 shadow-xl pb-20">
             <div className="sticky top-0 bg-white z-20 border-b border-gray-200 p-6 flex justify-between items-center shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Event Tracking</h2>
                    <p className="text-xs text-gray-500 mt-1">{stats.total} events &bull; {stats.routes} routes &bull; {stats.captures} data captures &bull; {stats.conditions} conditional</p>
                </div>
                 <ExportMenu
                    onDownload={() => downloadAsText(eventRouting, `events.json`)}
                    onCopy={() => copyToClipboard(eventRouting)}
                    label="Export Events"
                 />
            </div>

            <div className="px-6 pt-4 flex gap-4 border-b border-gray-100 flex-shrink-0">
                <button
                    onClick={() => setActiveTab('routing')}
                    className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'routing' ? 'border-[#f51721] text-[#f51721]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                >
                    <Activity size={16} /> Routing Logic
                </button>
                <button
                    onClick={() => setActiveTab('targets')}
                    className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'targets' ? 'border-[#f51721] text-[#f51721]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                >
                    <Target size={16} /> Broadcast Targets
                </button>
            </div>

            <div className="p-6 space-y-4">
                {activeTab === 'targets' && (
                    <section className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
                            <p className="text-xs text-blue-800">Configure your pixel IDs and measurement IDs here. These keys are used in the routing logic.</p>
                        </div>
                        {Object.entries(broadcastTargets).map(([key, cfg]: [string, any]) => (
                            <div key={key} className="p-4 border border-gray-200 rounded-xl bg-gray-50">
                                <h4 className="font-bold text-sm uppercase text-gray-600 mb-3">{key}</h4>
                                <div className="space-y-2">
                                    {Object.entries(cfg).map(([field, value]: [string, any]) => (
                                        typeof value === 'string' || typeof value === 'number' ? (
                                            <div key={field} className="flex items-center gap-2">
                                                <label className="w-24 text-xs font-medium text-gray-500">{field}</label>
                                                <input
                                                    className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
                                                    value={value}
                                                    onChange={(e) => handleTargetChange(key, field, e.target.value)}
                                                />
                                            </div>
                                        ) : null
                                    ))}
                                </div>
                            </div>
                        ))}
                    </section>
                )}

                {activeTab === 'routing' && (
                    <section className="space-y-4">
                        {/* Search + Filter Bar */}
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:ring-1 focus:ring-[#f51721] outline-none"
                                    placeholder="Search events..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <select
                                className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-gray-50 text-gray-600"
                                value={filterPattern}
                                onChange={(e) => setFilterPattern(e.target.value as any)}
                            >
                                <option value="all">All Types</option>
                                <option value="navigate">Routes</option>
                                <option value="capture">Data Capture</option>
                                <option value="broadcast">Broadcasts</option>
                                <option value="condition">Conditional</option>
                                <option value="scroll">Scroll</option>
                                <option value="checkout">Checkout</option>
                            </select>
                        </div>

                        {/* Action Bar */}
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">{filteredEvents.length} of {stats.total} events</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowQuickAdd(!showQuickAdd)}
                                    className={`text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors font-semibold ${showQuickAdd ? 'bg-[#f51721] text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                                >
                                    <Zap size={12} /> Quick Add
                                </button>
                                <button onClick={addRouting} className="text-xs flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors font-semibold">
                                    <Plus size={12} /> Empty Event
                                </button>
                            </div>
                        </div>

                        {/* Quick Add Panel */}
                        {showQuickAdd && (
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Event Base Name</label>
                                    <input
                                        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#f51721] outline-none"
                                        placeholder="e.g. body_type, sleep_quality, fitness_level"
                                        value={quickAddSuffix}
                                        onChange={(e) => setQuickAddSuffix(e.target.value.replace(/\s+/g, '_').toLowerCase())}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {EVENT_TEMPLATES.map((tmpl, i) => (
                                        <button
                                            key={i}
                                            onClick={() => addFromTemplate(tmpl)}
                                            disabled={!quickAddSuffix.trim()}
                                            className="flex items-center gap-2 p-2.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-[#f51721] hover:text-[#f51721] transition-all disabled:opacity-40 disabled:cursor-not-allowed text-left"
                                        >
                                            {tmpl.icon}
                                            <span>{tmpl.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Event Cards */}
                        <div className="space-y-2">
                            {filteredEvents.map(([eventName, logic]: [string, any]) => {
                                const patterns = detectPatterns(logic);
                                const isExpanded = expandedEvents.has(eventName);
                                const referencedByPages = pageEventMap[eventName] || [];

                                return (
                                    <div key={eventName} className={`border rounded-lg transition-all bg-white group ${isExpanded ? 'border-gray-300 shadow-md' : 'border-gray-200 hover:shadow-sm'}`}>
                                        {/* Header Row */}
                                        <div className="flex items-center gap-2 px-3 py-2.5 cursor-pointer" onClick={() => toggleExpand(eventName)}>
                                            <button className="text-gray-400">
                                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                            </button>
                                            <span className="font-mono font-bold text-sm text-[#f51721] flex-1 truncate">{eventName}</span>

                                            {/* Pattern Badges */}
                                            <div className="flex gap-1 flex-shrink-0">
                                                {patterns.map(p => (
                                                    <span key={p} className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                                                        style={{ backgroundColor: PATTERN_CONFIG[p].bg, color: PATTERN_CONFIG[p].color }}>
                                                        {PATTERN_CONFIG[p].label}
                                                    </span>
                                                ))}
                                            </div>

                                            {/* Route target quick view */}
                                            {logic.route?.to && !logic.route?.conditions?.length && (
                                                <span className="text-xs text-gray-400 flex items-center gap-1 flex-shrink-0">
                                                    <ArrowRight size={10} /> {logic.route.to}
                                                </span>
                                            )}
                                        </div>

                                        {/* Expanded Content */}
                                        {isExpanded && (
                                            <div className="px-3 pb-3 border-t border-gray-100 pt-3 space-y-3">
                                                {/* Event Name (editable) */}
                                                <div className="flex gap-2 items-center">
                                                    <span className="w-20 text-[10px] text-gray-400 font-bold uppercase">Event Name</span>
                                                    <input
                                                        className="flex-1 font-mono text-sm bg-gray-50 border border-gray-200 rounded px-2 py-1 focus:ring-1 focus:ring-[#f51721] outline-none"
                                                        defaultValue={eventName}
                                                        onBlur={(e) => {
                                                            const newName = e.target.value.trim();
                                                            if (!newName || newName === eventName) return;
                                                            if (eventRouting[newName]) {
                                                                e.target.value = eventName;
                                                                return;
                                                            }
                                                            const newRouting: Record<string, any> = {};
                                                            for (const key of Object.keys(eventRouting)) {
                                                                if (key === eventName) {
                                                                    newRouting[newName] = logic;
                                                                } else {
                                                                    newRouting[key] = eventRouting[key];
                                                                }
                                                            }
                                                            updateEvents({ event_routing: newRouting });
                                                            setExpandedEvents(prev => {
                                                                const next = new Set(prev);
                                                                next.delete(eventName);
                                                                next.add(newName);
                                                                return next;
                                                            });
                                                        }}
                                                    />
                                                </div>

                                                {/* Route To */}
                                                <div className="flex gap-2 items-center">
                                                    <span className="w-20 text-[10px] text-gray-400 font-bold uppercase">Route To</span>
                                                    <select
                                                        className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded px-2 py-1"
                                                        value={logic.route?.to || ''}
                                                        onChange={(e) => handleRoutingChange(eventName, 'route', { ...logic.route, to: e.target.value })}
                                                    >
                                                        <option value="">-- No Route --</option>
                                                        {availablePaths.map(p => (
                                                            <option key={p.path} value={p.path}>{p.path} - {p.name}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Answer Key */}
                                                <div className="flex gap-2 items-center">
                                                    <span className="w-20 text-[10px] text-gray-400 font-bold uppercase">Answer Key</span>
                                                    <input
                                                        className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded px-2 py-1"
                                                        value={logic.quiz_answer || ''}
                                                        onChange={(e) => handleRoutingChange(eventName, 'quiz_answer', e.target.value || undefined)}
                                                        placeholder="e.g. gender, age, fitness_level"
                                                    />
                                                </div>

                                                {/* Conditional Routing */}
                                                <div className="border-t border-gray-100 pt-3">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1">
                                                            <GitBranch size={10} /> Conditional Routes
                                                        </span>
                                                        <button
                                                            onClick={() => addCondition(eventName)}
                                                            className="text-[10px] flex items-center gap-1 bg-purple-50 hover:bg-purple-100 text-purple-600 px-2 py-1 rounded transition-colors font-semibold"
                                                        >
                                                            <Plus size={10} /> Add Condition
                                                        </button>
                                                    </div>

                                                    {logic.route?.conditions?.length > 0 && (
                                                        <div className="space-y-2 bg-purple-50/50 rounded-lg p-2">
                                                            <p className="text-[9px] text-purple-500 italic">If conditions match, route to condition target instead of default route.</p>
                                                            {logic.route.conditions.map((cond: any, idx: number) => (
                                                                <div key={idx} className="flex items-center gap-1.5 bg-white rounded-lg p-2 border border-purple-100">
                                                                    <span className="text-[9px] text-purple-400 font-bold w-4">IF</span>
                                                                    <input
                                                                        className="w-24 text-[11px] bg-gray-50 border border-gray-200 rounded px-1.5 py-1"
                                                                        value={cond.field || ''}
                                                                        onChange={(e) => updateCondition(eventName, idx, { field: e.target.value })}
                                                                        placeholder="field"
                                                                    />
                                                                    <select
                                                                        className="text-[11px] bg-gray-50 border border-gray-200 rounded px-1 py-1"
                                                                        value={cond.operator || 'eq'}
                                                                        onChange={(e) => updateCondition(eventName, idx, { operator: e.target.value })}
                                                                    >
                                                                        {CONDITION_OPERATORS.map(op => (
                                                                            <option key={op.value} value={op.value}>{op.label}</option>
                                                                        ))}
                                                                    </select>
                                                                    {!['empty', 'present'].includes(cond.operator) && (
                                                                        <input
                                                                            className="w-20 text-[11px] bg-gray-50 border border-gray-200 rounded px-1.5 py-1"
                                                                            value={cond.value || ''}
                                                                            onChange={(e) => updateCondition(eventName, idx, { value: e.target.value })}
                                                                            placeholder="value"
                                                                        />
                                                                    )}
                                                                    <span className="text-[9px] text-purple-400 font-bold">→</span>
                                                                    <select
                                                                        className="flex-1 text-[11px] bg-gray-50 border border-gray-200 rounded px-1 py-1"
                                                                        value={cond.target || ''}
                                                                        onChange={(e) => updateCondition(eventName, idx, { target: e.target.value })}
                                                                    >
                                                                        <option value="">Target...</option>
                                                                        {availablePaths.map(p => (
                                                                            <option key={p.path} value={p.path}>{p.path} - {p.name}</option>
                                                                        ))}
                                                                    </select>
                                                                    <button
                                                                        onClick={() => removeCondition(eventName, idx)}
                                                                        className="text-gray-300 hover:text-red-500 p-0.5"
                                                                    >
                                                                        <Trash2 size={10} />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Broadcasts */}
                                                <div className="border-t border-gray-100 pt-3">
                                                    <span className="text-[10px] uppercase font-bold text-gray-500 block mb-2">Broadcasts</span>
                                                    <div className="grid grid-cols-1 gap-2">
                                                        {['facebook', 'ga4', 'db', 'convert'].map(target => (
                                                            <div key={target} className="flex gap-2 items-center">
                                                                <span className="w-16 text-[10px] text-gray-500 capitalize font-medium">{target}</span>
                                                                <input
                                                                    className="flex-1 bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs"
                                                                    value={logic.broadcast?.[target]?.event_name || logic.broadcast?.[target]?.goal_id || ''}
                                                                    onChange={(e) => {
                                                                        const newBroadcast = { ...(logic.broadcast || {}) };
                                                                        if (e.target.value) {
                                                                            if (!newBroadcast[target]) newBroadcast[target] = {};
                                                                            if (target === 'convert') {
                                                                                newBroadcast[target].goal_id = e.target.value;
                                                                            } else {
                                                                                newBroadcast[target].event_name = e.target.value;
                                                                            }
                                                                        } else {
                                                                            delete newBroadcast[target];
                                                                        }
                                                                        handleRoutingChange(eventName, 'broadcast', Object.keys(newBroadcast).length ? newBroadcast : undefined);
                                                                    }}
                                                                    placeholder={target === 'convert' ? 'Goal ID' : 'Event Name'}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Scroll / Checkout flags */}
                                                <div className="border-t border-gray-100 pt-3 flex gap-4">
                                                    <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={!!logic.checkout}
                                                            onChange={(e) => handleRoutingChange(eventName, 'checkout', e.target.checked || undefined)}
                                                            className="rounded"
                                                        />
                                                        Checkout Event
                                                    </label>
                                                    <div className="flex items-center gap-2">
                                                        <label className="text-xs text-gray-500">Scroll To:</label>
                                                        <input
                                                            className="w-20 text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1"
                                                            value={logic.scroll?.to || ''}
                                                            onChange={(e) => {
                                                                if (e.target.value) {
                                                                    handleRoutingChange(eventName, 'scroll', { to: e.target.value });
                                                                } else {
                                                                    const newRouting = { ...eventRouting };
                                                                    delete newRouting[eventName].scroll;
                                                                    updateEvents({ event_routing: newRouting });
                                                                }
                                                            }}
                                                            placeholder="element"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Page References */}
                                                {referencedByPages.length > 0 && (
                                                    <div className="border-t border-gray-100 pt-2">
                                                        <span className="text-[9px] uppercase font-bold text-gray-400">Referenced by: </span>
                                                        {referencedByPages.map((p, i) => (
                                                            <span key={i} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded mr-1 font-medium">{p}</span>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Actions */}
                                                <div className="flex justify-end gap-2 border-t border-gray-100 pt-2">
                                                    <button
                                                        onClick={() => duplicateEvent(eventName)}
                                                        className="text-[10px] flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors"
                                                    >
                                                        <Copy size={10} /> Duplicate
                                                    </button>
                                                    <button
                                                        onClick={() => deleteRouting(eventName)}
                                                        className="text-[10px] flex items-center gap-1 text-gray-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 size={10} /> Delete
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {filteredEvents.length === 0 && (
                            <div className="text-center py-12 text-gray-400">
                                <Activity size={32} className="mx-auto mb-2 opacity-30" />
                                <p className="text-sm">{searchTerm ? 'No events match your search' : 'No events configured'}</p>
                            </div>
                        )}
                    </section>
                )}
            </div>
        </div>
    );
};
