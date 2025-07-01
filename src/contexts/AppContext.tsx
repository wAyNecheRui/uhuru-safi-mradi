
import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { useCache } from '@/hooks/useCache';

interface AppState {
  user: {
    id: string | null;
    name: string | null;
    email: string | null;
    role: 'citizen' | 'contractor' | 'government' | null;
    preferences: {
      language: 'en' | 'sw';
      theme: 'light' | 'dark' | 'system';
      notifications: boolean;
    };
  };
  ui: {
    sidebarOpen: boolean;
    mobileMenuOpen: boolean;
    loading: boolean;
    error: string | null;
  };
  data: {
    projects: any[];
    reports: any[];
    contractors: any[];
  };
}

type AppAction =
  | { type: 'SET_USER'; payload: Partial<AppState['user']> }
  | { type: 'SET_LANGUAGE'; payload: 'en' | 'sw' }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' | 'system' }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'TOGGLE_MOBILE_MENU' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_DATA'; payload: { key: keyof AppState['data']; data: any[] } }
  | { type: 'RESET_STATE' };

const initialState: AppState = {
  user: {
    id: null,
    name: null,
    email: null,
    role: null,
    preferences: {
      language: 'en',
      theme: 'system',
      notifications: true
    }
  },
  ui: {
    sidebarOpen: false,
    mobileMenuOpen: false,
    loading: false,
    error: null
  },
  data: {
    projects: [],
    reports: [],
    contractors: []
  }
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
    
    case 'SET_LANGUAGE':
      return {
        ...state,
        user: {
          ...state.user,
          preferences: {
            ...state.user.preferences,
            language: action.payload
          }
        }
      };
    
    case 'SET_THEME':
      return {
        ...state,
        user: {
          ...state.user,
          preferences: {
            ...state.user.preferences,
            theme: action.payload
          }
        }
      };
    
    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        ui: { ...state.ui, sidebarOpen: !state.ui.sidebarOpen }
      };
    
    case 'TOGGLE_MOBILE_MENU':
      return {
        ...state,
        ui: { ...state.ui, mobileMenuOpen: !state.ui.mobileMenuOpen }
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        ui: { ...state.ui, loading: action.payload }
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        ui: { ...state.ui, error: action.payload }
      };
    
    case 'SET_DATA':
      return {
        ...state,
        data: {
          ...state.data,
          [action.payload.key]: action.payload.data
        }
      };
    
    case 'RESET_STATE':
      return initialState;
    
    default:
      return state;
  }
};

interface AppContextType {
  state: AppState;
  actions: {
    setUser: (user: Partial<AppState['user']>) => void;
    setLanguage: (language: 'en' | 'sw') => void;
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
    toggleSidebar: () => void;
    toggleMobileMenu: () => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setData: (key: keyof AppState['data'], data: any[]) => void;
    resetState: () => void;
  };
  getText: (en: string, sw: string) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { get, set } = useCache<AppState>();

  // Load state from cache on mount
  useEffect(() => {
    const cachedState = get('appState');
    if (cachedState) {
      dispatch({ type: 'SET_USER', payload: cachedState.user });
      // Don't restore UI state from cache
    }
  }, [get]);

  // Save state to cache when it changes
  useEffect(() => {
    set('appState', state);
  }, [state, set]);

  const actions = {
    setUser: useCallback((user: Partial<AppState['user']>) => {
      dispatch({ type: 'SET_USER', payload: user });
    }, []),
    
    setLanguage: useCallback((language: 'en' | 'sw') => {
      dispatch({ type: 'SET_LANGUAGE', payload: language });
    }, []),
    
    setTheme: useCallback((theme: 'light' | 'dark' | 'system') => {
      dispatch({ type: 'SET_THEME', payload: theme });
    }, []),
    
    toggleSidebar: useCallback(() => {
      dispatch({ type: 'TOGGLE_SIDEBAR' });
    }, []),
    
    toggleMobileMenu: useCallback(() => {
      dispatch({ type: 'TOGGLE_MOBILE_MENU' });
    }, []),
    
    setLoading: useCallback((loading: boolean) => {
      dispatch({ type: 'SET_LOADING', payload: loading });
    }, []),
    
    setError: useCallback((error: string | null) => {
      dispatch({ type: 'SET_ERROR', payload: error });
    }, []),
    
    setData: useCallback((key: keyof AppState['data'], data: any[]) => {
      dispatch({ type: 'SET_DATA', payload: { key, data } });
    }, []),
    
    resetState: useCallback(() => {
      dispatch({ type: 'RESET_STATE' });
    }, [])
  };

  const getText = useCallback((en: string, sw: string) => {
    return state.user.preferences.language === 'sw' ? sw : en;
  }, [state.user.preferences.language]);

  const value: AppContextType = {
    state,
    actions,
    getText
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
