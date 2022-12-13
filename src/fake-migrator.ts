import 'reflect-metadata';
import { createConnection, MigrationExecutor } from 'typeorm';
import config from './config';
import { join } from 'path';

createConnection({
	type: 'postgres',
	host: config.db.host,
	port: config.db.port,
	username: config.db.username,
	password: config.db.password,
	database: config.db.database,
	entities: [join(__dirname, 'entities/*{.ts,.js}')],
	logging: 'all',
	migrationsTableName: 'nest_migration',
	logger: 'advanced-console',
	migrations: [join(__dirname, 'migrations/**/*{.ts,.js}')],
	cli: {
		migrationsDir: join('src', 'migrations'),
	},
})
	.then(async connection => {
		const mig = new MigrationExecutor(connection);
		await connection.manager.query(
			` CREATE TABLE IF NOT EXISTS "nest_migration" ("id" SERIAL NOT NULL, "timestamp" bigint NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_d8a054ea06850edd968e06c00e4" PRIMARY KEY ("id"))`,
		);
		const migrations = await mig.getAllMigrations();

		console.log(migrations);

		for (const migration of migrations) {
			//	await mig.insertMigration(migration);

			await connection.manager.query(
				` INSERT INTO "nest_migration"("timestamp", "name") VALUES ($1, $2) `,
				[migration.timestamp, migration.name],
			);
		}
	})
	.catch(error => console.log(error));
