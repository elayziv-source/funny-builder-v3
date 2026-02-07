

export interface OptionItem {
  label: string;
  value: string;
  image?: string;
  emoji?: string;
  description?: string;
  highlighted?: boolean;
  event?: string;
}

export interface FocusAreaItem {
    img_url?: string;
    label: string;
    value: string;
}

export interface CarouselSlide {
    stars_rating_img_url: string;
    author: string;
    quote: string;
}

// The generic node structure for the JSON UI definition
export interface ComponentNode {
    type?: string; // Sometimes called 'type' in config
    component?: string; // Sometimes called 'component' in config
    props?: Record<string, any>;
    children?: ComponentNode[] | string; // Can be nested nodes or a data key string
}

export interface TemplateData {
  [key: string]: any;
}

export interface TrackingEvent {
    type: 'pixel' | 'custom' | 'datalayer';
    name: string;
    params?: Record<string, any>;
}

export interface PageConfig {
  name: string;
  path: string;
  template: string;
  template_data: TemplateData;
  meta?: {
    title: string;
    description: string;
    keywords?: string;
  };
  tracking_events?: TrackingEvent[];
  header?: boolean;
  footer?: boolean;
}

export interface ThemeColors {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    secondary_text: string;
    success: string;
    [key: string]: string;
}

export interface ThemeConfig {
    colors: ThemeColors;
    fonts: Record<string, string>;
    spacing: Record<string, string>;
    border_radius: Record<string, string>;
    width: Record<string, string>;
    border: Record<string, string>;
}

export interface LayoutConfig {
    header: {
        template: string;
        template_data: TemplateData;
    };
    footer: {
        template: string;
        template_data: TemplateData;
    };
}

export interface SplitTestConfig {
    experiment_id: string;
    metric: string;
    variations: {
        id: string;
        name: string;
        weight: number; // 0-100
        pages?: string[]; // assigned page IDs
    }[];
}

export interface FunnelConfig {
  id: number;
  name: string;
  funnel_id?: number;
  brand: string;
  version: number;
  // Templates are now ComponentNodes defining structure
  templates: Record<string, ComponentNode>;
  layout: LayoutConfig;
  pages: Record<string, PageConfig>;
  theme: ThemeConfig;
  event_routing: Record<string, any>;
  broadcast_targets?: Record<string, any>;
  split_test?: SplitTestConfig;
}

// Kept for legacy dropdown selection, though engine is dynamic now
export type TemplateType = string;

export type BlockType = 'title' | 'subtitle' | 'text' | 'image' | 'button' | 'options_single' | 'options_multi' | 'spacer';

export interface BlockItem {
    id: string;
    type: BlockType;
    content?: string;
    src?: string;
    options?: OptionItem[];
}
