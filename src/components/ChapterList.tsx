import React from "react";

interface Volume {
  id: string | number;
  title: string;
  createdAt: string;
}

interface VolumeListProps {
  volumes: Volume[];
  onSelect: (id: string | number) => void;
}

const VolumeList: React.FC<VolumeListProps> = ({ volumes, onSelect }) => {
  if (!volumes || volumes.length === 0) {
    return <p className="text-gray-400">Chưa có tập nào</p>;
  }

  return (
    <ul className="space-y-2">
      {volumes.map((vol) => (
        <li
          key={vol.id}
          onClick={() => onSelect(vol.id)}
          className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg cursor-pointer transition"
        >
          <div className="font-medium">{vol.title}</div>
          <div className="text-xs text-gray-400">
            {new Date(vol.createdAt).toLocaleDateString("vi-VN")}
          </div>
        </li>
      ))}
    </ul>
  );
};

export default VolumeList;
