import { ActionBase } from "../ActionBase";
import { Blackboard } from "../../core/Blackboard";
import { NavSystem } from "../../adapter/NavSystem";
import { WorldState } from "../../adapter/WorldState";

export class Action_Kite extends ActionBase {
    evaluate(): number {
        const target = Blackboard.Instance.sharedFocusTarget;
        if (!target || !target.isValid() || !target.isAlive()) return 0;

        const dist = this.owner.getRangeTo(target);
        const attackRange = this.owner.getAttackRange();

        // 1. 如果我是近战，不需要风筝（或者用不同的逻辑），返回0
        if (attackRange < 300) return 0;

        // 2. 如果距离过远，应该去追击而不是风筝
        if (dist > attackRange + 200) return 0;

        // 3. 核心逻辑：如果在攻击冷却中，且敌人在附近 -> 走位！
        if (!this.owner.isAttackReady()) {
            return 0.7; // 高优先级：走位取消后摇/保持距离
        }

        // 4. 如果攻击就绪，且在射程内 -> 应该让 Action_Attack 接管
        // 但如果敌人在贴脸，我们可能仍想后撤一下
        if (dist < attackRange * 0.5) {
            return 0.65; // 拉开距离
        }

        return 0;
    }

    execute(): void {
        const target = Blackboard.Instance.sharedFocusTarget;
        if (!target) return;

        // 如果攻击准备好了，且距离合适，优先尝试攻击（虽然通常 Action_Attack 会做这个）
        // 但在 Kite 状态下，如果被迫太近，优先拉开

        // 计算风筝点：向后撤 300 码
        const kitePos = NavSystem.GetKitePosition(this.owner, target, 300);

        // 移动
        this.owner.moveTo(kitePos);

        // Debug
        // DebugDrawLine(this.owner.getPosition(), kitePos, 255, 0, 0, true, 0.1);
    }
}
