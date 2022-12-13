import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('operationrules', { schema: 'public' })
export class Operationrules {
	@PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
	id: number;

	@Column('text', { name: 'operation_type' })
	operationType: string;

	@Column('text', { name: 'period' })
	period: string;

	@Column('text', { name: 'period_unit' })
	periodUnit: string;

	@Column('integer', { name: 'attempts' })
	attempts: number;
}
