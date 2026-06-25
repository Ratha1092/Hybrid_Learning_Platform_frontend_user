import api from "../api/axios";

export interface CouponValidation {
  code: string;
  type: string;
  value: number;
  discount_amount: number;
  final_amount: number;
}

export const couponService = {
  validate: (code: string, course_id: number) =>
    api.post<CouponValidation>("/coupons/validate", { code, course_id }),
};
