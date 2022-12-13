import { ViewEntity, ViewColumn } from 'typeorm';

@ViewEntity({ name: 'Customer' })
export class FinnOneCustomer {
	@ViewColumn({ name: 'Customer Number' })
	CUSTOMER_NUMBER: number;

	@ViewColumn({ name: 'Neo CIF ID' })
	Neo_CIF_ID: string;

	@ViewColumn({ name: 'Customer ID' })
	CUSTOMER_ID: number;

	@ViewColumn({ name: 'First Name' })
	First_Name: string;

	@ViewColumn({ name: 'Last Name' })
	Last_Name: string;

	@ViewColumn({ name: 'Salutation' })
	Salutation: string;

	@ViewColumn({ name: 'Gender' })
	GENDER: string | null;

	@ViewColumn({ name: 'Marital Status' })
	MARITAL_STATUS: string | null;

	@ViewColumn({ name:  'Date Of Birth'})
	DOB: Date | null;

	@ViewColumn({ name: 'Identification Number' })
	Identification_Number: string | null;

	@ViewColumn({ name: 'Nature of Profession' })
	Nature_of_Profession: string;

	@ViewColumn({ name: 'Registration Number' })
	Registration_Number: string;

	@ViewColumn({ name: 'Industry' })
	INDUSTRY: string;

	@ViewColumn({ name: 'Industry Code' })
	Industry_Code: string;
}

@ViewEntity({ name: 'Customers' })
export class FinnOneCustomers {
	

	@ViewColumn()
	CUSTOMER_CIF: string;

	@ViewColumn({ name: 'CUSTOMER NAME' })
	CUSTOMER_NAME: string | null;
	
	// @ViewColumn()
	// Salutation: string | null;

	// @ViewColumn({ name: 'CUSTOMER TYPE' })
	// CUSTOMER_TYPE: string | null;

	// @ViewColumn()
	// GENDER: string | null;

	// @ViewColumn({ name: 'MARITAL STATUS' })
	// MARITAL_STATUS: string | null;

	// @ViewColumn()
	// INDUSTRY: string | null;

	// @ViewColumn()
	// PROFESSION: string | null;

	// @ViewColumn({ name: 'CUSTOMER CONSTITUTION' })
	// CUSTOMER_CONSTITUTION: string | null;

	// @ViewColumn({ name: 'Primary Phone Number' })
	// Primary_Phone_Number: string | null;

	// @ViewColumn({ name: 'Preferred Language' }) customerProfile;
	// Preferred_Language: string | null;

	// @ViewColumn()
	// Category: string | null;

	// @ViewColumn()
	// Segment: string | null;
}

@ViewEntity({ name: 'Communication Details' })
export class FinnOneCommunicationDetails {
	@ViewColumn({ name: 'Customer Number' })
	CUSTOMER_NUMBER: number;

	@ViewColumn({ name: 'Mobile Number' })
	Primary_Mobile_Number: string | null;

	@ViewColumn({ name: 'Email ID' })
	Email_Address: string | null;
}


@ViewEntity({ name: 'Customer Phone Details' })
export class FinnOneCustomerPhoneDetails {
	@ViewColumn({ name: 'Customer Number' })
	CUSTOMER_NUMBER: string;

	@ViewColumn({ name: 'Country Code' })
	Country_Code: string | null;

	@ViewColumn()
	Extension: string | null;

	@ViewColumn({ name: 'ISD Code' })
	ISD_Code: string | null;

	@ViewColumn({ name: 'Number Type' })
	Number_Type: string | null;

	@ViewColumn({ name: 'Phone Number' })
	Phone_Number: string | null;

	@ViewColumn({ name: 'Primary Telephone' })
	Primary_Telephone: string | null;

	@ViewColumn({ name: 'STD Code' })
	STD_Code: string | null;

	@ViewColumn()
	Verified: string | null;

	@ViewColumn({ name: 'Associated Loan Application ID' })
	Associated_Loan_Application_ID: string | null;
}

@ViewEntity({ name: 'Customer IdentificationDetails' })
export class FinnOneCustomerIdDetailsView {
	@ViewColumn({ name: 'Customer Number' })
	CUSTOMER_NUMBER: string;

	@ViewColumn({ name: 'Associated Loan Application ID' })
	Associated_Loan_Application_ID: string | null;

	@ViewColumn({ name: 'Default ID of the Customer' })
	Default_ID_of_the_Custome: string | null;

	@ViewColumn({ name: 'Expiry Date' })
	Expiry_Date: Date | null;

