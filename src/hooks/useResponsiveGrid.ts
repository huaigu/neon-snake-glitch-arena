
import { useState, useEffect } from 'react';

export const useResponsiveGrid = () => {
  // Fixed grid size for consistency across devices
  const gridSize = 60;
  const [cellSize, setCellSize] = useState(10);

  useEffect(() => {
    const updateCellSize = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      
      // Calculate available space for game area (considering info panel width on desktop)
      const infoPanel = window.innerWidth >= 768 ? 320 : 0; // 320px info panel on desktop
      const availableWidth = vw - infoPanel - 32; // 32px for padding
      const availableHeight = vh - 32; // 32px for padding
      
      // For mobile, reduce height to account for controls above game area
      const mobileControlsHeight = window.innerWidth < 768 ? 220 : 0; // Space for controls on mobile
      const adjustedHeight = availableHeight - mobileControlsHeight;
      
      // Choose smaller dimension to ensure square grid fits
      const maxSize = Math.min(availableWidth, adjustedHeight);
      
      // Calculate optimal cell size based on available space and fixed grid size
      const optimalCellSize = Math.floor(maxSize / gridSize);
      
      // Set minimum and maximum cell sizes
      setCellSize(Math.max(4, Math.min(optimalCellSize, 12)));
    };

    updateCellSize();
    window.addEventListener('resize', updateCellSize);
    return () => window.removeEventListener('resize', updateCellSize);
  }, []);

  return { gridSize, cellSize };
};
