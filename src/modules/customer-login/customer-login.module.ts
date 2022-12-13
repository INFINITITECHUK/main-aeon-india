import { HttpModule, Module } from '@nestjs/common';
import { CustomerLoginController } from './customer-login.controller';
import { CustomerCronJobsController } from './customer-cron-jobs.controller';
import { CustomerLoginService } from './customer-login.service';
import { CustomerMembershipService } from './customer-membership.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerDevice } from '../../entities/CustomerDevice.entity';
import { CustomerProfile } from '../../entities/CustomerProfile.entity';
import { TransactionFiles } from '../../entities/TransactionFiles.entity';
import { ProductBalance } from '../../entities/ProductBalance.entity';
import { TransactionDetail } from '../../entities/TransactionDetail';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { CustomerModule } from './../customer/customer.module';
import config from '@config/index';

import { BullModule } from '@nestjs/bull';
import { CustomerLogProcessor } from './customerLog.processor';
import { ActivityLog } from '@entities/ActivityLog';
import { Answers } from '@entities/Answers.entity';
import { Customer } from '@entities/customer.entity';
import { CustomerCard } from '@entities/CustomerCard.entity';
import { CustomerTemp } from '@entities/customerTemp.entity';
// import { MembershipStatusLog } from '@entities/MembershipStatusLog';
import { EMandate } from '@entities/EMandate.entity';
import { InterestRateDetails } from '@entities/InterestRateDetails';
import { InterestRateRangeDetails } from '@entities/InterestRateRangeDetails';
import { Operationlogs } from '@entities/Operationlogs.entity';
import { Operationrules } from '@entities/Operationrules.entity';
import { SecurityQuestion } from '@entities/SecutiyQuestion.entity';
import { AeonBranch } from '@entities/AeonBranch';
import { StateCode } from '@entities/StateCode';
import { Counter } from '@entities/counter';
import { Benefits } from '@entities/Benefits.entity';
import { CustomerMembershipLogs } from '@entities/CustomerMembershipLogs.entity';


import { CustomerPointsHistory } from '@entities/CustomerPointsHistory.entity';
import { NestMinioModule } from 'nestjs-minio';
import { JwtStrategy } from './jwtStrategy';
import { MembershipLevels } from '@entities/MembershipLevels';
import { CreditUpdateApiService } from '@modules/customer-login/credit-update.api.service';
import { CustomerRlApplicationApiService } from '@modules/customer-login/customer-rl-application.api.service';
import { ThirdPartyDefaults } from '@entities/ThirdPartyDefaults.entity';
import { CustomerApplication } from '@entities/CustomerApplication.entity';
import { Protocol } from '@entities/Protocol';
import { EmandatePennydropApiService } from '@modules/customer-login/emandate-pennydrop.api.service';
import { LoyaltyCustomer } from '../../oentities/loyaltyCustomer.entity';
import { decrypt } from '../../utils/cipher';
import { CustomerRlService } from '@modules/customer-login/customer-rl.service';
import { EmiPayment } from '@entities/EmiPayment';

@Module({
	imports: [
		HttpModule,
		PassportModule,
		CustomerModule,
		TypeOrmModule.forFeature([
			CustomerDevice,
			CustomerProfile,
			TransactionFiles,
			ProductBalance,
			TransactionDetail,
			Operationlogs,
			Operationrules,
			Customer,
			MembershipLevels,
			CustomerTemp,
			SecurityQuestion,
			Answers,
			CustomerCard,
			// MembershipStatusLog,
			ActivityLog,
			InterestRateDetails,
			InterestRateRangeDetails,
			EMandate,
			AeonBranch,
			StateCode,
			Counter,
			ThirdPartyDefaults,
			CustomerApplication,
			CustomerPointsHistory,
			Protocol,
			Benefits,
			CustomerMembershipLogs,
			EmiPayment
		]),
		TypeOrmModule.forFeature([LoyaltyCustomer], process.env.LOYALTY_DB_NAME),
		JwtModule.register({
			secret: config.secret,
			signOptions: { expiresIn: config.expiresIn },
		}),
		NestMinioModule.register({
			endPoint: process.env.MINIO_ENDPOINT,
			port: Number(decrypt(JSON.parse(process.env.MINIO_PORT))),
			useSSL: String(true) === process.env.MINIO_SSL,
			accessKey: decrypt(JSON.parse(process.env.MINIO_ACCESS_KEY)),
			secretKey: decrypt(JSON.parse(process.env.MINIO_SECRET_KEY)),
		}),
		BullModule.registerQueue({
			name: 'customerLog',
			redis: {
				host: config.redis.host,
				port: config.redis.port,
			},
		}),
	],
	controllers: [CustomerLoginController, CustomerCronJobsController],
	providers: [
		CustomerLoginService,
		CustomerMembershipService,
		EmandatePennydropApiService,
		JwtStrategy,
		CustomerLogProcessor,
		CreditUpdateApiService,
		CustomerRlApplicationApiService,
		CustomerRlService
	],
	exports: [JwtStrategy],
})
export class CustomerLoginModule {}
