import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Match, MatchDocument } from './match.schema';
import { Tournament, TournamentDocument } from '../tournaments/tournament.schema';

const VALID_ROLES = ['umpire', 'scorer', 'commentator'] as const;
type MatchRole = typeof VALID_ROLES[number];

const ROLE_FIELD_MAP: Record<MatchRole, string> = {
    umpire: 'umpires',
    scorer: 'scorers',
    commentator: 'commentators',
};

const WICKET_TYPES = ['bowled', 'caught', 'lbw', 'run_out', 'stumped', 'hit_wicket', 'retired_hurt', 'obstructing_field'];

@Injectable()
export class MatchesService {
    constructor(
        @InjectModel(Match.name) private matchModel: Model<MatchDocument>,
        @InjectModel(Tournament.name) private tournamentModel: Model<TournamentDocument>
    ) { }

    async findAll(): Promise<Match[]> {
        return this.matchModel.find().sort({ createdAt: -1 }).exec();
    }

    async findOne(id: string): Promise<Match> {
        const match = await this.matchModel.findById(id).exec();
        if (!match) throw new NotFoundException(`Match with ID ${id} not found`);
        return match;
    }

    async create(createMatchDto: any): Promise<Match> {
        const createdMatch = new this.matchModel(createMatchDto);
        return createdMatch.save();
    }

    async update(id: string, updateMatchDto: any): Promise<Match> {
        const updatedMatch = await this.matchModel
            .findByIdAndUpdate(id, updateMatchDto, { new: true })
            .exec();
        if (!updatedMatch) throw new NotFoundException(`Match with ID ${id} not found`);
        return updatedMatch;
    }

    // ─── ROLE MANAGEMENT ────────────────────────────────────────────────────────
    async assignRole(matchId: string, userId: string, role: MatchRole): Promise<Match> {
        const field = ROLE_FIELD_MAP[role];
        if (!field) throw new Error(`Invalid role: ${role}`);
        const match = await this.matchModel.findByIdAndUpdate(
            matchId,
            { $addToSet: { [field]: userId } },
            { new: true }
        ).exec();
        if (!match) throw new NotFoundException('Match not found');
        return match;
    }

    async removeRole(matchId: string, userId: string, role: MatchRole): Promise<Match> {
        const field = ROLE_FIELD_MAP[role];
        const match = await this.matchModel.findByIdAndUpdate(
            matchId,
            { $pull: { [field]: userId } },
            { new: true }
        ).exec();
        if (!match) throw new NotFoundException('Match not found');
        return match;
    }

    getUserRoleInMatch(match: any, userId: string): MatchRole | 'organizer' | null {
        const uid = userId?.toString();
        if (match.organizer_id?.toString() === uid) return 'organizer';
        if ((match.scorers || []).some((s: any) => s?.toString() === uid)) return 'scorer';
        if ((match.umpires || []).some((u: any) => u?.toString() === uid)) return 'umpire';
        if ((match.commentators || []).some((c: any) => c?.toString() === uid)) return 'commentator';
        return null;
    }

