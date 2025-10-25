import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Attribute } from "./attribute.entity";
import { Category } from "src/modules/categories/entities/category.entity";
import { VariantAttributeValue } from "src/modules/products/entities/variant-attribute-value.entity";

@Entity('attribute_categories')
export class AttributeCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Attribute, (attribute) => attribute.attributeCategories, {onDelete: 'CASCADE'})
  @JoinColumn({ name: 'attributeId' })
  attribute: Attribute;

  @ManyToOne(() => Category, (category) => category.attributeCategories, {onDelete: 'CASCADE'})
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column()
  value: string

  @Column({type: 'boolean', default: true})
  isActive: boolean;  

  @OneToMany(() => VariantAttributeValue, variantAttributeValue => variantAttributeValue.attributeCategory)
  variantAttributeValues: VariantAttributeValue[];
}