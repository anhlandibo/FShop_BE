import { NumberRequired } from "src/decorators/dto.decorator";

export class FindNotificationByUserDto {
    @NumberRequired("user id")
    userId: number;
}
