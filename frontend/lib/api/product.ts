import { products } from "@/fakedata/fakeproduct"
import { Product, Category } from "@/types/product"

export const ProductAPI = {
  getAll: async (): Promise<Product[]> => {
    return products
  },

  getById: async (id: string): Promise<Product | undefined> => {
    return products.find((p) => p.id === Number(id))
  },

  getCategories: async (): Promise<Category[]> => {
    const uniqueCategoryNames = [...new Set(products.map((p) => p.category))];
    
    return uniqueCategoryNames.map((name, index) => ({
      id: index + 1,
      name: name
    }));
  },

  getByCategory: async (category: string): Promise<Product[]> => {
    return products.filter((p) => p.category === category)
  },
}