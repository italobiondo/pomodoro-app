import { IsIn, IsString } from 'class-validator';

export const ALLOWED_THEME_KEYS = ['light', 'dark', 'midnight'] as const;
export type AllowedThemeKey = (typeof ALLOWED_THEME_KEYS)[number];

export class UpdateThemePreferenceDto {
  @IsString()
  @IsIn(ALLOWED_THEME_KEYS, {
    message: `themeKey must be one of: ${ALLOWED_THEME_KEYS.join(', ')}`,
  })
  themeKey!: AllowedThemeKey;
}
