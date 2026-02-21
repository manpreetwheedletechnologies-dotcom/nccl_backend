import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { StoreService } from './store.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('api/store')
export class StoreController {
    constructor(private readonly storeService: StoreService) { }

    @Get()
    async findAll() {
        return this.storeService.findAll();
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async create(@Body() createStoreItemDto: any) {
        return this.storeService.create(createStoreItemDto);
    }
}
