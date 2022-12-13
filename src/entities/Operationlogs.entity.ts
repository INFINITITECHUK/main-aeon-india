import {
	Column,
	Entity,
	Generated,
	Index,
	PrimaryGeneratedColumn,
} from 'typeorm';

@Index(['idx'], { unique: true })
@Entity('operationlogs', { schema: 'public' })
export class Operationlogs {
	@PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
	id: number;

	@Column('uuid', { name: 'customer_idx' })
	customerIdx: string;

	@Column('uuid', {
		name: 'token',
	})
	@Generated('uuid')
	token: string;

	@Column('text', { name: 'operation_type' })
	operationType: string;

	@Column('text', { name: 'status', nullable: false })
	status: string;

	@Column('uuid', {
		nullable: false,
		name: 'idx',
	})
	@Generated('uuid')
	idx: string;
}
