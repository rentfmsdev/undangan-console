import React from 'react';
import { Layers, Grid } from 'lucide-react';

type Props = {
  viewMode: 'slider' | 'grid';
  setViewMode: (mode: 'slider' | 'grid') => void;
};

export const GalleryToggle: React.FC<Props> = ({ viewMode, setViewMode }) => {
  return (
    <div className="aqiqah-gallery-toggle">
      <button
        type="button"
        className={`aqiqah-toggle-btn ${viewMode === 'slider' ? 'active' : ''}`}
        onClick={() => setViewMode('slider')}
      >
        <Layers size={14} />
        <span>Slide Album</span>
      </button>
      <button
        type="button"
        className={`aqiqah-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
        onClick={() => setViewMode('grid')}
      >
        <Grid size={14} />
        <span>Grid Foto</span>
      </button>
    </div>
  );
};
