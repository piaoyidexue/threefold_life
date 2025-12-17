import { TeamDirector } from "./Director/TeamDirector";
import { DotaBotUnit } from "./adapter/DotaBotUnit";
import { Evaluator } from "./Decision/Evaluator";
import { Action_Attack } from "./Decision/action/Action_Attack";
import { Action_ChainStun } from "./Decision/action/Action_ChainStun";

export class AIFramework {
    private static instance: AIFramework;
    private director: TeamDirector;
    private bots: Map<EntityIndex, Evaluator> = new Map();

    constructor() {
        this.director = new TeamDirector();
        ListenToGameEvent("npc_spawned", (e) => this.OnNPCSpawned(e), undefined);
        GameRules.GetGameModeEntity().SetContextThink("AILoop", () => this.OnThink(), 0.1);
        print("[AI] Framework Started.");
    }

    public static Activate() {
        if (!this.instance) this.instance = new AIFramework();
    }

    private OnNPCSpawned(event: NpcSpawnedEvent) {
        const unit = EntIndexToHScript(event.entindex) as CDOTA_BaseNPC;

        // 仅接管夜魇的英雄
        if (unit.IsHero() && unit.GetTeamNumber() === DotaTeam.BADGUYS) {
            if (this.bots.has(unit.entindex())) return;

            print(`[AI] Creating Brain for ${unit.GetUnitName()}`);

            const adapter = new DotaBotUnit(unit);
            const brain = new Evaluator(adapter);

            // === 注入基础能力 ===
            brain.addAction(new Action_Attack(adapter, "BasicAttack"));

            // === 针对英雄注入特定能力 (配置化) ===
            // 这里可以做一个 Switch case 或者读 JSON 配置
            if (unit.GetUnitName() === "npc_dota_hero_sven") {
                // 斯温会使用风暴之锤接技能
                brain.addAction(new Action_ChainStun(adapter, "sven_storm_bolt", 2.0));
            }
            if (unit.GetUnitName() === "npc_dota_hero_skeleton_king") {
                brain.addAction(new Action_ChainStun(adapter, "skeleton_king_hellfire_blast", 2.0));
            }

            this.bots.set(unit.entindex(), brain);
        }
    }

    private OnThink(): number {
        // 1. 指挥官逻辑更新
        this.director.update();

        // 2. 所有机器人逻辑更新
        this.bots.forEach((brain, entIndex) => {
            const unit = EntIndexToHScript(entIndex);
            if (unit && unit.IsAlive()) {
                brain.update();
            } else {
                // 如果死了或者实体删除了，可以在这里做清理
            }
        });

        return 0.1;
    }
}
