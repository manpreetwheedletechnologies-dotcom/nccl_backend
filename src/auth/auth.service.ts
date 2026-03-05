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

    async validateUser(phone: string, pass?: string, otp?: string): Promise<any> {
        let user = await this.usersService.findOne(phone);

        // If OTP provided, check for bypass code
        if (otp && otp.trim() === '123456') {
            if (!user) {
                user = await this.usersService.create({
                    phone,
                    name: 'New Player',
                    location: 'City',
                    roles: ['player'],
                    is_premium: false,
                    progress: 10
                });
            }
            const userObj = (user as any).toObject ? (user as any).toObject() : user;
            const { password, ...result } = userObj;
            return result;
        }



        if (user) {
            const userObj = (user as any).toObject ? (user as any).toObject() : user;

            // If no password provided or no password set for user, allow phone-only login
            if (!pass || !userObj.password) {
                const { password, ...result } = userObj;
                return result;
            }

            if (userObj.password && (await bcrypt.compare(pass, userObj.password))) {
                const { password, ...result } = userObj;
                return result;
            }
        }
        return null;
    }

    async login(user: any) {
        let roles = (user.roles && user.roles.length > 0) ? [...user.roles] : ['user'];

        // Ensure every logged-in user has at least 'user' role in their JWT,
        // so admin/team/user-gated endpoints work.
        // 'player' role is kept alongside — it enables player-only features.
        if (!roles.includes('admin') && !roles.includes('user')) {
            roles = [...roles, 'user'];
        }

        const payload = {
            phone: user.phone,
            sub: user._id || user.id,
            roles,
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

    async loginByCode(appCode: string) {
        const user = await this.usersService.findByAppCode(appCode);
        if (!user) {
            throw new UnauthorizedException('Invalid App Code');
        }
        return this.login(user);
    }
}
