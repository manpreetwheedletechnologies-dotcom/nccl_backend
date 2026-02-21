import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PlayerStats, PlayerStatsDocument, TeamStats, TeamStatsDocument } from './leaderboard.schema';

@Injectable()
export class LeaderboardService {
    constructor(
        @InjectModel(PlayerStats.name) private playerStatsModel: Model<PlayerStatsDocument>,
        @InjectModel(TeamStats.name) private teamStatsModel: Model<TeamStatsDocument>,
    ) { }

    async getPlayerLeaderboard(): Promise<PlayerStats[]> {
        return this.playerStatsModel.find().sort({ runs: -1 }).limit(50).exec();
    }

    async getTeamLeaderboard(): Promise<TeamStats[]> {
        return this.teamStatsModel.find().sort({ points: -1 }).limit(50).exec();
    }
}
