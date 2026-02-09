
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFunnel } from '../context/FunnelContext';
import { ComponentNode } from '../types';
import { Plus, Trash2, ChevronRight, ChevronDown, MoveUp, MoveDown, Settings, Copy, LayoutTemplate, Type, Box, Activity, Variable, MousePointerClick, ToggleLeft, ToggleRight, CheckSquare } from 'lucide-react';
import { ExportMenu } from './ui/ExportMenu';

// --- Configuration Data ---

const AVAILABLE_COMPONENTS = [
    'Page', 'Box', 'Gap', 'Divider', 
    'Title', 'Subtitle', 'Text', 'RichText', 
    'ImageBox', 'Button', 
    'ItemPicker', 'FocusAreas', 'UnitToggle', 'LengthInput', 'WeightInput', 
    'NumericInput', 'DatePicker', 'TextInput', 'NotificationCard', 'LinksBox', 
    'PageProgressBar', 'AnimatedChart', 'Checkout', 'Countdown', 'Carousel', 
    'BmiChart', 'BmiReport', 'BmiNotification', 'GoalNotification', 'WeightLossChart'
];

interface PropSchema {
    name: string;
    label: string;
    type: 'string' | 'boolean' | 'number' | 'theme_color' | 'theme_font' | 'theme_spacing' | 'theme_width' | 'theme_radius' | 'select' | 'object' | 'html_element';
    options?: string[]; // For 'select'
    helper?: string;
}

const COMMON_PROPS_LIST = [
    'id', 'class_name', 'style', 'hidden', 'role', 'data-testid', 
    'margin', 'padding', 'width', 'height', 'color', 'background',
    'border', 'border_radius', 'shadow', 'z_index', 'opacity',
    'text_align', 'font_family', 'font_size', 'font_weight'
];

