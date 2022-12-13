import {
	Column,
	Entity,
	Generated,
	OneToOne,
	PrimaryGeneratedColumn,
	JoinColumn,
} from 'typeorm';
import { Customer } from './customer.entity';
import { Exclude } from 'class-transformer';

@Entity('CustomerProfile', { schema: 'public' })
export class CustomerProfile {
	@Column('uuid', {
		nullable: false,
		name: 'idx',
	})
	@Generated('uuid')
	idx: string;

	@Column('timestamp without time zone', {
		name: 'created_on',
		default: () => 'now()',
	})
	created_on: Date;

	@OneToOne(() => Customer, customer => customer.customerProfile)
	@JoinColumn({ name: 'customer' })
	customer: Customer;

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

	@Column('character varying', {
		name: 'customer_info_file_number',
		nullable: true,
		length: 18,
	})
	customer_info_file_number: string;

	@Column('character varying', {
		name: 'marital_status',
		nullable: true,
		length: 255,
	})
	marital_status: string;

	@Column('character varying', {
		name: 'constitution_code',
		nullable: true,
		length: 8,
	})
	constitution_code: string;

	@Column('character varying', {
		name: 'nationality',
		nullable: true,
		length: 255,
	})
	nationality: string;

	@Column('character varying', {
		name: 'identification_type',
		nullable: true,
		length: 255,
	})
	identification_type: string;

	@Column('character varying', {
		name: 'identification_number',
		nullable: true,
		length: 15,
	})
	identification_number: string;

	@Column('character varying', {
		name: 'country_of_issue',
		nullable: true,
		length: 255,
	})
	country_of_issue: string;

	@Column('character varying', {
		name: 'address_type',
		nullable: true,
		length: 255,
	})
	address_type: string;

	@Column('character varying', {
		name: 'address1',
		nullable: true,
		length: 255,
	})
	address1: string;

	@Column('character varying', { name: 'pin_code', nullable: true, length: 8 })
	pin_code: string;

	@Column('character varying', { name: 'state', nullable: true, length: 30 })
	state: string;

	@Column('character varying', {
		name: 'resident_status',
		nullable: true,
		length: 255,
	})
	resident_status: string;

	@Column('character varying', {
		name: 'reference_resident_status',
		nullable: true,
		length: 255,
	})
	reference_resident_status: string;

	@Column('character varying', {
		name: 'reference2_resident_status',
		nullable: true,
		length: 255,
	})
	reference2_resident_status: string;

	@Column('character varying', {
		name: 'land_mark',
		nullable: true,
		length: 100,
	})
	land_mark: string;

	@Column('character varying', {
		name: 'years_at_current_state',
		nullable: true,
		length: 255,
	})
	years_at_current_state: string;

	@Column('character varying', {
		name: 'months_at_current_state',
		nullable: true,
		length: 255,
	})
	months_at_current_state: string;

	@Column('character varying', { name: 'phone1', nullable: true, length: 255 })
	phone1: string;

	@Column('character varying', {
		name: 'occupation_type',
		nullable: true,
		length: 255,
	})
	occupation_type: string;

	@Column('character varying', {
		name: 'employer_code',
		nullable: true,
		length: 255,
	})
	employer_code: string;

	@Column('character varying', {
		name: 'nature_of_business',
		nullable: true,
		length: 255,
	})
	nature_of_business: string;

	@Column('character varying', {
		name: 'industry',
		nullable: true,
		length: 255,
	})
	industry: string;

	@Column('character varying', {
		name: 'industry_code',
		nullable: true,
		length: 255,
	})
	industry_code: string;

	@Column('character varying', {
		name: 'registration_number',
		nullable: true,
		length: 255,
	})
	registration_number: string;

	@Column('character varying', {
		name: 'organization_name',
		nullable: true,
		length: 255,
	})
	organization_name: string;

	@Column('character varying', {
		name: 'nature_of_profession',
		nullable: true,
		length: 255,
	})
	nature_of_profession: string;

	@Column('character varying', {
		name: 'net_income',
		nullable: true,
		length: 43,
	})
	net_income: string;

	@Column('character varying', {
		name: 'interest_charge_method',
		nullable: true,
		length: 255,
	})
	interest_charge_method: string;

	@Column('character varying', {
		name: 'reference_name',
		nullable: true,
		length: 255,
	})
	reference_name: string;

