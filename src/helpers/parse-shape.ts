import * as zod from 'zod'

import { Field, NullableList } from '@nestjs/graphql'

import { IModelFromZodOptions } from '../model-from-zod'
import { buildEnumType } from './build-enum-type'
import { createZodPropertyDescriptor } from './create-zod-property-descriptor'
import { zodToTypeInfo } from './zod-to-type-info'

/**
 * An interface describing a parsed field.
 */
export interface ParsedField {
  /**
   * The key of the parsed property.
   *
   * @type {string}
   */
  key: string
  /**
   * The type of the field of the parsed property.
   * 
   * Can be used for GraphQL @{@link Field} decorator.
   *
   * @type {*}
   */
  fieldType: any
  /**
   * The {@link PropertyDescriptor} of the parsed property.
   *
   * @type {PropertyDescriptor}
   */
  descriptor: PropertyDescriptor

  /**
   * A {@link PropertyDecorator} for decorating fields.
   *
   * @type {PropertyDecorator}
   */
  decorateFieldProperty: PropertyDecorator
}

/**
 * Parses a zod input object with given options.
 *
 * @export
 * @template T The type of the zod object.
 * @param {T} zodInput The zod object input.
 * @param {IModelFromZodOptions<T>} [options={}] The options for the parsing.
 * @return {ParsedField[]} An array of {@link ParsedField}.
 */
export function parseShape<T extends zod.AnyZodObject>(zodInput: T, options: IModelFromZodOptions<T> = {}) {
  const parsedShapes: ParsedField[] = []
  const PARSED_TYPES = [
    zod.ZodArray,
    zod.ZodBoolean,
    zod.ZodString,
    zod.ZodNumber,
    zod.ZodEnum,
    zod.ZodOptional,
    zod.ZodObject,
  ] as const

  for (const _key in zodInput.shape) {
    const key = _key as (keyof T) & string
    const prop = zodInput.shape[ key ]

    let propertyDescriptor: PropertyDescriptor

    if (PARSED_TYPES.some(it => prop instanceof it)) {
      propertyDescriptor = createZodPropertyDescriptor(key, prop, options)
    }
    else {
      throw new Error(`"${key}" cannot be processed`)
    }

    const elementType = zodToTypeInfo(key, prop, options)

    const {
      isNullable,
      isOptional,
      isEnum,
      isOfArray,
      isItemNullable,
      isItemOptional,
    } = elementType

    if (isEnum) {
      buildEnumType(key, elementType, options)
    }

    const { type: fieldType } = elementType

    let defaultValue: typeof prop._def | undefined = prop._def
    let nullable: boolean | NullableList = isNullable || isOptional

    if (isOfArray) {
      if (isItemNullable || isItemOptional) {
        if (nullable) {
          nullable = 'itemsAndList'
        }
        else {
          nullable = 'items'
          defaultValue = undefined
        }
      }
    }

    parsedShapes.push({
      key,
      fieldType,
      descriptor: propertyDescriptor,
      decorateFieldProperty: Field(() => fieldType, {
        name: key,
        nullable,
        defaultValue,
        description: prop.description,
      })
    })
  }

  return parsedShapes
}