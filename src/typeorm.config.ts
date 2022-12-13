import config from './config';
import { join } from 'path';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { CustomerProfile } from './entities/CustomerProfile.entity';
import {
	LoyaltyCustomer,
	LoyCustomer,
} from './oentities/loyaltyCustomer.entity';
import {
	FinnOneCustomers,
	FinnOneCustomerPhoneDetails,
	FinnOneCustomerIdDetailsView,
	FinnOneCustomerEmailIDView,
	FinnOneCustomerAddressDetailsView,
	FinnOneCustomerApplicationDetailsView,
	FinnOneCustomerReferencesView,
	FinnOneCustomerInstrumentalDetailsView,
	FinnOneAddressDetailsView,
	FinnOneIncomeDetailsView,
	FinnOneEmploymnetDetailsView,
	FinnOneCustomer,
	FinnOneCommunicationDetails
} from './oentities/customerViews.entity';
import { Receipt } from './oentities/Receipt';

export const typeormConfig: TypeOrmModuleOptions = {
	name: 'default',
	type: 'postgres',
	host: config.db.host,
	port: config.db.port,
	username: config.db.username,
	password: config.db.password,
	database: config.db.database,
	// entities: [join(__dirname, 'entities/*{.ts,.js}')],
	entities: [join(__dirname, 'entities/*{.ts,.js}'), CustomerProfile],
	// We are using migrations, synchronize should be set to false.
	synchronize: false,
	migrationsRun: String(true) === process.env.MIGRATION_RUN,
	logging: 'all',
	migrationsTableName: 'nest_migration',
	logger: 'advanced-console',
	migrations: [join(__dirname, 'migrations/**/*{.ts,.js}')],
	cli: {
		migrationsDir: join('src', 'migrations'),
	},
	extra: { max: 20 },
};

export const otypeormCnfig: any = {
	name: process.env.FINONE_DB_NAME,
	type: 'oracle',
	username: process.env.FINONE_DB_USERNAME,
	password: process.env.FINONE_DB_PASSWORD,
	connectString: process.env.FINONE_DB_CONNECTSTRING,
	logging: false,
	entities: [
		Receipt,
		FinnOneCustomers,
		FinnOneCustomerPhoneDetails,
		FinnOneCustomerIdDetailsView,
		FinnOneCustomerEmailIDView,
		FinnOneCustomerAddressDetailsView,
		FinnOneCustomerApplicationDetailsView,
		FinnOneCustomerReferencesView,
		FinnOneCustomerInstrumentalDetailsView,
		FinnOneAddressDetailsView,
		FinnOneIncomeDetailsView,
		FinnOneEmploymnetDetailsView,
		FinnOneCustomer,
		FinnOneCommunicationDetails
	],
};

export const otypeormLoyaltyCnfig: any = {
	name: process.env.LOYALTY_DB_NAME,
	type: 'oracle',
	username: process.env.LOYALTY_DB_USERNAME,
	password: process.env.LOYALTY_DB_PASSWORD,
	connectString: process.env.LOYALTY_DB_CONNECT_STRING,
	logging: false,
	entities: [LoyaltyCustomer, LoyCustomer],
};

console.log(process.env.MIGRATION_RUN);
console.log(typeormConfig);
console.log('otypeormLoyaltyCnfig: ', otypeormLoyaltyCnfig);
