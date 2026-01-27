export enum TemplateStyle {
  MINIMAL_TYPOGRAPHY = 'MINIMAL_TYPOGRAPHY',
  BOLD_TEXT_OVERLAY = 'BOLD_TEXT_OVERLAY',
  BOTTOM_TEXT_IMAGE = 'BOTTOM_TEXT_IMAGE',  
}

export interface GeneratedContent {
  postText: string;
  headline: string;
  subHeadline: string; 
}

export interface TypographySettings {
  fontSize: number;      // in px (or rem base)
  lineHeight: number;    // unitless multiplier
  letterSpacing: number; // in em
  textAlign: 'left' | 'center' | 'right';
  fontFamily: string;
  isItalic: boolean;
  isUnderline: boolean;
  color: string;
  position: { x: number; y: number };
  fontWeight?: number;
}

export interface VisualState {
  headline: string;
  subHeadline: string;
  authorName: string;
  authorHandle: string;
  backgroundImage: string | null;
  backgroundColor?: string | null;
  authorImage: string | null;
  logoImage: string | null; 
  // Image Manipulation
  imageScale: number;
  imagePosition: { x: number; y: number };
  // Text Manipulation
  headlineSettings: TypographySettings;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  postText: string;
  visualData: VisualState;
  template: TemplateStyle;
}