import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('api/tournaments')
export class TournamentsController {
    constructor(private readonly tournamentsService: TournamentsService) { }

    @Get()
    async findAll() {
        return this.tournamentsService.findAll();
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'team', 'user')
    async create(@Body() createTournamentDto: any, @Request() req) {
        console.log('role', req.user.role)
        return this.tournamentsService.create(createTournamentDto, req.user.userId);
    }
}
