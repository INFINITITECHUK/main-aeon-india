import { HttpException, Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Customer } from '@entities/customer.entity';
import { getConnection, getRepository, Repository } from 'typeorm';
import { ThirdPartyDefaults } from '@entities/ThirdPartyDefaults.entity';
import { CustomerProfile } from '@entities/CustomerProfile.entity';
import { EMandate } from '@entities/EMandate.entity';
import * as moment from 'moment';
import { CustomerApplication } from '@entities/CustomerApplication.entity';
import { EmandateStatusSetDto } from '@dtos/EmandateStatusSet.dto';
import { branchCodeMapEnum } from '@common/constants/branchCodeMap.enum';
import axios from 'axios';
import { Status } from '@common/constants/status.enum';
import { EmandatePennydropApiService } from '@modules/customer-login/emandate-pennydrop.api.service';

import * as xml2js from 'xml2js';
import { ThirdPartyAPILogs } from '@common/utils/api-logger';
import { titleCase } from '@utils/helpers';
import { InterestRateDetails } from '@entities/InterestRateDetails';
import { exists } from 'fs';
import { response } from 'express';
import { StateCode } from '@entities/StateCode';

const thirdPartyAPILogs = new ThirdPartyAPILogs('creditUpdate');

@Injectable()
export class CustomerRlApplicationApiService {
	constructor(
		private readonly emandatePennydropApiService: EmandatePennydropApiService,
		@InjectRepository(Customer)
		private readonly customerRepository: Repository<Customer>,
		@InjectRepository(ThirdPartyDefaults)
		private readonly thirdPartyDefaultsRepository: Repository<ThirdPartyDefaults>,
		@InjectRepository(CustomerProfile)
		private readonly customerProfileRepository: Repository<CustomerProfile>,
		@InjectRepository(EMandate)
		private readonly eMandateRepository: Repository<EMandate>,
		@InjectRepository(CustomerApplication)
		private readonly customerApplicationRepository: Repository<CustomerApplication>,
		@InjectRepository(InterestRateDetails)
		private readonly interestRateDetailsRepo: Repository<InterestRateDetails>,
	) {}

	async emandateStatusSet(
		emandateStatusSetDto: EmandateStatusSetDto,
		customerIdx,
	) {
		let physicalMandateStatus;
		let emandate = await this.eMandateRepository.findOne({
			where: {
				customer_idx: customerIdx,
			},
		});

		if (!emandate) {
			throw new HttpException('User emandate information does not exist', 400);
		}
		if (emandate.physical_mandate_verification === 'PENDING') {
			throw new HttpException(
				'The bank information is awaiting manual approval',
				400,
			);
		} else {
			if (!emandate.emandate_failure_data){
				physicalMandateStatus = emandate.physical_mandate_verification
			}
			else {
				physicalMandateStatus =
					emandate.emandate_failure_data.length > 1
						? Status.PENDING
						: emandate.physical_mandate_verification;
			}
		}
		const emandateFailureData = emandate.emandate_failure_data ?
			emandate.emandate_failure_data :
			[];
		const pennyDropFailureData = emandate.pennydrop_failure_data ?
			emandate.pennydrop_failure_data :
			[];
		const pennydropSuccessData = emandateStatusSetDto.pennydrop_success_data
			? emandateStatusSetDto.pennydrop_success_data
			: emandate.pennydrop_success_data;
		const emandateSuccessData = emandateStatusSetDto.emandate_success_data
			? emandateStatusSetDto.emandate_success_data
			: emandate.emandate_success_data;
		if (emandateStatusSetDto.emandate_failure_response) {
			emandateFailureData.push(emandateStatusSetDto.emandate_failure_response);
		}
		if (emandateStatusSetDto.pennydrop_failure_response) {
			pennyDropFailureData.push(
				emandateStatusSetDto.pennydrop_failure_response,
			);
		}

		await this.eMandateRepository.update(
			{
				id: emandate.id,
			},
			{
				penny_drop_status: emandateStatusSetDto.penny_drop_success,
				emandate_status: emandateStatusSetDto.emandate_success,
				emandate_failure_data: emandateFailureData,
				pennydrop_failure_data: pennyDropFailureData,
				emandate_success_data: emandateSuccessData,
				pennydrop_success_data: pennydropSuccessData,
				physical_mandate_verification: physicalMandateStatus,
			},
		);
		emandate = await this.eMandateRepository.findOne({
			where: {
				customer_idx: customerIdx,
			},
		});
		if (
			emandate.emandate_status == Status.APPROVED &&
			emandate.penny_drop_status == Status.APPROVED
		) {
			getConnection().query(
				`update "public"."CustomerWallet" set is_rl_active = 'ACTIVE' where customer_idx = '${customerIdx}'`,
			);
		} else {
			getConnection().query(
				`update "public"."CustomerWallet" set is_rl_active = 'INACTIVE' where customer_idx = '${customerIdx}'`,
			);
		}
		this.emandatePennydropApiService.updateFinoneApplication(emandate, emandateStatusSetDto);

		throw new HttpException(
			{
				message: 'operations.EMANDATE_SUCCESS',
			},
			HttpStatus.OK,
		);
	}

