import { IsString, IsEnum, IsOptional } from 'class-validator';
import { TaskStatus } from '@vmekala/data';

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsString()
  @IsOptional()
  category?: string;
}
