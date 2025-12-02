
import { Project } from '../types';

// --- FALLBACK DATA (Safety Net) ---
// These load instantly if Airtable is not configured or fails.
const FALLBACK_PROJECTS: Project[] = [
  { id: 1, img: 'https://img.youtube.com/vi/028_j59f8tM/maxresdefault.jpg', title: "World's Deadliest Escape Room", views: "142M", ctr: "14.2%", category: "IRL", youtubeUrl: "https://www.youtube.com/watch?v=028_j59f8tM" },
  { id: 2, img: 'https://img.youtube.com/vi/ixxI3I_8dAc/maxresdefault.jpg', title: "Sidemen Tinder In Real Life", views: "89M", ctr: "11.8%", category: "IRL", youtubeUrl: "https://www.youtube.com/watch?v=ixxI3I_8dAc" },
  { id: 3, img: 'https://img.youtube.com/vi/glW9Yj-W-gE/maxresdefault.jpg', title: "I Survived 50 Hours In Antarctica", views: "67M", ctr: "13.5%", category: "IRL", youtubeUrl: "https://www.youtube.com/watch?v=glW9Yj-W-gE" },
  { id: 4, img: 'https://img.youtube.com/vi/p37_Ox1U7r0/maxresdefault.jpg', title: "Glitter Bomb 5.0 vs Porch Pirates", views: "55M", ctr: "16.1%", category: "Discovery", youtubeUrl: "https://www.youtube.com/watch?v=p37_Ox1U7r0" },
  { id: 5, img: 'https://img.youtube.com/vi/vKjF8I_8b6E/maxresdefault.jpg', title: "Can You Swim in Shade Balls?", views: "88M", ctr: "14.9%", category: "Discovery", youtubeUrl: "https://www.youtube.com/watch?v=vKjF8I_8b6E" },
  { id: 6, img: 'https://img.youtube.com/vi/cNjIYtsbXms/maxresdefault.jpg', title: "World's Whitest Paint", views: "12M", ctr: "12.4%", category: "Discovery", youtubeUrl: "https://www.youtube.com/watch?v=cNjIYtsbXms" },
  { id: 7, img: 'https://img.youtube.com/vi/2SjF8x1vK7E/maxresdefault.jpg', title: "I Sneaked Into The Super Bowl", views: "23M", ctr: "9.4%", category: "Sports", youtubeUrl: "https://www.youtube.com/watch?v=2SjF8x1vK7E" },
];

// --- AIRTABLE CONFIG ---
const API_TOKEN = "patkOxzv5SnX7uC9g.3a38931e9e875f37dec539ef2587e07a5586e5b58addd22b3a750c96225e9aa7";
const BASE_ID = "appbX8eIpzh5HJHpM";
const TABLE_NAME = "Thumbnails"; 

export const portfolioService = {
  async getProjects(): Promise<Project[]> {
    try {
      // Filter records where "Portfolio" checkbox is checked
      // Airtable checkboxes are evaluated as TRUE() or 1 if checked
      const filterFormula = encodeURIComponent("{Portfolio}");
      // Sort by Delivery date descending
      const sortField = encodeURIComponent("Delivery date");
      
      const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE_NAME)}?filterByFormula=${filterFormula}&sort%5B0%5D%5Bfield%5D=${sortField}&sort%5B0%5D%5Bdirection%5D=desc`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${API_TOKEN}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Airtable Error:', response.status, errorText);
        throw new Error(`Failed to fetch portfolio: ${response.statusText}`);
      }

      const data = await response.json();

      return data.records.map((record: any) => {
        // Handle Airtable Lookup fields which return arrays (e.g. ["Bodycam"])
        const rawNiche = record.fields['Niche'];
        const category = Array.isArray(rawNiche) ? rawNiche[0] : (rawNiche || 'Uncategorized');

        return {
          id: record.id,
          title: record.fields['Title'] || 'Untitled',
          category: category,
          // Map "Final Thumbnail" (primary) or "Final thumbnail" (legacy/typo catch) to img
          img: record.fields['Final Thumbnail']?.[0]?.url || record.fields['Final thumbnail']?.[0]?.url || '', 
          views: record.fields['Views'] ? String(record.fields['Views']) : undefined,
          youtubeUrl: record.fields['YoutubeURL'] || '#',
          ctr: record.fields['CTR'] ? String(record.fields['CTR']) : undefined 
        };
      }).filter((p: Project) => p.img); // Ensure we only show projects with images

    } catch (error) {
      console.warn("Using fallback data due to API error:", error);
      return FALLBACK_PROJECTS;
    }
  },

  async getScatterPhotos(): Promise<{ img: string; youtubeUrl: string }[]> {
    try {
      // Filter records where "Scatter" checkbox is checked
      const filterFormula = encodeURIComponent("{Scatter}");
      const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE_NAME)}?filterByFormula=${filterFormula}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${API_TOKEN}`
        }
      });

      if (!response.ok) {
         throw new Error(`Failed to fetch scatter: ${response.statusText}`);
      }

      const data = await response.json();

      return data.records.map((record: any) => ({
        img: record.fields['Final Thumbnail']?.[0]?.url || record.fields['Final thumbnail']?.[0]?.url || '',
        youtubeUrl: record.fields['YoutubeURL'] || '#'
      })).filter((item: any) => item.img); // Ensure we only return items with images

    } catch (error) {
      console.error("Error loading scatter photos:", error);
      return [];
    }
  }
};
