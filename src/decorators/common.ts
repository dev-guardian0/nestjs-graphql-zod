import { IModelFromZodOptions, modelFromZod } from '../model-from-zod'
import { decorateWithZodInput } from './decorate-with-zod-input'
import { makeDecoratorFromFactory } from './make-decorator-from-factory'

import type { AnyZodObject } from 'zod'
import type { BaseTypeOptions } from '@nestjs/graphql'

import type { DynamicZodModelClass, GraphQLMDF } from './types'
import type { WrapWithZodOptions } from './zod-options-wrapper.interface'

type BaseOptions<T extends AnyZodObject>
  = WrapWithZodOptions<BaseTypeOptions, T>

/**
 * Returns a method decorator that is built with `zod` validation object.
 *
 * @export
 * @template T The type of the `zod` validation object.
 * @param {T} input The `zod` validation object.
 * @param {(string | BaseOptions<T> | undefined)} nameOrOptions The name or
 * the options.
 *
 * @param {GraphQLMDF<BaseTypeOptions>} graphqlDecoratorFactory The actual
 * decorator factory function.
 *
 * @param {DynamicZodModelClass<T>} model The dynamically built model class from
 * `zod` validation object.
 *
 * @return {MethodDecorator} A method decorator.
 */
export function MethodWithZodModel<T extends AnyZodObject>(
  input: T,
  nameOrOptions: string | BaseOptions<T> | undefined,
  graphqlDecoratorFactory: GraphQLMDF<BaseTypeOptions>,
  model: DynamicZodModelClass<T>
): MethodDecorator {
  return function _ModelWithZod(
    target: Record<PropertyKey, any>,
    methodName: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    let newDescriptor = descriptor || {}

    const originalFunction = descriptor?.value ?? target[ methodName ]
    const decoratedFunction = decorateWithZodInput(originalFunction, input, model)

    newDescriptor.value = decoratedFunction

    if (!descriptor) {
      Object.defineProperty(target, methodName, newDescriptor)
    }

    const methodDecorator = makeDecoratorFromFactory(
      nameOrOptions,
      graphqlDecoratorFactory,
      model
    )

    methodDecorator(target, methodName, newDescriptor)
  }
}

/**
 * Returns a method decorator that is built with `zod` validation object.
 *
 * @export
 * @template T The type of the `zod` validation object.
 * @param {T} input The `zod` validation object.
 * @param {(string | BaseOptions<T> | undefined)} nameOrOptions The name or
 * the options.
 *
 * @param {GraphQLMDF<BaseTypeOptions>} graphqlDecoratorFactory The actual
 * decorator factory function.
 *
 * @return {MethodDecorator} A method decorator.
 */
export function MethodWithZod<T extends AnyZodObject>(
  input: T,
  nameOrOptions: string | BaseOptions<T> | undefined,
  graphqlDecoratorFactory: GraphQLMDF<BaseTypeOptions>
) {
  let zodOptions: IModelFromZodOptions<T> | undefined

  if (typeof nameOrOptions === 'object') {
    zodOptions = nameOrOptions.zod
  }

  return MethodWithZodModel(
    input,
    nameOrOptions,
    graphqlDecoratorFactory,
    modelFromZod(input, zodOptions)
  )
}
