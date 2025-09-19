import { ReactReaderStyle, type IReactReaderStyle } from "react-reader";
import { useState, useEffect } from "react";
import axios from "axios";
import API from "../../services/API";
import type { EpubReaderWrapperProps } from "../../types/EpubReader";
import EpubReaderPC from "./EpubReaderPC";
import EpubReaderMobile from "./EpubReaderMobi";

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

  const [bookData, setBookData] = useState<ArrayBuffer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rendition, setRendition] = useState<any>(null);
  const isMobile = window.innerWidth < 1024;
  const isGuest = !localStorage.getItem("accessToken");

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
  const token = localStorage.getItem("accessToken");

  const resetModal = () => {
    setShowModal(false);
    setTempCFI(null);
    setTempNote("");
    setTempColor("");
    setEditingNote(null);
  };

  // Load EPUB file
  useEffect(() => {
    if (!fileUrl) return;
    fetch(fileUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`);
        return res.arrayBuffer();
      })
      .then((buffer) => {
        setBookData(buffer);
        setError(null);
      })
      .catch((err) => {
        console.error("EPUB load error:", err);
      });
  }, [fileUrl]);

  // Load highlights from API
  useEffect(() => {
    if (!bookId || !token) return;

    axios.get(`${API.highlights}/${bookId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        const highlights = Array.isArray(res.data) ? res.data : res.data.data;
        setNotes(highlights || []);
        onNotesLoaded?.(highlights || []);
      })
      .catch((err) => console.error("❌ Load highlights error:", err));
  }, [bookId, token]);

  useEffect(() => {
    if (!rendition) return;
    const fixTop = () => {
      const containers = document.querySelectorAll(".epub-container");
      containers.forEach((c) => {
        (c as HTMLElement).style.top = "-54px";
      });
    };
    rendition.on("relocated", fixTop);
    return () => rendition.off("relocated", fixTop);
  }, [rendition]);

  useEffect(() => {
    if (rendition) {
      rendition.themes.register("custom", {
        body: {
          "background": background,
          "color": background === "#000000" ? "white" : "black",
          "line-height": "1.6",
        },
      });
      rendition.themes.select("custom");
      if (fontSize) {
        rendition.themes.fontSize(`${fontSize}px`);
      }
      if (fontFamily && fontFamily !== "Mặc định") {
        rendition.themes.font(fontFamily);
      } else {
        rendition.themes.font("inherit");
      }
    }
  }, [rendition, fontSize, fontFamily, background]);

  useEffect(() => {
    if (!rendition) return;
    rendition.annotations.removeAll?.();

    notes.forEach((n) => {
      if (!n.cfiRange) return;
      rendition.annotations.add(
        "highlight",
        n.cfiRange,
        { note: n.note },
        () => openEditModal(n),
        `hl-${n.id}`,   // class unique
        { fill: n.color || "#d5b8ff" }
      );
    });
  }, [rendition, notes]);

  const loadHighlights = async () => {
    if (!bookId || !token) return;
    try {
      const res = await axios.get(`${API.highlights}/${bookId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const highlights = Array.isArray(res.data) ? res.data : res.data.data;
      setNotes(highlights || []);
      onNotesLoaded?.(highlights || []);
    } catch (err) {
      console.error("❌ Load highlights error:", err);
    }
  };

  useEffect(() => {
    loadHighlights();
  }, [bookId, token]);

  useEffect(() => {
    if (rendition) {
      rendition.flow(scrollMode ? "scrolled-doc" : "paginated");
      rendition.spread(viewMode === "double" ? "always" : "none");
    }
  }, [rendition, scrollMode, viewMode]);
  // Count characters in note
  useEffect(() => {
    setCharCount(tempNote.length);
  }, [tempNote]);

  const handleAddNote = async (color: string, note?: string) => {
    if (!tempCFI) return;
    const finalColor = color || "#d5b8ff";

    try {
      const res = await axios.post(
        API.highlights,
        {
          bookId,
          cfiRange: tempCFI,
          color: finalColor,
          note,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const savedNote = res.data;
      setNotes((prev) => [...prev.filter((n) => n.cfiRange !== tempCFI), savedNote]);
      loadHighlights();
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

      await axios.delete(`${API.highlights}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadHighlights();
    } catch (err) {
      console.error("❌ Delete highlight error:", err);
    }
  };
  const customStyles: IReactReaderStyle = {
    ...ReactReaderStyle,
    readerArea: {
      ...ReactReaderStyle.readerArea,
      background: background,
      padding: 0,
      margin: 0,
      height: "100%",
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
  const handleUpdateNote = async (id: string, color?: string, note?: string) => {
    try {
      const res = await axios.patch(
        `${API.highlights}/${id}`,
        { color, note },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updated = res.data;
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, color: updated.color, note: updated.note } : n))
      );
    } catch (err) {
      console.error("❌ Update highlight error:", err);
    }
  };
  const setupRendition = (
    rend: any,
    onReady?: (
      rend: any,
      toc: { label: string; href: string }[],
      notes: any[]
    ) => void,
    openEditModal?: (cfiRange: string, contents: any) => void
  ) => {
    // Sinh location
    rend.book.ready
      .then(() => rend.book.locations.generate(1024))
    const tocData = rend.book.navigation.toc.map((item: any) => ({
      label: item.label,
      href: item.href,
    }));

    const notes: any[] = [];

    onReady?.(rend, tocData, notes);

    rend.on("selected", (cfiRange: string, contents: any) => {
      openEditModal?.(cfiRange, contents);
    });
  };

  // Open modal for editing
  const openEditModal = (n: HighlightNote) => {
    setEditingNote(n);
    setTempCFI(n.cfiRange);
    setTempNote(n.note || "");
    setTempColor(n.color || "");
    setShowTextbox(false);
    setShowModal(true);
  };

  if (error) return <div className="text-center text-red-600">{error}</div>;
  if (!bookData) return <div className="text-center">⏳ Đang tải EPUB...</div>;
  return (
    isMobile ? (

      <EpubReaderMobile
        fileUrl={fileUrl}
        bookId={bookId}
        bookData={bookData}
        error={error}
        location={location}
        onLocationChange={onLocationChange}
        setRendition={setRendition}
        customStyles={customStyles}
        editingNote={editingNote}
        setEditingNote={setEditingNote}
        handleAddNote={handleAddNote}
        handleUpdateNote={handleUpdateNote}
        notes={notes}
        showModal={showModal}
        setShowModal={setShowModal}
        resetModal={resetModal}
        tempCFI={tempCFI}
        setTempCFI={setTempCFI}
        tempNote={tempNote}
        setTempNote={setTempNote}
        tempColor={tempColor}
        setTempColor={setTempColor}
        charCount={charCount}
        rendition={rendition}
        setupRendition={setupRendition}
        onReady={onReady}
        onNotesLoaded={onNotesLoaded}
        isGuest={isGuest}
      />
    ) : (
      <EpubReaderPC
        fileUrl={fileUrl}
        bookId={bookId}
        bookData={bookData}
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
        isGuest = {isGuest}
      />
    )
  );
}


