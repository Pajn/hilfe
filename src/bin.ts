#!/usr/bin/env node

import {recipe as coveralls} from './recipes/add-coveralls'
import {recipe as license} from './recipes/add-license'
import {recipe as prettier} from './recipes/add-prettier'
import {recipe as travis} from './recipes/add-travis'
import {Question, Recipe} from './entities'
import {Project} from './hilfer-lib'
import {realpath} from 'fs-extra'
import program from 'commander'
import {
  createPromptModule,
  Question as InquirerQuestion,
  Answers,
} from 'inquirer'

const mapQuestion = (project: Project) => (
  question: Question,
): InquirerQuestion =>
  Object.assign(
    {},
    question,
    typeof question.choices === 'function' && {
      choices: (answers: Answers) =>
        typeof question.choices === 'function' &&
        question.choices(project, answers),
    },
    typeof question.default === 'function' && {
      default: (answers: Answers) =>
        typeof question.default === 'function' &&
        question.default(project, answers),
    },
    typeof question.filter === 'function' && {
      filter: (input: string) =>
        typeof question.filter === 'function' &&
        question.filter(project, input),
    },
    typeof question.validate === 'function' && {
      validate: (input: string, answers: Answers) =>
        typeof question.validate === 'function' &&
        question.validate(input, project, answers),
    },
    typeof question.when === 'function' && {
      when: (answers: Answers) =>
        typeof question.when === 'function' && question.when(project, answers),
    },
  )

function loadRecipes(_: Project): Recipe[] {
  return [license, prettier, travis, coveralls]
}

async function main() {
  program
    .version(require('../package.json').version)
    .usage('[options] <recipe>')
    .option('-l, --list', 'Lists all recipes')

  const projectDir = await realpath('.')
  const project = new Project(projectDir)

  const recipes = await loadRecipes(project)

  program.parse(process.argv)

  if (program.list) {
    console.log('')
    console.log('Avalible recipes:')
    console.log('')
    recipes.forEach(recipe => {
      console.log(`  ${recipe.name}     - ${recipe.description}`)
    })
    process.exit(0)
  }

  const [recipeName] = program.args

  const recipe = recipes.find(recipe => recipe.name === recipeName)

  if (recipe) {
    if (recipe.arguments) {
      const prompt = createPromptModule()
      const answers = await prompt(recipe.arguments.map(mapQuestion(project)))
      await recipe.run(answers, project)
    }
  } else {
    console.error(
      `no such recipe ${recipeName}. Use --list to list all recipes`,
    )
  }
}

main().catch(error => {
  throw error
})
