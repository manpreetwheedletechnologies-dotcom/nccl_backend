import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LookingPostDocument = LookingPost & Document;

@Schema({ timestamps: true })
export class LookingPost {
    @Prop({ required: true })
    user_name: string;

    @Prop()
    user_avatar: string;

    @Prop({ required: true })
    role: string; // "Opponent", "Player", "Team"

    @Prop({ required: true })
    description: string;

    @Prop({ required: true })
    location: string;

    @Prop({ required: true })
    date: string;

    @Prop({ default: false })
    is_pro: boolean;

    @Prop()
    time_ago: string;
}

export const LookingPostSchema = SchemaFactory.createForClass(LookingPost);
