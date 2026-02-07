import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { useFunnel } from '../context/FunnelContext';
import { Send, Image as ImageIcon, X, Loader2, Bot, Check, Square, Sparkles, FileText, Trash2, ArrowUp, Paperclip } from 'lucide-react';
// Import PDFJS - v5 uses direct import
import * as pdfjsLib from 'pdfjs-dist';

interface Attachment {
    type: 'image' | 'file';
    content: string; // base64 for image, text content for PDF/Text
    name: string;
    mimeType?: string;
}

const SUGGESTIONS = [
    { label: "Clone a Funnel (PDF)", prompt: "I have a PDF of a competitor's funnel flow. Can you create pages based on it?" },
    { label: "Optimize Theme", prompt: "Analyze my current theme colors and suggest a more high-converting palette for a health brand." },
    { label: "Create Quiz Logic", prompt: "I need a 3-step quiz: Gender -> Age -> Goal. Create the pages and the routing logic." },
];

export const AiAssistant: React.FC = () => {
    const { config, updateEvents, addPage, chatHistory, addChatMessage, clearChat, isAiLoading, setAiLoading } = useFunnel();
    // Generic wrapper for updates
    const updateConfig = updateEvents;

    const [input, setInput] = useState('');
    const [attachment, setAttachment] = useState<Attachment | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [aiMode, setAiMode] = useState<'architect' | 'writer' | 'optimizer'>('architect');
    
    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Initialize Gemini Client
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Set worker src for PDF.js
    useEffect(() => {
        // Robustly get the library object (handles default export vs namespace import issues)
        const pdfJs = (pdfjsLib as any).default || pdfjsLib;
        
        if (pdfJs && pdfJs.GlobalWorkerOptions) {
            pdfJs.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
        } else {
            console.warn("PDF.js GlobalWorkerOptions not available", pdfJs);
        }
    }, []);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [chatHistory, isAiLoading]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [input]);

    // --- File Handling Logic ---

    const extractTextFromPdf = async (arrayBuffer: ArrayBuffer): Promise<string> => {
        const pdfJs = (pdfjsLib as any).default || pdfjsLib;
        if (!pdfJs.getDocument) {
            throw new Error("PDF.js getDocument not available");
        }

        const pdf = await pdfJs.getDocument({ data: arrayBuffer }).promise;
        let fullText = "";
        
        // Limit to first 5 pages to save context window and perf
        const maxPages = Math.min(pdf.numPages, 5); 

        for (let i = 1; i <= maxPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += `--- Page ${i} ---\n${pageText}\n\n`;
        }
        return fullText;
    };

    const processFile = async (file: File) => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAttachment({
                    type: 'image',
                    content: reader.result as string,
                    name: file.name,
                    mimeType: file.type
                });
            };
            reader.readAsDataURL(file);
        } else if (file.type === 'application/pdf') {
            try {
                const arrayBuffer = await file.arrayBuffer();
                const text = await extractTextFromPdf(arrayBuffer);
                setAttachment({
                    type: 'file',
                    content: text,
                    name: file.name,
                    mimeType: 'application/pdf'
                });
            } catch (err) {
                console.error("PDF Parse Error", err);
                addChatMessage({ role: 'model', text: "Error parsing PDF. Please try a simpler file or an image." });
            }
        } else if (file.type === 'text/plain' || file.name.endsWith('.json') || file.name.endsWith('.txt')) {
             const text = await file.text();
             setAttachment({
                 type: 'file',
                 content: text,
                 name: file.name,
                 mimeType: 'text/plain'
             });
        } else {
            alert("Unsupported file type. Please upload Image, PDF, or Text.");
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await processFile(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handlePaste = async (e: React.ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.type.indexOf('image') !== -1) {
                const blob = item.getAsFile();
                if (blob) {
                    await processFile(blob);
                    e.preventDefault(); 
                    return;
                }
            }
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) await processFile(file);
    };

    // --- Chat Logic ---

    const stopGeneration = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setAiLoading(false);
        addChatMessage({ role: 'model', text: "Generation stopped by user.", error: true });
    };

    const sendMessage = async () => {
        if ((!input.trim() && !attachment) || isAiLoading) return;

        // Construct User Message for History
        const userMsgText = input;
        const currentAttachment = attachment;
        
        addChatMessage({ 
            role: 'user', 
            text: userMsgText, 
            image: currentAttachment?.type === 'image' ? currentAttachment.content : undefined,
            fileName: currentAttachment?.name
        });

        setInput('');
        setAttachment(null);
        setAiLoading(true);

        if (textareaRef.current) textareaRef.current.style.height = 'auto';
        abortControllerRef.current = new AbortController();

        try {
            // Build Context
            // We strip down config to save tokens, but keep structure
            const configSummary = {
                brand: config.brand,
                existing_pages: Object.entries(config.pages).map(([id, p]: [string, any]) => ({ id, name: p.name, template: p.template })),
                templates_available: Object.keys(config.templates),
                current_theme: config.theme.colors,
                // Sample 1 template to show structure
                sample_template_structure: Object.values(config.templates)[0]
            };

            const modeInstructions: Record<string, string> = {
                architect: "Focus on structure: templates, pages, components, routing.",
                writer: "Focus on copy: titles, subtitles, button text, option labels. Write punchy, conversational, mobile-first.",
                optimizer: "Focus on CRO: question order, drop-off fixes, conversion rate optimization.",
            };

            const systemPrompt = `${modeInstructions[aiMode]}

You are "Funny Architect", a world-class CTO and Funnel Builder AI.
You control the JSON config of a React Component Rendering Engine.

Understand the user's intent (text, image, or PDF) and manipulate config to achieve it.

Always explain reasoning first in a friendly "CTO-to-Engineer" tone. Then provide the JSON action block at the end.

FUNNY ENGINE COMPONENTS:
Page, Box, Gap, Text, Title, Subtitle, RichText, ImageBox, Button, ItemPicker, FocusAreas, UnitToggle, TextInput, NumericInput, WeightInput, LengthInput, DatePicker, NotificationCard, AnimatedChart, Carousel, BmiChart, BmiReport, BmiNotification, GoalNotification, WeightLossChart, Checkout, Countdown, PageProgressBar, LinksBox

EVENT ROUTING PATTERNS:
1. Navigate: { route: { to: "5" } }
2. Data Capture: { route: { to: "3" }, quiz_answer: "age" }
3. Multi-Select: TWO events -- "single_X_selected": { quiz_answer: "X" } + "X_selected": { route: { to: "6" } }
4. Broadcast: { broadcast: { facebook: { event_name: "Lead" }, db: { event_name: "lead" } } }
5. Conditional: { route: { to: "5", conditions: [{ field: "bmi", operator: "gt", value: "30", target: "8" }] } }

QUIZ PSYCHOLOGY PHASES:
- Identity (Q1-5): Easy, non-threatening. Gender, age, goals. 95%+ completion.
- Behavioral (Q6-15): Habits, routines. 85%+ completion.
- Problem (Q16-25): Pain points. Drop-off risk zone.
- Visualization (Q26+): Charts, projections, personalized results.

TEMPLATE_DATA CONVENTIONS:
- Props prefixed with _ are resolved from template_data
- _on_ prefix = event names (e.g., _on_click)
- _title_text, _subtitle_text, _button_text = display copy
- _answer_key = data storage key

RULES: No AI language (leverage, utilize, transform). No em-dashes. No semicolons. Short punchy copy. Mobile-first.

Action Protocol:
Return JSON inside a single \`\`\`json\`\`\` block at the end.

Supported JSON Actions:
1. Create Template: { "action": "create_template", "key": "template_name", "definition": { ...ComponentNode... } }
2. Create Page: { "action": "create_page", "id": "page_id", "config": { ...PageConfig... } }
3. Update Config: { "action": "update_config", "payload": { ...partialConfig... } }

Context:
Current Config Summary: ${JSON.stringify(configSummary)}

If the user provides file content (PDF text), analyze it to extract the flow, copy, and structure, then generate the corresponding pages and templates.
`;

            const promptParts: any[] = [];
            
            // 1. Add User Input
            promptParts.push({ text: userMsgText });

            // 2. Add Attachment
            if (currentAttachment) {
                if (currentAttachment.type === 'image') {
                    const base64Data = currentAttachment.content.split(',')[1];
                    promptParts.push({
                        inlineData: {
                            mimeType: currentAttachment.mimeType || 'image/jpeg', 
                            data: base64Data
                        }
                    });
                    promptParts.push({ text: "\n[Image Attached] Analyze this UI design and replicate it." });
                } else {
                    // PDF or Text content
                    promptParts.push({ text: `\n[File Content Attached - ${currentAttachment.name}]:\n${currentAttachment.content}` });
                }
            }

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [
                    { role: 'user', parts: promptParts }
                ],
                config: {
                    systemInstruction: systemPrompt,
                    temperature: 0.3, // Slightly creative but structured
                }
            });

            if (abortControllerRef.current?.signal.aborted) return;

            const responseText = response.text || "I processed the request but generated no output.";
            
            // Extract JSON and Explanatory Text
            const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
            let actionPerformed = '';
            let displayText = responseText;

            if (jsonMatch) {
                // Remove the JSON from the display text to keep UI clean, or keep it if debug needed.
                // Let's keep the explanation and hide the raw JSON in the UI, showing a success badge instead.
                displayText = responseText.replace(/```json[\s\S]*?```/, '').trim();

                try {
                    const actionData = JSON.parse(jsonMatch[1]);
                    
                    if (actionData.action === 'create_template') {
                        const newTemplates = { ...config.templates, [actionData.key]: actionData.definition };
                        updateConfig({ templates: newTemplates });
                        actionPerformed = `Created Template: ${actionData.key}`;
                    } 
                    else if (actionData.action === 'create_page') {
                        addPage(actionData.id, actionData.config);
                        actionPerformed = `Created Page: ${actionData.id}`;
                    }
                    else if (actionData.action === 'update_config') {
                        updateConfig(actionData.payload);
                        actionPerformed = "Updated Global Configuration";
                    }
                } catch (e) {
                    console.error("AI Action Failed", e);
                    actionPerformed = "Failed to execute changes (JSON Error)";
                }
            }

            addChatMessage({ 
                role: 'model', 
                text: displayText, 
                actionPerformed 
            });

        } catch (err) {
            if (!abortControllerRef.current?.signal.aborted) {
                console.error(err);
                addChatMessage({ role: 'model', text: "I encountered a critical error processing your request.", error: true });
            }
        } finally {
            setAiLoading(false);
            abortControllerRef.current = null;
        }
    };

    const handleSuggestionClick = (prompt: string) => {
        setInput(prompt);
        textareaRef.current?.focus();
    };

    return (
        <div 
            className="h-full flex flex-col bg-white border-l border-gray-200 shadow-xl font-sans relative"
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
        >
            {/* Drag Overlay */}
            {isDragOver && (
                <div className="absolute inset-0 z-50 bg-blue-50/90 border-2 border-dashed border-blue-500 flex flex-col items-center justify-center pointer-events-none">
                    <FileText size={48} className="text-blue-500 mb-2" />
                    <p className="font-bold text-blue-700">Drop file to analyze</p>
                    <p className="text-sm text-blue-500">PDFs, Images, or Text</p>
                </div>
            )}

            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-white z-10 flex justify-between items-center shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Bot size={24} className="text-[#f51721]" /> AI Architect
                    </h2>
                    <p className="text-xs text-gray-500">Powered by Gemini 1.5 Pro</p>
                </div>
                {chatHistory.length > 0 && (
                    <button 
                        onClick={clearChat}
                        className="text-gray-400 hover:text-red-500 p-2 rounded hover:bg-gray-100 transition-colors"
                        title="Clear History"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50/50" ref={scrollRef}>
                {chatHistory.length === 0 && (
                    <div className="mt-8 mx-auto max-w-sm text-center">
                        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100 shadow-sm">
                            <Sparkles className="text-[#f51721]" size={32} />
                        </div>
                        <h3 className="font-bold text-gray-800 mb-2">How can I help you build?</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            I can analyze competitor PDFs, clone designs from images, or refactor your entire funnel config.
                        </p>
                        
                        <div className="grid grid-cols-1 gap-2 text-left">
                            {SUGGESTIONS.map((s, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => handleSuggestionClick(s.prompt)}
                                    className="p-3 bg-white border border-gray-200 rounded-xl hover:border-[#f51721] hover:shadow-md transition-all group"
                                >
                                    <div className="font-bold text-xs text-gray-700 group-hover:text-[#f51721]">{s.label}</div>
                                    <div className="text-[10px] text-gray-400 truncate">{s.prompt}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {chatHistory.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`rounded-2xl px-4 py-3 text-sm shadow-sm border relative ${
                                msg.role === 'user' 
                                    ? 'bg-[#f51721] text-white border-transparent rounded-br-sm' 
                                    : msg.error 
                                        ? 'bg-red-50 text-red-800 border-red-100 rounded-bl-sm'
                                        : 'bg-white text-gray-800 border-gray-200 rounded-bl-sm'
                            }`}>
                                {msg.image && (
                                    <div className="mb-2 rounded-lg overflow-hidden border border-white/20">
                                        <img src={msg.image} alt="Upload" className="max-w-full max-h-60 object-contain bg-black/5" />
                                    </div>
                                )}
                                {msg.fileName && !msg.image && (
                                    <div className="mb-2 flex items-center gap-2 bg-black/10 p-2 rounded text-xs font-mono">
                                        <FileText size={14} /> {msg.fileName}
                                    </div>
                                )}
                                <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                            </div>
                            
                            {msg.actionPerformed && (
                                <div className="mt-1 ml-2 text-[10px] text-green-600 font-bold flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full border border-green-100 shadow-sm animate-in fade-in slide-in-from-top-1">
                                    <Check size={10} /> {msg.actionPerformed}
                                </div>
                            )}
                            <div className="text-[9px] text-gray-300 mt-1 px-1">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </div>
                ))}
                
                {isAiLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-sm border border-gray-200 shadow-sm flex items-center gap-3">
                            <Loader2 size={16} className="animate-spin text-[#f51721]" />
                            <span className="text-xs text-gray-500 font-medium">Analyzing & Architecting...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-200">
                {/* AI Mode Selector */}
                <div className="flex gap-1.5 mb-3">
                    {([
                        { key: 'architect' as const, label: 'Architect', icon: '🏗️' },
                        { key: 'writer' as const, label: 'Writer', icon: '✍️' },
                        { key: 'optimizer' as const, label: 'Optimizer', icon: '📈' },
                    ]).map((mode) => (
                        <button
                            key={mode.key}
                            onClick={() => setAiMode(mode.key)}
                            className={`flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                                aiMode === mode.key
                                    ? 'bg-[#f51721] text-white border-[#f51721] shadow-sm'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                            }`}
                        >
                            <span className="mr-1">{mode.icon}</span>{mode.label}
                        </button>
                    ))}
                </div>

                {attachment && (
                    <div className="mb-3 flex items-center gap-2 bg-gray-100 p-2 rounded-lg w-fit border border-gray-200 animate-in fade-in slide-in-from-bottom-2 shadow-sm">
                        {attachment.type === 'image' ? (
                            <div className="w-8 h-8 rounded bg-gray-200 overflow-hidden">
                                <img src={attachment.content} className="w-full h-full object-cover" />
                            </div>
                        ) : (
                            <div className="w-8 h-8 rounded bg-red-100 flex items-center justify-center text-red-500">
                                <FileText size={16} />
                            </div>
                        )}
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-800 font-bold max-w-[150px] truncate">{attachment.name}</span>
                            <span className="text-[9px] text-gray-500 uppercase">{attachment.type}</span>
                        </div>
                        <button onClick={() => setAttachment(null)} className="ml-2 text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-gray-200"><X size={14}/></button>
                    </div>
                )}
                
                <div className="relative flex items-end gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-200 focus-within:border-[#f51721] focus-within:ring-1 focus-within:ring-[#f51721]/20 transition-all shadow-inner">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-xl transition-colors flex-shrink-0"
                        title="Attach File (Image, PDF, Text)"
                    >
                        <Paperclip size={20} />
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        className="hidden" 
                        accept="image/*,.pdf,.txt,.json"
                    />
                    
                    <textarea 
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                            }
                        }}
                        onPaste={handlePaste}
                        placeholder="Describe changes or upload a funnel PDF..."
                        rows={1}
                        className="w-full py-3 bg-transparent border-none text-sm text-gray-800 placeholder-gray-400 focus:ring-0 outline-none resize-none max-h-32 custom-scrollbar"
                    />

                    {isAiLoading ? (
                        <button 
                            onClick={stopGeneration}
                            className="p-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-red-100 hover:text-red-600 transition-all flex-shrink-0"
                            title="Stop Generating"
                        >
                            <Square size={18} fill="currentColor" />
                        </button>
                    ) : (
                        <button 
                            onClick={sendMessage}
                            disabled={!input.trim() && !attachment}
                            className={`p-2.5 rounded-xl transition-all flex-shrink-0 ${
                                input.trim() || attachment 
                                    ? 'bg-[#f51721] text-white hover:bg-red-700 shadow-md transform hover:-translate-y-0.5' 
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            <ArrowUp size={20} />
                        </button>
                    )}
                </div>
                <div className="text-[10px] text-center text-gray-400 mt-2 flex items-center justify-center gap-2">
                    <span>⏎ Send</span>
                    <span>⇧ ⏎ New line</span>
                </div>
            </div>
        </div>
    );
};