	async getBase64Image(fileName){
		let base64 = ''
		if (!fileName){
			return base64
		}
		const requestURL = `${process.env.MINIO_FILE_SERVE_URL+process.env.ADDRESSPROOF_BUCKETNAME}/${fileName}`
		console.log(requestURL)
		const response = await axios
    .get(requestURL, {
      responseType: 'arraybuffer'
    })
		base64 = Buffer.from(response.data).toString('base64')
		return base64
	}

	async getRLApplicationStatus(customeIdx) {
		const emandate = await this.eMandateRepository.findOne({
			where: {
				customer_idx: customeIdx,
			},
		});
		const customerApplication = await this.customerApplicationRepository.findOne(
			{
				where: {
					customer_idx: customeIdx,
				},
			},
		);
		let customerApplicationFinal;
		if (!customerApplication) {
			customerApplicationFinal = {
				approval_status: 'INACTIVE',
				can_add_bank: false,
			};
		} else {
			customerApplicationFinal = customerApplication;
		}

		return {
			penny_drop_success: emandate ? emandate.penny_drop_status : 'INACTIVE',
			emandate_success: emandate ? emandate.emandate_status : 'INACTIVE',
			physical_mandate_verification: emandate
				? emandate.physical_mandate_verification
				: 'INACTIVE',
			emandate_failure_count: (emandate && emandate.emandate_failure_data)
				? emandate.emandate_failure_data.length
				: 0,
			pennydrop_failure_count:  (emandate && emandate.pennydrop_failure_data)
				? emandate.pennydrop_failure_data.length
				: 0,
			application_approval_status: customerApplicationFinal
				? customerApplicationFinal.approval_status
				: 'INACTIVE',
			can_add_bank: emandate ? customerApplicationFinal.can_add_bank : false,
		};
	}

	async applyRL(customerIdx, applicationDto) {
		const interestRateSetting = await this.interestRateDetailsRepo.findOne({
			where: { is_obsolete: false },
			select: ['interest_rate'],
		});

		const customerApplication = await this.customerApplicationRepository.findOne(
			{
				where: {
					customer_idx: customerIdx,
				},
			},
		);

		if (customerApplication && customerApplication.approval_status == Status.PENDING) {
			throw new HttpException(
				'Customer already has a pending application',
				400,
			);
		}
		if (customerApplication && customerApplication.approval_status == Status.APPROVED) {
			throw new HttpException('Customer already has an approved status', 400);
		}
		const customer = await this.customerRepository.findOne({
			where: {
				idx: customerIdx,
			},
		});

		const customerProfile = await this.customerProfileRepository.findOne({
			where: {
				customer: customer,
			},
		});

		const emandate = await this.eMandateRepository.findOne({
			where: {
				customer_idx: customer.idx,
			},
		});
		const [rlInterestDetails] = await getConnection().query(
			'select * from "InterestRateDetails"',
		);

		const requestBody = await this.prepareRequestBody(
			customer,
			customerProfile,
			applicationDto,
			emandate,
			rlInterestDetails
		);

		console.log(requestBody);
		const response: any = await axios
			.post(`${process.env.CUSTOMER_RL_APPLICATION}`, requestBody, {
				headers: {
					'Content-Type': 'text/xml',
				},
			})
			.catch(e => {
				return e.response;
			});
		try {
			thirdPartyAPILogs.log(requestBody, response.data);
		} catch (e) {
			console.log(e);
		}

		if (response.status === 500){
			throw new HttpException('There was an error during the application. Please try again later', 400)
		}

		const responseJson = await xml2js.parseStringPromise(response.data, {
			mergeAttrs: true,
		});
		let application = JSON.stringify(
			responseJson['soapenv:Envelope']['soapenv:Body'][0][
				'ns6:createApplicationResponse'
			][0],
		);
		application = JSON.parse(application);
		const applicationNumber = application['ns6:applicationNumber'][0];
		const applicationId = application['ns6:applicationId'][0];
		const customerNumber = application['ns6:customerNumber'][0];
		// const cifNumber = application['ns6:cifNumber'][0];
		const interestRate = application['ns6:interestRate'][0];

		if (
			customerApplication
			// && customerApplication.approval_status == Status.REJECTED
		) {
			await this.customerApplicationRepository.update(
				{
					id: customerApplication.id,
				},
				{
					customer_idx: customer.idx,
					approval_status: Status.PENDING,
					application_id: applicationId,
					application_number: applicationNumber,
					interest_rate: interestRate,
					customer_number: customerNumber,
					customer_name: customer.getFullName() ,
				},
			);
		} else {
			await this.customerApplicationRepository.save({
				customer_idx: customer.idx,
				application_id: applicationId,
				application_number: applicationNumber,
				interest_rate: interestRate,
				customer_number: customerNumber,
				customer_name: customer.getFullName(),
			});
		}

		return {
			message: `Your application with Loan Application No: ${applicationNumber} is under assessment. Expected Time is 2-3 days.`,
			application_id: applicationNumber,
		};
	}

