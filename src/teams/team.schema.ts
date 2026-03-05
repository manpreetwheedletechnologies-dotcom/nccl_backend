import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type TeamDocument = Team & Document;

@Schema({ timestamps: true })
export class Team {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    short_name: string;

    @Prop()
    logo: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
    owner: string;

    @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }] })
    players: string[];

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', default: null })
    captain: string;
}

export const TeamSchema = SchemaFactory.createForClass(Team);
