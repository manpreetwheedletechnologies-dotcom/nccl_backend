import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

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
    @Prop({ default: 0 }) runs: number;
    @Prop({ default: 0 }) wickets: number;
    @Prop({ default: 0 }) overs: number;
}

@Schema()
class Innings {
    @Prop() team_id: string;
    @Prop() team_name: string;
    @Prop({ type: Score }) score: Score;
    @Prop({ default: false }) is_complete: boolean;
}

@Schema()
class BatsmanStat {
    @Prop() player_id: string;
    @Prop() name: string;
    @Prop({ default: 0 }) runs: number;
    @Prop({ default: 0 }) balls: number;
    @Prop({ default: 0 }) fours: number;
    @Prop({ default: 0 }) sixes: number;
    @Prop({ default: false }) is_out: boolean;
    @Prop({ default: false }) on_strike: boolean;
    @Prop({ default: '' }) wicket_type: string; // bowled/caught/lbw/run_out/stumped/hit_wicket/retired_hurt
    @Prop({ default: '' }) dismissal_text: string; // e.g. "c Smith b Jones"
    @Prop({ default: '' }) fielder_id: string;
    @Prop({ default: '' }) fielder_name: string;
    @Prop({ default: '' }) bowler_id: string;     // who took the wicket
    @Prop({ default: 1 }) innings_number: number; // 1 or 2
}

@Schema()
class BowlerStat {
    @Prop() player_id: string;
    @Prop() name: string;
    @Prop({ default: 0 }) runs_given: number;
    @Prop({ default: 0 }) balls_bowled: number;
    @Prop({ default: 0 }) wickets: number;
    @Prop({ default: 0 }) wides: number;
    @Prop({ default: 0 }) noballs: number;
    @Prop({ default: false }) current_bowler: boolean;
    @Prop({ default: 1 }) innings_number: number;
}

@Schema()
class OverRecord {
    @Prop() over_number: number;       // 1-based
    @Prop() bowler_id: string;
    @Prop() bowler_name: string;
    @Prop({ default: 0 }) runs: number;
    @Prop({ default: 0 }) wickets: number;
    @Prop({ type: [String], default: [] }) balls: string[]; // ["1","0","4","Wd","W","2"]
    @Prop({ default: 1 }) innings_number: number;
}

@Schema()
class Commentary {
    @Prop() ball: string;
    @Prop() text: string;
    @Prop() event: string; // "4", "6", "W", "1", "0", "WD", "NB", "over_summary", "innings_break", "match_result"
    @Prop() commentator_id: string;
    @Prop({ default: Date.now }) timestamp: Date;
}

@Schema()
class BallRecord {
    @Prop() runs: number;
    @Prop() type: string; // 'run'|'wicket'|'wide'|'noball'|'bye'|'legbye'
    @Prop() overs: number;
    @Prop() commentary: string;
    @Prop() innings_number: number;
    @Prop() batsman_id: string;
    @Prop() bowler_id: string;
    @Prop() wicket_type: string;
}

@Schema()
class FallOfWicket {
    @Prop() wicket_number: number;   // 1st, 2nd, etc.
    @Prop() score: number;           // team score at the time
    @Prop() overs: number;
    @Prop() batsman_name: string;
    @Prop() batsman_id: string;
    @Prop() wicket_type: string;
    @Prop({ default: 1 }) innings_number: number;
}

@Schema()
class ManOfMatch {
    @Prop() player_id: string;
    @Prop() name: string;
    @Prop() reason: string; // "50 runs off 32 balls" or "4 wickets" etc.
    @Prop() team_name: string;
}

@Schema({ timestamps: true })
export class Match {
    @Prop({ type: TeamSummary, required: true })
    team1: TeamSummary;

    @Prop({ type: TeamSummary, required: true })
    team2: TeamSummary;

    @Prop({ required: true })
    status: string; // "Live" | "Completed" | "Upcoming" | "Innings Break"

    @Prop({ required: true })
    venue: string;

    @Prop({ required: true })
    date: Date;

    @Prop({ type: [Innings], default: [] })
    innings: Innings[];

    @Prop({ type: [Commentary], default: [] })
    commentary: Commentary[];

    @Prop({ type: [BallRecord], default: [] })
    ball_history: BallRecord[];

    @Prop({ default: '' })
    result: string;   // "Mumbai Indians won by 5 wickets"

    @Prop({ default: '' })
    result_type: string;  // "runs" | "wickets" | "tie" | "no_result"

    @Prop({ default: 0 })
    target: number;   // runs target for team batting 2nd

    @Prop({ default: 1 })
    innings_number: number;  // current innings: 1 or 2

    @Prop({ default: 'League Match' })
    series_name: string;

    @Prop({ default: false })
    is_premium: boolean;

    @Prop({ default: 20 })
    overs: number;   // max overs per innings

    @Prop({ default: 11 })
    players_per_side: number;

    @Prop({ default: 'Leather' })
    ball_type: string;

    @Prop()
    round: string;

    @Prop()
    toss_winner: string;  // team name

    @Prop()
    toss_winner_id: string; // team id

    @Prop()
    toss_choice: string;  // "bat" | "bowl"

    @Prop({ type: String, default: null })
    tournament_id: string;

    // Role assignments
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
    organizer_id: string;

    @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }], default: [] })
    umpires: string[];

    @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }], default: [] })
    scorers: string[];

    @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }], default: [] })
    commentators: string[];

    // Current ball context (top-level for quick access)
    @Prop({ default: '' }) current_batsman1: string;   // striker name
    @Prop({ default: '' }) current_batsman2: string;   // non-striker name
    @Prop({ default: '' }) current_bowler: string;

    @Prop({ default: '' }) striker_id: string;
    @Prop({ default: '' }) striker_name: string;
    @Prop({ default: '' }) non_striker_id: string;
    @Prop({ default: '' }) non_striker_name: string;
    @Prop({ default: '' }) bowler_id: string;
    @Prop({ default: '' }) last_bowler_id: string;  // to prevent consecutive overs
    @Prop({ default: false }) tournament_points_updated: boolean;

    @Prop({ type: [String], default: [] }) playing_xi_team1: string[];
    @Prop({ type: [String], default: [] }) playing_xi_team2: string[];
    @Prop({ type: [String], default: [] }) batting_order: string[]; // for current batting team

    // Per-player stats
    @Prop({ type: [Object], default: [] })
    batsman_stats: BatsmanStat[];

    @Prop({ type: [Object], default: [] })
    bowler_stats: BowlerStat[];

    @Prop({ type: [Object], default: [] })
    over_history: OverRecord[];

    @Prop({ type: [Object], default: [] })
    fall_of_wickets: FallOfWicket[];

    // Awards
    @Prop({ type: Object, default: null })
    man_of_match: ManOfMatch | null;
}

export const MatchSchema = SchemaFactory.createForClass(Match);
