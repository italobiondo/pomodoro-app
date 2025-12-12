import { IsEnum, IsObject, IsOptional } from 'class-validator';
import { FocusSessionEventType } from '../../../generated/prisma/client/client';

export class CreateFocusSessionEventDto {
  @IsEnum(FocusSessionEventType)
  type!: FocusSessionEventType;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
