import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import config from '../../config/index';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Customer } from '@entities/customer.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
	constructor(
		@InjectRepository(Customer)
		private readonly customerRepo: Repository<Customer>,
	) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			secretOrKey: config.secret,
		});
	}

	async validate(payload: any) {
		const { mobile_number } = payload;
		return this.customerRepo.findOne({ mobile_number });
	}
}
