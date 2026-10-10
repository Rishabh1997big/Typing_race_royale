import { describe, expect, it } from 'vitest'
import { RACE_DURATION_SECONDS } from '@trr/shared'

describe('@trr/shared alias', () => {
  it('resolves shared constants', () => {
    expect(RACE_DURATION_SECONDS).toBe(60)
  })
})