    // ─── BALL-BY-BALL SCORING ────────────────────────────────────────────────────
    async recordBall(matchId: string, scorerId: string, ballData: {
        runs: number;
        type: 'run' | 'wicket' | 'wide' | 'noball' | 'bye' | 'legbye';
        commentary?: string;
        strikerId?: string;
        nonStrikerId?: string;
        strikerName?: string;
        nonStrikerName?: string;
        bowlerId?: string;
        bowlerName?: string;
        // Wicket details
        wicketType?: string; // bowled|caught|lbw|run_out|stumped|hit_wicket|retired_hurt
        fielderId?: string;
        fielderName?: string;
        newBatsmanId?: string;
        newBatsmanName?: string;
    }): Promise<Match> {
        const match = await this.matchModel.findById(matchId).exec();
        if (!match) throw new NotFoundException('Match not found');

        const role = this.getUserRoleInMatch(match, scorerId);
        if (role !== 'scorer' && role !== 'organizer') {
            throw new UnauthorizedException('Only assigned scorers can record balls');
        }

        const m = match as any;
        const inningsNum = m.innings_number || 1;
        const inningsIdx = inningsNum - 1;

        // Ensure the innings array has an entry for this innings
        if (!m.innings[inningsIdx]) {
            const battingTeam = inningsNum === 1
                ? (m.toss_choice?.toLowerCase() === 'bat' ? m.toss_winner_id || m.team1?.id : (m.toss_winner_id === m.team1?.id ? m.team2?.id : m.team1?.id))
                : (inningsNum === 2 ? (m.innings[0]?.team_id === m.team1?.id ? m.team2?.id : m.team1?.id) : m.team1?.id);
            m.innings.push({ team_id: battingTeam, score: { runs: 0, wickets: 0, overs: 0 }, is_complete: false });
        }

        const innings = m.innings[inningsIdx];
        const currentRuns = innings?.score?.runs || 0;
        const currentWickets = innings?.score?.wickets || 0;
        const currentBalls = Math.round(((innings?.score?.overs || 0) % 1) * 10) + Math.floor(innings?.score?.overs || 0) * 6;
        const maxOvers = m.overs || 20;
        const playersPerSide = m.players_per_side || 11;

        const isExtra = ['wide', 'noball'].includes(ballData.type);
        const isDelivery = !isExtra; // counts as a legal delivery
        const newBalls = isExtra ? currentBalls : currentBalls + 1;
        const newRuns = currentRuns + ballData.runs;
        const newWickets = currentWickets + (ballData.type === 'wicket' ? 1 : 0);
        const oversCount = Math.floor(newBalls / 6);
        const ballInOver = newBalls % 6;
        const oversValue = parseFloat(`${oversCount}.${ballInOver}`);
        const ballLabel = `${oversCount}.${ballInOver}`;
        const endOfOver = ballInOver === 0 && isDelivery && newBalls > 0;

        // ── Player IDs & Names ──
        const strikerId = ballData.strikerId || m.striker_id || '';
        const strikerName = ballData.strikerName || m.current_batsman1 || 'Batsman';
        const nonStrikerId = ballData.nonStrikerId || m.non_striker_id || '';
        const nonStrikerName = ballData.nonStrikerName || m.current_batsman2 || '';
        const bowlerId = ballData.bowlerId || m.bowler_id || '';
        const bowlerName = ballData.bowlerName || m.current_bowler || 'Bowler';

        // ── Batsman Stats Update ──
        const batsmanStats: any[] = [...(m.batsman_stats || [])];
        const bowlerStats: any[] = [...(m.bowler_stats || [])];
        const fallOfWickets: any[] = [...(m.fall_of_wickets || [])];

        if (strikerId) {
            const bIdx = batsmanStats.findIndex((b: any) => b.player_id === strikerId && b.innings_number === inningsNum);
            const runsForBatsman = (ballData.type === 'run' || (ballData.type === 'wicket' && !['run_out', 'retired_hurt', 'obstructing_field'].includes(ballData.wicketType || ''))) ? ballData.runs : 0;
            if (bIdx >= 0) {
                const existing = batsmanStats[bIdx];
                batsmanStats[bIdx] = {
                    ...existing,
                    runs: existing.runs + runsForBatsman,
                    balls: existing.balls + (isExtra ? 0 : 1),
                    fours: existing.fours + (ballData.runs === 4 && ballData.type === 'run' ? 1 : 0),
                    sixes: existing.sixes + (ballData.runs === 6 && ballData.type === 'run' ? 1 : 0),
                    is_out: ballData.type === 'wicket' ? true : existing.is_out,
                    on_strike: endOfOver ? (ballData.runs % 2 !== 0) : (ballData.runs % 2 === 0),
                    wicket_type: ballData.type === 'wicket' ? ballData.wicketType || 'out' : existing.wicket_type,
                    fielder_id: ballData.type === 'wicket' ? ballData.fielderId || '' : existing.fielder_id,
                    fielder_name: ballData.type === 'wicket' ? ballData.fielderName || '' : existing.fielder_name,
                    bowler_id: ballData.type === 'wicket' ? bowlerId : existing.bowler_id,
                    dismissal_text: ballData.type === 'wicket' ? this.buildDismissalText(ballData.wicketType || 'out', strikerName, bowlerName, ballData.fielderName) : existing.dismissal_text,
                };
            } else {
                batsmanStats.push({
                    player_id: strikerId,
                    name: strikerName,
                    runs: runsForBatsman,
                    balls: isExtra ? 0 : 1,
                    fours: ballData.runs === 4 && ballData.type === 'run' ? 1 : 0,
                    sixes: ballData.runs === 6 && ballData.type === 'run' ? 1 : 0,
                    is_out: ballData.type === 'wicket',
                    on_strike: endOfOver ? (ballData.runs % 2 !== 0) : (ballData.runs % 2 === 0),
                    wicket_type: ballData.type === 'wicket' ? ballData.wicketType || 'out' : '',
                    fielder_id: ballData.fielderId || '',
                    fielder_name: ballData.fielderName || '',
                    bowler_id: ballData.type === 'wicket' ? bowlerId : '',
                    dismissal_text: ballData.type === 'wicket' ? this.buildDismissalText(ballData.wicketType || 'out', strikerName, bowlerName, ballData.fielderName) : '',
                    innings_number: inningsNum,
                });
            }
        }

        // Ensure non-striker exists in stats (just for tracking)
        if (nonStrikerId) {
            const nsIdx = batsmanStats.findIndex((b: any) => b.player_id === nonStrikerId && b.innings_number === inningsNum);
            if (nsIdx < 0) {
                batsmanStats.push({
                    player_id: nonStrikerId, name: nonStrikerName,
                    runs: 0, balls: 0, fours: 0, sixes: 0,
                    is_out: false, on_strike: false,
                    wicket_type: '', dismissal_text: '', fielder_id: '', fielder_name: '', bowler_id: '',
                    innings_number: inningsNum,
                });
            }
        }

        // ── Fall of Wickets ──
        if (ballData.type === 'wicket') {
            fallOfWickets.push({
                wicket_number: newWickets,
                score: newRuns,
                overs: oversValue,
                batsman_name: strikerName,
                batsman_id: strikerId,
                wicket_type: ballData.wicketType || 'out',
                innings_number: inningsNum,
            });
        }

        // ── Bowler Stats ──
        if (bowlerId) {
            const bwIdx = bowlerStats.findIndex((b: any) => b.player_id === bowlerId && b.innings_number === inningsNum);
            const runsGiven = ['run', 'wide', 'noball'].includes(ballData.type) ? ballData.runs : 0;
            if (bwIdx >= 0) {
                bowlerStats[bwIdx] = {
                    ...bowlerStats[bwIdx],
                    runs_given: bowlerStats[bwIdx].runs_given + runsGiven,
                    balls_bowled: bowlerStats[bwIdx].balls_bowled + (isDelivery ? 1 : 0),
                    wickets: bowlerStats[bwIdx].wickets + (ballData.type === 'wicket' && !['run_out', 'obstructing_field', 'retired_hurt'].includes(ballData.wicketType || '') ? 1 : 0),
                    wides: (bowlerStats[bwIdx].wides || 0) + (ballData.type === 'wide' ? 1 : 0),
                    noballs: (bowlerStats[bwIdx].noballs || 0) + (ballData.type === 'noball' ? 1 : 0),
                    current_bowler: true,
                };
            } else {
                bowlerStats.push({
                    player_id: bowlerId, name: bowlerName,
                    runs_given: runsGiven,
                    balls_bowled: isDelivery ? 1 : 0,
                    wickets: ballData.type === 'wicket' && !['run_out', 'obstructing_field', 'retired_hurt'].includes(ballData.wicketType || '') ? 1 : 0,
                    wides: ballData.type === 'wide' ? 1 : 0,
                    noballs: ballData.type === 'noball' ? 1 : 0,
                    current_bowler: true,
                    innings_number: inningsNum,
                });
            }
            bowlerStats.forEach((b: any) => { b.current_bowler = b.player_id === bowlerId; });
        }

        // ── Over History ──
        const overHistory: any[] = [...(m.over_history || [])];
        const currentOverNumber = oversCount + (endOfOver ? 0 : 1);
        const ballCode = ballData.type === 'wicket' ? 'W' : ballData.type === 'wide' ? 'Wd' : ballData.type === 'noball' ? 'Nb' : ballData.type === 'bye' ? `${ballData.runs}B` : ballData.type === 'legbye' ? `${ballData.runs}Lb` : String(ballData.runs);
        const overRuns = ['run', 'wide', 'noball'].includes(ballData.type) ? ballData.runs : 0;

        const overIdx = overHistory.findIndex((o: any) => o.over_number === currentOverNumber && o.innings_number === inningsNum);
        if (overIdx >= 0) {
            overHistory[overIdx] = {
                ...overHistory[overIdx],
                runs: overHistory[overIdx].runs + overRuns,
                wickets: overHistory[overIdx].wickets + (ballData.type === 'wicket' ? 1 : 0),
                balls: [...overHistory[overIdx].balls, ballCode],
                bowler_id: bowlerId || overHistory[overIdx].bowler_id,
                bowler_name: bowlerName || overHistory[overIdx].bowler_name,
            };
        } else {
            overHistory.push({
                over_number: currentOverNumber, bowler_id: bowlerId, bowler_name: bowlerName,
                runs: overRuns, wickets: ballData.type === 'wicket' ? 1 : 0, balls: [ballCode],
                innings_number: inningsNum,
            });
        }

        // ── Strike Rotation ──
        // Odd runs → swap. End of over → swap. Wicket → new batsman
        let newStrikerId = strikerId;
        let newStrikerName = strikerName;
        let newNonStrikerId = nonStrikerId;
        let newNonStrikerName = nonStrikerName;

        if (ballData.type === 'wicket') {
            // New batsman comes in as striker (or non-striker if run_out of non-striker)
            newStrikerId = ballData.newBatsmanId || '';
            newStrikerName = ballData.newBatsmanName || '';
            // Non-striker stays, but may swap depending on runs
            if (ballData.runs % 2 !== 0) {
                // Odd runs before wicket → non-striker becomes striker
                newStrikerId = nonStrikerId;
                newStrikerName = nonStrikerName;
                newNonStrikerId = ballData.newBatsmanId || '';
                newNonStrikerName = ballData.newBatsmanName || '';
            }
        } else if (endOfOver) {
            // Swap at end of over
            newStrikerId = nonStrikerId;
            newStrikerName = nonStrikerName;
            newNonStrikerId = strikerId;
            newNonStrikerName = strikerName;
        } else if (ballData.runs % 2 !== 0) {
            // Odd runs mid-over → swap
            newStrikerId = nonStrikerId;
            newStrikerName = nonStrikerName;
            newNonStrikerId = strikerId;
            newNonStrikerName = strikerName;
        }

        // ── Commentary ──
        const wicketDismissal = ballData.type === 'wicket' ? this.buildDismissalText(ballData.wicketType || 'out', strikerName, bowlerName, ballData.fielderName) : null;
        const commentaryEntry = {
            ball: ballLabel,
            text: ballData.commentary || this.autoCommentary(ballData.type, ballData.runs, strikerName, bowlerName, ballData.wicketType, ballData.fielderName),
            event: ballData.type === 'wicket' ? 'W' : ballData.type === 'wide' ? 'WD' : ballData.type === 'noball' ? 'NB' : ballData.type === 'bye' ? 'B' : ballData.type === 'legbye' ? 'LB' : ballData.runs.toString(),
            commentator_id: scorerId,
        };

        if (wicketDismissal) commentaryEntry.text = `OUT! ${wicketDismissal}`;

        const commentaryEntries: any[] = [commentaryEntry];
        if (endOfOver) {
            const overRec = overHistory.find((o: any) => o.over_number === currentOverNumber && o.innings_number === inningsNum);
            commentaryEntries.unshift({
                ball: `${currentOverNumber - 1}.6`,
                text: `🔔 End of Over ${currentOverNumber - 1} — ${bowlerName} | ${overRec?.runs || 0} runs, ${overRec?.wickets || 0} wkt(s) | ${(overRec?.balls || []).join(' · ')}`,
                event: 'over_summary', commentator_id: scorerId,
            });
        }

        // ── Check Innings End ──
        const allOutLimit = playersPerSide - 1; // 10 wickets for 11-a-side
        const oversComplete = endOfOver && oversCount >= maxOvers;
        const allOut = newWickets >= allOutLimit;
        const inningsOver = oversComplete || allOut;

        // ── Build Update Object ──
        const updateSet: any = {
            [`innings.${inningsIdx}.score.runs`]: newRuns,
            [`innings.${inningsIdx}.score.wickets`]: newWickets,
            [`innings.${inningsIdx}.score.overs`]: oversValue,
            batsman_stats: batsmanStats,
            bowler_stats: bowlerStats,
            over_history: overHistory,
            fall_of_wickets: fallOfWickets,
            striker_id: newStrikerId,
            striker_name: newStrikerName,
            non_striker_id: newNonStrikerId,
            non_striker_name: newNonStrikerName,
            current_batsman1: newStrikerName,
            current_batsman2: newNonStrikerName,
            current_bowler: endOfOver ? '' : bowlerName, // clear bowler at over end
            bowler_id: endOfOver ? '' : bowlerId,
            last_bowler_id: endOfOver ? bowlerId : m.last_bowler_id,
            status: 'Live',
        };
        if (ballData.strikerName || ballData.strikerId) updateSet.current_batsman1 = newStrikerName;
        if (ballData.bowlerName || ballData.bowlerId) updateSet.current_bowler = endOfOver ? '' : bowlerName;

        if (inningsOver) {
            updateSet[`innings.${inningsIdx}.is_complete`] = true;

            if (inningsNum === 1) {
                // ── INNINGS BREAK ──
                const target = newRuns + 1;
                updateSet.target = target;
                updateSet.innings_number = 2;
                updateSet.status = 'Innings Break';
                updateSet.striker_id = '';
                updateSet.striker_name = '';
                updateSet.non_striker_id = '';
                updateSet.non_striker_name = '';
                updateSet.current_batsman1 = '';
                updateSet.current_batsman2 = '';
                updateSet.current_bowler = '';
                updateSet.bowler_id = '';
                updateSet.last_bowler_id = '';

                const batsTeamName = m.innings[0]?.team_id === m.team1?.id ? m.team1?.name : m.team2?.name;
                const fieldTeamName = m.innings[0]?.team_id === m.team1?.id ? m.team2?.name : m.team1?.name;
                commentaryEntries.unshift({
                    ball: '',
                    text: `🏏 END OF INNINGS 1 — ${batsTeamName} scored ${newRuns}/${newWickets} in ${oversValue} overs. ${fieldTeamName} needs ${target} runs to win!`,
                    event: 'innings_break', commentator_id: scorerId,
                });
            } else {
                // ── MATCH COMPLETE ──
                const { result, result_type } = this.calculateResult(m, newRuns, newWickets, oversValue);
                updateSet.result = result;
                updateSet.result_type = result_type;
                updateSet.status = 'Completed';
                updateSet.innings_number = 2;
                commentaryEntries.unshift({
                    ball: '', text: `🏆 ${result}`, event: 'match_result', commentator_id: scorerId,
                });

                // Auto-update tournament points if applicable
                if (m.tournament_id) {
                    this.updateTournamentPointsAsync(m.tournament_id, result, result_type, m);
                }
            }
        }

        // Also check 2nd innings target achieved mid-over
        if (inningsNum === 2 && !inningsOver && newRuns >= (m.target || Infinity)) {
            updateSet[`innings.${inningsIdx}.is_complete`] = true;
            const { result, result_type } = this.calculateResult(m, newRuns, newWickets, oversValue);
            updateSet.result = result;
            updateSet.result_type = result_type;
            updateSet.status = 'Completed';
            commentaryEntries.unshift({
                ball: '', text: `🏆 ${result}`, event: 'match_result', commentator_id: scorerId,
            });
            if (m.tournament_id) {
                this.updateTournamentPointsAsync(m.tournament_id, result, result_type, m);
            }
        }

        return this.matchModel.findByIdAndUpdate(matchId, {
            $set: updateSet,
            $push: {
                commentary: { $each: commentaryEntries, $position: 0 },
                ball_history: {
                    runs: ballData.runs, type: ballData.type, overs: oversValue,
                    commentary: commentaryEntry.text, innings_number: inningsNum,
                    batsman_id: strikerId, bowler_id: bowlerId,
                    wicket_type: ballData.wicketType || '',
                },
            },
        }, { new: true }).exec();
    }

