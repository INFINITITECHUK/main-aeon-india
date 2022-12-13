import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { CustomerApplication } from '@entities/CustomerApplication.entity';
import { ThirdPartyAPILogs } from '@common/utils/api-logger';
import { EmandateStatusSetDto } from '@dtos/EmandateStatusSet.dto';

const thirdPartyAPILogs = new ThirdPartyAPILogs('emandatePennyDrop');


@Injectable()
export class EmandatePennydropApiService {
	constructor(
		@InjectRepository(CustomerApplication)
		private readonly customerApplicationRepository: Repository<CustomerApplication>,
	) {}

	async updateFinoneApplication(emandate, emandateStatusSetDto) {
		const application = await this.customerApplicationRepository.findOne({
			where: {
				customer_idx: emandate.customer_idx,
			},
		});
		const requestBody = await this.buildRequestBody(application, emandate, emandateStatusSetDto);
		console.log(requestBody)
		const response: any = await axios
			.post(`${process.env.CUSTOMER_EMANDATE_UPDATE}`, requestBody, {
				headers: {
					'Content-Type': 'text/xml',
				},
			})
			.then(response => {
				thirdPartyAPILogs.log(requestBody, response.data);
				return response
			})
			.catch(e => {
				thirdPartyAPILogs.log(requestBody, e.response.data);
				return e.response;
			});
	}

	async buildRequestBody(application, emandate, emandateStatusSetDto: EmandateStatusSetDto) {
		let emandateData = ``;
		let pennyDropData = {};
		if (emandateStatusSetDto.emandate_success == 'APPROVED' && emandateStatusSetDto.emandate_success_data) {
			let successData = emandateStatusSetDto.emandate_success_data;
			successData = JSON.parse(successData);
			emandateData = `
			          <ns1:dynamicFormDetails>
                <ns1:dynamicFormName>Mandate Final Status</ns1:dynamicFormName>
                <ns1:dynamicFormData>{"Final_Error_Status":{"Final_Error_Description":"SUCCESS","Final_Error_Code":"${successData['txnErrorCode']}"},"Final_Status":{"Final_Mandate_Status":"Mandate Success","Mandate_Reference_ID":"${successData['Mandate_Reference_ID']}"}}</ns1:dynamicFormData>
            </ns1:dynamicFormDetails>
			`
			// emandateData['Final_Error_Description'] = '';
			// emandateData['Final_Error_Code'] = successData['txnErrorCode'];
			// emandateData['Final_Mandate_Status'] =
			// emandateData['Mandate_Reference_ID'] = ;
		} else if (emandateStatusSetDto.emandate_success == 'REJECTED' && emandateStatusSetDto.emandate_failure_response){
			let failureData = emandateStatusSetDto.emandate_failure_response;
			failureData = JSON.parse(failureData);
			emandateData = `
			          <ns1:dynamicFormDetails>
                <ns1:dynamicFormName>Mandate Final Status</ns1:dynamicFormName>
                <ns1:dynamicFormData>{"Final_Error_Status":{"Final_Error_Description":"FAILURE","Final_Error_Code":"${failureData['txnErrorCode']}"},"Final_Status":{"Final_Mandate_Status":"Mandate Failed","Mandate_Reference_ID":"${failureData['Mandate_Reference_ID']}"}}</ns1:dynamicFormData>
            </ns1:dynamicFormDetails>
			`
			// emandateData['Final_Error_Description'] = 'FAILURE';
			// emandateData['Final_Error_Code'] = failureData['txnErrorCode'];
			// emandateData['Final_Mandate_Status'] = 'Mandate Failed';
			// emandateData['Mandate_Reference_ID'] = failureData['Mandate_Reference_ID'];
		}
		if (emandateStatusSetDto.penny_drop_success == 'APPROVED' && emandateStatusSetDto.pennydrop_success_data) {
			let successData = emandateStatusSetDto.pennydrop_success_data;
			successData = JSON.parse(successData);
			pennyDropData = `
							 <sch1:dynamicFormDetails>
                  <sch1:dynamicFormName>Pennydrop Status</sch1:dynamicFormName>
                  <sch1:dynamicFormData>{"panel_pennydrop_error_details":{"field_pennydrop_error_description":"Transaction Successful","field_pennydrop_error_code":"${successData['txnErrorCode']}"},"panel_pennydrop_status":{"field_pennydrop_cust_name_in_bank_acc":"${emandate.full_name}","field_pennydrop_bank_reference_no":"${successData['Penny_Reference_ID']}","field_pennydrop_status":"Success"}}</sch1:dynamicFormData>
               </sch1:dynamicFormDetails>`
			// pennyDropData['field_pennydrop_error_description'] = 'Transaction Successful';
			// pennyDropData['field_pennydrop_error_code'] = successData['txnErrorCode'];
			// pennyDropData['field_pennydrop_cust_name_in_bank_acc'] = emandate.full_name;
			// pennyDropData['field_pennydrop_bank_reference_no'] = successData['Penny_Reference_ID'];
			// pennyDropData['field_pennydrop_status'] = 'Success';
		} else if(emandateStatusSetDto.penny_drop_success == 'REJECTED' && emandateStatusSetDto.pennydrop_failure_response){
			let failureData = emandateStatusSetDto.pennydrop_failure_response;
			failureData = JSON.parse(failureData);
			pennyDropData = `
							 <sch1:dynamicFormDetails>
                  <sch1:dynamicFormName>Pennydrop Status</sch1:dynamicFormName>
                  <sch1:dynamicFormData>{"panel_pennydrop_error_details":{"field_pennydrop_error_description":"Transaction Failed","field_pennydrop_error_code":"${failureData['txnErrorCode']}"},"panel_pennydrop_status":{"field_pennydrop_cust_name_in_bank_acc":"${emandate.full_name}","field_pennydrop_bank_reference_no":"${failureData['Penny_Reference_ID']}","field_pennydrop_status":"Failure"}}</sch1:dynamicFormData>
               </sch1:dynamicFormDetails>`
			// pennyDropData['field_pennydrop_error_description'] = 'Transaction Failed';
			// pennyDropData['field_pennydrop_error_code'] = failureData['txnErrorCode'];
			// pennyDropData['field_pennydrop_cust_name_in_bank_acc'] = emandate.full_name;
			// pennyDropData['field_pennydrop_bank_reference_no'] = failureData['Penny_Reference_ID'];
			// pennyDropData['field_pennydrop_status'] = 'Failed';
		}
		return `
		<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sch="http://schema.base.ws.pro.finnone.nucleus.com" xmlns:sch1="http://schema.applicationservices.ws.pro.finnone.nucleus.com" xmlns:sch2="http://schema.cas.common.base.ws.pro.finnone.nucleus.com">
   <soapenv:Header>
      <sch:Header/>
   </soapenv:Header>
   <soapenv:Body>
        <ns1:updateApplicationRequest xmlns:ns2="http://schema.cas.common.base.ws.pro.finnone.nucleus.com" xmlns:ns1="http://schema.applicationservices.ws.pro.finnone.nucleus.com">
            <ns1:appParameter>
                <ns1:productProcessor>mCAS</ns1:productProcessor>
                <ns1:applicationNumber>${application.application_number}</ns1:applicationNumber>
                <ns1:moveToNextStageFlag>false</ns1:moveToNextStageFlag>
            </ns1:appParameter>
            ${emandateData}
            ${pennyDropData}
        </ns1:updateApplicationRequest>
    </soapenv:Body>
</soapenv:Envelope>
`.replace(/[\r\n\t]/g, "");
	}
}