	async getDocuments(customer, customerProfile){
		let documentString = ''
		let defermentString = `
		         <sch1:dynamicFormDetails>
								<sch1:dynamicFormName>Deferment Details</sch1:dynamicFormName>
								<sch1:dynamicFormData>{"panel_deferment_details":{"field_deferment_choice":"YES","field_deferment_reasons":"Customer updating <XXXXDefermentItemsXXXX>details"}}
            </sch1:dynamicFormData>
        </sch1:dynamicFormDetails>
		`
		const middleName = customer.middle_name ? ' ' + customer.middle_name : ''
		const customerFullName = customer.first_name + middleName + ' ' + customer.last_name

		const incomeProof = await this.getBase64Image(customerProfile.income_proof)
		const addressProof = await this.getBase64Image(customerProfile.address_proof)
		if (incomeProof || addressProof){
			let defermentDetailString = ''
			defermentDetailString = incomeProof ? (defermentDetailString + 'Income ') : defermentDetailString
			defermentDetailString = addressProof ? (defermentDetailString + 'Address ') : defermentDetailString
			defermentString = defermentString.replace('<XXXXDefermentItemsXXXX>', defermentDetailString)
		} else {
			defermentString = ''
		}
		if (incomeProof){
			documentString = documentString +
				`					<sch1:documents>
						<sch1:referenceType>Customer</sch1:referenceType>
						<sch1:entityType>${customerFullName}</sch1:entityType>
						<sch1:documentName>Financial Documents</sch1:documentName>
						<sch1:recievingDate>${moment().format('YYYY-MM-DD')}</sch1:recievingDate>
						<sch1:status>2</sch1:status>
						<sch1:remarks>Income Proof Upload</sch1:remarks>
						<sch1:attachmentDetails>
								<sch1:attachedDocument sch1:contentType="jpeg">${incomeProof}</sch1:attachedDocument>
						</sch1:attachmentDetails>
					</sch1:documents>`
		}
		if (addressProof){
		documentString = documentString +
			`<sch1:documents>
					<sch1:referenceType>Customer</sch1:referenceType>
						<sch1:entityType>${customerFullName}</sch1:entityType>
						<sch1:documentName>Other Document</sch1:documentName>
						<sch1:recievingDate>${moment().format('YYYY-MM-DD')}</sch1:recievingDate>
						<sch1:status>2</sch1:status>
						<sch1:remarks>AddressProof Proof Upload</sch1:remarks>
						<sch1:attachmentDetails>
								<sch1:attachedDocument sch1:contentType="jpeg">${addressProof}</sch1:attachedDocument>
						</sch1:attachmentDetails>
					</sch1:documents>`
		}
		documentString = documentString + defermentString
		return documentString
	}

