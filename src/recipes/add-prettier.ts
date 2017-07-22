import chalk from 'chalk'
import {Recipe} from '../entities'

export const recipe: Recipe = {
  name: 'add-prettier',
  description: 'Adds the prettier formatter to the project',
  arguments: [
    {
      type: 'confirm',
      name: 'vscode',
      message: 'Do you want to add VS Code settings?',
      when: async project =>
        !(
          (await project.hasFile('.vscode')) ||
          (await project.getSetting('editors.vscode'))
        ),
      default: true,
    },
  ],
  async run({vscode = true}, project) {
    await project.npmAdd('prettier', {isDev: true})
    await project.patchJson('package.json', packageJson => {
      packageJson.scripts = packageJson.scripts || {}
      packageJson.scripts.format = `prettier --write --single-quote --trailing-comma all --no-bracket-spacing --no-semi src/**/*.{js,jsx,ts,tsx}`
    })

    if (vscode) {
      await project.patchJson(
        '.vscode/settings.json',
        vscodeSettings => {
          vscodeSettings['editor.formatOnSave'] = true
          vscodeSettings['prettier.singleQuote'] = true
          vscodeSettings['prettier.trailingComma'] = 'all'
          vscodeSettings['prettier.bracketSpacing'] = false
          vscodeSettings['prettier.semi'] = false
        },
        {defaultJson: {}},
      )
    }

    const command = project.useYarn ? 'yarn format' : 'npm run format'
    console.log('')
    console.log('prettier have been added to the project.')
    console.log('')
    console.log(`You can now format your files with ${chalk.cyan(command)}`)
    if (vscode) {
      console.log('Your files will also be automatically formatted on save')
    }
  },
}
