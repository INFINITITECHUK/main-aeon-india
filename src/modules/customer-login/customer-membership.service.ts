// import { MembershipStatusLog } from '@entities/MembershipStatusLog';
import { CustomerCard } from '@entities/CustomerCard.entity';
import { CustomerMembershipLogs } from '@entities/CustomerMembershipLogs.entity';
import { Customer } from '@entities/customer.entity';
import { HttpException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Axios } from '@utils/helpers';
import axios from 'axios';
import { getConnection, getManager, Repository } from 'typeorm';
var CronJob = require('cron').CronJob;
import * as https from 'https';
import { Cron } from '@nestjs/schedule';
import { MEMBERSHIP_STATUS_LEVEL_MAP } from '@common/constants/membershipStatusLevel.enum';

const agent = new https.Agent({
	rejectUnauthorized: false,
});

@Injectable()
export class CustomerMembershipService {
	constructor(
		// @InjectRepository(MembershipStatusLog)
		// private readonly MembershipStatusLogRepo: Repository<MembershipStatusLog>,
		@InjectRepository(CustomerMembershipLogs)
		private readonly customerMembershipLogsRepo: Repository<CustomerMembershipLogs>,
		@InjectRepository(CustomerCard)
		private readonly customerCardRepo: Repository<CustomerCard>,
		@InjectRepository(Customer)
		private readonly customerRepo: Repository<Customer>,
	) {}

	// Run a cron job to check for latest logs and the update type. Notify if the user is not notified,  and then set the is_notified flag to true
	// async isMembershipChanged() {
	// 	const membershipStatusLogs = await this.MembershipStatusLogRepo.find({
	// 		where: {
	// 			is_notified: false,
	// 		},
	// 		order: {
	// 			modified_on: 'DESC',
	// 		},
	// 	});

	// 	console.log('membershipStatusLogs: ', membershipStatusLogs);
	// 	//  runs at 11:59 PM every day.
	// 	var job = new CronJob('59 23 * * * *', async function () {
	// 		console.log(
	// 			"Running a scheduler to check the status of customer's membership",
	// 		);
	// 		let upgraded_customers = [],
	// 			downgraded_customers = [];
	// 		let upgrade_action_alias, downgrade_action_alias;

	// 		for (let member of membershipStatusLogs) {
	// 			// fetch customerMeta from oracle db
	// 			console.log('member: ', member);
	// 			var data = JSON.stringify({ data: `"${member.membership_number}"` });
	// 			const response = await Axios.post(`${process.env.DECRYPT_URL}`, data, {
	// 				headers: {
	// 					'Content-Type': 'application/json',
	// 					Cookie:
	// 						'csrftoken=cK2brDIosNFJbcExY3i2P31LHqd9TZUTH1xTpcYQYpTbz65KjJvbzCKWxSCPogMD',
	// 				},
	// 			});
	// 			const membership_number = response.data.data;
	// 			console.log('decrypted membership_number: ', membership_number);
	// 			const [customerMetadata] = await getConnection(
	// 				'aoenClientLoyaltyDb',
	// 			).query(
	// 				`SELECT * FROM "LOYALTY"."LOY_CUSTOMER_DTL"  where MEMBERSHIP_ID = '${membership_number}'`,
	// 			);
	// 			console.log('customerMetadata: ', customerMetadata);
	// 			if (customerMetadata) {
	// 				// fetch customerCard data
	// 				const customerCardResponse = await getManager()
	// 					.createQueryBuilder(CustomerCard, 'customerCard')
	// 					.where(
	// 						'customerCard.membership_number = :membership_number AND customerCard.is_obsolete = :is_obsolete',
	// 						{
	// 							membership_number: member.membership_number,
	// 							is_obsolete: false,
	// 						},
	// 					)
	// 					.getOne();

	// 				console.log('customerCardResponse: ', customerCardResponse);
	// 				if (customerCardResponse) {
	// 					if (
	// 						customerMetadata.CURRENT_MEMBERSHIP_STATUS !=
	// 						customerCardResponse.membership_type
	// 					) {
	// 						// update the current membership status in the lms db
	// 						await getManager()
	// 							.createQueryBuilder()
	// 							.update(CustomerCard)
	// 							.where('membership_number = :membership_number', {
	// 								membership_number: customerMetadata.MEMBERSHIP_ID,
	// 							})
	// 							.set({
	// 								membership_type: customerMetadata.CURRENT_MEMBERSHIP_STATUS,
	// 								card_status: customerMetadata.CARD_STATUS,
	// 							})
	// 							.execute();
	// 					}

