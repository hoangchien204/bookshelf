import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import NotFoundPage from './screens/NotFoundPage';
import DashboardLayout from './adminScreens/page/DashboardLayout';
import UserManagement from './adminScreens/page/UserManagement';
import BookManagement from './adminScreens/page/BookManagement';
import GenreBook from './adminScreens/page/GenreBook';

import TabBar from './components/common/TabBar';
import MobileTabBar from './components/common/TabBarMobi';
import ToastProvider from './components/common/ToastProvider';
import BookDetailPage from './components/book/BookDetailPage';
import BookReaderWrapper from './components/book/BookReaderWrapper';
import ProfilePage from './components/user/ProfilePage';
import BookshelfApp from './screens/BookshelfApp';
import FavoritesPage from './screens/FavoritesPage';
import ReadingPage from './screens/ReadingPage';

import AuthWatcher from './components/common/GlobalAuthListener';
import GenresPage from './screens/GenrePage';
import { ModalProvider } from './components/common/GlobalModal';
import { useAuth } from './components/user/AuthContext';
import AntiDevTools from './services/AntiDevTools';

function AppRoutes() {
  const location = useLocation();
  const { user } = useAuth();
  const isDashboard = location.pathname.startsWith('/admin');
  const isAdmin = user?.role === 'admin';
  const isBookDetail = /^\/book\/[^/]+$/.test(location.pathname);
  const book = location.state?.book;
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    if (!localStorage.getItem("user")) {
      localStorage.removeItem("isLoggingOut");
    }
  }, []);
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
      <ModalProvider>
        <ToastProvider />
        <AuthWatcher />
        {/* <AntiDevTools /> */}
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
          <Route path="/read/:slugAndId" element={<BookReaderWrapper />} />
          <Route path="/book/:slugAndId" element={<BookDetailPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/reading" element={<ReadingPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path='/genres' element={<GenresPage />} />


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
      </ModalProvider>
    </>
  );
}

export default AppRoutes;
