import chalk from 'chalk'
import {resolve, dirname} from 'path'
import {pathExists, writeFile, readJson, writeJson, ensureDir} from 'fs-extra'
import spawn from 'cross-spawn-promise'

export class Project {
  constructor(private rootDir: string) {}

  get useYarn() {
    return pathExists(this.relativePath('yarn.lock'))
  }

  relativePath(path: string) {
    return resolve(this.rootDir, path)
  }

  cmd(command: string, args: string[]): Promise<any> {
    console.log('Running', chalk.grey(`${command} ${args.join(' ')}`))
    return spawn(command, args, {cwd: this.rootDir} as any)
  }

  async hasFile(path: string): Promise<boolean> {
    return pathExists(this.relativePath(path))
  }

  async readJson(path: string): Promise<any> {
    return readJson(this.relativePath(path))
  }

  async patchJson(
    path: string,
    patcher: (json: any) => void,
    {defaultJson, mkdir = true}: {defaultJson?: any; mkdir?: boolean} = {},
  ): Promise<void> {
    path = this.relativePath(path)
    const exists = await pathExists(path)

    let content
    if (exists) {
      content = await readJson(path)
    } else {
      if (!defaultJson) throw `File ${path} does not exist`
      content = defaultJson
    }

    patcher(content)

    if (mkdir && !exists) {
      await ensureDir(dirname(path))
    }

    await writeJson(path, content, {spaces: 2})
  }

  async addFile(
    path: string,
    content: string,
    {stategy = 'error'}: {stategy?: 'overwrite' | 'error' | 'ignore'} = {},
  ): Promise<void> {
    path = this.relativePath(path)
    const exists = await pathExists(path)

    if (exists && stategy === 'ignore') return
    if (exists && stategy === 'error') throw `File ${path} exists`

    await writeFile(path, content)
  }

  async npmAdd(
    packages: string | string[],
    {isDev = false, isExact = false}: {isDev?: boolean; isExact?: boolean} = {},
  ): Promise<void> {
    if (await this.useYarn) {
      const args = [
        'add',
        (isDev && '--dev') as string,
        (isExact && '--exact') as string,
      ]
        .concat(packages)
        .filter(arg => arg)

      await this.cmd('yarn', args)
    } else {
      const args = [
        'install',
        isDev ? '--save-dev' : '--save',
        (isExact && '--save-exact') as string,
      ]
        .concat(packages)
        .filter(arg => arg)

      await this.cmd('npm', args)
    }
  }

  async getSetting(_: string): Promise<any> {
    return null
  }
}
