import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FeedPostDocument = FeedPost & Document;

@Schema({ timestamps: true })
export class FeedPost {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    user_id: Types.ObjectId;

    @Prop({ required: true })
    user_name: string;

    @Prop()
    user_avatar: string;

    @Prop({ required: true })
    content: string;

    @Prop({ type: [String], default: [] })
    media_urls: string[];

    @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
    likes: Types.ObjectId[];

    @Prop({
        type: [{
            user_id: { type: Types.ObjectId, ref: 'User' },
            user_name: String,
            text: String,
            createdAt: { type: Date, default: Date.now }
        }],
        default: []
    })
    comments: {
        user_id: Types.ObjectId;
        user_name: string;
        text: string;
        createdAt: Date;
    }[];
}

export const FeedPostSchema = SchemaFactory.createForClass(FeedPost);
