import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { apiFetch } from '@/core/api/apiFetch'
import { parseResponse } from '@/core/api/parseResponse'
import {
  appendedTodosKey,
  mergeTodoRows,
  todoListKey,
  todoPageSize,
  totalCountOf,
  type TodoListData,
} from '../cache/todoListCache'
import { TodoPageSchema, type Todo, type TodoPage } from '../types/Todo'

async function fetchTodoPage(page: number) {
  const response = await apiFetch(
    `/todos?page=${page}&pageSize=${todoPageSize}`,
  )
  if (!response.ok) {
    throw await response.json()
  }
  return parseResponse(TodoPageSchema, await response.json(), 'TodoPage')
}

/** Todos in creation order, page by page ("Afficher plus"), merged with the Todos created here. */
export function useTodoList() {
  const queryClient = useQueryClient()
  const query = useInfiniteQuery<
    TodoPage,
    unknown,
    TodoListData,
    typeof todoListKey,
    number
  >({
    queryKey: todoListKey,
    queryFn: ({ pageParam }) => fetchTodoPage(pageParam),
    initialPageParam: 1,
    getNextPageParam: (_lastPage, _allPages, lastPageParam) =>
      lastPageParam + 1,
    meta: { localErrors: 'all' },
  })
  const { data: appended = [] } = useQuery({
    queryKey: appendedTodosKey,
    queryFn: () => queryClient.getQueryData<Todo[]>(appendedTodosKey) ?? [],
    initialData: [] as Todo[],
    staleTime: Infinity,
    gcTime: Infinity,
  })

  const rows = mergeTodoRows(query.data, appended)
  const totalCount = Math.max(totalCountOf(query.data), rows.length)

  return {
    rows,
    totalCount,
    hasMore: query.isSuccess && rows.length < totalCount,
    isLoading: query.isPending,
    isError: query.isError && !query.data,
    error: query.error,
    isFetchingMore: query.isFetchingNextPage,
    fetchMore: () => query.fetchNextPage(),
  }
}
