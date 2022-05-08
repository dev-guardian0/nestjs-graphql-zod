import * as zod from 'zod'

import { IModelFromZodOptions } from '../model-from-zod'
import { getAndIncreaseRegisterCount } from './constants'

/**
 * Extracts the name and description from a zod object input.
 *
 * @export
 * @template T The zod object input type.
 * @param {T} zodInput The zod object input.
 * @param {IModelFromZodOptions<T>} options The options for the operation.
 * @return {{ name: string, description: string }} An object containing
 * normalized name and description info. 
 */
export function extractNameAndDescription<T extends zod.AnyZodObject>(zodInput: T, options: IModelFromZodOptions<T>) {
  let { name } = options
  let { description } = zodInput

  if (!name) {
    if (description) {
      const match = description.match(/(\w+):\s*?(.*)+/)
      if (match) {
        const [ _full, className, actualDescription ] = match

        name = className
        description = actualDescription

        return { name, description }
      }
    }

    name = `ClassFromZod_${getAndIncreaseRegisterCount()}`
  }

  return { name, description }
}