import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import "../../assets/loading.css";

const Loading: React.FC = () => {
  useEffect(() => {
    document.body.classList.add("loading-mode");
    return () => {
      document.body.classList.remove("loading-mode");
    };
  }, []);

  return ReactDOM.createPortal(
    <div className="loading-container">
      <div className="lds-spinner">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i}></div>
        ))}
      </div>
    </div>,
    document.body
  );
};

export default Loading;
