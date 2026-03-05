import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';
import { LookingPost, LookingPostSchema } from './looking-post.schema';
import { FeedPost, FeedPostSchema } from './feed-post.schema';
import { Poll, PollSchema } from './poll.schema';
import { NetworkItem, NetworkItemSchema } from './network-item.schema';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: LookingPost.name, schema: LookingPostSchema },
            { name: FeedPost.name, schema: FeedPostSchema },
            { name: Poll.name, schema: PollSchema },
            { name: NetworkItem.name, schema: NetworkItemSchema },
        ]),
        UsersModule
    ],
    controllers: [CommunityController],
    providers: [CommunityService],
})
export class CommunityModule { }
