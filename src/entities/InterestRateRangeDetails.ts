import {
	Column,
	Entity,
	Generated,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { InterestRateDetails } from './InterestRateDetails';
import { Exclude } from 'class-transformer';

@Entity('InterestRateRangeDetails', { schema: 'public' })
export class InterestRateRangeDetails {
	@Exclude({ toPlainOnly: true })
	@PrimaryGeneratedColumn({
		type: 'integer',
		name: 'id',
	})
	id: number;

	@Column('uuid', {
		nullable: true,

		name: 'idx',
	})
	@Generated('uuid')
	idx: string | null;

	@ManyToOne(
		() => InterestRateDetails,
		(InterestRateDetails: InterestRateDetails) =>
			InterestRateDetails.interestRateRangeDetailss,
		{},
	)
	@JoinColumn({ name: 'interest_rate_id' })
	interestRate: InterestRateDetails | null;

	@Column('text', {
		nullable: true,
		name: 'attribute_type',
	})
	attribute_type: string | null;

	@Column('bigint', {
		nullable: true,
		name: 'from_amount',
	})
	from_amount: string | null;

	@Column('bigint', {
		nullable: true,
		name: 'to_amount',
	})
	to_amount: string | null;

	@Column('bigint', {
		nullable: true,
		name: 'range_value',
	})
	range_value: string | null;

	@Column('timestamp without time zone', {
		nullable: false,
		default: () => 'CURRENT_TIMESTAMP',
		name: 'created_on',
	})
	created_on: Date;

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
}
