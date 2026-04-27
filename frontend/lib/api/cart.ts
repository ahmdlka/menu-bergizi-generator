import { CartPayload } from "@/types/cart"

export const CartAPI = {
  add: async (payload: CartPayload) => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(payload), 500)
    })
  },
}