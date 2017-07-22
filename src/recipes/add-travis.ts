import {Recipe} from '../entities'

export const recipe: Recipe = {
  name: 'add-travis',
  description: 'Adds Travis CI build support',
  arguments: [
    {
      type: 'input',
      name: 'install',
      message: 'What command should Travis use to install dependencies?',
      default: async project =>
        (await project.useYarn) ? 'yarn' : 'npm install',
    },
    {
      type: 'input',
      name: 'test',
      message: 'What command should Travis use to run the tests?',
      default: async project =>
        (await project.useYarn) ? 'yarn test' : 'npm run test',
    },
    {
      type: 'confirm',
      name: 'cacheYarn',
      message: 'Should Travis cache the Yarn cache?',
      default: true,
      when: project => project.useYarn,
    },
    {
      type: 'confirm',
      name: 'cacheNodeModules',
      message: 'Should Travis cache the node_modules directory?',
      default: true,
      when: (_, answers) => !answers.cacheYarn,
    },
  ],
  async run({install, test, cacheYarn, cacheNodeModules}, project) {
    let travisYml = `language: node_js
node_js:
  - "node"

install: ${install}
script: ${test}
`
    if (cacheYarn) {
      travisYml += '\ncache: yarn\n'
    } else if (cacheNodeModules) {
      travisYml += `
cache:
  directories:
    - "node_modules"
`
    }

    await project.addFile('.travis.yml', travisYml)

    console.log('')
    console.log(
      'A .travis.yml file have been added to the project You should now',
    )
    console.log('go to https://travis-ci.org/profile and enable the project.')
  },
}
