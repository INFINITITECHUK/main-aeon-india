var axios = require('axios');

var config = {
	method: 'get',
	url:
		'http://localhost:8009/v1/customer-cron-jobs/checkCustomerMembershipStatus',
	headers: {},
};

axios(config)
	.then(function (response) {
		console.log(JSON.stringify(response.data));
	})
	.catch(function (error) {
		console.log(error);
	});
