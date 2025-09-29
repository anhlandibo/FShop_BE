import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsString } from "class-validator"
import { Role } from "src/constants/role.enum";
import { StringRequired } from "src/decorators/dto.decorator";
export class CreateUserDto {
    @StringRequired('Full Name')
    fullName: string

    @IsEmail()
    @StringRequired('Email')
    email: string

    @StringRequired('Password')
    password: string

    @IsEnum(Role)// 👈 nếu không gửi thì sẽ mặc định là "user"
    @ApiProperty({enum: Role})
    role: Role;
}
