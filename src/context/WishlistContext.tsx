import { createContext, useCallback, useContext, useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "./AuthContext";

export interface WishlistedCourse {
  id: number;
  slug?: string;
  title: string;
  thumbnail_url: string | null;
  price: string;
  level: string;
  average_rating?: number | null;
  reviews_count?: number;
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

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [items, setItems] = useState<WishlistedCourse[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      setItems([]);
      return;
    }
    api.get<{ data: WishlistedCourse[] }>("/users/wishlist")
      .then(({ data }) => setItems(data.data))
      .catch(() => setItems([]));
  }, [isAuthenticated, user?.id]);

  const toggle = useCallback((course: WishlistedCourse) => {
    // Optimistic update, rolled back if the request fails.
    setItems((prev) =>
      prev.some((c) => c.id === course.id) ? prev.filter((c) => c.id !== course.id) : [...prev, course]
    );
    api.post(`/courses/${course.id}/wishlist/toggle`).catch(() => {
      setItems((prev) =>
        prev.some((c) => c.id === course.id) ? prev.filter((c) => c.id !== course.id) : [...prev, course]
      );
    });
  }, []);

  const isWishlisted = useCallback((id: number) => items.some((c) => c.id === id), [items]);

  return (
    <WishlistContext.Provider value={{ items, toggle, isWishlisted, count: items.length }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
