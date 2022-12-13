import axios from 'axios';
import { formUrlEncoded } from '@common/utils/helperFunctions.utils';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CustomFileLogger } from '@common/utils/custom-logger';
import { ThirdPartyAPILogs } from '@common/utils/api-logger';

const thirdPartyAPILogs = new ThirdPartyAPILogs('soaLogs');

@Injectable()
export class SoaApiService {
	async getSOAAccessToken() {
		const authRequestBody = {
			client_id: process.env.FINONE_AUTH_CLIENT_ID,
			client_secret: process.env.FINONE_AUTH_CLIENT_SECRET,
			grant_type: process.env.FINEONE_AUTH_GRANT_TYPE,
		};
		const response = await axios.post(
			process.env.FINONE_AUTH_URL,
			formUrlEncoded(authRequestBody),
		);
		try {
			thirdPartyAPILogs.log(formUrlEncoded(authRequestBody), response.data);
		} catch (e) {
			console.log(e);
		}
		return response.data.access_token;
	}

	async getGeneratedSoaReport(loanAccountNumber: string) {
		const accessToken = await this.getSOAAccessToken();
		const soaRequestBody = {
			requestHeader: {
				tenantId: 505,
				userDetail: {
					userCode: 'SYSTEM',
					branchId: 5,
				},
			},
			loanAccountNumber: loanAccountNumber,
		};
		const response = await axios.post(
			`${process.env.GENERATE_SOA_REPORT}?access_token=${accessToken}`,
			soaRequestBody,
		);
		if (response.data.error) {
			throw new HttpException(
				'Cannot fetch SOA at the moment',
				HttpStatus.BAD_REQUEST,
			);
		}
		try {
			thirdPartyAPILogs.log(formUrlEncoded(soaRequestBody), response.data);
		} catch (e) {
			console.log(e);
		}
		return response.data.pdfData;
	}
}