    // ─── UNDO LAST BALL ─────────────────────────────────────────────────────────
    async undoLastBall(matchId: string, userId: string): Promise<Match> {
        const match = await this.matchModel.findById(matchId).exec();
        if (!match) throw new NotFoundException('Match not found');

        const role = this.getUserRoleInMatch(match, userId);
        if (role !== 'scorer' && role !== 'organizer') {
            throw new UnauthorizedException('Only assigned scorers can undo balls');
        }

        const m = match as any;
        const history = m.ball_history || [];
        if (history.length === 0) throw new Error('No balls to undo');

        const lastBall = history[history.length - 1];
        const inningsNum = lastBall.innings_number || m.innings_number || 1;
        const inningsIdx = inningsNum - 1;
        const innings = m.innings[inningsIdx];

        const currentRuns = innings?.score?.runs || 0;
        const currentWickets = innings?.score?.wickets || 0;
        const currentBalls = Math.round(((innings?.score?.overs || 0) % 1) * 10) + Math.floor(innings?.score?.overs || 0) * 6;

        const isExtra = ['wide', 'noball'].includes(lastBall.type);
        const prevBalls = isExtra ? currentBalls : currentBalls - 1;
        const prevRuns = currentRuns - lastBall.runs;
        const prevWickets = currentWickets - (lastBall.type === 'wicket' ? 1 : 0);
        const oversCount = Math.floor(prevBalls / 6);
        const ballInOver = prevBalls % 6;
        const oversValue = parseFloat(`${oversCount}.${ballInOver}`);

        // Remove last fall of wicket if wicket
        const fallOfWickets = [...(m.fall_of_wickets || [])];
        if (lastBall.type === 'wicket') fallOfWickets.pop();

        const updated = await this.matchModel.findByIdAndUpdate(matchId, {
            $set: {
                [`innings.${inningsIdx}.score.runs`]: prevRuns,
                [`innings.${inningsIdx}.score.wickets`]: prevWickets,
                [`innings.${inningsIdx}.score.overs`]: oversValue,
                fall_of_wickets: fallOfWickets,
            },
            $pop: { ball_history: 1, commentary: -1 },
        }, { new: true }).exec();

        return updated;
    }

