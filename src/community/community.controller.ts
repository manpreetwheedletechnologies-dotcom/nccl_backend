import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { CommunityService } from './community.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/looking')
export class CommunityController {
    constructor(private readonly communityService: CommunityService) { }

    @Get()
    async findAll() {
        return this.communityService.findAll();
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    async create(@Body() createPostDto: any) {
        return this.communityService.create(createPostDto);
    }
}
