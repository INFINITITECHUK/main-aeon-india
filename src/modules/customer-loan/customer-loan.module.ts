import { HttpModule, Module } from '@nestjs/common';
import { CustomerLoanController } from './customer-loan.controller';
import { CustomerLoanService } from './customer-loan.service';
import { CustomerLoginModule } from '@modules/customer-login/customer-login.module';
import { CustomerLoginService } from '@modules/customer-login/customer-login.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from '@entities/customer.entity';
import { CustomerProfile } from '@entities/CustomerProfile.entity';
import { EMandate } from '@entities/EMandate.entity';
import { CustomerDevice } from '@entities/CustomerDevice.entity';
import { TransactionFiles } from '@entities/TransactionFiles.entity';
import { ProductBalance } from '@entities/ProductBalance.entity';
import { TransactionDetail } from '@entities/TransactionDetail';
import { Operationlogs } from '@entities/Operationlogs.entity';
import { Operationrules } from '@entities/Operationrules.entity';
import { MembershipLevels } from '@entities/MembershipLevels';
import { CustomerTemp } from '@entities/customerTemp.entity';
import { SecurityQuestion } from '@entities/SecutiyQuestion.entity';
import { Answers } from '@entities/Answers.entity';
import { CustomerCard } from '@entities/CustomerCard.entity';
import { ActivityLog } from '@entities/ActivityLog';
import { InterestRateDetails } from '@entities/InterestRateDetails';
import { InterestRateRangeDetails } from '@entities/InterestRateRangeDetails';
import { AeonBranch } from '@entities/AeonBranch';
import { StateCode } from '@entities/StateCode';
import { Counter } from '@entities/counter';
import { Benefits } from '@entities/Benefits.entity';
import { ThirdPartyDefaults } from '@entities/ThirdPartyDefaults.entity';
import { CustomerApplication } from '@entities/CustomerApplication.entity';
import { CustomerPointsHistory } from '@entities/CustomerPointsHistory.entity';
import { Protocol } from '@entities/Protocol';
import { JwtStrategy } from '@modules/customer-login/jwtStrategy';
import { JwtModule } from '@nestjs/jwt';
import config from '@config/index';
import { BullModule } from '@nestjs/bull';
import { NestMinioModule } from 'nestjs-minio/dist';
import { PassportModule } from '@nestjs/passport';
import { SoaApiService } from '@modules/customer-loan/soa.api.service';
import { CustomerModule } from './../customer/customer.module';
import { decrypt } from '../../utils/cipher';

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
		]),
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
		CustomerLoginModule,
	],
	controllers: [CustomerLoanController],
	providers: [
		CustomerLoanService,
		JwtStrategy,
		SoaApiService,
		CustomerLoginService,
	],
})
export class CustomerLoanModule {}