const COMPONENT_SCHEMAS: Record<string, PropSchema[]> = {
    Page: [
        { name: 'width', label: 'Page Width', type: 'theme_width' },
        { name: 'padding', label: 'Page Padding', type: 'theme_spacing' },
        { name: 'background', label: 'Background Color', type: 'theme_color' },
        { name: 'height', label: 'Min Height', type: 'string' },
        { name: 'center_content', label: 'Center Vertically', type: 'boolean' }
    ],
    Box: [
        { name: 'gap', label: 'Gap', type: 'theme_spacing' },
        { name: 'padding', label: 'Padding', type: 'theme_spacing' },
        { name: 'margin', label: 'Margin', type: 'theme_spacing' },
        { name: 'width', label: 'Width', type: 'theme_width' },
        { name: 'background', label: 'Background', type: 'theme_color' },
        { name: 'border', label: 'Border', type: 'string' }, // Could be theme_border if defined
        { name: 'border_radius', label: 'Radius', type: 'theme_radius' },
        { name: 'fixed', label: 'Fixed (Sticky)', type: 'boolean' },
        { name: 'direction', label: 'Flex Direction', type: 'select', options: ['row', 'column'] },
        { name: 'align_items', label: 'Align Items', type: 'select', options: ['start', 'center', 'end', 'stretch'] },
        { name: 'justify_content', label: 'Justify Content', type: 'select', options: ['start', 'center', 'end', 'between', 'around'] }
    ],
    Gap: [
        { name: 'gap', label: 'Size', type: 'theme_spacing' }
    ],
    Divider: [
        { name: 'color', label: 'Color', type: 'theme_color' },
        { name: 'margin', label: 'Vertical Margin', type: 'theme_spacing' }
    ],
    Text: [
        { name: 'text', label: 'Content Text', type: 'string' },
        { name: 'html', label: 'HTML Content', type: 'string', helper: 'Overrides text' },
        { name: 'element', label: 'HTML Tag', type: 'html_element' },
        { name: 'font', label: 'Typography', type: 'theme_font' },
        { name: 'color', label: 'Text Color', type: 'theme_color' },
        { name: 'text_align', label: 'Alignment', type: 'select', options: ['left', 'center', 'right', 'justify'] },
        { name: 'width', label: 'Width', type: 'theme_width' },
        { name: 'padding', label: 'Padding', type: 'theme_spacing' },
        { name: 'margin', label: 'Margin', type: 'string' },
        { name: 'background', label: 'Background', type: 'theme_color' }
    ],
    Title: [
        { name: 'text', label: 'Title Text', type: 'string' },
        { name: 'element', label: 'HTML Tag', type: 'html_element' },
        { name: 'font', label: 'Typography', type: 'theme_font' },
        { name: 'color', label: 'Color', type: 'theme_color' },
        { name: 'text_align', label: 'Alignment', type: 'select', options: ['left', 'center', 'right'] },
        { name: 'margin', label: 'Margin', type: 'string' }
    ],
    Subtitle: [
        { name: 'text', label: 'Subtitle Text', type: 'string' },
        { name: 'font', label: 'Typography', type: 'theme_font' },
        { name: 'color', label: 'Color', type: 'theme_color' },
        { name: 'text_align', label: 'Alignment', type: 'select', options: ['left', 'center', 'right'] },
        { name: 'width', label: 'Width', type: 'theme_width' }
    ],
    ImageBox: [
        { name: 'src', label: 'Image URL', type: 'string' },
        { name: 'alt', label: 'Alt Text', type: 'string' },
        { name: 'width', label: 'Container Width', type: 'theme_width' },
        { name: 'max_width', label: 'Max Width', type: 'theme_width' },
        { name: 'padding', label: 'Padding', type: 'theme_spacing' },
        { name: 'object_fit', label: 'Object Fit', type: 'select', options: ['contain', 'cover', 'fill', 'none'] },
        { name: 'border_radius', label: 'Radius', type: 'theme_radius' }
    ],
    Button: [
        { name: 'text', label: 'Label', type: 'string' },
        { name: 'on_click', label: 'On Click Event', type: 'string', helper: 'Event name' },
        { name: 'width', label: 'Width', type: 'theme_width' },
        { name: 'fixed', label: 'Sticky Bottom', type: 'boolean' },
        { name: 'disabled', label: 'Disabled Logic', type: 'object' },
        { name: 'after_icon', label: 'Icon Name', type: 'string' },
        { name: 'role', label: 'Variant', type: 'select', options: ['primary', 'secondary', 'ghost', 'link'] },
        { name: 'answer_key', label: 'Answer Key', type: 'string', helper: 'If acts as submit' }
    ],
    ItemPicker: [
        { name: 'items', label: 'Items Data', type: 'string', helper: 'Usually _options' },
        { name: 'mode', label: 'Selection Mode', type: 'select', options: ['single', 'multi'] },
        { name: 'direction', label: 'Direction', type: 'select', options: ['column', 'row'] },
        { name: 'item_flavor', label: 'Item Flavor', type: 'select', options: ['card', 'minimal', 'cloud', 'image_only'] },
        { name: 'answer_key', label: 'Answer Key', type: 'string' },
        { name: 'on_select', label: 'On Select Event', type: 'string' },
        { name: 'object_fit', label: 'Image Fit', type: 'select', options: ['contain', 'cover'] }
    ],
    FocusAreas: [
        { name: 'canvas', label: 'Canvas Image', type: 'string' },
        { name: 'areas', label: 'Areas Data', type: 'string' },
        { name: 'answer_key', label: 'Answer Key', type: 'string' },
        { name: 'on_select', label: 'On Select Event', type: 'string' }
    ],
    UnitToggle: [
        { name: 'items', label: 'Items Data', type: 'string' },
        { name: 'answer_key', label: 'Answer Key', type: 'string' },
        { name: 'on_toggle', label: 'On Toggle Event', type: 'string' }
    ],
    LengthInput: [
        { name: 'answer_key', label: 'Answer Key', type: 'string' },
        { name: 'unit_answer_key', label: 'Unit Key', type: 'string' },
        { name: 'on_input', label: 'On Input Event', type: 'string' },
        { name: 'invalid', label: 'Validation Logic', type: 'object' }
    ],
    WeightInput: [
        { name: 'answer_key', label: 'Answer Key', type: 'string' },
        { name: 'unit_answer_key', label: 'Unit Key', type: 'string' },
        { name: 'on_input', label: 'On Input Event', type: 'string' },
        { name: 'invalid', label: 'Validation Logic', type: 'object' }
    ],
    NotificationCard: [
        { name: 'role', label: 'Type', type: 'select', options: ['info', 'warning', 'error', 'success'] },
        { name: 'icon', label: 'Icon', type: 'string' },
        { name: 'title_text', label: 'Title', type: 'string' },
        { name: 'body_text', label: 'Body', type: 'string' }
    ],
    Countdown: [
        { name: 'countdown_total_seconds', label: 'Total Seconds', type: 'number' },
        { name: 'countdown_text', label: 'Text', type: 'string' }
    ],
    Carousel: [
        { name: 'carousel_slides', label: 'Slides Data', type: 'string' }
    ]
};

// --- Helper Components ---

interface NodeItemProps {
    node: ComponentNode;
    path: number[];
    onUpdate: (path: number[], newNode: ComponentNode) => void;
    onDelete: (path: number[]) => void;
    onDuplicate: (path: number[]) => void;
    onAddChild: (path: number[]) => void;
    onMove: (path: number[], direction: 'up' | 'down') => void;
    onSelect: (path: number[]) => void;
    selectedPath: string;
}

