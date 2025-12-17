import { IBotUnit } from "../core/IBotUnit";
import { ActionBase } from "./ActionBase";
import { AIConfig, HeroConfig } from "../AIConfig";
import { DebugSystem } from "../DebugSystem";

// 引入具体动作
import { Action_Attack } from "./action/Action_Attack";
import { Action_ChainStun } from "./action/Action_ChainStun";
// ... 引入其他动作

export class BotBrain {
    private unit: IBotUnit;
    private actions: ActionBase[] = [];
    private config: HeroConfig; // 当前英雄的性格配置

    // 思考节流
    private thinkInterval = 0.1;
    private lastThinkTime = 0;

    constructor(unit: IBotUnit) {
        this.unit = unit;
        // 加载配置
        this.config = AIConfig.get(unit.getName());
        this.initializeActions();
    }

    private initializeActions() {
        // 传递 config 给动作，让动作根据性格变化
        // 注意：你需要修改 ActionBase 的构造函数来接收 config，或者让 Action 访问 Blackboard/Config
        // 这里为了演示，我们假设 Action 内部会自己去读 Config 或者我们传入参数

        this.actions.push(new Action_Attack(this.unit, "Attack", this.config));

        // 特定英雄动作注册 (简单工厂模式)
        if (this.unit.getName() === "npc_dota_hero_sven") {
            this.actions.push(new Action_ChainStun(this.unit, "sven_storm_bolt", 2.0, this.config));
        }
    }

    public onUpdate() {
        const now = GameRules.GetGameTime();
        if (now - this.lastThinkTime < this.thinkInterval) return;
        this.lastThinkTime = now;

        if (!this.unit.isValid() || !this.unit.isAlive()) return;

        // 持续施法中不打断
        if (this.unit.isChanneling()) {
            DebugSystem.DrawThinking(this.unit, "Channeling...", 1.0);
            return;
        }

        // === 核心评估循环 ===
        let bestAction: ActionBase | null = null;
        let bestScore = -1;

        for (const action of this.actions) {
            // 传入 config 上下文，或者 action 内部已绑定
            const score = action.evaluate();

            if (score > bestScore) {
                bestScore = score;
                bestAction = action;
            }
        }

        // === 执行与调试 ===
        if (bestAction && bestScore > 0.01) {
            bestAction.execute();

            // 获取调试信息 (假设动作类里有 helper 方法获取目标)
            // 这里为了通用，我们假设 ActionBase 有 getDebugInfo() 方法
            // 或者是简单地把目标暴露出来
            const debugTarget = (bestAction as any).targetUnit || null; // 这是一个 hack，建议在 ActionBase 定义 getter
            const debugPos = (bestAction as any).targetLocation || null;

            DebugSystem.DrawThinking(
                this.unit,
                bestAction.name,
                bestScore,
                debugTarget,
                debugPos
            );
        } else {
            this.unit.stop();
            DebugSystem.DrawThinking(this.unit, "Idle", 0);
        }
    }
}
