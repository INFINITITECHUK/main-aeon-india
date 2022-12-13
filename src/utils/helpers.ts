import { classToPlain } from 'class-transformer';
import * as XLSX from 'xlsx';
import * as argon from 'argon2';
import { isUUID } from '@nestjs/common/utils/is-uuid';
import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import * as path from 'path';
import axios from 'axios';
import * as https from 'https';
import * as fs from 'fs';
import { Between, getConnection, getManager, getRepository, In } from 'typeorm';
import { ActivityLog } from '../entities/ActivityLog';
import { Protocol } from '../entities/Protocol';
import { Customer } from '../entities/customer.entity';
import * as moment from 'moment';
import { StateCode } from '@entities/StateCode';


export const getRandomNumber = (length) => {
	return Math.floor(
		Math.pow(10, length - 1) + Math.random() * 9 * Math.pow(10, length - 1),
	);
};


function get_header_row(filePath) {
	const workbook = XLSX.readFile(filePath);
	const sheet = workbook.Sheets[workbook.SheetNames[0]];
	const headers = [];
	const range = XLSX.utils.decode_range(sheet['!ref']);

	let C: number;
	const R = range.s.r;

	/* walk every column in the range */

	for (C = range.s.c; C <= range.e.c; ++C) {
		const cell =
			sheet[
				XLSX.utils.encode_cell({ c: C, r: R })
			]; /* find the cell in the first row */

		let hdr: string;

		if (cell && cell.t) {
			hdr = XLSX.utils.format_cell(cell);
		}

		headers.push(hdr);
	}
	return headers;
}

export const isObjectEmpty = (obj: any): boolean => {
	return Object.keys(obj).length === 0;
};

export function hasNext(page: number, totalPages: number, hostAddress: string) {
	if (page === totalPages) {
		return '';
	} else {
		return `${hostAddress.replace('\n', '')}?page=${page + 1}`;
	}
}

export function hasPrevious(
	page: number,
	totalPages: number,
	hostAddress: string,
) {
	if (page <= 1) {
		return '';
	} else {
		return `${hostAddress.replace('\n', '')}?page=${page - 1}`;
	}
}

export function paginate(pages, page, total, host, result) {
	return {
		total_pages: pages,
		total_items: total,
		next: hasNext(page, pages, host),
		previous: hasPrevious(page, pages, host),
		current_page: page,
		items: classToPlain(result),
	};
}

export function removeEmpty(obj) {
	return Object.entries(obj).reduce(
		(a, [k, v]) => (v === null ? a : { ...a, [k]: v }),
		{},
	);
}

export function parseJwt(token) {
	const base64Url = token.split('.')[1]; // token you get
	const base64 = base64Url.replace('-', '+').replace('_', '/');
	return JSON.parse(Buffer.from(base64, 'base64').toString('binary'));
}

export function cleanData(obj: any, toRemove: Array<string>) {
	for (const key of Object.keys(obj)) {
		if (toRemove.includes(key)) {
			delete obj[key];
		}
	}
}

export function readExcel(filePath: string) {
	const workbook = XLSX.readFile(filePath);
	const sheet_name_list = workbook.SheetNames;
	return XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]], {
		raw: true,
		defval: '',
	});
}

export function validateUUID(idx: string) {
	if (!isUUID(idx, 'all')) {
		throw new HttpException('Invalid idx', HttpStatus.BAD_REQUEST);
	}
}

export function validateUUIDwithMessage(idx: string, message: string) {
	if (!isUUID(idx, 'all')) {
		throw new HttpException(`Invalid ${message}`, HttpStatus.BAD_REQUEST);
	}
}

export const fileName = (OldName: string) => {
	return (
		path.basename(OldName, path.extname(OldName)) +
		'-' +
		Date.now() +
		path.extname(OldName)
	);
};

export async function hashString(string: string): Promise<string> {
	return argon.hash(string, {
		type: argon.argon2d,
		hashLength: 50,
	});
}

function getAxios() {
	if (
		fs.existsSync(
			path.resolve(`${__dirname}/../../${process.env.CERTIFICATE_VERIFY}`),
		)
	) {
		Logger.log('CA cert Found');
		const certVerifyFile = fs.readFileSync(
			path.resolve(`${__dirname}/../../${process.env.CERTIFICATE_VERIFY}`),
		);

		return axios.create({
			httpsAgent: new https.Agent({
				// ca: certVerifyFile,
				rejectUnauthorized: false,
			}),
		});
	}

	Logger.log('CA cert not Found');
	return axios.create({
		httpsAgent: new https.Agent({
			rejectUnauthorized: false,
		}),
	});
}

