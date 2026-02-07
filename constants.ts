
import { FunnelConfig } from "./types";

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

export const INITIAL_CONFIG: FunnelConfig = {
    "id": 1,
    "name": "Go-Slim Weight Loss Funnel",
    "funnel_id": 1,
    "brand": "go-slim",
    "version": 99058,
    "templates": {
        "header": {
            "type": "Box",
            "props": {
                "fixed": true,
                "gap": "sm"
            },
            "children": [{
                "component": "ImageBox",
                "props": {
                    "src": "_logo_src",
                    "alt": "_logo_alt",
                    "width": "_logo_width"
                }
            },
            {
                "component": "PageProgressBar",
                "props": {
                }
            },
            {
                "component": "Divider",
                "props": {
                }
            }
        ]
        },
        "footer": {
            "type": "Box",
            "props": {},
            "children": [
                {
                    "component": "LinksBox",
                    "props": {
                        "children": "_footer_links"
                    }
                }
            ]
        },
        "image_bullets_hero_template": {
            "component": "Page",
            "props": {
                "width": "narrow_page"
            },
            "children": [
                {
                    "component": "ImageBox",
                    "props": {
                        "src": "_image_src",
                        "alt": "_image_alt",
                        "width": "_image_width",
                        "padding": "sm"
                    }
                },
                {
                    "component": "Gap",
                    "props": {
                        "gap": "sm"
                    }
                },
                {
                    "component": "Text",
                    "props": {
                        "text": "_title_text",
                        "font": "title",
                        "element": "h1"
                    }
                },
                {
                    "component": "Gap",
                    "props": {
                        "gap": "xs"
                    }
                },
                {
                    "component": "Text",
                    "props": {
                        "text": "_sub_title_text",
                        "font": "sub_title"
                    }
                },
                {
                    "component": "Gap",
                    "props": {
                        "gap": "sm"
                    }
                },
                {
                    "component": "Text",
                    "props": {
                        "html": "_bullets_html",
                        "font": "sub_title",
                        "text_align": "left",
                        "width": "full"
                    }
                },
                {
                    "component": "Gap",
                    "props": {
                        "gap": "md"
                    }
                },
                {
                    "component": "Text",
                    "props": {
                        "text": "_cta_text",
                        "font": "label"
                    }
                },
                {
                    "component": "Gap",
                    "props": {
                        "gap": "sm"
                    }
                },
                {
                    "component": "ItemPicker",
                    "props": {
                        "items": "_options",
                        "on_select": "_on_select",
                        "direction": "row"
                    }
                }
            ]
        },
        "pick_hero_template": {
            "component": "Page",
            "children": [
                {
                    "component": "Text",
                    "props": {
                        "text": "_title_text",
                        "font": "title",
                        "element": "h1"
                    }
                },
                {
                    "component": "Text",
                    "props": {
                        "text": "_sub_title_text",
                        "font": "sub_title"
                    }
                },
                {
                    "component": "Gap",
                    "props": {
                        "gap": "md"
                    }
                },
                {
                    "component": "ItemPicker",
                    "props": {
                        "items": "_options",
                        "on_select": "_on_select",
                        "direction": "row"
                    }
                }
            ]
        },
        "image_button_template": {
            "type": "Page",
            "props": {
                "width": "narrow_page"
            },
            "children": [
                {
                    "component": "Text",
                    "props": {
                        "text": "_title_text",
                        "font": "title",
                        "element": "h1"
                    }
                },
                {
                    "component": "Text",
                    "props": {
                        "text": "_sub_title_text",
                        "font": "sub_title"
                    }
                },
                {
                    "component": "Gap",
                    "props": {
                        "gap": "md"
                    }
                },
                {
                    "component": "ImageBox",
                    "props": {
                        "src": "_image_src",
                        "alt": "_image_alt",
                        "width": "image_max"
                    }
                },
                {
                    "component": "Gap",
                    "props": {
                        "gap": "lg"
                    }
                },
                {
                    "component": "Button",
                    "props": {
                        "text": "_button_text",
                        "on_click": "_on_button_click",
                        "width": "full",
                        "fixed": true
                    }
                }
            ]
        },
        "image_content_button_template": {
            "type": "Page",
            "props": {
                "width": "narrow_page"
            },
            "children": [
                {
                    "component": "ImageBox",
                    "props": {
                        "src": "_image_src",
                        "alt": "_image_alt",
                        "width": "_image_width",
                        "max_width": "_image_max_width",
                        "padding": "md"
                    }
                },
                {
                    "component": "Text",
                    "props": {
                        "text": "_title_text",
                        "font": "small_title",
                        "element": "h1",
                        "width": "image_max"
                    }
                },
                {
                    "component": "Gap",
                    "props": {
                        "gap": "sm"
                    }
                },
                {
                    "component": "Text",
                    "props": {
                        "text": "_sub_title_text",
                        "font": "sub_title",
                        "width": "image_max"
                    }
                },
                {
                    "component": "Button",
                    "props": {
                        "text": "_button_text",
                        "on_click": "_on_button_click",
                        "width": "full",
                        "fixed": true
                    }
                }
            ]
        },
        "pick_multi_items_template": {
            "component": "Page",
            "props": {
                "width": "narrow_page"
            },
            "children": [
                {
                    "component": "Text",
                    "props": {
                        "text": "_title_text",
                        "font": "small_title",
                        "element": "h1"
                    }
                },
                {
                    "component": "Text",
                    "props": {
                        "text": "_sub_title_text",
                        "font": "sub_title"
                    }
                },
                {
                    "component": "Gap",
                    "props": {
                        "gap": "md"
                    }
                },
                {
                    "component": "ItemPicker",
                    "props": {
                        "mode": "multi",
                        "item_flavor": "card",
                        "items": "_options",
                        "on_select": "_on_select",
                        "answer_key": "_answer_key",
                        "object_fit": "_object_fit"
                    }
                },
                {
                    "component": "Gap",
                    "props": {
                        "gap": "xl"
                    }
                },
                {
                    "component": "Button",
                    "props": {
                        "text": "_button_text",
                        "on_click": "_on_button_click",
                        "width": "full",
                        "fixed": true,
                        "disabled": "_button_disabled",
                        "answer_key": "_answer_key"
                    }
                }
            ]
        },
        "pick_single_item_template": {
            "component": "Page",
            "props": {
                "width": "narrow_page"
            },
            "children": [
                {
                    "component": "Text",
                    "props": {
                        "text": "_title_text",
                        "font": "small_title",
                        "element": "h1"
                    }
                },
                {
                    "component": "Text",
                    "props": {
                        "text": "_sub_title_text",
                        "font": "sub_title",
                        "width": "image_max"
                    }
                },
                {
                    "component": "Gap",
                    "props": {
                        "gap": "md"
                    }
                },
                {
                    "component": "ItemPicker",
                    "props": {
                        "mode": "single",
                        "item_flavor": "card",
                        "items": "_options",
                        "on_select": "_on_select",
                        "answer_key": "_answer_key",
                        "object_fit": "_object_fit"
                    }
                }
            ]
        },
        "focus_area_template": {
            "component": "Page",
            "children": [
                {
                    "component": "Text",
                    "props": {
                        "text": "_title_text",
                        "font": "small_title",
                        "element": "h1"
                    }
                },
                {
                    "component": "Gap",
                    "props": {
                        "gap": "sm"
                    }
                },
                {
                    "component": "FocusAreas",
                    "props": {
                        "canvas": "_canvas",
                        "areas": "_areas",
                        "answer_key": "_answer_key",
                        "on_select": "_on_select"
                    }
                },
                {
                    "component": "Gap",
                    "props": {
                        "gap": "sm"
                    }
                },
                {
                    "component": "Button",
                    "props": {
                        "text": "_button_text",
                        "on_click": "_on_button_click",
                        "fixed": true,
                        "width": "full",
                        "disabled": "_button_disabled",
                        "answer_key": "_answer_key"
                    }
                }
            ]
        },
        "pick_cloud_items_template": {
            "component": "Page",
            "props": {
                "width": "narrow_page"
            },
            "children": [
                {
                    "component": "Text",
                    "props": {
                        "text": "_title_text",
                        "font": "small_title",
                        "element": "h1"
                    }
                },
                {
                    "component": "Gap",
                    "props": {
                        "gap": "lg"
                    }
                },
                {
                    "component": "ItemPicker",
                    "props": {
                        "mode": "multi",
                        "direction": "row",
                        "item_flavor": "cloud",
                        "items": "_options",
                        "on_select": "_on_select",
                        "answer_key": "_answer_key"
                    }
                },
                {
                    "component": "Gap",
                    "props": {
                        "gap": "xl"
                    }
                },
                {
                    "component": "Button",
                    "props": {
                        "text": "_button_text",
                        "on_click": "_on_button_click",
                        "width": "full",
                        "fixed": true,
                        "disabled": "_button_disabled",
                        "answer_key": "_answer_key"
                    }
                }
            ]
        },
        "height_input_template": {
            "component": "Page",
            "props": {
                "width": "narrow_page"
            },
            "children": [
                {
                    "component": "Text",
                    "props": {
                        "text": "_title_text",
                        "font": "small_title",
                        "element": "h1"
                    }
                },
                {
                    "component": "Gap",
                    "props": {
                        "gap": "md"
                    }
                },
                {
                    "component": "UnitToggle",
                    "props": {
                        "items": "_unit_options",
                        "answer_key": "_unit_answer_key",
                        "on_toggle": "_on_unit_toggle"
                    }
                },
                {
                    "component": "LengthInput",
                    "props": {
                        "answer_key": "_height_answer_key",
                        "unit_answer_key": "_unit_answer_key",
                        "on_input": "_on_height_input",
                    }
                },
                {
                    "component": "Gap",
                    "props": {
                        "gap": "sm"
                    }
                },
                {
                    "component": "NotificationCard",
                    "props": {
                        "role": "info",
                        "icon": "_notification_icon",
                        "title_text": "_notification_title_text",
                        "body_text": "_notification_body_text"
                    }
                },
                {
                    "component": "Gap",
                    "props": {
                        "gap": "sm"
                    }
                },
                {
                    "component": "Button",
                    "props": {
                        "text": "_button_text",
                        "on_click": "_on_button_click",
                        "width": "full"
                    }
                }
            ]
        },
        "weight_input_template": {
            "component": "Page",
            "props": {
                "width": "narrow_page"
            },
            "children": [
                {
                    "component": "Text",
                    "props": {
                        "text": "_title_text",
                        "font": "small_title",
                        "element": "h1"
                    }
                },
                {
                    "component": "Gap",
                    "props": {
                        "gap": "md"
                    }
                },
                {
                    "component": "UnitToggle",
                    "props": {
                        "items": "_unit_options",
                        "answer_key": "_unit_answer_key",
                        "on_toggle": "_on_unit_toggle"
                    }
                },
                {
                    "component": "WeightInput",
                    "props": {
                        "answer_key": "_weight_answer_key",
                        "unit_answer_key": "_unit_answer_key",
                        "on_input": "_on_weight_input",
                    }
                },
                {
                    "component": "Gap",
                    "props": {
                        "gap": "sm"
                    }
                },
                {
                    "component": "BmiNotification",
                    "props": {
                        "height_answer_key": "_bmi_notification_height_answer_key",
                        "weight_answer_key": "_bmi_notification_weight_answer_key",
                        "normal": "_bmi_notification_normal",
                        "underweight": "_bmi_notification_underweight",
                        "overweight": "_bmi_notification_overweight",
                        "obese": "_bmi_notification_obese"
                    }
                },
                {
                    "component": "Gap",
                    "props": {
                        "gap": "sm"
                    }
                },
                {
                    "component": "Button",
                    "props": {
                        "text": "_button_text",
                        "on_click": "_on_button_click",
                        "width": "full"
                    }
                }
            ]
        },
        "age_input_template": {
            "component": "Page",
            "props": {
                "width": "narrow_page"
            },
            "children": [
                {
                    "component": "Text",
                    "props": {
                        "text": "_title_text",
                        "font": "small_title",
                        "element": "h1"
                    }
                },
                {
                    "component": "Gap",
                    "props": {
                        "gap": "md"
                    }
                },
                {
                    "component": "NumericInput",
                    "props": {
                        "answer_key": "_age_answer_key",
                        "on_input": "_on_age_input"
                    }
                },
                {
                    "component": "Gap",
                    "props": {
                        "gap": "md"
                    }
                },
                {
                    "component": "NotificationCard",
                    "props": {
                        "role": "info",
                        "icon": "_notification_icon",
                        "title_text": "_notification_title_text",
                        "body_text": "_notification_body_text"
                    }
                },
                {
                    "component": "Gap",
                    "props": {
                        "gap": "sm"
                    }
                },
                {
                    "component": "Button",
                    "props": {
                        "text": "_button_text",
                        "on_click": "_on_button_click",
                        "width": "full"
                    }
                }
            ]
        },
        "email_input_template": {
            "component": "Page",
            "props": {
                "width": "narrow_page"
            },
            "children": [
                {
                    "component": "Text",
                    "props": {
                        "html": "_title_html",
                        "font": "small_title",
                        "width": "full"
                    }
                },
                {
                    "component": "Gap",
                    "props": {
                        "gap": "sm"
                    }
                },
                {
                    "component": "TextInput",
                    "props": {
                        "answer_key": "_email_answer_key",
                        "on_input": "_on_email_input",
                        "placeholder": "_input_placeholder",
                        "flavor": "email"

                    }
                },
                {
                    "component": "Gap",
                    "props": {
                        "gap": "md"
                    }
                },
                {
                    "component": "Text",
                    "props": {
                        "text": "_banner_text",
                        "font": "banner",
                        "width": "full",
                        "background": "success",
                        "padding": "md"
                    }
                },
                {
                    "component": "Gap",
                    "props": {
                        "gap": "md"
                    }
                },
                {
                    "component": "Text",
                    "props": {
                        "html": "_html",
                        "font": "secondary_text",
                        "width": "full",
                        "color": "secondary_text"
                    }
                },
                {
                    "component": "Gap",
                    "props": {
                        "gap": "lg"
                    }
                },
                {
                    "component": "Button",
                    "props": {
                        "text": "_button_text",
                        "on_click": "_on_button_click",
                        "width": "full"
                    }
                }
            ]
        }
    },
    "layout": {
        "header": {
            "template": "header",
            "template_data": {
                "_logo_src": "https://d1kk7xfge5vfmh.cloudfront.net/go-slim/large-icon.avif",
                "_logo_alt": "Go-Slim Logo",
                "_logo_width": "logo"
            }
        },
        "footer": {
            "template": "footer",
            "template_data": {
                "_footer_links": [
                    {
                        "href": "https://product.go-slim.co/privacy-policy1746620637117",
                        "text": "Privacy Policy"
                    },
                    {
                        "href": "http://product.go-slim.co/terms-and-conditionsgwkygq6l",
                        "text": "Terms & Conditions"
                    },
                    {
                        "href": "https://product.go-slim.co/contact-us1746620654142",
                        "text": "Contact Us"
                    },
                    {
                        "href": "https://product.go-slim.co/our-story1746620628008",
                        "text": "About Us"
                    }
                ]
            }
        }
    },
    "pages": {
        "gender-selection": {
            "name": "Gender Selection",
            "path": "1",
            "template": "image_bullets_hero_template",
            "template_data": {
                "_image_src": "https://d1kk7xfge5vfmh.cloudfront.net/go-slim/p3.jpg",
                "_image_alt": "Woman ready for indoor walking journey",
                "_image_width": "image_max",
                "_title_text": "Stay active and independent longer",
                "_sub_title_text": "The indoor walking method designed for your body",
                "_bullets_html": "<p style='margin: 6px 0;'>✅ Improve balance and stability</p><p style='margin: 6px 0;'>✅ Support healthy weight at any age</p><p style='margin: 6px 0;'>✅ Exercise safely from home</p>",
                "_cta_text": "Select your plan type:",
                "_options": [
                    {
                        "label": "Female",
                        "value": "female",
                        "emoji": "👩"
                    },
                    {
                        "label": "Male",
                        "value": "male",
                        "emoji": "👨"
                    }
                ],
                "_on_select": "gender_selected"
            },
            "meta": {
                "title": "Go-Slim - Stay Active and Independent Longer",
                "description": "The indoor walking method designed for your body"
            },
            "header": true,
            "footer": true
        },
        "age-selection": {
            "name": "Age Group Selection",
            "path": "2",
            "template": "pick_hero_template",
            "template_data": {
                "_title_text": "Restorative Indoor Walking Method™ to Lose Weight",
                "_sub_title_text": "According to your age",
                "_options": [
                    {
                        "label": "25-34",
                        "value": "25-34",
                        "image": "https://d1kk7xfge5vfmh.cloudfront.net/go-slim/25-34.png"
                    },
                    {
                        "label": "35-44",
                        "value": "35-44",
                        "image": "https://d1kk7xfge5vfmh.cloudfront.net/go-slim/35-44.png"
                    },
                    {
                        "label": "45-54",
                        "value": "45-54",
                        "image": "https://d1kk7xfge5vfmh.cloudfront.net/go-slim/45-54.png"
                    },
                    {
                        "label": "55+",
                        "value": "55+",
                        "image": "https://d1kk7xfge5vfmh.cloudfront.net/go-slim/55%2B.png"
                    }
                ],
                "_on_select": "age_selected"
            },
            "meta": {
                "title": "Go-Slim - Walk Indoors to Lose Weight",
                "description": "Choose your age group to get personalized weight loss recommendations"
            },
            "header": true,
            "footer": true
        },
        "social-proof": {
            "name": "3 Million Users Trust Us",
            "path": "3",
            "template": "image_button_template",
            "template_data": {
                "_title_text": "3 Million",
                "_sub_title_text": "users have chosen to walk with us",
                "_image_src": "https://d1kk7xfge5vfmh.cloudfront.net/go-slim/p2-44up.png",
                "_image_alt": "3 women walk dressed in sprot fit",
                "_button_text": "CONTINUE",
                "_on_button_click": "social_proof_seen"
            },
            "meta": {
                "title": "Go-Slim - 18 Million Users",
                "description": "18 million users have chosen to walk with Go-Slim"
            },
            "header": true
        },
        "welcome-journey": {
            "name": "Welcome to Your Walking Journey",
            "path": "4",
            "template": "image_content_button_template",
            "template_data": {
                "_image_src": "https://d1kk7xfge5vfmh.cloudfront.net/go-slim/p3.jpg",
                "_image_alt": "Woman in workout attire ready for walking journey",
                "_title_text": "Welcome to your Restorative Indoor Walking journey!",
                "_sub_title_text": "Welcome to Go-Slim! Discover the Restorative Indoor Walking Method™ - a gentle, mindful approach to walking that helps improve balance, reduce stress, and support steady weight loss progress at home. No equipment needed.",
                "_button_text": "CONTINUE",
                "_on_button_click": "welcome_journey_seen"
            },
            "meta": {
                "title": "Go-Slim - Welcome to your Restorative Indoor Walking journey",
                "description": "Welcome to Go-Slim! Let's tailor your walking journey to meet your goals and needs."
            },
            "header": true
        }
    },
    "theme": {
        "colors": {
            "primary": "#f51721",
            "secondary": "#6c757d",
            "background": "#f7f6f4",
            "text": "#0A0908",
            "secondary_text": "#bababb",
            "success": "#afebc1"
        },
        "fonts": {
            "title": "900 1.8rem/2.5rem 'PT Sans'",
            "small_title": "900 24px/32px 'PT Sans'",
            "sub_title": "400 16px/24px 'PT Sans'",
            "label": "600 16px/20px 'PT Sans'",
            "body": "600 16px/20px 'PT Sans'",
            "link": "600 16px/20px 'PT Sans'",
            "button": "600 16px/20px 'PT Sans'",
            "big_value": "900 36px/48px 'PT Sans'",
            "error": "500 0.875rem 'PT Sans'",
            "card_title": "700 12px/14px 'PT Sans'",
            "card_body": "500 10px/16px 'PT Sans'",
            "banner": "700 16px/24px 'PT Sans'",
            "secondary_text": "400 11px/16px 'PT Sans'"
        },
        "spacing": {
            "xs": "0.25rem",
            "sm": "0.5rem",
            "md": "1rem",
            "lg": "2rem",
            "xl": "4rem",
            "xxl": "8rem"
        },
        "border_radius": {
            "xs": "0.25rem",
            "sm": "0.5rem",
            "md": "1rem",
            "lg": "2rem",
            "xl": "4rem"
        },
        "width": {
            "hero": "190px",
            "logo": "108px",
            "main_image": "40%",
            "secondary_image": "60%",
            "auto": "auto",
            "full": "100%",
            "image_max": "315px",
            "narrow_page": "420px",
            "padded_page": "350px",
            "sm": "420px",
            "one_half": "50%",
            "one_third": "33.33%",
            "two_thirds": "66.66%",
            "header_height": "68px"
        },
        "border": {
            "sm": "2px solid #eaeaeb",
            "md": "3px solid #eaeaeb",
            "lg": "6px solid #eaeaeb",
            "selected_sm": "1px solid #f51721"
        }
    },
    "broadcast_targets": {
        "facebook": { "pixel_id": "511912758524675", "test_id": "TEST13351" }
    },
    "event_routing": {},
    "split_test": { 
        "experiment_id": "EXP_001", 
        "metric": "conversion_rate",
        "variations": [
            { "id": "control", "name": "Control", "weight": 100 }
        ]
    }
};
