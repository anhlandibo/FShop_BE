import { Category } from "src/modules/categories/entities/category.entity";
import Helper from "src/utils/helpers";
import { BeforeInsert, BeforeUpdate, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('departments')
export class Department {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ unique: true })
  name: string

  @Column({ unique: true })
  slug: string

  @Column({ type: 'text', nullable: true })
  description: string

  @Column()
  imageUrl: string;

  @Column()
  publicId: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @OneToMany(() => Category, category => category.department)
  categories: Category[]

  @BeforeInsert()
  @BeforeUpdate()
  generateSlug() {
    if (this.name) {
      this.slug = Helper.makeSlugFromString(this.name);
    }
  }
}