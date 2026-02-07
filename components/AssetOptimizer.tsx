
import React, { useState, useEffect, useRef } from 'react';
import { useFunnel } from '../context/FunnelContext';
import { PageConfig } from '../types';
import { GoogleGenAI } from "@google/genai";
import { Download, Loader2, RefreshCw, Wand2, CheckCircle2, AlertTriangle, Image as ImageIcon, Play, FileWarning, Eye, Search, Edit3, ArrowRight, Smartphone } from 'lucide-react';
import JSZip from 'jszip';

// --- Types ---

type AssetStatus = 'pending' | 'auditing' | 'audited' | 'generating' | 'optimizing' | 'done' | 'error';

interface AnalysisReport {
    score: number;
    congruency: string;
    mobile_visibility: string;
    emotional_impact: string;
    critique: string[]; // List of specific flaws
    suggested_prompt: string; // The golden nugget
}

interface FunnelAsset {
    id: string;
    pageId: string;
    pageName: string;
    path: string;
    label: string;
    description: string;
    context: {
        title: string;
        subtitle: string;
        bullets?: string;
        imageAlt?: string;
        brand: string;
    };
    currentSrc?: string;
    targetWidth: number;
    targetRatio: string;
    status: AssetStatus;
    
    // Deep Analysis Data
    analysis?: AnalysisReport;
    userPrompt?: string; // The prompt the user can edit before generation
    
    generatedSrc?: string;
    finalBlob?: Blob;
    filename: string;
}

// --- Constants ---

const ASSET_CONFIG = {
    hero: { width: 800, ratio: '16:9' },
    card: { width: 400, ratio: '1:1' },
    canvas: { width: 600, ratio: '3:4' },
    background: { width: 1920, ratio: '16:9' }
};

// --- Helpers ---

const saveBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export const AssetOptimizer: React.FC = () => {
    const { config } = useFunnel();
    const [assets, setAssets] = useState<FunnelAsset[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const stopSignal = useRef(false);

    // Prompt Editor State
    const [editingAssetId, setEditingAssetId] = useState<string | null>(null);

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // --- 1. Parser Engine (Initial Load) ---
    useEffect(() => {
        const foundAssets: FunnelAsset[] = [];
        
        Object.entries(config.pages).forEach(([pageId, p]) => {
            const page = p as PageConfig;
            const data = page.template_data || {};
            
            const context = {
                title: data._title_text || page.name,
                subtitle: data._sub_title_text || '',
                bullets: data._bullets_html ? data._bullets_html.replace(/<[^>]*>/g, ' ') : undefined,
                imageAlt: data._image_alt,
                brand: config.brand
            };

            // 1. Hero Images
            if (data._image_src) {
                foundAssets.push({
                    id: `${pageId}-hero`,
                    pageId,
                    pageName: page.name,
                    path: 'Hero Image',
                    label: 'Main Hero',
                    description: `Primary visual.`,
                    context,
                    currentSrc: data._image_src,
                    targetWidth: ASSET_CONFIG.hero.width,
                    targetRatio: ASSET_CONFIG.hero.ratio,
                    status: 'pending',
                    filename: `${pageId}-hero.webp`
                });
            }

            // 2. Options Images
            if (Array.isArray(data._options)) {
                data._options.forEach((opt: any, idx: number) => {
                    if (opt.image) {
                        const slug = opt.value || `opt-${idx}`;
                        foundAssets.push({
                            id: `${pageId}-opt-${idx}`,
                            pageId,
                            pageName: page.name,
                            path: `Option ${idx + 1}`,
                            label: opt.label || `Option ${idx}`,
                            description: `Option Card: ${opt.label}`,
                            context,
                            currentSrc: opt.image,
                            targetWidth: ASSET_CONFIG.card.width,
                            targetRatio: ASSET_CONFIG.card.ratio,
                            status: 'pending',
                            filename: `${pageId}-${slug}.webp`
                        });
                    }
                });
            }
        });

        // Merge logic to keep existing analysis if page config hasn't drastically changed
        setAssets(prev => {
            if (prev.length === 0) return foundAssets;
            return foundAssets.map(fa => {
                const existing = prev.find(p => p.id === fa.id);
                return existing ? existing : fa;
            });
        });
    }, [config]);

    // --- 2. Logic Engines ---

    const fetchImageBase64 = async (url: string): Promise<string | null> => {
        try {
            const response = await fetch(url, { mode: 'cors' }); 
            if (!response.ok) throw new Error('CORS or 404');
            const blob = await response.blob();
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
            });
        } catch (e) {
            return null; 
        }
    };

    const auditAsset = async (asset: FunnelAsset): Promise<FunnelAsset> => {
        let base64: string | null = null;
        let prompt = '';

        if (asset.currentSrc) {
            base64 = await fetchImageBase64(asset.currentSrc);
        }

        // --- SCENARIO A: Text-Only Analysis (Fallback) ---
        if (!base64) {
            // If we can't see the image, we analyze the CONTEXT to suggest what the image SHOULD be.
            prompt = `
            You are a CRO Expert specializing in Visual Asset Optimization.
            
            **Situation**: The source image for this asset is missing or inaccessible.
            **Goal**: Analyze the text context below and generate a detailed prompt for the *ideal* replacement image.

            **Asset Context**:
            - Role: "${asset.label}"
            - Page Title: "${asset.context.title}"
            - Subtitle: "${asset.context.subtitle}"
            - Brand Tone: "${asset.context.brand}"

            **Mobile-First Design Rules**:
            1. **Framing**: Must be a close-up (macro) or bust-shot. Subject must fill 80% of the frame.
            2. **Style**: Authentic User Generated Content (UGC). No "glossy stock photo" look.
            3. **Clarity**: Simple background, high contrast subject.

            **Output JSON**:
            {
                "score": 0, 
                "congruency": "N/A",
                "mobile_visibility": "N/A",
                "emotional_impact": "N/A",
                "critique": ["Source image unavailable for visual audit.", "Generating recommendation based on text context."],
                "suggested_prompt": "A detailed, descriptive prompt for an authentic, mobile-optimized image..."
            }
            `;
            
            try {
                 const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash', // Fast text model for fallback
                    contents: { parts: [{ text: prompt }] },
                    config: { responseMimeType: "application/json" }
                });
                const result = JSON.parse(response.text || '{}');
                return {
                    ...asset,
                    status: 'audited',
                    analysis: result,
                    userPrompt: result.suggested_prompt
                };
            } catch (e) {
                return { ...asset, status: 'error' };
            }
        }

        // --- SCENARIO B: Full Visual Audit ---
        try {
            prompt = `
            You are a Ruthless CRO (Conversion Rate Optimization) Critic. 
            Analyze this image used for: "${asset.label}" on a page titled "${asset.context.title}".
            
            **Critique Criteria**:
            1. **Mobile Visibility**: Is the subject too small? (Option cards are small on phones).
            2. **Congruency**: Does it perfectly match "${asset.label}"?
            3. **Authenticity**: Does it look like a fake stock photo? (Bad) or authentic UGC? (Good).
            
            **Task**:
            Provide a JSON analysis and a HIGHLY DETAILED prompt to generate a better version.
            
            **Prompting Rules for the Suggestion**:
            - Force "Close-up" or "Macro" for option cards.
            - Specify "Center composed".
            - Specify "Soft natural lighting".
            - No text overlays.
            
            **Output JSON**:
            {
                "score": number (0-100),
                "congruency": "High/Medium/Low",
                "mobile_visibility": "Good/Poor (Too Zoomed Out)",
                "emotional_impact": "string",
                "critique": ["string", "string"],
                "suggested_prompt": "full detailed prompt string"
            }
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: {
                  parts: [
                    { inlineData: { mimeType: "image/png", data: base64!.split(',')[1] } },
                    { text: prompt }
                  ]
                },
                config: { responseMimeType: "application/json" }
            });

            const result = JSON.parse(response.text || '{}');
            
            return {
                ...asset,
                status: 'audited',
                analysis: result,
                userPrompt: result.suggested_prompt
            };

        } catch (e) {
            console.error("Audit Error", e);
            return { ...asset, status: 'error' };
        }
    };

    const generateAsset = async (asset: FunnelAsset): Promise<FunnelAsset> => {
        try {
            // Use the user-edited prompt OR the AI suggested one
            const corePrompt = asset.userPrompt || asset.analysis?.suggested_prompt || `A photo of ${asset.label}`;

            // Enforce Mobile-First Constraints strictly
            // "CTO-level" prompt engineering to avoid generic stock photos
            const finalPrompt = `
                ${corePrompt}
                
                **MOBILE-FIRST CAMERA PROTOCOL (STRICT)**:
                - **DISTANCE**: Extreme Close-up / Macro. The subject must occupy 85% of the frame. Do NOT zoom out.
                - **ANGLE**: Eye-level or POV (Point of View).
                - **DEPTH**: f/1.8 aperture (blurry background/bokeh) to isolate the subject.
                - **STYLE**: "UGC" (User Generated Content). Authentic, selfie-style or candid snapshot. NOT a studio photoshoot.
                - **LIGHTING**: Natural window light. Soft shadows.
                
                **NEGATIVE PROMPT**:
                - Text, watermarks, vector art, illustration, 3D render.
                - Wide angle, distant subject, full body shot (unless requested), cluttered background.
                - Plastic skin, perfect studio lighting, generic corporate stock style.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: finalPrompt }] }
            });

            let generatedBase64 = null;
            if (response.candidates?.[0]?.content?.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData && part.inlineData.data) {
                        generatedBase64 = part.inlineData.data;
                        break;
                    }
                }
            }

            if (!generatedBase64) throw new Error("Model returned no image data.");
            
            return {
                ...asset,
                status: 'optimizing',
                generatedSrc: `data:image/png;base64,${generatedBase64}`
            };

        } catch (e: any) {
            console.error("Generation Error", e);
            return { ...asset, status: 'error' };
        }
    };

    const optimizeAsset = async (asset: FunnelAsset): Promise<FunnelAsset> => {
        if (!asset.generatedSrc) return asset;

        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = asset.generatedSrc!;
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                
                // Smart Center Crop Logic for Mobile Options
                // If target is square (1:1), crop the center of the generated image
                let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;
                
                if (asset.targetRatio === '1:1') {
                     const minDim = Math.min(img.width, img.height);
                     sx = (img.width - minDim) / 2;
                     sy = (img.height - minDim) / 2;
                     sWidth = minDim;
                     sHeight = minDim;
                }

                canvas.width = asset.targetWidth;
                canvas.height = asset.targetWidth * (asset.targetRatio === '16:9' ? 0.5625 : asset.targetRatio === '3:4' ? 1.33 : 1);
                
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    
                    // Draw cropped source to canvas
                    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
                    
                    canvas.toBlob((blob) => {
                        if (blob) {
                            resolve({
                                ...asset,
                                status: 'done',
                                finalBlob: blob,
                                generatedSrc: URL.createObjectURL(blob)
                            });
                        } else {
                            resolve({ ...asset, status: 'error' });
                        }
                    }, 'image/webp', 0.90);
                }
            };
            img.onerror = () => {
                resolve({ ...asset, status: 'error' });
            }
        });
    };

    // --- Action Handlers ---

    const runAudit = async () => {
        setIsProcessing(true);
        stopSignal.current = false;
        
        const queue = assets.filter(a => a.status === 'pending' || a.status === 'error' || a.status === 'audited');
        let completed = 0;

        for (const asset of queue) {
            if (stopSignal.current) break;
            
            setAssets(prev => prev.map(a => a.id === asset.id ? { ...a, status: 'auditing' } : a));
            const result = await auditAsset(asset);
            setAssets(prev => prev.map(a => a.id === asset.id ? result : a));
            
            completed++;
            setProgress((completed / queue.length) * 100);
        }
        setIsProcessing(false);
    };

    const runSingleGeneration = async (assetId: string) => {
        const asset = assets.find(a => a.id === assetId);
        if (!asset) return;

        setAssets(prev => prev.map(a => a.id === assetId ? { ...a, status: 'generating' } : a));
        
        // 1. Generate
        let result = await generateAsset(asset);
        setAssets(prev => prev.map(a => a.id === assetId ? result : a));

        // 2. Optimize
        if (result.status === 'optimizing') {
            result = await optimizeAsset(result);
            setAssets(prev => prev.map(a => a.id === assetId ? result : a));
        }
    };

    const handlePromptChange = (assetId: string, newPrompt: string) => {
        setAssets(prev => prev.map(a => a.id === assetId ? { ...a, userPrompt: newPrompt } : a));
    };

    const handleDownload = async () => {
        const zip = new JSZip();
        let logContent = "# Asset Production Log\n\n";

        assets.forEach(asset => {
            if (asset.finalBlob) {
                zip.file(`images/${asset.filename}`, asset.finalBlob);
                logContent += `## ${asset.filename}\n`;
                logContent += `Prompt Used: ${asset.userPrompt}\n\n`;
            }
        });

        zip.file("report/asset_log.md", logContent);
        const content = await zip.generateAsync({ type: "blob" });
        saveBlob(content, `${config.brand}-assets-v${config.version}.zip`);
    };

    return (
        <div className="h-full flex flex-col bg-white border-l border-gray-200 shadow-xl">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 bg-white z-10 flex justify-between items-center shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <ImageIcon size={24} className="text-[#f51721]" /> Asset Studio
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">Deep Analysis • Prompt Control • Mobile-First Generation</p>
                </div>
                <div className="flex gap-2">
                    {isProcessing ? (
                         <button onClick={() => { stopSignal.current = true; setIsProcessing(false); }} className="px-4 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-bold">
                            Stop
                        </button>
                    ) : (
                        <button onClick={runAudit} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-black transition-colors">
                            <Search size={16} /> Run Audit
                        </button>
                    )}
                    
                    <button onClick={handleDownload} disabled={assets.filter(a => a.status === 'done').length === 0} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-200 disabled:opacity-50">
                        <Download size={16} /> ZIP
                    </button>
                </div>
            </div>

            {/* Asset Grid */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                <div className="grid grid-cols-1 gap-6">
                    {assets.map(asset => (
                        <div key={asset.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in">
                            {/* Header Bar */}
                            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-gray-800">{asset.label}</span>
                                    <span className="text-xs text-gray-500">• {asset.pageName}</span>
                                </div>
                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                    asset.status === 'done' ? 'bg-green-100 text-green-700' : 
                                    asset.status === 'audited' ? 'bg-blue-100 text-blue-700' :
                                    asset.status === 'error' ? 'bg-red-100 text-red-700' :
                                    'bg-gray-200 text-gray-500'
                                }`}>
                                    {asset.status}
                                </span>
                            </div>

                            <div className="p-4 flex gap-6">
                                {/* Left: Visuals */}
                                <div className="flex flex-col gap-2 w-48 flex-shrink-0">
                                    {/* Image Display */}
                                    <div className="w-48 h-48 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 relative group">
                                         {asset.generatedSrc ? (
                                            <img src={asset.generatedSrc} className="w-full h-full object-cover" />
                                        ) : asset.currentSrc ? (
                                            <img src={asset.currentSrc} className="w-full h-full object-cover opacity-80" />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-gray-300"><ImageIcon size={24} /></div>
                                        )}
                                        
                                        {/* Overlays */}
                                        {asset.status === 'auditing' && <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs font-bold"><Loader2 className="animate-spin mr-1"/> Analyzing...</div>}
                                        {asset.status === 'generating' && <div className="absolute inset-0 bg-purple-900/60 flex items-center justify-center text-white text-xs font-bold"><Wand2 className="animate-pulse mr-1"/> Creating...</div>}
                                    </div>
                                    <div className="flex justify-between text-[10px] text-gray-400">
                                        <span>Target: {asset.targetWidth}px</span>
                                        <span>{asset.targetRatio}</span>
                                    </div>
                                    {/* Mobile Preview Badge */}
                                    <div className="flex items-center justify-center gap-1 text-[10px] text-gray-400 bg-gray-50 p-1 rounded">
                                        <Smartphone size={10} /> Mobile-First View
                                    </div>
                                </div>

                                {/* Right: Intelligence & Control */}
                                <div className="flex-1 flex flex-col gap-3">
                                    {/* 1. Deep Analysis Report */}
                                    {asset.analysis && (
                                        <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-100">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className={`text-xs font-bold px-2 py-0.5 rounded ${asset.analysis.score > 0 ? (asset.analysis.score > 70 ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800') : 'bg-gray-200 text-gray-700'}`}>
                                                    Score: {asset.analysis.score}/100
                                                </div>
                                                <div className="text-[10px] text-blue-600 font-medium flex-1">
                                                    Mobile Vis: {asset.analysis.mobile_visibility}
                                                </div>
                                            </div>
                                            <ul className="space-y-1">
                                                {asset.analysis.critique.map((c, i) => (
                                                    <li key={i} className="text-[11px] text-blue-800 flex items-start gap-1.5">
                                                        <span className="mt-0.5 text-blue-400">•</span> {c}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* 2. Prompt Control Center (The CTO Feature) */}
                                    {(asset.status === 'audited' || asset.status === 'done' || asset.status === 'error') && (
                                        <div className="flex-1 flex flex-col">
                                            <div className="flex justify-between items-end mb-1">
                                                <label className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1">
                                                    <Edit3 size={10} /> Generation Prompt
                                                </label>
                                                {asset.status === 'done' && <span className="text-[10px] text-green-600 font-bold flex items-center"><CheckCircle2 size={10} className="mr-1"/> Generated</span>}
                                            </div>
                                            
                                            <textarea 
                                                className="w-full h-24 p-2 text-xs bg-gray-50 border border-gray-300 rounded-lg font-mono text-gray-700 focus:ring-2 focus:ring-[#f51721] focus:border-[#f51721] outline-none resize-none mb-2"
                                                value={asset.userPrompt || ''}
                                                onChange={(e) => handlePromptChange(asset.id, e.target.value)}
                                                placeholder="Waiting for analysis to suggest a prompt..."
                                            />
                                            
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => runSingleGeneration(asset.id)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-[#f51721] text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-all shadow-sm"
                                                >
                                                    <Wand2 size={12} /> {asset.status === 'done' ? 'Regenerate' : 'Generate Asset'}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Empty State */}
                                    {asset.status === 'pending' && (
                                        <div className="flex-1 flex items-center justify-center text-gray-300 text-sm border-2 border-dashed border-gray-100 rounded-lg">
                                            Waiting for Audit...
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
