import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

import { MatchesModule } from './matches/matches.module';
import { TeamsModule } from './teams/teams.module';
import { NewsModule } from './news/news.module';
import { StoreModule } from './store/store.module';
import { CommunityModule } from './community/community.module';
import { BannersModule } from './banners/banners.module';
import { TournamentsModule } from './tournaments/tournaments.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { AwardsModule } from './awards/awards.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { StreamingModule } from './streaming/streaming.module';
import { PlayersModule } from './players/players.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                uri: configService.get<string>('MONGO_URL'),
            }),
            inject: [ConfigService],
        }),
        AuthModule,
        UsersModule,
        MatchesModule,
        TeamsModule,
        NewsModule,
        StoreModule,
        CommunityModule,
        BannersModule,
        TournamentsModule,
        LeaderboardModule,
        AwardsModule,
        NotificationsModule,
        SubscriptionModule,
        StreamingModule,
        PlayersModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule { }
