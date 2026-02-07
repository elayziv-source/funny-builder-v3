
import React, { useMemo } from 'react';
import { useFunnel } from '../context/FunnelContext';
import { ExportMenu } from './ui/ExportMenu';
import { Plus, Trash2, Split, AlertTriangle } from 'lucide-react';

const VARIATION_COLORS = [
    { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', accent: 'bg-blue-500', light: 'bg-blue-100', check: 'accent-blue-600' },
    { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', accent: 'bg-green-500', light: 'bg-green-100', check: 'accent-green-600' },
    { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', accent: 'bg-orange-500', light: 'bg-orange-100', check: 'accent-orange-600' },
    { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', accent: 'bg-purple-500', light: 'bg-purple-100', check: 'accent-purple-600' },
];

export const SplitTestEditor: React.FC = () => {
    const { config, updateSplitTest, copyToClipboard } = useFunnel();
    // Default split test if undefined
    const splitTest = config.split_test || { 
        experiment_id: '', 
        metric: 'conversion_rate', 
        variations: [{ id: 'control', name: 'Control', weight: 100 }] 
    };

    const handleUpdate = (field: string, value: any) => {
        updateSplitTest({ ...splitTest, [field]: value });
    };

    const updateVariation = (idx: number, field: string, value: any) => {
        const newVars = [...splitTest.variations];
        newVars[idx] = { ...newVars[idx], [field]: value };
        handleUpdate('variations', newVars);
    };

    const addVariation = () => {
        const newVars = [...splitTest.variations, { 
            id: `variant_${String.fromCharCode(65 + splitTest.variations.length)}`, 
            name: `Variation ${String.fromCharCode(65 + splitTest.variations.length)}`, 
            weight: 0 
        }];
        handleUpdate('variations', newVars);
    };

    const removeVariation = (idx: number) => {
        if (splitTest.variations.length <= 1) return;
        const newVars = [...splitTest.variations];
        newVars.splice(idx, 1);
        handleUpdate('variations', newVars);
    };

    const totalWeight = splitTest.variations.reduce((acc, curr) => acc + (Number(curr.weight) || 0), 0);

    // Page assignment helpers
    const pageEntries = useMemo(() => (Object.entries(config.pages) as [string, import('../types').PageConfig][]).map(([id, page]) => ({ id, name: page.name, path: page.path })), [config.pages]);
    const totalPages = pageEntries.length;

    const togglePageForVariation = (variationIdx: number, pageId: string) => {
        const variation = splitTest.variations[variationIdx];
        const currentPages = variation.pages || [];
        const newPages = currentPages.includes(pageId)
            ? currentPages.filter(p => p !== pageId)
            : [...currentPages, pageId];
        updateVariation(variationIdx, 'pages', newPages);
    };

    const assignedPageIds = useMemo(() => {
        const set = new Set<string>();
        splitTest.variations.forEach(v => (v.pages || []).forEach(p => set.add(p)));
        return set;
    }, [splitTest.variations]);

    const coveragePercent = totalPages > 0 ? Math.round((assignedPageIds.size / totalPages) * 100) : 0;

    return (
        <div className="h-full overflow-y-auto bg-white border-l border-gray-200 shadow-xl pb-20">
             <div className="sticky top-0 bg-white z-20 border-b border-gray-200 p-6 flex justify-between items-center shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">A/B Testing</h2>
                    <p className="text-xs text-gray-500 mt-1">Experiment Planning</p>
                </div>
                 <ExportMenu 
                    onDownload={() => {}} 
                    onCopy={() => copyToClipboard(splitTest)}
                    label="Export JSON"
                 />
            </div>

            <div className="p-6 space-y-8">
                <section>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Configuration</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Experiment ID</label>
                            <input 
                                value={splitTest.experiment_id}
                                onChange={(e) => handleUpdate('experiment_id', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                placeholder="EXP_2023_001"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Goal Metric</label>
                            <select 
                                value={splitTest.metric}
                                onChange={(e) => handleUpdate('metric', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                            >
                                <option value="conversion_rate">Conversion Rate</option>
                                <option value="click_through_rate">Click Through Rate</option>
                                <option value="revenue">Revenue</option>
                                <option value="retention">Retention</option>
                            </select>
                        </div>
                    </div>
                </section>

                <section>
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Traffic Split</h3>
                        <button 
                            onClick={addVariation}
                            className="text-xs flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-lg transition-colors font-semibold"
                        >
                            <Plus size={14} /> Add Variant
                        </button>
                    </div>
                    
                    <div className="space-y-4">
                        {splitTest.variations.map((v, idx) => (
                            <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-200 relative group">
                                <div className="absolute top-2 right-2 flex gap-1">
                                     <button onClick={() => removeVariation(idx)} className="p-1 text-gray-300 hover:text-red-500" disabled={splitTest.variations.length <= 1}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3 mb-2 pr-6">
                                     <div>
                                        <label className="text-[10px] uppercase text-gray-400">Name</label>
                                        <input
                                            value={v.name || ''}
                                            onChange={(e) => updateVariation(idx, 'name', e.target.value)}
                                            placeholder={idx === 0 ? 'Control' : `Variation ${String.fromCharCode(64 + idx)}`}
                                            className="w-full text-sm border-b border-gray-300 bg-transparent outline-none focus:border-blue-500"
                                        />
                                     </div>
                                     <div>
                                        <label className="text-[10px] uppercase text-gray-400">ID</label>
                                        <input 
                                            value={v.id} 
                                            onChange={(e) => updateVariation(idx, 'id', e.target.value)}
                                            className="w-full text-sm font-mono border-b border-gray-300 bg-transparent outline-none focus:border-blue-500 text-gray-600"
                                        />
                                     </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Split size={14} className="text-gray-400" />
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={v.weight ?? 50}
                                        onChange={(e) => updateVariation(idx, 'weight', parseInt(e.target.value))}
                                        className="flex-1"
                                    />
                                    <span className="text-xs font-bold w-12 text-right">{v.weight ?? 50}%</span>
                                </div>

                                {/* Page Assignment */}
                                {(() => {
                                    const colors = VARIATION_COLORS[idx % VARIATION_COLORS.length];
                                    const assignedCount = (v.pages || []).length;
                                    return (
                                        <div className={`mt-3 pt-3 border-t border-gray-200`}>
                                            <div className="flex justify-between items-center mb-2">
                                                <label className={`text-[10px] uppercase font-bold ${colors.text}`}>Page Assignment</label>
                                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${colors.light} ${colors.text}`}>
                                                    {assignedCount} page{assignedCount !== 1 ? 's' : ''} assigned
                                                </span>
                                            </div>
                                            <div className="space-y-1 max-h-40 overflow-y-auto">
                                                {pageEntries.map((page) => {
                                                    const isChecked = (v.pages || []).includes(page.id);
                                                    const isUnassigned = !assignedPageIds.has(page.id);
                                                    return (
                                                        <label
                                                            key={page.id}
                                                            className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer text-xs transition-colors ${
                                                                isChecked ? `${colors.bg} ${colors.border} border` : 'hover:bg-gray-100'
                                                            }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={() => togglePageForVariation(idx, page.id)}
                                                                className={`rounded ${colors.check}`}
                                                            />
                                                            <span className="text-gray-400 font-mono w-5 text-right">{page.path}</span>
                                                            <span className={`flex-1 truncate ${isChecked ? colors.text + ' font-medium' : 'text-gray-600'}`}>
                                                                {page.name || page.id}
                                                            </span>
                                                            {isUnassigned && !isChecked && (
                                                                <AlertTriangle size={12} className="text-amber-500 flex-shrink-0" title="Unassigned to any variation" />
                                                            )}
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 p-4 rounded-xl bg-blue-50 border border-blue-100 text-center">
                        <div className="text-xs text-blue-800 uppercase font-bold mb-1">Total Traffic Allocation</div>
                        <div className={`text-2xl font-black ${totalWeight === 100 ? 'text-green-500' : 'text-red-500'}`}>
                            {totalWeight}%
                        </div>
                        {totalWeight !== 100 && (
                            <div className="text-xs text-red-500 mt-1">Total must equal 100%</div>
                        )}
                    </div>

                    {/* Page Coverage Bar */}
                    <div className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
                        <div className="flex justify-between items-center mb-2">
                            <div className="text-xs uppercase font-bold text-gray-700">Page Coverage</div>
                            <div className={`text-xs font-bold ${coveragePercent === 100 ? 'text-green-600' : 'text-amber-600'}`}>
                                {assignedPageIds.size}/{totalPages} pages ({coveragePercent}%)
                            </div>
                        </div>
                        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                    coveragePercent === 100 ? 'bg-green-500' : coveragePercent > 0 ? 'bg-amber-500' : 'bg-gray-300'
                                }`}
                                style={{ width: `${coveragePercent}%` }}
                            />
                        </div>
                        {coveragePercent < 100 && (
                            <div className="mt-2 space-y-1">
                                {pageEntries.filter(p => !assignedPageIds.has(p.id)).map(p => (
                                    <div key={p.id} className="flex items-center gap-1.5 text-[11px] text-amber-700">
                                        <AlertTriangle size={11} className="text-amber-500 flex-shrink-0" />
                                        <span className="font-mono text-amber-500">{p.path}</span>
                                        <span className="truncate">{p.name || p.id} &mdash; unassigned</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};
