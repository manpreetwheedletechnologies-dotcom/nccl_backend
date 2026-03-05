import { Controller, Get, Post, Body, UseGuards, Param, Request, UnauthorizedException } from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TeamsService } from '../teams/teams.service';

@Controller('tournaments')
export class TournamentsController {
    constructor(
        private readonly tournamentsService: TournamentsService,
        private readonly teamsService: TeamsService
    ) { }

    @Get()
    async findAll() {
        return this.tournamentsService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.tournamentsService.findById(id);
    }

    @Post()
    @UseGuards(JwtAuthGuard)   // Any logged-in user can create a tournament
    async create(@Body() createTournamentDto: any, @Request() req) {
        return this.tournamentsService.create(createTournamentDto, req.user.userId || req.user.sub);
    }

    @Post(':id/register-team')
    @UseGuards(JwtAuthGuard)
    async registerTeam(@Param('id') tournamentId: string, @Body() body: any, @Request() req) {
        const userId = req.user.userId || req.user.sub;
        const teamId = body.team_id;
        const team = await this.teamsService.findById(teamId);
        const tournament = await this.tournamentsService.findById(tournamentId);

        if (!team) throw new UnauthorizedException('Team not found');
        if (team.owner.toString() !== userId && tournament.created_by?.toString() !== userId) {
            throw new UnauthorizedException('Only team owner or tournament organizer can register this team');
        }

        return this.tournamentsService.registerTeam(tournamentId, {
            ...body,
            registered_by: userId,
        });
    }

    @Post(':id/player-of-tournament')
    @UseGuards(JwtAuthGuard)
    async setPlayerOfTournament(@Param('id') id: string, @Body() data: any) {
        return this.tournamentsService.setPlayerOfTournament(id, data);
    }

    @Post(':id/teams/:teamId/add-player')
    @UseGuards(JwtAuthGuard)
    async addPlayerToSquad(
        @Param('id') id: string,
        @Param('teamId') teamId: string,
        @Body() player: any,
        @Request() req
    ) {
        const userId = req.user.userId || req.user.sub;
        const team = await this.teamsService.findById(teamId);
        const tournament = await this.tournamentsService.findById(id);

        if (!team) throw new UnauthorizedException('Team not found');
        if (team.owner.toString() !== userId && tournament.created_by?.toString() !== userId) {
            throw new UnauthorizedException('Only team owner or tournament organizer can add players to this squad');
        }

        return this.tournamentsService.addPlayerToTournamentSquad(id, teamId, player);
    }
}
