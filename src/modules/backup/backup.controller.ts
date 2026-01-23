import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BackupService } from './backup.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles } from 'src/decorators/role.decorator';
import { Role } from 'src/constants/role.enum';
import { BackupResponseDto } from './dto';
import { BackupMetadata } from './interfaces/backup-metadata.interface';

@ApiTags('Backup')
@Controller('admin/backups')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.Admin)
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Post()
  @ApiOperation({ summary: 'Create new database backup' })
  @ApiResponse({
    status: 201,
    description: 'Backup created successfully',
    type: BackupResponseDto,
  })
  async createBackup(): Promise<BackupMetadata> {
    return this.backupService.createBackup();
  }

  @Get()
  @ApiOperation({ summary: 'List all backups' })
  @ApiResponse({
    status: 200,
    description: 'List of all backups',
    type: [BackupResponseDto],
  })
  async listBackups(): Promise<BackupMetadata[]> {
    return this.backupService.listBackups();
  }

  @Post(':filename/restore')
  @ApiOperation({ summary: 'Restore database from backup' })
  @ApiResponse({
    status: 200,
    description: 'Database restored successfully',
  })
  async restoreBackup(@Param('filename') filename: string): Promise<void> {
    await this.backupService.restoreBackup(filename);
  }

  @Delete(':filename')
  @ApiOperation({ summary: 'Delete backup file' })
  @ApiResponse({
    status: 200,
    description: 'Backup deleted successfully',
  })
  async deleteBackup(@Param('filename') filename: string): Promise<void> {
    await this.backupService.deleteBackup(filename);
  }

  @Get(':filename')
  @ApiOperation({ summary: 'Get backup details' })
  @ApiResponse({
    status: 200,
    description: 'Backup details',
    type: BackupResponseDto,
  })
  async getBackupInfo(
    @Param('filename') filename: string,
  ): Promise<BackupMetadata> {
    return this.backupService.getBackupInfo(filename);
  }
}
