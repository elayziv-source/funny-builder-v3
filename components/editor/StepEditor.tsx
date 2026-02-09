
import React, { useState } from 'react';
import { useFunnel } from '../../context/FunnelContext';
import { TEMPLATE_OPTIONS, TEMPLATE_CATEGORIES, TemplateCategory } from '../../constants';
import { Trash2, Plus, Image as ImageIcon, ChevronDown, ChevronUp, GripVertical, Copy, Settings, Layers, Activity, Type, Hammer, BoxSelect, ShieldCheck, Brain, GitBranch, ArrowRight } from 'lucide-react';
import * as Icons from 'lucide-react';
import { ExportMenu } from '../ui/ExportMenu';
import { BlockItem, BlockType } from '../../types';

const QUIZ_PHASES = [
  { maxPath: 5, name: 'Identity Phase', color: '#8b5cf6', bgColor: 'rgba(139,92,246,0.12)', borderColor: 'rgba(139,92,246,0.25)', tip: "Ask 'who are you' questions. Build rapport." },
  { maxPath: 15, name: 'Behavioral Phase', color: '#3b82f6', bgColor: 'rgba(59,130,246,0.12)', borderColor: 'rgba(59,130,246,0.25)', tip: 'Ask about habits and lifestyle. Establish pain.' },
  { maxPath: 25, name: 'Problem Phase', color: '#f59e0b', bgColor: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.25)', tip: 'Address struggles and goals. Amplify desire.' },
  { maxPath: Infinity, name: 'Visualization Phase', color: '#22c55e', bgColor: 'rgba(34,197,94,0.12)', borderColor: 'rgba(34,197,94,0.25)', tip: 'Show results and transformation. Build commitment.' },
];

const getQuizPhaseForEditor = (path: string) => {
  const num = parseInt(path, 10);
  if (isNaN(num)) return QUIZ_PHASES[0];
  for (const phase of QUIZ_PHASES) {
    if (num <= phase.maxPath) return phase;
  }
  return QUIZ_PHASES[3];
};


// Resolve template fields dynamically from template definition
interface TemplateFieldMap {
  titleField: string;
  titleFont: string;
  subtitleField: string;
  subtitleFont: string;
  imageField: string;
  imageAltField: string;
  buttonTextField: string;
  htmlField: string;
  extraFields: { key: string; label: string; type: 'text' | 'image' | 'html' | 'color' | 'event' }[];
}

