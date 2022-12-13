import {
	Column,
	Entity,
	Generated,
	Index,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

@Index(['idx'], { unique: true })
@Entity('Benefits', { schema: 'public' })
export class Benefits {
	@Exclude({ toPlainOnly: true })
	@PrimaryGeneratedColumn({
		type: 'integer',
		name: 'id',
	})
	id: number;

	@Exclude({ toPlainOnly: true })
	@Column('boolean', {
		nullable: false,
		default: () => 'false',
		name: 'is_obsolete',
	})
	is_obsolete: boolean;

	@Column('timestamp without time zone', {
		nullable: false,
		default: () => 'CURRENT_TIMESTAMP',
		name: 'created_on',
	})
	created_on: Date;

	@Exclude({ toPlainOnly: true })
	@Column('timestamp without time zone', {
		nullable: true,
		default: () => 'CURRENT_TIMESTAMP',
		name: 'modified_on',
	})
	modified_on: Date | null;

	@Column('uuid', {
		nullable: false,
		name: 'idx',
	})
	@Generated('uuid')
	idx: string;

	@Column('text', {
		nullable: false,
		name: 'membership',
	})
	membership: string;

	@Column('text', {
		name: 'benefits',
		array: true,
		nullable: false,
	})
	benefits: string[];
}

// {Customized digital card basis on member tier,Earn reward point on minimum monthly payment (on Principal amount) at Rs. 100 =1 Point,Avail Revolving loan within credit limit}
// {Customized digital card basis on member tier,Earn reward point on minimum monthly payment (on Principal amount) at Rs. 100 =1 Point,Avail Revolving loan within credit limit}
// {Customized digital card basis on member tier,Earn reward point on minimum monthly payment (on Principal amount) at Rs. 100 =1 Point,Avail Revolving loan within credit limit, Easy and quick loan approval}
// {Customized digital card basis on member tier,Earn reward point on minimum monthly payment (on Principal amount) at Rs. 100 =1.1 Point,Avail Revolving loan within credit limit, Easy and quick loan approval}
// {Customized digital card basis on member tier,Earn reward point on minimum monthly payment (on Principal amount) at Rs. 100 =1.2 Point,Multi loan benefits along with Revolving loan (within the credit limit), Easy and quick loan approval}
// {Customized digital card basis on member tier,Earn reward point on minimum monthly payment (on Principal amount) at Rs. 100 =1.5 Point,Multi loan benefits along with Revolving loan (within the credit limit), Easy and quick loan approval}
