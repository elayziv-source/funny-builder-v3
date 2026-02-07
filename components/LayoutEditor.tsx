import React from 'react';
import { useFunnel } from '../context/FunnelContext';
import { ExportMenu } from './ui/ExportMenu';
import { Plus, Trash2, Globe, Link as LinkIcon } from 'lucide-react';

export const LayoutEditor: React.FC = () => {
    const { config, updateLayout, downloadAsText, copyToClipboard } = useFunnel();
    const { layout } = config;

    const handleHeaderChange = (key: string, value: string) => {
        updateLayout({
            ...layout,
            header: {
                ...layout.header,
                template_data: {
                    ...layout.header.template_data,
                    [key]: value
                }
            }
        });
    };

    const handleFooterLinkChange = (index: number, field: 'text' | 'href', value: string) => {
        const newLinks = [...layout.footer.template_data._footer_links];
        newLinks[index] = { ...newLinks[index], [field]: value };
        
        updateLayout({
            ...layout,
            footer: {
                ...layout.footer,
                template_data: {
                    ...layout.footer.template_data,
                    _footer_links: newLinks
                }
            }
        });
    };

    const addFooterLink = () => {
        const newLinks = [...(layout.footer.template_data._footer_links || []), { text: 'New Link', href: '#' }];
        updateLayout({
            ...layout,
            footer: {
                ...layout.footer,
                template_data: {
                    ...layout.footer.template_data,
                    _footer_links: newLinks
                }
            }
        });
    };

    const removeFooterLink = (index: number) => {
        const newLinks = [...layout.footer.template_data._footer_links];
        newLinks.splice(index, 1);
        updateLayout({
            ...layout,
            footer: {
                ...layout.footer,
                template_data: {
                    ...layout.footer.template_data,
                    _footer_links: newLinks
                }
            }
        });
    };

    return (
        <div className="h-full overflow-y-auto bg-white border-l border-gray-200 shadow-xl pb-20">
             <div className="sticky top-0 bg-white z-20 border-b border-gray-200 p-6 flex justify-between items-center shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Layout Settings</h2>
                    <p className="text-xs text-gray-500 mt-1">Global Header & Footer configuration</p>
                </div>
                 <ExportMenu 
                    onDownload={() => downloadAsText(layout, `${config.brand}_layout_config.txt`)} 
                    onCopy={() => copyToClipboard(layout)}
                    label="Export Layout"
                 />
            </div>

            <div className="p-6 space-y-8">
                {/* Header Section */}
                <section>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Global Header</h3>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Logo URL</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={layout.header.template_data._logo_src || ''} 
                                    onChange={(e) => handleHeaderChange('_logo_src', e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    placeholder="https://example.com/logo.png"
                                />
                                {layout.header.template_data._logo_src && (
                                    <div className="w-10 h-10 border border-gray-300 rounded bg-white p-1 flex items-center justify-center">
                                        <img src={layout.header.template_data._logo_src} alt="Preview" className="max-w-full max-h-full" />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Alt Text</label>
                                <input 
                                    type="text" 
                                    value={layout.header.template_data._logo_alt || ''} 
                                    onChange={(e) => handleHeaderChange('_logo_alt', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    placeholder="Brand Logo"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Logo Width</label>
                                <input 
                                    type="text" 
                                    value={layout.header.template_data._logo_width || ''} 
                                    onChange={(e) => handleHeaderChange('_logo_width', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    placeholder="e.g., 120px or logo"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer Section */}
                <section>
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Global Footer Links</h3>
                        <button 
                            onClick={addFooterLink}
                            className="text-xs flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-lg transition-colors font-semibold"
                        >
                            <Plus size={14} /> Add Link
                        </button>
                    </div>
                    
                    <div className="space-y-3">
                        {layout.footer.template_data._footer_links?.map((link, idx) => (
                            <div key={idx} className="flex gap-2 items-start group">
                                <div className="flex-1 grid grid-cols-2 gap-2">
                                    <div className="relative">
                                        <Globe size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input 
                                            className="w-full pl-8 pr-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                                            value={link.text}
                                            onChange={(e) => handleFooterLinkChange(idx, 'text', e.target.value)}
                                            placeholder="Link Text"
                                        />
                                    </div>
                                    <div className="relative">
                                        <LinkIcon size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input 
                                            className="w-full pl-8 pr-2 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 focus:ring-1 focus:ring-blue-500 outline-none"
                                            value={link.href}
                                            onChange={(e) => handleFooterLinkChange(idx, 'href', e.target.value)}
                                            placeholder="URL"
                                        />
                                    </div>
                                </div>
                                <button 
                                    onClick={() => removeFooterLink(idx)}
                                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-[1px]"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        {(!layout.footer.template_data._footer_links || layout.footer.template_data._footer_links.length === 0) && (
                            <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                No footer links configured.
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};