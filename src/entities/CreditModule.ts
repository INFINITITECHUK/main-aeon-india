import {
	Column,
	Entity,
	Generated,
	Index,
	PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('CreditModule', { schema: 'public' })
@Index('CreditModule_idx_key', ['idx'], { unique: true })
export class CreditModule {
	@PrimaryGeneratedColumn({
		type: 'integer',
		name: 'id',
	})
	id: number;

	@Column('uuid', {
		nullable: false,
		unique: true,

		name: 'idx',
	})
	@Generated('uuid')
	idx: string;

	@Column('uuid', {
		nullable: true,
		name: 'customer_idx',
	})
	customer_idx: string | null;

	@Column('double precision', {
		nullable: true,

		name: 'credit_limit',
	})
	credit_limit: number | null;

	@Column('boolean', {
		nullable: false,
		default: () => 'false',
		name: 'is_obsolete',
	})
	is_obsolete: boolean;

	@Column('timestamp without time zone', {
		nullable: false,
		default: () => 'CURRENT_TIMESTAMP',
		name: 'created_on',
	})
	created_on: Date;

	@Column('timestamp without time zone', {
		nullable: true,
		default: () => 'CURRENT_TIMESTAMP',
		name: 'modified_on',
	})
	modified_on: Date | null;
}
