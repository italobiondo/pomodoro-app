import { IsOptional, IsString } from 'class-validator';

export class SyncTasksDto {
  /**
   * Timestamp ISO da última sincronização feita pelo cliente.
   * Por enquanto é opcional e ainda não é usada na lógica.
   */
  @IsOptional()
  @IsString()
  clientLastSyncAt?: string;
}
