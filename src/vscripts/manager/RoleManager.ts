// src/vscripts/classes/RoleManager.ts

import {NetTableManager} from "../utils/NetTableManager";

export enum RoleType {
    GUARDIAN = 0, // 圣焰守护者
    TRAITOR = 1,  // 暗影潜行者
    JUDGE = 2     // 狂热信徒/审判者
}

export class RoleManager {
    // 存储玩家ID -> 身份的映射
    private static playerRoles: Map<PlayerID, RoleType> = new Map();
    private static stolenXP: number = 0;
    private static shadowShards: number = 0; // 内奸当前的碎片数
    public static Init() {
        // 开启自然增长定时器 (每秒 +2)
        Timers.CreateTimer(1, () => {
            if (this.IsTraitorAlive()) {
                this.ModifyShards(2);
            }
            return 1;
        });
    }

    public static ModifyShards(amount: number) {
        this.shadowShards += amount;

        // 更新 NetTable 供 UI 显示
        // 为了安全，我们最好只把这个数据发给内奸玩家，但简单起见先写进 NetTable
        // 并在前端做显示过滤，或者使用 Send_ServerToPlayer 更新

        NetTableManager.SetPlayerData(attacker.GetPlayerID(), { shadow_shards: this.shadowShards })
    }

    public static GetShards(): number {
        return this.shadowShards;
    }

    // 处理补刀/反补获取碎片
    public static OnUnitKilled(victim: CDOTA_BaseNPC, attacker: CDOTA_BaseNPC) {
        if (!attacker || !attacker.IsRealHero()) return;

        // 只有内奸补刀才算
        if (this.IsTraitor(attacker)) {
            let amount = 0;

            // 补刀敌方单位
            if (victim.GetTeamNumber() !== attacker.GetTeamNumber()) {
                amount = 5;
            }
            // 反补友方单位 (Dota2 中反补通常也视为 attacker 是自己)
            else {
                amount = 10; // 反补奖励更高
            }

            if (amount > 0) {
                this.ModifyShards(amount);
                // 飘字特效
                SendOverheadEventMessage(undefined, OverheadAlert.GOLD, attacker, amount, undefined);
            }
        }
    }

    public static AssignRoles() {
        print("[RoleManager] Assigning Roles...");

        const allPlayers: PlayerID[] = [];
        for (let i = 0; i < PlayerResource.GetPlayerCount(); i++) {
            if (PlayerResource.IsValidPlayerID(i as PlayerID)) {
                allPlayers.push(i as PlayerID);
            }
        }

        // 洗牌算法
        for (let i = allPlayers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allPlayers[i], allPlayers[j]] = [allPlayers[j], allPlayers[i]];
        }

        // 分配 (假设8人局配置)
        // 0 = Traitor, 1 = Judge, 其余 = Guardian
        allPlayers.forEach((pid, index) => {
            let role = RoleType.GUARDIAN;
            if (index === 0) role = RoleType.TRAITOR;
            else if (index === 1) role = RoleType.JUDGE;

            this.playerRoles.set(pid, role);

            // 重要：将身份写入 NetTable，但要注意数据保护
            // 这里我们先只告诉玩家自己是什么身份
            this.NotifyPlayerRole(pid, role);
        });
    }


    private static NotifyPlayerRole(pid: PlayerID, role: RoleType) {
        // 这里只是示例，实际上你应该通过 CustomGameEventManager 发送事件
        // 或者设置一个仅该玩家可见的 NetTable 键值
        print(`Player ${pid} is assigned role: ${role}`);

        // 发送给前端 UI
        // CustomGameEventManager.Send_ServerToPlayer(PlayerResource.GetPlayer(pid), "s2c_set_role_ui", { role: role });

        // GDD: 添加被动技能
        const hero = PlayerResource.GetSelectedHeroEntity(pid);
        if (hero) {
            if (role === RoleType.TRAITOR) {
                hero.AddAbility("Ability_Traitor_Passive");
            } else if (role === RoleType.GUARDIAN) {
                hero.AddAbility("Ability_Guardian_Passive");
            }
        }
    }

    /**
     * 判断某个英雄是否是内奸
     */
    public static IsTraitor(hero: CDOTA_BaseNPC_Hero): boolean {
        const pid = hero.GetPlayerID();
        return this.playerRoles.get(pid) === RoleType.TRAITOR;
    }

    /**
     * 判断某个英雄是否是守护者
     */
    public static IsGuardian(entity: CDOTA_BaseNPC): boolean {
        if (!entity.IsRealHero()) return false;
        const pid = entity.GetPlayerID();
        return this.playerRoles.get(pid) === RoleType.GUARDIAN;
    }

    /**
     * 检测内奸是否存活 (用于暗影锁判定)
     */
    public static IsTraitorAlive(): boolean {
        // 遍历所有玩家，找到 Traitor 并检查是否存活
        for (const [pid, role] of this.playerRoles) {
            if (role === RoleType.TRAITOR) {
                const hero = PlayerResource.GetSelectedHeroEntity(pid);
                // 存活判定：英雄存在 且 活着
                if (hero && hero.IsAlive()) {
                    return true;
                }
            }
        }
        return false;
    }

    // GDD: 经验截流相关方法
    public static AddStolenXP(amount: number) {
        this.stolenXP += amount;
        // 可选：在这里给内奸玩家发送Debug提示
        // print(`[RoleManager] Traitor stole ${amount} XP. Total: ${this.stolenXP}`);
    }

    public static GetStolenXP(): number {
        return this.stolenXP;
    }

    public static ResetStolenXP() {
        this.stolenXP = 0;
    }
}
