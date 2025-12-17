import { ActionBase } from "../ActionBase";
import { Blackboard } from "../../core/Blackboard";
import { TeamState } from "../../Constants";
import {IBotUnit} from "../../core/IBotUnit";
import {HeroConfig} from "../../AIConfig";

export class Action_Attack extends ActionBase {
    constructor(owner: IBotUnit, name: string, config: HeroConfig) {
        super(owner, name, config);
    }

    evaluate(): number {
        // 1. 获取目标
        // 优先攻击指挥官指定的目标
        let target = Blackboard.Instance.sharedFocusTarget;

        // 如果没有指挥官目标，且处于战斗状态，找最近的敌人
        if (!target && Blackboard.Instance.currentTeamState === TeamState.FIGHT) {
            // 这里简化逻辑，实际可以用 SensorSystem.getWeakestEnemy
            // 为了演示，假设 ActionBase 或 Owner 有个方法能获取当前攻击目标
            // 或者暂时返回 0
        }

        if (!target || !target.isValid() || !target.isAlive()) {
            this.targetUnit = null;
            return 0;
        }

        this.targetUnit = target; // 赋值给基类以便 Debug 绘制

        // 2. 基础分计算
        let score = 0.5;

        // 3. 应用性格配置 (关键修改点！)
        // 如果 AggressionFactor 是 1.5 (斯温)，分数会变成 0.75，更容易触发攻击
        // 如果 AggressionFactor 是 0.6 (冰女)，分数会变成 0.3，可能不如"撤退"或"逛街"分数高
        score *= this.config.AggressionFactor;

        // 4. 状态修正
        if (Blackboard.Instance.currentTeamState === TeamState.FIGHT) {
            score += 0.3; // 打团时攻击欲望激增
        } else if (Blackboard.Instance.currentTeamState === TeamState.RETREAT) {
            score = 0; // 撤退时尽量不攻击（除非为了走A）
        }

        // 5. 距离修正 (防止跨越半个地图去追人)
        const dist = this.owner.getRangeTo(target);
        if (dist > this.config.SearchRadius) {
            score *= 0.5; // 太远了，欲望降低
        }

        return Math.min(score, 1.0);
    }

    execute(): void {
        const target = Blackboard.Instance.sharedFocusTarget;
        if (target) {
            // 简单的攻击指令
            // 进阶：可以在这里加入 Orb-Walking (走A) 逻辑
            this.owner.attack(target);
        }
    }
}
