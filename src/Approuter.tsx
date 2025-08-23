import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import TabBar from './components/common/TabBar';
import BookshelfApp from './screens/BookshelfApp';
import BookReaderPage from './components/book/BookReaderPage';
import LoginPage from './screens/login';
import DashboardLayout from './adminScreens/page/DashboardLayout';
import UserManagement from './adminScreens/page/UserManagement';
import BookManagement from './adminScreens/page/BookManagement';

import { useEffect, useState } from 'react';
import NotFoundPage from './screens/NotFoundPage';
import FavoritesPage from './screens/FavoritesPage';
import ReadingPage from './screens/ReadingPage';
import GenreBook from './adminScreens/page/GenreBook';
import BookDetailPage from './components/book/BookDetailPage';
import ToastProvider from './components/common/ToastProvider';
import ProfilePage from './components/user/ProfilePage';
import MobileTabBar from './components/common/TabBarMobi';


function AppRoutes() {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/admin');
  const isAdmin = localStorage.getItem('role') === 'admin';
  const isBookDetail = /^\/book\/[^/]+$/.test(location.pathname);
  const book = location.state?.book;
const [isMobile, setIsMobile] = useState(window.innerWidth < 768);


useEffect(() => {
  const handleResize = () => setIsMobile(window.innerWidth < 768);
  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);
  useEffect(() => {
    if (isDashboard) {
      document.body.classList.add('dashboard-mode');
    } else {
      document.body.classList.remove('dashboard-mode');
    }
  }, [location]);

  return (
    <>
      <ToastProvider />
      {!isDashboard && (
        isBookDetail && isMobile ? (
          <MobileTabBar
            bookTitle={book?.name || ""}
            onBack={() => window.history.back()}
            onLike={() => console.log("like")}
            onShare={() => console.log("share")}
          />
        ) : (
          <TabBar />
        )
      )}
      <Routes>
        <Route path="/" element={<BookshelfApp />} />
        <Route path="/read/:slugAndId" element={<BookReaderPage />} />
        <Route path="/book/:slugAndId" element={<BookDetailPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/reading" element={<ReadingPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/login" element={<LoginPage />} />


        {isAdmin && (
          <Route path="/admin" element={<DashboardLayout />}>
            <Route index element={<Navigate to="users" />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="books" element={<BookManagement />} />
            <Route path="genre" element={<GenreBook />} />

          </Route>
        )}

        {isDashboard && !isAdmin && (
          <Route path="/admin/*" element={<NotFoundPage />} />
        )}

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

export default AppRoutes;
