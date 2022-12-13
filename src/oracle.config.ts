const oracledb = require('oracledb');

const checkConnection = async () => {
	let connection;
	try {
		connection = await oracledb.getConnection({
			user: 'ro_loyality',
			password: 'ro_loyality',
			connectString: `UAT-MDB-NEO-scan.aeoncredit.local:1521/uatmdb1`,
		});
		// console.log('Successfully connected to Oracle!');
		// const stmt = 'SELECT * FROM Loy_Customer';
		// const res = await connection.execute(stmt);
		// console.log('res: ', res);

		return connection;
	} catch (err) {
		console.log('Error: ', err);
		return err;
	} finally {
		if (connection) {
			try {
				await connection.close();
			} catch (err) {
				console.log('Error when closing the database connection: ', err);
			}
		}
	}
};

export default checkConnection;

// checkConnection();
