import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true, unique: true })
    phone: string;

    @Prop()
    email: string;

    @Prop()
    password?: string; // Optional for now as we use phone login mostly, but good for RBAC

    @Prop()
    location: string;

    @Prop({ default: false })
    is_premium: boolean;

    @Prop()
    premium_expiry: Date;

    @Prop({ default: 0 })
    progress: number;

    @Prop({ type: [String], default: ['user'] })
    roles: string[];

    // Profile details
    @Prop()
    avatar: string;

    @Prop()
    gender: string;

    @Prop()
    playing_role: string;

    @Prop()
    batting_style: string;

    @Prop()
    bowling_style: string;

    @Prop()
    dob: string;

    // Team specific fields
    @Prop()
    team_name: string;

    @Prop()
    team_short_name: string;

    @Prop()
    team_logo: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
