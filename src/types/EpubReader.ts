export interface HighlightNote {
  id: string;
  cfiRange: string;
  note?: string;
  color?: string;
}

export interface EpubReaderWrapperProps {
  fileUrl: string;
  bookId: string;
  location?: string | number | null;
  onLocationChange?: (loc: string) => void;
  fontSize?: number;
  fontFamily?: string;
  background?: string;
  scrollMode?: boolean;
  viewMode?: "single" | "double";
  onReady?: (rendition: any, toc: { label: string; href: string }[], notes: HighlightNote[]) => void;
  onNotesLoaded?: (notes: HighlightNote[]) => void;
}
