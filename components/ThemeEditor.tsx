
import React from 'react';
import { useFunnel } from '../context/FunnelContext';
import { ExportMenu } from './ui/ExportMenu';
import { FontFamilyPicker } from './ui/FontFamilyPicker';

interface TypographyEditorProps {
    fontKey: string;
    value: string;
    onChange: (newValue: string) => void;
}

const TypographyEditor: React.FC<TypographyEditorProps> = ({ fontKey, value, onChange }) => {
    // Parser for "weight size/lineHeight family" -> "900 40px/54px 'PT Sans'"
    const parse = (str: string) => {
        const match = str.match(/^(\d+)\s+(\d+)px\/(\d+)px\s+(.+)$/);
        if (match) {
            return {
                weight: match[1],
                size: match[2],
                lineHeight: match[3],
                family: match[4]
            };
        }
        // Fallback or default
        return { weight: '400', size: '16', lineHeight: '24', family: "'PT Sans'" };
    };

    const parsed = parse(value);

    const update = (field: keyof typeof parsed, val: string) => {
        const newParsed = { ...parsed, [field]: val };
        onChange(`${newParsed.weight} ${newParsed.size}px/${newParsed.lineHeight}px ${newParsed.family}`);
    };

    return (
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
             <div className="flex justify-between items-center mb-3">
                 <label className="block text-xs font-bold text-gray-500 uppercase">{fontKey.replace('_', ' ')}</label>
             </div>
             
             <div className="space-y-3">
                 {/* Font Family */}
                 <div className="w-full">
                     <FontFamilyPicker 
                        value={value}
                        onChange={(newVal) => update('family', parse(newVal).family)}
                     />
                 </div>

                 {/* Weight */}
                 <div className="flex items-center gap-2">
                     <label className="text-xs text-gray-400 w-16">Weight</label>
                     <select 
                        value={parsed.weight} 
                        onChange={(e) => update('weight', e.target.value)}
                        className="flex-1 text-sm border border-gray-300 rounded-lg px-2 py-1.5 outline-none bg-white"
                     >
                         <option value="100">Thin (100)</option>
                         <option value="300">Light (300)</option>
                         <option value="400">Regular (400)</option>
                         <option value="500">Medium (500)</option>
                         <option value="600">Semi-Bold (600)</option>
                         <option value="700">Bold (700)</option>
                         <option value="800">Extra-Bold (800)</option>
                         <option value="900">Black (900)</option>
                     </select>
                 </div>

                 {/* Size and Line Height */}
                 <div className="grid grid-cols-2 gap-3">
                     <div>
                        <label className="text-xs text-gray-400 block mb-1">Size (px)</label>
                        <input 
                            type="number" 
                            value={parsed.size} 
                            onChange={(e) => update('size', e.target.value)}
                            className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5 outline-none bg-white"
                        />
                     </div>
                     <div>
                        <label className="text-xs text-gray-400 block mb-1">Line H. (px)</label>
                        <input 
                            type="number" 
                            value={parsed.lineHeight} 
                            onChange={(e) => update('lineHeight', e.target.value)}
                            className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5 outline-none bg-white"
                        />
                     </div>
                 </div>

                 {/* Preview */}
                 <div className="mt-2 pt-2 border-t border-gray-200">
                     <p className="text-gray-400 text-[10px] uppercase mb-1">Preview</p>
                     <div 
                        className="p-2 border border-gray-200 rounded bg-white text-gray-800 whitespace-nowrap overflow-hidden"
                        style={{ font: value }}
                     >
                        The quick brown fox
                     </div>
                 </div>
             </div>
        </div>
    );
};