	// 					// set is_notified to true in MembershipStatusLog table
	// 					await getManager()
	// 						.createQueryBuilder()
	// 						.update(MembershipStatusLog)
	// 						.where('membership_number = :membership_number', {
	// 							membership_number: member.membership_number,
	// 						})
	// 						.set({
	// 							is_notified: true,
	// 						})
	// 						.execute();

	// 					// prepare input parameters for sending notification to customers according to upgrade/degrade
	// 					let message;
	// 					// console.log('process.env.GET_TEMPLATE_FOR_NOTIFICATION: ', process.env.GET_TEMPLATE_FOR_NOTIFICATION);

	// 					if (member.update_type == 'UPGRADE') {
	// 						const template = await axios.get(
	// 							`${process.env.GET_TEMPLATE_FOR_NOTIFICATION}membership_upgrade`,
	// 							{ httpsAgent: agent },
	// 						);
	// 						console.log('template: ', template);

	// 						upgrade_action_alias = 'membership_upgrade';
	// 						message = template.data.action_message;
	// 						upgraded_customers.push({
	// 							idx: customerCardResponse.customer_idx,
	// 							message,
	// 						});
	// 						console.log('message: ', message);
	// 					} else if (member.update_type == 'DOWNGRADE') {
	// 						const template = await axios.get(
	// 							`${process.env.GET_TEMPLATE_FOR_NOTIFICATION}membership_downgrade`,
	// 							{ httpsAgent: agent },
	// 						);
	// 						console.log('template: ', template);
	// 						downgrade_action_alias = 'membership_downgrade';
	// 						message = template.data.action_message;
	// 						downgraded_customers.push({
	// 							idx: customerCardResponse.customer_idx,
	// 							message,
	// 						});
	// 						console.log('message: ', message);
	// 					}
	// 				}
	// 			}
	// 		}
	// 		// send notifation for upgrade
	// 		console.log('upgrade_action_alias: ', upgrade_action_alias);
	// 		console.log('upgraded_customers: ', upgraded_customers);
	// 		if (upgraded_customers && upgrade_action_alias) {
	// 			await this.notifyCustomers(upgrade_action_alias, upgraded_customers);
	// 		}
	// 		// send notification for downgrade
	// 		console.log('downgrade_action_alias: ', downgrade_action_alias);
	// 		console.log('downgraded_customers: ', downgraded_customers);
	// 		if (downgraded_customers.length && downgrade_action_alias) {
	// 			await this.notifyCustomers(
	// 				downgrade_action_alias,
	// 				downgraded_customers,
	// 			);
	// 		}
	// 	});
	// 	job.start();
	// }

	async notifyCustomers(action_alias: string, customers: any[]) {
		console.log('Notifying customers on account update...');
		// console.log('process.env.SEND_MEMBER_NOTIFICATION: ',`${process.env.SEND_MEMBER_NOTIFICATION}`);
		console.log('customers: ', customers);
		console.log('action_alias: ', action_alias);

		if (!customers.length) {
			console.log('Empty customers');
			return;
		}
		try {
			const response: any = await axios.post(
				`${process.env.SEND_MEMBER_NOTIFICATION}`,
				{
					action_alias,
					customers,
				},
				{ httpsAgent: agent },
			);
			console.log('response: ', response);
		} catch (e) {
			console.log('exception: ', e);
			Logger.log(e);
			throw new HttpException(e.response.data.message, e.response.status);
		}
	}

