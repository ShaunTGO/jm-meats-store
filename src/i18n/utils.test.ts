import { test, expect } from 'vitest'

import { combine } from './utils'

test('"combine" should not accept empty array as input', () => {
  expect(() => combine([], [], (a, b) => `${a}-${b}`)).toThrow()
  expect(() => combine([], ['1', '2'], (a, b) => `${a}-${b}`)).toThrow()
  expect(() => combine(['it', 'en'], [], (a, b) => `${a}-${b}`)).toThrow()
})

test('"combine" should combines two arrays into one, using a callback method', () => {
  const result1 = combine(['it', 'en'], ['1', '2'], (a, b) => `${a}-${b}`)
  expect(result1).toStrictEqual(['it-1', 'it-2', 'en-1', 'en-2'])

  const result2 = combine([10, 9], [1, 2], (a, b) => a - b)
  expect(result2).toStrictEqual([9, 8, 8, 7])
})
