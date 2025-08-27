import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../services/API";
import type { Book } from "../../types/Book";
import Loading from "../common/Loading";
import axios from "axios";

import BookReaderPage from "./BookReaderPage";
import BookReaderMobile from "./BookReaderMobile";

interface Highlight {
  page: number;
  rects: { x: number; y: number; w: number; h: number }[];
  color: string;
  text: string;
}

const BookReaderWrapper: React.FC = () => {
  const { slugAndId } = useParams();
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const accessToken = localStorage.getItem("accessToken");
  const bookId = slugAndId?.split("-").slice(-1)[0];

  const [book, setBook] = useState<Book | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [isLaptop, setIsLaptop] = useState(window.innerWidth >= 1024);

  /** 📌 Responsive check */
  useEffect(() => {
    const handleResize = () => setIsLaptop(window.innerWidth >= 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /** 📌 Fetch book & sync page */
  useEffect(() => {
    const fetchBook = async () => {
      try {
        setLoading(true);
        if (!userId || !accessToken) return;

        const res = await fetch(API.books, {
          headers: { "ngrok-skip-browser-warning": "true" },
        });
        const allBooks: Book[] = await res.json();
        const matched = allBooks.find((b) => b.id.includes(bookId || ""));
        if (!matched) {
          navigate("/");
          return;
        }
        setBook(matched);

        let restoredPage =
          parseInt(localStorage.getItem(`book-${matched.id}-page`) || "1", 10) || 1;

        try {
          const res = await axios.get(`${API.activities}/read/${matched.id}`, {
            headers: { "x-user-id": userId },
          });
          const serverPage = res.data?.page;
          if (serverPage && serverPage > restoredPage) {
            restoredPage = serverPage;
            localStorage.setItem(`book-${matched.id}-page`, restoredPage.toString());
          } else if (serverPage && serverPage < restoredPage) {
            await axios.post(
              API.read,
              { bookId: matched.id, page: restoredPage },
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${accessToken}`,
                  "x-user-id": userId,
                },
              }
            );
          }
        } catch (err) {
          console.error("Sync server error:", err);
        }

        setCurrentPage(restoredPage);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [bookId, navigate, userId, accessToken]);

  if (loading) return <Loading />;
  if (!book) return <div className="p-5 text-red-500">Không tìm thấy sách.</div>;

  /** 📌 Chọn UI theo thiết bị */
  return isLaptop ? (
    <BookReaderPage />
  ) : (
    <BookReaderMobile
      book={book}
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      numPages={numPages}
      setNumPages={setNumPages}
      highlights={highlights}
      setHighlights={setHighlights}
      userId={userId}
      accessToken={accessToken}
    />
  );
};

export default BookReaderWrapper;
