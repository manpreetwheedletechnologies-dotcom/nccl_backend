import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService
    ) { }

    async validateUser(phone: string, pass: string): Promise<any> {
        const user = await this.usersService.findOne(phone);
        if (user) {
            // For now, allowing login without password if not set (legacy support)
            // In real world, we would check password
            const userObj = (user as any).toObject ? (user as any).toObject() : user;
            if (!userObj.password || (await bcrypt.compare(pass, userObj.password))) {
                const { password, ...result } = userObj;
                return result;
            }
        }
        return null;
    }

    async login(user: any) {
        const payload = {
            phone: user.phone,
            sub: user._id || user.id,
            roles: (user.roles && user.roles.length > 0) ? user.roles : ['user']
        };
        return {
            access_token: this.jwtService.sign(payload),
            user: user
        };
    }

    async register(userDto: any) {
        // Hash password if provided
        if (userDto.password) {
            const salt = await bcrypt.genSalt();
            userDto.password = await bcrypt.hash(userDto.password, salt);
        }

        // Ensure roles is an array and has at least one role
        if (!userDto.roles || !Array.isArray(userDto.roles) || userDto.roles.length === 0) {
            userDto.roles = ['user']; // Default to generic user
        }

        return this.usersService.create(userDto);
    }
}
