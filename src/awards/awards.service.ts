import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Award, AwardDocument } from './award.schema';

@Injectable()
export class AwardsService {
    constructor(@InjectModel(Award.name) private awardModel: Model<AwardDocument>) { }

    async findAll(): Promise<Award[]> {
        return this.awardModel.find().exec();
    }
}
