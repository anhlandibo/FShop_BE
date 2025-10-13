import { NumberRequired, StringRequired } from "src/decorators/dto.decorator";

export class CreateNotificationDto {
    @StringRequired('title')
    title: string;
    @StringRequired('message')
    message: string;
    @NumberRequired("user id")
    userId: number;
}
