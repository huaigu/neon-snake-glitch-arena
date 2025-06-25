import { useEffect, useCallback } from 'react';

interface UseMobileControlsProps {
  onDirectionChange: (direction: 'up' | 'down' | 'left' | 'right') => void;
  isEnabled: boolean;
}

export const useMobileControls = ({ onDirectionChange, isEnabled }: UseMobileControlsProps) => {
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!isEnabled) {
      console.log('useMobileControls: Touch start ignored - not enabled');
      return;
    }
    
    console.log('useMobileControls: Touch start detected');
    
    const touch = e.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;

    const handleTouchMove = (moveEvent: TouchEvent) => {
      // 只阻止游戏区域的滚动，不影响其他功能
      moveEvent.preventDefault();
    };

    const handleTouchEnd = (endEvent: TouchEvent) => {
      endEvent.preventDefault();
      
      const endTouch = endEvent.changedTouches[0];
      const endX = endTouch.clientX;
      const endY = endTouch.clientY;
      
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const minSwipeDistance = 30; // 降低最小滑动距离，提高响应性
      
      console.log('useMobileControls: Touch end - deltaX:', deltaX, 'deltaY:', deltaY);
      
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (Math.abs(deltaX) > minSwipeDistance) {
          const direction = deltaX > 0 ? 'right' : 'left';
          console.log('useMobileControls: Horizontal swipe detected:', direction);
          onDirectionChange(direction);
        }
      } else {
        // Vertical swipe
        if (Math.abs(deltaY) > minSwipeDistance) {
          const direction = deltaY > 0 ? 'down' : 'up';
          console.log('useMobileControls: Vertical swipe detected:', direction);
          onDirectionChange(direction);
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
    console.log('useMobileControls: isEnabled changed to:', isEnabled);
    
    if (isEnabled) {
      console.log('useMobileControls: Adding touch event listeners');
      // 设置 passive: false 来允许 preventDefault
      document.addEventListener('touchstart', handleTouchStart, { passive: false });
      return () => {
        console.log('useMobileControls: Removing touch event listeners');
        document.removeEventListener('touchstart', handleTouchStart);
      };
    }
  }, [handleTouchStart, isEnabled]);
};
