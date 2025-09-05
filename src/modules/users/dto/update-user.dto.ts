import { IsEmail, IsEnum, IsOptional, IsString } from "class-validator"
import { Role } from "src/constants/role.enum";
export class UpdateUserDto {
    @IsString()
    @IsOptional()
    avatar: string

    @IsString()
    fullName: string

    @IsEmail()
    email: string

    @IsEnum(Role)// 👈 nếu không gửi thì sẽ mặc định là "user"
    role: Role;
}
