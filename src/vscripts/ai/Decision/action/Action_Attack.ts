import { ActionBase } from "../ActionBase";
import { Blackboard } from "../../core/Blackboard";
import { TeamState } from "../../Constants";
import {IBotUnit} from "../../core/IBotUnit";
import {HeroConfig} from "../../AIConfig";
import {DebugSystem} from "../../DebugSystem";
import {TargetSelector} from "../TargetSelector";

export class Action_Attack extends ActionBase {
    // 内部状态缓存
    private currentTarget: IBotUnit | null = null;

    constructor(owner: IBotUnit, name: string, config: HeroConfig) {
        super(owner, name, config);
    }

    evaluate(): number {
        // 1. 使用高级索敌寻找目标
        this.currentTarget = TargetSelector.getBestTarget(this.owner, this.config.SearchRadius);

        if (!this.currentTarget) {
            this.targetUnit = null;
            return 0;
        }

        this.targetUnit = this.currentTarget; // 用于Debug连线

        // 2. 基础分计算 (结合配置)
        let score = 0.5 * this.config.AggressionFactor;

        // 距离修正
        const dist = this.owner.getRangeTo(this.currentTarget);
        if (dist <= this.owner.getAbilityData("attack")?.range! + 100) {
            score += 0.2; // 在攻击范围内，欲望提升
        }

        return score;
    }

    execute(): void {
        if (!this.currentTarget) return;

        const now = GameRules.GetGameTime();

        // 获取关键时间点
        // 注意：Dota API 的 GetLastAttackTime 返回的是“攻击动作开始的时间”
        const lastAttackTime = this.owner.getLastAttackTime();
        const attackPoint = this.owner.getAttackAnimationPoint();
        const attackRate = this.owner.getSecondsPerAttack(); // 攻击间隔 (如 0.7秒/次)

        // 计算状态
        const timeSinceAttackStart = now - lastAttackTime;
        const damagePoint = lastAttackTime + attackPoint; // 伤害/弹道产生的时间点
        const nextAttackTime = lastAttackTime + attackRate; // 下一次可以出手的最早时间

        // === 阶段 1: 正在前摇中 (Backswing之前的动作) ===
        // 绝对不能动，否则攻击会被取消 (S断)
        if (now < damagePoint) {
            // 确保我们在攻击目标，而不是在发呆
            // 这里我们不发任何指令，让Dota底层的Auto Attack继续，或者显式攻击一次确保没停
            // 只有当刚开始攻击的一瞬间才下令
            if (timeSinceAttackStart > 0.05 && timeSinceAttackStart < 0.1) {
                // 仅仅是Debug用，实际上不要频繁下令，会鬼畜
            }
            // 关键：如果还没开始攻击，或者上一轮攻击结束了，发起攻击
            // 但如果在前摇里，什么都别做，Let it happen.
            return;
        }

        // === 阶段 2: 伤害已打出，处于后摇或CD中 (Orb Walking Phase) ===
        if (now >= damagePoint && now < nextAttackTime) {
            // 此时可以移动了！取消后摇！

            // 移动策略：
            // A. 如果是近战，或者对方跑远了 -> 向对方移动 (追击)
            // B. 如果是远程且对方贴脸 -> 向后移动 (风筝 - 简单的)
            // C. 默认 -> 向目标移动保持距离

            const dist = this.owner.getRangeTo(this.currentTarget);
            const attackRange = this.owner.getAbilityData("attack")?.range || 150;

            let movePos = this.currentTarget.getPosition(); // 默认追击

            // 简单的远程保持距离逻辑 (更复杂的在 Action_Kite 里，这里只做微调)
            if (attackRange > 300 && dist < attackRange * 0.8) {
                // 如果太近，稍微往后点（这里简单用原地代替，避免太复杂）
                // 更好的做法是调用 NavSystem.GetKitePosition
                // movePos = NavSystem.GetKitePosition(this.owner, this.currentTarget, 100);
            }

            // 发送移动指令 (这会取消攻击后摇)
            // 只有在没移动的时候才发，防止每帧覆盖路径
            this.owner.moveTo(movePos);

            // Debug: 显示“走A”
            DebugSystem.DrawThinking(this.owner, "OrbWalk: Move", 0.8, undefined, movePos);
            return;
        }

        // === 阶段 3: CD转好，可以进行下一次攻击 ===
        if (now >= nextAttackTime) {
            // 发起攻击指令
            this.owner.attack(this.currentTarget);
            DebugSystem.DrawThinking(this.owner, "OrbWalk: Fire", 1.0, this.currentTarget);
        }
    }
}
