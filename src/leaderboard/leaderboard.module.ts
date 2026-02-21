import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardService } from './leaderboard.service';
import { PlayerStats, PlayerStatsSchema, TeamStats, TeamStatsSchema } from './leaderboard.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: PlayerStats.name, schema: PlayerStatsSchema },
            { name: TeamStats.name, schema: TeamStatsSchema },
        ]),
    ],
    controllers: [LeaderboardController],
    providers: [LeaderboardService],
})
export class LeaderboardModule { }