	@ViewColumn({ name: 'Identification Type' })
	Identification_Type: string | null;

	@ViewColumn({ name: 'Issue Date' })
	Issue_Date: Date | null;

	@ViewColumn()
	'Primary ID': string | null;

	@ViewColumn()
	'Global Customer Reference ID': string | null;
}

@ViewEntity({ name: 'Customer Email ID' })
export class FinnOneCustomerEmailIDView {
	@ViewColumn({ name: 'Customer Number' })
	CUSTOMER_NUMBER: string;

	@ViewColumn({ name: 'Primary Email' })
	Primary_Email: string | null;
}

@ViewEntity('Customer Address Details')
export class FinnOneCustomerAddressDetailsView {
	@ViewColumn({ name: 'Customer Number' })
	CUSTOMER_NUMBER: string;

	// @ViewColumn({ name: 'Accomodation Type' })
	// Accomodation_Type: string | null;

	@ViewColumn({ name: 'Active Address' })
	Active_Address: string | null;

	@ViewColumn()
	Area: string | null;

	@ViewColumn()
	Country: string | null;

	@ViewColumn()
	District: string | null;

	@ViewColumn({ name: 'Full Address' })
	Full_Address: string | null;

	@ViewColumn()
	Region: string | null;

	@ViewColumn({ name: 'Residence Type Code' })
	Residence_Type_Code: string | null;

	@ViewColumn()
	Taluka: string | null;

	@ViewColumn()
	Village: string | null;

	@ViewColumn({ name: 'Associated Loan Application ID' })
	Associated_Loan_Application_ID: string | null;
}

@ViewEntity({ name: 'Application Information' })
export class FinnOneCustomerApplicationDetailsView {
	@ViewColumn({ name: 'Application Number' })
	APPLICATION_NUMBER: string;

	@ViewColumn({ name: 'Neo CIF ID' })
	Neo_CIF_ID: string;

	@ViewColumn({ name: 'Application Received Date' })
	APPLICATION_RECIEVED_DATE: string;

	@ViewColumn({ name: 'Disbursal Status' })
	Disbursal_Status: string;
}

@ViewEntity({ name: 'Instrumental Details' })
export class FinnOneCustomerInstrumentalDetailsView {
	@ViewColumn({ name: 'Application Number' })
	APPLICATION_NUMBER: string;

	@ViewColumn({ name: 'Bank Branch Identifier Code' })
	Bank_Branch_Identifier_Code: string;

	@ViewColumn({ name: 'Applicant BP Name' })
	Applicant_BP_Name: string;

	@ViewColumn({ name: 'Bank' })
	Bank: string;

	@ViewColumn({ name: 'Account Type' })
	Account_Type: string;

	@ViewColumn({ name: 'IFSC Code' })
	IFSC_Code: string;

	@ViewColumn({ name: 'Drawee Account Number' })
	Drawee_Account_Number: string;

	@ViewColumn({ name: 'Drawee Account Name' })
	Drawee_Account_Name: string;
}

@ViewEntity({ name: 'References' })
export class FinnOneCustomerReferencesView {
	@ViewColumn({ name: 'Application Number' })
	APPLICATION_NUMBER: string;

	@ViewColumn({ name: 'Reference Name' })
	Reference_Name: string | null;

	@ViewColumn({ name: 'Mobile Number' })
	Mobile_Number: string | null;

	@ViewColumn({ name: 'Flat Plot Number' })
	Flat_Plot_Number: string | null;

	@ViewColumn({ name: 'Resident Status' })
	Resident_Status: string | null;

	@ViewColumn({ name: 'Address Line 2' })
	Address_Line_2: string | null;

	@ViewColumn({ name: 'Address Line 3' })
	REF_Address_Line_3: string | null;

	@ViewColumn({ name: 'Pin Code' })
	Pin_Code: string | null;

	@ViewColumn({ name: 'State' })
	REF_State: string | null;

	@ViewColumn({ name: 'Reference Relationship Code' })
	Reference_Relationship: string | null;

	@ViewColumn({ name: 'Address Type' })
	Address_Type_Reference: string | null;

	@ViewColumn({ name: 'Address Type Code' })
	Address_Type_Code: string | null;

	@ViewColumn({ name: 'Resident Status Code' })
	Resident_Status_Code: string | null;

	@ViewColumn({ name: 'City Code' })
	City_Code: string | null;

	@ViewColumn({ name: 'State Code' })
	State_Code: string | null;
}

