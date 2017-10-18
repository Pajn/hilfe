import {Answers, ChoiceType} from 'inquirer'
import {Project} from './hilfer-lib'

export type Awaitable<T> = T | Promise<T>

export interface Question {
  /**
   * Type of the prompt.
   * Possible values:
   * <ul>
   *      <li>input</li>
   *      <li>confirm</li>
   *      <li>list</li>
   *      <li>rawlist</li>
   *      <li>password</li>
   * </ul>
   * @default: 'input'
   */
  type?:
    | 'input'
    | 'confirm'
    | 'list'
    | 'rawlist'
    | 'password'
    | 'checkbox'
    | 'editor'
  /**
   * The name to use when storing the answer in the anwers hash.
   */
  name: string
  /**
   * The question to print. If defined as a function,
   * the first parameter will be the current inquirer session answers.
   */
  message: string | ((project: Project, answers: Answers) => Awaitable<string>)
  /**
   * Default value(s) to use if nothing is entered, or a function that returns the default value(s).
   * If defined as a function, the first parameter will be the current inquirer session answers.
   */
  default?:
    | object
    | boolean
    | number
    | string
    | ((project: Project, answers: Answers) => Awaitable<any>)
  /**
   * Choices array or a function returning a choices array. If defined as a function,
   * the first parameter will be the current inquirer session answers.
   * Array values can be simple strings, or objects containing a name (to display) and a value properties
   * (to save in the answers hash). Values can also be a Separator.
   */
  choices?:
    | Array<ChoiceType>
    | ((project: Project, answers: Answers) => Awaitable<Array<ChoiceType>>)
  /**
   * Receive the user input and should return true if the value is valid, and an error message (String)
   * otherwise. If false is returned, a default error message is provided.
   */
  validate?(
    input: string,
    project: Project,
    answers?: Answers,
  ): Awaitable<boolean | string>
  /**
   * Receive the user input and return the filtered value to be used inside the program.
   * The value returned will be added to the Answers hash.
   */
  filter?(project: Project, input: string): Awaitable<string>
  /**
   * Receive the current user answers hash and should return true or false depending on whether or
   * not this question should be asked. The value can also be a simple boolean.
   */
  when?: boolean | ((project: Project, answers: Answers) => Awaitable<boolean>)
  paginated?: boolean
  /**
   * Change the number of lines that will be rendered when using list, rawList, expand or checkbox.
   */
  pageSize?: number
  /**
   * Add a mask when password will entered
   */
  mask?: string
}

export type Recipe = {
  name: string
  description: string
  arguments: Array<Question>
  run: (args: any, project: Project) => void | Promise<void>
}
