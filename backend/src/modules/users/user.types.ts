// This file is for types that are internal to the user module.
// For example, a type for user creation that omits fields like `id` and `createdAt`.

import { Prisma } from '@prisma/client';

export type CreateUserPayload = Prisma.UserCreateInput;