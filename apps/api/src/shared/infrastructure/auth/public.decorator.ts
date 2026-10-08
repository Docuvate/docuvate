import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_ROUTE_KEY = 'docuvate:isPublicRoute';

/** Marks an HTTP route as intentionally unauthenticated (honored by {@link AuthGuard}). */
export const Public = (): MethodDecorator & ClassDecorator =>
  SetMetadata(IS_PUBLIC_ROUTE_KEY, true);
