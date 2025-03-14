import {debug, endGroup, getInput, setFailed, startGroup} from '@actions/core'
import {context} from '@actions/github'
import tinify from 'tinify'
import Git from './git'
import Images from './images'

async function run(): Promise<void> {
  try {
    tinify.key = getInput('api_key', {required: true})
    const git = new Git({
      token: getInput('github_token', {required: true}),
      context
    })

    startGroup('Collecting affected images')
    const files = await git.getFiles()
    const images = new Images()

    for (const file of files) {
      images.addFile(file.filename)
    }
    endGroup()

    startGroup('Compressing images')
    const compressedImages = []

    for (const image of images) {
      const compressed = await image.compress()

      if (compressed) {
        compressedImages.push(image)
      }
    }
    endGroup()

    if (compressedImages.length) {
      startGroup('Committing changes')
      await git.commit({
        files: compressedImages,
        userName: getInput('commit_user_name'),
        userEmail: getInput('commit_user_email')
      })
      endGroup()
    }
  } catch (error) {
    setFailed(error instanceof Error ? error.message : String(error))

    if (error instanceof Error && error.stack) {
      debug(error.stack)
    }
  }
}

run()
