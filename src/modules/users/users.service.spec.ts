/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Repository, DataSource, UpdateResult } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Role } from 'src/constants';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CartsService } from '../carts/carts.service';
// Mocks
const REDIS_TOKEN = 'default_IORedisModuleConnectionToken';
const mockUserRepository = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  findAndCount: jest.fn(),
});

const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
};

const mockCloudinaryService = {
  uploadFile: jest.fn(),
  deleteFile: jest.fn(),
};

const mockCartService = {
  create: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useFactory: mockUserRepository },
        { provide: REDIS_TOKEN, useValue: mockRedis },
        { provide: DataSource, useValue: {} }, // nếu test createMany thì mock transaction
        { provide: CloudinaryService, useValue: mockCloudinaryService },
        { provide: CartsService, useValue: mockCartService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    usersRepository = module.get(getRepositoryToken(User));
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      usersRepository.findOne.mockResolvedValue(null); // chưa có user
      usersRepository.create.mockReturnValue({ id: 1, email: 'test@mail.com' } as User);
      usersRepository.save.mockResolvedValue({ id: 1, email: 'test@mail.com' } as User);
      mockCartService.create.mockResolvedValue({});

      const dto = { fullName: 'Test', email: 'test@mail.com', password: '123456', role: Role.User };
      const result = await service.create(dto);

      expect(result).toHaveProperty('id');
      expect(usersRepository.findOne).toHaveBeenCalledWith({ where: { email: dto.email } });
      expect(usersRepository.save).toHaveBeenCalled();
      expect(mockCartService.create).toHaveBeenCalledWith({ userId: result.id });
    });

    it('should throw conflict if email exists', async () => {
      usersRepository.findOne.mockResolvedValue({ id: 1, email: 'test@mail.com' } as User);

      await expect(service.create({ email: 'test@mail.com', fullName: 'abc', password: '123456', role: Role.User }))
        .rejects.toThrow(new HttpException('Email exists', HttpStatus.CONFLICT));
    });
  });

  describe('findByEmail', () => {
    it('should return user by email', async () => {
      usersRepository.findOne.mockResolvedValue({ id: 1, email: 'test@mail.com' } as User);
      const result = await service.findByEmail('test@mail.com');
      expect(result.email).toBe('test@mail.com');
    });

    it('should throw if user not found', async () => {
      usersRepository.findOne.mockResolvedValue(null);
      await expect(service.findByEmail('notfound@mail.com'))
        .rejects.toThrow(new HttpException('Not found user', HttpStatus.NOT_FOUND));
    });
  });

  describe('findAll', () => {
    it('should return data from Redis if cache exists', async () => {
      const fakeResponse = { pagination: { total: 1, page: 1, limit: 10 }, data: [] };
      mockRedis.get.mockResolvedValue(JSON.stringify(fakeResponse));

      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result).toEqual(fakeResponse);
      expect(usersRepository.findAndCount).not.toHaveBeenCalled();
    });

    it('should fetch from DB if no cache', async () => {
      mockRedis.get.mockResolvedValue(null);
      usersRepository.findAndCount.mockResolvedValue([[{ id: 1 } as User], 1]);
      mockRedis.set.mockResolvedValue('OK');

      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result.pagination.total).toBe(1);
      expect(usersRepository.findAndCount).toHaveBeenCalled();
      expect(mockRedis.set).toHaveBeenCalled();
    });
  });

  describe('update', () => {
  it('should update user successfully without file', async () => {
    const existingUser = { id: 1, email: 'test@mail.com' } as User;
    usersRepository.findOne
      .mockResolvedValueOnce(null)            // check email conflict
      .mockResolvedValueOnce(existingUser);   // check user exists

    usersRepository.update.mockResolvedValue({
      affected: 1,
      raw: [],
      generatedMaps: [],
    } as UpdateResult);

    const dto = { fullName: 'Updated', email: 'test@mail.com', role: Role.User };
    const result = await service.update(1, dto);

    expect(usersRepository.update).toHaveBeenCalledWith(1, expect.objectContaining(dto));
    expect(result).toEqual({
      affected: 1,
      raw: [],
      generatedMaps: [],
    });
  });

  it('should throw conflict if email belongs to another user', async () => {
    usersRepository.findOne.mockResolvedValueOnce({ id: 2, email: 'duplicate@mail.com' } as User);

    const dto = { fullName: 'Updated', email: 'duplicate@mail.com', role: Role.User };
    await expect(service.update(1, dto))
      .rejects.toThrow(new HttpException('Email exists', HttpStatus.CONFLICT));
  });

  it('should throw not found if user does not exist', async () => {
    usersRepository.findOne
      .mockResolvedValueOnce(null)   // no email conflict
      .mockResolvedValueOnce(null);  // user not found

    const dto = { fullName: 'Updated', email: 'abc@mail.com', role: Role.User };
    await expect(service.update(1, dto))
      .rejects.toThrow(new HttpException('Not found user', HttpStatus.NOT_FOUND));
  });

  it('should update user with new avatar (delete old file if exists)', async () => {
    const existingUser = { id: 1, email: 'test@mail.com', publicId: 'old123' } as User;
    usersRepository.findOne
      .mockResolvedValueOnce(null)            // no email conflict
      .mockResolvedValueOnce(existingUser);   // user exists

    mockCloudinaryService.deleteFile.mockResolvedValue({});
    mockCloudinaryService.uploadFile.mockResolvedValue({ secure_url: 'http://img', public_id: 'new123' });
    usersRepository.update.mockResolvedValue({
      affected: 1,
      raw: [],
      generatedMaps: [],
    } as UpdateResult);

    const dto = { fullName: 'Updated', email: 'test@mail.com', role: Role.User };
    const file = { buffer: Buffer.from('img') } as Express.Multer.File;

    const result = await service.update(1, dto, file);

    expect(mockCloudinaryService.deleteFile).toHaveBeenCalledWith('old123');
    expect(mockCloudinaryService.uploadFile).toHaveBeenCalledWith(file);
    expect(usersRepository.update).toHaveBeenCalledWith(1, expect.objectContaining({
      avatar: 'http://img',
      publicId: 'new123',
    }));
    expect(result).toEqual({
      affected: 1,
      raw: [],
      generatedMaps: [],
    });
  });
  });

  describe('remove', () => {
    it('should remove user successfully', async () => {
      const user = { id: 1, email: 'test@mail.com' } as User;
      usersRepository.findOne.mockResolvedValue(user);
      usersRepository.remove.mockResolvedValue(user);

      const result = await service.remove(1);

      expect(usersRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(usersRepository.remove).toHaveBeenCalledWith(user);
      expect(result).toEqual({
        message: 'User soft deleted successfully',
        deletedId: 1,
      });
    });

    it('should throw if user not found', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(1)).rejects.toThrow(
        new HttpException('User not found', HttpStatus.NOT_FOUND),
      );
    });
  });

  describe('createMany', () => {
    it('should create multiple users successfully', async () => {
      const mockManager = {
        findOne: jest.fn().mockResolvedValue(null),
        save: jest
          .fn()
          .mockImplementation((_entity, user) =>
            Promise.resolve({ id: Date.now(), ...user }),
          ),
      };
      const mockDataSource = {
        manager: {
          transaction: (cb: any) => cb(mockManager),
        },
      } as unknown as DataSource;

      const testService = new UsersService(
        usersRepository,
        mockRedis as any,
        mockDataSource,
        mockCloudinaryService as any,
        mockCartService as any,
      );

      const dtos = [
        {
          fullName: 'User1',
          email: 'u1@mail.com',
          password: '123456',
          role: Role.User,
        },
        {
          fullName: 'User2',
          email: 'u2@mail.com',
          password: '123456',
          role: Role.User,
        },
      ];
      const result = await testService.createMany(dtos);

      expect(result.length).toBe(2);
      expect(mockManager.save).toHaveBeenCalledTimes(2);
    });

    it('should throw if any email already exists', async () => {
      const mockManager = {
        findOne: jest.fn().mockResolvedValueOnce({ id: 1, email: 'u1@mail.com' }),
        save: jest.fn(),
      };
      const mockDataSource = {
        manager: {
          transaction: (cb: any) => cb(mockManager),
        }
      } as unknown as DataSource;

      const testService = new UsersService(
        usersRepository,
        mockRedis as any,
        mockDataSource,
        mockCloudinaryService as any,
        mockCartService as any,
      );

      const dtos = [
        {
          fullName: 'User1',
          email: 'u1@mail.com',
          password: '123456',
          role: Role.User,
        },
      ];

      await expect(testService.createMany(dtos)).rejects.toThrow(
        new HttpException('Email exists', HttpStatus.CONFLICT),
      );
    });
  });

  describe('removeUsers', () => {
    it('should remove multiple users successfully', async () => {
      const mockManager = {
        find: jest.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]),
        remove: jest.fn().mockResolvedValue({}),
      };
      const mockDataSource = {
          transaction: (cb: any) => cb(mockManager),
      } as unknown as DataSource;

      const testService = new UsersService(
        usersRepository,
        mockRedis as any,
        mockDataSource,
        mockCloudinaryService as any,
        mockCartService as any,
      );

      const dto = { ids: [1, 2] };
      const result = await testService.removeUsers(dto);

      expect(mockManager.find).toHaveBeenCalled();
      expect(mockManager.remove).toHaveBeenCalledWith([{ id: 1 }, { id: 2 }]);
      expect(result).toEqual({ deletedIds: [1, 2] });
    });

    it('should throw if no users found', async () => {
      const mockManager = {
        find: jest.fn().mockResolvedValue([]),
      };
      const mockDataSource = {
          transaction: (cb: any) => cb(mockManager),
      } as unknown as DataSource;

      const testService = new UsersService(
        usersRepository,
        mockRedis as any,
        mockDataSource,
        mockCloudinaryService as any,
        mockCartService as any,
      );

      const dto = { ids: [99] };
      await expect(testService.removeUsers(dto)).rejects.toThrow(
        new HttpException('Not found any users', HttpStatus.NOT_FOUND),
      );
    });
  });

});