    // ─── RETROACTIVE SCORE EDIT ─────────────────────────────────────────────────
    async editBallScore(matchId: string, userId: string, ballIndex: number, newRuns: number): Promise<Match> {
        const match = await this.matchModel.findById(matchId).exec();
        if (!match) throw new NotFoundException('Match not found');

        const role = this.getUserRoleInMatch(match, userId);
        if (role !== 'scorer' && role !== 'organizer') {
            throw new UnauthorizedException('Only assigned scorers can edit scores');
        }

        const m = match as any;
        const ballHistory = [...(m.ball_history || [])];
        if (ballIndex < 0 || ballIndex >= ballHistory.length) throw new Error('Invalid ball index');

        const oldRuns = ballHistory[ballIndex].runs;
        const diff = newRuns - oldRuns;
        ballHistory[ballIndex] = { ...ballHistory[ballIndex], runs: newRuns };

        // Recalculate innings score from scratch to ensure consistency
        let total1Runs = 0, total1Wickets = 0, total1Balls = 0;
        let total2Runs = 0, total2Wickets = 0, total2Balls = 0;
        for (const ball of ballHistory) {
            const isEx = ['wide', 'noball'].includes(ball.type);
            if (ball.innings_number === 1 || !ball.innings_number) {
                total1Runs += ball.runs;
                total1Wickets += ball.type === 'wicket' ? 1 : 0;
                if (!isEx) total1Balls++;
            } else {
                total2Runs += ball.runs;
                total2Wickets += ball.type === 'wicket' ? 1 : 0;
                if (!isEx) total2Balls++;
            }
        }

        const overs1 = parseFloat(`${Math.floor(total1Balls / 6)}.${total1Balls % 6}`);
        const overs2 = parseFloat(`${Math.floor(total2Balls / 6)}.${total2Balls % 6}`);

        return this.matchModel.findByIdAndUpdate(matchId, {
            $set: {
                ball_history: ballHistory,
                'innings.0.score.runs': total1Runs,
                'innings.0.score.wickets': total1Wickets,
                'innings.0.score.overs': overs1,
                ...(m.innings.length > 1 ? {
                    'innings.1.score.runs': total2Runs,
                    'innings.1.score.wickets': total2Wickets,
                    'innings.1.score.overs': overs2,
                } : {}),
            },
        }, { new: true }).exec();
    }

