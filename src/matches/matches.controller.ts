import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('api/matches')
export class MatchesController {
    constructor(private readonly matchesService: MatchesService) { }

    @Get()
    async findAll() {
        return this.matchesService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.matchesService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    async update(@Param('id') id: string, @Body() updateMatchDto: any) {
        return this.matchesService.update(id, updateMatchDto);
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'team', 'user') // Allow team and user to start matches
    async create(@Body() createMatchDto: any) {
        return this.matchesService.create(createMatchDto);
    }
}
