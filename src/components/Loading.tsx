import React from 'react';
import '../assets/loading.css' 

const Loading: React.FC = () => {
  return (
    <div className="loading-container">
      <div className="lds-spinner">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i}></div>
        ))}
      </div>
    </div>
  );
};

export default Loading;