    // ─── MAN OF THE MATCH ───────────────────────────────────────────────────────
    async setManOfMatch(matchId: string, userId: string, data: { player_id: string; name: string; reason: string; team_name: string }): Promise<Match> {
        const match = await this.matchModel.findById(matchId).exec();
        if (!match) throw new NotFoundException('Match not found');

        const role = this.getUserRoleInMatch(match, userId);
        if (role !== 'scorer' && role !== 'organizer') {
            throw new UnauthorizedException('Only organizer or scorer can set Man of the Match');
        }

        return this.matchModel.findByIdAndUpdate(matchId, {
            $set: { man_of_match: data },
        }, { new: true }).exec();
    }

    // ─── COMMENTARY ─────────────────────────────────────────────────────────────
    async addCommentary(matchId: string, userId: string, text: string, ball?: string, event?: string): Promise<Match> {
        const match = await this.matchModel.findById(matchId).exec();
        if (!match) throw new NotFoundException('Match not found');
        const role = this.getUserRoleInMatch(match, userId);
        if (!role) throw new UnauthorizedException('You are not assigned to this match');

        return this.matchModel.findByIdAndUpdate(matchId, {
            $push: { commentary: { $each: [{ ball: ball || '', text, event: event || 'commentary', commentator_id: userId }], $position: 0 } },
        }, { new: true }).exec();
    }

