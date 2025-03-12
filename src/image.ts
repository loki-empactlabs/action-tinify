import {debug, info} from '@actions/core'
import {statSync} from 'fs'
import tinify from 'tinify'
import {format} from 'bytes'
import {getCompressionSummary} from './image-utils'
import Exif, {Tag} from './exif'

/** Software Exif value used to maintain state */
const SOFTWARE_TAG = 'tinify.com'

export default class Image {
  private readonly exif: Exif
  private readonly sizes: number[] = []

  constructor(private readonly filename: string) {
    this.exif = new Exif(filename)
  }

  async compress(): Promise<boolean> {
    info(`[${this.filename}] Checking Exif state`)

    if (SOFTWARE_TAG === (await this.exif.get([Tag.Software])).trim()) {
      info(`[${this.filename}] Skipping already compressed image`)
      return false
    }

    this.setSize()

    info(`[${this.filename}] Compressing image`)
    const source = tinify.fromFile(this.filename)
    await source.toFile(this.filename)

    info(`[${this.filename}] Setting Exif state`)
    await this.exif.set([
      [Tag.Software, SOFTWARE_TAG],
      [Tag.XMPToolkit, '']
    ])

    this.setSize()

    return true
  }

  getFilename(): string {
    return this.filename
  }

  getCompressionSummary(): string {
    return getCompressionSummary(this.sizes)
  }

  private setSize(): void {
    const size = statSync(this.filename).size

    this.sizes.push(size)

    debug(`[${this.filename}] ${format(size)}`)
  }
}