export const ThemeEditor: React.FC = () => {
    const { config, updateTheme, downloadThemeConfig, copyToClipboard } = useFunnel();
    const { theme } = config;

    const handleColorChange = (key: string, value: string) => {
        updateTheme({
            ...theme,
            colors: {
                ...theme.colors,
                [key]: value
            }
        });
    };

    const handleThemeChange = (section: 'fonts' | 'spacing' | 'border_radius' | 'width' | 'border', key: string, value: string) => {
        updateTheme({
            ...theme,
            [section]: {
                ...theme[section],
                [key]: value
            }
        });
    };

    // Helper to extract hex color from border string "2px solid #eaeaeb"
    const getBorderColor = (borderStr: string) => {
        const match = borderStr.match(/#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}/);
        return match ? match[0] : '#000000';
    };

    // Helper to replace color in border string
    const setBorderColor = (borderStr: string, color: string) => {
        // Replace existing hex or rgb, or append if missing (simple hex replacement here)
        if (borderStr.match(/#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}/)) {
            return borderStr.replace(/#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}/, color);
        }
        return `${borderStr} ${color}`;
    };

    return (
        <div className="h-full overflow-y-auto bg-white border-l border-gray-200 shadow-xl pb-20">
             <div className="sticky top-0 bg-white z-20 border-b border-gray-200 p-6 flex justify-between items-center shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Global Theme</h2>
                    <p className="text-xs text-gray-500 mt-1">Colors, Fonts, and Styles</p>
                </div>
                 <ExportMenu 
                    onDownload={downloadThemeConfig} 
                    onCopy={() => copyToClipboard(theme)}
                    label="Export Theme"
                 />
            </div>

            <div className="p-6 space-y-8">
                {/* Colors */}
                <section>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Color Palette</h3>
                    <div className="space-y-4">
                        {Object.entries(theme.colors).map(([key, value]) => (
                            <div key={key} className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg border border-gray-200 shadow-sm flex-shrink-0 overflow-hidden relative">
                                    <input 
                                        type="color" 
                                        value={value} 
                                        onChange={(e) => handleColorChange(key, e.target.value)}
                                        className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer p-0 border-0"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-bold text-gray-700 capitalize mb-1">{key.replace('_', ' ')}</label>
                                    <input 
                                        type="text" 
                                        value={value} 
                                        onChange={(e) => handleColorChange(key, e.target.value)}
                                        className="w-full text-xs px-2 py-1 border border-gray-300 rounded font-mono text-gray-500 uppercase" 
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
                
                <div className="border-t border-gray-100"></div>

                 {/* Typography */}
                 <section>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Typography</h3>
                    <div className="space-y-4">
                         {Object.entries(theme.fonts).map(([key, value]) => (
                             <TypographyEditor 
                                key={key}
                                fontKey={key}
                                value={value as string}
                                onChange={(newVal) => handleThemeChange('fonts', key, newVal)}
                             />
                         ))}
                    </div>
                 </section>

                 <div className="border-t border-gray-100"></div>

                 {/* Borders */}
                 <section>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Borders</h3>
                    <div className="space-y-4">
                         {Object.entries(theme.border).map(([key, value]) => (
                             <div key={key} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                 <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{key.replace('_', ' ')}</label>
                                 <div className="flex gap-2">
                                     <div className="relative w-8 h-8 flex-shrink-0 overflow-hidden rounded border border-gray-300">
                                         <input 
                                            type="color" 
                                            value={getBorderColor(value as string)}
                                            onChange={(e) => handleThemeChange('border', key, setBorderColor(value as string, e.target.value))}
                                            className="absolute -top-2 -left-2 w-12 h-12 p-0 border-0 cursor-pointer"
                                         />
                                     </div>
                                     <input 
                                        className="flex-1 text-sm bg-white border border-gray-300 rounded px-2 py-1 font-mono" 
                                        value={value as string}
                                        onChange={(e) => handleThemeChange('border', key, e.target.value)}
                                     />
                                 </div>
                             </div>
                         ))}
                    </div>
                 </section>

                 <div className="border-t border-gray-100"></div>

                 {/* Dimensions */}
                 <section>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Dimensions</h3>
                    <div className="grid grid-cols-1 gap-4">
                        {/* Spacing */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 mb-2">Spacing</h4>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(theme.spacing).map(([key, value]) => (
                                    <div key={key}>
                                        <label className="text-[10px] uppercase text-gray-500 block mb-1">{key}</label>
                                        <input 
                                            className="w-full text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1" 
                                            value={value as string}
                                            onChange={(e) => handleThemeChange('spacing', key, e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Radius */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 mb-2">Radius</h4>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(theme.border_radius).map(([key, value]) => (
                                    <div key={key}>
                                        <label className="text-[10px] uppercase text-gray-500 block mb-1">{key}</label>
                                        <input 
                                            className="w-full text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1" 
                                            value={value as string}
                                            onChange={(e) => handleThemeChange('border_radius', key, e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                         {/* Widths */}
                         <div>
                            <h4 className="text-xs font-bold text-gray-400 mb-2">Layout Widths</h4>
                            <div className="grid grid-cols-1 gap-2">
                                {Object.entries(theme.width).map(([key, value]) => (
                                    <div key={key} className="flex justify-between items-center bg-gray-50 px-2 py-1 rounded">
                                        <label className="text-[10px] uppercase text-gray-500">{key}</label>
                                        <input 
                                            className="w-24 text-xs bg-white border border-gray-200 rounded px-2 py-1 text-right" 
                                            value={value as string}
                                            onChange={(e) => handleThemeChange('width', key, e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                 </section>
            </div>
        </div>
    );
}
