import {
	Column,
	Entity,
	Generated,
	Index,
	PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('CustomerWallet', { schema: 'public' })
@Index('CustomerWallet_idx_key', ['idx'], { unique: true })
export class CustomerWallet {
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
		default: () => '0',

		name: 'balance',
	})
	balance: number | null;

	@Column('text', {
		nullable: true,
		name: 'mpin',
	})
	mpin: string | null;

	@Column('text', {
		nullable: false,
		default: () => 'INACTIVE',
		name: 'is_rl_active',
	})
	is_rl_active: string;

	@Column('boolean', {
		nullable: false,
		default: () => 'false',
		name: 'is_obsolete',
	})
	is_obsolete: boolean;

	// @Column('character varying', { name: 'is_rl_active', length: 10 })
	// is_rl_active: string;

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
