import { Module } from '@nestjs/common';
import { CronJobsController } from './cron-jobs.controller';
import { CronJobsService } from './cron-jobs.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from '@entities/customer.entity';
import { CustomerProfile } from '@entities/CustomerProfile.entity';
import { TransactionDetail } from '@entities/TransactionDetail.entity';
import { CustomerApplication } from '@entities/CustomerApplication.entity';
import { Counter } from '@entities/counter';
import { EmiPayment } from '@entities/EmiPayment';
import { EMandate } from '@entities/EMandate.entity';
import { Receipt } from '../../oentities/Receipt';
import { QueryService } from '@modules/cron-jobs/query.service';
import { NestMinioModule } from 'nestjs-minio/dist';
import { decrypt } from '../../utils/cipher';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			Customer,
			CustomerProfile,
			CustomerApplication,
			TransactionDetail,
			Counter,
			EmiPayment,
			EMandate
		]),
		TypeOrmModule.forFeature([Receipt], process.env.FINONE_DB_NAME),
		NestMinioModule.register({
			endPoint: process.env.MINIO_ENDPOINT,
			port: Number(decrypt(JSON.parse(process.env.MINIO_PORT))),
			useSSL: String(true) === process.env.MINIO_SSL,
			accessKey: decrypt(JSON.parse(process.env.MINIO_ACCESS_KEY)),
			secretKey: decrypt(JSON.parse(process.env.MINIO_SECRET_KEY))
		})
	],
	controllers: [CronJobsController],
	providers: [CronJobsService, QueryService],
})
export class CronJobsModule {}