	@Column('character varying', {
		name: 'reference_relationship',
		nullable: true,
		length: 255,
	})
	reference_relationship: string;

	@Column('character varying', {
		name: 'reference_phone_number',
		nullable: true,
		length: 14,
	})
	reference_phone_number: string;

	@Column('character varying', {
		name: 'reference_email',
		nullable: true,
		length: 255,
	})
	reference_email: string;

	@Column('character varying', {
		name: 'ifsc',
		nullable: true,
		length: 50,
	})
	ifsc: string;

	@Column('character varying', {
		name: 'bank_name_id',
		nullable: true,
		length: 50,
	})
	bank_name_id: string;
	//My Addition Started

	@Column('character varying', {
		name: 'loyalty_customer_number',
		nullable: true,
		length: 18,
	})
	loyalty_customer_number: string;

	@Column('integer', {
		name: 'customer_id',
		nullable: false,
	})
	customer_id: number;

	@Column('character varying', {
		name: 'salutation',
		nullable: true,
		length: 10,
	})
	salutation: string;

	@Column('character varying', {
		name: 'customer_type',
		nullable: true,
		length: 255,
	})
	customer_type: string;

	@Column('character varying', {
		name: 'marital_status_code',
		nullable: true,
		length: 255,
	})
	marital_status_code: string;

	@Column('character varying', {
		name: 'inst_description',
		nullable: true,
		length: 255,
	})
	inst_description: string;

	@Column('character varying', {
		name: 'profession',
		nullable: true,
		length: 255,
	})
	profession: string;

	@Column('character varying', {
		name: 'constitution_description',
		nullable: true,
		length: 255,
	})
	constitution_description: string;

	@Column('character varying', {
		name: 'phone_number',
		nullable: true,
		length: 255,
	})
	phone_number: string;

	@Column('character varying', {
		name: 'preferred_language',
		nullable: true,
		length: 255,
	})
	preferred_language: string;

	@Column('character varying', {
		name: 'customer_category',
		nullable: true,
		length: 255,
	})
	customer_category: string;

	@Column('character varying', {
		name: 'customer_segment',
		nullable: true,
		length: 255,
	})
	customer_segment: string;

	@Column('character varying', {
		name: 'additional_info',
		nullable: true,
		length: 4000,
	})
	additional_info: string;

	@Column('character varying', {
		name: 'country_code',
		nullable: true,
		length: 255,
	})
	country_code: string;

	@Column('character varying', {
		name: 'isd_code',
		nullable: true,
		length: 255,
	})
	isd_code: string;

	@Column('character varying', {
		name: 'phone_number_type',
		nullable: true,
		length: 255,
	})
	phone_number_type: string;

	@Column('character varying', {
		name: 'primary_telephone',
		nullable: true,
		length: 3,
	})
	primary_telephone: string;

	@Column('character varying', {
		name: 'std_code',
		nullable: true,
		length: 255,
	})
	std_code: string;

	@Column('integer', {
		name: 'is_phone_number_verified',
		nullable: true,
	})
	is_phone_number_verified: number;

	@Column('character varying', {
		name: 'associated_loan_app_id',
		nullable: true,
		length: 255,
	})
	associated_loan_app_id: string;

	@Column('character varying', {
		name: 'accomodation_type',
		nullable: true,
		length: 255,
	})
	accomodation_type: string;

	@Column('character varying', {
		name: 'active_address',
		nullable: true,
		length: 255,
	})
	active_address: string;

	@Column('character varying', {
		name: 'address_line1',
		nullable: true,
		length: 255,
	})
	address_line1: string;

	@Column('character varying', {
		name: 'address_line2',
		nullable: true,
		length: 255,
	})
	address_line2: string;

	@Column('character varying', {
		name: 'address_line3',
		nullable: true,
		length: 255,
	})
	address_line3: string;

	@Column('character varying', {
		name: 'address_line4',
		nullable: true,
		length: 255,
	})
	address_line4: string;

	@Column('character varying', {
		name: 'area',
		nullable: true,
		length: 255,
	})
	area: string;

	@Column('character varying', {
		name: 'city',
		nullable: true,
		length: 255,
	})
	city: string;

	@Column('character varying', {
		name: 'city_code',
		nullable: true,
		length: 255,
	})
	city_code: string;


	@Column('character varying', {
		name: 'reference_city_code',
		nullable: true,
		length: 255,
	})
	reference_city_code: string;

