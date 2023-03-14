import { z } from 'zod';
import { zfd } from 'zod-form-data';

export const userSchema = zfd.formData({
	name: z.string().min(2).regex(/^A.*$/, { message: 'Name must start with A' }),
	email: z
		.string()
		.email()
		.refine((email) => !email.includes('spam'), {
			message: 'Email cannot contain spam.'
		}),
	gender: z.enum(['male', 'female', 'other']).nullish()
});
