import React from 'react';

const NotFoundPage: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-screen text-center">
      <div>
        <h1 className="text-4xl font-bold mb-4">404 - Không tìm thấy trang</h1>
        <p className="text-lg">Trang bạn đang tìm không tồn tại.</p>
      </div>
    </div>
  );
};

export default NotFoundPage;
