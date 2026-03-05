import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('matches')
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
    @Roles('admin', 'team', 'user')
    async create(@Body() createMatchDto: any, @Req() req: any) {
        const userId = req.user.userId || req.user.sub;
        createMatchDto.organizer_id = userId;
        return this.matchesService.create(createMatchDto);
    }

    // ─── ROLE MANAGEMENT ──────────────────────────────────────────────────────

    @Post(':id/assign-role')
    @UseGuards(JwtAuthGuard)
    async assignRole(
        @Param('id') matchId: string,
        @Body() body: { userId: string; role: 'umpire' | 'scorer' | 'commentator' },
        @Req() req: any
    ) {
        const requesterId = req.user.userId || req.user.sub;
        const match = await this.matchesService.findOne(matchId);
        const requesterRole = this.matchesService.getUserRoleInMatch(match, requesterId);
        if (requesterRole !== 'organizer') throw new Error('Only the match organizer can assign roles');
        return this.matchesService.assignRole(matchId, body.userId, body.role);
    }

    @Post(':id/remove-role')
    @UseGuards(JwtAuthGuard)
    async removeRole(
        @Param('id') matchId: string,
        @Body() body: { userId: string; role: 'umpire' | 'scorer' | 'commentator' },
        @Req() req: any
    ) {
        const requesterId = req.user.userId || req.user.sub;
        const match = await this.matchesService.findOne(matchId);
        const requesterRole = this.matchesService.getUserRoleInMatch(match, requesterId);
        if (requesterRole !== 'organizer') throw new Error('Only the match organizer can remove roles');
        return this.matchesService.removeRole(matchId, body.userId, body.role);
    }

    // ─── BALL RECORDING ───────────────────────────────────────────────────────

    @Post(':id/record-ball')
    @UseGuards(JwtAuthGuard)
    async recordBall(
        @Param('id') matchId: string,
        @Body() body: {
            runs: number;
            type: 'run' | 'wicket' | 'wide' | 'noball' | 'bye' | 'legbye';
            commentary?: string;
            strikerId?: string;
            nonStrikerId?: string;
            strikerName?: string;
            nonStrikerName?: string;
            bowlerId?: string;
            bowlerName?: string;
            // Wicket specific
            wicketType?: string;
            fielderId?: string;
            fielderName?: string;
            newBatsmanId?: string;
            newBatsmanName?: string;
        },
        @Req() req: any
    ) {
        const userId = req.user.userId || req.user.sub;
        return this.matchesService.recordBall(matchId, userId, body);
    }

    @Post(':id/undo-ball')
    @UseGuards(JwtAuthGuard)
    async undoBall(@Param('id') matchId: string, @Req() req: any) {
        const userId = req.user.userId || req.user.sub;
        return this.matchesService.undoLastBall(matchId, userId);
    }

    // ─── RETROACTIVE EDIT ─────────────────────────────────────────────────────

    @Post(':id/edit-ball')
    @UseGuards(JwtAuthGuard)
    async editBall(
        @Param('id') matchId: string,
        @Body() body: { ballIndex: number; newRuns: number },
        @Req() req: any
    ) {
        const userId = req.user.userId || req.user.sub;
        return this.matchesService.editBallScore(matchId, userId, body.ballIndex, body.newRuns);
    }

    // ─── MAN OF THE MATCH ─────────────────────────────────────────────────────

    @Post(':id/man-of-match')
    @UseGuards(JwtAuthGuard)
    async setManOfMatch(
        @Param('id') matchId: string,
        @Body() body: { player_id: string; name: string; reason: string; team_name: string },
        @Req() req: any
    ) {
        const userId = req.user.userId || req.user.sub;
        return this.matchesService.setManOfMatch(matchId, userId, body);
    }

    // ─── COMMENTARY ───────────────────────────────────────────────────────────

    @Post(':id/commentary')
    @UseGuards(JwtAuthGuard)
    async addCommentary(
        @Param('id') matchId: string,
        @Body() body: { text: string; ball?: string; event?: string },
        @Req() req: any
    ) {
        const userId = req.user.userId || req.user.sub;
        return this.matchesService.addCommentary(matchId, userId, body.text, body.ball, body.event);
    }
}
