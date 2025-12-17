import { ActionBase } from "../ActionBase";
import { WorldState } from "../../adapter/WorldState";
import { IBotUnit } from "../../core/IBotUnit";
import {HeroConfig} from "../../AIConfig";
import {DebugSystem} from "../../DebugSystem";

export class Action_SaveAlly extends ActionBase {
    // 支持的救人技能/物品列表
    private saveTools = [
        "item_force_staff",       // 推推棒
        "item_glimmer_cape",      // 微光披风
        "item_mekansm",           // 梅肯
        "item_guardian_greaves",  // 大鞋
        "dazzle_shallow_grave",   // 薄葬
        "oracle_false_promise",   // 虚妄之诺
        "abaddon_aphotic_shield", // 无光之盾
        "omniknight_purification" // 洗礼
    ];
    private cacheTool: string | null = null;
    constructor(owner: IBotUnit, name: string, config: HeroConfig) {
        super(owner, name, config);
    }
    evaluate(): number {
        // 1. 如果我是大哥位（非辅助），降低救人欲望，专心输出
        // 这里通过 Config 控制，辅助的 Config 中 AggressionFactor 通常较低
        if (this.config.AggressionFactor > 1.2) return 0;

        // 2. 寻找急需救援的队友
        const dangerAlly = WorldState.getAllyInDanger(this.owner, 1000);
        if (!dangerAlly) {
            this.targetUnit = null;
            return 0;
        }

        // 3. 检查我有没有能用的救人工具
        let bestTool: string | null = null;

        for (const toolName of this.saveTools) {
            const data = this.owner.getAbilityData(toolName);
            // 检查：技能存在 + CD转好 + 蓝够 + 距离够
            if (data && data.isReady) {
                const dist = this.owner.getRangeTo(dangerAlly);
                if (dist <= data.range + 100) { // +100 缓冲
                    bestTool = toolName;
                    break; // 找到一个就用，这里可以优化为“找最好的”
                }
            }
        }

        if (!bestTool) return 0;

        // 缓存决策结果，供 execute 使用
        this.cacheTool = bestTool;
        this.targetUnit = dangerAlly;

        // 4. 评分：队友越危险，分数越高 (0.8 - 1.0)
        // 这是一个“反射级”动作，分数应该高于普通的 Action_Attack (0.5 - 0.7)
        return 0.9;
    }

    private cache: { spell: string, target: IBotUnit } | null = null;

    execute(): void {
        if (this.cacheTool && this.targetUnit) {
            // 执行施法
            this.owner.castTarget(this.cacheTool, this.targetUnit);

            // 调试信息
            DebugSystem.DrawThinking(
                this.owner,
                `SAVE: ${this.cacheTool}`,
                1.0,
                this.targetUnit
            );
        }
    }
    // 辅助：判断是否在挨打 (需要 Adapter 支持，这里简化为判断周围有没有敌人)
    private isUnderAttack(unit: IBotUnit): boolean {
        return WorldState.GetVisibleEnemies(unit, 400).length > 0;
    }
}
