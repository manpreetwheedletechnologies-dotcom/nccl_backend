import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type TeamRequestDocument = TeamRequest & Document;

@Schema({ timestamps: true })
export class TeamRequest {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Team', required: true })
    team_id: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    user_id: string;

    @Prop({ required: true, enum: ['JOIN', 'ADD'] })
    type: string;

    @Prop({ default: 'PENDING', enum: ['PENDING', 'ACCEPTED', 'REJECTED'] })
    status: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    sender_id: string;
}

export const TeamRequestSchema = SchemaFactory.createForClass(TeamRequest);
