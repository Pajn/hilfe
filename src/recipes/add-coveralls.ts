import {Recipe} from '../entities'

export const recipe: Recipe = {
  name: 'add-coveralls',
  description: 'Adds Coveralls support',
  arguments: [
    {
      type: 'input',
      name: 'command',
      message: 'What command should be used to pipe lcov data from?',
      default: 'cat coverage/lcov.info',
    },
    {
      type: 'confirm',
      name: 'addTravis',
      message: 'Should a post build action be added to your .travis.yml?',
      default: true,
      when: project => project.hasFile('.travis.yml'),
    },
  ],
  async run({command, addTravis}, project) {
    await project.npmAdd('coveralls', {isDev: true})
    await project.patchJson('package.json', packageJson => {
      packageJson.scripts = packageJson.scripts || {}
      packageJson.scripts['report-coverage'] = `${command} | coveralls`
    })

    if (addTravis) {
      const reportCommand = (await project.useYarn)
        ? 'yarn report-coverage'
        : 'npm run report-coverage'

      await project.patchYaml('.travis.yml', content => {
        if (Array.isArray(content.after_success)) {
          content.after_success.push(reportCommand)
        } else if (typeof content.after_success === 'string') {
          content.after_success = [content.after_success, reportCommand]
        } else {
          content.after_success = reportCommand
        }
      })
      console.log('')
      console.log(
        'A report-coverage script has been added to your package.json',
      )
      console.log('which Travis will run after a build succeeds.')
      console.log(
        'Now go to https://coveralls.io/repos/new to enable the project.',
      )
    } else {
      console.log('')
      console.log(
        'A report-coverage script has been added to your package.json',
      )
      console.log('Set up your CI to run that after a build succeeds,')
      console.log(
        'then go to https://coveralls.io/repos/new and enable the project.',
      )
    }
  },
}