	@Cron('0 55 23 * * *')
	async checkMembershipChanged() {
		const allCustomerData = await this.customerCardRepo.find({
			where: {
				is_obsolete: false,
			},
			select: [
				"idx",
				'customer_idx',
				'membership_number',
				'membership_type',
				'previous_membership_status',
				'card_status'
			],
		});

		console.log(allCustomerData, allCustomerData.length, 'here is ');

		let upgraded_customers = [],
			downgraded_customers = [],
			cancelled_customers = [],
			suspended_customers = [];

		let upgrade_action_alias = 'membership_upgrade';
		let downgrade_action_alias = 'membership_downgrade';
		let cancelled_action_alias = 'membership_cancelled';
		let suspend_action_alias = 'membership_suspended';

		// let testCustomers = [
		// 	{
		// 		idx: "76760db6-2c69-4a36-a532-e04ae9ac6aa4",
		// 		customer_idx: '76760db6-2c69-4a36-a532-e04ae9ac6aa4',
		// 		membership_type: 'Gold',
		// 		membership_number: '8521210200000166',
		// 		previous_membership_status: null,
		// 		card_status : "Active"
		// 	},
		// 	{
		// 		idx: "63638e84-b9c2-4b47-bd00-291758e0c267",
		// 		customer_idx: '63638e84-b9c2-4b47-bd00-291758e0c267',
		// 		membership_type: 'Associate',
		// 		membership_number: '8521210200000166',
		// 		previous_membership_status: null,
		// 		card_status:"Active"
		// 	},
		// ];

		if (!allCustomerData.length) {
			//no customers
			return;
		}

		let upgradeTemplate = await axios.get(
			`${process.env.GET_TEMPLATE_FOR_NOTIFICATION}membership_upgrade`,
			{ httpsAgent: agent },
		);

		let downgradeTemplate = await axios.get(
			`${process.env.GET_TEMPLATE_FOR_NOTIFICATION}membership_downgrade`,
			{ httpsAgent: agent },
		);
		let cancelTemplate = await axios.get(
			`${process.env.GET_TEMPLATE_FOR_NOTIFICATION}membership_cancelled`,
			{ httpsAgent: agent },
		);
		let suspendTemplate = await axios.get(
			`${process.env.GET_TEMPLATE_FOR_NOTIFICATION}membership_suspended`,
			{ httpsAgent: agent },
		);

		// for (let customer of testCustomers) {
		for (let customer of allCustomerData) {
			const [customerMetadata] = await getConnection(
				'aoenClientLoyaltyDb',
			).query(
				`SELECT * FROM "LOYALTY"."LOY_CUSTOMER_DTL"  where MEMBERSHIP_ID = '${customer.membership_number}'`,
			);
			console.log('customerMetadata: ', customerMetadata);

			// let customerMetadata = {
			// 	CUSTOMER_ID: 1824,
			// 	AUTH_DATE: '2021-02-15T18:44:21.370Z',
			// 	AUTH_ID: 1000,
			// 	CARD_STATUS: 'A',
			// 	CIBIL_SCORE: -1,
			// 	COUNTRY_CODE: '+91',
			// 	CURRENT_MEMBERSHIP_STATUS: 'S',
			// 	CUSTOMER_NAME: 'Rahul Blank',
			// 	CUSTOMER_NUMBER: 'GLBCUST00000006146',
			// 	DOB: '1988-12-31T18:30:00.000Z',
			// 	EMAIL: 'seema_dighe@aeoncedit.co.in',
			// 	FIRST_NAME: 'Rahul',
			// 	GENDER: 'm',
			// 	LAST_MEMBERSHIP_CHANGE_STATUS: 'A',
			// 	LAST_NAME: 'Blank',
			// 	MAKER_DATE: '2021-02-15T18:44:21.370Z',
			// 	MAKER_ID: 1000,
			// 	MC_STATUS: 'A',
			// 	MEMBERSHIP_ID: '3892210200000145',
			// 	MEMBERSHIP_STATUS_CHANGED_DATE: '2021-08-05T18:30:00.000Z',
			// 	MOBILE_NO: '9821849368',
			// 	POINT_CLOSING_BALANCE: 150,
			// 	POINT_EARNED: 150,
			// 	POINT_ELAPSED: 0,
			// 	POINT_REDEMPTION: 0,
			// 	POINTS_ELAPSED_IN_NEXT_30_DAYS: 0,
			// 	POINTS_ELAPSED_IN_NEXT_60_DAYS: 0,
			// 	POINTS_OPENING_BALANCE: 150,
			// 	PREVIOUS_MEMBERSHIP_STATUS: null,
			// 	REGISTRATION_DATE: '2021-08-05T18:30:00.000Z',
			// 	TOTAL_POINTS: 150,
			// 	UPDATE_DATE: '2021-02-15T18:44:21.370Z',
			// 	ANNUAL_INCOME: 408000,
			// 	MONTHLY_INCOME: 34000,
			// 	CIBIL_DATE: '2021-01-19T18:30:00.000Z',
			// 	UNDER_OBSERVATION: 'N',
			// 	CARD_CANCELLATION_DATE: null,
			// 	OBSERVATION_STATE: null,
			// 	PAN_NO: 'HQBPS8976K',
			// 	TOTAL_DOWNGRADE: 0,
			// 	TOTAL_UPGRADE: 0,
			// };

			if (customerMetadata) {
				//if membership_number exist in aeon loyalty db

				console.log('inside true data');
				console.log(
					`${customerMetadata.CURRENT_MEMBERSHIP_STATUS}`.toLowerCase(),
					'new is this',
					`${this.mapMembershipLevelToShortForm(
						customer.membership_type,
					)}`.toLowerCase(),
					'123123123 out',
					this.mapMembershipLevelToFullForm(
						customerMetadata.CURRENT_MEMBERSHIP_STATUS, //D  ->Diamond must be
					),
				);

				//card is cancelled
				if(customer.card_status==="Active" &&  customerMetadata.CARD_STATUS.toLowerCase() === "x"){

					await this.customerCardRepo.update(
						{
							idx: customer.idx,
							is_obsolete:false

						},{
							card_status: this.membershipDetailsMapping(
								customerMetadata.CARD_STATUS,
							),
							is_membership_changed: true
						}
					)
					let message = cancelTemplate.data.action_message;
						
					cancelled_customers.push({
							idx: customer.customer_idx,
							message,
						});
						console.log('message: ', message);
						console.log('cancelled_customers: ', cancelled_customers);

						const customerData = await this.customerRepo.findOne({
							idx: customer.customer_idx,
							is_obsolete: false,
						});

						// set is_notified to true in customerMembershipLogsRepo table for log
						await this.customerMembershipLogsRepo.save({
							customer: customerData,
							membership_number: customer.membership_number,
							membership_status: this.mapMembershipLevelToFullForm(
								customerMetadata.CURRENT_MEMBERSHIP_STATUS,
							),
							update_type: 'CANCELLED',
							is_notified: true,
						});

				}
				//card is suspended
				if(customer.card_status ==="Active" &&  customerMetadata.CARD_STATUS.toLowerCase() === "s"){
					await this.customerCardRepo.update(
						{
							idx: customer.idx,
							is_obsolete:false

						},{
							card_status: this.membershipDetailsMapping(
								customerMetadata.CARD_STATUS,
							),
							is_membership_changed: true
						}
					)
					let message = suspendTemplate.data.action_message;
						
					suspended_customers.push({
							idx: customer.customer_idx,
							message,
						});
						console.log('message: ', message);
						console.log('suspended_customers: ', suspended_customers);

						const customerData = await this.customerRepo.findOne({
							idx: customer.customer_idx,
							is_obsolete: false,
						});

						// set is_notified to true in customerMembershipLogsRepo table for log
						await this.customerMembershipLogsRepo.save({
							customer: customerData,
							membership_number: customer.membership_number,
							membership_status: this.mapMembershipLevelToFullForm(
								customerMetadata.CURRENT_MEMBERSHIP_STATUS,
							),
							update_type: 'SUSPENDED',
							is_notified: true,
						});
				}

				if (
					`${customerMetadata.CURRENT_MEMBERSHIP_STATUS}`.toLowerCase() !=
					`${this.mapMembershipLevelToShortForm(
						customer.membership_type,
					)}`.toLowerCase()
				) {
					console.log(
						`${customerMetadata.CURRENT_MEMBERSHIP_STATUS}`.toLowerCase(),
						`${this.mapMembershipLevelToShortForm(
							customer.membership_type,
						)}`.toLowerCase(),
						'123123123 inside',
						this.mapMembershipLevelToFullForm(
							customerMetadata.CURRENT_MEMBERSHIP_STATUS, //D  ->Diamond must be
						),
					);

					// update the current membership status in the lms db if different
					await this.customerCardRepo.update(
						{
							idx: customer.idx,
							is_obsolete:false

						},{
							membership_type: this.mapMembershipLevelToFullForm(
								customerMetadata.CURRENT_MEMBERSHIP_STATUS,
							),
							card_status: this.membershipDetailsMapping(
								customerMetadata.CARD_STATUS,
							),
							previous_membership_status: customer.membership_type,
							is_membership_changed: true
						}
					)

					//findout downgrade or upgrade
					const current_level = this.getMemberShipLevel(
						customer.membership_type,
					);
					const new_level = this.getMemberShipLevelFromShort(
						customerMetadata.CURRENT_MEMBERSHIP_STATUS,
					);

					console.log(current_level, new_level);

					if (new_level === current_level) {
						return;
					}

					//only chekc upgrade or downgrade
					if (new_level > current_level) {
						//upgrade


						let message = upgradeTemplate.data.action_message;
						let messageToSend = message.replace(
							'<membership_type>',
							`${this.mapMembershipLevelToFullForm(
								customerMetadata.CURRENT_MEMBERSHIP_STATUS,
							)}`,
						);
						upgraded_customers.push({
							idx: customer.customer_idx,
							message: messageToSend,
						});
						console.log('message: ', messageToSend);
						console.log('upgraded_customers: ', upgraded_customers);

						const customerData = await this.customerRepo.findOne({
							idx: customer.customer_idx,
							is_obsolete: false,
						});

						// set is_notified to true in customerMembershipLogsRepo table for log
						await this.customerMembershipLogsRepo.save({
							customer: customerData,
							membership_number: customer.membership_number,
							membership_status: this.mapMembershipLevelToFullForm(
								customerMetadata.CURRENT_MEMBERSHIP_STATUS,
							),
							update_type: 'UPGRADE',
							is_notified: true,
						});
					} else {
						//downgrade
						
						// console.log('template: ', template);

						let message = downgradeTemplate.data.action_message;
						let messageToSend = message.replace(
							'<membership_type>',
							`${this.mapMembershipLevelToFullForm(
								customerMetadata.CURRENT_MEMBERSHIP_STATUS,
							)}`,
						);
						downgraded_customers.push({
							idx: customer.customer_idx,
							message: messageToSend,
						});
						console.log('message: ', messageToSend);
						console.log('message: ', downgraded_customers);

						const customerData = await this.customerRepo.findOne({
							idx: customer.customer_idx,
							is_obsolete: false,
						});

						//set is_notified to true in customerMembershipLogsRepo table for log
						await this.customerMembershipLogsRepo.save({
							customer: customerData,
							membership_number: customer.membership_number,
							membership_status: this.mapMembershipLevelToFullForm(
								customerMetadata.CURRENT_MEMBERSHIP_STATUS,
							),
							update_type: 'DOWNGRADE',
							is_notified: true,
						});
					}
				}
			}
		}

		console.log(upgraded_customers.length, downgraded_customers.length ,cancelled_customers.length,suspended_customers.length, "final")
		if (upgraded_customers.length && upgrade_action_alias) {
			console.log(upgraded_customers, 'her are upgraded_customers ');

			await this.notifyCustomers(upgrade_action_alias, upgraded_customers);
		}
		// send notification for downgrade
		if (downgraded_customers.length && downgrade_action_alias) {
			console.log(downgraded_customers, 'her are downgraded_customers ');
			await this.notifyCustomers(
				downgrade_action_alias,
				downgraded_customers,
			);
		}

		// send notification for cancelled
		if (cancelled_customers.length && cancelled_action_alias) {
			console.log(cancelled_customers, 'her are cancelled_customers ');
			await this.notifyCustomers(
				cancelled_action_alias,
				cancelled_customers,
			);
		}

		// send notification for suspended
		if (suspended_customers.length && suspend_action_alias) {
			console.log(suspended_customers, 'her are suspended_customers ');
			await this.notifyCustomers(
				suspend_action_alias,
				suspended_customers,
			);
		}
	}