@ViewEntity({ name: 'Employment Details' })
export class FinnOneEmploymnetDetailsView {
	@ViewColumn({ name: 'Customer Number' })
	CUSTOMER_NUMBER: string;

	@ViewColumn({ name: 'Occupation Type' })
	OCCUPATION_TYPE: string;

	@ViewColumn({ name: 'Employer Name' })
	EMPLOYER_NAME: string;

	@ViewColumn({ name: 'Employer Code' })
	EMPLOYER_CODE: string;

	@ViewColumn({ name: 'Nature Of Business' })
	NATURE_OF_BUSSINESS: string;

	@ViewColumn({ name: 'Years in Occupation' })
	YEARS_IN_OCCUPATION: string;

	@ViewColumn({ name: 'Months in Occupation' })
	MONTHS_IN_OCCUPATION: string;

	@ViewColumn({ name: 'Organization Name' })
	ORGANIZATION_NAME: string;

	@ViewColumn({ name: 'Major Occupation' })
	MAJOR_OCCUPATION: string;
}

@ViewEntity({ name: 'Address Details' })
export class FinnOneAddressDetailsView {
	@ViewColumn({ name: 'Customer Number' })
	CUSTOMER_NUMBER: string;

	@ViewColumn({ name: 'Resident Status Code' })
	Accomodation_Type: string;

	@ViewColumn({ name: 'Address 1' })
	Address_Line_1: string | null;

	@ViewColumn({ name: 'Address 2' })
	Address_Line_2: string | null;

	@ViewColumn({ name: 'Address 3' })
	Address_Line_3: string | null;

	@ViewColumn({ name: 'Addresstype' })
	Address_Type: string | null;

	@ViewColumn({ name: 'City Code' })
	City: string | null;

	@ViewColumn()
	Landmark: Date | null;

	@ViewColumn({ name: 'Primary Address' })
	Primary_Address: string | null;

	@ViewColumn({ name: 'Pincode' })
	Zipcode: string | null;

	@ViewColumn({ name: 'State Code' })
	State: string | null;

	@ViewColumn({ name: 'Years at Current Address' })
	Years_at_Current_Address: string;

	@ViewColumn({ name: 'Months at Current Address' })
	Months_at_Current_Address: string;

	@ViewColumn({ name: 'Years at Current City' })
	Years_at_Current_City: string;

	@ViewColumn({ name: 'Months at Current City' })
	Months_at_Current_City: string;
}

@ViewEntity({ name: 'Income Details' })
export class FinnOneIncomeDetailsView {
	@ViewColumn({ name: 'Customer Number' })
	CUSTOMER_NUMBER: string;

	@ViewColumn({ name: 'Monthly Income' })
	MONTHLY_INCOME: string;

	@ViewColumn({name: 'Total Income'})
	Total_Income:string;
}

