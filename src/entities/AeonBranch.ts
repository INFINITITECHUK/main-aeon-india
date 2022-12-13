import {
	Column,
	Entity,
	Generated,
	Index,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

@Index(['idx'], { unique: true })
@Entity('AeonBranch', { schema: 'public' })
export class AeonBranch {
	@Exclude({ toPlainOnly: true })
	@PrimaryGeneratedColumn({
		type: 'integer',
		name: 'id',
	})
	id: number;

	@Exclude({ toPlainOnly: true })
	@Column('boolean', {
		nullable: false,
		default: () => 'false',
		name: 'is_obsolete',
	})
	is_obsolete: boolean;

	@Exclude({ toPlainOnly: true })
	@Column('timestamp without time zone', {
		nullable: true,
		default: () => 'CURRENT_TIMESTAMP',
		name: 'modified_on',
	})
	modified_on: Date | null;

	@Column('uuid', {
		nullable: false,
		name: 'idx',
	})
	@Generated('uuid')
	idx: string;

	@Column('text', { name: 'name' })
	name: string;

	@Column('timestamp without time zone', {
		nullable: false,
		default: () => 'CURRENT_TIMESTAMP',
		name: 'created_on',
	})
	created_on: Date;
}
