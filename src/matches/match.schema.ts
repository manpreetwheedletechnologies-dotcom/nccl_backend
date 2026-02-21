import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MatchDocument = Match & Document;

@Schema()
class TeamSummary {
    @Prop() id: string;
    @Prop() name: string;
    @Prop() short_name: string;
    @Prop() logo: string;
}

@Schema()
class Score {
    @Prop() runs: number;
    @Prop() wickets: number;
    @Prop() overs: number;
}

@Schema()
class Innings {
    @Prop() team_id: string;
    @Prop({ type: Score }) score: Score;
}

@Schema()
class Commentary {
    @Prop() ball: string;
    @Prop() text: string;
    @Prop() event: string; // e.g., "4", "6", "W", "1", "0"
    @Prop({ default: Date.now }) timestamp: Date;
}

@Schema({ timestamps: true })
export class Match {
    @Prop({ type: TeamSummary, required: true })
    team1: TeamSummary;

    @Prop({ type: TeamSummary, required: true })
    team2: TeamSummary;

    @Prop({ required: true })
    status: string; // "Live", "Completed", "Upcoming"

    @Prop({ required: true })
    venue: string;

    @Prop({ required: true })
    date: Date;

    @Prop({ type: [Innings], default: [] })
    innings: Innings[];

    @Prop({ type: [Commentary], default: [] })
    commentary: Commentary[];

    @Prop()
    result: string;

    @Prop({ default: 'League Match' })
    series_name: string;

    @Prop({ default: false })
    is_premium: boolean;

    @Prop({ default: 11 })
    players_per_side: number;

    @Prop({ default: 'Leather' })
    ball_type: string;

    @Prop()
    round: string; // e.g., "Round 1", "Quarter Final"

    @Prop()
    toss_winner: string; // Team ID or name

    @Prop()
    toss_choice: string; // "Bat" or "Bowl"

    @Prop({ type: String, default: null })
    tournament_id: string;
}

export const MatchSchema = SchemaFactory.createForClass(Match);
