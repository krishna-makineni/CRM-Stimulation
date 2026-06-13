/** Replace {{name}} and other placeholders in campaign messages */
export function personalizeMessage(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/gi, (_, key: string) => vars[key.toLowerCase()] ?? `{{${key}}}`);
}

export function personalizeWithName(template: string, name: string): string {
  return personalizeMessage(template, { name });
}