const resolveTemplateFields = (templateDef: any): TemplateFieldMap => {
  const defaults: TemplateFieldMap = {
    titleField: '_title_text',
    titleFont: '_title_font',
    subtitleField: '_sub_title_text',
    subtitleFont: '_sub_title_font',
    imageField: '_image_src',
    imageAltField: '_image_alt',
    buttonTextField: '_button_text',
    htmlField: '_html',
    extraFields: [],
  };

  if (!templateDef) return defaults;

  const foundFields = new Set<string>();
  let titleResolved = false;
  let subtitleResolved = false;
  let imageResolved = false;
  let buttonResolved = false;

  const walk = (node: any) => {
    if (!node) return;
    const comp = node.component;
    const props = node.props || {};

    // Resolve title: first Text with font=title or element=h1
    if (comp === 'Text' && !titleResolved) {
      const textField = props.text || props.html;
      if (textField && typeof textField === 'string' && textField.startsWith('_')) {
        if (props.font === 'title' || props.element === 'h1') {
          defaults.titleField = textField;
          if (props.html) defaults.titleField = textField;
          titleResolved = true;
          foundFields.add(textField);
        }
      }
    }

    // Resolve subtitle: first Text with font=sub_title (after title found)
    if (comp === 'Text' && titleResolved && !subtitleResolved) {
      const textField = props.text || props.html;
      if (textField && typeof textField === 'string' && textField.startsWith('_') && !foundFields.has(textField)) {
        if (props.font === 'sub_title' || props.font === 'body') {
          defaults.subtitleField = textField;
          subtitleResolved = true;
          foundFields.add(textField);
        }
      }
    }

    // Resolve image: first ImageBox
    if ((comp === 'ImageBox' || comp === 'Image') && !imageResolved) {
      if (props.src && typeof props.src === 'string' && props.src.startsWith('_')) {
        defaults.imageField = props.src;
        if (props.alt && typeof props.alt === 'string' && props.alt.startsWith('_')) {
          defaults.imageAltField = props.alt;
        }
        imageResolved = true;
        foundFields.add(props.src);
        if (props.alt) foundFields.add(props.alt);
      }
    }

    // Resolve button: first Button
    if (comp === 'Button' && !buttonResolved) {
      if (props.text && typeof props.text === 'string' && props.text.startsWith('_')) {
        defaults.buttonTextField = props.text;
        buttonResolved = true;
        foundFields.add(props.text);
      }
    }

    // Collect extra text/html fields
    if (comp === 'Text') {
      const field = props.text || props.html;
      if (field && typeof field === 'string' && field.startsWith('_') && !foundFields.has(field)) {
        const isHtml = !!props.html;
        defaults.extraFields.push({
          key: field,
          label: field.replace(/^_/, '').replace(/_/g, ' '),
          type: isHtml ? 'html' : 'text',
        });
        foundFields.add(field);
      }
    }

    // Collect extra buttons
    if (comp === 'Button' && buttonResolved) {
      if (props.text && typeof props.text === 'string' && props.text.startsWith('_') && !foundFields.has(props.text)) {
        defaults.extraFields.push({
          key: props.text,
          label: props.text.replace(/^_/, '').replace(/_/g, ' '),
          type: 'text',
        });
        foundFields.add(props.text);
      }
      if (props.on_click && typeof props.on_click === 'string' && props.on_click.startsWith('_') && !foundFields.has(props.on_click)) {
        defaults.extraFields.push({
          key: props.on_click,
          label: props.on_click.replace(/^_/, '').replace(/_/g, ' '),
          type: 'event',
        });
        foundFields.add(props.on_click);
      }
      if (props.background_color && typeof props.background_color === 'string' && props.background_color.startsWith('_') && !foundFields.has(props.background_color)) {
        defaults.extraFields.push({
          key: props.background_color,
          label: props.background_color.replace(/^_/, '').replace(/_/g, ' '),
          type: 'color',
        });
        foundFields.add(props.background_color);
      }
    }

    // Collect extra images
    if ((comp === 'ImageBox' || comp === 'Image') && imageResolved) {
      if (props.src && typeof props.src === 'string' && props.src.startsWith('_') && !foundFields.has(props.src)) {
        defaults.extraFields.push({
          key: props.src,
          label: props.src.replace(/^_/, '').replace(/_/g, ' '),
          type: 'image',
        });
        foundFields.add(props.src);
      }
    }

    // Recurse children
    if (Array.isArray(node.children)) {
      node.children.forEach(walk);
    }
  };

  walk(templateDef);
  return defaults;
};
export const StepEditor: React.FC = () => {
  const { config, activePageId, updatePage, updateEvents, deletePage, downloadPageConfig, copyToClipboard } = useFunnel();
  const activePage = config.pages[activePageId];
  const [showTemplates, setShowTemplates] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'settings'>('content');
  const [draggedOption, setDraggedOption] = useState<number | null>(null);
  const [showValidation, setShowValidation] = useState(true);
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState<TemplateCategory | 'all'>('all');

  if (!activePage) {
    return (
      <div className="p-8 text-center text-gray-500">
        No page selected. Select one from the sidebar.
      </div>
    );
  }

  // Resolve field names from template definition
  const templateDef = config.templates?.[activePage.template];
  const fieldMap = resolveTemplateFields(templateDef);

  const handleChange = (field: string, value: any) => {
    updatePage(activePageId, { ...activePage, [field]: value });
  };

  const handleMetaChange = (field: string, value: string) => {
      updatePage(activePageId, {
          ...activePage,
          meta: {
              ...activePage.meta,
              [field]: value
          } as any
      });
  };

  const handleDataChange = (field: string, value: any) => {
    updatePage(activePageId, {
      ...activePage,
      template_data: { ...(activePage.template_data || {}), [field]: value }
    });
  };

  const handleOptionChange = (idx: number, field: string, value: string) => {
    const newOptions = [...(activePage.template_data?._options || [])];
    newOptions[idx] = { ...newOptions[idx], [field]: value };
    handleDataChange('_options', newOptions);
  };

  const addOption = () => {
    const newOptions = [...(activePage.template_data?._options || []), { label: 'New Option', value: 'new_val' }];
    handleDataChange('_options', newOptions);
  };

  const removeOption = (idx: number) => {
     const newOptions = [...(activePage.template_data?._options || [])];
     newOptions.splice(idx, 1);
     handleDataChange('_options', newOptions);
  }

  const duplicateOption = (idx: number) => {
      const options = activePage.template_data?._options || [];
      const optionToClone = options[idx];
      const newOption = { ...optionToClone, value: `${optionToClone.value}_copy`, label: `${optionToClone.label} (Copy)` };
      const newOptions = [...options.slice(0, idx + 1), newOption, ...options.slice(idx + 1)];
      handleDataChange('_options', newOptions);
  }

  // Option Drag and Drop
  const handleOptionDragStart = (e: React.DragEvent, idx: number) => {
      setDraggedOption(idx);
      e.dataTransfer.effectAllowed = 'move';
  };

  const handleOptionDragOver = (e: React.DragEvent, targetIdx: number) => {
      e.preventDefault();
      if (draggedOption === null || draggedOption === targetIdx) return;
      
      const newOptions = [...(activePage.template_data?._options || [])];
      const item = newOptions[draggedOption];
      newOptions.splice(draggedOption, 1);
      newOptions.splice(targetIdx, 0, item);
      
      handleDataChange('_options', newOptions);
      setDraggedOption(targetIdx);
  };

  const handleOptionDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setDraggedOption(null);
  };

  // --- Block Builder Logic (Custom Composition) ---
  const handleBlockChange = (idx: number, field: keyof BlockItem, value: any) => {
      const newBlocks = [...(activePage.template_data?._blocks || [])];
      newBlocks[idx] = { ...newBlocks[idx], [field]: value };
      handleDataChange('_blocks', newBlocks);
  };

  const addBlock = (type: BlockType) => {
      const newBlock: BlockItem = {
          id: `block-${Date.now()}`,
          type,
          content: type === 'button' ? 'Continue' : type === 'image' ? '' : 'New Content',
          // Add default options for option blocks
          options: (type === 'options_single' || type === 'options_multi') 
            ? [{ label: 'Option A', value: 'A' }, { label: 'Option B', value: 'B' }] 
            : undefined
      };
      const newBlocks = [...(activePage.template_data?._blocks || []), newBlock];
      handleDataChange('_blocks', newBlocks);
  };

  const removeBlock = (idx: number) => {
      const newBlocks = [...(activePage.template_data?._blocks || [])];
      newBlocks.splice(idx, 1);
      handleDataChange('_blocks', newBlocks);
  };

  const moveBlock = (idx: number, direction: -1 | 1) => {
      const newBlocks = [...(activePage.template_data?._blocks || [])];
      if (idx + direction < 0 || idx + direction >= newBlocks.length) return;
      
      const temp = newBlocks[idx];
      newBlocks[idx] = newBlocks[idx + direction];
      newBlocks[idx + direction] = temp;
      handleDataChange('_blocks', newBlocks);
  };

  // Tracking Events Management
  const addTrackingEvent = () => {
      const newEvents = [...(activePage.tracking_events || []), { type: 'pixel', name: 'ViewContent' } as const];
      handleChange('tracking_events', newEvents);
  };

  const updateTrackingEvent = (idx: number, field: string, value: string) => {
      const newEvents = [...(activePage.tracking_events || [])];
      newEvents[idx] = { ...newEvents[idx], [field]: value };
      handleChange('tracking_events', newEvents);
  };

  const removeTrackingEvent = (idx: number) => {
      const newEvents = [...(activePage.tracking_events || [])];
      newEvents.splice(idx, 1);
      handleChange('tracking_events', newEvents);
  };

  // --- Validation Rules Detection ---
  const VALIDATION_CONDITIONS = [
    { value: 'not_between', label: 'Not Between', fields: 'two_numbers' },
    { value: 'not_valid_email', label: 'Not Valid Email', fields: 'none' },
    { value: 'empty', label: 'Empty', fields: 'none' },
    { value: 'present', label: 'Present', fields: 'none' },
    { value: 'gt', label: 'Greater Than', fields: 'single_number' },
    { value: 'lt', label: 'Less Than', fields: 'single_number' },
    { value: 'regex', label: 'Regex Match', fields: 'text' },
    { value: 'not_regex', label: 'Regex No Match', fields: 'text' },
  ];

  const detectValidationInputs = (): string[] => {
    const td = activePage.template_data || {};
    const inputNames = new Set<string>();
    for (const key of Object.keys(td)) {
      // Match keys like _weight_invalid_condition_values, _age_invalid_msg, _weight_answer_key
      const invalidMatch = key.match(/^_(.+?)_invalid_/);
      const answerMatch = key.match(/^_(.+?)_answer_key$/);
      if (invalidMatch) inputNames.add(invalidMatch[1]);
      if (answerMatch) inputNames.add(answerMatch[1]);
    }
    return Array.from(inputNames).sort();
  };

  const validationInputs = detectValidationInputs();

  const getValidationCondition = (inputName: string): string => {
    const td = activePage.template_data || {};
    // Derive condition from condition_values presence or stored condition type
    // Check for a stored condition key first
    const stored = td[`_${inputName}_invalid_condition`];
    if (stored) return stored as string;
    // Fallback: if condition_values exists, default to not_between
    if (td[`_${inputName}_invalid_condition_values`] !== undefined) return 'not_between';
    return 'not_between';
  };

  const getValidationConditionValues = (inputName: string): any[] => {
    const td = activePage.template_data || {};
    const vals = td[`_${inputName}_invalid_condition_values`];
    if (Array.isArray(vals)) return vals;
    if (vals !== undefined) return [vals];
    return [];
  };

  const getValidationMessage = (inputName: string): string => {
    const td = activePage.template_data || {};
    return (td[`_${inputName}_invalid_msg`] as string) || '';
  };

  const handleValidationConditionChange = (inputName: string, condition: string) => {
    handleDataChange(`_${inputName}_invalid_condition`, condition);
    // Reset condition values when switching condition types
    const meta = VALIDATION_CONDITIONS.find(c => c.value === condition);
    if (meta?.fields === 'none') {
      handleDataChange(`_${inputName}_invalid_condition_values`, []);
    } else if (meta?.fields === 'two_numbers') {
      const current = getValidationConditionValues(inputName);
      if (current.length !== 2) handleDataChange(`_${inputName}_invalid_condition_values`, [0, 100]);
    } else if (meta?.fields === 'single_number') {
      const current = getValidationConditionValues(inputName);
      if (current.length !== 1) handleDataChange(`_${inputName}_invalid_condition_values`, [0]);
    } else if (meta?.fields === 'text') {
      const current = getValidationConditionValues(inputName);
      if (current.length === 0) handleDataChange(`_${inputName}_invalid_condition_values`, ['']);
    }
  };

  const handleConditionValueChange = (inputName: string, index: number, value: string, isNumber: boolean) => {
    const current = [...getValidationConditionValues(inputName)];
    current[index] = isNumber ? (value === '' ? '' : Number(value)) : value;
    handleDataChange(`_${inputName}_invalid_condition_values`, current);
  };

  const getTemplateUsageCount = (templateValue: string): number => {
    return (Object.values(config.pages) as { template: string }[]).filter(p => p.template === templateValue).length;
  };

  const totalPages = Object.keys(config.pages).length;
  const isRecommendedTemplate = (templateValue: string) => totalPages <= 1 && templateValue === 'image_button_template';

  const filteredTemplates = templateCategoryFilter === 'all'
    ? TEMPLATE_OPTIONS
    : TEMPLATE_OPTIONS.filter(t => t.category === templateCategoryFilter);

  const renderMiniPreview = (preview: string, isActive: boolean) => {
    const bg = isActive ? 'bg-red-100' : 'bg-gray-100';
    const fg = isActive ? 'bg-red-300' : 'bg-gray-300';
    const fgDark = isActive ? 'bg-red-400' : 'bg-gray-400';
    const base = `w-[80px] h-[60px] rounded ${bg} flex flex-col items-center justify-center p-1.5 flex-shrink-0 overflow-hidden`;

    switch (preview) {
      case 'image_button':
        return (
          <div className={base}>
            <div className={`w-full flex-1 rounded-sm ${fg}`} />
            <div className={`w-full h-[8px] mt-1 rounded-sm ${fgDark}`} />
          </div>
        );
      case 'pick_hero':
        return (
          <div className={base}>
            <div className="flex gap-1 flex-1 w-full items-center justify-center">
              <div className={`w-[28px] h-[28px] rounded-sm ${fg}`} />
              <div className={`w-[28px] h-[28px] rounded-sm ${fg}`} />
            </div>
            <div className="flex gap-1 w-full justify-center">
              <div className={`w-[28px] h-[4px] rounded-sm ${fgDark}`} />
              <div className={`w-[28px] h-[4px] rounded-sm ${fgDark}`} />
            </div>
          </div>
        );
      case 'image_content_button':
        return (
          <div className={base}>
            <div className={`w-[50px] h-[22px] rounded-sm ${fg}`} />
            <div className={`w-full h-[4px] mt-1 rounded-sm ${fgDark}`} />
            <div className={`w-3/4 h-[4px] mt-0.5 rounded-sm ${fg}`} />
            <div className={`w-full h-[8px] mt-1 rounded-sm ${fgDark}`} />
          </div>
        );
      case 'image_bullets_hero':
        return (
          <div className={base}>
            <div className={`w-full h-[20px] rounded-sm ${fg}`} />
            <div className="w-full mt-1 space-y-0.5">
              <div className="flex items-center gap-0.5">
                <div className={`w-[4px] h-[4px] rounded-full ${fgDark}`} />
                <div className={`flex-1 h-[3px] rounded-sm ${fg}`} />
              </div>
              <div className="flex items-center gap-0.5">
                <div className={`w-[4px] h-[4px] rounded-full ${fgDark}`} />
                <div className={`flex-1 h-[3px] rounded-sm ${fg}`} />
              </div>
              <div className="flex items-center gap-0.5">
                <div className={`w-[4px] h-[4px] rounded-full ${fgDark}`} />
                <div className={`flex-1 h-[3px] rounded-sm ${fg}`} />
              </div>
            </div>
          </div>
        );
      case 'pick_single':
        return (
          <div className={`${base} gap-1`}>
            <div className={`w-full h-[10px] rounded-sm ${fg} border border-opacity-20`} />
            <div className={`w-full h-[10px] rounded-sm ${fg} border border-opacity-20`} />
            <div className={`w-full h-[10px] rounded-sm ${fg} border border-opacity-20`} />
          </div>
        );
      case 'pick_multi':
        return (
          <div className={`${base} gap-1`}>
            <div className="flex items-center gap-1 w-full">
              <div className={`w-[8px] h-[8px] rounded-sm border-2 ${isActive ? 'border-red-400' : 'border-gray-400'}`} />
              <div className={`flex-1 h-[8px] rounded-sm ${fg}`} />
            </div>
            <div className="flex items-center gap-1 w-full">
              <div className={`w-[8px] h-[8px] rounded-sm border-2 ${isActive ? 'border-red-400' : 'border-gray-400'}`} />
              <div className={`flex-1 h-[8px] rounded-sm ${fg}`} />
            </div>
            <div className="flex items-center gap-1 w-full">
              <div className={`w-[8px] h-[8px] rounded-sm border-2 ${isActive ? 'border-red-400' : 'border-gray-400'}`} />
              <div className={`flex-1 h-[8px] rounded-sm ${fg}`} />
            </div>
          </div>
        );
      case 'pick_cloud':
        return (
          <div className={base}>
            <div className="flex flex-wrap gap-0.5 justify-center">
              <div className={`px-2 h-[10px] rounded-full ${fg}`} />
              <div className={`px-3 h-[10px] rounded-full ${fgDark}`} />
              <div className={`px-2 h-[10px] rounded-full ${fg}`} />
              <div className={`px-3 h-[10px] rounded-full ${fg}`} />
              <div className={`px-2 h-[10px] rounded-full ${fgDark}`} />
            </div>
          </div>
        );
      case 'focus_area':
        return (
          <div className={base}>
            <div className="relative">
              <div className={`w-[24px] h-[32px] rounded-full ${fg}`} />
              <div className={`absolute top-1 left-1/2 -translate-x-1/2 w-[6px] h-[6px] rounded-full ${fgDark}`} />
              <div className={`absolute top-3 left-0 w-[4px] h-[4px] rounded-full ${fgDark}`} />
              <div className={`absolute top-3 right-0 w-[4px] h-[4px] rounded-full ${fgDark}`} />
              <div className={`absolute bottom-1 left-1 w-[4px] h-[4px] rounded-full ${fgDark}`} />
              <div className={`absolute bottom-1 right-1 w-[4px] h-[4px] rounded-full ${fgDark}`} />
            </div>
          </div>
        );
      case 'height_input':
        return (
          <div className={base}>
            <div className="flex items-end gap-1 h-full w-full justify-center">
              <div className={`w-[4px] h-full rounded-sm ${fg}`} />
              <div className="flex flex-col justify-between h-full">
                <div className={`w-[12px] h-[2px] ${fgDark}`} />
                <div className={`w-[8px] h-[2px] ${fg}`} />
                <div className={`w-[12px] h-[2px] ${fgDark}`} />
                <div className={`w-[8px] h-[2px] ${fg}`} />
                <div className={`w-[12px] h-[2px] ${fgDark}`} />
              </div>
              <div className={`text-[8px] font-bold ${isActive ? 'text-red-400' : 'text-gray-400'}`}>cm</div>
            </div>
          </div>
        );
      case 'weight_input':
        return (
          <div className={base}>
            <div className={`w-[40px] h-[24px] rounded ${fg} flex items-center justify-center`}>
              <span className={`text-[8px] font-bold ${isActive ? 'text-red-500' : 'text-gray-500'}`}>kg</span>
            </div>
            <div className={`w-full h-[4px] mt-1 rounded-full ${fgDark}`}>
              <div className={`w-1/2 h-full rounded-full ${isActive ? 'bg-red-400' : 'bg-gray-500'}`} />
            </div>
          </div>
        );
      case 'age_input':
        return (
          <div className={base}>
            <div className={`w-[46px] h-[22px] rounded border-2 ${isActive ? 'border-red-300' : 'border-gray-300'} flex items-center justify-center`}>
              <span className={`text-[10px] font-bold ${isActive ? 'text-red-400' : 'text-gray-400'}`}>28</span>
            </div>
            <div className={`w-full h-[8px] mt-1.5 rounded-sm ${fgDark}`} />
          </div>
        );
      case 'email_input':
        return (
          <div className={base}>
            <div className={`w-full h-[14px] rounded border ${isActive ? 'border-red-300' : 'border-gray-300'} flex items-center px-1`}>
              <span className={`text-[6px] ${isActive ? 'text-red-300' : 'text-gray-300'}`}>@</span>
              <div className={`flex-1 h-[3px] ml-0.5 rounded-sm ${fg}`} />
            </div>
            <div className={`w-full h-[8px] mt-1.5 rounded-sm ${fgDark}`} />
          </div>
        );
      default:
        return (
          <div className={base}>
            <div className={`w-8 h-8 rounded ${fg}`} />
          </div>
        );
    }
  };

  const fontOptions = Object.keys(config.theme.fonts);

  const currentTemplateLabel = TEMPLATE_OPTIONS.find(t => t.value === activePage.template)?.label || activePage.template;

  return (
    <div className="h-full overflow-y-auto bg-white border-l border-gray-200 shadow-xl pb-20 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-white z-20 border-b border-gray-200 p-6 flex justify-between items-start shadow-sm flex-shrink-0">
        <div>
            <h2 className="text-xl font-bold text-gray-800">Edit Step</h2>
            <div className="flex items-center gap-2 mt-1">
                 <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500 font-mono">ID: {activePageId}</span>
            </div>
        </div>
        <div className="flex gap-2">
            <ExportMenu 
                onDownload={() => downloadPageConfig(activePageId)} 
                onCopy={() => copyToClipboard({ [activePageId]: activePage })}
                label="Export Page"
            />
            <button 
                type="button"
                onClick={() => { 
                    if(window.confirm('Delete page?')) deletePage(activePageId); 
                }}
                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete Page"
            >
                <Trash2 size={18} />
            </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 pt-4 flex gap-4 border-b border-gray-100 flex-shrink-0">
          <button 
            onClick={() => setActiveTab('content')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'content' ? 'border-[#f51721] text-[#f51721]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
              <Layers size={16} /> Content
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'settings' ? 'border-[#f51721] text-[#f51721]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
              <Settings size={16} /> Settings & Tracking
          </button>
      </div>

      <div className="p-6 space-y-8 flex-1 overflow-y-auto">
        
        {activeTab === 'content' && (
            <>
            {/* Visual Template Selector */}
            <section className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Template Type</label>
                    <div className="relative">
                        <button
                            onClick={() => setShowTemplates(!showTemplates)}
                            className="w-full flex items-center justify-between p-3 bg-white border border-gray-300 rounded-xl hover:border-[#f51721] transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                {renderMiniPreview(
                                    TEMPLATE_OPTIONS.find(t => t.value === activePage.template)?.preview || '',
                                    true
                                )}
                                <div className="text-left">
                                    <div className="font-bold text-sm text-gray-900">{currentTemplateLabel}</div>
                                    <div className="text-xs text-gray-500">{TEMPLATE_OPTIONS.find(t => t.value === activePage.template)?.description}</div>
                                </div>
                            </div>
                            {showTemplates ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                        </button>

                        {showTemplates && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 max-h-[480px] overflow-hidden flex flex-col">
                                {/* Category Filter Tabs */}
                                <div className="flex border-b border-gray-100 px-2 pt-2 flex-shrink-0">
                                    {TEMPLATE_CATEGORIES.map(cat => (
                                        <button
                                            key={cat.value}
                                            onClick={() => setTemplateCategoryFilter(cat.value as TemplateCategory | 'all')}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-t-lg transition-colors ${
                                                templateCategoryFilter === cat.value
                                                    ? 'bg-red-50 text-[#f51721] border-b-2 border-[#f51721]'
                                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                            }`}
                                        >
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Template Grid */}
                                <div className="overflow-y-auto p-2 grid grid-cols-2 gap-2">
                                    {filteredTemplates.map(opt => {
                                        const isSelected = activePage.template === opt.value;
                                        const usageCount = getTemplateUsageCount(opt.value);
                                        const recommended = isRecommendedTemplate(opt.value);
                                        return (
                                            <button
                                                key={opt.value}
                                                onClick={() => { handleChange('template', opt.value); setShowTemplates(false); }}
                                                className={`relative flex flex-col items-center gap-1.5 p-2.5 rounded-lg transition-all text-center border ${
                                                    isSelected
                                                        ? 'bg-red-50 border-red-300 ring-2 ring-red-200'
                                                        : recommended
                                                            ? 'bg-amber-50 border-amber-200 hover:border-amber-300'
                                                            : 'border-gray-100 hover:bg-gray-50 hover:border-gray-200'
                                                }`}
                                            >
                                                {/* Recommended Badge */}
                                                {recommended && !isSelected && (
                                                    <span className="absolute -top-1.5 -right-1.5 text-[8px] font-bold bg-amber-400 text-white px-1.5 py-0.5 rounded-full shadow-sm">
                                                        TIP
                                                    </span>
                                                )}

                                                {/* Usage Count Badge */}
                                                {usageCount > 0 && (
                                                    <span className={`absolute -top-1.5 -left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm ${
                                                        isSelected ? 'bg-[#f51721] text-white' : 'bg-gray-600 text-white'
                                                    }`}>
                                                        {usageCount}
                                                    </span>
                                                )}

                                                {/* Mini Preview */}
                                                {renderMiniPreview(opt.preview, isSelected)}

                                                {/* Label */}
                                                <div className={`text-[11px] font-bold leading-tight ${
                                                    isSelected ? 'text-[#f51721]' : 'text-gray-800'
                                                }`}>
                                                    {opt.label}
                                                </div>

                                                {/* Description */}
                                                <div className="text-[9px] text-gray-400 leading-tight">
                                                    {opt.description}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Internal Name</label>
                    <input 
                    type="text" 
                    value={activePage.name} 
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                    />
                </div>

                <div className="flex gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <label className="flex items-center space-x-2 cursor-pointer select-none">
                        <input type="checkbox" checked={activePage.header !== false} onChange={(e) => handleChange('header', e.target.checked)} className="rounded text-red-600 focus:ring-red-500" />
                        <span className="text-sm font-medium text-gray-700">Show Header</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer select-none">
                        <input type="checkbox" checked={activePage.footer === true} onChange={(e) => handleChange('footer', e.target.checked)} className="rounded text-red-600 focus:ring-red-500" />
                        <span className="text-sm font-medium text-gray-700">Show Footer</span>
                    </label>
                </div>
            </section>

            {/* Quiz Psychology Phase Indicator */}
            {(() => {
              const phase = getQuizPhaseForEditor(activePage.path || '');
              return (
                <div
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-sm"
                  style={{ backgroundColor: phase.bgColor, borderColor: phase.borderColor }}
                >
                  <Brain size={16} style={{ color: phase.color }} className="flex-shrink-0" />
                  <div className="min-w-0">
                    <span className="font-bold text-xs" style={{ color: phase.color }}>{phase.name}</span>
                    <span className="text-gray-500 text-xs ml-1.5">{phase.tip}</span>
                  </div>
                </div>
              );
            })()}

            <div className="border-t border-gray-100"></div>

            {/* CUSTOM COMPOSITION BUILDER */}
            {activePage.template === 'custom_composition_template' && (
                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                         <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Builder Blocks</h3>
                         <div className="flex gap-1">
                             <button onClick={() => addBlock('title')} title="Add Title" className="p-2 bg-gray-100 hover:bg-gray-200 rounded"><Type size={16}/></button>
                             <button onClick={() => addBlock('image')} title="Add Image" className="p-2 bg-gray-100 hover:bg-gray-200 rounded"><ImageIcon size={16}/></button>
                             <button onClick={() => addBlock('button')} title="Add Button" className="p-2 bg-gray-100 hover:bg-gray-200 rounded"><BoxSelect size={16}/></button>
                             <button onClick={() => addBlock('options_single')} title="Add Single Select" className="p-2 bg-gray-100 hover:bg-gray-200 rounded"><Icons.List size={16}/></button>
                             <button onClick={() => addBlock('spacer')} title="Add Spacer" className="p-2 bg-gray-100 hover:bg-gray-200 rounded"><Icons.MoveVertical size={16}/></button>
                         </div>
                    </div>

                    <div className="space-y-4">
                        {(!activePage.template_data?._blocks || activePage.template_data._blocks.length === 0) && (
                            <div className="text-center p-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
                                <Hammer className="mx-auto mb-2 opacity-50" />
                                Start building by adding blocks above
                            </div>
                        )}
                        {activePage.template_data?._blocks?.map((block: BlockItem, idx: number) => (
                            <div key={block.id} className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm relative group">
                                <div className="absolute top-2 right-2 flex gap-1">
                                    <button onClick={() => moveBlock(idx, -1)} className="p-1 hover:bg-gray-100 rounded text-gray-400"><ChevronUp size={14}/></button>
                                    <button onClick={() => moveBlock(idx, 1)} className="p-1 hover:bg-gray-100 rounded text-gray-400"><ChevronDown size={14}/></button>
                                    <button onClick={() => removeBlock(idx)} className="p-1 hover:bg-red-50 text-red-400 rounded ml-2"><Trash2 size={14}/></button>
                                </div>
                                
                                <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded mb-2 inline-block">{block.type.replace('_', ' ')}</span>

                                {/* Render Editor Inputs based on Block Type */}
                                <div className="space-y-2">
                                    {(block.type === 'title' || block.type === 'subtitle' || block.type === 'text' || block.type === 'button') && (
                                        <input 
                                            value={block.content || ''}
                                            onChange={(e) => handleBlockChange(idx, 'content', e.target.value)}
                                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm font-medium"
                                            placeholder={`Enter ${block.type} text...`}
                                        />
                                    )}

                                    {block.type === 'image' && (
                                        <div className="flex gap-2">
                                            <input 
                                                value={block.src || ''}
                                                onChange={(e) => handleBlockChange(idx, 'src', e.target.value)}
                                                className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                                                placeholder="Image URL..."
                                            />
                                            {block.src && <img src={block.src} className="w-8 h-8 object-cover rounded border" />}
                                        </div>
                                    )}

                                    {(block.type === 'options_single' || block.type === 'options_multi') && (
                                        <div className="bg-gray-50 p-2 rounded text-xs text-gray-500">
                                            Options are managed via the generic Options List for now.
                                            {/* In a full version, this would be a nested repeater */}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Standard Template Dynamic Content Fields (Hidden if Custom Composition to avoid clutter, or kept for mixed usage?) */}
            {activePage.template !== 'custom_composition_template' && (
            <section className="space-y-6">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Content</h3>
                
                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Title</label>
                            <select 
                                value={activePage.template_data?.[fieldMap.titleFont] || 'title'} 
                                onChange={(e) => handleDataChange(fieldMap.titleFont, e.target.value)}
                                className="text-xs bg-gray-100 border-none rounded px-2 py-0.5 text-gray-600 focus:ring-0"
                                title="Select Font Style"
                            >
                                {fontOptions.map(f => <option key={f} value={f}>{f.replace('_', ' ')}</option>)}
                            </select>
                        </div>
                        <textarea 
                            value={activePage.template_data?.[fieldMap.titleField] || ''} 
                            onChange={(e) => handleDataChange(fieldMap.titleField, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none resize-none font-bold text-gray-800"
                            placeholder="Enter main title..."
                            rows={2}
                        />
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Subtitle</label>
                            <select 
                                value={activePage.template_data?.[fieldMap.subtitleFont] || 'sub_title'} 
                                onChange={(e) => handleDataChange(fieldMap.subtitleFont, e.target.value)}
                                className="text-xs bg-gray-100 border-none rounded px-2 py-0.5 text-gray-600 focus:ring-0"
                                title="Select Font Style"
                            >
                                {fontOptions.map(f => <option key={f} value={f}>{f.replace('_', ' ')}</option>)}
                            </select>
                        </div>
                        <textarea 
                            value={activePage.template_data?.[fieldMap.subtitleField] || ''} 
                            onChange={(e) => handleDataChange(fieldMap.subtitleField, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-gray-600 resize-none"
                            rows={3}
                            placeholder="Enter description text..."
                        />
                    </div>
                    <div className="group">
                        <label className="block text-xs font-bold text-gray-400 mb-1 uppercase group-hover:text-gray-600 transition-colors">HTML Title Override (Optional)</label>
                        <textarea 
                            value={activePage.template_data?.[fieldMap.htmlField] || ''} 
                            onChange={(e) => handleDataChange(fieldMap.htmlField, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none font-mono text-xs bg-gray-50 text-gray-500 group-hover:bg-white group-hover:border-gray-300 transition-all"
                            rows={1}
                            placeholder="<span>HTML...</span>"
                        />
                    </div>
                </div>

                {(activePage.template.includes('image') || activePage.template.includes('hero')) && (
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <ImageIcon size={16} /> Main Image
                        </label>
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <input 
                                    type="text" 
                                    value={activePage.template_data?.[fieldMap.imageField] || ''} 
                                    onChange={(e) => handleDataChange(fieldMap.imageField, e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2"
                                    placeholder="https://..."
                                />
                                <input 
                                    type="text" 
                                    value={activePage.template_data?.[fieldMap.imageAltField] || ''} 
                                    onChange={(e) => handleDataChange(fieldMap.imageAltField, e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                                    placeholder="Alt Text"
                                />
                            </div>
                            {activePage.template_data?.[fieldMap.imageField] && (
                                <div className="w-24 h-24 rounded-lg overflow-hidden border border-gray-300 bg-white flex-shrink-0">
                                    <img src={activePage.template_data[fieldMap.imageField]} className="w-full h-full object-cover" />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Options List Builder */}
                {(activePage.template.includes('pick') || activePage.template.includes('cloud')) && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="block text-xs font-bold text-gray-500 uppercase">Options List</label>
                            <button onClick={addOption} className="text-xs bg-[#f51721] text-white hover:bg-red-700 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors font-bold shadow-sm">
                                <Plus size={12} /> Add
                            </button>
                        </div>
                        
                        <div className="space-y-3">
                            {activePage.template_data?._options?.map((opt: any, idx: number) => (
                                <div 
                                    key={idx} 
                                    draggable
                                    onDragStart={(e) => handleOptionDragStart(e, idx)}
                                    onDragOver={(e) => handleOptionDragOver(e, idx)}
                                    onDrop={handleOptionDrop}
                                    className={`p-3 border border-gray-200 rounded-lg bg-gray-50 relative group hover:border-gray-300 hover:shadow-sm transition-all ${draggedOption === idx ? 'opacity-50 border-dashed border-gray-400' : ''}`}
                                >
                                    <div className="absolute left-1 top-1/2 -translate-y-1/2 cursor-move text-gray-400 hover:text-gray-600 p-1">
                                        <GripVertical size={14} />
                                    </div>

                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => duplicateOption(idx)} className="text-gray-300 hover:text-blue-500 p-1">
                                            <Copy size={14} />
                                        </button>
                                        <button onClick={() => removeOption(idx)} className="text-gray-300 hover:text-red-500 p-1">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 mb-2 pr-6 pl-4">
                                        <div className="col-span-2">
                                            <input placeholder="Label" value={opt.label} onChange={(e) => handleOptionChange(idx, 'label', e.target.value)} className="w-full text-sm px-2 py-1 border rounded bg-white" />
                                        </div>
                                        <div>
                                            <input placeholder="Value" value={opt.value} onChange={(e) => handleOptionChange(idx, 'value', e.target.value)} className="w-full text-sm px-2 py-1 border rounded font-mono text-gray-600 bg-white" />
                                        </div>
                                    </div>
                                    <div className="flex gap-2 pl-4">
                                        <input placeholder="Image URL..." value={opt.image || ''} onChange={(e) => handleOptionChange(idx, 'image', e.target.value)} className="flex-1 text-xs px-2 py-1 border rounded bg-white" />
                                        <input placeholder="Emoji" value={opt.emoji || ''} onChange={(e) => handleOptionChange(idx, 'emoji', e.target.value)} className="w-16 text-xs px-2 py-1 border rounded bg-white" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Button Text</label>
                    <input 
                        type="text" 
                        value={activePage.template_data?.[fieldMap.buttonTextField] || ''} 
                        onChange={(e) => handleDataChange(fieldMap.buttonTextField, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="CONTINUE"
                    />
                </div>
                {/* Extra Template Fields — auto-detected from template definition */}
                {fieldMap.extraFields.length > 0 && (
                    <div className="space-y-3 border-t border-gray-100 pt-4 mt-4">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            <Layers size={12} /> Additional Template Fields
                        </label>
                        {fieldMap.extraFields.map(ef => (
                            <div key={ef.key}>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{ef.label}</label>
                                {ef.type === 'html' ? (
                                    <textarea
                                        value={activePage.template_data?.[ef.key] || ''}
                                        onChange={(e) => handleDataChange(ef.key, e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg font-mono text-xs bg-gray-50 focus:ring-2 focus:ring-red-500 outline-none"
                                        rows={3}
                                        placeholder="<span>HTML content...</span>"
                                    />
                                ) : ef.type === 'image' ? (
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="text"
                                            value={activePage.template_data?.[ef.key] || ''}
                                            onChange={(e) => handleDataChange(ef.key, e.target.value)}
                                            className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                                            placeholder="https://..."
                                        />
                                        {activePage.template_data?.[ef.key] && (
                                            <img src={activePage.template_data[ef.key]} className="w-10 h-10 rounded border object-cover" />
                                        )}
                                    </div>
                                ) : ef.type === 'event' ? (
                                    <input
                                        type="text"
                                        value={activePage.template_data?.[ef.key] || ''}
                                        onChange={(e) => handleDataChange(ef.key, e.target.value)}
                                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-mono bg-purple-50"
                                        placeholder="event_name"
                                    />
                                ) : ef.type === 'color' ? (
                                    <input
                                        type="text"
                                        value={activePage.template_data?.[ef.key] || ''}
                                        onChange={(e) => handleDataChange(ef.key, e.target.value)}
                                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                                        placeholder="primary / blue / custom hex"
                                    />
                                ) : (
                                    <input
                                        type="text"
                                        value={activePage.template_data?.[ef.key] || ''}
                                        onChange={(e) => handleDataChange(ef.key, e.target.value)}
                                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                                        placeholder={"Enter " + ef.label + "..."}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>
            )}

            {/* Validation Rules Section */}
            {validationInputs.length > 0 && (
              <>
                <div className="border-t border-gray-100"></div>
                <section className="space-y-4">
                  <button
                    type="button"
                    onClick={() => setShowValidation(!showValidation)}
                    className="w-full flex items-center justify-between group"
                  >
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck size={16} className="text-amber-500" />
                      Validation Rules
                    </h3>
                    <span className="text-gray-400 group-hover:text-gray-600 transition-colors">
                      {showValidation ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                  </button>

                  {showValidation && (
                    <div className="space-y-4">
                      {validationInputs.map((inputName) => {
                        const condition = getValidationCondition(inputName);
                        const conditionValues = getValidationConditionValues(inputName);
                        const message = getValidationMessage(inputName);
                        const condMeta = VALIDATION_CONDITIONS.find(c => c.value === condition);

                        return (
                          <div
                            key={inputName}
                            className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] uppercase font-bold text-white bg-amber-500 px-2 py-0.5 rounded">
                                {inputName.replace(/_/g, ' ')}
                              </span>
                            </div>

                            {/* Condition Type */}
                            <div>
                              <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                                Condition
                              </label>
                              <select
                                value={condition}
                                onChange={(e) => handleValidationConditionChange(inputName, e.target.value)}
                                className="w-full text-sm bg-white border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                              >
                                {VALIDATION_CONDITIONS.map((c) => (
                                  <option key={c.value} value={c.value}>
                                    {c.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Condition Values */}
                            {condMeta?.fields === 'two_numbers' && (
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                                    Min
                                  </label>
                                  <input
                                    type="number"
                                    value={conditionValues[0] ?? ''}
                                    onChange={(e) => handleConditionValueChange(inputName, 0, e.target.value, true)}
                                    className="w-full text-sm bg-white border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                                    placeholder="Min value"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                                    Max
                                  </label>
                                  <input
                                    type="number"
                                    value={conditionValues[1] ?? ''}
                                    onChange={(e) => handleConditionValueChange(inputName, 1, e.target.value, true)}
                                    className="w-full text-sm bg-white border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                                    placeholder="Max value"
                                  />
                                </div>
                              </div>
                            )}

                            {condMeta?.fields === 'single_number' && (
                              <div>
                                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                                  Value
                                </label>
                                <input
                                  type="number"
                                  value={conditionValues[0] ?? ''}
                                  onChange={(e) => handleConditionValueChange(inputName, 0, e.target.value, true)}
                                  className="w-full text-sm bg-white border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                                  placeholder="Threshold value"
                                />
                              </div>
                            )}

                            {condMeta?.fields === 'text' && (
                              <div>
                                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                                  Pattern
                                </label>
                                <input
                                  type="text"
                                  value={conditionValues[0] ?? ''}
                                  onChange={(e) => handleConditionValueChange(inputName, 0, e.target.value, false)}
                                  className="w-full text-sm bg-white border border-gray-300 rounded-lg px-3 py-2 font-mono focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                                  placeholder="e.g. ^[a-zA-Z]+$"
                                />
                              </div>
                            )}

                            {/* Error Message */}
                            <div>
                              <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                                Error Message
                              </label>
                              <input
                                type="text"
                                value={message}
                                onChange={(e) => handleDataChange(`_${inputName}_invalid_msg`, e.target.value)}
                                className="w-full text-sm bg-white border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                                placeholder="Please enter a valid value"
                              />
                            </div>
                          </div>
                        );
                      })}

                      <p className="text-[10px] text-gray-400 italic">
                        Detected from template_data keys matching _*_invalid_* or _*_answer_key patterns.
                      </p>
                    </div>
                  )}
                </section>
              </>
            )}
            </>
        )}

        {activeTab === 'settings' && (
            <div className="space-y-8">
                {/* Meta Section */}
                <section>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">SEO & Metadata</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Page Title (Meta)</label>
                            <input 
                                type="text" 
                                value={activePage.meta?.title || ''} 
                                onChange={(e) => handleMetaChange('title', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Browser Tab Title"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Meta)</label>
                            <textarea 
                                value={activePage.meta?.description || ''} 
                                onChange={(e) => handleMetaChange('description', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                rows={3}
                                placeholder="Search engine description..."
                            />
                        </div>
                    </div>
                </section>

                {/* Routing / Path Section */}
                <section>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Routing</h3>
                    {(() => {
                        const allPages = Object.entries(config.pages)
                            .filter(([k]) => k !== '__template_preview__')
                            .map(([k, p]: [string, any]) => ({ key: k, path: p.path, name: p.name || k }))
                            .sort((a, b) => parseInt(a.path) - parseInt(b.path));
                        const currentPathNum = parseInt(activePage.path);
                        const nextPath = (currentPathNum + 1).toString();
                        const nextPage = allPages.find(p => p.path === nextPath);
                        const isLastPage = !nextPage;

                        // Find events owned by this page
                        const ownedEvents: { eventName: string; routeTo: string | null; isSequential: boolean; hasConditions: boolean }[] = [];
                        if (activePage.template_data && config.event_routing) {
                            Object.values(activePage.template_data).forEach(val => {
                                if (typeof val === 'string' && config.event_routing[val]) {
                                    const evt = config.event_routing[val];
                                    const routeTo = evt?.route?.to || null;
                                    const isSeq = routeTo != null && parseInt(routeTo) === currentPathNum + 1;
                                    ownedEvents.push({
                                        eventName: val,
                                        routeTo,
                                        isSequential: isSeq,
                                        hasConditions: Array.isArray(evt?.route?.conditions) && evt.route.conditions.length > 0
                                    });
                                }
                            });
                        }

                        return (
                            <div className="space-y-3">
                                {/* Current position */}
                                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
                                    <span className="text-xs font-bold text-gray-500 w-20">Position</span>
                                    <span className="font-mono text-sm font-bold text-gray-800 bg-white px-2 py-0.5 rounded border border-gray-200">{activePage.path}</span>
                                    <span className="text-xs text-gray-400">of {allPages.length}</span>
                                </div>

                                {/* Default flow (next page) */}
                                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
                                    <span className="text-xs font-bold text-gray-500 w-20">Next page</span>
                                    {isLastPage ? (
                                        <span className="text-xs text-gray-400 italic">Last page (end of funnel)</span>
                                    ) : (
                                        <span className="text-xs text-gray-700">
                                            <span className="font-mono font-bold">{nextPath}</span> — {nextPage.name}
                                        </span>
                                    )}
                                </div>

                                {/* Event routing summary */}
                                {ownedEvents.length > 0 && (
                                    <div className="space-y-2">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">Event Routes</span>
                                        {ownedEvents.map(evt => {
                                            const targetPage = allPages.find(p => p.path === evt.routeTo);
                                            return (
                                                <div key={evt.eventName} className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-gray-200">
                                                    <span className="font-mono text-[10px] text-[#f51721] font-bold truncate max-w-[100px]">{evt.eventName}</span>
                                                    <ArrowRight size={10} className="text-gray-400 flex-shrink-0" />
                                                    {evt.isSequential ? (
                                                        <span className="flex items-center gap-1">
                                                            <span className="bg-green-100 text-green-700 text-[9px] font-bold px-1.5 py-0.5 rounded">AUTO</span>
                                                            <span className="text-xs text-gray-600">Next page ({evt.routeTo})</span>
                                                        </span>
                                                    ) : evt.routeTo ? (
                                                        <span className="flex items-center gap-1">
                                                            <span className="bg-amber-100 text-amber-700 text-[9px] font-bold px-1.5 py-0.5 rounded">CUSTOM</span>
                                                            <span className="text-xs text-gray-600">{targetPage ? `${targetPage.path} — ${targetPage.name}` : `Path ${evt.routeTo}`}</span>
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 italic">No route</span>
                                                    )}
                                                    {evt.hasConditions && (
                                                        <GitBranch size={10} className="text-purple-500 flex-shrink-0 ml-auto" title="Has conditional branches" />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Hint */}
                                <p className="text-[10px] text-gray-400 leading-relaxed">
                                    Drag pages in the sidebar to reorder. Sequential routes (<span className="text-green-600 font-bold">AUTO</span>) automatically follow the new order.
                                    Custom routes (<span className="text-amber-600 font-bold">CUSTOM</span>) preserve their target. Edit routes in the Events panel.
                                </p>
                            </div>
                        );
                    })()}
                </section>

                {/* Tracking Events Section */}
                <section>
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                         <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Tracking Events</h3>
                         <button onClick={addTrackingEvent} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-lg transition-colors font-semibold flex items-center gap-1">
                             <Plus size={14} /> Add Event
                         </button>
                    </div>
                    
                    <div className="space-y-3">
                        {activePage.tracking_events?.map((event, idx) => (
                            <div key={idx} className="p-3 bg-gray-50 border border-gray-200 rounded-lg relative group">
                                <button onClick={() => removeTrackingEvent(idx)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500">
                                    <Trash2 size={16} />
                                </button>
                                <div className="grid grid-cols-2 gap-3 pr-6">
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Type</label>
                                        <select 
                                            value={event.type}
                                            onChange={(e) => updateTrackingEvent(idx, 'type', e.target.value)}
                                            className="w-full text-sm bg-white border border-gray-300 rounded px-2 py-1"
                                        >
                                            <option value="pixel">Pixel</option>
                                            <option value="custom">Custom</option>
                                            <option value="datalayer">DataLayer</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Event Name</label>
                                        <input 
                                            value={event.name}
                                            onChange={(e) => updateTrackingEvent(idx, 'name', e.target.value)}
                                            className="w-full text-sm bg-white border border-gray-300 rounded px-2 py-1"
                                            placeholder="e.g. Lead"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                         {(!activePage.tracking_events || activePage.tracking_events.length === 0) && (
                            <div className="text-center py-6 text-gray-400 bg-white rounded-lg border border-dashed border-gray-200 text-sm flex flex-col items-center">
                                <Activity size={24} className="mb-2 opacity-50" />
                                No events configured for this step.
                            </div>
                        )}
                    </div>
                </section>

                {/* Connected Events — shows events triggered by this page */}
                <section className="space-y-3 border-t border-gray-100 pt-6">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                        <Activity size={16} className="text-blue-500" />
                        Page Events &amp; Routing
                    </h3>
                    <p className="text-[10px] text-gray-400">Events triggered by buttons and interactions on this page.</p>

                    {(() => {
                        const connectedEvents: { fieldKey: string; fieldLabel: string; eventName: string; eventLogic: any }[] = [];
                        if (activePage.template_data) {
                            Object.entries(activePage.template_data).forEach(([key, val]) => {
                                if (typeof val === 'string' && config.event_routing?.[val]) {
                                    connectedEvents.push({
                                        fieldKey: key,
                                        fieldLabel: key.replace(/^_on_/, '').replace(/^_/, '').replace(/_/g, ' '),
                                        eventName: val,
                                        eventLogic: config.event_routing[val],
                                    });
                                }
                            });
                        }

                        if (connectedEvents.length === 0) {
                            return (
                                <div className="text-xs text-gray-400 italic bg-gray-50 rounded-lg p-4 text-center">
                                    No events connected to this page. Events are linked via <code className="bg-gray-200 px-1 rounded">_on_*</code> fields in template data.
                                </div>
                            );
                        }

                        const availablePaths = Object.entries(config.pages)
                            .filter(([k]) => k !== '__template_preview__')
                            .map(([k, p]: [string, any]) => ({ path: p.path, name: p.name || k }))
                            .sort((a, b) => parseInt(a.path) - parseInt(b.path));

                        return (
                            <div className="space-y-3">
                                {connectedEvents.map(({ fieldKey, fieldLabel, eventName, eventLogic }) => (
                                    <div key={fieldKey} className="border border-blue-100 bg-blue-50/30 rounded-xl p-3 space-y-2">
                                        {/* Event header */}
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-bold text-[10px] uppercase">{fieldLabel}</span>
                                            <ArrowRight size={12} className="text-gray-400" />
                                            <span className="font-mono font-bold text-[#f51721] text-[11px]">{eventName}</span>
                                            {eventLogic.quiz_answer && (
                                                <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[9px] font-bold">saves: {eventLogic.quiz_answer}</span>
                                            )}
                                        </div>

                                        {/* Default route */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-gray-500 font-bold w-16">Route to</span>
                                            <select
                                                className="flex-1 text-xs bg-white border border-gray-200 rounded px-2 py-1"
                                                value={eventLogic.route?.to || ''}
                                                onChange={(e) => {
                                                    const newRouting = { ...config.event_routing };
                                                    if (!newRouting[eventName]) newRouting[eventName] = {};
                                                    newRouting[eventName] = { ...newRouting[eventName], route: { ...(newRouting[eventName].route || {}), to: e.target.value } };
                                                    updateEvents({ event_routing: newRouting });
                                                }}
                                            >
                                                <option value="">-- No Route --</option>
                                                {availablePaths.map(p => (
                                                    <option key={p.path} value={p.path}>{p.path} - {p.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Conditional routes */}
                                        {eventLogic.route?.conditions?.length > 0 && (
                                            <div className="bg-purple-50 rounded-lg p-2 space-y-1.5">
                                                <span className="text-[9px] font-bold text-purple-600 uppercase flex items-center gap-1">
                                                    <GitBranch size={10} /> Conditional Forks
                                                </span>
                                                {eventLogic.route.conditions.map((cond: any, idx: number) => {
                                                    const targetPage = availablePaths.find(p => p.path === cond.target);
                                                    return (
                                                        <div key={idx} className="flex items-center gap-1.5 text-[10px] bg-white rounded p-1.5 border border-purple-100">
                                                            <span className="text-purple-500 font-bold">IF</span>
                                                            <span className="font-mono bg-gray-100 px-1 rounded">{cond.field}</span>
                                                            <span className="text-purple-400">{cond.operator}</span>
                                                            <span className="font-mono bg-gray-100 px-1 rounded">{cond.value}</span>
                                                            <ArrowRight size={10} className="text-purple-500" />
                                                            <span className="font-bold text-purple-700">{targetPage ? `${targetPage.path} - ${targetPage.name}` : cond.target || '?'}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Broadcasts summary */}
                                        {eventLogic.broadcast && Object.keys(eventLogic.broadcast).length > 0 && (
                                            <div className="flex gap-1 flex-wrap">
                                                {Object.entries(eventLogic.broadcast).map(([target, cfg]: [string, any]) => (
                                                    <span key={target} className="text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase">
                                                        {target}: {(cfg as any).event_name || (cfg as any).goal_id}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        );
                    })()}
                </section>
            </div>
        )}
      </div>
    </div>
  );
};
