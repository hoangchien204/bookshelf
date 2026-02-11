import type { Rendition } from "epubjs";


export interface HighlightNote {
  id: string;
  cfiRange: string;
  note?: string;
  color?: string;
}
 export interface EpubReaderPCProps extends EpubReaderWrapperProps{
  bookData: ArrayBuffer | null;
  error: string | null;
  setRendition: (rend: any) => void;
  // state + handler cho modal
  showModal: boolean;
  resetModal: () => void;
  editingNote: HighlightNote | null;
  setEditingNote: (n: HighlightNote | null) => void;
  setTempCFI: (cfi: string) => void;
  setTempColor: (color: string) => void;
  setShowModal: (b: boolean) => void;

  rendition: Rendition | null;
  handleUpdateNote: (id: string, color?: string, note?: string) => void;
  handleAddNote: (color: string, note?: string) => void;
  onDeleteNote?: (id: string) => void;
  tempColor: string;
  showTextbox: boolean;
  setShowTextbox: (b: boolean) => void;
  tempNote: string;
  setTempNote: (v: string) => void;
  charCount: number;

  customStyles: any;
  setupRendition: (
    rend: any,
    onReady?: (rend: any, toc: { label: string; href: string }[], notes: any[]) => void,
    openEditModal?: (cfiRange: string, contents: any) => void
  ) => void;
  isGuest: boolean;
}

export interface EpubReaderMobileProps {
  bookData: ArrayBuffer | null;
  error: string | null;

  location?: string | number | null;
  onLocationChange?: (loc: string) => void;

  setRendition: (rend: any) => void;
  customStyles: any;

  setupRendition: (
    rend: any,
    onReady?: (
      rend: any,
      toc: { label: string; href: string }[],
      notes: HighlightNote[]
    ) => void
  ) => void;

  onReady?: (
    rendition: any,
    toc: { label: string; href: string }[],
    notes: HighlightNote[]
  ) => void;

  onNotesLoaded?: (notes: HighlightNote[]) => void;
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
