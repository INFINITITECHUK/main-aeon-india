import * as argon from 'argon2';

export async function hashString(string): Promise<string> {
	return argon.hash(string, {
		type: argon.argon2d,
		hashLength: 50,
	});
}

export async function verifyHash(string, hash): Promise<boolean> {
	return argon.verify(string, hash);
}

export const formUrlEncoded = x =>
	Object.keys(x).reduce((p, c) => p + `&${c}=${encodeURIComponent(x[c])}`, '');
