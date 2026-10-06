export const SAVE_VERSION = 13 as const;
export const SAVE_RELEASE = '0.22.0' as const;

export const SUPPORTED_SAVE_VERSIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, SAVE_VERSION] as const;

export function isSupportedSaveVersion(value: unknown): boolean {
  return (
    Number.isInteger(value) &&
    SUPPORTED_SAVE_VERSIONS.includes(
      value as (typeof SUPPORTED_SAVE_VERSIONS)[number],
    )
  );
}
