import { IsEmail, IsEnum, IsOptional, IsString } from "class-validator"
import { Role } from "src/constants/role.enum";
import { StringOptional } from "src/decorators/dto.decorator";
export class UpdateUserDto {
    @StringOptional()
    avatar: string

    @IsString()
    fullName: string

    @IsEmail()
    email?: string

    @IsEnum(Role)// 👈 nếu không gửi thì sẽ mặc định là "user"
    role: Role;
}
