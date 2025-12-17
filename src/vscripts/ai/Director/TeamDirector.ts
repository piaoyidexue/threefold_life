import { Blackboard } from "../core/Blackboard";
import { WorldState } from "../adapter/WorldState";
import { TeamState, AI_CONSTANTS } from "../Constants";
import { IBotUnit } from "../core/IBotUnit";
import { DotaBotUnit } from "../adapter/DotaBotUnit";
import { SquadManager, SquadState } from "./SquadLogic";
export class TeamDirector {
    private squadManager = new SquadManager();
    public update() {
        // 为了简化，我们假设全图的夜魇英雄归我们管
        // 实际上这里应该维护一个 registeredBots 列表
        const badGuys = GameRules.GetGameModeEntity().GetAbsOrigin(); // 随便找个位置
        // 注意：这里需要一个获取所有Bot的方法，为简化代码，我们假设外部已传入或能获取

        // 简易逻辑：随便找个活着的Bot作为观察点
        const allBots = HeroList.GetAllHeroes().filter(h => h.GetTeamNumber() == DotaTeam.BADGUYS);
        if (allBots.length == 0) return;

        const leader = new DotaBotUnit(allBots[0] as CDOTA_BaseNPC);

        // 1. 获取视野内的敌人
        const enemies = WorldState.GetVisibleEnemies(leader, 3000); // 大范围扫描

        // 2. 决策状态
        if (enemies.length > 0) {
            Blackboard.Instance.currentTeamState = TeamState.FIGHT;

            // 3. 选定集火目标 (Target Selection)
            // 策略：优先打血最少的
            let lowestHP = 99999;
            let bestTarget: IBotUnit | null = null;

            for (const enemy of enemies) {
                if (enemy.getHealthPercent() < lowestHP) {
                    lowestHP = enemy.getHealthPercent();
                    bestTarget = enemy;
                }
            }
            Blackboard.Instance.sharedFocusTarget = bestTarget;

        } else {
            Blackboard.Instance.currentTeamState = TeamState.FARM;
            Blackboard.Instance.sharedFocusTarget = null;
        }

        // 示例：每分钟指派 2 个闲置的人去符点
        if (GameRules.GetGameTime() % 60 < 0.1) {
            // 假设我们有获取闲置Bot的方法
            // const idleBots = this.getIdleBots(2);
            // if (idleBots.length == 2) {
            //     const squad = this.squadManager.createSquad(idleBots);
            //     squad.state = SquadState.ROAMING;
            //     squad.targetLocation = Vector(0,0,0); // 中路
            // }
        }

        // 更新小队
        this.squadManager.updateAllSquads();
    }
}
