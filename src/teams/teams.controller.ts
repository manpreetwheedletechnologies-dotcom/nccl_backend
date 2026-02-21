import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('api/teams')
export class TeamsController {
    constructor(private readonly teamsService: TeamsService) { }

    @Get()
    async findAll() {
        return this.teamsService.findAll();
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async create(@Body() createTeamDto: any) {
        return this.teamsService.create(createTeamDto);
    }
}
