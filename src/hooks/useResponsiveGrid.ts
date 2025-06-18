
import { useState, useEffect } from 'react';

export const useResponsiveGrid = () => {
  const [gridSize, setGridSize] = useState(60);
  const [cellSize, setCellSize] = useState(10);

  useEffect(() => {
    const updateGridSize = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      
      // Calculate available space for game area (considering info panel width on desktop)
      const infoPanel = window.innerWidth >= 768 ? 320 : 0; // 320px info panel on desktop
      const availableWidth = vw - infoPanel - 32; // 32px for padding
      const availableHeight = vh - 32; // 32px for padding
      
      // Choose smaller dimension to ensure square grid fits
      const maxSize = Math.min(availableWidth, availableHeight);
      
      // Calculate optimal cell size and grid dimensions
      if (maxSize < 400) {
        // Small screens (mobile)
        setCellSize(6);
        setGridSize(Math.floor(maxSize / 6));
      } else if (maxSize < 600) {
        // Medium screens
        setCellSize(8);
        setGridSize(Math.floor(maxSize / 8));
      } else {
        // Large screens
        setCellSize(10);
        setGridSize(Math.floor(maxSize / 10));
      }
    };

    updateGridSize();
    window.addEventListener('resize', updateGridSize);
    return () => window.removeEventListener('resize', updateGridSize);
  }, []);

  return { gridSize, cellSize };
};