	mapMembershipLevelToShortForm(membership_type) {
		switch (membership_type) {
			case MEMBERSHIP_STATUS_LEVEL_MAP.Associate.NAME:
				return MEMBERSHIP_STATUS_LEVEL_MAP.Associate.SHORT_FORM;
			case MEMBERSHIP_STATUS_LEVEL_MAP.Silver.NAME:
				return MEMBERSHIP_STATUS_LEVEL_MAP.Silver.SHORT_FORM;
			case MEMBERSHIP_STATUS_LEVEL_MAP.Gold.NAME:
				return MEMBERSHIP_STATUS_LEVEL_MAP.Gold.SHORT_FORM;
			case MEMBERSHIP_STATUS_LEVEL_MAP.Platinum.NAME:
				return MEMBERSHIP_STATUS_LEVEL_MAP.Platinum.SHORT_FORM;
			case MEMBERSHIP_STATUS_LEVEL_MAP.Diamond.NAME:
				return MEMBERSHIP_STATUS_LEVEL_MAP.Diamond.SHORT_FORM;
			default:
				return MEMBERSHIP_STATUS_LEVEL_MAP.Associate.SHORT_FORM;
		}
	}

	getMemberShipLevel(membership_type) {
		switch (membership_type) {
			case MEMBERSHIP_STATUS_LEVEL_MAP.Associate.NAME:
				return MEMBERSHIP_STATUS_LEVEL_MAP.Associate.LEVEL;
			case MEMBERSHIP_STATUS_LEVEL_MAP.Silver.NAME:
				return MEMBERSHIP_STATUS_LEVEL_MAP.Silver.LEVEL;
			case MEMBERSHIP_STATUS_LEVEL_MAP.Gold.NAME:
				return MEMBERSHIP_STATUS_LEVEL_MAP.Gold.LEVEL;
			case MEMBERSHIP_STATUS_LEVEL_MAP.Platinum.NAME:
				return MEMBERSHIP_STATUS_LEVEL_MAP.Platinum.LEVEL;
			case MEMBERSHIP_STATUS_LEVEL_MAP.Diamond.NAME:
				return MEMBERSHIP_STATUS_LEVEL_MAP.Diamond.LEVEL;
			default:
				return MEMBERSHIP_STATUS_LEVEL_MAP.Associate.LEVEL;
		}
	}

