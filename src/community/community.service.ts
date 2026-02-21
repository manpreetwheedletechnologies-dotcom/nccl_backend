import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LookingPost, LookingPostDocument } from './looking-post.schema';

@Injectable()
export class CommunityService {
    constructor(@InjectModel(LookingPost.name) private lookingPostModel: Model<LookingPostDocument>) { }

    async findAll(): Promise<LookingPost[]> {
        return this.lookingPostModel.find().sort({ createdAt: -1 }).exec();
    }

    async create(createPostDto: any): Promise<LookingPost> {
        const createdPost = new this.lookingPostModel(createPostDto);
        return createdPost.save();
    }
}
