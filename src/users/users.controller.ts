import { Controller, Get, Post, Body, Param, Put, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('api/user')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('profile')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'team', 'player', 'user')
    async getProfile(@Request() req) {
        return this.usersService.findById(req.user.userId);
    }

    @Put('profile')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'team', 'player', 'user')
    async updateProfile(@Request() req, @Body() updateData: any) {
        return this.usersService.update(req.user.userId, updateData);
    }
}
