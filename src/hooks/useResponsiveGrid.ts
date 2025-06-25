import { useState, useEffect } from 'react';
import { useIsMobile } from './use-mobile';
import { GAME_CONFIG } from '../utils/gameConstants';

export const useResponsiveGrid = (containerRef?: React.RefObject<HTMLElement>) => {
  // 使用游戏配置中的棋盘大小，保证游戏逻辑一致性
  const LOGICAL_GRID_SIZE = GAME_CONFIG.BOARD.SIZE;
  
  const [cellSize, setCellSize] = useState(12); // 动态单元格大小
  const isMobile = useIsMobile();

  useEffect(() => {
    const updateCellSize = () => {
      let availableWidth: number;
      let availableHeight: number;

      if (containerRef?.current) {
        // 如果提供了容器引用，使用容器的实际尺寸
        const rect = containerRef.current.getBoundingClientRect();
        availableWidth = rect.width;
        availableHeight = rect.height;
      } else {
        // 回退到窗口尺寸计算
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        
        // 计算游戏区域的可用空间（考虑桌面端的信息面板宽度）
        const infoPanel = window.innerWidth >= 768 ? 320 : 0; // 桌面端320px信息面板
        availableWidth = vw - infoPanel - 32; // 32px边距
        availableHeight = vh - 20; // 32px边距
        
        // 移动端需要减去控制区域高度
        const mobileControlsHeight = window.innerWidth < 768 ? 220 : 0; // 移动端控制区域
        availableHeight = availableHeight - mobileControlsHeight;
      }

      // 统一按可显示区域计算，哪个维度小就按哪个优先
      const margin = 20; // 不同设备的边距
      const usableWidth = availableWidth - margin;
      const usableHeight = availableHeight - margin;
      
      // 根据固定的逻辑网格大小计算最大可能的单元格大小
      const cellFromWidth = Math.floor(usableWidth / LOGICAL_GRID_SIZE);
      const cellFromHeight = Math.floor(usableHeight / LOGICAL_GRID_SIZE);
      
      // 选择较小的值确保游戏板能完全显示
      let newCellSize = Math.min(cellFromWidth, cellFromHeight);
      
      // 根据设备类型和网格大小动态设置单元格大小限制
      // 对于更大的网格，需要更小的单元格大小来保证显示
      const gridSizeRatio = LOGICAL_GRID_SIZE / 60; // 以原来的60为基准
      const minCellSize = Math.max(2, Math.floor((isMobile ? 6 : 8) / gridSizeRatio));
      const maxCellSize = Math.max(5, Math.floor((isMobile ? 15 : 25) / gridSizeRatio));
      newCellSize = Math.max(minCellSize, Math.min(newCellSize, maxCellSize));
      
      // 只在调试模式下输出响应式尺寸计算日志，避免频繁日志输出
      // console.log('响应式尺寸计算:', {
      //   device: isMobile ? 'Mobile' : 'PC',
      //   logicalGrid: LOGICAL_GRID_SIZE,
      //   available: `${availableWidth}x${availableHeight}`,
      //   usable: `${usableWidth}x${usableHeight}`,
      //   cellFromWidth,
      //   cellFromHeight,
      //   finalCellSize: newCellSize,
      //   finalBoard: `${LOGICAL_GRID_SIZE * newCellSize}x${LOGICAL_GRID_SIZE * newCellSize}`,
      //   utilization: `${((LOGICAL_GRID_SIZE * newCellSize / availableWidth) * 100).toFixed(1)}% x ${((LOGICAL_GRID_SIZE * newCellSize / availableHeight) * 100).toFixed(1)}%`,
      //   limitedBy: cellFromWidth < cellFromHeight ? 'width' : 'height'
      // });

      // 只在值发生变化时更新
      if (newCellSize !== cellSize) {
        setCellSize(newCellSize);
      }
    };

    // 延迟执行确保DOM准备就绪
    const timeout = setTimeout(updateCellSize, 100);
    updateCellSize();
    
    window.addEventListener('resize', updateCellSize);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', updateCellSize);
    };
  }, [isMobile, containerRef, LOGICAL_GRID_SIZE, cellSize]);

  return { 
    gridSize: LOGICAL_GRID_SIZE, // 返回固定的逻辑网格大小
    cellSize // 返回动态计算的单元格大小
  };
};
