import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type StreamDocument = Stream & Document;

@Schema({ timestamps: true })
export class Stream {
    @Prop({ required: true })
    match_id: string;

    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    url: string;

    @Prop({ default: 'custom' })
    platform: string; // 'custom', 'youtube'

    @Prop({ default: true })
    is_live: boolean;
}

export const StreamSchema = SchemaFactory.createForClass(Stream);
