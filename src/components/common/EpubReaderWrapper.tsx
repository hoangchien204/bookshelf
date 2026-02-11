import { ReactReaderStyle, type IReactReaderStyle } from "react-reader";
import { useState, useEffect } from "react";
import api from "../../types/api";
import API from "../../services/APIURL";
import type { EpubReaderWrapperProps } from "../../types/EpubReader";
import EpubReaderPC from "./EpubReaderPC";
import EpubReaderMobile from "./EpubReaderMobi";
import { useAuth } from "../user/AuthContext";
import type { Rendition } from "epubjs";

export interface HighlightNote {
  id: string;
  cfiRange: string;
  note?: string;
  color?: string;
}

export default function CustomEpubReader({
  fileUrl,
  bookId,
  location,
  onLocationChange,
  fontSize = 16,
  fontFamily = "Mặc định",
  background = "#ffffff",
  scrollMode,
  viewMode,
  onReady,
  onNotesLoaded,
}: EpubReaderWrapperProps) {
  const [error] = useState<string | null>(null);
  const [rendition, setRendition] = useState<any>(null);
  const isMobile = window.innerWidth < 1024;

  const { user } = useAuth();
  const isGuest = !user;

  // Highlight + note
  const [notes, setNotes] = useState<HighlightNote[]>([]);
  const [editingNote, setEditingNote] = useState<HighlightNote | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [tempCFI, setTempCFI] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState("");
  const [tempColor, setTempColor] = useState("");
  const [charCount, setCharCount] = useState(0);
  const [showTextbox, setShowTextbox] = useState(false);

  const resetModal = () => {
    setShowModal(false);
    setTempCFI(null);
    setTempNote("");
    setTempColor("");
    setEditingNote(null);
  };

  // Load EPUB file
  const loadHighlights = async () => {
    if (!bookId) return;
    try {
      const res = await api.get(`${API.highlights}/${bookId}`);
      const highlights = Array.isArray(res.data) ? res.data : res.data.data;
      setNotes(highlights || []);
      onNotesLoaded?.(highlights || []);
    } catch (err) {
      console.error("❌ Load highlights error:", err);
    }
  };
  useEffect(() => {
    loadHighlights();
  }, [bookId]);

  useEffect(() => {
    if (!rendition) return;
    const fixTop = () => {
      const containers = document.querySelectorAll(".epub-container");
      containers.forEach((c) => {
        (c as HTMLElement).style.top = "-54px";
      });
    };
    // Gọi ngay lập tức
    fixTop();
    // Gọi khi resize hoặc relocate
    rendition.on("relocated", fixTop);
    rendition.on("resized", fixTop);
    return () => {
      rendition.off("relocated", fixTop);
      rendition.off("resized", fixTop);
    };
  }, [rendition]);

  useEffect(() => {
    if (rendition) {
      rendition.themes.register("custom", {
        body: {
          background: background,
          color: background === "#000000" ? "white" : "black",
          "line-height": "1.6",
          "padding-top": "0px !important", // Force fix padding
        },
      });
      rendition.themes.select("custom");
      if (fontSize) rendition.themes.fontSize(`${fontSize}px`);

      if (fontFamily && fontFamily !== "Mặc định") {
        rendition.themes.font(fontFamily);
      } else {
        rendition.themes.font("inherit");
      }
    }
  }, [rendition, fontSize, fontFamily, background]);

  // Render Highlights
  useEffect(() => {
    if (!rendition) return;
    // Xóa highlight cũ để tránh trùng lặp khi re-render
    try {
      rendition.annotations.removeAll?.(); // Dùng try-catch vì đôi khi method chưa sẵn sàng
    } catch (e) {}

    notes.forEach((n) => {
      if (!n.cfiRange) return;
      try {
        rendition.annotations.add(
          "highlight",
          n.cfiRange,
          { note: n.note },
          (_e: any) => {
            openEditModal(n);
          },
          `hl-${n.id}`,
          {
            fill: n.color || "#d5b8ff",
            "fill-opacity": "0.5",
            "mix-blend-mode": "multiply",
          },
        );
      } catch (e) {
        console.warn("Skipped invalid range", n.cfiRange);
      }
    });
  }, [rendition, notes]);

  // Handle Scroll/View Mode
  useEffect(() => {
    if (rendition) {
      try {
        rendition.flow(scrollMode ? "scrolled-doc" : "paginated");
        rendition.spread(viewMode === "double" ? "always" : "none");
      } catch (e) {
        console.error("Error setting flow/spread", e);
      }
    }
  }, [rendition, scrollMode, viewMode]);

  useEffect(() => {
    setCharCount(tempNote.length);
  }, [tempNote]);

  const handleAddNote = async (color: string, note?: string) => {
    if (!tempCFI) return;
    const finalColor = color || "#d5b8ff";
    try {
      const res = await api.post(API.highlights, {
        bookId,
        cfiRange: tempCFI,
        color: finalColor,
        note,
      });
      const savedNote = res.data;
      setNotes((prev) => [
        ...prev.filter((n) => n.cfiRange !== tempCFI),
        savedNote,
      ]);
      // Không cần load lại API highlight để tránh giật, update local state là đủ
    } catch (err) {
      console.error("❌ Save highlight error:", err);
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      const note = notes.find((n) => n.id === id);
      if (!note) return;
      rendition?.annotations.remove(note.cfiRange, "highlight");
      setNotes((prev) => prev.filter((n) => n.id !== id));
      await api.delete(`${API.highlights}/${id}`);
    } catch (err) {
      console.error("❌ Delete highlight error:", err);
    }
  };

  const handleUpdateNote = async (
    id: string,
    color?: string,
    note?: string,
  ) => {
    try {
      const res = await api.patch(`${API.highlights}/${id}`, { color, note });
      const updated = res.data;
      setNotes((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, color: updated.color, note: updated.note } : n,
        ),
      );
    } catch (err) {
      console.error("❌ Update highlight error:", err);
    }
  };

  // --- Setup Rendition & Lazy Location ---
  const setupRendition = async (
    rend: Rendition,
    onReadyCallback?: (
      rend: Rendition,
      toc: { label: string; href: string }[],
      notes: any[],
    ) => void,
    onSelectionCallback?: (cfiRange: string, contents: any) => void,
  ) => {
    // 🔥 Đợi book ready hoàn toàn
    await rend.book.ready;
    await rend.book.loaded.navigation;
    await rend.book.loaded.spine;

    console.log("Book fully ready");

    // 🔥 Tạo TOC sau khi navigation load xong
    const tocData = rend.book.navigation.toc.map((item: any) => ({
      label: item.label,
      href: item.href,
    }));

    // 🔥 Generate locations
    await rend.book.locations.generate(1024);
    console.log("Locations generated");

    onLocationChange?.(rend.location?.start?.cfi);

    // callback ra ngoài
    onReadyCallback?.(rend, tocData, []);

    // selection event
    rend.on("selected", (cfiRange: string, contents: any) => {
      onSelectionCallback?.(cfiRange, contents);
    });
  };

  const openEditModal = (n: HighlightNote) => {
    setEditingNote(n);
    setTempCFI(n.cfiRange);
    setTempNote(n.note || "");
    setTempColor(n.color || "");
    setShowTextbox(false);
    setShowModal(true);
  };
  const customStyles: IReactReaderStyle = {
    ...ReactReaderStyle,
    readerArea: {
      ...ReactReaderStyle.readerArea,
      background: background,
      padding: 0,
      margin: 0,
      height: "100%",
      transition: "background 0.3s ease",
    },

    arrow: {
      ...ReactReaderStyle.arrow,
      background: "#313131ff",
      borderRadius: "100%",
      width: "34px",
      height: "34px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "25px",
    },
  };
  // Update existing highlight

  if (error) return <div className="text-center text-red-600">{error}</div>;
  return isMobile ? (
    <EpubReaderMobile
      bookData={fileUrl}
      error={error}
      location={location}
      onLocationChange={onLocationChange}
      setRendition={setRendition}
      customStyles={customStyles}
      setupRendition={setupRendition}
      onReady={onReady}
      onNotesLoaded={onNotesLoaded}
      isGuest={isGuest}
    />
  ) : (
    <EpubReaderPC
      fileUrl={fileUrl}
      bookId={bookId}
      bookData={fileUrl}
      error={error}
      location={location}
      onLocationChange={onLocationChange}
      setRendition={setRendition}
      customStyles={customStyles}
      showModal={showModal}
      resetModal={resetModal}
      editingNote={editingNote}
      setEditingNote={setEditingNote}
      setTempCFI={setTempCFI}
      setShowModal={setShowModal}
      rendition={rendition}
      handleUpdateNote={handleUpdateNote}
      handleAddNote={handleAddNote}
      tempColor={tempColor}
      setTempColor={setTempColor}
      showTextbox={showTextbox}
      setShowTextbox={setShowTextbox}
      tempNote={tempNote}
      setTempNote={setTempNote}
      charCount={charCount}
      setupRendition={setupRendition}
      onReady={onReady}
      onNotesLoaded={onNotesLoaded}
      onDeleteNote={handleDeleteNote}
      isGuest={isGuest}
    />
  );
}
