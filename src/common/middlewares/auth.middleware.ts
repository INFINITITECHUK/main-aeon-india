import {
	HttpException,
	HttpStatus,
	Injectable,
	Logger,
	NestMiddleware,
} from '@nestjs/common';
import { Request, Response } from 'express';
import validator from 'validator';
import { Axios, isObjectEmpty } from '../../utils/helpers';

@Injectable()
export class AuthMiddleWare implements NestMiddleware {
	private readonly logger = new Logger('RequestLog');

	async use(req: Request, res: Response, next: () => void) {
		if (req.headers.authorization === undefined) {
			throw new HttpException(
				'Empty Authorization token',
				HttpStatus.FORBIDDEN,
			);
		}

		try {
			if (!isObjectEmpty(req.headers.authorization)) {
				let url = req.originalUrl;
				const urlArr = url.split('?');
				if (urlArr.length > 0) {
					url = urlArr[0];
				}

				Logger.log('herer');
				Logger.log(urlArr);
				url = url.replace(/\/$/, '');

				const finalRouteParam = url.split('/').pop();
				Logger.log('finalroute is ', finalRouteParam);
				Logger.log(url);
				if (validator.isUUID(finalRouteParam, 'all')) {
					const array = url.split('/');
					array.pop();
					url = array.join('/') + '/' + ':idx';

					console.log('request url is ', url);
				}
				const jwtData = await Axios.post(`${process.env.AUTHENTICATER_URL}`, {
					data: req.headers.authorization,
					url,
					method: req.method,
				});
				process.env.idx = jwtData.data.idx;
				process.env.username = jwtData.data.username;
				process.env.is_superadmin = jwtData.data.is_superadmin;
			}
			next();
		} catch (e) {
			Logger.log(e.response.data, 'Auth mid');

			throw new HttpException(e.response.data, e.response.status);
		}
	}
}
