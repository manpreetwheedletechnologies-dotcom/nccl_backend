import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { NewsService } from './news.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('api/news')
export class NewsController {
    constructor(private readonly newsService: NewsService) { }

    @Get()
    async findAll() {
        return this.newsService.findAll();
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async create(@Body() createNewsDto: any) {
        return this.newsService.create(createNewsDto);
    }
}
