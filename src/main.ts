import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import config from './config/index';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as compression from 'compression';
import * as helmet from 'helmet';

async function bootstrap() {
	let serverOptions = {};

	if (
		fs.existsSync(
			path.resolve(`${__dirname}/../${process.env.CERTIFICATE_FILE}`),
		) &&
		fs.existsSync(
			path.resolve(`${__dirname}/../${process.env.CERTIFICATE_KEY}`),
		)
	) {
		const keyFile = fs.readFileSync(
			path.resolve(`${__dirname}/../${process.env.CERTIFICATE_KEY}`),
		);

		const certFile = fs.readFileSync(
			path.resolve(`${__dirname}/../${process.env.CERTIFICATE_FILE}`),
		);

		serverOptions = {
			httpsOptions: {
				key: keyFile,
				cert: certFile,
			},
		};
	}

	const app = await NestFactory.create(AppModule, serverOptions);
	app.setGlobalPrefix('v1');
	app.enableCors();
	app.use(helmet());
	app.use(compression());
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
		}),
	);

	const options = new DocumentBuilder()
		.setTitle('Lms Api')
		.setBasePath('v1')
		.setDescription(
			'The LMS API description built using swagger OpenApi. You can find out more about Swagger at http://swagger.io',
		)
		.setVersion('1.0')
		.build();
	const document = SwaggerModule.createDocument(app, options);
	SwaggerModule.setup('api', app, document);

	await app.listen(config.port);
	Logger.log(`Server running on http://localhost:${config.port}`, 'Bootstrap');
}

bootstrap();
