import { Injectable } from '@nestjs/common';
import { getConnection } from 'typeorm';

@Injectable()
export class QueryService {

	async loyaltyQueryService(query) {
		// const connection = await getConnection()
		const connection = await getConnection(process.env.LOYALTY_DB_NAME)
		// query = query.replace(`\\\"`, '"')
		return await connection.query(query.query)
	}

	async finoneQueryService(query) {
		const connection = await getConnection(process.env.FINONE_DB_NAME)
		return await connection.query(query.query)
	}
}