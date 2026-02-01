/**
 * Prompts wrapper for easy library swapping
 *
 * This module wraps the prompts library to provide a consistent interface.
 * When migrating to @inquirer/prompts or another library, only this file needs to change.
 */

import prompts from 'prompts';

export interface SelectChoice<T = string> {
  title: string;
  value: T;
  description?: string;
  disabled?: boolean;
  selected?: boolean;
}

export interface SelectOptions<T = string> {
  message: string;
  choices: SelectChoice<T>[];
}

export interface TextOptions {
  message: string;
  initial?: string;
  validate?: (value: string) => boolean | string;
}

export interface ConfirmOptions {
  message: string;
  initial?: boolean;
}

export interface MultiSelectOptions<T = string> {
  message: string;
  choices: SelectChoice<T>[];
  min?: number;
  hint?: string;
}

/**
 * Select a single option from a list
 */
export async function select<T = string>(options: SelectOptions<T>): Promise<T | undefined> {
  const result = (await prompts({
    type: 'select',
    name: 'value',
    message: options.message,
    choices: options.choices.map((c) => ({
      title: c.title,
      value: c.value,
      description: c.description,
      disabled: c.disabled,
    })),
  })) as { value?: T };
  return result.value;
}

/**
 * Get text input from user
 */
export async function text(options: TextOptions): Promise<string | undefined> {
  const result = (await prompts({
    type: 'text',
    name: 'value',
    message: options.message,
    initial: options.initial,
    validate: options.validate,
  })) as { value?: string };
  return result.value;
}

/**
 * Get yes/no confirmation
 */
export async function confirm(options: ConfirmOptions): Promise<boolean> {
  const result = (await prompts({
    type: 'confirm',
    name: 'value',
    message: options.message,
    initial: options.initial ?? false,
  })) as { value?: boolean };
  return result.value ?? false;
}

/**
 * Select multiple options from a list
 */
export async function multiselect<T = string>(options: MultiSelectOptions<T>): Promise<T[]> {
  const result = (await prompts({
    type: 'multiselect',
    name: 'values',
    message: options.message,
    choices: options.choices
      .filter((c) => !c.disabled)
      .map((c) => ({
        title: c.title,
        value: c.value,
        description: c.description,
        selected: c.selected,
      })),
    min: options.min,
    hint: options.hint,
  })) as { values?: T[] };
  return result.values ?? [];
}
