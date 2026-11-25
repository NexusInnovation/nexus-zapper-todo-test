import { describe, expect, it } from 'vitest'
import enCommon from '../../public/locales/en/common.json'
import enTodos from '../../public/locales/en/todos.json'
import frCommon from '../../public/locales/fr/common.json'
import frTodos from '../../public/locales/fr/todos.json'

type Messages = { [key: string]: string | Messages }

function entries(messages: Messages, prefix = ''): [string, string][] {
  return Object.entries(messages).flatMap(([key, value]) =>
    typeof value === 'string'
      ? [[`${prefix}${key}`, value] as [string, string]]
      : entries(value, `${prefix}${key}.`),
  )
}

const placeholders = (text: string) =>
  [...text.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((match) => match[1]).sort()

describe.each([
  ['common', frCommon, enCommon],
  ['todos', frTodos, enTodos],
])('%s translations', (_namespace, fr, en) => {
  const french = new Map(entries(fr))
  const english = new Map(entries(en))

  it('define the same keys in French and English', () => {
    expect([...english.keys()].sort()).toEqual([...french.keys()].sort())
  })

  it('have no empty text and keep the same interpolations', () => {
    for (const [key, text] of french) {
      expect(text.trim(), key).not.toBe('')
      expect(english.get(key)?.trim(), key).not.toBe('')
      expect(placeholders(english.get(key) ?? ''), key).toEqual(
        placeholders(text),
      )
    }
  })
})
