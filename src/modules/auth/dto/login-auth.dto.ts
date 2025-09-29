import { IsEmail, IsString } from "class-validator";
import { StringRequired } from "src/decorators/dto.decorator";

export class LoginAuthDto {
    @IsEmail()
    @StringRequired('Email')
    email: string
    @StringRequired('Password')
    password: string
}
