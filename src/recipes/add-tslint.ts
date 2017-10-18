import chalk from 'chalk'
import {Recipe} from '../entities'

export const recipe: Recipe = {
  name: 'add-tslint',
  description: 'Adds linting with TS lint',
  arguments: [
    {
      type: 'input',
      name: 'preset',
      message: 'What preset do you want to use?',
    },
    {
      type: 'confirm',
      name: 'vscode',
      message: 'Do you want to add VS Code settings to autofix issues on save?',
      when: async project =>
        !(
          (await project.hasFile('.vscode')) ||
          (await project.getSetting('editors.vscode'))
        ),
      default: true,
    },
  ],
  async run({preset, vscode = true}, project) {
    await project.npmAdd('tslint', {isDev: true})
    await project.npmAdd(preset, {isDev: true})
    let scriptName: string = ''
    await project.patchJson('package.json', packageJson => {
      packageJson.scripts = packageJson.scripts || {}
      scriptName = packageJson.scripts.lint ? 'lint:tslint' : 'lint'
      packageJson.scripts[scriptName] = `tslint`
    })
    await project.patchJson(
      'tslint.json',
      tslintSettings => {
        tslintSettings['extends'] = [preset]
      },
      {defaultJson: {}},
    )

    if (vscode) {
      await project.patchJson(
        '.vscode/settings.json',
        vscodeSettings => {
          vscodeSettings['tslint.autoFixOnSave'] = true
        },
        {defaultJson: {}},
      )
    }

    const command = project.useYarn
      ? `yarn ${scriptName}`
      : `npm run ${scriptName}`
    console.log('')
    console.log('tslint have been added to the project.')
    console.log('')
    console.log(`You can now lint your files with ${chalk.cyan(command)}`)
    if (vscode) {
      console.log(
        'Your files will also be automatically fixed on save when possible',
      )
    }
  },
}
