
import React, { useState } from 'react';
import { GOOGLE_FONTS } from '../../constants';
import { ChevronDown, Type } from 'lucide-react';

interface FontFamilyPickerProps {
    value: string;
    onChange: (value: string) => void;
}

// Helper to parse "900 40px/54px 'PT Sans'" -> { weight, size, lineHeight, family }
// and reconstruct.
const parseFontString = (fontStr: string) => {
    // Simple regex for format: [weight] [size]/[lineHeight] [family]
    // Example: "900 40px/54px 'PT Sans'"
    const match = fontStr.match(/^(\d+)\s+([\d\w\.]+)\/([\d\w\.]+)\s+(.+)$/);
    if (match) {
        return {
            weight: match[1],
            size: match[2],
            lineHeight: match[3],
            family: match[4].replace(/['"]/g, '')
        };
    }
    // Fallback if structure is different, just return raw string as family or try to guess
    return {
        weight: '400',
        size: '16px',
        lineHeight: '24px',
        family: fontStr.replace(/['"]/g, '')
    };
};

export const FontFamilyPicker: React.FC<FontFamilyPickerProps> = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const parsed = parseFontString(value);

    const handleSelect = (font: string) => {
        // Reconstruct string: "900 40px/54px 'Roboto'"
        const newValue = `${parsed.weight} ${parsed.size}/${parsed.lineHeight} '${font}'`;
        onChange(newValue);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded-lg hover:border-[#f51721] transition-colors"
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    <Type size={16} className="text-gray-400" />
                    <span className="text-sm font-medium truncate" style={{ fontFamily: parsed.family }}>{parsed.family}</span>
                </div>
                <ChevronDown size={14} className="text-gray-400" />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-40 max-h-60 overflow-y-auto">
                        {GOOGLE_FONTS.map(font => (
                            <button
                                key={font}
                                onClick={() => handleSelect(font)}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${parsed.family === font ? 'bg-red-50 text-[#f51721]' : 'text-gray-700'}`}
                                style={{ fontFamily: font }}
                            >
                                {font}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};
