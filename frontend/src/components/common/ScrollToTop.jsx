import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop component - scrolls window to top on every route change
 * Place this inside the router (inside AppRoutes or AppLayout) to enable
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top instantly on route change
    window.scrollTo(0, 0);

    // Also scroll the main content container if it exists
    const mainContainer = document.querySelector('.main-content') ||
                         document.querySelector('.page-container') ||
                         document.querySelector('[data-main-content]') ||
                         document.body;
    if (mainContainer && mainContainer !== document.body) {
      mainContainer.scrollTop = 0;
    }
  }, [pathname]);

  return null;
}

export default ScrollToTop;