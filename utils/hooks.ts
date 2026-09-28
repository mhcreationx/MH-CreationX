import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Debounce hook - delays updating value until user stops typing
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 500ms)
 * @returns Debounced value
 */
export const useDebounce = <T>(value: T, delay: number = 500): T => {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};

/**
 * LocalStorage hook with automatic JSON serialization
 * @param key - LocalStorage key
 * @param initialValue - Default value if key doesn't exist
 * @returns [storedValue, setValue] tuple
 */
export const useLocalStorage = <T>(
    key: string,
    initialValue: T
): [T, (value: T | ((val: T) => T)) => void] => {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    const setValue = useCallback(
        (value: T | ((val: T) => T)) => {
            try {
                const valueToStore = value instanceof Function ? value(storedValue) : value;
                setStoredValue(valueToStore);
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
            } catch (error) {
                console.error(`Error setting localStorage key "${key}":`, error);
            }
        },
        [key, storedValue]
    );

    return [storedValue, setValue];
};

/**
 * Media query hook for responsive design
 * @param query - CSS media query string
 * @returns Boolean indicating if media query matches
 */
export const useMediaQuery = (query: string): boolean => {
    const [matches, setMatches] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.matchMedia(query).matches;
        }
        return false;
    });

    useEffect(() => {
        const mediaQuery = window.matchMedia(query);
        const handler = (event: MediaQueryListEvent) => setMatches(event.matches);

        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, [query]);

    return matches;
};

/**
 * Previous value hook - returns previous value of a variable
 * @param value - Current value
 * @returns Previous value
 */
export const usePrevious = <T>(value: T): T | undefined => {
    const ref = useRef<T | undefined>(undefined);

    useEffect(() => {
        ref.current = value;
    }, [value]);

    return ref.current;
};

/**
 * Click outside hook - triggers callback when clicking outside element
 * @param callback - Function to call when clicking outside
 * @returns Ref to attach to the element
 */
export const useClickOutside = <T extends HTMLElement = HTMLElement>(
    callback: () => void
): React.RefObject<T | null> => {
    const ref = useRef<T>(null);

    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                callback();
            }
        };

        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [callback]);

    return ref;
};

/**
 * Async state hook - handles loading, error, and data states
 * @returns State object and execute function for async operations
 */
export const useAsync = <T, E = Error>() => {
    const [state, setState] = useState<{
        loading: boolean;
        data: T | null;
        error: E | null;
    }>({
        loading: false,
        data: null,
        error: null
    });

    const execute = useCallback(async (asyncFunction: () => Promise<T>) => {
        setState({ loading: true, data: null, error: null });
        try {
            const data = await asyncFunction();
            setState({ loading: false, data, error: null });
            return data;
        } catch (error) {
            setState({ loading: false, data: null, error: error as E });
            throw error;
        }
    }, []);

    return { ...state, execute };
};
