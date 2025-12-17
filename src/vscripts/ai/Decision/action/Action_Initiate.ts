import { ActionBase } from "../ActionBase";
import { IBotUnit } from "../../core/IBotUnit";
import { HeroConfig } from "../../AIConfig";
import { WorldState } from "../../adapter/WorldState";
import { Blackboard } from "../../core/Blackboard";
import { DebugSystem } from "../../DebugSystem";

export class Action_Initiate extends ActionBase {
    private ultName: string;
    private aoeRadius: number;
    private minTargets: number;
    private cachePos: Vector | null = null;
    private cacheBlink: boolean = false;


    constructor(owner: IBotUnit, ultName: string, radius: number, minTargets: number, config: HeroConfig) {
        super(owner, `Initiate_${ultName}`, config);
        this.ultName = ultName;
        this.aoeRadius = radius;
        this.minTargets = minTargets;
    }

    evaluate(): number {
        // 1. 检查大招是否就绪
        const ultData = this.owner.getAbilityData(this.ultName);
        if (!ultData || !ultData.isReady) return 0;

        // 2. 检查是否有跳刀 (Blink Dagger)
        // 注意：Adapter 需要支持 FindItem 逻辑，或者 getAbilityData 也能获取物品
        const blinkData = this.owner.getAbilityData("item_blink");
        const hasBlink = blinkData && blinkData.isReady;

        // 搜索范围：如果有跳刀，范围 = 跳刀距离(1200) + 大招半径
        // 如果没跳刀，范围 = 大招施法距离
        const searchRange = hasBlink ? 1200 + this.aoeRadius : ultData.range;

        // 3. 计算最佳先手点 (Cluster Finding)
        const bestPos = WorldState.findBestAOELocation(
            this.owner,
            searchRange,
            this.aoeRadius,
            this.minTargets
        );

        if (!bestPos) return 0;

        this.cachePos = bestPos;
        this.cacheBlink = !!hasBlink;

        // 4. 评分逻辑
        // 如果黑板上有 "Request_Initiate" 指令，分数直接拉满
        // 否则根据能打到的人数加分
        let score = 0.8;

        // 激进型 AI (Aggression > 1.2) 更容易先手
        score *= this.config.AggressionFactor;

        return Math.min(score, 1.0);
    }


    execute(): void {
        if (!this.cachePos) return;

        // === 连招逻辑 ===
        if (this.cacheBlink) {
            // 1. 跳过去 (Blink)
            // 这里的 execute 可能一帧执行不完，但在 Utility AI 中，
            // 下一帧如果 evaluate 依然高分，会继续进来。
            // 更好的做法是封装一个 Sequence Action，但这里简化为瞬间连招
            this.owner.castPoint("item_blink", this.cachePos);

            // 2. 就在这一帧，尝试排队施放大招 (Dota允许指令队列)
            // 注意：如果大招是点地施放（如谜团），位置就是 Blink 位置
            // 如果大招是无目标（如潮汐），直接放
            this.owner.castNoTarget(this.ultName); // 假设是潮汐/猛犸
            // 如果是谜团: this.owner.castPoint(this.ultName, this.cachePos);
        } else {
            // 没跳刀，走过去放？通常 Initiator 不会这么做，除非距离很近
            this.owner.castNoTarget(this.ultName);
        }


        // === [新增] 广播信号 ===
        Blackboard.Instance.broadcastSignal({
            sourceUnit: this.owner,
            triggerName: this.ultName, // e.g., "tidehunter_ravage"
            location: this.cachePos,   // 毁灭的中心点
            timestamp: GameRules.GetGameTime()
        });
        // 告知队友：我开团了！
        Blackboard.Instance.currentTeamState = 3; // FIGHT

        DebugSystem.DrawThinking(this.owner, "INITIATING!!", 1.0, undefined, this.cachePos);
    }
}
