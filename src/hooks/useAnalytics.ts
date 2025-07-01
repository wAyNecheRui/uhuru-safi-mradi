
import { useCallback, useEffect, useRef } from 'react';
import { useCache } from './useCache';

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  userId?: string;
  timestamp: number;
}

interface PageView {
  page: string;
  referrer?: string;
  userId?: string;
  timestamp: number;
  duration?: number;
}

interface UserSession {
  sessionId: string;
  userId?: string;
  startTime: number;
  endTime?: number;
  pageViews: PageView[];
  events: AnalyticsEvent[];
}

class AnalyticsManager {
  private session: UserSession;
  private pageStartTime: number = Date.now();
  private cache: ReturnType<typeof useCache>;

  constructor() {
    this.session = {
      sessionId: this.generateSessionId(),
      startTime: Date.now(),
      pageViews: [],
      events: []
    };
  }

  setCache(cache: ReturnType<typeof useCache>) {
    this.cache = cache;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  trackPageView(page: string, userId?: string) {
    const now = Date.now();
    
    // Update previous page view duration
    if (this.session.pageViews.length > 0) {
      const lastPageView = this.session.pageViews[this.session.pageViews.length - 1];
      lastPageView.duration = now - lastPageView.timestamp;
    }

    const pageView: PageView = {
      page,
      referrer: document.referrer,
      userId,
      timestamp: now
    };

    this.session.pageViews.push(pageView);
    this.pageStartTime = now;
    
    this.persistSession();
  }

  trackEvent(name: string, properties?: Record<string, any>, userId?: string) {
    const event: AnalyticsEvent = {
      name,
      properties,
      userId,
      timestamp: Date.now()
    };

    this.session.events.push(event);
    this.persistSession();
  }

  trackUserAction(action: string, element?: string, properties?: Record<string, any>) {
    this.trackEvent('user_action', {
      action,
      element,
      page: window.location.pathname,
      ...properties
    });
  }

  trackPerformance(metric: string, value: number, properties?: Record<string, any>) {
    this.trackEvent('performance_metric', {
      metric,
      value,
      page: window.location.pathname,
      ...properties
    });
  }

  trackError(error: Error, context?: Record<string, any>) {
    this.trackEvent('error', {
      message: error.message,
      stack: error.stack,
      page: window.location.pathname,
      userAgent: navigator.userAgent,
      ...context
    });
  }

  setUserId(userId: string) {
    this.session.userId = userId;
    this.persistSession();
  }

  endSession() {
    this.session.endTime = Date.now();
    
    // Update last page view duration
    if (this.session.pageViews.length > 0) {
      const lastPageView = this.session.pageViews[this.session.pageViews.length - 1];
      lastPageView.duration = Date.now() - lastPageView.timestamp;
    }
    
    this.persistSession();
  }

  getSession(): UserSession {
    return { ...this.session };
  }

  getAnalyticsSummary() {
    const now = Date.now();
    const sessionDuration = now - this.session.startTime;
    
    return {
      sessionId: this.session.sessionId,
      userId: this.session.userId,
      sessionDuration,
      pageViewCount: this.session.pageViews.length,
      eventCount: this.session.events.length,
      averagePageTime: this.session.pageViews.reduce((acc, pv) => acc + (pv.duration || 0), 0) / this.session.pageViews.length,
      mostVisitedPages: this.getMostVisitedPages(),
      topEvents: this.getTopEvents()
    };
  }

  private getMostVisitedPages() {
    const pageCounts = this.session.pageViews.reduce((acc, pv) => {
      acc[pv.page] = (acc[pv.page] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(pageCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([page, count]) => ({ page, count }));
  }

  private getTopEvents() {
    const eventCounts = this.session.events.reduce((acc, event) => {
      acc[event.name] = (acc[event.name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(eventCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  }

  private persistSession() {
    if (this.cache) {
      this.cache.set(`session_${this.session.sessionId}`, this.session);
    }
  }
}

const analyticsManager = new AnalyticsManager();

export const useAnalytics = (userId?: string) => {
  const cache = useCache<UserSession>();
  const managerRef = useRef(analyticsManager);

  useEffect(() => {
    managerRef.current.setCache(cache);
  }, [cache]);

  useEffect(() => {
    if (userId) {
      managerRef.current.setUserId(userId);
    }
  }, [userId]);

  useEffect(() => {
    // Track initial page view
    managerRef.current.trackPageView(window.location.pathname, userId);

    // Track page unload
    const handleUnload = () => {
      managerRef.current.endSession();
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [userId]);

  const trackPageView = useCallback((page: string) => {
    managerRef.current.trackPageView(page, userId);
  }, [userId]);

  const trackEvent = useCallback((name: string, properties?: Record<string, any>) => {
    managerRef.current.trackEvent(name, properties, userId);
  }, [userId]);

  const trackClick = useCallback((element: string, properties?: Record<string, any>) => {
    managerRef.current.trackUserAction('click', element, properties);
  }, []);

  const trackFormSubmit = useCallback((formName: string, properties?: Record<string, any>) => {
    managerRef.current.trackUserAction('form_submit', formName, properties);
  }, []);

  const trackError = useCallback((error: Error, context?: Record<string, any>) => {
    managerRef.current.trackError(error, context);
  }, []);

  const trackPerformance = useCallback((metric: string, value: number) => {
    managerRef.current.trackPerformance(metric, value);
  }, []);

  const getAnalyticsSummary = useCallback(() => {
    return managerRef.current.getAnalyticsSummary();
  }, []);

  return {
    trackPageView,
    trackEvent,
    trackClick,
    trackFormSubmit,
    trackError,
    trackPerformance,
    getAnalyticsSummary
  };
};

// Hook for automatic event tracking
export const useAutoTrack = (elementRef: React.RefObject<HTMLElement>, eventName: string) => {
  const { trackClick } = useAnalytics();

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleClick = (e: Event) => {
      trackClick(eventName, {
        target: (e.target as HTMLElement)?.tagName,
        x: (e as MouseEvent).clientX,
        y: (e as MouseEvent).clientY
      });
    };

    element.addEventListener('click', handleClick);
    return () => element.removeEventListener('click', handleClick);
  }, [elementRef, eventName, trackClick]);
};
