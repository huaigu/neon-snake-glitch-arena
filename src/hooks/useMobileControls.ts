
import { useEffect, useCallback } from 'react';

interface UseMobileControlsProps {
  onDirectionChange: (direction: 'up' | 'down' | 'left' | 'right') => void;
  isEnabled: boolean;
}

export const useMobileControls = ({ onDirectionChange, isEnabled }: UseMobileControlsProps) => {
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!isEnabled) return;
    
    const touch = e.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;

    const handleTouchEnd = (endEvent: TouchEvent) => {
      const endTouch = endEvent.changedTouches[0];
      const endX = endTouch.clientX;
      const endY = endTouch.clientY;
      
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const minSwipeDistance = 50;
      
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
      
      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchend', handleTouchEnd);
  }, [onDirectionChange, isEnabled]);

  useEffect(() => {
    if (isEnabled) {
      document.addEventListener('touchstart', handleTouchStart, { passive: true });
      return () => document.removeEventListener('touchstart', handleTouchStart);
    }
  }, [handleTouchStart, isEnabled]);
};
