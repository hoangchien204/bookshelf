import React, { useState } from "react";

const HighlightNotesPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"highlights" | "notes">("highlights");

  return (
    <div className="w-80 bg-white shadow-lg border rounded-md p-4">
      <div className="flex space-x-2 mb-4">
        <button
          className={`px-3 py-1 rounded ${activeTab === "highlights" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          onClick={() => setActiveTab("highlights")}
        >
          Highlights
        </button>
        <button
          className={`px-3 py-1 rounded ${activeTab === "notes" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          onClick={() => setActiveTab("notes")}
        >
          Notes
        </button>
      </div>

      {activeTab === "highlights" ? (
        <ul>
          <li className="p-2 border-b">Highlight 1...</li>
          <li className="p-2 border-b">Highlight 2...</li>
        </ul>
      ) : (
        <ul>
          <li className="p-2 border-b">Note 1...</li>
          <li className="p-2 border-b">Note 2...</li>
        </ul>
      )}
    </div>
  );
};

export default HighlightNotesPanel;
