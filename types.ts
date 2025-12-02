
export enum Section {
  HERO = 'HERO',
  PORTFOLIO = 'PORTFOLIO',
  DATA = 'DATA',
  ARCHITECT = 'ARCHITECT'
}

export interface ThumbnailSpec {
  title: string;
  primaryEmotion: string;
  colorPalette: string[];
  composition: string;
  ctrEstimate: number;
  foregroundElement: string;
  backgroundElement: string;
}

export interface PortfolioItem {
  id: string;
  imageUrl: string;
  views: number;
  title: string;
  rotation: number;
  x: number;
  y: number;
}

export interface DataPoint {
  name: string;
  value: number;
  color: string;
}

// CMS Data Structure
export interface Project {
  id: string | number;
  title: string;
  category: string;
  img: string; // URL resolved from Sanity
  views?: string;
  ctr?: string;
  youtubeUrl?: string;
}