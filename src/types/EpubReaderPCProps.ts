import type { EpubReaderWrapperProps, HighlightNote } from "./EpubReader";

export interface EpubReaderPCProps extends EpubReaderWrapperProps {
  bookData: ArrayBuffer | null;
  error: string | null;
  setRendition: (rend: any) => void;

  // Modal state
  showModal: boolean;
  resetModal: () => void;
  editingNote: HighlightNote | null;
  setEditingNote: (n: HighlightNote | null) => void;
  setTempCFI: (cfi: string) => void;
  setTempNote: (txt: string) => void;
  setTempColor: (color: string) => void;
  setShowModal: (b: boolean) => void;

  // highlight handler
  rendition: any;
  handleUpdateNote: (id: string, color?: string, note?: string) => void;
  handleAddNote: (color: string, note?: string) => void;

  // UI state
  tempColor: string;
  showTextbox: boolean;
  setShowTextbox: (b: boolean) => void;
  tempNote: string;
  charCount: number;

  customStyles: any;
  setupRendition: (
    rend: any,
    onReady?: (
      rend: any,
      toc: { label: string; href: string }[],
      notes: HighlightNote[]
    ) => void,
    openEditModal?: (cfiRange: string, contents: any) => void
  ) => void;
}
