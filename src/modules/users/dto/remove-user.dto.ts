import { IsNumber } from "class-validator"
export class RemoveUserDto {
    @IsNumber()
    id: number
}
