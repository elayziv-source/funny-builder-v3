
import React, { useState } from 'react';
import { Copy, FileText, ChevronDown } from 'lucide-react';

interface ExportMenuProps {
    onCopy: () => void;
    onDownload: () => void;
    label?: string;
}

export const ExportMenu: React.FC<ExportMenuProps> = ({ onCopy, onDownload, label = "Export" }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1 text-xs font-bold text-[#f51721] hover:bg-red-50 px-2 py-1 rounded transition-colors"
            >
                {label} <ChevronDown size={12} />
            </button>
            
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 w-48 py-1">
                        <button 
                            onClick={() => { onCopy(); setIsOpen(false); }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                        >
                            <Copy size={14} /> Copy to Clipboard
                        </button>
                        <button 
                            onClick={() => { onDownload(); setIsOpen(false); }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                        >
                            <FileText size={14} /> Download .txt
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};
