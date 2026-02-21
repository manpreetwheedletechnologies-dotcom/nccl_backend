import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('api/premium')
export class SubscriptionController {
    constructor(private readonly subscriptionService: SubscriptionService) { }

    @Get('plans')
    async getPlans() {
        return this.subscriptionService.findAllPlans();
    }

    @Post('plans')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async createPlan(@Body() createPlanDto: any) {
        return this.subscriptionService.createPlan(createPlanDto);
    }

    @Post('subscribe')
    @UseGuards(JwtAuthGuard)
    async subscribe(@Body() dto: any) {
        return this.subscriptionService.subscribe(dto);
    }

    @Get('check/:userId')
    async checkStatus(@Param('userId') userId: string) {
        return this.subscriptionService.checkStatus(userId);
    }
}
