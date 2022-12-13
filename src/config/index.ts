import * as dotenv from 'dotenv';
import { decrypt } from '@utils/cipher';
import * as fs from 'fs';
import * as path from 'path';

let file = `${__dirname}/../../env/${process.env.NODE_ENV}.env`;

if (!fs.existsSync(path.resolve(file))) {
	file = `${__dirname}/../../env/dev.env`;
}
dotenv.config({ path: file, debug: false });

const config = {
	secret: 'SECRET!@',
	expiresIn: '30d',
	port: process.env.APP_PORT,
	db: {
		host: decrypt(JSON.parse(process.env.DB_HOST)),
		port: Number(decrypt(JSON.parse(process.env.DB_PORT))),
		username: decrypt(JSON.parse(process.env.DB_USERNAME)),
		password: decrypt(JSON.parse(process.env.DB_PASSWORD)),
		database: 'db_lms',
		key: process.env.KEY,
		iv: process.env.IV,
	},
	oracle_db: {
		username: process.env.LOYALTY_DB_USERNAME,
		password: process.env.LOYALTY_DB_PASSWORD,
		port: parseInt(process.env.LOYALTY_DB_PORT),
		oracle_sid: process.env.LOYALTY_DB_SID,
		hostname: process.env.LOYALTY_DB_HOSTNAME,
	},
	kafkaBroker: process.env.KAFKA_BROKER,
	redis: {
		host: decrypt(JSON.parse(process.env.REDIS_HOST_QUEUE)),
		port: Number(decrypt(JSON.parse(process.env.REDIS_PORT_QUEUE))),
	},
	bucketName: 'customer-data',
	soaBucketName: 'soa-document',
	lanBucketName: 'lan-report',
	OtpExpiryInMintues: 5,
	LOYALITY_CLIENTID: decrypt(JSON.parse(process.env.LOYALITY_CLIENTID)),
	LOYALITY_SECRETID: decrypt(JSON.parse(process.env.LOYALITY_SECRETID)),
};

export default config;
