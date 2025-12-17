import { ActionBase } from "../ActionBase";
import { Blackboard } from "../../core/Blackboard";
import {IBotUnit} from "../../core/IBotUnit";
import {HeroConfig} from "../../AIConfig";

export class Action_ChainStun extends ActionBase {
    private abilityName: string;
    private stunDuration: number;

    constructor(owner: IBotUnit, abilityName: string, duration: number,config: HeroConfig) {
        super(owner, `ChainStun_${abilityName}`, config);
        this.abilityName = abilityName;
        this.stunDuration = duration;
    }

    evaluate(): number {
        // 1. 技能检查
        const ability = this.owner.getAbilityData(this.abilityName);
        if (!ability || !ability.isReady) return 0;

        // 2. 目标检查
        const target = Blackboard.Instance.sharedFocusTarget;
        if (!target || !target.isValid() || !target.isAlive()) return 0;

        // 3. 距离检查
        if (this.owner.getRangeTo(target) > ability.range + 150) return 0;

        // 4. *** 配合检查 (The Synergy) ***
        // 只有当符合“完美接控”条件时，才给高分
        if (Blackboard.Instance.canApplyStun(target, ability.castPoint)) {
            // 如果目标是敌人大哥，分数更高
            // 这里为了简单，直接返回高分
            return 0.95;
        }
        // 也可以应用配置，例如：保守型AI只在非常有把握时才交控制
        // if (this.config.AggressionFactor < 0.8 && dist > 400) return 0;

        return 0;
    }

    execute(): void {
        const target = Blackboard.Instance.sharedFocusTarget;
        if (target) {
            // 1. 施法
            this.owner.castTarget(this.abilityName, target);
            // 2. 锁定控制权，告诉队友“我接了，你们别动”
            Blackboard.Instance.claimStun(target, this.stunDuration);
        }
    }
}
