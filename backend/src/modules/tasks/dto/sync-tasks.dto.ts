import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SyncTaskItemDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsString()
  title: string;

  @IsBoolean()
  done: boolean;

  @IsDateString()
  updatedAt: string;

  @IsOptional()
  @IsDateString()
  deletedAt?: string | null;
}

export class SyncTasksDto {
  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsDateString()
  lastSyncAt?: string | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncTaskItemDto)
  tasks: SyncTaskItemDto[];
}
