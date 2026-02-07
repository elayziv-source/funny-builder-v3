import React from 'react';
import DOMPurify from 'dompurify';
import { PageConfig, ComponentNode, TemplateData, OptionItem, FocusAreaItem, CarouselSlide } from '../../types';
import { Button as BaseButton } from '../ui/Button';
import { Check, ArrowRight, BarChart, Calendar, Lock, ShieldCheck, Star, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle, TrendingDown, Activity, Target, Scale, Ruler, Hash, ShoppingCart, CreditCard, Award } from 'lucide-react';
import { useFunnel } from '../../context/FunnelContext';

// --- Prop Resolution Logic ---

/**
 * Resolves a property value. 
 * If it's a string starting with '_', it looks it up in template_data.
 * Otherwise, returns the value as is.
 */
const resolveProp = (value: any, data: TemplateData): any => {
    if (typeof value === 'string' && value.startsWith('_')) {
        if (!data) return null; // Defensive check for missing data
        // If data has the key, return it. Otherwise return the placeholder for debugging/fallback
        return data[value] !== undefined ? data[value] : null; 
    }
    return value;
};

/**
 * Recursively resolves all props in an object.
 */
const resolveProps = (props: Record<string, any> = {}, data: TemplateData): Record<string, any> => {
    const resolved: Record<string, any> = {};
    Object.keys(props).forEach(key => {
        resolved[key] = resolveProp(props[key], data);
    });
    return resolved;
};

// --- Atomic Components ---

const Gap = ({ gap, theme }: { gap: string, theme: any }) => {
    const size = theme.spacing[gap] || theme.spacing.md || '1rem';
    return <div style={{ height: size, minHeight: size }} />;
};

const Divider = ({ theme }: { theme: any }) => (
    <div className="w-full h-px bg-gray-200 my-2" />
);

const Text = ({ text, html, font, color, text_align, width, element = "p", theme }: any) => {
    const fontStyle = theme.fonts[font] || theme.fonts.body;
    const colorValue = theme.colors[color] || theme.colors.text;
    const Tag = element as React.ElementType;
    
    const style: React.CSSProperties = {
        font: fontStyle,
        color: colorValue,
        textAlign: text_align || 'center',
        width: theme.width[width] || '100%',
        margin: '0 auto', // Center block if width < 100%
    };

    if (html) {
        return <Tag style={style} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />;
    }
    if (!text) return null;
    return <Tag style={style}>{text}</Tag>;
};

const ImageBox = ({ src, alt, width, max_width, padding, theme }: any) => {
    if (!src) return null;
    
    const widthVal = theme.width[width] || width || '100%';
    const maxWidthVal = theme.width[max_width] || max_width || '100%';
    const paddingVal = theme.spacing[padding] || 0;

    return (
        <div className="flex justify-center w-full" style={{ padding: paddingVal }}>
            <div className="overflow-hidden rounded-xl" style={{ width: widthVal, maxWidth: maxWidthVal }}>
                <img src={src} alt={alt || ''} className="w-full h-auto object-contain" />
            </div>
        </div>
    );
};

const StandardButton = ({ text, on_click, width, fixed, disabled, theme, after_icon }: any) => {
    const isFixed = fixed === true;
    const widthStyle = theme.width[width] || '100%';
    
    // Simplistic handling of disabled condition object
    const isDisabled = disabled && typeof disabled === 'object' ? true : false; 

    const btn = (
        <BaseButton 
            fullWidth={width === 'full'}
            disabled={isDisabled}
            style={{ 
                font: theme.fonts.button,
                backgroundColor: theme.colors.primary, 
                color: '#fff',
                borderColor: theme.colors.primary,
                borderRadius: theme.border_radius.md || '1rem',
                opacity: isDisabled ? 0.5 : 1
            }}
        >
            {text || 'Continue'}
            {after_icon && <ArrowRight className="ml-2 inline" size={18} />}
        </BaseButton>
    );

    if (isFixed) {
        return (
            <div className="mt-auto w-full sticky bottom-4 pt-4 bg-transparent">
                {btn}
            </div>
        );
    }
    
    return <div style={{ width: widthStyle, margin: '0 auto' }}>{btn}</div>;
};

