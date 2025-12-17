import { ActionBase } from "../ActionBase";
import { Blackboard } from "../../core/Blackboard";
import { NavSystem } from "../../adapter/NavSystem";
import { WorldState } from "../../adapter/WorldState";
import { MathUtils } from "../../core/MathUtils";

export class Action_Positioning extends ActionBase {
    evaluate(): number {
        // 只有在战斗状态且没有处于高优先级动作（如连招中）时才调整站位
        // 这里作为一个较低优先级的 "Idle" 替代品
        if (Blackboard.Instance.currentTeamState !== 3) return 0; // 不是 FIGHT 状态

        // 如果正在攻击或施法，站位优先级低
        if (this.owner.isAttackReady()) return 0.1;

        // 作为一个远程/脆皮，如果你不知道干什么，就调整站位
        if (this.owner.getHealthPercent() < 0.5) return 0.4; // 残血时站位很重要

        return 0.3; // 默认调整分数
    }

    execute(): void {
        // 1. 获取所有友军和敌人的中心点
        const allies = WorldState.GetAllies(this.owner, 2000);
        const enemies = WorldState.GetVisibleEnemies(this.owner, 2000);

        if (enemies.length === 0) return;

        let allyCenter = Vector(0,0,0);
        allies.forEach(a => allyCenter = (allyCenter + a.getPosition()) as Vector);
        allyCenter = (allyCenter / allies.length) as Vector;

        let enemyCenter = Vector(0,0,0);
        enemies.forEach(e => enemyCenter = (enemyCenter + e.getPosition()) as Vector);
        enemyCenter = (enemyCenter / enemies.length) as Vector;

        // 2. 判断我是什么职业 (简易版：攻击距离 > 400 算后排)
        const isRanged = this.owner.getAttackRange() > 400;

        let targetPos: Vector;

        if (isRanged) {
            // 后排逻辑：站在友军中心身后 600 码
            targetPos = NavSystem.GetBacklinePosition(allyCenter, enemyCenter, 600);
        } else {
            // 前排逻辑：站在友军和敌人之间
            const dir = ((enemyCenter - allyCenter) as Vector).Normalized();
            targetPos = (allyCenter + dir * 300) as Vector;
        }

        this.owner.moveTo(targetPos);
    }
}
