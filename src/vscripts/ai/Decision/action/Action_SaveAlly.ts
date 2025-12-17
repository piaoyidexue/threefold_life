import { ActionBase } from "../ActionBase";
import { WorldState } from "../../adapter/WorldState";
import { IBotUnit } from "../../core/IBotUnit";

export class Action_SaveAlly extends ActionBase {
    // 支持的救人技能/物品列表
    private saveAbilities = [
        "item_force_staff",
        "item_glimmer_cape",
        "dazzle_shallow_grave",
        "oracle_false_promise"
    ];

    evaluate(): number {
        // 1. 扫描周围残血友军
        const allies = WorldState.GetAllies(this.owner, 1000);
        let targetToSave: IBotUnit | null = null;

        for (const ally of allies) {
            // 不救自己 (或者用另一套逻辑救自己)
            if (ally.getHandle() === this.owner.getHandle()) continue;

            // 只有血量极低且正在挨打/被控的才救
            if (ally.getHealthPercent() < 0.25 && (ally.isStunned() || this.isUnderAttack(ally))) {
                targetToSave = ally;
                break;
            }
        }

        if (!targetToSave) return 0;

        // 2. 检查我有没有救人技能
        for (const spellName of this.saveAbilities) {
            const ability = this.owner.getAbilityData(spellName);
            if (ability && ability.isReady && this.owner.getRangeTo(targetToSave) <= ability.range) {
                // 找到可用技能，保存状态以便 Execute 使用
                this.cache = { spell: spellName, target: targetToSave };
                return 0.9; // 极高优先级！
            }
        }

        return 0;
    }

    private cache: { spell: string, target: IBotUnit } | null = null;

    execute(): void {
        if (this.cache) {
            this.owner.castTarget(this.cache.spell, this.cache.target);
            // 喊话
            // DebugDrawText(this.owner.getPosition(), "SAVING!!!", true, 1.0);
            this.cache = null;
        }
    }

    // 辅助：判断是否在挨打 (需要 Adapter 支持，这里简化为判断周围有没有敌人)
    private isUnderAttack(unit: IBotUnit): boolean {
        return WorldState.GetVisibleEnemies(unit, 400).length > 0;
    }
}
