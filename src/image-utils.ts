import {format} from 'bytes'

export function getCompressionSummary(sizes: number[]): string {
  const before = sizes[0]
  const after = sizes[1]

  return `${format(after - before)} (-${Math.floor(
    100 * (1 - after / before)
  )}%)`
}
