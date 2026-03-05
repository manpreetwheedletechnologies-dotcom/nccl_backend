import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LookingPost, LookingPostDocument } from './looking-post.schema';
import { FeedPost, FeedPostDocument } from './feed-post.schema';
import { Poll, PollDocument } from './poll.schema';
import { NetworkItem, NetworkItemDocument } from './network-item.schema';
import { UsersService } from '../users/users.service';

@Injectable()
export class CommunityService {
    constructor(
        @InjectModel(LookingPost.name) private lookingPostModel: Model<LookingPostDocument>,
        @InjectModel(FeedPost.name) private feedPostModel: Model<FeedPostDocument>,
        @InjectModel(Poll.name) private pollModel: Model<PollDocument>,
        @InjectModel(NetworkItem.name) private networkItemModel: Model<NetworkItemDocument>,
        private usersService: UsersService,
    ) { }

    async findAllLooking(): Promise<LookingPost[]> {
        return this.lookingPostModel.find().sort({ createdAt: -1 }).exec();
    }

    async findAllFeed(): Promise<FeedPost[]> {
        return this.feedPostModel.find().sort({ createdAt: -1 }).exec();
    }

    async createFeedPost(createPostDto: any): Promise<FeedPost> {
        const createdPost = new this.feedPostModel(createPostDto);
        return createdPost.save();
    }

    async findAllPolls(): Promise<Poll[]> {
        return this.pollModel.find().sort({ createdAt: -1 }).exec();
    }

    async createPoll(createPollDto: any): Promise<Poll> {
        const createdPoll = new this.pollModel(createPollDto);
        return createdPoll.save();
    }

    async findByCategory(category: string): Promise<NetworkItem[]> {
        return this.networkItemModel.find({ category }).sort({ rating: -1 }).exec();
    }

    async createNetworkItem(createItemDto: any): Promise<NetworkItem> {
        const createdItem = new this.networkItemModel(createItemDto);
        const item = await createdItem.save();

        // Add role to user based on category
        if (createItemDto.user_id) {
            const category = createItemDto.category;
            let role = '';

            if (category === 'Umpires') role = 'umpire';
            else if (category === 'Scorers') role = 'scorer';
            else if (category === 'Commentators') role = 'commentator';
            else if (category === 'Streamers') role = 'streamer';
            else if (category === 'Physio & Fitness') role = 'physio';
            else if (category === 'Personal Coaching') role = 'coach';
            else if (category === 'Organisers') role = 'organiser';
            else if (category === 'Associations') role = 'association';
            else if (category === 'Players') role = 'player';
            else if (category === 'Teams') role = 'team';

            if (role) {
                await this.usersService.addRole(createItemDto.user_id, role);
            }
        }

        return item;
    }

    async create(createPostDto: any): Promise<LookingPost> {
        const createdPost = new this.lookingPostModel(createPostDto);
        return createdPost.save();
    }
}
