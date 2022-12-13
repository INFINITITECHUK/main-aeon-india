import {
	ValidationArguments,
	ValidatorConstraint,
	ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'customText', async: false })
export class ValidDate implements ValidatorConstraintInterface {
	daysInMonth(m, y) {
		// m is 0 indexed: 0-11
		switch (m) {
			case 1:
				return (y % 4 === 0 && y % 100) || y % 400 === 0 ? 29 : 28;
			case 8:
			case 3:
			case 5:
			case 10:
				return 30;
			default:
				return 31;
		}
	}

	validate(text: string, args: ValidationArguments) {
		const [y, m, d] = text.split('-').map(item => parseInt(item, 10));
		return m - 1 >= 0 && m - 1 < 12 && d > 0 && d <= this.daysInMonth(m - 1, y);
	}

	defaultMessage(args: ValidationArguments) {
		// here you can provide default error message if validation failed
		return '($value) is not a valid date!';
	}
}
