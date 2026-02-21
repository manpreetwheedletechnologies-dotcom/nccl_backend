import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Stream, StreamDocument } from './stream.schema';

@Injectable()
export class StreamingService {
    constructor(@InjectModel(Stream.name) private streamModel: Model<StreamDocument>) { }

    async findAllActive(): Promise<Stream[]> {
        return this.streamModel.find({ is_live: true }).exec();
    }

    async create(streamDto: any): Promise<Stream> {
        const createdStream = new this.streamModel(streamDto);
        return createdStream.save();
    }
}
