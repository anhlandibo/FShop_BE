import { IsEnum } from "class-validator";
import { NotificationType } from "src/constants";
import { NumberRequired, StringRequired } from "src/decorators/dto.decorator";

export class CreateNotificationDto {
    @StringRequired('title')
    title: string;
    @StringRequired('message')
    message: string;
    @IsEnum(NotificationType)
    type: NotificationType;
    @NumberRequired("user id")
    userId: number;
}
