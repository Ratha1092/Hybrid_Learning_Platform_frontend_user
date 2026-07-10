import { createContext, useCallback, useContext, useState } from "react";

export interface WishlistedCourse {
  id: number;
  slug?: string;
  title: string;
  thumbnail_url: string | null;
  price: string;
  level: string;
  instructor?: { name: string } | null;
}

interface WishlistCtx {
  items: WishlistedCourse[];
  toggle: (course: WishlistedCourse) => void;
  isWishlisted: (id: number) => boolean;
  count: number;
}

const WishlistContext = createContext<WishlistCtx>({
  items: [],
  toggle: () => {},
  isWishlisted: () => false,
  count: 0,
});

const STORAGE_KEY = "hl_wishlist";

function load(): WishlistedCourse[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); }
  catch { return []; }
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistedCourse[]>(load);

  const toggle = useCallback((course: WishlistedCourse) => {
    setItems(prev => {
      const next = prev.some(c => c.id === course.id)
        ? prev.filter(c => c.id !== course.id)
        : [...prev, course];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isWishlisted = useCallback((id: number) => items.some(c => c.id === id), [items]);

  return (
    <WishlistContext.Provider value={{ items, toggle, isWishlisted, count: items.length }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
