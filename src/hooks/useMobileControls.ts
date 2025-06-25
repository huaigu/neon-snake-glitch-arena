import { useEffect, useCallback } from 'react';

interface UseMobileControlsProps {
  onDirectionChange: (direction: 'up' | 'down' | 'left' | 'right') => void;
  isEnabled: boolean;
}

export const useMobileControls = ({ onDirectionChange, isEnabled }: UseMobileControlsProps) => {
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!isEnabled) return;
    
    // 阻止默认的滚动行为
    e.preventDefault();
    
    const touch = e.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;

    const handleTouchMove = (moveEvent: TouchEvent) => {
      // 阻止触摸移动时的默认行为（滚动）
      moveEvent.preventDefault();
    };

    const handleTouchEnd = (endEvent: TouchEvent) => {
      // 阻止触摸结束时的默认行为
      endEvent.preventDefault();
      
      const endTouch = endEvent.changedTouches[0];
      const endX = endTouch.clientX;
      const endY = endTouch.clientY;
      
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const minSwipeDistance = 30; // 降低最小滑动距离，提高响应性
      
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (Math.abs(deltaX) > minSwipeDistance) {
          onDirectionChange(deltaX > 0 ? 'right' : 'left');
        }
      } else {
        // Vertical swipe
        if (Math.abs(deltaY) > minSwipeDistance) {
          onDirectionChange(deltaY > 0 ? 'down' : 'up');
        }
      }
      
      // 清理事件监听器
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    // 添加触摸移动和结束事件监听器，设置 passive: false 来允许 preventDefault
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
  }, [onDirectionChange, isEnabled]);

  useEffect(() => {
    if (isEnabled) {
      // 设置 passive: false 来允许 preventDefault
      document.addEventListener('touchstart', handleTouchStart, { passive: false });
      return () => document.removeEventListener('touchstart', handleTouchStart);
    }
  }, [handleTouchStart, isEnabled]);

  // 添加额外的全局触摸事件处理来防止页面滚动
  useEffect(() => {
    if (isEnabled) {
      const preventScroll = (e: TouchEvent) => {
        // 只在游戏激活时阻止滚动
        e.preventDefault();
      };

      // 阻止整个文档的触摸滚动
      document.body.addEventListener('touchstart', preventScroll, { passive: false });
      document.body.addEventListener('touchmove', preventScroll, { passive: false });
      document.body.addEventListener('touchend', preventScroll, { passive: false });

      return () => {
        document.body.removeEventListener('touchstart', preventScroll);
        document.body.removeEventListener('touchmove', preventScroll);
        document.body.removeEventListener('touchend', preventScroll);
      };
    }
  }, [isEnabled]);
};