	mapMembershipLevelToFullForm(short_membership_type) {
		console.log(short_membership_type, 'inside function');

		switch (short_membership_type) {
			case 'A':
				return MEMBERSHIP_STATUS_LEVEL_MAP.Associate.NAME;
			case 'S':
				return MEMBERSHIP_STATUS_LEVEL_MAP.Silver.NAME;
			case 'G':
				return MEMBERSHIP_STATUS_LEVEL_MAP.Gold.NAME;
			case 'P':
				return MEMBERSHIP_STATUS_LEVEL_MAP.Platinum.NAME;
			case 'D':
				console.log('inside diamond');

				return MEMBERSHIP_STATUS_LEVEL_MAP.Diamond.NAME;
			default:
				console.log('inside defa');
				return MEMBERSHIP_STATUS_LEVEL_MAP.Associate.NAME;
		}
	}

	getMemberShipLevelFromShort(short_membership_type) {
		switch (short_membership_type) {
			case MEMBERSHIP_STATUS_LEVEL_MAP.Associate.SHORT_FORM:
				return MEMBERSHIP_STATUS_LEVEL_MAP.Associate.LEVEL;
			case MEMBERSHIP_STATUS_LEVEL_MAP.Silver.SHORT_FORM:
				return MEMBERSHIP_STATUS_LEVEL_MAP.Silver.LEVEL;
			case MEMBERSHIP_STATUS_LEVEL_MAP.Gold.SHORT_FORM:
				return MEMBERSHIP_STATUS_LEVEL_MAP.Gold.LEVEL;
			case MEMBERSHIP_STATUS_LEVEL_MAP.Platinum.SHORT_FORM:
				return MEMBERSHIP_STATUS_LEVEL_MAP.Platinum.LEVEL;
			case MEMBERSHIP_STATUS_LEVEL_MAP.Diamond.SHORT_FORM:
				return MEMBERSHIP_STATUS_LEVEL_MAP.Diamond.LEVEL;
			default:
				return MEMBERSHIP_STATUS_LEVEL_MAP.Associate.LEVEL;
		}
	}

	membershipDetailsMapping(value: any) {
		value = value.toLowerCase();
		switch (value) {
			case 'a':
				return 'Active';
			case 's':
				return 'Suspended';
			case 'x':
				return 'Cancelled';
			default:
				return 'Active';
		}
	}
}
