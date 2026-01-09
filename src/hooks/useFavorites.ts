import { useState } from "react";
import api from "../types/api";
import toast from "react-hot-toast";
import API from "../services/APIURL";
import type { Book } from "../types/Book";
export function useFavorites(userId: string | null) {
  const [favorites, setFavorites] = useState<Book[]>([]);
  const [processingBookId, setProcessingBookId] = useState<string | null>(null);

  const handleToggleFavorite = async (book: Book) => {
    if (!userId || processingBookId === book.id) return;

    setProcessingBookId(book.id);

    // Optimistic update
    setFavorites((prev) =>
      prev.some((b) => b.id === book.id)
        ? prev.filter((b) => b.id !== book.id)
        : [...prev, book]
    );

    try {
      const res = await api.post(API.favorites, { bookId: book.id });

      if (res.data.isFavorite) {
        toast.success("Yêu thích thành công");
      } else {
        toast.success("Bỏ yêu thích thành công");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingBookId(null);
    }
  };

  return { favorites, setFavorites, handleToggleFavorite, processingBookId };
}