import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import TabBar from './components/TabBar';
import BookshelfApp from './screens/BookshelfApp';
import BookReaderPage from './components/BookReaderPage';
import LoginPage from './screens/login';
import DashboardLayout from './adminScreens/page/DashboardLayout';
import UserManagement from './adminScreens/page/UserManagement';
import BookManagement from './adminScreens/page/BookManagement';

import { useEffect } from 'react';
import NotFoundPage from './screens/NotFoundPage';
import FavoritesPage from './screens/FavoritesPage';
import ReadingPage from './screens/ReadingPage';
import GenreBook from './adminScreens/page/GenreBook';
import BookDetailPage from './components/BookDetailPage';
import ToastProvider from './components/ToastProvider';

function AppRoutes() {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/admin');
  const isAdmin = localStorage.getItem('role') === 'admin';

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
      {!isDashboard && <TabBar />}
   <Routes>
   <Route path="/" element={<BookshelfApp />} />
  <Route path="/read/:slugAndId" element={<BookReaderPage />} />
  <Route path="/book/:slugAndId" element={<BookDetailPage />} />
  <Route path="/favorites" element={<FavoritesPage />} />
  <Route path="/reading" element={<ReadingPage />} />
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
