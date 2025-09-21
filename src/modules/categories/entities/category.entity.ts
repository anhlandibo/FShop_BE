import { AttributeCategory } from "src/modules/attributes/entities/attribute-category.entity";
import { Department } from "src/modules/departments/entities/department.entity";
import { Product } from "src/modules/products/entities/product.entity";
import Helper from "src/utils/helpers";
import { BeforeInsert, BeforeUpdate, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  imageUrl: string;

  @Column()
  publicId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];

  @OneToMany(() => AttributeCategory, attributeCategory => attributeCategory.category)
  attributeCategories: AttributeCategory[];

  @ManyToOne(() => Department, (department) => department.categories)
  department: Department;

  @BeforeInsert()
  @BeforeUpdate()
  generateSlug() {
    if (this.name) {
      this.slug = Helper.makeSlugFromString(this.name);
    }
  }
}