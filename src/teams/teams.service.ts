import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Team, TeamDocument } from './team.schema';

@Injectable()
export class TeamsService {
    constructor(@InjectModel(Team.name) private teamModel: Model<TeamDocument>) { }

    async findAll(): Promise<Team[]> {
        return this.teamModel.find().exec();
    }

    async create(createTeamDto: any): Promise<Team> {
        const createdTeam = new this.teamModel(createTeamDto);
        return createdTeam.save();
    }
}
