/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { DataSource, ILike, In, Like, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { hashKey, hashPassword } from 'src/utils/hash';
import { User } from 'src/modules/users/entities/user.entity';
import { QueryDto } from 'src/dto/query.dto';
import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CartsService } from '../carts/carts.service';
import { CreateUserDto, UpdateUserDto, DeleteUsersDto } from './dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { Role } from 'src/constants';
import { v4 as uuidv4 } from 'uuid';
import { tr } from '@faker-js/faker/.';
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    @InjectRedis() private readonly redis: Redis,
    private dataSource: DataSource,
    private readonly cloudinaryService: CloudinaryService,
    private readonly cartService: CartsService,
    private readonly mailerService: MailerService,
  ) {}
  async create(createUserDto: CreateUserDto, file?: Express.Multer.File) {
    if (
      await this.usersRepository.findOne({
        where: { email: createUserDto.email },
      })
    )
      throw new HttpException('Email exists', HttpStatus.CONFLICT);
    const password = await hashPassword(createUserDto.password);

    let imageUrl: string | undefined;
    let publicId: string | undefined;

    if (file) {
      const uploaded = await this.cloudinaryService.uploadFile(file);
      imageUrl = uploaded?.secure_url;
      publicId = uploaded?.public_id;
    }
    const user = this.usersRepository.create({
      ...createUserDto,
      avatar: imageUrl,
      publicId,
      password,
      isVerified: true,
      isActive: true,
    });
    await this.usersRepository.save(user);
    await this.cartService.create({ userId: user.id });
    return user;
  }

  async createMany(createUsersDto: CreateUserDto[]) {
    return this.dataSource.manager.transaction(async (manager) => {
      const users: User[] = [];
      for (const dto of createUsersDto) {
        const existingUser = await manager.findOne(User, {
          where: { email: dto.email },
        });
        if (existingUser)
          throw new HttpException('Email exists', HttpStatus.CONFLICT);

        const password = await hashPassword(dto.password);
        users.push(await manager.save(User, { ...dto, password }));
      }
      return users;
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto,file?: Express.Multer.File) {
    if (updateUserDto.email) {
      const existingEmail = await this.usersRepository.findOne({
        where: { email: updateUserDto.email },
      });
      if (existingEmail && existingEmail.id !== id)
        throw new HttpException('Email exists', HttpStatus.CONFLICT);
    }
    const existingUser = await this.usersRepository.findOne({ where: { id } });
    if (!existingUser)
      throw new HttpException('Not found user', HttpStatus.NOT_FOUND);
    Object.assign(existingUser, updateUserDto); // merge
    if (file) {
      if (existingUser.publicId) {
        await this.cloudinaryService
          .deleteFile(existingUser.publicId)
          .catch(() => null);
      }
      const uploaded = await this.cloudinaryService.uploadFile(file);
      existingUser.avatar = uploaded?.secure_url;
      existingUser.publicId = uploaded?.public_id;
    }
    return this.usersRepository.update(id, existingUser);
  }

  async findByEmail(email: string) {
    const user = await this.usersRepository.findOne({
      where: { email },
      relations: ['cart'],
    });
    if (!user) throw new HttpException('Not found user', HttpStatus.NOT_FOUND);
    return user;
  }

  async findById(id: number) {
    const user = await this.usersRepository.findOne({ where: { id, isActive: true } });
    if (!user) throw new HttpException('Not found user', HttpStatus.NOT_FOUND);
    return user;
  }

  async findAll(query: QueryDto) {
    const { page, limit, search, sortBy = 'id', sortOrder = 'DESC' } = query;
    // const redisKey = hashKey('users', query);
    // const cachedData: string | null = await this.redis.get(redisKey);
    // if (cachedData) {
    //   console.log('data lay tu redis');
    //   return JSON.parse(cachedData) as {
    //     pagination: {
    //       total: number;
    //       page: number | undefined;
    //       limit: number | undefined;
    //     };
    //     data: User[];
    //   };
    // }
    const [data, total] = await this.usersRepository.findAndCount({
      where: search
        ? [
            { isActive: true, fullName: ILike(`%${search}%`) },
            { isActive: true, email: ILike(`%${search}%`) },
          ]
        : { isActive: true },
      ...(page && limit && { take: limit, skip: (page - 1) * limit }),
      order: { [sortBy]: sortOrder },
    });
    const response = {
      pagination: {
        total,
        page,
        limit,
      },
      data,
    };
    console.log('data lay tu DB');
    // await this.redis.set(redisKey, JSON.stringify(response), 'EX', 60);
    return response;
  }

  async remove(id: number) {
    const user = await this.usersRepository.findOne({ where: { id, isActive: true } });
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    user.isActive = false;
    user.email = `${user.email}_deleted_${Date.now()}`;
    await this.usersRepository.save(user);
    return {
      message: 'User soft deleted successfully',
      deletedId: id,
    };
  }

  async removeUsers(deleteUsersDto: DeleteUsersDto) {
    const { ids } = deleteUsersDto;

    return await this.dataSource.transaction(async (manager) => {
      const users = await manager.find(User, { where: { id: In(ids) } });

      if (!users || users.length === 0)
        throw new HttpException('Not found any users', HttpStatus.NOT_FOUND);

      await this.usersRepository.update({id: In(ids)}, {
        isActive: false,
        email: () => `CONCAT(email, '_deleted_', ${Date.now()})`,
      });

      return { 
        deletedIds: ids,
        message: 'Users soft deleted successfully',
      };
    });
  }

  async updateProfile(id: number, updateProfileDto: UpdateProfileDto, file?: Express.Multer.File) {
    console.log('UpdateProfileDto received:', updateProfileDto);
    console.log('ID: ', id);
    if (isNaN(id)) {
        throw new HttpException('Invalid User ID', HttpStatus.BAD_REQUEST);
    }
    // 1. Tìm user hiện tại
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) 
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    // 2. Cập nhật Avatar nếu có file gửi lên
    if (file) {
      if (user.publicId) {
        await this.cloudinaryService
          .deleteFile(user.publicId)
          .catch((err) => console.log('Delete old avatar error:', err));
      }

      // Upload avatar mới
      const uploaded = await this.cloudinaryService.uploadFile(file);
      user.avatar = uploaded?.secure_url;
      user.publicId = uploaded?.public_id;
    }

    // 3. Cập nhật FullName nếu có gửi lên
    if (updateProfileDto.fullName) {
      user.fullName = updateProfileDto.fullName;
    }

    // 4. Lưu vào DB
    return this.usersRepository.save(user);
  }

  async register(createUserDto: CreateUserDto) {
    const { email, password, fullName } = createUserDto;

    // Check email tồn tại
    const existingUser = await this.usersRepository.findOne({ where: { email } });
    if (existingUser) throw new HttpException('Email already exists', HttpStatus.CONFLICT);
    
    // Hash pass
    const hashedPassword = await hashPassword(password);

    const newUser = this.usersRepository.create({
      email,
      password: hashedPassword,
      fullName,
      isVerified: false, 
      role: Role.User, 
      isActive: true,
    });

    const savedUser = await this.usersRepository.save(newUser);
    await this.cartService.create({ userId: savedUser.id }); 

    // Tạo token verify (Random UUID)
    const token = uuidv4();
    
    // Lưu token vào Redis: key="verify_user:token", value=userId, hết hạn sau 15 phút (900s)
    await this.redis.set(`verify_user:${token}`, savedUser.id, 'EX', 900);

    // Gửi email (Nên dùng Queue nếu muốn tối ưu, nhưng làm trực tiếp cho đơn giản trước)
    const verificationLink = `http://localhost:4000/api/v1/users/verify?token=${token}`; // Link Frontend
    
    await this.mailerService.sendMail({
      to: email,
      subject: 'Welcome to FShop! Verify your email',
      html: `
        <h1>Welcome ${fullName}!</h1>
        <p>Please click the link below to verify your account:</p>
        <a href="${verificationLink}">Verify Email</a>
        <p>This link expires in 15 minutes.</p>
      `,
    }).catch(err => console.log('Send mail error:', err));

    return {
      message: 'Registration successful. Please check your email to verify.',
      userId: savedUser.id,
    };
  }

  // 2. Logic Verify
  async verifyEmail(token: string) {
    // Lấy userId từ Redis dựa vào token
    const userId = await this.redis.get(`verify_user:${token}`);
    
    if (!userId) {
      throw new HttpException('Invalid or expired verification token', HttpStatus.BAD_REQUEST);
    }

    // Update user trong DB
    await this.usersRepository.update(userId, { isVerified: true });

    // Xóa token trong Redis để không dùng lại được nữa
    await this.redis.del(`verify_user:${token}`);

    return { message: 'Email verified successfully. You can now login.' };
  }
}