const NodeItem: React.FC<NodeItemProps> = ({ node, path, onUpdate, onDelete, onDuplicate, onAddChild, onMove, onSelect, selectedPath }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const isSelected = selectedPath === path.join('-');
    const hasChildren = Array.isArray(node.children) && node.children.length > 0;
    const isDataChildren = typeof node.children === 'string';

    const componentName = node.component || node.type || 'Unknown';
    
    let Icon = Box;
    if (['Text', 'Title', 'Subtitle', 'RichText'].includes(componentName)) Icon = Type;
    if (['Button'].includes(componentName)) Icon = MousePointerClick;
    if (['ImageBox'].includes(componentName)) Icon = LayoutTemplate;

    return (
        <div className="pl-3 relative">
            <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-200"></div>
            
            <div 
                className={`relative flex items-center gap-2 p-1.5 rounded-md mb-1 group transition-all cursor-pointer border ${isSelected ? 'bg-red-50 border-red-200 shadow-sm z-10' : 'hover:bg-gray-50 border-transparent hover:border-gray-200'}`}
                onClick={(e) => { e.stopPropagation(); onSelect(path); }}
            >
                <div className="absolute -left-3 top-1/2 w-3 h-px bg-gray-200"></div>

                <button 
                    onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                    className={`p-0.5 rounded hover:bg-gray-200 text-gray-400 ${(!hasChildren && !isDataChildren) ? 'opacity-0' : ''}`}
                >
                    {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
                
                <div className={`p-1 rounded ${isSelected ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                    <Icon size={12} />
                </div>

                <span className={`text-xs font-medium ${isSelected ? 'text-gray-900 font-bold' : 'text-gray-700'}`}>
                    {componentName}
                </span>

                <div className="flex-1"></div>

                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm rounded">
                    <button onClick={(e) => { e.stopPropagation(); onMove(path, 'up'); }} className="p-1 hover:bg-gray-200 rounded text-gray-500" title="Move Up"><MoveUp size={10}/></button>
                    <button onClick={(e) => { e.stopPropagation(); onMove(path, 'down'); }} className="p-1 hover:bg-gray-200 rounded text-gray-500" title="Move Down"><MoveDown size={10}/></button>
                    <button onClick={(e) => { e.stopPropagation(); onDuplicate(path); }} className="p-1 hover:bg-purple-50 text-purple-500 rounded" title="Duplicate"><Copy size={12}/></button>
                    <button onClick={(e) => { e.stopPropagation(); onAddChild(path); }} className="p-1 hover:bg-blue-50 text-blue-500 rounded" title="Add Child"><Plus size={12}/></button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(path); }} className="p-1 hover:bg-red-50 text-red-500 rounded" title="Delete"><Trash2 size={12}/></button>
                </div>
            </div>

            {isExpanded && (
                <div className="ml-1">
                    {isDataChildren && (
                        <div className="pl-5 py-1 text-[10px] text-blue-600 font-mono bg-blue-50/30 rounded mb-1 flex items-center gap-2 relative">
                             <div className="absolute -left-4 top-1/2 w-4 h-px bg-gray-200"></div>
                            <Variable size={10} />
                            <span>Data:</span>
                            <span className="font-bold bg-blue-100 px-1 rounded border border-blue-200">{node.children as string}</span>
                        </div>
                    )}
                    {Array.isArray(node.children) && node.children.map((child, idx) => (
                        <NodeItem 
                            key={idx} 
                            node={child} 
                            path={[...path, idx]} 
                            onUpdate={onUpdate}
                            onDelete={onDelete}
                            onDuplicate={onDuplicate}
                            onAddChild={onAddChild}
                            onMove={onMove}
                            onSelect={onSelect}
                            selectedPath={selectedPath}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// --- Smart Property Control ---

interface PropControlProps {
    propKey: string;
    schema?: PropSchema;
    value: any;
    onChange: (val: any) => void;
    onDelete?: () => void;
    theme: any;
}

const PropControl: React.FC<PropControlProps> = ({ propKey, schema, value, onChange, onDelete, theme }) => {
    const isVariable = typeof value === 'string' && value.startsWith('_');
    const [mode, setMode] = useState<'static' | 'variable'>(isVariable ? 'variable' : 'static');

    // Deduce type if schema is missing (for custom props)
    const type = schema?.type || (typeof value === 'boolean' ? 'boolean' : 'string');
    
    // Prepare dropdown options based on schema type
    let options: { label: string, value: string, color?: string, font?: string }[] = [];

    if (type === 'theme_color') {
        options = Object.entries(theme.colors).map(([k, v]) => ({ label: k.replace('_', ' '), value: k, color: v as string }));
    } else if (type === 'theme_font') {
        options = Object.entries(theme.fonts).map(([k, v]) => ({ label: k.replace('_', ' '), value: k, font: v as string }));
    } else if (type === 'theme_spacing') {
        options = Object.keys(theme.spacing).map(k => ({ label: k, value: k }));
    } else if (type === 'theme_width') {
        options = Object.keys(theme.width).map(k => ({ label: k, value: k }));
    } else if (type === 'theme_radius') {
        options = Object.keys(theme.border_radius).map(k => ({ label: k, value: k }));
    } else if (type === 'select') {
        options = (schema?.options || []).map(o => ({ label: o, value: o }));
    } else if (type === 'html_element') {
        options = ['h1', 'h2', 'h3', 'h4', 'p', 'span', 'div', 'section'].map(o => ({ label: o, value: o }));
    }

    const handleModeToggle = () => {
        const newMode = mode === 'static' ? 'variable' : 'static';
        setMode(newMode);
        if (newMode === 'variable') {
            onChange(`_${propKey}_var`); 
        } else {
            onChange(undefined); // Reset to undefined/empty
        }
    };

    const renderInput = () => {
        if (mode === 'variable') {
            return (
                <div className="flex items-center bg-blue-50 border border-blue-200 rounded px-2 py-1">
                    <span className="text-blue-400 mr-1 font-bold">var:</span>
                    <input 
                        className="w-full text-xs bg-transparent border-none p-0 text-blue-700 font-mono focus:ring-0 outline-none"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="_variable_name"
                    />
                </div>
            );
        }

        if (type === 'boolean') {
            return (
                <button 
                    onClick={() => onChange(!value)}
                    className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded border transition-colors w-full ${value ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}
                >
                    {value ? <CheckSquare size={14} /> : <div className="w-3.5 h-3.5 border border-gray-400 rounded-sm"></div>}
                    {value ? 'Enabled' : 'Disabled'}
                </button>
            );
        }

        if (options.length > 0) {
            return (
                <div className="relative w-full">
                    <select 
                        className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 appearance-none bg-white pr-6 truncate focus:border-red-500 outline-none"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                    >
                        <option value="">Select...</option>
                        {options.map(opt => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <ChevronDown size={10} />
                    </div>
                    {type === 'theme_color' && value && (
                         <div 
                            className="absolute right-6 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border border-gray-200"
                            style={{ backgroundColor: options.find(o => o.value === value)?.color }}
                         ></div>
                    )}
                </div>
            );
        }

        if (type === 'object') {
             return (
                <textarea 
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 text-gray-800 font-mono h-16 outline-none focus:border-red-500"
                    value={typeof value === 'object' ? JSON.stringify(value) : value || ''}
                    onChange={(e) => {
                        try { onChange(JSON.parse(e.target.value)); } catch(err) { onChange(e.target.value); }
                    }}
                    placeholder='{"key": "value"}'
                />
             );
        }

        return (
            <input 
                className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 text-gray-800 focus:border-red-500 outline-none"
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Value..."
            />
        );
    };

    return (
        <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                    {schema?.label || propKey}
                    {schema?.helper && <span className="text-gray-300 cursor-help" title={schema.helper}>(?)</span>}
                </label>
                <div className="flex gap-1">
                    <button 
                        onClick={handleModeToggle} 
                        className={`p-0.5 rounded transition-colors ${mode === 'variable' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-300'}`}
                        title={mode === 'variable' ? "Switch to Static Value" : "Switch to Variable"}
                    >
                        <Variable size={12} />
                    </button>
                    {onDelete && (
                        <button onClick={onDelete} className="p-0.5 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded">
                            <Trash2 size={12} />
                        </button>
                    )}
                </div>
            </div>
            {renderInput()}
        </div>
    );
};

// --- Main Editor ---

export const TemplateEditor: React.FC = () => {
    const { config, updateEvents, updatePage, copyToClipboard, setActivePageId, deleteTemplate } = useFunnel();
    // Use updateEvents as a generic updateConfig wrapper
    const updateConfig = updateEvents;

    const [selectedTemplateKey, setSelectedTemplateKey] = useState<string | null>(null);
    const [selectedNodePath, setSelectedNodePath] = useState<string | null>(null);
    const [newTemplateName, setNewTemplateName] = useState('');
    const [addingProp, setAddingProp] = useState('');

    // --- Resizing State ---
    const [leftWidth, setLeftWidth] = useState(240);
    const [rightWidth, setRightWidth] = useState(300);
    const [resizing, setResizing] = useState<'left' | 'right' | null>(null);

    // Resizing Handlers
    const startResizing = (side: 'left' | 'right') => {
        setResizing(side);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    };

    useEffect(() => {
        const stopResizing = () => {
            setResizing(null);
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
        };

        const onMouseMove = (e: MouseEvent) => {
            if (resizing === 'left') {
                // Sidebar width is 256px
                // e.clientX is global X. Left panel is first child.
                // Left Panel X ~ 256. 
                // Wait, TemplateEditor is inside the App's resizable panel which starts at 256.
                // So e.clientX - 256 is roughly the mouse X inside TemplateEditor container.
                const newW = e.clientX - 256;
                if (newW > 150 && newW < 400) setLeftWidth(newW);
            } else if (resizing === 'right') {
                // Right panel width is determined from right edge.
                // We need the bounding rect of the container to be accurate, but let's try generic
                // Or just use the movementX
                setRightWidth(prev => {
                    const newW = prev - e.movementX;
                    if (newW > 250 && newW < 500) return newW;
                    return prev;
                });
            }
        };

        if (resizing) {
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', stopResizing);
        }
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [resizing]);


    const templates = config.templates || {};
    const activeTemplate = selectedTemplateKey ? templates[selectedTemplateKey] : null;

    // --- Live Preview Logic ---
    const extractVariables = useCallback((node: ComponentNode): string[] => {
        let vars: string[] = [];
        if (node.props) {
            Object.values(node.props).forEach(val => {
                if (typeof val === 'string' && val.startsWith('_')) vars.push(val);
            });
        }
        if (typeof node.children === 'string' && node.children.startsWith('_')) {
            vars.push(node.children);
        }
        if (Array.isArray(node.children)) {
            node.children.forEach(child => {
                vars = [...vars, ...extractVariables(child)];
            });
        }
        return vars;
    }, []);

    const updatePreviewPage = useCallback(() => {
        if (!selectedTemplateKey || !activeTemplate) return;

        const variables = extractVariables(activeTemplate);
        const dummyData: any = {};

        variables.forEach(v => {
            if (v.includes('image')) dummyData[v] = 'https://via.placeholder.com/300x200';
            else if (v.includes('title')) dummyData[v] = 'Sample Title';
            else if (v.includes('color')) dummyData[v] = '#f51721';
            else if (v.includes('options') || v.includes('items')) dummyData[v] = [
                { label: 'Option 1', value: '1', emoji: '🌟' },
                { label: 'Option 2', value: '2', emoji: '✨' }
            ];
            else if (v.includes('areas')) dummyData[v] = [
                { label: 'Area 1', value: '1' },
                { label: 'Area 2', value: '2' }
            ];
            else if (v.includes('html')) dummyData[v] = '<p>Sample HTML Content</p>';
            else dummyData[v] = `[${v}]`;
        });

        // Find an existing page that uses this template to preview,
        // or pick the first page and temporarily show it with this template.
        // We use setActivePageId to the first page that matches the template.
        const matchingPage = (Object.entries(config.pages) as [string, import('../types').PageConfig][]).find(([, p]) => p.template === selectedTemplateKey);
        if (matchingPage) {
            setActivePageId(matchingPage[0]);
        } else {
            // Create a transient preview page that won't pollute config
            // Use updatePage on a special key, creating it only if needed
            const previewPageId = '__template_preview__';
            updatePage(previewPageId, {
                name: "Template Preview",
                path: "0",
                template: selectedTemplateKey,
                template_data: dummyData,
                header: true,
                footer: true
            });
            setActivePageId(previewPageId);
        }

    }, [activeTemplate, selectedTemplateKey, config.pages, updatePage, setActivePageId, extractVariables]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (selectedTemplateKey) updatePreviewPage();
        }, 500);
        return () => clearTimeout(timer);
    }, [activeTemplate, selectedTemplateKey, updatePreviewPage]);

    // --- Tree Mutation Helpers ---
    const clone = (obj: any) => JSON.parse(JSON.stringify(obj));

    const getParent = (root: ComponentNode, path: number[]) => {
        let current = root;
        for (let i = 0; i < path.length - 1; i++) {
            if (Array.isArray(current.children)) {
                current = current.children[path[i]];
            } else {
                return null;
            }
        }
        return current;
    };

    const handleNodeUpdate = (path: number[], newNode: ComponentNode) => {
        if (!selectedTemplateKey || !activeTemplate) return;
        const newTemplate = clone(activeTemplate);
        
        if (path.length === 0) {
            updateConfig({ templates: { ...templates, [selectedTemplateKey]: newNode } });
            return;
        }

        const parent = getParent(newTemplate, path);
        if (parent && Array.isArray(parent.children)) {
            parent.children[path[path.length - 1]] = newNode;
            updateConfig({ templates: { ...templates, [selectedTemplateKey]: newTemplate } });
        }
    };

    const handleNodeDelete = (path: number[]) => {
        if (!selectedTemplateKey || !activeTemplate) return;
        if (path.length === 0) {
            alert("Cannot delete root node.");
            return;
        }

        const newTemplate = clone(activeTemplate);
        const parent = getParent(newTemplate, path);
        if (parent && Array.isArray(parent.children)) {
            parent.children.splice(path[path.length - 1], 1);
            updateConfig({ templates: { ...templates, [selectedTemplateKey]: newTemplate } });
            setSelectedNodePath(null);
        }
    };

    const handleDuplicate = (path: number[]) => {
        if (!selectedTemplateKey || !activeTemplate || path.length === 0) return;
        const newTemplate = clone(activeTemplate);
        
        const parent = getParent(newTemplate, path);
        if (parent && Array.isArray(parent.children)) {
            const index = path[path.length - 1];
            // Clone the node at index
            const nodeToDuplicate = parent.children[index];
            const newNode = clone(nodeToDuplicate);
            
            // Insert it after the original
            parent.children.splice(index + 1, 0, newNode);
            
            updateConfig({ templates: { ...templates, [selectedTemplateKey]: newTemplate } });
        }
    };

    const handleAddChild = (path: number[]) => {
        if (!selectedTemplateKey || !activeTemplate) return;
        const newTemplate = clone(activeTemplate);
        
        let targetNode = newTemplate;
        if (path.length > 0) {
            let current = newTemplate;
            for (let i = 0; i < path.length; i++) {
                if (Array.isArray(current.children)) {
                    current = current.children[path[i]];
                }
            }
            targetNode = current;
        }

        if (typeof targetNode.children === 'string') {
            if (!confirm(`Overwrite binding "${targetNode.children}" with components?`)) return;
            targetNode.children = [];
        }

        if (!targetNode.children) targetNode.children = [];
        (targetNode.children as ComponentNode[]).push({
            component: 'Text',
            props: { text: 'New Text' }
        });

        updateConfig({ templates: { ...templates, [selectedTemplateKey]: newTemplate } });
    };

    const handleMove = (path: number[], direction: 'up' | 'down') => {
        if (!selectedTemplateKey || !activeTemplate || path.length === 0) return;
        const newTemplate = clone(activeTemplate);
        
        const parent = getParent(newTemplate, path);
        if (parent && Array.isArray(parent.children)) {
            const index = path[path.length - 1];
            if (direction === 'up' && index > 0) {
                const temp = parent.children[index];
                parent.children[index] = parent.children[index - 1];
                parent.children[index - 1] = temp;
            } else if (direction === 'down' && index < parent.children.length - 1) {
                const temp = parent.children[index];
                parent.children[index] = parent.children[index + 1];
                parent.children[index + 1] = temp;
            }
            updateConfig({ templates: { ...templates, [selectedTemplateKey]: newTemplate } });
        }
    };

    // --- Property Logic ---

    const getSelectedNode = (): ComponentNode | null => {
        if (!activeTemplate || !selectedNodePath) return null;
        const path = selectedNodePath.split('-').map(Number);
        if (path.length === 1 && isNaN(path[0])) return activeTemplate; 
        
        let current = activeTemplate;
        if (selectedNodePath === 'root') return activeTemplate;

        try {
            for (let i = 0; i < path.length; i++) {
                 if (Array.isArray(current.children)) {
                     current = current.children[path[i]];
                 } else {
                     return null;
                 }
            }
            return current;
        } catch(e) { return null; }
    };

    const selectedNode = selectedNodePath === 'root' ? activeTemplate : getSelectedNode();

    const handlePropChange = (key: string, value: any) => {
        if (!selectedNode || !selectedNodePath) return;
        const newTemplate = clone(activeTemplate);
        let target = newTemplate;
        if (selectedNodePath !== 'root') {
             const path = selectedNodePath.split('-').map(Number);
             for (let i = 0; i < path.length; i++) {
                 target = target.children![path[i]];
             }
        }

        if (key === '__component__') {
            target.component = value;
        } else if (key === '__children_binding__') {
            target.children = value; 
        } else {
            if (!target.props) target.props = {};
            if (value === undefined || value === '') {
                delete target.props[key]; // Clean up JSON
            } else {
                target.props[key] = value;
            }
        }
        updateConfig({ templates: { ...templates, [selectedTemplateKey!]: newTemplate } });
    };

    const addNewTemplate = () => {
        if (!newTemplateName) return;
        const key = newTemplateName.toLowerCase().replace(/\s+/g, '_');
        if (templates[key]) { alert('Exists'); return; }
        updateConfig({ templates: { ...templates, [key]: { component: 'Page', props: { width: 'narrow_page' }, children: [] } } });
        setSelectedTemplateKey(key);
        setNewTemplateName('');
        setSelectedNodePath('root');
    };

    const componentSchemas = selectedNode ? COMPONENT_SCHEMAS[selectedNode.component || selectedNode.type || ''] || [] : [];

    return (
        <div className="h-full flex flex-col bg-white border-l border-gray-200 shadow-xl">
            <div className="p-4 border-b border-gray-200 bg-white z-10 flex justify-between items-center shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <LayoutTemplate size={24} className="text-[#f51721]" /> Template Editor
                    </h2>
                    <p className="text-xs text-gray-500">Design component structures</p>
                </div>
                <ExportMenu 
                    onDownload={() => {}}
                    onCopy={() => copyToClipboard(templates)}
                    label="Export All"
                />
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left: Template List - Resizable */}
                <div 
                    className="flex flex-col border-r border-gray-200 bg-gray-50 relative flex-shrink-0"
                    style={{ width: leftWidth }}
                >
                    <div className="p-3 border-b border-gray-200">
                        <div className="flex gap-2">
                            <input 
                                value={newTemplateName}
                                onChange={(e) => setNewTemplateName(e.target.value)}
                                placeholder="New Template..."
                                className="flex-1 text-xs px-2 py-1.5 border rounded outline-none focus:border-[#f51721]"
                            />
                            <button onClick={addNewTemplate} disabled={!newTemplateName} className="bg-[#f51721] text-white p-1.5 rounded disabled:opacity-50">
                                <Plus size={16} />
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {Object.keys(templates).map(key => (
                            <button 
                                key={key}
                                onClick={() => { setSelectedTemplateKey(key); setSelectedNodePath('root'); }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex justify-between items-center group transition-all ${selectedTemplateKey === key ? 'bg-white shadow text-[#f51721] border border-gray-200' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                                <span className="truncate">{key}</span>
                                {selectedTemplateKey === key && <span className="w-2 h-2 rounded-full bg-[#f51721] ml-2"></span>}
                            </button>
                        ))}
                    </div>
                    
                    {/* Left Resize Handle */}
                    <div 
                        className="absolute top-0 bottom-0 right-0 w-1 cursor-col-resize hover:bg-red-400 z-20"
                        onMouseDown={() => startResizing('left')}
                    ></div>
                </div>

                {/* Middle: Component Tree */}
                <div className="flex-1 overflow-y-auto p-4 bg-white relative">
                    {activeTemplate ? (
                        <>
                            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100 sticky top-0 bg-white z-10">
                                <h3 className="font-bold text-sm text-gray-700">{selectedTemplateKey}</h3>
                                <div className="flex gap-1">
                                    <button onClick={() => {
                                        const newKey = `${selectedTemplateKey}_copy`;
                                        updateConfig({ templates: { ...templates, [newKey]: clone(activeTemplate) } });
                                        setSelectedTemplateKey(newKey);
                                    }} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded" title="Duplicate"><Copy size={16}/></button>
                                    <button 
                                        onMouseDown={(e) => e.stopPropagation()} 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if(!window.confirm('Delete?')) return;
                                            if (selectedTemplateKey) {
                                                deleteTemplate(selectedTemplateKey);
                                                setSelectedTemplateKey(null);
                                                setSelectedNodePath(null);
                                            }
                                        }} 
                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded" 
                                        title="Delete"
                                    >
                                        <Trash2 size={16}/>
                                    </button>
                                </div>
                            </div>
                            
                            <div className="pl-4 pb-10">
                                <div 
                                    className={`relative flex items-center gap-2 p-2 rounded-md mb-2 cursor-pointer border ${selectedNodePath === 'root' ? 'bg-red-50 border-red-200 text-gray-900 shadow-sm' : 'border-gray-300 bg-gray-50 text-gray-700'}`}
                                    onClick={() => setSelectedNodePath('root')}
                                >
                                    <div className={`p-1 rounded ${selectedNodePath === 'root' ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-500'}`}>
                                        <Activity size={12} />
                                    </div>
                                    <span className="font-bold text-xs uppercase">{activeTemplate.component || 'Page'} (Root)</span>
                                    <button onClick={(e) => { e.stopPropagation(); handleAddChild([]); }} className="ml-auto p-1 hover:bg-blue-100 text-blue-600 rounded bg-white border border-gray-200 shadow-sm"><Plus size={12}/></button>
                                </div>

                                <div className="space-y-0.5 border-l-2 border-gray-100 ml-4 pl-0">
                                    {Array.isArray(activeTemplate.children) ? (
                                        activeTemplate.children.map((child, idx) => (
                                            <NodeItem 
                                                key={idx} 
                                                node={child} 
                                                path={[idx]} 
                                                onUpdate={handleNodeUpdate}
                                                onDelete={handleNodeDelete}
                                                onDuplicate={handleDuplicate}
                                                onAddChild={handleAddChild}
                                                onMove={handleMove}
                                                onSelect={(p) => setSelectedNodePath(p.join('-'))}
                                                selectedPath={selectedNodePath || ''}
                                            />
                                        ))
                                    ) : (
                                        <div className="p-4 bg-blue-50 text-blue-700 text-xs rounded border border-blue-200 font-mono text-center ml-4">
                                            Bound to: {activeTemplate.children}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <LayoutTemplate size={48} className="mb-2 opacity-20" />
                            <p className="text-sm">Select a template to edit structure</p>
                        </div>
                    )}
                </div>

                {/* Right: Prop Inspector - Resizable */}
                {selectedNode && (
                    <div 
                        className="border-l border-gray-200 bg-gray-50 overflow-y-auto p-4 shadow-inner relative flex-shrink-0"
                        style={{ width: rightWidth }}
                    >
                         {/* Right Resize Handle */}
                        <div 
                            className="absolute top-0 bottom-0 left-0 w-1 cursor-col-resize hover:bg-red-400 z-20"
                            onMouseDown={() => startResizing('right')}
                        ></div>

                        <h4 className="font-bold text-xs text-gray-700 uppercase mb-4 flex items-center gap-2 pb-2 border-b border-gray-200">
                            <Settings size={14} /> Component Settings
                        </h4>
                        
                        <div className="space-y-6">
                            {/* Component Type */}
                            <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Type</label>
                                <select 
                                    value={selectedNode.component || selectedNode.type || ''}
                                    onChange={(e) => handlePropChange('__component__', e.target.value)}
                                    className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 font-bold text-gray-800 focus:ring-1 focus:ring-red-500 outline-none"
                                >
                                    {AVAILABLE_COMPONENTS.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Schema-Driven Properties */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Properties</label>
                                </div>
                                <div className="space-y-1">
                                    {/* Render schema props first */}
                                    {componentSchemas.map(schema => (
                                        <PropControl 
                                            key={schema.name}
                                            propKey={schema.name}
                                            schema={schema}
                                            value={selectedNode.props?.[schema.name]}
                                            onChange={(val) => handlePropChange(schema.name, val)}
                                            theme={config.theme}
                                        />
                                    ))}
                                    
                                    {/* Render any Custom Properties not in schema */}
                                    {selectedNode.props && Object.keys(selectedNode.props)
                                        .filter(k => !componentSchemas.some(s => s.name === k))
                                        .map(key => (
                                            <PropControl 
                                                key={key}
                                                propKey={key}
                                                value={selectedNode.props?.[key]}
                                                onChange={(val) => handlePropChange(key, val)}
                                                onDelete={() => handlePropChange(key, undefined)}
                                                theme={config.theme}
                                            />
                                        ))
                                    }
                                </div>
                            </div>

                            {/* Add Property - Enhanced with Common Props Dropdown */}
                            <div className="pt-4 border-t border-gray-200">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Add Property</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input 
                                            className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 pr-6"
                                            placeholder="Prop Name"
                                            value={addingProp}
                                            onChange={(e) => setAddingProp(e.target.value)}
                                            list="common-props"
                                        />
                                        <datalist id="common-props">
                                            {COMMON_PROPS_LIST.map(p => <option key={p} value={p} />)}
                                        </datalist>
                                    </div>
                                    <button 
                                        onClick={() => { if(addingProp) { handlePropChange(addingProp, ''); setAddingProp(''); } }}
                                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-xs font-bold hover:bg-gray-300"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>

                            {/* Children Binding */}
                            <div className="border-t border-gray-200 pt-4">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 flex items-center gap-1">
                                    <Variable size={10} /> Data Binding (Children)
                                </label>
                                <input 
                                    className="w-full text-xs border border-blue-200 bg-blue-50 rounded px-2 py-2 font-mono text-blue-700"
                                    placeholder="_variable_name (overrides tree)"
                                    value={typeof selectedNode.children === 'string' ? selectedNode.children : ''}
                                    onChange={(e) => handlePropChange('__children_binding__', e.target.value || [])}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
