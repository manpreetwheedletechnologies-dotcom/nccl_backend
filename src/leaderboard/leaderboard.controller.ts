import { Controller, Get } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';

@Controller('api/leaderboard')
export class LeaderboardController {
    constructor(private readonly leaderboardService: LeaderboardService) { }

    @Get('players')
    async getPlayerLeaderboard() {
        return this.leaderboardService.getPlayerLeaderboard();
    }

    @Get('teams')
    async getTeamLeaderboard() {
        return this.leaderboardService.getTeamLeaderboard();
    }
}
