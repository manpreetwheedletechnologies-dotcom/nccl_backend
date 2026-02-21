import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Match, MatchDocument } from './match.schema';

@Injectable()
export class MatchesService {
    constructor(
        @InjectModel(Match.name) private matchModel: Model<MatchDocument>
    ) { }

    async findAll(): Promise<Match[]> {
        return this.matchModel.find().exec();
    }

    async findOne(id: string): Promise<Match> {
        const match = await this.matchModel.findById(id).exec();
        if (!match) {
            throw new NotFoundException(`Match with ID ${id} not found`);
        }
        return match;
    }

    async update(id: string, updateMatchDto: any): Promise<Match> {
        const updatedMatch = await this.matchModel
            .findByIdAndUpdate(id, updateMatchDto, { new: true })
            .exec();
        if (!updatedMatch) {
            throw new NotFoundException(`Match with ID ${id} not found`);
        }
        return updatedMatch;
    }

    async create(createMatchDto: any): Promise<Match> {
        const createdMatch = new this.matchModel(createMatchDto);
        return createdMatch.save();
    }
}