	@Column('character varying', {
		name: 'reference2_city_code',
		nullable: true,
		length: 255,
	})
	reference2_city_code: string;

	@Column('character varying', {
		name: 'country',
		nullable: true,
		length: 255,
	})
	country: string;

	@Column('character varying', {
		name: 'district',
		nullable: true,
		length: 255,
	})
	district: string;

	@Column('character varying', {
		name: 'full_address',
		nullable: true,
		length: 255,
	})
	full_address: string;

	@Column('character varying', {
		name: 'landmark',
		nullable: true,
		length: 255,
	})
	landmark: string;

	@Column('character varying', {
		name: 'primary_address',
		nullable: true,
		length: 3,
	})
	primary_address: string;

	@Column('character varying', {
		name: 'region',
		nullable: true,
		length: 255,
	})
	region: string;

	@Column('character varying', {
		name: 'residence_type',
		nullable: true,
		length: 255,
	})
	residence_type: string;

	@Column('character varying', {
		name: 'taluka',
		nullable: true,
		length: 255,
	})
	taluka: string;

	@Column('character varying', {
		name: 'village',
		nullable: true,
		length: 255,
	})
	village: string;

	@Column('character varying', {
		name: 'zip_code',
		nullable: true,
		length: 255,
	})
	zip_code: string;

	@Column('character varying', {
		name: 'is_primary_email',
		nullable: true,
		length: 3,
	})
	is_primary_email: string;

	@Column('character varying', {
		name: 'default_id_for_customer',
		nullable: true,
		length: 3,
	})
	default_id_for_customer: string;

	@Column('timestamp without time zone', {
		name: 'expiry_date_of_identification',
		nullable: false,
		default: () => 'now()',
	})
	expiry_date_of_identification: Date;

	@Column('timestamp without time zone', {
		name: 'issue_date',
		nullable: false,
		default: () => 'now()',
	})
	issue_date: Date;

	@Column('character varying', {
		name: 'primary_id',
		nullable: true,
		length: 3,
	})
	primary_id: string;

	@Column('character varying', {
		name: 'full_name',
		nullable: true,
		length: 255,
	})
	full_name: string;
	//My Addition ends

	@Column('character varying', {
		name: 'duration_at_current_city',
		nullable: true,
		length: 50,
	})
	duration_at_current_city: string;

	@Column('character varying', {
		name: 'month_duration_at_current_city',
		nullable: true,
		length: 50,
	})
	month_duration_at_current_city: string;

	@Column('character varying', {
		name: 'address_proof',
		nullable: true,
		length: 50,
	})
	address_proof: string;

	@Column('character varying', {
		name: 'permanent_address',
		nullable: true,
		length: 50,
	})
	permanent_address: string;

	@Column('character varying', {
		name: 'permanent_landmark',
		nullable: true,
		length: 50,
	})
	permanent_landmark: string;

	@Column('character varying', {
		name: 'permanent_pincode',
		nullable: true,
		length: 50,
	})
	permanent_pincode: string;

	@Column('character varying', {
		name: 'permanent_state',
		nullable: true,
		length: 50,
	})
	permanent_state: string;

	@Column('character varying', {
		name: 'permanent_residence_status',
		nullable: true,
		length: 50,
	})
	permanent_residence_status: string;

	@Column('character varying', {
		name: 'office_residence_status',
		nullable: true,
		length: 50,
	})
	office_residence_status: string;

	@Column('character varying', {
		name: 'permanent_duration_at_current_address',
		nullable: true,
		length: 50,
	})
	permanent_duration_at_current_address: string;

	@Column('character varying', {
		name: 'permanent_address_proof',
		nullable: true,
		length: 50,
	})
	permanent_address_proof: string;

	@Column('character varying', {
		name: 'bank_name',
		nullable: true,
		length: 50,
	})
	bank_name: string;

	@Column('character varying', {
		name: 'loan_details',
		nullable: true,
		length: 50,
	})
	loan_details: string;

	@Column('character varying', {
		name: 'preferred_branch',
		nullable: true,
		length: 50,
	})
	preferred_branch: string;

	@Column('character varying', {
		name: 'monthly_income',
		nullable: true,
		length: 50,
	})
	monthly_income: string;

	@Column('character varying', {
		name: 'total_income',
		nullable: true,
		length: 50,
	})
	total_income: string;

