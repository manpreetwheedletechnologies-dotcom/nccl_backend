import { Controller, Get, Post, Body, UseGuards, Req, Param, UnauthorizedException, Patch } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('teams')
export class TeamsController {
    constructor(
        private readonly teamsService: TeamsService,
        private readonly usersService: UsersService
    ) { }

    @Get()
    async findAll() {
        return this.teamsService.findAll();
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    async create(@Body() createTeamDto: any, @Req() req: any) {
        const userId = req.user.userId || req.user.sub;
        // Automatically set owner from JWT
        createTeamDto.owner = userId;
        const team = await this.teamsService.create(createTeamDto);

        // Add 'team' role to user
        await this.usersService.addRole(userId, 'team');

        return team;
    }

    @Post('my-team') // Legacy or redirect to /teams
    @UseGuards(JwtAuthGuard)
    async findMyTeam(@Req() req: any) {
        const userId = req.user.userId || req.user.sub;
        return this.teamsService.findByOwner(userId);
    }

    @Get('my-teams')
    @UseGuards(JwtAuthGuard)
    async findMyTeams(@Req() req: any) {
        const userId = req.user.userId || req.user.sub;
        return this.teamsService.findByOwner(userId);
    }

    // Mutual Approval Endpoints
    @Post('request')
    @UseGuards(JwtAuthGuard)
    async createRequest(@Body() requestDto: any, @Req() req: any) {
        const userId = req.user.userId || req.user.sub;
        requestDto.sender_id = userId;
        return this.teamsService.createRequest(requestDto);
    }

    @Patch('request/:id/respond')
    @UseGuards(JwtAuthGuard)
    async respondToRequest(@Param('id') id: string, @Body('status') status: 'ACCEPTED' | 'REJECTED', @Req() req: any) {
        const userId = req.user.userId || req.user.sub;
        return this.teamsService.respondToRequest(id, status, userId);
    }

    @Get('requests/user')
    @UseGuards(JwtAuthGuard)
    async getMyRequests(@Req() req: any) {
        const userId = req.user.userId || req.user.sub;
        return this.teamsService.findRequestsForUser(userId);
    }

    @Get('requests/team/:teamId')
    @UseGuards(JwtAuthGuard)
    async getTeamRequests(@Param('teamId') teamId: string) {
        return this.teamsService.findRequestsForTeam(teamId);
    }

    @Post(':id/add-player')
    @UseGuards(JwtAuthGuard)
    async addPlayer(@Param('id') teamId: string, @Body('playerId') playerId: string, @Req() req: any) {
        const userId = req.user.userId || req.user.sub;
        const team = await this.teamsService.findById(teamId);

        if (!team) throw new UnauthorizedException('Team not found');
        if (team.owner.toString() !== userId && !req.user.roles?.includes('admin')) {
            throw new UnauthorizedException('Only team owner can add players');
        }

        // Direct add (Admin or legacy)
        return this.teamsService.addPlayer(teamId, playerId);
    }

    @Post(':id/join')
    @UseGuards(JwtAuthGuard)
    async joinTeam(@Param('id') teamId: string, @Req() req: any) {
        const userId = req.user.userId || req.user.sub;
        return this.teamsService.joinTeam(teamId, userId);
    }

    @Post(':id/guest-player')
    @UseGuards(JwtAuthGuard)
    async createGuestPlayer(@Param('id') teamId: string, @Body() guestData: any, @Req() req: any) {
        const userId = req.user.userId || req.user.sub;
        const team = await this.teamsService.findById(teamId);
        if (!team) throw new UnauthorizedException('Team not found');
        if (team.owner.toString() !== userId && !req.user.roles?.includes('admin')) {
            throw new UnauthorizedException('Only team owner can create guest players');
        }
        guestData.created_by = userId;
        return this.teamsService.createGuestPlayer(teamId, guestData);
    }

    @Post(':id/remove-player')
    @UseGuards(JwtAuthGuard)
    async removePlayer(@Param('id') teamId: string, @Body('playerId') playerId: string, @Req() req: any) {
        const userId = req.user.userId || req.user.sub;
        const team = await this.teamsService.findById(teamId);
        if (!team) throw new UnauthorizedException('Team not found');
        if (team.owner.toString() !== userId) {
            throw new UnauthorizedException('Only team owner can remove players');
        }
        return this.teamsService.removePlayer(teamId, playerId);
    }

    @Post(':id/set-captain')
    @UseGuards(JwtAuthGuard)
    async setCaptain(@Param('id') teamId: string, @Body('playerId') playerId: string, @Req() req: any) {
        const userId = req.user.userId || req.user.sub;
        const team = await this.teamsService.findById(teamId);
        if (!team) throw new UnauthorizedException('Team not found');
        if (team.owner.toString() !== userId) {
            throw new UnauthorizedException('Only team owner can assign captain');
        }
        return this.teamsService.setCaptain(teamId, playerId);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.teamsService.findById(id);
    }
}
