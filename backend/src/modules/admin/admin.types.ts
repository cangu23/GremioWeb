import { z } from 'zod';
import {
  adminQuerySchema,
  updateUserAdminSchema,
  updateVtuberAdminSchema,
  updateEventAdminSchema,
  updateGuildAdminSchema,
  updatePostAdminSchema,
  updateCommentAdminSchema,
  resolveReportSchema,
} from './admin.validation';

export type AdminQueryInput = z.infer<typeof adminQuerySchema>['query'];
export type UpdateUserAdminInput = z.infer<typeof updateUserAdminSchema>['body'];
export type UpdateVtuberAdminInput = z.infer<typeof updateVtuberAdminSchema>['body'];
export type UpdateEventAdminInput = z.infer<typeof updateEventAdminSchema>['body'];
export type UpdateGuildAdminInput = z.infer<typeof updateGuildAdminSchema>['body'];
export type UpdatePostAdminInput = z.infer<typeof updatePostAdminSchema>['body'];
export type UpdateCommentAdminInput = z.infer<typeof updateCommentAdminSchema>['body'];
export type ResolveReportInput = z.infer<typeof resolveReportSchema>['body'];

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}
