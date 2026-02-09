
import { FunnelConfig } from "./types";
import defaultConfig from "./default-config.json";

export const GOOGLE_FONTS = [
    "PT Sans",
    "Roboto",
    "Open Sans",
    "Lato",
    "Montserrat",
    "Oswald",
    "Raleway",
    "Merriweather",
    "Nunito",
    "Playfair Display",
    "Poppins",
    "Inter"
];

// Simplified for the generic builder based on the new structure
export type TemplateCategory = 'content' | 'interactive' | 'input';

export interface TemplateOption {
    label: string;
    value: string;
    icon: string;
    description: string;
    category: TemplateCategory;
    preview: string;
}

export const TEMPLATE_CATEGORIES: { value: TemplateCategory | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'content', label: 'Content' },
    { value: 'interactive', label: 'Interactive' },
    { value: 'input', label: 'Input' },
];

export const TEMPLATE_OPTIONS: TemplateOption[] = [
    { label: 'Hero Picker', value: 'pick_hero_template', icon: 'LayoutGrid', description: 'Grid of images with labels', category: 'content', preview: 'pick_hero' },
    { label: 'Image Button', value: 'image_button_template', icon: 'Image', description: 'Large image with fixed button', category: 'content', preview: 'image_button' },
    { label: 'Content + Image', value: 'image_content_button_template', icon: 'AlignLeft', description: 'Image, Title, Text, Button', category: 'content', preview: 'image_content_button' },
    { label: 'Bullet Points Hero', value: 'image_bullets_hero_template', icon: 'List', description: 'Image with bullet points', category: 'content', preview: 'image_bullets_hero' },
    { label: 'Multi Select', value: 'pick_multi_items_template', icon: 'ListChecks', description: 'Select multiple options', category: 'interactive', preview: 'pick_multi' },
    { label: 'Single Select', value: 'pick_single_item_template', icon: 'List', description: 'Select one option', category: 'interactive', preview: 'pick_single' },
    { label: 'Cloud Tags', value: 'pick_cloud_items_template', icon: 'Cloud', description: 'Cloud tag selection', category: 'interactive', preview: 'pick_cloud' },
    { label: 'Focus Area', value: 'focus_area_template', icon: 'Target', description: 'Body part selector', category: 'interactive', preview: 'focus_area' },
    { label: 'Height Input', value: 'height_input_template', icon: 'Ruler', description: 'Height with unit toggle', category: 'input', preview: 'height_input' },
    { label: 'Weight Input', value: 'weight_input_template', icon: 'Scale', description: 'Weight with unit toggle', category: 'input', preview: 'weight_input' },
    { label: 'Age Input', value: 'age_input_template', icon: 'Calendar', description: 'Numeric age input', category: 'input', preview: 'age_input' },
    { label: 'Email Input', value: 'email_input_template', icon: 'Mail', description: 'Email capture form', category: 'input', preview: 'email_input' },
];

// Default config loaded from default-config.json (99082)
// To change the default, replace default-config.json
export const INITIAL_CONFIG: FunnelConfig = defaultConfig as unknown as FunnelConfig;
