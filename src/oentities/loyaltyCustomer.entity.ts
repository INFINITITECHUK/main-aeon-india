import { Column, Entity, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity('LOY_CUSTOMER', { schema: 'LOYALTY' })
export class LoyCustomer {
	@PrimaryColumn('varchar2', { name: 'CUSTOMER_NUMBER' })
	CUSTOMER_NUMBER: string;

	@Column('varchar2', {
		name: 'CUSTOMER_NAME',
	})
	CUSTOMER_NAME: string;

	@Column('varchar2', { name: 'EMAIL' })
	EMAIL: string | null;

	@Column('varchar2', {
		name: 'MEMBERSHIP_ID',
		nullable: true,
	})
	MEMBERSHIP_ID: string | null;

	@Column('varchar2', { name: 'CURRENT_MEMBERSHIP_STATUS', nullable: true })
	CURRENT_MEMBERSHIP_STATUS: string | null;

	@Column('varchar2', { name: 'CARD_STATUS', nullable: true })
	CARD_STATUS: string | null;

	@Column('varchar2', {
		name: 'MOBILE_NO',
		nullable: false,
	})
	MOBILE_NO: string;

	@Column('number', {
		nullable: true,
		name: 'TOTAL_POINTS',
	})
	TOTAL_POINTS: number | null;

	@Column('number', { name: 'POINT_ELAPSED', nullable: true })
	POINT_ELAPSED: number | null;

	@Column('number', { name: 'POINT_REDEMPTION', nullable: true })
	POINT_REDEMPTION: number | null;

	@Column('timestamp', {
		nullable: true,
		name: 'REGISTRATION_DATE',
	})
	REGISTRATION_DATE: Date | null;
}

@Entity('LOY_CUSTOMER_DTL', { schema: 'LOYALTY' })
export class LoyaltyCustomer {
	@Exclude({ toPlainOnly: true })
	@PrimaryGeneratedColumn({
		type: 'number',
		name: 'CUSTOMER_ID',
	})
	CUSTOMER_ID: number;

	@Column('varchar2', { name: 'CUSTOMER_NUMBER' })
	CUSTOMER_NUMBER: string;

	@Column('timestamp', { name: 'AUTH_DATE', nullable: true })
	AUTH_DATE: Date | null;

	@Column('varchar2', { name: 'AUTH_ID' })
	AUTH_ID: string;

	@Column('varchar2', { name: 'CIBIL_SCORE', nullable: true })
	CIBIL_SCORE: string | null;

	@Column('varchar2', { name: 'COUNTRY_CODE' })
	COUNTRY_CODE: string;

	@Column('timestamp', { name: 'DOB', nullable: true })
	DOB: Date | null;

	@Column('varchar2', { name: 'FIRST_NAME' })
	FIRST_NAME: string | null;

	@Column('varchar2', { name: 'GENDER' })
	GENDER: string | null;

	@Column('varchar2', { name: 'LAST_MEMBERSHIP_CHANGE_STATUS' })
	LAST_MEMBERSHIP_CHANGE_STATUS: string | null;

	@Column('varchar2', { name: 'LAST_NAME' })
	LAST_NAME: string | null;

	@Column('timestamp', { name: 'MAKER_DATE' })
	MAKER_DATE: Date | null;

	@Column('number', { name: 'MAKER_ID' })
	MAKER_ID: number | null;

	@Column('varchar2', {
		name: 'MC_STATUS',
		nullable: true,
	})
	MC_STATUS: string | null;

	@Column('timestamp', {
		name: 'MEMBERSHIP_STATUS_CHANGED_DATE',
		nullable: true,
	})
	MEMBERSHIP_STATUS_CHANGED_DATE: Date | null;

	@Column('timestamp', {
		nullable: true,
		name: 'REGISTRATION_DATE',
	})
	REGISTRATION_DATE: Date | null;

	@Column('number', { name: 'POINT_CLOSING_BALANCE', nullable: true })
	POINT_CLOSING_BALANCE: number | null;

	@Column('number', {
		name: 'POINT_EARNED',
		nullable: true,
	})
	POINT_EARNED: number | null;

	@Column('number', { name: 'POINTS_ELAPSED_IN_NEXT_30_DAYS', nullable: true })
	POINTS_ELAPSED_IN_NEXT_30_DAYS: number | null;

	@Column('number', {
		name: 'POINTS_ELAPSED_IN_NEXT_60_DAYS',
		nullable: true,
	})
	POINTS_ELAPSED_IN_NEXT_60_DAYS: number | null;

	@Column('number', {
		nullable: false,
		name: 'POINTS_OPENING_BALANCE',
	})
	POINTS_OPENING_BALANCE: number | null;

	@Column('varchar2', {
		nullable: true,
		name: 'PREVIOUS_MEMBERSHIP_STATUS',
	})
	PREVIOUS_MEMBERSHIP_STATUS: string | null;

	@Column('timestamp', {
		nullable: true,
		name: 'UPDATE_DATE',
	})
	UPDATE_DATE: Date | null;

	@Column('number', {
		nullable: true,
		name: 'ANNUAL_INCOME',
	})
	ANNUAL_INCOME: number | null;

	@Column('number', {
		nullable: true,
		name: 'MONTHLY_INCOME',
	})
	MONTHLY_INCOME: number | null;

	@Column('timestamp', {
		nullable: true,
		name: 'CIBIL_DATE',
	})
	CIBIL_DATE: Date | null;

	@Column('varchar2', {
		nullable: true,
		name: 'UNDER_OBSERVATION',
	})
	UNDER_OBSERVATION: string | null;

	@Column('timestamp', {
		nullable: true,
		name: 'CARD_CANCELLATION_DATE',
	})
	CARD_CANCELLATION_DATE: Date | null;

	@Column('varchar2', {
		nullable: true,
		name: 'OBSERVATION_STATE',
	})
	OBSERVATION_STATE: string | null;

	@Column('varchar2', { nullable: true, name: 'PAN_NO' })
	PAN_NO: string | null;

	@Column('number', { nullable: true, name: 'TOTAL_DOWNGRADE' })
	TOTAL_DOWNGRADE: number | null;

	@Column('number', { nullable: true, name: 'TOTAL_UPGRADE' })
	TOTAL_UPGRADE: number | null;
}

export const LoyaltyDBColumnMapping = {
	CUSTOMER_NUMBER: {
		entity: ['Customer'],
		column: ['loyalty_customer_number'],
	},
	Email: {
		entity: ['Customer'],
		column: ['email'],
	},
	CUSTOMER_NAME: {
		entity: ['CustomerProfile'],
		column: ['full_name'],
	},
	MOBILE_NO: {
		entity: ['Customer'],
		column: ['mobile_number'],
	},
	MEMBERSHIP_ID: {
		entity: ['CustomerCard'],
		column: ['membership_number'],
	},
	CURRENT_MEMBERSHIP_STATUS: {
		entity: ['CustomerCard'],
		column: ['membership_type'],
	},
	CARD_STATUS: {
		entity: ['CustomerCard'],
		column: ['card_status'],
	},
	TOTAL_POINTS: {
		entity: ['CustomerCard'],
		column: ['total_points'],
	},
	POINT_ELAPSED: {
		entity: ['CustomerCard'],
		column: ['points_elapsed'],
	},
	POINT_REDEMPTION: {
		entity: ['CustomerCard'],
		column: ['point_redemption'],
	},
	REGISTRATION_DATE: {
		entity: ['CustomerCard'],
		column: ['registration_date'],
	},
	UPDATE_DATE: {
		entity: ['CustomerCard'],
		column: ['update_date'],
	},
	PREVIOUS_MEMBERSHIP_STATUS: {
		entity: ['CustomerCard'],
		column: ['previous_membership_status'],
	},
	CUSTOMER_ID: {
		entity: ['Customer'],
		column: ['customer_code'],
	},
	FIRST_NAME: {
		entity: ['Customer'],
		column: ['first_name'],
	},
	LAST_NAME: {
		entity: ['Customer'],
		column: ['last_name'],
	},
	PAN_NO: {
		entity: ['Customer'],
		column: ['panno'],
	},
};
