import { useWishlist, type WishlistedCourse } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";
import { useAuthModal } from "../context/AuthModalContext";

export function useProtectedWishlist() {
  const { toggle, isWishlisted, items, count } = useWishlist();
  const { isAuthenticated } = useAuth();
  const { openLogin } = useAuthModal();

  const protectedToggle = (course: WishlistedCourse) => {
    if (!isAuthenticated) {
      openLogin();
      return;
    }
    toggle(course);
  };

  return { toggle: protectedToggle, isWishlisted, items, count };
}
