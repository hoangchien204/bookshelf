import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import AvatarMenu from "../user/AvatarMenu";
import type { User } from "../../types/user";
import API from "../../services/API";
import type { Book } from "../../types/Book";
import axios from "axios";




const TabBar = () => {
  const { pathname } = useLocation();
  const isLoggedIn = !!localStorage.getItem("accessToken");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [user, setUser] = useState<User | null>(null)
  const [books, setBooks] = useState<Book[]>([]);  // 🔹 fetch ở đây
  const [menuOpen, setMenuOpen] = useState(false);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const tabClass = (active: boolean) =>
    `flex-1 text-center py-2 ${active ? "text-blue-400" : "text-gray-300"
    } transition`;

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await axios.get<Book[]>(API.books)
        setBooks(res.data);
      } catch (err) {
        console.error("Lỗi fetch books:", err);
      }
    };

    fetchBooks();
  }, []);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    const fetchUser = async () => {
      try {
        const res = await fetch(`${API.users}/${userId}`);
        const data: User = await res.json();
        setUser(data);
      } catch (err) {
        console.error("Lỗi fetch user:", err);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    if (!searchValue.trim()) {
      setFilteredBooks([]);
      return;
    }

    const lower = searchValue.toLowerCase();
    const filtered = books.filter(
      (b) =>
        b.name.toLowerCase().includes(lower) ||
        b.author.toLowerCase().includes(lower)
    );
    setFilteredBooks(filtered);
  }, [searchValue, books]);
  return (
    <div className="w-full">
      {/* 🔹 Desktop */}
      <div className="hidden md:flex items-center justify-between h-16 w-full px-8">
        {/* Nhóm trái */}
        <div className="flex-1 flex items-center gap-6">
          <Link to="/" className="text-2xl font-bold text-green-400">
            Tủ Sách Nhỏ
          </Link>
          <Link to="/" className={tabClass(pathname === "/")}>
            <span className="inline-block text-lg font-semibold">Trang chủ</span>
          </Link>
          <Link to="/genres" className={tabClass(pathname === "/genres")}>
            <span className="inline-block text-lg font-semibold">Thể loại</span>
          </Link>
          <Link to="/reading" className={tabClass(pathname === "/reading")}>
            <span className="inline-block text-lg font-semibold">Đang đọc</span>
          </Link>
          <Link to="/favorites" className={tabClass(pathname === "/favorites")}>
            <span className="inline-block text-lg font-semibold">Yêu thích</span>
          </Link>
        </div>

        {/* Nhóm phải */}
        <div className="flex items-center gap-8 ml-10">
          {/* Search input */}
          {searchOpen ? (
            <input
              type="text"
              autoFocus
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onBlur={() => {
                setSearchOpen(false);
                setSearchValue("");
              }}
              placeholder="Tìm sách hoặc tác giả..."
              className="w-32 sm:w-48 md:w-64 px-3 py-1.5 rounded-md 
               bg-gray-800 text-white text-sm outline-none
               transition-all duration-500 ease-in-out
               focus:w-72"
            />
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="text-gray-300 hover:text-blue-400 p-1
               transition-all duration-300 transform hover:scale-110"
            >
              <FontAwesomeIcon icon={faSearch} />
            </button>
          )}

          {isLoggedIn ? (
            <AvatarMenu
              avatarUrl={user?.avatarUrl || "/default-avatar.png"}
              username={user?.username || "Guest"}
            />
          ) : (
            <Link
              to="/login"
              className="px-4 py-2 text-base font-medium text-white bg-green-500 hover:bg-green-600 rounded-full shadow-md transition"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </div>

      {/* 🔹 Mobile */}
      <div className="flex flex-col md:hidden w-full">
        {/* Dòng trên: menu + search */}
        <div className="flex items-center justify-between h-14 px-4 bg-black text-white">
          <button onClick={() => setMenuOpen(true)}>☰</button>
          {searchOpen ? (
    <input
      type="text"
      value={searchValue}
      onChange={(e) => setSearchValue(e.target.value)}
      onBlur={() => {
        setSearchOpen(false);
        setSearchValue("");
      }}
      placeholder="Tìm sách..."
      className="w-40 px-3 py-1 rounded bg-gray-800 text-white text-sm outline-none"
    />
  ) : (
    <button onClick={() => setSearchOpen(true)}>
      <FontAwesomeIcon icon={faSearch} />
    </button>
  )}
        </div>

        {/* Dòng dưới: tabs scroll ngang */}
        <div className="flex overflow-x-auto gap-4 px-4 py-2 bg-gray-800 text-white hide-scrollbar">
          <Link to="/" className={tabClass(pathname === "/")}>Trang chủ</Link>
          <Link to="/genres" className={tabClass(pathname === "/genres")}>Thể loại</Link>
          <Link to="/reading" className={tabClass(pathname === "/reading")}>Đang đọc</Link>
          <Link to="/favorites" className={tabClass(pathname === "/favorites")}>Yêu thích</Link>
        </div>
      </div>

      {/* 🔹 Dropdown search result */}
      {searchOpen && filteredBooks.length > 0 && (
        <ul className="absolute right-4 top-16 bg-gray-800 text-white rounded shadow-lg w-64 max-h-64 overflow-y-auto z-50 hide-scrollbar">
          {filteredBooks.map((book) => (
            <li
              key={book.id}
              className="px-3 py-2 hover:bg-gray-400 cursor-pointer"
              onMouseDown={() => (window.location.href = `/book/${book.id}`)}
            >
              <span className="font-medium">{book.name}</span>
              <span className="text-gray-500 text-sm ml-1">— {book.author}</span>
            </li>
          ))}
        </ul>
      )}
      {menuOpen && (
  <div className="fixed inset-0 z-50 flex">
    <div
      className="fixed inset-0 bg-black bg-opacity-50"
      onClick={() => setMenuOpen(false)}
    />

    {/* Sidebar */}
    <div className="relative w-64 bg-gray-900 text-white h-full p-6 flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <img
          src={user?.avatarUrl || "/default-avatar.png"}
          alt="avatar"
          className="w-12 h-12 rounded-full border"
        />
        <div>
          <p className="font-semibold">{user?.fullName || "Khách"}</p>
          <button
            onClick={() => {
              setMenuOpen(false);
              window.location.href = "/profile";
            }}
            className="text-sm text-blue-400 hover:underline"
          >
            Xem hồ sơ
          </button>
        </div>
      </div>

      <nav className="flex flex-col gap-4">
        <Link to="/" onClick={() => setMenuOpen(false)}>Trang chủ</Link>
        <Link to="/genres" onClick={() => setMenuOpen(false)}>Thể loại</Link>
        <Link to="/reading" onClick={() => setMenuOpen(false)}>Đang đọc</Link>
        <Link to="/favorites" onClick={() => setMenuOpen(false)}>Yêu thích</Link>
        {isLoggedIn ? (
          <button
            onClick={() => {
              localStorage.clear();
              setMenuOpen(false);
              window.location.href = "/";
            }}
            className="text-left text-red-400"
          >
            Đăng xuất
          </button>
        ) : (
          <Link to="/login" onClick={() => setMenuOpen(false)}>
            Đăng nhập
          </Link>
        )}
      </nav>
    </div>
  </div>
)}
    </div>
  );

};

export default TabBar;
