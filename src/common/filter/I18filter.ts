import { I18nService } from 'nestjs-i18n';
import {
	ExceptionFilter,
	Catch,
	ArgumentsHost,
	HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import * as _ from 'lodash';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
	constructor(private readonly i18n: I18nService) {}

	async catch(exception: HttpException, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const statusCode = exception.getStatus();
		try {
			let responseMessage = exception.getResponse() as {
				message: string;
				sub: string | null;
				args: Record<string, any>;
			};

			if (responseMessage && !responseMessage.message) {
				response
					.status(statusCode)
					.json({ statusCode, message: responseMessage });

				return;
			}

			responseMessage.message = await this.i18n.translate(
				responseMessage.message,
				{
					lang: host.switchToHttp().getRequest().i18nLang,
					args: responseMessage.args,
				},
			);

			if (responseMessage.sub) {
				responseMessage.sub = await this.i18n.translate(responseMessage.sub, {
					lang: host.switchToHttp().getRequest().i18nLang,
					args: responseMessage.args,
				});
			}

			response
				.status(statusCode)
				.json({ statusCode, ..._.omit(responseMessage, ['args']) });
		} catch (e) {
			let responseMessage = exception.getResponse() as {
				message: string;
				sub: string | null;
				args: Record<string, any>;
			};
			const status = responseMessage['statusCode']
				? responseMessage['statusCode']
				: 400;
			// throw new HttpException(`${responseMessage.message[0]}`, status);
			// return  exception
			return response
				.status(statusCode)
				.json({ ..._.omit(responseMessage, ['args']) });
		}
	}
}
