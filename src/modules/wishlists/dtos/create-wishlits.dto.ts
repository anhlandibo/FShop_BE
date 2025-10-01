import { NumberRequired } from "src/decorators/dto.decorator";

export class CreateWishlistsDto {
  @NumberRequired('Variant ID')
  variantId: number;
}