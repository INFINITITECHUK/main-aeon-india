import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerDevice } from '../../entities/CustomerDevice.entity';
import { Customer } from '../../entities/customer.entity';
import { CustomerNotificationController } from './customer-notification.controller';
import { CustomerNotificationService } from './customer-notification.service';
import { CustomerCard } from '../../entities/CustomerCard.entity';
import { EMandate } from '../../entities/EMandate.entity';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			CustomerDevice,
			Customer,
			CustomerCard,
			EMandate,
		]),
	],
	controllers: [CustomerNotificationController],
	providers: [CustomerNotificationService],
	exports: [],
})
export class CustomerNotificationModule {}
