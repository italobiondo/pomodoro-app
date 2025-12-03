import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SyncTaskItemDto {
  /**
   * ID da task no backend.
   * Em fluxos futuros de sync, o cliente pode enviar tasks novas sem id (client-side only),
   * mas por enquanto deixamos tudo opcional para não quebrar o contrato atual.
   */
  @IsOptional()
  @IsString()
  id?: string;

  /**
   * ID local do cliente (por dispositivo / instalação).
   * Pode ser usado para casar tasks criadas offline com as criadas no servidor.
   */
  @IsOptional()
  @IsString()
  @MaxLength(255)
  clientId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsBoolean()
  done?: boolean;

  /**
   * Marca de tempo da última modificação do lado do cliente.
   * Útil em futuros algoritmos de resolução de conflito.
   */
  @IsOptional()
  @IsDateString()
  updatedAt?: string;

  /**
   * Soft delete do lado do cliente.
   * Se preenchido, indica que essa task foi removida no client desde o último sync.
   */
  @IsOptional()
  @IsDateString()
  deletedAt?: string | null;
}

/**
 * DTO inicial para o endpoint de sincronização de tasks.
 * Todos os campos são opcionais para manter compatibilidade com o stub atual.
 */
export class SyncTasksDto {
  /**
   * Identificador único do cliente (ex.: UUID por dispositivo).
   * Futuramente pode se tornar obrigatório, mas hoje é opcional.
   */
  @IsOptional()
  @IsString()
  @MaxLength(255)
  clientId?: string;

  /**
   * Momento do último sync conhecido pelo cliente.
   * Permite ao servidor otimizar diffs no futuro.
   */
  @IsOptional()
  @IsDateString()
  lastSyncAt?: string;

  /**
   * Lista de tasks que o cliente deseja sincronizar.
   * Ainda não é utilizada na lógica atual (apenas validada).
   */
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SyncTaskItemDto)
  tasks?: SyncTaskItemDto[];
}
