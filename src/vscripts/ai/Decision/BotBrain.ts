import { IBotUnit } from "../core/IBotUnit";
import { ActionBase } from "./ActionBase";
import { AIConfig, HeroConfig } from "../AIConfig";
import { DebugSystem } from "../DebugSystem";

// 引入具体动作
import { Action_Attack } from "./action/Action_Attack";
import { Action_ChainStun } from "./action/Action_ChainStun";
import {Action_SaveAlly} from "./action/Action_SaveAlly";
import {Action_Initiate} from "./action/Action_Initiate";
import {Action_SynergyFollowUp} from "./action/Action_SynergyFollowUp";
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

        // [新增] 连招跟进系统 (所有人都有)
        // 这是一个低开销的检查，因为 Evaluate 里第一步就是 check blackboard
        this.actions.push(new Action_SynergyFollowUp(this.unit, "Synergy", this.config));

        // 特定英雄动作注册 (简单工厂模式)
        if (this.unit.getName() === "npc_dota_hero_sven") {
            this.actions.push(new Action_ChainStun(this.unit, "sven_storm_bolt", 2.0, this.config));
        }
        // === 1. 全员通用能力 ===
        // 每个人都会平A，都会风筝，都会吃树（未来实现）
        this.actions.push(new Action_Attack(this.unit, "Attack", this.config));
        // this.actions.push(new Action_Kite(...));

        const heroName = this.unit.getName();

        // === 2. 辅助特有能力 (Support) ===
        // 戴泽、神谕、或者是出了梅肯的任何人
        // 这里简单通过名字判断，实际可以判断 Inventory 是否有梅肯
        if (["npc_dota_hero_dazzle", "npc_dota_hero_oracle", "npc_dota_hero_omniknight"].includes(heroName)) {
            this.actions.push(new Action_SaveAlly(this.unit, "GuardianAngel", this.config));
        }
        // 如果英雄购买了推推/微光，也可以动态添加这个 Action (需要更高级的动态注册机制)

        // === 3. 先手特有能力 (Initiator) ===
        if (heroName === "npc_dota_hero_tidehunter") {
            // 潮汐：毁灭 (Ravage), 半径1025, 至少打2人
            this.actions.push(new Action_Initiate(this.unit, "tidehunter_ravage", 1025, 2, this.config));
        }
        else if (heroName === "npc_dota_hero_magnataur") {
            // 猛犸：大招 (RP), 半径410, 至少打2人 (要求比较高，因为范围小)
            this.actions.push(new Action_Initiate(this.unit, "magnataur_reverse_polarity", 410, 2, this.config));
        }
        else if (heroName === "npc_dota_hero_enigma") {
            // 谜团逻辑稍有不同（点地施法），需要在 Action_Initiate 里做区分，或者传入参数 isNoTarget: false
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