    // ─── HELPERS ─────────────────────────────────────────────────────────────────
    private buildDismissalText(wicketType: string, batsmanName: string, bowlerName: string, fielderName?: string): string {
        switch (wicketType) {
            case 'bowled': return `${batsmanName} b ${bowlerName}`;
            case 'caught': return `${batsmanName} c ${fielderName || '?'} b ${bowlerName}`;
            case 'lbw': return `${batsmanName} lbw b ${bowlerName}`;
            case 'run_out': return `${batsmanName} run out (${fielderName || '?'})`;
            case 'stumped': return `${batsmanName} st ${fielderName || 'WK'} b ${bowlerName}`;
            case 'hit_wicket': return `${batsmanName} hit wicket b ${bowlerName}`;
            case 'retired_hurt': return `${batsmanName} retired hurt`;
            case 'obstructing_field': return `${batsmanName} obstructing the field`;
            default: return `${batsmanName} out`;
        }
    }

    private calculateResult(match: any, inns2Runs: number, inns2Wickets: number, overs: number): { result: string; result_type: string } {
        const inns1Score = match.innings[0]?.score?.runs || 0;
        const target = match.target || inns1Score + 1;
        const team1Name = match.innings[0]?.team_id === match.team1?.id ? match.team1?.name : match.team2?.name;
        const team2Name = match.innings[0]?.team_id === match.team1?.id ? match.team2?.name : match.team1?.name;

        if (inns2Runs >= target) {
            // Team 2 won by wickets
            const wicketsRemaining = (match.players_per_side - 1) - inns2Wickets;
            return {
                result: `${team2Name} won by ${wicketsRemaining} wicket${wicketsRemaining !== 1 ? 's' : ''}`,
                result_type: 'wickets',
            };
        } else if (inns2Runs < inns1Score) {
            // Team 1 won by runs
            const runMargin = inns1Score - inns2Runs;
            return {
                result: `${team1Name} won by ${runMargin} run${runMargin !== 1 ? 's' : ''}`,
                result_type: 'runs',
            };
        } else {
            return { result: 'Match Tied', result_type: 'tie' };
        }
    }

