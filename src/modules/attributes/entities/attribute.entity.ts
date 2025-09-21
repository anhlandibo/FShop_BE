import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { AttributeCategory } from "./attribute-category.entity";

@Entity('attributes')
export class Attribute {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({unique: true})
  name: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => AttributeCategory, attributeCategory => attributeCategory.attribute)
  attributeCategories: AttributeCategory[];


}