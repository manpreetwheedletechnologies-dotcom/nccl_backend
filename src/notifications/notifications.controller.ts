import { Controller, Get, Post, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get(':userId')
    @UseGuards(JwtAuthGuard)
    async getUserNotifications(@Param('userId') userId: string) {
        return this.notificationsService.findByUserId(userId);
    }

    @Post()
    @UseGuards(JwtAuthGuard) // Maybe admin only or internal usage? Keeping guarded for now
    async create(@Body() createNotificationDto: any) {
        return this.notificationsService.create(createNotificationDto);
    }

    @Patch(':id/read')
    @UseGuards(JwtAuthGuard)
    async markAsRead(@Param('id') id: string) {
        return this.notificationsService.markAsRead(id);
    }
}
