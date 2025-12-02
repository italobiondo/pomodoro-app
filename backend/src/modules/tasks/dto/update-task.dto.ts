import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsBoolean()
  done?: boolean;
}
