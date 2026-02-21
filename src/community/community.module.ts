import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';
import { LookingPost, LookingPostSchema } from './looking-post.schema';

@Module({
    imports: [MongooseModule.forFeature([{ name: LookingPost.name, schema: LookingPostSchema }])],
    controllers: [CommunityController],
    providers: [CommunityService],
})
export class CommunityModule { }