	async prepareRequestBody(
		customer: Customer,
		customerProfile,
		applicationDto,
		emandate,
		rlInterestDetails
	) {
		const [defaults] = await getConnection().query(
			'SELECT * FROM "ThirdPartyDefaults"',
		);
		let bankDetails = ``;
		let occupationInfo = ``;
		let incomeDetailsInfo = ``;
		const documentString = await this.getDocuments(customer, customerProfile)
		if (emandate && emandate.bank_code && emandate.branch_code && emandate.account_type && emandate.account_number){
			bankDetails = `
					<sch1:bankDetails>
					<sch1:bankCode>${emandate.bank_code}</sch1:bankCode>
					<sch1:branchCode>${emandate.branch_code}</sch1:branchCode>
					<sch1:accountType>${
				emandate.account_type
			}</sch1:accountType>
			 <sch1:accountNumber>${
				emandate.account_number
			}</sch1:accountNumber>
				<sch1:bankDetailType>M</sch1:bankDetailType>
				</sch1:bankDetails>`
		}
		bankDetails =''
		// if (customerProfile.occupation_type && customerProfile.nature_of_business && customerProfile.employer_code &&
		// customerProfile.years_in_job && customerProfile.months_in_job){
		if(customerProfile.occupation_type === 'Self Employed Non Professional'){
			incomeDetailsInfo = `
					<sch1:yearlyIncomeDetails>
						<sch1:year3>${moment().format('YYYY')}</sch1:year3>
						<sch1:YearDetails>
							<sch1:incomeExpense>BS</sch1:incomeExpense>
							<sch1:value>${customerProfile.total_income}</sch1:value>
						</sch1:YearDetails>
					</sch1:yearlyIncomeDetails>
			`
			occupationInfo = `
					<sch1:occupationInfo>
					<sch1:isMajorEmployment>1</sch1:isMajorEmployment>
						<sch1:industry>${customerProfile.industry_code}</sch1:industry>
						 <sch1:occupationType>selfEmployedNonProfessional</sch1:occupationType>
						<sch1:natureOfBusiness>${customerProfile.nature_of_business}</sch1:natureOfBusiness>
<!--						 <sch1:employerCode>${customerProfile.employer_code}</sch1:employerCode>-->
						<sch1:yearsInOccupation>${customerProfile.years_in_job}</sch1:yearsInOccupation>
						 <sch1:yearsInJob>${customerProfile.years_in_job}</sch1:yearsInJob>
						 <sch1:monthsInJob>${customerProfile.months_in_job}</sch1:monthsInJob>
<!--						 <sch1:employmentStatus>Present</sch1:employmentStatus>-->
						</sch1:occupationInfo>`
		} else if(customerProfile.occupation_type === 'Self Employed Professional'){
				incomeDetailsInfo = `
					<sch1:yearlyIncomeDetails>
						<sch1:year3>${moment().format('YYYY')}</sch1:year3>
						<sch1:YearDetails>
							<sch1:incomeExpense>BS</sch1:incomeExpense>
							<sch1:value>${customerProfile.total_income}</sch1:value>
						</sch1:YearDetails>
					</sch1:yearlyIncomeDetails>
				`
				occupationInfo = `
					<sch1:occupationInfo>
						<sch1:isMajorEmployment>1</sch1:isMajorEmployment>
						<sch1:organizationName>${customerProfile.organization_name}</sch1:organizationName>
						<sch1:workExperience>${customerProfile.work_experience}</sch1:workExperience>
						<sch1:registrationNumber>${customerProfile.registration_number}</sch1:registrationNumber>
						<sch1:industry>${customerProfile.industry_code}</sch1:industry>
						<sch1:occupationType>selfEmployedProfessional</sch1:occupationType>
						<sch1:natureOfProfession>${customerProfile.nature_of_profession}</sch1:natureOfProfession>
	<!--						<sch1:employerCode>${customerProfile.employer_code}</sch1:employerCode>-->
						<sch1:yearsInOccupation>${customerProfile.years_in_job}</sch1:yearsInOccupation>
					  <sch1:yearsInJob>${customerProfile.years_in_job}</sch1:yearsInJob>
						<sch1:monthsInJob>${customerProfile.months_in_job}</sch1:monthsInJob>
						<sch1:employmentStatus>Present</sch1:employmentStatus>
					</sch1:occupationInfo>`
		} else if (customerProfile.occupation_type === 'Salaried'){
				incomeDetailsInfo = `
						<sch1:incomeDetails>
							<sch1:incomeExpense>BS</sch1:incomeExpense>
							<sch1:frequency>ANNUALLY</sch1:frequency>
							<sch1:amount>
								 <sch2:currencyCode>INR</sch2:currencyCode>
								 <sch2:value>${customerProfile.total_income}</sch2:value>
							</sch1:amount>
							<sch1:percentage>100</sch1:percentage>
					 </sch1:incomeDetails>`
				occupationInfo = `
					<sch1:occupationInfo>
						<sch1:isMajorEmployment>1</sch1:isMajorEmployment>
						<sch1:natureOfBusiness>${customerProfile.nature_of_business}</sch1:natureOfBusiness>
						<sch1:yearsInJob>${customerProfile.years_in_job}</sch1:yearsInJob>
						<sch1:monthsInJob>${customerProfile.months_in_job}</sch1:monthsInJob>
						<sch1:employmentStatus>Present</sch1:employmentStatus>
						<sch1:industry>${customerProfile.industry_code}</sch1:industry>
						<sch1:employerCode>${customerProfile.employer_code}</sch1:employerCode>
						<sch1:occupationType>salaried</sch1:occupationType>
					</sch1:occupationInfo>`
		}
			const requestBody = `
					<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sch="http://schema.base.ws.pro.finnone.nucleus.com" xmlns:sch1="http://schema.applicationservices.ws.pro.finnone.nucleus.com" xmlns:sch2="http://schema.cas.common.base.ws.pro.finnone.nucleus.com">
					 <soapenv:Header>
							<sch:Header>
								 <sch:version>?</sch:version>
								 <sch:requestId>?</sch:requestId>
								 <sch:serviceId>?</sch:serviceId>
								 <sch:operationId>?</sch:operationId>
								 <!--Optional:-->
								 <sch:transmissionPrimitive>?</sch:transmissionPrimitive>
								 <sch:languageCode>?</sch:languageCode>
								 <sch:tenantId>?</sch:tenantId>
								 <!--Optional:-->
								 <sch:tenantName>?</sch:tenantName>
								 <!--Optional:-->
								 <sch:transactionId>?</sch:transactionId>
								 <sch:userDetail>
										<sch:userCode>?</sch:userCode>
										<!--Optional:-->
										<sch:userName>?</sch:userName>
										<!--Optional:-->
										<sch:userRole>?</sch:userRole>
										<sch:branchCode>?</sch:branchCode>
										<!--Optional:-->
										<sch:branchName>?</sch:branchName>
										<sch:branchId>?</sch:branchId>
								 </sch:userDetail>
							</sch:Header>
					 </soapenv:Header>
					 <soapenv:Body>
							<sch1:createApplicationRequest>
								 <sch1:productProcessor>${defaults.product_processor}</sch1:productProcessor>
								 <sch1:branchCode>${
										branchCodeMapEnum[applicationDto.branch_code]
									}</sch1:branchCode>
								 <sch1:userName>krishna_jk</sch1:userName>
								 <sch1:productTypeCode>PF</sch1:productTypeCode>
								 <sch1:moveToNextStageFlag>1</sch1:moveToNextStageFlag>
								 <sch1:loanDetails>
										<sch1:sourcingDetail>
											 <sch1:loanInfo>
													<sch1:loanAmountRequested>
													 <sch2:value>${applicationDto.request_amount}</sch2:value>
													</sch1:loanAmountRequested>
													<sch1:requestedTenure>360</sch1:requestedTenure>
													<sch1:requestedRate>${rlInterestDetails.interest_rate}</sch1:requestedRate>
													<sch1:productCode>RL</sch1:productCode>
													<sch1:schemeCode>RL_S1</sch1:schemeCode>
													<sch1:loanPurpose>MULTIPURPOSE</sch1:loanPurpose>
											 </sch1:loanInfo>
											 <sch1:loanApplication>
													<sch1:loanBranch>${
														branchCodeMapEnum[applicationDto.branch_code]
													}</sch1:loanBranch>
											 </sch1:loanApplication>
											 <sch1:applicationDetails>
													<sch1:officer>${process.env.LOAN_OFFICER_THIRD_PARTY}</sch1:officer>
													<sch1:loanApplicationType>NewApplication</sch1:loanApplicationType>
													<sch1:sourcingBranch>${branchCodeMapEnum[applicationDto.branch_code]}</sch1:sourcingBranch>
													<sch1:sourcingChannel>BRANCH</sch1:sourcingChannel>
											 </sch1:applicationDetails>
										</sch1:sourcingDetail>
										<sch1:loanParameterDetail>
		                    <sch1:advanceEmiDeducted>0</sch1:advanceEmiDeducted>
		                    <sch1:disbursalTo>CUSTOMER</sch1:disbursalTo>
		                    <sch1:disbursalType>2</sch1:disbursalType>
		                    <sch1:downPaymentPaidDirectly>0</sch1:downPaymentPaidDirectly>
		                    <sch1:dueDay>1</sch1:dueDay>
		                    <sch1:installmentMode>1</sch1:installmentMode>
		                    <sch1:installmentType>201</sch1:installmentType>
		                    <sch1:installmentBasedOn>Rate Based</sch1:installmentBasedOn>
		                    <sch1:interestStartDate>${moment().format(
													'YYYY-MM-DD',
												)}</sch1:interestStartDate>
		                    <sch1:paymentFrequency>2</sch1:paymentFrequency>
		                    <sch1:repayScheduleBasedOn>REPAYMENT_INSTALLMENT_BASED</sch1:repayScheduleBasedOn>
		                    <sch1:value>${applicationDto.request_amount}</sch1:value>
		                    <sch1:interestRate>${
													rlInterestDetails.interest_rate
												}</sch1:interestRate>
		                    <sch1:interestChargeMethod>1</sch1:interestChargeMethod>
		                    <sch1:interestRateType>1</sch1:interestRateType>
		              </sch1:loanParameterDetail>

								 </sch1:loanDetails>
								 <sch1:applicantInformation>
										<sch1:customerType>individual</sch1:customerType>
										<sch1:CIFNumber>${customerProfile.customer_info_file_number}</sch1:CIFNumber>
										<sch1:personInfo>
											 <sch1:gender>${customer.gender.toUpperCase()}</sch1:gender>
											 <!--Optional:-->
											 <sch1:salutation>${customerProfile.salutation.toUpperCase()}</sch1:salutation>
											 <sch1:firstName>${customer.first_name}</sch1:firstName>
											 <!--Optional:-->
											 <sch1:middleName>${customer.middle_name}</sch1:middleName>
											 <sch1:lastName>${customer.last_name}</sch1:lastName>
											 <!--Optional:-->
<!--											 <sch1:aliasName>${customer.first_name} ${customer.last_name}</sch1:aliasName>-->
		<!--									 <sch1:mothersMaidenName>abc</sch1:mothersMaidenName>-->
											 <sch1:dateOfBirth>${moment(customer.date_of_birth).format(
													'YYYY-MM-DD',
												)}</sch1:dateOfBirth>
											 <sch1:maritalStatus>${titleCase(customerProfile.marital_status_code)}</sch1:maritalStatus>
											 <sch1:constitutionCode>Indiv</sch1:constitutionCode>

											 <!--Optional:-->
											 <sch1:placeOfBirth>India</sch1:placeOfBirth>
											 <sch1:nationality>Indian</sch1:nationality>
											 <!--IndianOrigin:-->
											 <sch1:residentType>Resident</sch1:residentType>
											 <sch1:customerCategoryCode>GEN</sch1:customerCategoryCode>
										</sch1:personInfo>
										<sch1:identificationDetails>
											 <sch1:identificationType>PAN</sch1:identificationType>
											 <sch1:identificationNumber>${customer.panno}</sch1:identificationNumber>
											 <sch1:issueDate/>
		<!--									 <sch1:expiryDate>2020-12-10</sch1:expiryDate>-->
											 <sch1:issuingCountry>IND</sch1:issuingCountry>
										</sch1:identificationDetails>
										<sch1:addressDetails>
											 <sch1:addressType>ResidentialAddress</sch1:addressType>
											 <sch1:country>IND</sch1:country>
											 <sch1:addressLine1>${customerProfile.address_line1}</sch1:addressLine1>
											 <sch1:state>${customerProfile.state}</sch1:state>
											 <!--Optional:-->
		<!--									 <sch1:addressLine2>Pabrade</sch1:addressLine2>-->
											 <sch1:zipcode>${customerProfile.pin_code}</sch1:zipcode>
											 <sch1:accomodationType>${
													customerProfile.accomodation_type
												}</sch1:accomodationType>
											 <!--Optional:-->
											 <sch1:landMark>${customerProfile.land_mark}</sch1:landMark>
											 <!--Optional:-->
											 <sch1:yearsInCurrentCity>${
													customerProfile.duration_at_current_city
												}</sch1:yearsInCurrentCity>
											 <!--Optional:-->
											 <sch1:monthsInCurrentCity>${
													customerProfile.month_duration_at_current_city
												}</sch1:monthsInCurrentCity>
											 <!--Optional:-->
											 <sch1:yearsInCurrentAddress>${
													customerProfile.years_at_current_state
												}</sch1:yearsInCurrentAddress>
											 <!--Optional:-->
										<sch1:monthsInCurrentAddress>${customerProfile.months_at_current_state}</sch1:monthsInCurrentAddress>
											 <!--City Pabrade-->
											 <sch1:primaryAddress>1</sch1:primaryAddress>
											 <sch1:phoneNumber>
													<sch1:phoneType>Mobile</sch1:phoneType>
													<sch1:extension>91</sch1:extension>
													<sch1:isdCode>+91</sch1:isdCode>
													<sch1:phoneNumber>${customer.mobile_number}</sch1:phoneNumber>
													<sch1:countryCode>IN</sch1:countryCode>
													<sch1:stdCode>022</sch1:stdCode>
											 </sch1:phoneNumber>
										</sch1:addressDetails>
										<sch1:addressDetails>
											 <sch1:addressType>OfficeAddress</sch1:addressType>
											 <sch1:country>IND</sch1:country>
											 <sch1:addressLine1>${customerProfile.office_address}</sch1:addressLine1>
											 <sch1:zipcode>${customerProfile.office_pincode}</sch1:zipcode>
											 <sch1:state>${customerProfile.office_state}</sch1:state>
											 <sch1:accomodationType>RENTED</sch1:accomodationType>
											 <sch1:primaryAddress>0</sch1:primaryAddress>
										</sch1:addressDetails>
										<sch1:addressDetails>
											 <sch1:addressType>PermanentAddress</sch1:addressType>
											 <sch1:country>IND</sch1:country>
											 <sch1:addressLine1>${customerProfile.permanent_address}</sch1:addressLine1>
											 <sch1:zipcode>${customerProfile.permanent_pincode}</sch1:zipcode>
											 <sch1:state>${customerProfile.permanent_state}</sch1:state>
											 <sch1:accomodationType>${customerProfile.permanent_residence_status}</sch1:accomodationType>
											 <sch1:landMark>${customerProfile.permanent_landmark}</sch1:landMark>
											 <sch1:primaryAddress>0</sch1:primaryAddress>
										<sch1:residenceType>Flat</sch1:residenceType>
										</sch1:addressDetails>
										<sch1:communicationDetails>
											 <sch1:phoneNumber>
													<sch1:phoneType>PRIMARY_MOBILE_NUMBER</sch1:phoneType>
													<sch1:isdCode>+91</sch1:isdCode>
													<sch1:phoneNumber>${customer.mobile_number}</sch1:phoneNumber>
													<sch1:countryCode>IN</sch1:countryCode>
<!--													<sch1:connectionType>Postpaid</sch1:connectionType>-->
											 </sch1:phoneNumber>
											 <sch1:primaryEmailId>${customer.email}</sch1:primaryEmailId>
											 <sch1:preferredLanguage>English</sch1:preferredLanguage>
										</sch1:communicationDetails>
										${occupationInfo}
										<sch1:financialDetails>
									${incomeDetailsInfo}
										</sch1:financialDetails>
									${bankDetails}
		              <sch1:loanApplication>
		                    <sch1:loanBranch>${
													branchCodeMapEnum[applicationDto.branch_code]
												}</sch1:loanBranch>
		              </sch1:loanApplication>
		              <sch1:applicationDetails>
		                    <sch1:officer>Relationship Officer</sch1:officer>
		                    <sch1:sourcingChannel>BRANCH</sch1:sourcingChannel>
		                    <sch1:sourcingBranch>${
													customerProfile.preferred_branch
												}</sch1:sourcingBranch>
		                    <sch1:loanApplicationType>NewApplication</sch1:loanApplicationType>
		              </sch1:applicationDetails>
								</sch1:applicantInformation>
								<sch1:referenceDetails>
                <sch1:name>${customerProfile.reference_name}</sch1:name>
                <sch1:relationship>${customerProfile.reference_relationship}</sch1:relationship>
                <sch1:addressDetails>
                    <sch1:addressType>${customerProfile.reference_address_type_code}</sch1:addressType>
                    <!--Optional:-->
                    <sch1:country>IND</sch1:country>
                    <!--Optional:-->
                    <sch1:addressLine1>${customerProfile.reference_address}</sch1:addressLine1>
                    <!--Optional:-->
                    <sch1:zipcode>${customerProfile.reference_pincode}</sch1:zipcode>
                    <!--Optional:-->
                    <sch1:state>${customerProfile.reference_state}</sch1:state>
                    <!--Optional:-->
                    <sch1:accomodationType>${customerProfile.reference_resident_status_code}</sch1:accomodationType>
                    <!--Optional:-->
                    <sch1:city>${customerProfile.reference_city_code}</sch1:city>
                    <!--Optional:-->
<!--                    <sch1:primaryAddress></sch1:primaryAddress>-->
                    <!--Optional:-->
<!--                    <sch1:residenceType></sch1:residenceType>-->
                    <sch1:phoneNumber>
                        <sch1:phoneType>Mobile</sch1:phoneType>
                        <!--Optional:-->
                        <sch1:extension>91</sch1:extension>
                        <sch1:isdCode>+91</sch1:isdCode>
                        <sch1:phoneNumber>${customerProfile.reference_mobile_number}</sch1:phoneNumber>
                        <sch1:countryCode>IN</sch1:countryCode>
                    </sch1:phoneNumber>
                </sch1:addressDetails>
                <sch1:phoneNumber>
                    <sch1:phoneType>Mobile</sch1:phoneType>
                    <sch1:extension>91</sch1:extension>
                    <sch1:isdCode>+91</sch1:isdCode>
                    <sch1:phoneNumber>${customerProfile.reference_mobile_number}</sch1:phoneNumber>
                    <sch1:countryCode>IN</sch1:countryCode>
                </sch1:phoneNumber>
            </sch1:referenceDetails>
						<sch1:referenceDetails>
                <sch1:name>${customerProfile.reference2_name}</sch1:name>
                <sch1:relationship>${customerProfile.reference2_relationship}</sch1:relationship>
                <sch1:addressDetails>
                    <sch1:addressType>${customerProfile.reference2_address_type_code}</sch1:addressType>
                    <!--Optional:-->
                    <sch1:country>IND</sch1:country>
                    <!--Optional:-->
                    <sch1:addressLine1>${customerProfile.reference2_address}</sch1:addressLine1>
                    <!--Optional:-->
                    <sch1:zipcode>${customerProfile.reference2_pincode}</sch1:zipcode>
                    <!--Optional:-->
                    <sch1:state>${customerProfile.reference2_state}</sch1:state>
                    <!--Optional:-->
                    <sch1:accomodationType>${customerProfile.reference2_resident_status_code}</sch1:accomodationType>
                    <!--Optional:-->
                    <sch1:city>${customerProfile.reference2_city_code}</sch1:city>
                    <!--Optional:-->
<!--                    <sch1:primaryAddress></sch1:primaryAddress>-->
                    <!--Optional:-->
<!--                    <sch1:residenceType></sch1:residenceType>-->
                    <sch1:phoneNumber>
                        <sch1:phoneType>Mobile</sch1:phoneType>
                        <!--Optional:-->
                        <sch1:extension>91</sch1:extension>
                        <sch1:isdCode>+91</sch1:isdCode>
                        <sch1:phoneNumber>${customerProfile.reference2_mobile_number}</sch1:phoneNumber>
                        <sch1:countryCode>IN</sch1:countryCode>
                    </sch1:phoneNumber>
                </sch1:addressDetails>
                <sch1:phoneNumber>
                    <sch1:phoneType>Mobile</sch1:phoneType>
                    <sch1:extension>91</sch1:extension>
                    <sch1:isdCode>+91</sch1:isdCode>
                    <sch1:phoneNumber>${customerProfile.reference2_mobile_number}</sch1:phoneNumber>
                    <sch1:countryCode>IN</sch1:countryCode>
                </sch1:phoneNumber>
            </sch1:referenceDetails>
            ${documentString}
            <sch1:instrumentDetails>
							<sch1:instrumentType>NACH</sch1:instrumentType>            
							<!--Optional:-->
							<sch1:receivedFromUri>Primary Applicant</sch1:receivedFromUri>
							<sch1:noOfInstallments>12</sch1:noOfInstallments>
							<sch1:effectiveDate>${moment().format('YYYY-MM-DD')}</sch1:effectiveDate>
							<sch1:instrumentDetailNACH>
               <sch1:referenceNumber>112233</sch1:referenceNumber>
               <sch1:ifscCode>SBIN0001603</sch1:ifscCode>
               <sch1:micrCode>600002084</sch1:micrCode>
                <sch1:bankCode>RRMRGB</sch1:bankCode>
               <sch1:branchCode>SB087783</sch1:branchCode>             
               <sch1:bankingLocation>BANDRA</sch1:bankingLocation>           
              <sch1:accountType>SavingAccount</sch1:accountType>               
               <sch1:accountName>Josyula Krishna</sch1:accountName>
               <sch1:accountNumber>30026588679</sch1:accountNumber>
               <sch1:repaymentContribution>100</sch1:repaymentContribution>
               <sch1:capAmountInitiated>
                  <sch2:currencyCode>INR</sch2:currencyCode>
                  <sch2:value>100000</sch2:value>
               </sch1:capAmountInitiated>
               <sch1:verificationStatus>COMPLETED</sch1:verificationStatus>
               <sch1:repaymentTowards>3</sch1:repaymentTowards>
               <sch1:verifiedBy>INTERNAL</sch1:verifiedBy>
               <sch1:mandateType>NEW</sch1:mandateType>
               <sch1:mandateNature>CLOSED</sch1:mandateNature>
               <sch1:nachCollectedType>1</sch1:nachCollectedType>
            </sch1:instrumentDetailNACH>           
         </sch1:instrumentDetails>
				</sch1:createApplicationRequest>
					 </soapenv:Body>
				</soapenv:Envelope>
				`;
		return requestBody.replace(/[\r\n\t]/g, "");
		// return requestBody
	}
}
