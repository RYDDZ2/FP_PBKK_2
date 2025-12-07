// src/tasks/tasks.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { TaskQueryDto } from './dto/task-query.dto'; // PENTING: Pastikan ini sudah diimpor
import { Prisma } from '@prisma/client'; 

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  // =================================================================
  // FIX: Menggunakan destructuring untuk mengatasi konflik categoryId
  // =================================================================
  async create(createTaskDto: CreateTaskDto, username: string, filePath: string | null) {
      // Destructure categoryId untuk menghindari konflik tipe dengan category: { connect: ... }
      const { categoryId, ...rest } = createTaskDto;
      
      return this.prisma.task.create({
          data: {
              ...rest,
              filePath,
              author: { connect: { username } },
              // Gunakan categoryId yang sudah didestructuring
              category: { connect: { id: categoryId } },
          },
      });
  }

  async findAll(query: TaskQueryDto, username: string | undefined, isMine: boolean) {
    const where: Prisma.TaskWhereInput = {};

    // 1. Filtering berdasarkan kepemilikan/status public
    if (isMine) {
      where.authorId = username;
    } else {
      where.isPublic = true;
    }

    // 2. Filtering berdasarkan query parameters
    if (query.title) {
      // FIX REDLINE 'mode': Menghapus mode: 'insensitive' 
      where.title = { contains: query.title }; 
    }
    if (query.isCompleted !== undefined) {
      where.isCompleted = query.isCompleted;
    }
    
    // 3. Menghitung Pagination (skip dan take)
    let skip: number | undefined = undefined;
    let take: number | undefined = undefined;
    
    if (query.limit && query.page && query.limit > 0 && query.page > 0) {
        take = query.limit;
        skip = (query.page - 1) * take;
    }
    
    // 4. Membangun objek findManyArgs Awal
    const findManyArgs: Prisma.TaskFindManyArgs = {
        where,
        orderBy: {
            // FIX REDLINE 'sortOrder': Menggunakan nilai default 'desc'
            createdAt: query.sortOrder as Prisma.SortOrder ?? 'desc', 
        },
        include: {
            category: true,
            author: {
                select: {
                    username: true,
                    // FIX REDLINE: Menghapus 'fullName'
                    email: true,
                },
            },
        },
    };
    
    // 5. Menambahkan Pagination secara Kondisional (FIX KRITIS untuk 'skip is missing')
    if (skip !== undefined) {
        findManyArgs.skip = skip;
    }
    if (take !== undefined) {
        findManyArgs.take = take;
    }
    
    // 6. Eksekusi query
    const tasks = await this.prisma.task.findMany(findManyArgs);
    
    // 7. Mengembalikan hasil
    return {
      message: 'Tasks retrieved successfully',
      data: tasks,
      metadata: {
        total: tasks.length,
        page: query.page ?? 1,
        limit: query.limit ?? tasks.length,
      },
    };
  }
  
  async findOne(id: string, username: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        category: true,
        author: {
          // FIX REDLINE: Menghapus 'fullName' di findOne juga!
          select: { username: true, email: true },
        },
      },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    // Check permissions if the task is private
    if (!task.isPublic && task.authorId !== username) {
      throw new NotFoundException(`Task with ID ${id} not found or access denied`);
    }

    return task;
  }
  
  // FIX: Menggunakan destructuring di update untuk menghindari konflik categoryId
  async update(id: string, updateTaskDto: UpdateTaskDto, username: string) {
      // Check if task exists and belongs to the user
      await this.findOne(id, username); 

      // Destructure categoryId dari updateTaskDto
      const { categoryId, ...rest } = updateTaskDto;

      return this.prisma.task.update({
        where: { id },
        data: {
          // Menggunakan properti 'rest' yang TIDAK menyertakan categoryId
          ...rest, 
          
          // Membangun properti relasi secara kondisional
          ...(categoryId && {
            category: { connect: { id: categoryId } },
          }),
          
          // Catatan: Jika updateTaskDto juga mengandung properti lain yang ingin Anda update (misal: title),
          // properti tersebut ada di 'rest'.
        },
      });
  }

  async remove(id: string, username: string) {
    // Check if task exists and belongs to the user
    await this.findOne(id, username); 

    await this.prisma.task.delete({
      where: { id },
    });
    return { message: `Task with ID ${id} successfully deleted` };
  }
}