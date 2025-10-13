import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsOptional, IsString } from "class-validator"
import { Role } from "src/constants/role.enum";
import { StringOptional } from "src/decorators/dto.decorator";
export class UpdateUserDto {

    @StringOptional()
    fullName: string

    @StringOptional()
    @IsEmail()
    email?: string

    @IsOptional()
    @IsEnum(Role)// 👈 nếu không gửi thì sẽ mặc định là "user"
    @ApiProperty({enum: Role})
    role: Role;

}
