import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // No roles required — allow through
        if (!requiredRoles) return true;

        const { user } = context.switchToHttp().getRequest();
        if (!user) return false;

        const userRoles: string[] = user.roles || [];

        // Admin always passes
        if (userRoles.includes('admin')) return true;

        // Check if any required role is present in user's roles
        return requiredRoles.some((role) => userRoles.includes(role));
    }
}
