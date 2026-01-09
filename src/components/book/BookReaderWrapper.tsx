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
  const bookId = slugAndId?.substring(slugAndId.lastIndexOf("-") + 1);
  const [book, setBook] = useState<Book | null>(null)
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
    const fetchBook = async () => {
      try {
        setLoading(true);
        const res = await fetch(API.books, {
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          console.error("Fetch error:", res.status);
          navigate("/");
          return;
        }

        const allBooks: Book[] = await res.json();
        const matched = allBooks.find((b) => b.id.includes(bookId || ""));

        if (!matched) {
          navigate("/");
          return;
        }
        setBook(matched);

        if (!isGuest) {
          let restoredPage = parseInt(localStorage.getItem(`book-${matched.id}-page`) || "1", 10);

          try {
            const resAct = await api.get(`${API.activities}/read/${matched.id}`, {
              headers: {
                "Content-Type": "application/json",
              },
            });
            const serverPage = resAct.data?.page;
            if (serverPage && serverPage > restoredPage) {
              restoredPage = serverPage;
              localStorage.setItem(`book-${matched.id}-page`, restoredPage.toString());
            } else if (serverPage && serverPage < restoredPage) {
              await api.post(
                API.read,
                { bookId: matched.id, page: restoredPage },
                {
                  headers: {
                    "Content-Type": "application/json",
                  },
                }
              );
            }
          } catch (err) {
            console.error("Sync error:", err);
          }
        } else {
          console.log("Guest → chỉ setBook, không sync progress");
        }

      } catch (err) {
        console.error("FetchBook error:", err);
      } finally {
        setLoading(false);
        console.log("Wrapper fetch done");
      }
    };

    fetchBook();
  }, [bookId, navigate, isGuest]);

  if (loading) return <Loading />;
  if (!book) return <div className="p-5 text-red-500">Không tìm thấy sách.</div>;

  return isLaptop ? (
    <BookReaderPage />
  ) : (
    <BookReaderMobile
      book={book}
      userId={userId}
    />
  );
};

export default BookReaderWrapper;
