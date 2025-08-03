import { useInfiniteQuery } from "@tanstack/react-query"
import { checkInService, CheckInFilters } from "../services/checkins"

export interface CheckInPage {
  number: number
  totalPages: number
  // add other properties as needed
}

export const useCheckInsInfinite = (filters: CheckInFilters, activeTab: string) => {
  return useInfiniteQuery({
    queryKey: ['checkins', filters, activeTab],
    queryFn: async ({ pageParam = 0 }) => {
      const queryFilters: CheckInFilters = { 
        ...filters, 
        page: pageParam as number, 
        total: 20 
      }
      
      if (filters.name?.trim() === "") queryFilters.name = undefined
      if (activeTab === "ONLY ME") queryFilters.me = true
      if (activeTab === "PENDING/REJECT") queryFilters.verificationStatus = "PENDING,REJECTED"
      if (activeTab === "FAKE") queryFilters.verificationStatus = "FAKE"

      return await checkInService.getCheckInsBySpec(queryFilters)
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage: CheckInPage) => {
      const { number, totalPages } = lastPage
      return number + 1 < totalPages ? number + 1 : undefined
    },
  })
}