	@Column('character varying', {
		name: 'years_in_job',
		nullable: true,
		length: 50,
	})
	years_in_job: string;

	@Column('character varying', {
		name: 'years_in_business',
		nullable: true,
		length: 50,
	})
	years_in_business: string;

	@Column('character varying', {
		name: 'work_experience',
		nullable: true,
		length: 50,
	})
	work_experience: string;

	@Column('character varying', {
		name: 'months_in_job',
		nullable: true,
		length: 50,
	})
	months_in_job: string;

	@Column('character varying', {
		name: 'office_address',
		nullable: true,
		length: 50,
	})
	office_address: string;

	@Column('character varying', {
		name: 'office_landmark',
		nullable: true,
		length: 50,
	})
	office_landmark: string;

	@Column('character varying', {
		name: 'office_pincode',
		nullable: true,
		length: 50,
	})
	office_pincode: string;

	@Column('character varying', {
		name: 'office_state',
		nullable: true,
		length: 50,
	})
	office_state: string;

	@Column('character varying', {
		name: 'income_proof',
		nullable: true,
		length: 50,
	})
	income_proof: string;

	@Column('boolean', {
		nullable: false,
		default: () => 'false',
		name: 'income_proof_updated',
	})
	income_proof_updated: boolean;

	@Column('character varying', {
		name: 'reference_address',
		nullable: true,
		length: 50,
	})
	reference_address: string;

	@Column('character varying', {
		name: 'reference_address_type',
		nullable: true,
		length: 50,
	})
	reference_address_type: string;

	@Column('character varying', {
		name: 'reference2_address_type',
		nullable: true,
		length: 50,
	})
	reference2_address_type: string;

	@Column('character varying', {
		name: 'reference_landmark',
		nullable: true,
		length: 50,
	})
	reference_landmark: string;

	@Column('character varying', {
		name: 'reference_pincode',
		nullable: true,
		length: 50,
	})
	reference_pincode: string;

	@Column('character varying', {
		name: 'reference_state',
		nullable: true,
		length: 50,
	})
	reference_state: string;

	@Column('character varying', {
		name: 'reference_mobile_number',
		nullable: true,
		length: 50,
	})
	reference_mobile_number: string;

	@Column('character varying', {
		name: 'reference2_name',
		nullable: true,
		length: 50,
	})
	reference2_name: string;

	@Column('character varying', {
		name: 'reference2_mobile_number',
		nullable: true,
		length: 50,
	})
	reference2_mobile_number: string;

	@Column('character varying', {
		name: 'reference2_address',
		nullable: true,
		length: 50,
	})
	reference2_address: string;

	@Column('character varying', {
		name: 'reference2_landmark',
		nullable: true,
		length: 50,
	})
	reference2_landmark: string;

	@Column('character varying', {
		name: 'reference2_pincode',
		nullable: true,
		length: 50,
	})
	reference2_pincode: string;

	@Column('character varying', {
		name: 'reference2_state',
		nullable: true,
		length: 50,
	})
	reference2_state: string;

	@Column('character varying', {
		name: 'reference2_relationship',
		nullable: true,
		length: 50,
	})
	reference2_relationship: string;

	@Column('boolean', {
		name: 'has_terms_aggreed',
		nullable: false,
		default: () => 'false',
	})
	has_terms_aggreed: boolean;

	@Column('character varying', {
		name: 'employer_name',
		nullable: true,
		length: 50,
	})
	employer_name: string;

	@Column('character varying', {
		name: 'bank_branch_identifier_code',
		nullable: true,
		length: 50,
	})
	bank_branch_identifier_code: string;

	@Column('character varying', {
		name: 'reference_address_type_code',
		nullable: true,
		length: 50,
	})
	reference_address_type_code: string;

	@Column('character varying', {
		name: 'reference_resident_status_code',
		nullable: true,
		length: 50,
	})
	reference_resident_status_code: string;

	@Column('character varying', {
		name: 'reference2_address_type_code',
		nullable: true,
		length: 50,
	})
	reference2_address_type_code: string;

	@Column('character varying', {
		name: 'reference2_resident_status_code',
		nullable: true,
		length: 50,
	})
	reference2_resident_status_code: string;

	@Column('character varying', {
		name: 'state_code',
		nullable: true,
		length: 50,
	})
	state_code: string;
}
