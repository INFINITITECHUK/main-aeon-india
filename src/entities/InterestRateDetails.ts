import {
	Column,
	Entity,
	Generated,
	OneToMany,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { InterestRateRangeDetails } from './InterestRateRangeDetails';
import { Exclude } from 'class-transformer';

@Entity('InterestRateDetails', { schema: 'public' })
export class InterestRateDetails {
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

	@Column('uuid', {
		nullable: true,
		name: 'company_idx',
	})
	company_idx: string | null;

	@Column('text', {
		nullable: false,
		name: 'company_name',
	})
	company_name: string;

	@Column('double precision', {
		nullable: false,
		name: 'interest_rate',
	})
	interest_rate: string;

	@Column('text', {
		nullable: true,
		name: 'interest_grace_days',
	})
	interest_grace_days: string;

	@Column('text', {
		nullable: true,
		name: 'refund_type',
	})
	refund_type: string;

	@Column('text', {
		nullable: true,
		name: 'refund_charge',
	})
	refund_charge: string;

	@Column('boolean', {
		nullable: false,
		name: 'is_interest_rate_flat',
	})
	is_interest_rate_flat: boolean;

	@Column('bigint', {
		nullable: false,
		name: 'statement_day',
	})
	statement_day: string;

	@Column('bigint', {
		nullable: false,
		name: 'due_day',
	})
	due_day: string;

	@Column('double precision', {
		nullable: false,
		name: 'gst_on_fees',
	})
	gst_on_fees: string;

	@Column('bigint', {
		nullable: false,
		name: 'grace_days',
	})
	grace_days: string;

	@Column('double precision', {
		nullable: false,
		name: 'late_fees',
	})
	late_fees: string;

	@Column('boolean', {
		nullable: false,
		name: 'is_fees_flat',
	})
	is_fees_flat: boolean;

	@Column('double precision', {
		nullable: true,
		name: 'annual_subscription_fees',
	})
	annual_subscription_fees: string | null;

	@Column('double precision', {
		nullable: true,

		name: 'minimum_interest_rate_on_principal',
	})
	minimum_interest_rate_on_principal: string | null;

	@Column('double precision', {
		nullable: true,

		name: 'minimum_due_amount',
	})
	minimum_due_amount: string | null;

	@Column('timestamp without time zone', {
		nullable: false,
		default: () => 'CURRENT_TIMESTAMP',
		name: 'created_on',
		select: false,
	})
	created_on: Date;

	@Exclude({ toPlainOnly: true })
	@Column('boolean', {
		nullable: false,
		default: () => 'false',
		name: 'is_obsolete',
		select: false,
	})
	is_obsolete: boolean;

	@Exclude({ toPlainOnly: true })
	@Column('timestamp without time zone', {
		nullable: true,
		default: () => 'CURRENT_TIMESTAMP',
		name: 'modified_on',
		select: false,
	})
	modified_on: Date | null;

	@Column('date', {
		nullable: false,
		name: 'yearly_renewal_date',
	})
	yearly_renewal_date: string;

	@OneToMany(
		() => InterestRateRangeDetails,
		(InterestRateRangeDetails: InterestRateRangeDetails) =>
			InterestRateRangeDetails.interestRate,
	)
	interestRateRangeDetailss: InterestRateRangeDetails[];
}
