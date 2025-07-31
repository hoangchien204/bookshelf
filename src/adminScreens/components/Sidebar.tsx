import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const { pathname } = useLocation();

  const linkClass = (path: string) =>
    `block px-4 py-2 rounded-md hover:bg-gray-700 hover:text-white ${
      pathname.includes(path) ? 'bg-gray-800 text-white' : 'text-gray-300'
    }`;

  return (
    <div className="h-screen w-64 bg-gray-900 text-white p-6 display-flex">
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
      <nav className="space-y-2">
        <Link to="/admin/users" className={linkClass('users')}>
          Quản lý người dùng
        </Link>
        <Link to="/admin/books" className={linkClass('books')}>
          Quản lý sách
        </Link>
         <Link to="/admin/genre" className="block px-4 py-2 rounded-md text-gray-400 hover:bg-gray-700 hover:text-white">
           Thể loại
        </Link>
        <Link to="/" className="block px-4 py-2 rounded-md text-gray-400 hover:bg-gray-700 hover:text-white">
          Về trang chủ
        </Link>
      </nav>
    </div>
  );
};

export default Sidebar;
