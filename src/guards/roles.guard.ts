/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from 'src/constants/role.enum';
import { ROLES_KEY } from 'src/decorators/role.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }
    // dung de lay metadata tu decorator
    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredRoles) {
            return true;
        }
        const { user } = context.switchToHttp().getRequest();
        // lay user duoc gan tu auth.guard truoc do
        if (!requiredRoles.some((role) => user.role?.includes(role)))
            throw new HttpException("Forbidden resoure", HttpStatus.FORBIDDEN)
        return true
    }
}