export const titleCase = str => {
	return str.replace(/\w\S*/g, t => {
		return t.charAt(0).toUpperCase() + t.substr(1).toLowerCase();
	});
};

export const getStateFromCode = stateCode => {
	const state = getRepository(StateCode)
		.findOne({
			where: {
				state_code: parseInt(stateCode)
			}
		})
	if (!state){
		return ''
	}
	return state
}

export const getCodeFromState = state => {
	const stateCode = getRepository(StateCode)
		.findOne({
			where: {
				state_name: state
			}
		})
	if (!stateCode){
		return ''
	}
	return stateCode
}

export const Axios = getAxios();

export async function LogOperation(
	customer: Customer,
	Device: string,
	operation: string,
) {
	await getManager().transaction(async transactionalEntityManager => {
		await transactionalEntityManager.getRepository(ActivityLog).save({
			ip_address: '',
			device_id: Device,
			login_type: 'MOBILE',
			status: true,
			user_id: customer,
			activity_type: operation,
		});

		const protocolSettings = await transactionalEntityManager
			.getRepository(Protocol)
			.findOne({
				where: {
					is_active: true,
					is_obsolete: false,
				},
				select: [
					'mpin_attempt_interval',
					'mpin_interval_unit',
					'mpin_max_retry',
				],
			});

		const activityLog = await transactionalEntityManager
			.getRepository(ActivityLog)
			.find({
				where: {
					created_on: Between(
						moment(new Date())
							.subtract(
								protocolSettings.login_attempt_interval,
								protocolSettings.login_interval_unit as moment.DurationInputArg2,
							)
							.startOf('d')
							.toISOString(),
						moment(new Date()).endOf('d').toISOString(),
					),
					status: false,
					is_obsolete: false,
					user_id: customer,
				},
			});

		const updateLog = activityLog.map(el => el.id);

		if (updateLog.length > 0) {
			await transactionalEntityManager
				.createQueryBuilder()
				.update(ActivityLog)
				.set({ is_obsolete: true })
				.where({ id: In(updateLog) })
				.execute();
		}
	});
}

export async function checkForFailedMpin(
	customer: Customer,
	device: string,
	ip: string,
	login_type: string,
	activity_type: string,
): Promise<void> {
	await getConnection().getRepository(ActivityLog).save({
		ip_address: '',
		device_id: device,
		login_type,
		status: false,
		user_id: customer,
		activity_type,
	});

	const protocolSettings = await getConnection()
		.getRepository(Protocol)
		.findOne({
			where: {
				is_active: true,
				is_obsolete: false,
			},
			select: ['mpin_attempt_interval', 'mpin_interval_unit', 'mpin_max_retry'],
		});

	const activityLog = await getConnection()
		.getRepository(ActivityLog)
		.find({
			where: {
				created_on: Between(
					moment(new Date())
						.subtract(
							protocolSettings.login_attempt_interval,
							protocolSettings.login_interval_unit as moment.DurationInputArg2,
						)
						.startOf('d')
						.toISOString(),
					moment(new Date()).endOf('d').toISOString(),
				),
				status: false,
				user_id: customer,
				is_obsolete: false,
			},
		});

	console.log('length ', activityLog.length);

	if (activityLog.length >= protocolSettings.mpin_max_retry) {
		await getConnection()
			.getRepository(Customer)
			.update({ id: customer.id }, { is_active: false });

		//send notification here
		try {
			const getTemplateByActionAlias = await Axios.get(
				`${process.env.GET_TEMPLATE_FOR_NOTIFICATION}send_account_blocked`,
			);

			const requiredMessageToSend =
				getTemplateByActionAlias.data.action_message;

			const response: any = await Axios.post(
				`${process.env.SEND_MEMBER_NOTIFICATION}`,
				{
					action_alias: 'send_account_blocked',
					customers: [
						{
							idx: customer.idx,
							message: `${requiredMessageToSend}`,
						},
					],
				},
			);
		} catch (e) {
			Logger.log(e.response.data);

			throw new HttpException(e.response.data.message, e.response.status);
		}

		throw new HttpException(
			{
				message: 'operations.CANNOT_PROCEED',
				sub: 'operations.CUSTOMER_BLOCKED',
			},
			HttpStatus.FORBIDDEN,
		);
	}

	throw new HttpException(
		{
			message: 'operations.OOPS_MPIN',
			sub: `operations.INVALID_MPIN_LEFT`,
			args: { time: `${protocolSettings.mpin_max_retry - activityLog.length}` },
		},
		HttpStatus.BAD_REQUEST,
	);
}
