import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../types/api";
import API from "../services/APIURL";
import BookCard from "../components/book/BookCard";
import type { Book } from "../types/Book";
import Loading from "../components/common/Loading";
import { useFavorites } from "../hooks/useFavorites";
import { FaAngleDoubleDown, FaAngleDown } from "react-icons/fa";

interface Genre {
    id: string;
    name: string;
    isActive: boolean;
}

export default function GenresPage() {
    const [genres, setGenres] = useState<Genre[]>([]);
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);

    const accessToken = localStorage.getItem("accessToken");
    const userId = localStorage.getItem("userId");

    const { favorites, setFavorites, handleToggleFavorite } = useFavorites(userId, accessToken);

    const [searchParams, setSearchParams] = useSearchParams();
    const genreId = searchParams.get("genreId");

    const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);
    const [showGenreDropdown, setShowGenreDropdown] = useState(false);
    const [visibleCount, setVisibleCount] = useState(10);

    useEffect(() => {
        const fetchGenres = async () => {
            try {
                const res = await api.get(API.genres);
                setGenres(res.data.filter((g: Genre) => g.isActive));
            } catch (err) {
                console.error("Lỗi:", err);
            }
        };

        fetchGenres();
    }, []);

    useEffect(() => {
        const fetchFavorites = async () => {
            if (!userId || !accessToken) {
                setFavorites([]);
                return;
            }
            try {
                const res = await api.get(API.favorites, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });
                setFavorites(res.data);
            } catch (err) {
                console.error("Lỗi: ", err);
            }
        };

        fetchFavorites();
    }, [userId, accessToken]);


    useEffect(() => {
        if (!genres.length) return;

        if (genreId) {
            const g = genres.find((x) => x.id === genreId);
            setSelectedGenre(g || null);
        } else {
            setSelectedGenre(null);
        }
    }, [genreId, genres]);

    // 🔹 Fetch books khi genreId thay đổi
    useEffect(() => {
        const fetchBooks = async () => {
            setLoading(true);
            try {
                const res = await api.get(`${API.books}`, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${accessToken}`,
                    },
                });
                if (genreId) {
                    setBooks(
                        res.data.filter((b: Book) =>
                            b.genres?.some((g) => g.id === genreId) || b.genre?.id === genreId,
                        )
                    );
                } else {
                    setBooks(res.data);
                    setVisibleCount(10); 
                }
            } catch (err) {
                console.error("Lỗi:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchBooks();
    }, [genreId]);

    if (loading) return <Loading />;
    const displayedBooks = books.slice(0, visibleCount);

    return (
        <div className="w-full min-h-screen bg-black text-white font-sans px-2 sm:px-4 md:px-6 lg:px-8 py-6 pt-32 sm:pt-20">
            {/* 🔹 Dropdown thể loại */}
            <div className="flex items-center gap-4 mb-8 mt-3">
                <label className="text-base sm:text-lg lg:text-2xl font-semibold whitespace-nowrap">
                    Thể loại:
                </label>
                <div className="relative" >
                    <button
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg flex items-center gap-2"
                        onClick={() => setShowGenreDropdown((prev) => !prev)}
                    >
                        {selectedGenre ? selectedGenre.name : "Tất cả danh mục"}
                        <span
                            className={`transition-transform duration-300 ${showGenreDropdown ? "rotate-180 text-yellow-400" : "rotate-0 text-white"
                                }`}
                        >
                            {<FaAngleDown />}
                        </span>
                    </button>
                    {showGenreDropdown && (
                        <>
                            {/* overlay */}
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setShowGenreDropdown(false)}
                            />

                            {/* dropdown */}
                            <div
                                className={`
                                    absolute mt-2 w-56 max-h-64 overflow-y-auto 
                                    bg-gray-900 text-white shadow rounded z-50
                                    transform transition-all duration-300 ease-out origin-top
                                    ${showGenreDropdown ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0"}
                                `}
                            >
                                <div
                                    className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
                                    onClick={() => {
                                        setSearchParams({});
                                        setShowGenreDropdown(false);
                                    }}
                                >
                                    Tất cả danh mục
                                </div>
                                {genres.map((g) => (
                                    <div
                                        key={g.id}
                                        className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
                                        onClick={() => {
                                            setSearchParams({ genreId: g.id });
                                            setShowGenreDropdown(false);
                                        }}
                                    >
                                        {g.name}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                </div>


            </div>

            {/* 🔹 Render sách */}
            <h1 className="text-2xl font-bold mb-6">
                {selectedGenre ? selectedGenre.name : "Tất cả sách"}
            </h1>

            {books.length === 0 ? (
                <div className="text-gray-400">Không có sách trong thể loại này</div>
            ) : (
                <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 
                                gap-x-4 gap-y-6 sm:gap-x-6 sm:gap-y-8 md:gap-x-10 md:gap-y-7 
                                xl:gap-x-[55px] xl:gap-y-12">
                    {displayedBooks.map((book) => (
                        <BookCard
                            key={book.id}
                            book={book}
                            onRead={() => { }}
                            onToggleFavorite={() => { handleToggleFavorite(book) }}
                            isFavorite={favorites.some((f) => f.id === book.id)}
                        />
                    ))}
                </div>

                    {visibleCount <= books.length && (
                        <div className="text-center mt-6">
                            <button
                                onClick={() => setVisibleCount((prev) => prev + 10)}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-full transition"
                            >
                                <FaAngleDoubleDown />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
