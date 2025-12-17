import { IBotUnit } from "./IBotUnit";
import { TeamState } from "../Constants";

export class Blackboard {
    private static instance: Blackboard;
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
