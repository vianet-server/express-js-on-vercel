import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { setCache } from '@/store/slices/adminCacheSlice'
import { api } from '@/lib/api'

export function useAdminQuery<T = any>(key: string, path: string, options?: { enabled?: boolean; staleTime?: number }) {
  const dispatch = useAppDispatch()
  const cached = useAppSelector((s) => s.adminCache[key]) as T | undefined
  const staleTime = options?.staleTime ?? 30000

  const query = useQuery<T>({
    queryKey: [key, path],
    queryFn: () => api.get<T>(path),
    staleTime,
    enabled: options?.enabled ?? true,
  })

  useEffect(() => {
    if (query.data) {
      dispatch(setCache({ key, data: query.data }))
    }
  }, [query.data, dispatch, key])

  return { data: cached ?? query.data, loading: query.isLoading, error: query.error, refetch: query.refetch }
}

export function useAdminMutation<T = any>(path: string, options?: { invalidateKeys?: string[]; method?: 'post' | 'put' | 'delete' }) {
  const dispatch = useAppDispatch()
  const { invalidateKeys, method = 'post' } = options ?? {}

  const execute = async (body?: unknown) => {
    let result: T
    switch (method) {
      case 'put':
        result = await api.put<T>(path, body)
        break
      case 'delete':
        result = await api.delete<T>(path)
        break
      default:
        result = await api.post<T>(path, body)
    }
    if (invalidateKeys) {
      for (const k of invalidateKeys) {
        dispatch(setCache({ key: k, data: undefined }))
      }
    }
    return result
  }

  return { execute }
}
