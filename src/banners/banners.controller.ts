import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { BannersService } from './banners.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('api')
export class BannersController {
    constructor(private readonly bannersService: BannersService) { }

    @Get('store/banners')
    async getStoreBanners() {
        return this.bannersService.findStoreBanners();
    }

    @Post('store/banners')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async createStoreBanner(@Body() dto: any) {
        return this.bannersService.createStoreBanner(dto);
    }

    @Get('home/banners')
    async getHomeBanners() {
        return this.bannersService.findHomeBanners();
    }

    @Post('home/banners')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async createHomeBanner(@Body() dto: any) {
        return this.bannersService.createHomeBanner(dto);
    }
}
