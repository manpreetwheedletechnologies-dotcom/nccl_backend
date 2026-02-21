import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TournamentsController } from './tournaments.controller';
import { TournamentsService } from './tournaments.service';
import { Tournament, TournamentSchema } from './tournament.schema';

@Module({
    imports: [MongooseModule.forFeature([{ name: Tournament.name, schema: TournamentSchema }])],
    controllers: [TournamentsController],
    providers: [TournamentsService],
})
export class TournamentsModule { }
