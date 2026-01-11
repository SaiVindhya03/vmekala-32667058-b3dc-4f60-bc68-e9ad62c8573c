import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TaskStatus } from '@vmekala/data';

export class TaskFiltersDto {
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsString()
  @IsOptional()
  category?: string;
}
