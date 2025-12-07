// src/tasks/dto/task-query.dto.ts

import { IsOptional, IsString, IsInt, Min, IsBoolean, IsIn } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class TaskQueryDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @Transform(({ value }) => {
    // Mengubah nilai string 'true'/'false' menjadi boolean
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isCompleted?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
  
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}