const ItemPicker = ({ items, mode, direction, item_flavor, theme }: any) => {
    if (!items || !Array.isArray(items)) return null;

    const isGrid = direction !== 'row' && !item_flavor?.includes('cloud');
    const isRow = direction === 'row'; // Specifically for Hero Picker (2 cols)
    const isCloud = item_flavor === 'cloud';

    if (isCloud) {
        return (
            <div className="flex flex-wrap gap-3 justify-center content-start">
                {items.map((opt: OptionItem, idx: number) => (
                    <button key={idx} 
                        className="px-4 py-2 bg-white rounded-full shadow-sm font-semibold text-sm transition-colors border border-gray-200 hover:border-current"
                        style={{ color: theme.colors.text }}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
        );
    }

    // Grid for pick_hero (2 cols)
    if (isRow) {
         return (
            <div className="grid grid-cols-2 gap-4 w-full">
                {items.map((opt: OptionItem, idx: number) => (
                <button key={idx} className="bg-white p-2 shadow-sm transition-all group flex flex-col items-center border hover:border-current"
                    style={{ 
                        borderRadius: theme.border_radius.lg || '1rem',
                        borderColor: '#eaeaeb',
                        color: theme.colors.text
                    }}
                >
                    {opt.image && (
                        <div className="aspect-[3/4] w-full overflow-hidden mb-3 bg-gray-100 relative" style={{ borderRadius: theme.border_radius.md || '0.5rem' }}>
                            <img src={opt.image} alt={opt.label} className="w-full h-full object-cover" />
                        </div>
                    )}
                    <span className="font-bold text-lg mb-2">{opt.label}</span>
                </button>
                ))}
            </div>
        );
    }

    // Standard Stack or Cards
    return (
        <div className="flex flex-col gap-3 w-full">
            {items.map((opt: OptionItem, idx: number) => (
                <button key={idx} 
                    className="flex items-center p-3 bg-white shadow-sm transition-all text-left border hover:border-current group"
                    style={{ 
                        borderRadius: theme.border_radius.md || '0.75rem',
                        borderColor: '#eaeaeb',
                        color: theme.colors.text
                    }}
                >
                    {opt.image && <img src={opt.image} alt={opt.label} className="w-12 h-12 object-contain mr-4" />}
                    {opt.emoji && <span className="text-3xl mr-4">{opt.emoji}</span>}
                    <div className="flex-1">
                        <span className="font-bold text-lg block">{opt.label}</span>
                        {opt.description && <span className="text-sm block" style={{ color: theme.colors.secondary_text }}>{opt.description}</span>}
                    </div>
                    {mode === 'multi' && <div className="w-6 h-6 rounded-full border-2 border-gray-300 ml-2 group-hover:border-current"></div>}
                    {mode !== 'multi' && <ArrowRight className="text-gray-300" />}
                </button>
            ))}
        </div>
    );
};

const FocusAreas = ({ canvas, areas, theme }: any) => {
    return (
        <div className="relative w-full max-w-[300px] mx-auto">
            {canvas && <img src={canvas} alt="Body Canvas" className="w-full h-auto opacity-50" />}
            {Array.isArray(areas) && (
                <div className="grid grid-cols-2 gap-2 mt-4">
                     {areas.map((area: FocusAreaItem, idx: number) => (
                         <button key={idx} className="bg-white/80 p-2 rounded-lg text-sm font-semibold shadow-sm border border-gray-200 hover:border-current" style={{ color: theme.colors.primary }}>
                             {area.label}
                         </button>
                     ))}
                </div>
            )}
        </div>
    );
};

const UnitToggle = ({ items, theme }: any) => (
    <div className="flex justify-center mb-6">
        <div className="bg-white rounded-full p-1 border border-gray-200 flex">
            {(items || []).map((item: any, idx: number) => (
                <button key={idx} 
                    className={`px-4 py-1 rounded-full text-sm font-bold shadow-sm ${idx === 0 ? 'text-white' : 'text-gray-500'}`} 
                    style={{ backgroundColor: idx === 0 ? theme.colors.primary : 'transparent' }}
                >
                    {item.label?.toUpperCase()}
                </button>
            ))}
        </div>
    </div>
);

const SimpleInput = ({ placeholder, flavor, theme }: any) => (
    <div className="my-4">
        <input 
            type={flavor === 'email' ? 'email' : 'text'}
            placeholder={placeholder || '...'}
            className="w-full px-4 py-4 border border-gray-300 rounded-xl outline-none text-lg transition-colors focus:border-current"
            style={{ color: theme.colors.text }}
        />
    </div>
);

const LinksBox = ({ children, theme }: any) => {
    // children here is an array of links from data
    if (!Array.isArray(children)) return null;
    return (
        <div className="flex flex-wrap justify-center gap-4 text-xs mt-8 pt-6 border-t border-gray-200">
            {children.map((link: any, idx: number) => (
                <a key={idx} href={link.href} className="hover:opacity-75" style={{ color: theme.colors.secondary_text }}>
                    {link.text}
                </a>
            ))}
        </div>
    );
};

const PageProgressBar = ({ theme }: any) => (
    <div className="w-1/3 bg-gray-200 h-1.5 rounded-full overflow-hidden">
        <div className="w-1/3 h-full rounded-full" style={{ background: theme.colors.primary }}></div>
    </div>
);

// --- Component Registry ---

const COMPONENT_REGISTRY: Record<string, React.FC<any>> = {
    'Page': ({ children, width, theme }) => (
        <div className="flex flex-col h-full items-center w-full mx-auto" 
             style={{ maxWidth: theme.width[width] || '100%' }}>
            {children}
        </div>
    ),
    'Box': ({ children, gap, fixed, theme }) => (
        <div className={`flex items-center justify-between w-full ${fixed ? 'sticky top-0 z-10 backdrop-blur-sm px-4 py-3 border-b border-gray-200/50' : ''}`}
             style={{ 
                 gap: theme.spacing[gap] || 0,
                 background: fixed ? `${theme.colors.background}EE` : 'transparent'
             }}>
            {children}
        </div>
    ),
    'Gap': Gap,
    'Divider': Divider,
    'Text': Text,
    'Title': (props) => <Text element="h1" font="title" {...props} />,
    'Subtitle': (props) => <Text font="sub_title" {...props} />,
    'RichText': (props) => <Text {...props} />,
    'ImageBox': ImageBox,
    'Button': StandardButton,
    'ItemPicker': ItemPicker,
    'FocusAreas': FocusAreas,
    'UnitToggle': UnitToggle,
    'LengthInput': ({ answer_key, unit_answer_key, invalid, theme }: any) => {
        const isMetric = true; // Default to metric in preview
        return (
            <div className="w-full my-4">
                <div className="flex items-center justify-center gap-3">
                    {isMetric ? (
                        <div className="relative flex-1 max-w-[200px]">
                            <input
                                type="number"
                                placeholder="170"
                                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-center text-2xl font-bold outline-none transition-colors focus:border-current"
                                style={{ color: theme.colors.text, borderColor: theme.colors.primary + '40' }}
                                readOnly
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: theme.colors.secondary_text }}>cm</span>
                        </div>
                    ) : (
                        <>
                            <div className="relative flex-1 max-w-[120px]">
                                <input
                                    type="number"
                                    placeholder="5"
                                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-center text-2xl font-bold outline-none transition-colors"
                                    style={{ color: theme.colors.text, borderColor: theme.colors.primary + '40' }}
                                    readOnly
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: theme.colors.secondary_text }}>ft</span>
                            </div>
                            <div className="relative flex-1 max-w-[120px]">
                                <input
                                    type="number"
                                    placeholder="7"
                                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-center text-2xl font-bold outline-none transition-colors"
                                    style={{ color: theme.colors.text, borderColor: theme.colors.primary + '40' }}
                                    readOnly
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: theme.colors.secondary_text }}>in</span>
                            </div>
                        </>
                    )}
                </div>
                <div className="flex items-center justify-center gap-1 mt-2">
                    <Ruler size={12} style={{ color: theme.colors.secondary_text }} />
                    <span className="text-xs" style={{ color: theme.colors.secondary_text }}>Height Input</span>
                </div>
            </div>
        );
    },
    'WeightInput': ({ answer_key, unit_answer_key, invalid, theme }: any) => {
        return (
            <div className="w-full my-4">
                <div className="flex items-center justify-center">
                    <div className="relative w-full max-w-[240px]">
                        <input
                            type="number"
                            placeholder="75"
                            className="w-full px-4 py-5 border-2 rounded-xl text-center text-3xl font-bold outline-none transition-colors"
                            style={{ color: theme.colors.text, borderColor: theme.colors.primary + '40' }}
                            readOnly
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: theme.colors.secondary_text }}>kg</span>
                    </div>
                </div>
                <div className="flex items-center justify-center gap-1 mt-2">
                    <Scale size={12} style={{ color: theme.colors.secondary_text }} />
                    <span className="text-xs" style={{ color: theme.colors.secondary_text }}>Weight Input</span>
                </div>
            </div>
        );
    },
    'NumericInput': ({ answer_key, invalid, placeholder, theme }: any) => {
        return (
            <div className="w-full my-4">
                <div className="flex items-center justify-center">
                    <div className="relative w-full max-w-[200px]">
                        <input
                            type="number"
                            placeholder={placeholder || "35"}
                            className="w-full px-4 py-5 border-2 rounded-xl text-center text-3xl font-bold outline-none transition-colors"
                            style={{ color: theme.colors.text, borderColor: theme.colors.primary + '40' }}
                            readOnly
                        />
                    </div>
                </div>
                <div className="flex items-center justify-center gap-1 mt-2">
                    <Hash size={12} style={{ color: theme.colors.secondary_text }} />
                    <span className="text-xs" style={{ color: theme.colors.secondary_text }}>Numeric Input</span>
                </div>
            </div>
        );
    },
    'DatePicker': ({ placeholder }) => <div className="w-full p-4 border rounded-xl text-gray-500 bg-white flex justify-between">{placeholder || 'Select Date'} <Calendar size={16}/></div>,
    'TextInput': SimpleInput,
    'NotificationCard': ({ icon, title_text, body_text, theme }) => (
        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex gap-3 items-start text-left w-full">
             <span className="text-2xl">{icon}</span>
             <div>
                {title_text && <p className="font-bold text-sm text-orange-900 mb-1">{title_text}</p>}
                <p className="text-sm text-orange-800 leading-snug">{body_text}</p>
             </div>
        </div>
    ),
    'LinksBox': LinksBox,
    'PageProgressBar': PageProgressBar,
    'AnimatedChart': ({ theme }) => (
        <div className="w-40 h-40 rounded-full border-[6px] flex items-center justify-center relative mx-auto" style={{ borderColor: `${theme.colors.primary}33` }}>
            <div className="absolute inset-0 rounded-full border-[6px] border-b-transparent border-l-transparent animate-spin" style={{ borderTopColor: theme.colors.primary, borderRightColor: theme.colors.primary }}></div>
            <BarChart className="w-16 h-16" style={{ color: theme.colors.primary }} />
        </div>
    ),
    'Checkout': ({ theme, _on_checkout, footer_links, testimonials, checkout_links, disclaimers }: any) => (
        <div className="w-full space-y-4">
            {/* Plan Summary Card */}
            <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-white">
                <div className="p-4 text-center" style={{ backgroundColor: theme.colors.primary + '10' }}>
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <Award size={18} style={{ color: theme.colors.primary }} />
                        <span className="font-bold text-sm uppercase tracking-wider" style={{ color: theme.colors.primary }}>Your Personalized Plan</span>
                    </div>
                </div>
                <div className="p-5">
                    {/* Plan Options */}
                    <div className="space-y-3">
                        {[
                            { label: '1-Month Plan', price: '$49.99/mo', per: '$1.67/day', popular: false },
                            { label: '3-Month Plan', price: '$29.99/mo', per: '$1.00/day', popular: true },
                            { label: '6-Month Plan', price: '$19.99/mo', per: '$0.67/day', popular: false }
                        ].map((plan, i) => (
                            <div key={i} className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer ${plan.popular ? 'border-current shadow-md' : 'border-gray-200'}`}
                                style={{ borderColor: plan.popular ? theme.colors.primary : undefined }}>
                                {plan.popular && (
                                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-white text-[10px] font-bold uppercase" style={{ backgroundColor: theme.colors.primary }}>
                                        Most Popular
                                    </div>
                                )}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${plan.popular ? '' : 'border-gray-300'}`} style={{ borderColor: plan.popular ? theme.colors.primary : undefined }}>
                                            {plan.popular && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.colors.primary }} />}
                                        </div>
                                        <span className="font-bold">{plan.label}</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold" style={{ color: theme.colors.text }}>{plan.price}</div>
                                        <div className="text-xs" style={{ color: theme.colors.secondary_text }}>{plan.per}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Checkout Button */}
            <button className="w-full py-4 rounded-full font-bold text-white text-lg shadow-lg flex items-center justify-center gap-2"
                style={{ backgroundColor: theme.colors.primary }}>
                <ShoppingCart size={20} /> Get My Plan
            </button>

            {/* Trust Badges */}
            <div className="flex items-center justify-center gap-4 py-2">
                <div className="flex items-center gap-1 text-xs" style={{ color: theme.colors.secondary_text }}>
                    <Lock size={12} /> Secure Payment
                </div>
                <div className="flex items-center gap-1 text-xs" style={{ color: theme.colors.secondary_text }}>
                    <ShieldCheck size={12} /> Money-Back Guarantee
                </div>
            </div>

            {/* Payment Methods */}
            <div className="flex items-center justify-center gap-3 py-2">
                {['Visa', 'MC', 'Amex', 'PayPal'].map((method, i) => (
                    <div key={i} className="px-3 py-1.5 bg-gray-100 rounded-md text-xs font-bold text-gray-500 border border-gray-200">
                        {method}
                    </div>
                ))}
            </div>
        </div>
    ),
    'Countdown': ({ countdown_text, theme }) => <div className="text-center font-bold text-xl py-4" style={{ color: theme.colors.primary }}>{countdown_text}</div>,
    'Carousel': ({ carousel_slides, theme }: any) => {
        const slides: CarouselSlide[] = Array.isArray(carousel_slides) ? carousel_slides : [
            { author: 'Sarah M.', quote: 'This program completely changed my relationship with food. Down 15 lbs in 4 weeks!', stars_rating_img_url: '' },
            { author: 'Jennifer K.', quote: 'I finally found something that works. The personalized approach made all the difference.', stars_rating_img_url: '' },
            { author: 'Amanda R.', quote: 'Easy to follow and the results speak for themselves. Highly recommend!', stars_rating_img_url: '' }
        ];
        return (
            <div className="w-full">
                <div className="relative overflow-hidden rounded-xl">
                    {/* Visible slide */}
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                        {/* Stars */}
                        <div className="flex gap-0.5 mb-3">
                            {[1,2,3,4,5].map(s => (
                                <Star key={s} size={16} fill={theme.colors.primary} strokeWidth={0} style={{ color: theme.colors.primary }} />
                            ))}
                        </div>
                        {/* Quote */}
                        <p className="text-sm leading-relaxed mb-3 italic" style={{ color: theme.colors.text }}>
                            &ldquo;{slides[0]?.quote || 'Great product!'}&rdquo;
                        </p>
                        {/* Author */}
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: theme.colors.primary }}>
                                {(slides[0]?.author || 'U')[0]}
                            </div>
                            <span className="font-bold text-sm" style={{ color: theme.colors.text }}>
                                {slides[0]?.author || 'User'}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-bold">Verified</span>
                        </div>
                    </div>
                    {/* Navigation dots */}
                    <div className="flex justify-center gap-2 mt-3">
                        {slides.map((_, i) => (
                            <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === 0 ? 'w-6' : ''}`}
                                style={{ backgroundColor: i === 0 ? theme.colors.primary : theme.colors.primary + '30' }} />
                        ))}
                    </div>
                </div>
            </div>
        );
    },
    'BmiChart': ({ current_weight_key, ideal_weight_key, height_answer_key, theme }: any) => {
        // Preview with sample BMI = 27.5 (overweight range for visual impact)
        const bmi = 27.5;
        const categories = [
            { label: 'Underweight', range: '< 18.5', color: '#60a5fa', min: 0, max: 18.5 },
            { label: 'Normal', range: '18.5 - 24.9', color: '#34d399', min: 18.5, max: 24.9 },
            { label: 'Overweight', range: '25 - 29.9', color: '#fbbf24', min: 25, max: 29.9 },
            { label: 'Obese', range: '30+', color: '#f87171', min: 30, max: 45 },
        ];
        const markerPosition = Math.min(Math.max(((bmi - 12) / (45 - 12)) * 100, 2), 98);
        const currentCategory = categories.find(c => bmi >= c.min && bmi <= c.max) || categories[2];

        return (
            <div className="w-full my-4 px-2">
                {/* BMI Value */}
                <div className="text-center mb-4">
                    <div className="text-sm font-bold mb-1" style={{ color: theme.colors.secondary_text }}>Your BMI</div>
                    <div className="text-5xl font-black" style={{ color: currentCategory.color }}>{bmi}</div>
                    <div className="inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: currentCategory.color }}>
                        {currentCategory.label}
                    </div>
                </div>

                {/* BMI Scale Bar */}
                <div className="relative mb-2">
                    <div className="flex h-3 rounded-full overflow-hidden">
                        {categories.map((cat, i) => (
                            <div key={i} className="flex-1 h-full" style={{ backgroundColor: cat.color }} />
                        ))}
                    </div>
                    {/* Marker */}
                    <div className="absolute top-0 -translate-x-1/2 transition-all" style={{ left: `${markerPosition}%` }}>
                        <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent" style={{ borderTopColor: theme.colors.text }} />
                    </div>
                </div>

                {/* Labels */}
                <div className="flex text-[9px] font-bold">
                    {categories.map((cat, i) => (
                        <div key={i} className="flex-1 text-center" style={{ color: cat.color }}>{cat.label}</div>
                    ))}
                </div>
            </div>
        );
    },
    'BmiReport': ({ current_body_type_key, lifestyle_key, exercise_key, activity_level_key, notification_title_text, notification_body_text, theme }: any) => {
        const metrics = [
            { label: 'Body Type', value: 'Endomorph', icon: '🧬' },
            { label: 'Activity Level', value: 'Moderate', icon: '🏃' },
            { label: 'Lifestyle', value: 'Sedentary', icon: '💼' },
            { label: 'Exercise', value: '2-3x/week', icon: '💪' },
        ];
        return (
            <div className="w-full my-4 space-y-3">
                {/* Report Title */}
                {notification_title_text && (
                    <div className="text-center">
                        <h3 className="font-bold text-lg" style={{ color: theme.colors.text }}>
                            {notification_title_text}
                        </h3>
                        {notification_body_text && (
                            <p className="text-sm mt-1" style={{ color: theme.colors.secondary_text }}>{notification_body_text}</p>
                        )}
                    </div>
                )}
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-2">
                    {metrics.map((metric, i) => (
                        <div key={i} className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
                            <span className="text-lg">{metric.icon}</span>
                            <div className="text-[10px] font-bold mt-1" style={{ color: theme.colors.secondary_text }}>{metric.label}</div>
                            <div className="text-sm font-bold mt-0.5" style={{ color: theme.colors.text }}>{metric.value}</div>
                        </div>
                    ))}
                </div>
                {/* Summary Bar */}
                <div className="p-3 rounded-xl flex items-center gap-3" style={{ backgroundColor: theme.colors.primary + '10' }}>
                    <Activity size={20} style={{ color: theme.colors.primary }} />
                    <div>
                        <div className="text-xs font-bold" style={{ color: theme.colors.primary }}>Based on your profile</div>
                        <div className="text-xs" style={{ color: theme.colors.secondary_text }}>Your plan has been customized to your body type and activity level.</div>
                    </div>
                </div>
            </div>
        );
    },
    'BmiNotification': ({ height_answer_key, weight_answer_key, normal, underweight, overweight, obese, theme }: any) => {
        // Preview shows overweight state for visual impact
        const category = 'overweight';
        const configs: Record<string, { bg: string; border: string; icon: React.ReactNode; color: string; text: string }> = {
            underweight: { bg: '#dbeafe', border: '#93c5fd', icon: <AlertTriangle size={18} />, color: '#1d4ed8', text: underweight || 'Your BMI indicates you are underweight.' },
            normal: { bg: '#dcfce7', border: '#86efac', icon: <CheckCircle size={18} />, color: '#15803d', text: normal || 'Your BMI is in the healthy range!' },
            overweight: { bg: '#fef3c7', border: '#fcd34d', icon: <AlertTriangle size={18} />, color: '#b45309', text: overweight || 'Your BMI suggests you are overweight. Our plan can help!' },
            obese: { bg: '#fee2e2', border: '#fca5a5', icon: <AlertTriangle size={18} />, color: '#b91c1c', text: obese || 'Your BMI is in the obese range. Take action today.' },
        };
        const cfg = configs[category];
        return (
            <div className="w-full rounded-xl p-4 flex items-start gap-3 border" style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}>
                <div className="mt-0.5" style={{ color: cfg.color }}>{cfg.icon}</div>
                <div>
                    <div className="font-bold text-sm" style={{ color: cfg.color }}>BMI Assessment</div>
                    <p className="text-sm mt-0.5" style={{ color: cfg.color + 'CC' }}>{cfg.text}</p>
                </div>
            </div>
        );
    },
    'GoalNotification': ({ user_weight_answer_key, perfect_weight_answer_key, realistic, benefits, challenging, theme }: any) => {
        // Preview shows "realistic" state
        const state = 'realistic';
        const configs: Record<string, { bg: string; border: string; icon: React.ReactNode; color: string; title: string; text: string }> = {
            realistic: { bg: '#dcfce7', border: '#86efac', icon: <CheckCircle size={20} />, color: '#15803d', title: 'Great goal!', text: realistic || 'Your target weight is realistic and achievable with our program.' },
            benefits: { bg: '#dbeafe', border: '#93c5fd', icon: <Target size={20} />, color: '#1d4ed8', title: 'Health benefits ahead', text: benefits || 'Even small progress toward this goal will improve your health.' },
            challenging: { bg: '#fef3c7', border: '#fcd34d', icon: <AlertTriangle size={20} />, color: '#b45309', title: 'Ambitious goal', text: challenging || 'This is a challenging target. We recommend starting with smaller milestones.' },
        };
        const cfg = configs[state];
        return (
            <div className="w-full rounded-xl p-4 flex items-start gap-3 border" style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}>
                <div className="mt-0.5" style={{ color: cfg.color }}>{cfg.icon}</div>
                <div>
                    <div className="font-bold text-sm" style={{ color: cfg.color }}>{cfg.title}</div>
                    <p className="text-sm mt-0.5" style={{ color: cfg.color + 'CC' }}>{cfg.text}</p>
                </div>
            </div>
        );
    },
    'WeightLossChart': ({ current_weight_key, ideal_weight_key, theme }: any) => {
        // Sample data: 12-week weight loss projection
        const currentWeight = 85;
        const idealWeight = 68;
        const weeks = 12;
        const points: { week: number; weight: number }[] = [];
        for (let i = 0; i <= weeks; i++) {
            // Exponential decay curve (fast start, slower finish)
            const progress = 1 - Math.pow(1 - (i / weeks), 1.5);
            points.push({ week: i, weight: Math.round((currentWeight - (currentWeight - idealWeight) * progress) * 10) / 10 });
        }
        const minW = idealWeight - 3;
        const maxW = currentWeight + 3;
        const chartHeight = 140;
        const chartWidth = 280;
        const getX = (week: number) => (week / weeks) * chartWidth;
        const getY = (weight: number) => chartHeight - ((weight - minW) / (maxW - minW)) * chartHeight;

        // SVG path
        const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.week)} ${getY(p.weight)}`).join(' ');
        const areaData = `${pathData} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;

        return (
            <div className="w-full my-4">
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <div className="text-xs font-bold" style={{ color: theme.colors.secondary_text }}>Projected Progress</div>
                            <div className="text-lg font-black" style={{ color: theme.colors.text }}>-{currentWeight - idealWeight} kg</div>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: theme.colors.primary + '15', color: theme.colors.primary }}>
                            <TrendingDown size={14} /> 12 weeks
                        </div>
                    </div>

                    {/* Chart */}
                    <div className="relative" style={{ width: '100%', maxWidth: chartWidth + 40 + 'px', margin: '0 auto' }}>
                        <svg viewBox={`-30 -10 ${chartWidth + 50} ${chartHeight + 30}`} className="w-full" style={{ height: chartHeight + 40 }}>
                            {/* Grid lines */}
                            {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
                                const y = frac * chartHeight;
                                const weight = Math.round(maxW - frac * (maxW - minW));
                                return (
                                    <g key={i}>
                                        <line x1={0} y1={y} x2={chartWidth} y2={y} stroke="#f0f0f0" strokeWidth={1} />
                                        <text x={-8} y={y + 4} textAnchor="end" fontSize={9} fill={theme.colors.secondary_text}>{weight}</text>
                                    </g>
                                );
                            })}

                            {/* Area fill */}
                            <defs>
                                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={theme.colors.primary} stopOpacity={0.2} />
                                    <stop offset="100%" stopColor={theme.colors.primary} stopOpacity={0.02} />
                                </linearGradient>
                            </defs>
                            <path d={areaData} fill="url(#chartGrad)" />

                            {/* Line */}
                            <path d={pathData} fill="none" stroke={theme.colors.primary} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

                            {/* Start point */}
                            <circle cx={getX(0)} cy={getY(currentWeight)} r={4} fill={theme.colors.primary} />
                            <text x={getX(0)} y={getY(currentWeight) - 10} textAnchor="middle" fontSize={10} fontWeight="bold" fill={theme.colors.text}>{currentWeight}kg</text>

                            {/* End point */}
                            <circle cx={getX(weeks)} cy={getY(idealWeight)} r={4} fill={theme.colors.primary} />
                            <text x={getX(weeks)} y={getY(idealWeight) - 10} textAnchor="middle" fontSize={10} fontWeight="bold" fill={theme.colors.primary}>{idealWeight}kg</text>

                            {/* Goal line */}
                            <line x1={0} y1={getY(idealWeight)} x2={chartWidth} y2={getY(idealWeight)} stroke={theme.colors.primary} strokeWidth={1} strokeDasharray="4 3" opacity={0.4} />

                            {/* X axis labels */}
                            {[0, 4, 8, 12].map(w => (
                                <text key={w} x={getX(w)} y={chartHeight + 16} textAnchor="middle" fontSize={9} fill={theme.colors.secondary_text}>W{w}</text>
                            ))}
                        </svg>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center justify-center gap-4 mt-2 text-xs">
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-0.5 rounded" style={{ backgroundColor: theme.colors.primary }} />
                            <span style={{ color: theme.colors.secondary_text }}>Your projected weight</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-0.5 rounded border-t border-dashed" style={{ borderColor: theme.colors.primary }} />
                            <span style={{ color: theme.colors.secondary_text }}>Goal weight</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
};

// --- Recursive Renderer ---

interface RecursiveRendererProps {
    node: ComponentNode;
    data: TemplateData;
    theme: any;
}

const RecursiveRenderer: React.FC<RecursiveRendererProps> = ({ node, data, theme }) => {
    // 1. Identify Component
    const componentName = node.component || node.type;
    if (!componentName) return null;

    const Component = COMPONENT_REGISTRY[componentName];

    if (!Component) {
        console.warn(`Unknown component: ${componentName}`);
        return <div className="text-red-500 text-xs p-1 border border-red-300 rounded">Unknown: {componentName}</div>;
    }

    // 2. Resolve Props
    const resolvedProps = resolveProps(node.props, data);

    // 3. Render Children (Recursively)
    let children: React.ReactNode = null;
    if (node.children) {
        if (Array.isArray(node.children)) {
            // It's a list of nodes
            children = node.children.map((childNode, idx) => (
                <RecursiveRenderer key={idx} node={childNode} data={data} theme={theme} />
            ));
        } else if (typeof node.children === 'string') {
            // It's a data reference (e.g., "_footer_links")
            const resolvedChildrenData = resolveProp(node.children, data);
            
            // If the component expects the raw data as children (like LinksBox), pass it.
            // But standard React children usually expect Nodes. 
            // We pass it as 'children' prop to the component, letting the component handle array data if needed.
            children = resolvedChildrenData;
        }
    }

    // 4. Render
    return <Component {...resolvedProps} theme={theme}>{children}</Component>;
};

// --- Main Wrappers ---

interface PageWrapperProps {
    children: React.ReactNode;
    header?: boolean;
    footer?: boolean;
}

const PageWrapper: React.FC<PageWrapperProps> = ({ children, header, footer }) => {
    const { config } = useFunnel();
    
    // Header Logic
    let headerContent = null;
    if (header && config.layout.header) {
        // Find the template definition for the header
        const headerTemplateName = config.layout.header.template;
        const headerDef = config.templates[headerTemplateName];
        if (headerDef) {
            headerContent = <RecursiveRenderer node={headerDef} data={config.layout.header.template_data} theme={config.theme} />;
        }
    }

    // Footer Logic
    let footerContent = null;
    if (footer && config.layout.footer) {
        const footerTemplateName = config.layout.footer.template;
        const footerDef = config.templates[footerTemplateName];
        if (footerDef) {
            footerContent = <RecursiveRenderer node={footerDef} data={config.layout.footer.template_data} theme={config.theme} />;
        }
    }
    
    return (
        <div 
            className="flex flex-col min-h-full pb-8 relative transition-colors duration-300" 
            style={{ 
                background: config.theme.colors.background, 
                color: config.theme.colors.text,
                fontFamily: 'PT Sans, sans-serif'
            }}
        >
            {headerContent}
            <div className="flex-1 px-4 pt-4 w-full flex flex-col">
                {children}
            </div>
            {footerContent}
        </div>
    );
};

export const Renderer = ({ page }: { page: PageConfig }) => {
    const { config } = useFunnel();
    
    // 1. Get the Template Definition
    const templateDef = config.templates[page.template];

    if (!templateDef) {
         return (
          <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-xl m-4">
            <p className="text-gray-500 text-center px-4">
                Template <strong>{page.template}</strong> not found in configuration.
            </p>
          </div>
        );
    }

    // 2. Pass to Recursive Engine
    return (
        <PageWrapper header={page.header} footer={page.footer}>
            <RecursiveRenderer 
                node={templateDef} 
                data={page.template_data} 
                theme={config.theme} 
            />
        </PageWrapper>
    );
};