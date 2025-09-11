import { StringRequired } from "src/decorators/dto.decorator";

export class RefreshTokenDto {
  @StringRequired('refreshToken')
  refreshToken: string
}