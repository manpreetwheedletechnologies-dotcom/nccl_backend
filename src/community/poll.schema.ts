import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PollDocument = Poll & Document;

@Schema({ timestamps: true })
export class Poll {
    @Prop({ required: true })
    question: string;

    @Prop({ type: [String], required: true })
    options: string[];

    @Prop({
        type: [{
            user_id: { type: Types.ObjectId, ref: 'User' },
            option_index: Number
        }],
        default: []
    })
    votes: {
        user_id: Types.ObjectId;
        option_index: number;
    }[];

    @Prop({ default: true })
    is_active: boolean;

    @Prop()
    expires_at: Date;
}

export const PollSchema = SchemaFactory.createForClass(Poll);
