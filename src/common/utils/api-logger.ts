import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as moment from 'moment';
import { join } from 'path';
// const fs = require('fs');

const writer = fs.createWriteStream(
	join(__dirname, '../../../log/third_party_logs.log'),
	{
		flags: 'a', // 'a' means appending (old data will be preserved)
	},
);

export class ThirdPartyAPILogs extends Logger {
	log(request: any, response: any, context?: string) {
		writer.write('*********' + moment().toISOString() + '*************' + '\n');
		const message = `Request: \n ${JSON.stringify(
			request,
		)} \n Response: \n ${JSON.stringify(response)} `;
		writer.write(JSON.stringify(message) + '\n');
		// console.log(join(__dirname, '../../../tabapaylogs/logs.txt'));
		// fs.writeFileSync(join(__dirname, '../../tabapaylogs/logs.txt'), message);
		super.log(message, context);
	}

	error(message: any, trace?: string, context?: string) {
		writer.write('*********' + moment().toISOString() + '*************' + '\n');
		writer.write(JSON.stringify(message) + '\n');
		// fs.writeFileSync(join(__dirname, '../../tabapaylogs/logs.txt'), message);
		super.error(message, trace, context);
	}
}
