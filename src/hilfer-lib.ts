import chalk from 'chalk'
import {resolve, dirname} from 'path'
import {
  pathExists,
  readFile,
  writeFile,
  readJson,
  writeJson,
  ensureDir,
} from 'fs-extra'
import spawn from 'cross-spawn-promise'
import yaml from 'js-yaml'

export type Awaitable<T> = T | Promise<T>

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

  async readFile(path: string): Promise<string> {
    return readFile(this.relativePath(path), 'utf-8')
  }

  async readJson(path: string): Promise<any> {
    return readJson(this.relativePath(path))
  }

  async readYaml(path: string): Promise<any> {
    const content = await this.readFile(path)
    return yaml.safeLoad(content)
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

  async patchYaml(
    path: string,
    patcher: (yaml: any) => void,
    {defaultYaml, mkdir = true}: {defaultYaml?: any; mkdir?: boolean} = {},
  ): Promise<void> {
    const exists = await pathExists(this.relativePath(path))

    let content
    if (exists) {
      content = await this.readYaml(path)
    } else {
      if (!defaultYaml) throw `File ${path} does not exist`
      content = defaultYaml
    }

    patcher(content)

    if (mkdir && !exists) {
      await ensureDir(dirname(path))
    }

    await this.addYamlFile(path, content, {strategy: 'overwrite'})
  }

  async addFile(
    path: string,
    content: string,
    {strategy = 'error'}: {strategy?: 'overwrite' | 'error' | 'ignore'} = {},
  ): Promise<void> {
    path = this.relativePath(path)

    if (strategy !== 'overwrite') {
      const exists = await pathExists(path)

      if (exists && strategy === 'ignore') return
      if (exists && strategy === 'error') throw `File ${path} exists`
    }

    await writeFile(path, content)
  }

  async addYamlFile(
    path: string,
    content: any,
    options: {strategy?: 'overwrite' | 'error' | 'ignore'} = {},
  ): Promise<void> {
    const stringified = yaml.safeDump(content)
    await this.addFile(path, stringified, options)
  }

  async updateFile(
    path: string,
    updater: (content: string) => Awaitable<string>,
  ): Promise<void> {
    const content = await this.readFile(path)
    await writeFile(path, await updater(content))
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
