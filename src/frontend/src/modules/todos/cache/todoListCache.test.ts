import { describe, expect, it } from 'vitest'

import type { Todo, TodoPage } from '../types/Todo'
import {
  appendTodo,
  changeTotalCount,
  findTodo,
  mergeTodoRows,
  removeTodo,
  removeTodoFromPages,
  replaceTodo,
  replaceTodoInPages,
  totalCountOf,
  type TodoListData,
} from './todoListCache'

const todo = (n: number, isDone = false): Todo => ({
  id: `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`,
  title: `Todo ${n}`,
  isDone,
  createdAt: new Date(2026, 0, 1, 0, 0, n),
})

const listOf = (...pages: TodoPage[]): TodoListData => ({
  pages,
  pageParams: pages.map((_, index) => index + 1),
})

const ids = (todos: Todo[]) => todos.map((item) => item.title)

describe('todo list cache', () => {
  it('appends a created Todo after the loaded pages and counts it once', () => {
    const data = listOf({ items: [todo(1), todo(2)], totalCount: 3 })
    const appended = appendTodo(appendTodo([], todo(4)), todo(4))

    expect(ids(mergeTodoRows(data, appended))).toEqual([
      'Todo 1',
      'Todo 2',
      'Todo 4',
    ])
    expect(totalCountOf(changeTotalCount(data, 1))).toBe(4)
  })

  it('does not duplicate a created Todo once a loaded page contains it', () => {
    const data = listOf(
      { items: [todo(1), todo(2)], totalCount: 4 },
      { items: [todo(3), todo(4)], totalCount: 4 },
    )

    expect(ids(mergeTodoRows(data, [todo(4)]))).toEqual([
      'Todo 1',
      'Todo 2',
      'Todo 3',
      'Todo 4',
    ])
  })

  it('keeps the appended Todos after the pages are reloaded', () => {
    const reloaded = listOf({ items: [todo(2), todo(3)], totalCount: 10 })

    expect(ids(mergeTodoRows(reloaded, [todo(9)]))).toEqual([
      'Todo 2',
      'Todo 3',
      'Todo 9',
    ])
  })

  it('replaces a Todo in place, keeping every loaded page and the total', () => {
    const data = listOf(
      { items: [todo(1), todo(2)], totalCount: 4 },
      { items: [todo(3), todo(4)], totalCount: 4 },
    )
    const updated = { ...todo(3, true), title: 'Renamed' }

    const replaced = replaceTodoInPages(data, updated)
    expect(replaced?.pages.map((page) => page.items.length)).toEqual([2, 2])
    expect(mergeTodoRows(replaced, [])).toEqual([
      todo(1),
      todo(2),
      updated,
      todo(4),
    ])
    expect(totalCountOf(replaced)).toBe(4)
    expect(replaceTodo([todo(3)], updated)).toEqual([updated])
    expect(findTodo(replaced, [], todo(3).id)).toEqual(updated)
  })

  it('removes a Todo from the pages and the appended rows', () => {
    const data = listOf({ items: [todo(1), todo(2)], totalCount: 3 })

    const rows = mergeTodoRows(
      changeTotalCount(removeTodoFromPages(data, todo(1).id), -1),
      removeTodo([todo(3)], todo(3).id),
    )
    expect(ids(rows)).toEqual(['Todo 2'])
    expect(
      totalCountOf(changeTotalCount(removeTodoFromPages(data, todo(1).id), -1)),
    ).toBe(2)
  })
})
