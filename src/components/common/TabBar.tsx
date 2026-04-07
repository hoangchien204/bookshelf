import { Link, useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import AvatarMenu from "../user/AvatarMenu";
import LoginModal from "../../screens/login";

import API from "../../services/APIURL";
import api from "../../types/api";

import type { Book } from "../../types/Book";
import { useAuth } from "../user/AuthContext";

interface Genre {
  id: string;
  name: string;
  isActive: boolean;
}

const TabBar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const { user, logout, openLoginModal, setOpenLoginModal } = useAuth();
  const isLoggedIn = !!user;

  /** 🔍 SEARCH */
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);

  const [genres, setGenres] = useState<Genre[]>([]);
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [lastScrollY, setLastScrollY] = useState(0);

  const tabClass = (active: boolean) =>
    `flex-1 text-center py-2 ${
      active ? "text-blue-400" : "text-gray-300"
    } transition`;

  /* ================= FETCH DATA ================= */

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await api.get<Book[]>(API.books);
        setBooks(res.data);
      } catch (err) {
        console.error("Fetch books error:", err);
      }
    };
    fetchBooks();
  }, []);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const res = await api.get(API.genres);
        setGenres(res.data.filter((g: Genre) => g.isActive));
      } catch (err) {
        console.error("Fetch genres error:", err);
      }
    };
    fetchGenres();
  }, []);

  /* ================= SEARCH ================= */

  useEffect(() => {
    if (!searchValue.trim()) {
      setFilteredBooks([]);
      return;
    }
    const lower = searchValue.toLowerCase();
    setFilteredBooks(
      books.filter(
        (b) =>
          b.name.toLowerCase().includes(lower) ||
          b.author.toLowerCase().includes(lower),
      ),
    );
  }, [searchValue, books]);

  /* ================= SCROLL HIDE ================= */

  useEffect(() => {
    const handleScroll = () => {
      setLastScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  /* ================= ACTIONS ================= */

  const handleLogout = async () => {
    await logout();
  };

  /* ================= RENDER ================= */

  return (
    <div className="w-full">
      <div className="hidden md:flex items-center justify-between h-16 w-full px-8 fixed top-0 left-0 z-50 bg-black/80">
        {/* LEFT */}
        <div className="flex-1 flex items-center gap-6 relative">
          <Link to="/" className="text-2xl font-bold text-green-400">
            Tủ Sách Nhỏ
          </Link>

          <Link to="/" className={tabClass(pathname === "/")}>
            Trang chủ
          </Link>

          {/* GENRES */}
          <div
            className={`${tabClass(pathname.startsWith("/genres"))} relative`}
            onMouseEnter={() => {
              if (timeoutRef.current) clearTimeout(timeoutRef.current);
              setShowGenreDropdown(true);
            }}
            onMouseLeave={() => {
              timeoutRef.current = setTimeout(
                () => setShowGenreDropdown(false),
                120,
              );
            }}
          >
            <Link to="/genres">Thể loại</Link>

            <AnimatePresence>
              {showGenreDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 mt-2 bg-gray-900 rounded-lg w-[700px] p-6 z-50"
                >
                  <div className="grid grid-cols-4 gap-4">
                    {genres.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => {
                          navigate(`/genres?genreId=${g.id}`);
                          setShowGenreDropdown(false);
                        }}
                        className="text-left hover:bg-gray-800 px-2 py-1 rounded"
                      >
                        {g.name}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {isLoggedIn && (
            <>
              <Link to="/reading" className={tabClass(pathname === "/reading")}>
                Đang đọc
              </Link>
              <Link
                to="/favorites"
                className={tabClass(pathname === "/favorites")}
              >
                Yêu thích
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-6 relative">
          {searchOpen ? (
            <input
              autoFocus
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onBlur={() => {
                setSearchOpen(false);
                setSearchValue("");
              }}
              placeholder="Tìm sách..."
              className="px-4 py-3 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-none transition-colors"
            />
          ) : (
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-white hover:text-green-400 transition-colors"
            >
              <FontAwesomeIcon icon={faSearch} />
            </button>
          )}

          {searchOpen && filteredBooks.length > 0 && (
            <ul className="absolute right-0 top-10 bg-white/10 rounded-full w-64 max-h-64 overflow-y-auto">
              {filteredBooks.map((b) => (
                <li
                  key={b.id}
                  onMouseDown={() => (window.location.href = `/book/${b.id}`)}
                  className="px-4 py-3 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-none transition-colors"
                >
                  {b.name} — {b.author}
                </li>
              ))}
            </ul>
          )}

          {isLoggedIn ? (
            <AvatarMenu
              avatarUrl={user?.avatarUrl || "/default-avatar.png"}
              username={user?.username || "User"}
              onLogout={handleLogout}
            />
          ) : (
            <button
              onClick={() => setOpenLoginModal(true)}
              className="px-4 py-2 bg-green-500 rounded-full"
            >
              Đăng nhập
            </button>
          )}
        </div>
      </div>

      {/* ================= LOGIN MODAL ================= */}
      <LoginModal
        isOpen={openLoginModal}
        onClose={() => setOpenLoginModal(false)}
      />
    </div>
  );
};

export default TabBar;
