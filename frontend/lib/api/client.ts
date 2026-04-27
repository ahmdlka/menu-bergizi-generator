// const BASE_URL = "https://fakestoreapi.com"

// export async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
//   const res = await fetch(`${BASE_URL}${endpoint}`, {
//     ...options,
//     headers: {
//       "Content-Type": "application/json",
//       ...(options?.headers || {}),
//     },
//   })

//   if (!res.ok) {
//     throw new Error("API Error")
//   }

//   return res.json()
// }


export async function apiClient<T>(endpoint: string): Promise<T> {
  const res = await fetch(endpoint)

  if (!res.ok) {
    throw new Error("API Error")
  }

  return res.json()
}