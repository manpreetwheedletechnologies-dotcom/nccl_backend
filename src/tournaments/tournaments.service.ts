import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tournament, TournamentDocument } from './tournament.schema';

@Injectable()
export class TournamentsService {
    constructor(@InjectModel(Tournament.name) private tournamentModel: Model<TournamentDocument>) { }

    async findAll(): Promise<Tournament[]> {
        return this.tournamentModel.find().exec();
    }

    async create(createTournamentDto: any, userId: string): Promise<Tournament> {
        const createdTournament = new this.tournamentModel({
            ...createTournamentDto,
            created_by: userId,
            code: createTournamentDto.code || `TRN-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
        });
        return createdTournament.save();
    }
}
