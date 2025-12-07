// src/tasks/tasks.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // PATH SESUAI STRUKTUR ANDA
import { User } from 'src/common/decorators/user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

// Konfigurasi Multer untuk File Upload
const storage = diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const fileExtension = file.originalname.split('.').pop();
    cb(null, `${file.fieldname}-${uniqueSuffix}.${fileExtension}`);
  },
});

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @UseGuards(JwtAuthGuard) // <-- Guard di level method
  @Post()
  @UseInterceptors(FileInterceptor('file', { storage: storage }))
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() createTaskDto: CreateTaskDto,
    @User('username') username: string,
  ) {
    const filePath = file ? file.path : null;
    return this.tasksService.create(createTaskDto, username, filePath);
  }

  @UseGuards(JwtAuthGuard) // <-- Guard di level method
  @Get()
  findAllMine(@Query() query: TaskQueryDto, @User('username') username: string) {
    return this.tasksService.findAll(query, username, true);
  }

  @Get('public') // <-- ENDPOINT INI TIDAK MEMILIKI @UseGuards
  findAllPublic(@Query() query: TaskQueryDto) {
    return this.tasksService.findAll(query, undefined, false);
  }

  @UseGuards(JwtAuthGuard) // <-- Guard di level method
  @Get(':id')
  findOne(@Param('id') id: string, @User('username') username: string) {
    return this.tasksService.findOne(id, username);
  }

  @UseGuards(JwtAuthGuard) // <-- Guard di level method
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @User('username') username: string,
  ) {
    return this.tasksService.update(id, updateTaskDto, username);
  }

  @UseGuards(JwtAuthGuard) // <-- Guard di level method
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @User('username') username: string) {
    return this.tasksService.remove(id, username);
  }
}