import { IBotUnit } from "./IBotUnit";
import { TeamState } from "../Constants";

export interface TacticalSignal {
    sourceUnit: IBotUnit;      // 谁发起的
    triggerName: string;       // 触发技能名 (如 tidehunter_ravage)
    location: Vector;          // 发生地点 (用于接AOE)
    mainTarget?: IBotUnit;     // 主要目标 (用于接单体控制)
    timestamp: number;         // 发生时间
}
export class Blackboard {
    private static instance: Blackboard;

    // 当前活跃的战术信号
    public activeSignal: TacticalSignal | null = null;
    /**
     * 广播战术信号：我开团了！大家跟上！
     */
    public broadcastSignal(signal: TacticalSignal) {
        this.activeSignal = signal;

        // 信号有效期通常很短 (例如 3秒内有效)
        // 实际逻辑中应该有一个清理机制，或者在读取时判断 timestamp
    }

    /**
     * 检查信号是否有效
     */
    public isSignalActive(maxAge: number = 3.0): boolean {
        if (!this.activeSignal) return false;
        return (GameRules.GetGameTime() - this.activeSignal.timestamp) < maxAge;
    }
    public static get Instance() {
        if (!this.instance) this.instance = new Blackboard();
        return this.instance;
    }

    // === 共享战略数据 ===
    public currentTeamState: TeamState = TeamState.FARM;
    public sharedFocusTarget: IBotUnit | null = null; // 指挥官钦定的集火目标
    public teamRallyPoint: Vector | null = null;      // 集合点

    // === 协同机制：控制权锁 (Synergy Locks) ===
    // 记录 [目标Handle -> 晕眩结束时间戳]
    private stunReservations: Map<number, number> = new Map();

    /**
     * 检查是否可以对目标接控制技能
     * @param target 目标
     * @param myCastPoint 我的技能前摇时间
     */
    public canApplyStun(target: IBotUnit, myCastPoint: number): boolean {
        const targetId = target.getHandle();
        const now = GameRules.GetGameTime();

        // 1. 检查是否被队友预定
        if (this.stunReservations.has(targetId)) {
            const reservedUntil = this.stunReservations.get(targetId)!;
            // 如果预定结束时间 > (现在 + 我的施法时间 + 缓冲)，说明还早，不需要接技能
            if (reservedUntil > now + myCastPoint + 0.3) {
                return false;
            }
        }

        // 2. 检查目标当前身上的实际晕眩
        const currentStunRemaining = target.getStunDurationRemaining();
        if (currentStunRemaining > myCastPoint + 0.5) {
            return false; // 还没醒，别急
        }

        return true;
    }

    /**
     * 锁定控制权：我正在施法，队友勿扰
     */
    public claimStun(target: IBotUnit, duration: number) {
        const targetId = target.getHandle();
        // 预定时间 = 当前 + 持续时间 + 缓冲
        this.stunReservations.set(targetId, GameRules.GetGameTime() + duration);
    }
}
