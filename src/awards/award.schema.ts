import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AwardDocument = Award & Document;

@Schema({ timestamps: true })
export class Award {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    description: string;

    @Prop({ required: true })
    icon: string;

    @Prop({ required: true })
    criteria: string;

    @Prop({ default: '#FFD700' })
    color: string;
}

export const AwardSchema = SchemaFactory.createForClass(Award);
