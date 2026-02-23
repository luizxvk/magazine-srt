import { useAuth } from '../context/AuthContext';

interface Match {
    id: string;
    round: number;
    position: number;
    team1?: { id: string; name: string; seed?: number };
    team2?: { id: string; name: string; seed?: number };
    score1?: number;
    score2?: number;
    winner?: { id: string; name: string };
    status: string;
}

interface BracketViewerProps {
    matches: Match[];
    onReportScore?: (matchId: string) => void;
}

export default function BracketViewer({ matches, onReportScore }: BracketViewerProps) {
    const { user } = useAuth();
    const isMGT = user?.membershipType === 'MGT';

    if (!matches || matches.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                Brackets ainda não foram gerados
            </div>
        );
    }

    // Group matches by round
    const rounds = new Map<number, Match[]>();
    matches.forEach(match => {
        const existing = rounds.get(match.round) || [];
        existing.push(match);
        rounds.set(match.round, existing);
    });

    const totalRounds = Math.max(...Array.from(rounds.keys()));

    const roundLabels = (round: number): string => {
        if (round === totalRounds) return 'Final';
        if (round === totalRounds - 1) return 'Semifinal';
        if (round === totalRounds - 2) return 'Quartas';
        return `Rodada ${round}`;
    };

    return (
        <div className="overflow-x-auto pb-4">
            <div className="flex gap-8 min-w-max px-4">
                {Array.from(rounds.entries())
                    .sort(([a], [b]) => a - b)
                    .map(([round, roundMatches]) => (
                        <div key={round} className="flex flex-col">
                            {/* Round Header */}
                            <div className={`text-center mb-4 px-4 py-1.5 rounded-lg text-sm font-bold ${
                                isMGT ? 'bg-tier-std-500/10 text-tier-std-400' : 'bg-gold-500/10 text-gold-400'
                            }`}>
                                {roundLabels(round)}
                            </div>

                            {/* Matches */}
                            <div
                                className="flex flex-col justify-around flex-1 gap-4"
                                style={{ minHeight: `${roundMatches.length * 120}px` }}
                            >
                                {roundMatches
                                    .sort((a, b) => a.position - b.position)
                                    .map(match => (
                                        <MatchCard
                                            key={match.id}
                                            match={match}
                                            isMGT={isMGT}
                                            isFinal={round === totalRounds}
                                            onReport={onReportScore}
                                        />
                                    ))}
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    );
}

function MatchCard({
    match,
    isMGT,
    isFinal,
    onReport,
}: {
    match: Match;
    isMGT: boolean;
    isFinal: boolean;
    onReport?: (matchId: string) => void;
}) {
    const isCompleted = match.status === 'COMPLETED';
    const isLive = match.status === 'LIVE';
    const canReport = match.team1 && match.team2 && !isCompleted;

    return (
        <div
            className={`w-56 rounded-xl border transition-all ${
                isFinal
                    ? isMGT
                        ? 'border-tier-std-500/30 bg-tier-std-500/5 shadow-lg shadow-tier-std-500/10'
                        : 'border-gold-500/30 bg-gold-500/5 shadow-lg shadow-gold-500/10'
                    : 'border-white/10 bg-white/5'
            } ${isLive ? 'ring-2 ring-red-500/50 animate-pulse' : ''}`}
        >
            {/* Team 1 */}
            <TeamSlot
                team={match.team1}
                score={match.score1}
                isWinner={match.winner?.id === match.team1?.id}
                isCompleted={isCompleted}
                isMGT={isMGT}
                position="top"
            />

            {/* Divider */}
            <div className="border-t border-white/10 mx-3 relative">
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs text-gray-600 bg-[#1a1a1a] px-1.5">
                    vs
                </span>
            </div>

            {/* Team 2 */}
            <TeamSlot
                team={match.team2}
                score={match.score2}
                isWinner={match.winner?.id === match.team2?.id}
                isCompleted={isCompleted}
                isMGT={isMGT}
                position="bottom"
            />

            {/* Report Button */}
            {canReport && onReport && (
                <button
                    onClick={(e) => { e.stopPropagation(); onReport(match.id); }}
                    className={`w-full text-xs py-1.5 rounded-b-xl font-medium transition-colors ${
                        isMGT
                            ? 'bg-tier-std-500/10 text-tier-std-400 hover:bg-tier-std-500/20'
                            : 'bg-gold-500/10 text-gold-400 hover:bg-gold-500/20'
                    }`}
                >
                    Reportar Resultado
                </button>
            )}

            {isLive && (
                <div className="text-center py-1 text-xs font-bold text-red-400 animate-pulse">
                    ● AO VIVO
                </div>
            )}
        </div>
    );
}

function TeamSlot({
    team,
    score,
    isWinner,
    isCompleted,
    isMGT,
    position,
}: {
    team?: { id: string; name: string; seed?: number };
    score?: number;
    isWinner: boolean;
    isCompleted: boolean;
    isMGT: boolean;
    position: 'top' | 'bottom';
}) {
    return (
        <div
            className={`flex items-center justify-between px-3 py-2.5 ${
                position === 'top' ? 'rounded-t-xl' : 'rounded-b-xl'
            } ${
                isWinner && isCompleted
                    ? isMGT
                        ? 'bg-tier-std-500/10'
                        : 'bg-gold-500/10'
                    : ''
            }`}
        >
            <div className="flex items-center gap-2 min-w-0">
                {team?.seed && (
                    <span className="text-xs text-gray-600 font-mono w-4 shrink-0">
                        {team.seed}
                    </span>
                )}
                <span
                    className={`text-sm truncate ${
                        !team
                            ? 'text-gray-600 italic'
                            : isWinner && isCompleted
                                ? isMGT ? 'text-tier-std-400 font-bold' : 'text-gold-400 font-bold'
                                : isCompleted && !isWinner
                                    ? 'text-gray-600 line-through'
                                    : 'text-gray-300'
                    }`}
                >
                    {team?.name || 'A definir'}
                </span>
            </div>

            {score !== null && score !== undefined && (
                <span
                    className={`text-sm font-mono font-bold ml-2 ${
                        isWinner && isCompleted
                            ? isMGT ? 'text-tier-std-400' : 'text-gold-400'
                            : 'text-gray-500'
                    }`}
                >
                    {score}
                </span>
            )}
        </div>
    );
}