    private autoCommentary(type: string, runs: number, playerName?: string, bowlerName?: string, wicketType?: string, fielderName?: string): string {
        const name = playerName || 'Batsman';
        const bowler = bowlerName || 'Bowler';
        if (type === 'wicket') {
            if (wicketType === 'bowled') return `BOWLED! What a delivery from ${bowler}! ${name} is clean bowled!`;
            if (wicketType === 'caught') return `CAUGHT! ${fielderName ? fielderName + ' takes' : 'Caught'} a brilliant catch off ${bowler}!`;
            if (wicketType === 'lbw') return `LBW! Plumb in front! ${name} is gone LBW to ${bowler}!`;
            if (wicketType === 'run_out') return `RUN OUT! ${name} is run out${fielderName ? ' by ' + fielderName : ''}! Superb fielding!`;
            if (wicketType === 'stumped') return `STUMPED! ${name} is stumped${fielderName ? ' by ' + fielderName : ''} off ${bowler}!`;
            if (wicketType === 'hit_wicket') return `HIT WICKET! ${name} accidentally dislodges the bails!`;
            return 'OUT! Wicket falls!';
        }
        if (type === 'wide') return 'Wide ball! Extra delivery to come.';
        if (type === 'noball') return `No ball! Free hit next delivery!`;
        if (type === 'bye') return `${runs} bye${runs > 1 ? 's' : ''}.`;
        if (type === 'legbye') return `${runs} leg bye${runs > 1 ? 's' : ''}.`;
        if (runs === 0) return `Dot ball! ${bowler} beats ${name}.`;
        if (runs === 1) return `Single taken by ${name}.`;
        if (runs === 2) return `Two runs! Good running between the wickets.`;
        if (runs === 3) return `Three runs! Superb running!`;
        if (runs === 4) return `FOUR! Cracking shot by ${name}! Ball races to the boundary!`;
        if (runs === 6) return `SIX! MAXIMUM! ${name} sends it into the stands!`;
        return `${runs} runs.`;
    }

