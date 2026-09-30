// Auth.js route handlers. Node runtime, because the password provider needs node:crypto.
import { handlers } from '@/auth';

export const { GET, POST } = handlers;
