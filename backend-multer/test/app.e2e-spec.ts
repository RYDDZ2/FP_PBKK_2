// test/app.e2e-spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { default as request } from 'supertest'; 
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma.service';
import * as bcrypt from 'bcryptjs'; 
import { AuthService } from './../src/auth/auth.service';
import { ConfigModule } from '@nestjs/config'; 

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authService: AuthService;

  const testUser = {
    username: 'testuser',
    password: 'password123',
    email: 'testuser@example.com',
  };
  const anotherUser = {
    username: 'anotheruser',
    password: 'password123',
    email: 'anotheruser@example.com',
  };

  let testAccessToken: string;
  let testRefreshToken: string;
  let testCategoryId: string; 
  let testTaskId: string | null = null; 

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        // FIX PENTING 1: Daftarkan ConfigModule dengan nilai JWT_SECRET untuk tes
        ConfigModule.forRoot({
          isGlobal: true,
          load: [() => ({
            JWT_SECRET: 'super-secret-testing-key-for-e2e', 
          })],
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // FIX PENTING 2: Set Global Prefix
    app.setGlobalPrefix('api/v1'); 
    
    await app.init();

    // Inisialisasi service
    prisma = app.get<PrismaService>(PrismaService);
    authService = app.get<AuthService>(AuthService);

    // Hapus semua data
    await prisma.task.deleteMany(); 
    await prisma.category.deleteMany(); 
    await prisma.user.deleteMany();

    // Buat user baru 
    await prisma.user.createMany({
      data: [
        { username: testUser.username, password: await bcrypt.hash(testUser.password, 10), email: testUser.email },
        { username: anotherUser.username, password: await bcrypt.hash(anotherUser.password, 10), email: anotherUser.email },
      ],
    });

    // Login untuk mendapatkan token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ username: testUser.username, password: testUser.password })
      .expect(201); 

    // FIX AKHIR: Mengambil token menggunakan properti 'access_token' (snake_case)
    testAccessToken = loginResponse.body.access_token;
    testRefreshToken = loginResponse.body.refresh_token; 
    
    if (!testAccessToken) {
        throw new Error(
            "Login succeeded (Status 201), but 'access_token' is missing in the response body. " +
            "Actual response body: " + JSON.stringify(loginResponse.body)
        );
    }
  });

  // --- TEST CATEGORY ---
  it('/categories (POST) should create a category', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${testAccessToken}`)
      .send({ name: 'Work' })
      .expect(201);
    
    expect(response.body.name).toBe('Work');
    testCategoryId = response.body.id;
  });

  // --- TEST TASK ---
  it('/tasks (POST) should create a task', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${testAccessToken}`)
      .send({
        title: 'Complete NestJS Project',
        description: 'Finish all CRUD operations and deploy',
        priority: 'high',
        categoryId: testCategoryId,
        isPublic: true,
      })
      .expect(201);

    expect(response.body.title).toBe('Complete NestJS Project');
    expect(response.body.authorId).toBe(testUser.username);
    testTaskId = response.body.id;
  });

  it('/tasks (GET) should retrieve owner tasks', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/tasks')
      .set('Authorization', `Bearer ${testAccessToken}`)
      .expect(200);

    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.data.some(task => task.id === testTaskId)).toBe(true);
  });
  
  it('/tasks/public (GET) should retrieve public tasks', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/tasks/public')
      .expect(200);

    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.data.some(task => task.isPublic === true)).toBe(true);
  });

  it('/tasks/:id (PATCH) should update a task', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/tasks/${testTaskId}`)
      .set('Authorization', `Bearer ${testAccessToken}`)
      .send({ title: 'Completed NestJS Project Update', isCompleted: true })
      .expect(200);

    expect(response.body.title).toBe('Completed NestJS Project Update');
    expect(response.body.isCompleted).toBe(true);
  });

  it('/tasks/:id (DELETE) should delete a task', async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/tasks/${testTaskId}`)
      .set('Authorization', `Bearer ${testAccessToken}`)
      .expect(200);
  });
  
  afterAll(async () => {
    await app.close();
  });
});