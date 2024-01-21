import { Result } from "@badrap/result";

export function getResultSync<T>(thunk: () => T): Result<T, Error> {
  try {
    return Result.ok(thunk());
  } catch (error) {
    return Result.err(error as Error);
  }
}

export async function getResultAsync<T>(
  thunkAsync: () => Promise<T>,
): Promise<Result<T, Error>> {
  try {
    const value = await thunkAsync();
    return Result.ok(value);
  } catch (error) {
    return Result.err(error as Error);
  }
}