export const FinnOneDBColumnMapping = {
	First_Name: {
		entity: ['Customer'],
		column: ['first_name'],
	},
	Last_Name: {
		entity: ['Customer'],
		column: ['last_name'],
	},
	Email_Address: {
		entity: ['Customer'],
		column: ['email'],
	},
	GENDER: {
		entity: ['Customer'],
		column: ['gender'],
	},
	Primary_Mobile_Number: {
		entity: ['Customer'],
		column: ['mobile_number'],
	},
	DOB: {
		entity: ['Customer'],
		column: ['date_of_birth'],
	},
	Extension: {
		entity: ['Customer'],
		column: ['mobile_number_ext'],
	},
	CUSTOMER_ID: {
		entity: ['CustomerProfile'],
		column: ['customer_id'],
	},
	Salutation: {
		entity: ['CustomerProfile'],
		column: ['salutation'],
	},
	// CUSTOMER_TYPE: {
	// 	entity: ['CustomerProfile'],
	// 	column: ['customer_type'],
	// },
	MARITAL_STATUS: {
		entity: ['CustomerProfile'],
		column: ['marital_status_code'],
	},
	INDUSTRY: {
		entity: ['CustomerProfile'],
		column: ['industry'],
	},
	Industry_Code: {
		entity: ['CustomerProfile'],
		column: ['industry_code'],
	},
	// PROFESSION: {
	// 	entity: ['CustomerProfile'],
	// 	column: ['profession'],
	// },
	// Preferred_Language: {
	// 	entity: ['CustomerProfile'],
	// 	column: ['preferred_language'],
	// },
	Identification_Number: {
		entity: ['CustomerProfile'],
		column: ['identification_number'],
	},
	Identification_Type: {
		entity: ['CustomerProfile'],
		column: ['identification_type'],
	},
	Issue_Date: {
		entity: ['CustomerProfile'],
		column: ['issue_date'],
	},
	country_code: {
		entity: ['CustomerProfile'],
		column: ['country_code'],
	},
	ISD_Code: {
		entity: ['CustomerProfile'],
		column: ['isd_code'],
	},
	Number_Type: {
		entity: ['CustomerProfile'],
		column: ['phone_number_type'],
	},
	// Primary_Phone_Number: {
	// 	entity: ['CustomerProfile'],
	// 	column: ['phone_number'],
	// },
	Primary_Telephone: {
		entity: ['CustomerProfile'],
		column: ['primary_telephone'],
	},
	STD_Code: {
		entity: ['CustomerProfile'],
		column: ['std_code'],
	},
	Accomodation_Type: {
		entity: ['CustomerProfile'],
		column: ['accomodation_type'],
	},
	Active_Address: {
		entity: ['CustomerProfile'],
		column: ['active_address'],
	},
	Address_Type: {
		entity: ['CustomerProfile'],
		column: ['address_type'],
	},
	Area: {
		entity: ['CustomerProfile'],
		column: ['area'],
	},
	City: {
		entity: ['CustomerProfile'],
		column: ['city'],
	},
	Country: {
		entity: ['CustomerProfile'],
		column: ['country'],
	},
	District: {
		entity: ['CustomerProfile'],
		column: ['district'],
	},
	Full_Address: {
		entity: ['CustomerProfile'],
		column: ['full_address'],
	},
	Landmark: {
		entity: ['CustomerProfile'],
		column: ['land_mark'],
	},
	Primary_Address: {
		entity: ['CustomerProfile'],
		column: ['primary_address'],
	},
	Region: {
		entity: ['CustomerProfile'],
		column: ['region'],
	},
	State: {
		entity: ['CustomerProfile'],
		column: ['state'],
	},
	State_Code: {
		entity: ['CustomerProfile'],
		column: ['reference_state'],
	},
	Taluka: {
		entity: ['CustomerProfile'],
		column: ['taluka'],
	},
	Village: {
		entity: ['CustomerProfile'],
		column: ['village'],
	},
	Primary_id: {
		entity: ['CustomerProfile'],
		column: ['primary_id'],
	},
	Address_Line_1: {
		entity: ['CustomerProfile'],
		column: ['address_line1'],
	},
	Address_Line_2: {
		entity: ['CustomerProfile'],
		column: ['address_line2'],
	},
	Address_Line_3: {
		entity: ['CustomerProfile'],
		column: ['address_line3'],
	},
	// Address_Line_4: {
	// 	entity: ['CustomerProfile'],
	// 	column: ['address_line4'],
	// },
	// CUSTOMER_CONSTITUTION: {
	// 	entity: ['CustomerProfile'],
	// 	column: ['constitution_description'],
	// },
	// Category: {
	// 	entity: ['CustomerProfile'],
	// 	column: ['customer_category'],
	// },
	Expiry_Date: {
		entity: ['CustomerProfile'],
		column: ['expiry_date_of_identification'],
	},
	Primary_Email: {
		entity: ['CustomerProfile'],
		column: ['is_primary_email'],
	},
	Verified: {
		entity: ['CustomerProfile'],
		column: ['is_phone_number_verified'],
	},
	Neo_CIF_ID: {
		entity: ['CustomerProfile'],
		column: ['customer_info_file_number'],
	},
	Associated_Loan_Application_ID: {
		entity: ['CustomerProfile'],
		column: ['associated_loan_app_id'],
	},
	Default_ID_of_the_Custome: {
		entity: ['CustomerProfile'],
		column: ['default_id_for_customer'],
	},
	Residence_Type_Code: {
		entity: ['CustomerProfile'],
		column: ['residence_type'],
	},
	Zipcode: {
		entity: ['CustomerProfile'],
		column: ['pin_code'],
	},
	Address_Type_Reference: {
		entity: ['CustomerProfile'],
		column: ['reference_address_type'],
	},
	Address_Type_Code: {
		entity: ['CustomerProfile'],
		column: ['reference_address_type_code'],
	},
	Resident_Status_Code: {
		entity: ['CustomerProfile'],
		column: ['reference_resident_status_code'],
	},
	City_Code:{
		entity: ['CustomerProfile'],
		column: ['reference_city_code'],
	},
	Reference_Name: {
		entity: ['CustomerProfile'],
		column: ['reference_name'],
	},
	Mobile_Number: {
		entity: ['CustomerProfile'],
		column: ['reference_mobile_number'],
	},
	Flat_Plot_Number: {
		entity: ['CustomerProfile'],
		column: ['reference_address'],
	},
	Resident_Status: {
		entity: ['CustomerProfile'],
		column: ['reference_resident_status'],
	},
	REF_Address_Line_3: {
		entity: ['CustomerProfile'],
		column: ['reference_landmark'],
	},
	Pin_Code: {
		entity: ['CustomerProfile'],
		column: ['reference_pincode'],
	},
	REF_State: {
		entity: ['CustomerProfile'],
		column: ['reference_state'],
	},
	Reference_Relationship: {
		entity: ['CustomerProfile'],
		column: ['reference_relationship'],
	},
	//Bank Details changes - last commit start
	Bank: {
		entity: ['CustomerProfile'],
		column: ['bank_name_id'],
	},
	Account_Type: {
		entity: ['EMandate'],
		column: ['account_type'],
	},
	Drawee_Account_Number: {
		entity: ['EMandate'],
		column: ['account_number'],
	},
	Drawee_Account_Name: {
		entity: ['EMandate'],
		column: ['full_name'],
	},
	IFSC_Code: {
		entity: ['CustomerProfile'],
		column: ['ifsc'],
	},
	Bank_Branch_Identifier_Code: {
		entity: ['CustomerProfile'],
		column: ['bank_branch_identifier_code'],
	},
	Years_at_Current_Address: {
		entity: ['CustomerProfile'],
		column: ['years_at_current_state'],
	},
	Months_at_Current_Address: {
		entity: ['CustomerProfile'],
		column: ['months_at_current_state'],
	},
	Years_at_Current_City: {
		entity: ['CustomerProfile'],
		column: ['duration_at_current_city'],
	},
	Months_at_Current_City: {
		entity: ['CustomerProfile'],
		column: ['month_duration_at_current_city'],
	},
	OCCUPATION_TYPE: {
		entity: ['CustomerProfile'],
		column: ['occupation_type'],
	},
	EMPLOYER_NAME: {
		entity: ['CustomerProfile'],
		column: ['employer_name'], //to be added
	},
	EMPLOYER_CODE: {
		entity: ['CustomerProfile'],
		column: ['employer_code'],
	},
	NATURE_OF_BUSSINESS: {
		entity: ['CustomerProfile'],
		column: ['nature_of_business'],
	},
	Work_Experience: {
		entity: ['CustomerProfile'],
		column: ['work_experience'],
	},
	Nature_of_Profession: {
		entity: ['CustomerProfile'],
		column: ['nature_of_profession'],
	},
	Registration_Number: {
		entity: ['CustomerProfile'],
		column: ['registration_number'],
	},
	ORGANIZATION_NAME: {
		entity: ['CustomerProfile'],
		column: ['organization_name'],
	},
	YEARS_IN_OCCUPATION: {
		entity: ['CustomerProfile'],
		column: ['years_in_job'],
	},
	YEARS_IN_BUSINESS: {
		entity: ['CustomerProfile'],
		column: ['years_in_business'],
	},
	MONTHS_IN_OCCUPATION: {
		entity: ['CustomerProfile'],
		column: ['months_in_job'], //to be added
	},
	//MONTHLY_INCOME
	MONTHLY_INCOME: {
		entity: ['CustomerProfile'],
		column: ['monthly_income'], //to be added
	},
	Total_Income: {
		entity: ['CustomerProfile'],
		column: ['total_income'], //to be added
	},
	//Bank Details changes - last commit end
	// OCCUPATION_TYPE : {
	// 		entity: ['CustomerProfile'],
	// 		column: ['occupation_type']
	// 	},

	// 	EMPLOYER_NAME : {
	// 		entity: ['CustomerProfile'],
	// 		column: ['employer_name'] //to be added
	// 	},

	// 	NATURE_OF_BUSSINESS : {
	// 		entity: ['CustomerProfile'],
	// 		column: ['nature_of_business']
	// 	},
	// 	YEARS_IN_OCCUPATION : {
	// 		entity: ['CustomerProfile'],
	// 		column: ['years_in_job']
	// 	},

	// 	MONTHS_IN_OCCUPATION : {
	// 		entity: ['CustomerProfile'],
	// 		column: ['months_in_job']   //to be added
	// 	},

	// 	//MONTHLY_INCOME
	// 	MONTHLY_INCOME : {
	// 		entity: ['CustomerProfile'],
	// 		column: ['monthly_income']   //to be added
	// 	},
};
