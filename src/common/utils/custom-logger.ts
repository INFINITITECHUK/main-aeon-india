import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as moment from 'moment';
import { join } from 'path';
// const fs = require('fs');

const writer = fs.createWriteStream(
	join(__dirname, '../../../log/onboardinglogs.log'),
	{
		flags: 'a', // 'a' means appending (old data will be preserved)
	},
);

export class CustomFileLogger extends Logger {
	log(message: any, context?: string) {
		writer.write('*********' + moment().toISOString() + '*************' + '\n');
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
