import { Controller, Post, Body, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, AppCodeLoginDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        const user = await this.authService.validateUser(loginDto.phone, loginDto.password, loginDto.otp);
        if (!user) {
            throw new UnauthorizedException('Incorrect mobile number or credentials');
        }
        return this.authService.login(user);
    }

    @Post('login-code')
    async loginByCode(@Body() loginCodeDto: AppCodeLoginDto) {
        return this.authService.loginByCode(loginCodeDto.code);
    }

    @Post('register')
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('logout')
    async logout() {
        // Stateless JWT — token invalidation is handled client-side.
        // This endpoint exists for client to signal logout (future: revoke tokens in DB).
        return { success: true, message: 'Logged out successfully' };
    }
}
