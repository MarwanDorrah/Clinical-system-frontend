export function saveScrollPosition(key: string): void {
  if (typeof window === 'undefined') return;
  
  const scrollData = {
    x: window.scrollX,
    y: window.scrollY,
    timestamp: Date.now(),
  };
  
  sessionStorage.setItem(`scroll_${key}`, JSON.stringify(scrollData));
}

export function restoreScrollPosition(key: string, maxAge: number = 30000): boolean {
  if (typeof window === 'undefined') return false;
  
  const saved = sessionStorage.getItem(`scroll_${key}`);
  if (!saved) return false;
  
  try {
    const scrollData = JSON.parse(saved);
    const age = Date.now() - scrollData.timestamp;
    
    if (age > maxAge) {
      sessionStorage.removeItem(`scroll_${key}`);
      return false;
    }
    
    window.scrollTo(scrollData.x, scrollData.y);
    return true;
  } catch (error) {
    console.error('Failed to restore scroll position:', error);
    return false;
  }
}

export function clearScrollPositions(): void {
  if (typeof window === 'undefined') return;
  
  const keys = Object.keys(sessionStorage);
  keys.forEach(key => {
    if (key.startsWith('scroll_')) {
      sessionStorage.removeItem(key);
    }
  });
}

export function scrollToElement(elementId: string, offset: number = 0): void {
  if (typeof window === 'undefined') return;
  
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const top = element.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({
    top,
    behavior: 'smooth',
  });
}

export function scrollToTop(): void {
  if (typeof window === 'undefined') return;
  
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
}

export function getScrollPosition(): { x: number; y: number } {
  if (typeof window === 'undefined') return { x: 0, y: 0 };
  
  return {
    x: window.scrollX,
    y: window.scrollY,
  };
}

export function isInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

export function scrollIntoViewIfNeeded(element: HTMLElement, offset: number = 0): void {
  if (!isInViewport(element)) {
    const top = element.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({
      top,
      behavior: 'smooth',
    });
  }
}