    private async updateTournamentPointsAsync(tournamentId: string, result: string, resultType: string, match: any): Promise<void> {
        try {
            const tournament = await this.tournamentModel.findById(tournamentId).exec();
            if (!tournament) return;

            const table = [...((tournament as any).points_table || [])];
            const team1Id = (match.team1?.id || match.team1?._id || '').toString();
            const team2Id = (match.team2?.id || match.team2?._id || '').toString();
            const team1Name = match.team1?.name;
            const team2Name = match.team2?.name;

            const updateTeamEntry = (teamId: string, teamName: string, outcome: 'win' | 'loss' | 'tie') => {
                let entry = table.find(e => e.team_id.toString() === teamId);
                if (!entry) {
                    entry = { team_id: teamId, team_name: teamName, played: 0, won: 0, lost: 0, tied: 0, points: 0, nrr: 0 };
                    table.push(entry);
                }
                entry.played += 1;
                if (outcome === 'win') { entry.won += 1; entry.points += 2; }
                else if (outcome === 'loss') { entry.lost += 1; }
                else if (outcome === 'tie') { entry.tied += 1; entry.points += 1; }
            };

            if (result.includes('won by')) {
                const winnerName = result.split(' won by')[0];
                if (winnerName === team1Name) {
                    updateTeamEntry(team1Id, team1Name, 'win');
                    updateTeamEntry(team2Id, team2Name, 'loss');
                } else if (winnerName === team2Name) {
                    updateTeamEntry(team2Id, team2Name, 'win');
                    updateTeamEntry(team1Id, team1Name, 'loss');
                }
            } else if (result.toLowerCase().includes('tie')) {
                updateTeamEntry(team1Id, team1Name, 'tie');
                updateTeamEntry(team2Id, team2Name, 'tie');
            }

            await this.tournamentModel.findByIdAndUpdate(tournamentId, {
                $set: { points_table: table }
            }).exec();

            await this.matchModel.findByIdAndUpdate(match._id, {
                $set: { 'tournament_points_updated': true }
            }).exec();
        } catch (e) {
            console.error('Failed to update tournament points:', e);
        }
    }
}
