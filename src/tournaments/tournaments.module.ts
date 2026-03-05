import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TournamentsController } from './tournaments.controller';
import { TournamentsService } from './tournaments.service';
import { Tournament, TournamentSchema } from './tournament.schema';
import { TeamsModule } from '../teams/teams.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Tournament.name, schema: TournamentSchema }]),
        TeamsModule
    ],
    controllers: [TournamentsController],
    providers: [TournamentsService],
})
export class TournamentsModule { }
