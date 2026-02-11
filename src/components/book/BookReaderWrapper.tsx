import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../services/APIURL";
import type { Book } from "../../types/Book";
import Loading from "../common/Loading";
import api from "../../types/api";

import BookReaderPage from "./BookReaderPage";
import BookReaderMobile from "./BookReaderMobile";
import { useAuth } from "../user/AuthContext";

const BookReaderWrapper: React.FC = () => {
  const { slugAndId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id;

  const uuidRegex =
    /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/;

  const match = slugAndId?.match(uuidRegex);
  const bookId = match ? match[0] : null;
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);

  const [isLaptop, setIsLaptop] = useState(window.innerWidth >= 1024);

  const isGuest = !user;
  /** 📌 Responsive check */
  useEffect(() => {
    const handleResize = () => setIsLaptop(window.innerWidth >= 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!bookId) {
      navigate("/");
      return;
    }

    const fetchBook = async () => {
      try {
        setLoading(true);

        // axios get
        const res = await api.get(`${API.books}/${bookId}`);

        // axios tự throw error nếu status >= 400
        const fetchedBook: Book = res.data;

        if (!fetchedBook) {
          navigate("/");
          return;
        }

        setBook(fetchedBook);

        // ===== Sync progress =====
        if (!isGuest) {
          let restoredPage = parseInt(
            localStorage.getItem(`book-${fetchedBook.id}-page`) || "1",
            10,
          );

          try {
            const resAct = await api.get(
              `${API.activities}/read/${fetchedBook.id}`,
            );

            const serverPage = resAct.data?.page;

            if (serverPage && serverPage > restoredPage) {
              restoredPage = serverPage;
              localStorage.setItem(
                `book-${fetchedBook.id}-page`,
                restoredPage.toString(),
              );
            } else if (serverPage && serverPage < restoredPage) {
              await api.post(API.read, {
                bookId: fetchedBook.id,
                page: restoredPage,
              });
            }
          } catch (err) {
            console.error("Sync error:", err);
          }
        }
      } catch (err) {
        console.error("FetchBook error:", err);
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [bookId, isGuest]);

  if (loading) return <Loading />;
  if (!book)
    return <div className="p-5 text-red-500">Không tìm thấy sách.</div>;

  return isLaptop ? (
    <BookReaderPage book={book} />
  ) : (
    <BookReaderMobile book={book} userId={userId} />
  );
};

export default BookReaderWrapper;
