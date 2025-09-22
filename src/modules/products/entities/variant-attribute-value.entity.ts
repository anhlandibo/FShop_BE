import { Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ProductVariant } from ".";
import { AttributeCategory } from "src/modules/attributes/entities/attribute-category.entity";

@Entity('variant_attribute_values')
export class VariantAttributeValue {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ProductVariant, (productVariant) => productVariant.variantAttributeValues)
  productVariant: ProductVariant;

  @ManyToOne(() => AttributeCategory, (attributeCategory) => attributeCategory.variantAttributeValues)
  attributeCategory: AttributeCategory;
}