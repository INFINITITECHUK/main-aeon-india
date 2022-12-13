export const MEMBERSHIP_STATUS_MAP = {
			'Associate': {
				'NUMBER_OF_LOANS': 0,
				'CAP_AMOUNT': 0,
				'NEXT_LEVEL': 'Gold'
			},
			'Silver': {
				'NUMBER_OF_LOANS': 0,
				'CAP_AMOUNT': 0,
				'NEXT_LEVEL': 'Gold'
			},
			'Gold': {
				'NUMBER_OF_LOANS': 2,
				'CAP_AMOUNT': 30000,
				'NEXT_LEVEL': 'Platinum'

			},
			'Platinum': {
				'NUMBER_OF_LOANS': 3,
				'CAP_AMOUNT': 75000,
				'NEXT_LEVEL': 'Diamond'
			},
			'Diamond': {
				'NUMBER_OF_LOANS': 3,
				'CAP_AMOUNT': 100000,
				'NEXT_LEVEL': 'Diamond'
			},
		};