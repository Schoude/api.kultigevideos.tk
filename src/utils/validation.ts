export function validateMaxLength(
  testVar: string | unknown[],
  maxLength: number,
) {
  if (maxLength <= 0) {
    throw new Error("Invalid maxLength given. Must be an positive integer.");
  }

  return testVar.length <= maxLength;
}

export function validateMinLength(
  testVar: string | unknown[],
  minLength: number,
) {
  if (minLength <= 0) {
    throw new Error("Invalid maxLength given. Must be an positive integer.");
  }

  return testVar.length >= minLength;
}
