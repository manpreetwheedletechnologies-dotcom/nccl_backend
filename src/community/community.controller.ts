import { Controller, Get, Post, Body, UseGuards, Param } from '@nestjs/common';
import { CommunityService } from './community.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

 @Controller('community')
export class CommunityController {
    constructor(private readonly communityService: CommunityService) { }

    @Get('looking')
    async findAllLooking() {
        return this.communityService.findAllLooking();
    }

    @Get('feed')
    async findAllFeed() {
        return this.communityService.findAllFeed();
    }

    @Get('polls')
    async findAllPolls() {
        return this.communityService.findAllPolls();
    }

    @Post('feed')
    @UseGuards(JwtAuthGuard)
    async createFeedPost(@Body() createPostDto: any) {
        return this.communityService.createFeedPost(createPostDto);
    }

    @Get('network/:category')
    async findByCategory(@Param('category') category: string) {
        return this.communityService.findByCategory(category);
    }

    @Post('network')
    @UseGuards(JwtAuthGuard)
    async createNetworkItem(@Body() createItemDto: any) {
        return this.communityService.createNetworkItem(createItemDto);
    }

    @Post('looking')
    @UseGuards(JwtAuthGuard)
    async createLooking(@Body() createPostDto: any) {
        return this.communityService.create(createPostDto);
    }
}
