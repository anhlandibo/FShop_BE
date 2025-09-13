import { IsEnum } from "class-validator";
import { AddressType } from "src/constants/address-type.enum";
import { BooleanOptional, PhoneNumberRequired, StringRequired } from "src/decorators/dto.decorator";

export class CreateAddressDto {
  @StringRequired('Recipient name')
  recipientName: string;

  @PhoneNumberRequired("Recipient phone")
  recipientPhone: string;

  @StringRequired('Detail address')
  detailAddress: string;

  @StringRequired('Province')
  province: string;

  @StringRequired('District')
  district: string;

  @StringRequired('Commune')
  commune: string;

  @IsEnum(AddressType)
  type: AddressType;

  @BooleanOptional()
  isDefault?: boolean;
}