// components/RoleManager.ts

export enum RoleType {
    Civilian = "CIVILIAN", // 好人
    Traitor = "TRAITOR",   // 内奸
    Believer = "BELIEVER", // 信徒
    Judge = "JUDGE"        // 审判者（信徒复活后）
}

export class RoleManager {
    private playerRoles: Map<PlayerID, RoleType> = new Map();

    public AssignRoles() {
        const allPlayers = new Array<PlayerID>(); // 获取所有有效玩家ID
        for (let i = 0; i < 24; i++) {
            if (PlayerResource.IsValidPlayer(i)) {
                allPlayers.push(i);
            }
        }

        // 洗牌算法
        // ... (Shuffle logic)

        // 分配
        this.playerRoles.set(allPlayers[0], RoleType.Traitor);
        this.playerRoles.set(allPlayers[1], RoleType.Believer);
        for (let i = 2; i < allPlayers.length; i++) {
            this.playerRoles.set(allPlayers[i], RoleType.Civilian);
        }

        this.SyncRolesToClient();
    }

    private SyncRolesToClient() {
        // 重要：不能把所有人的身份发给所有人
        // 好人只能看到自己是好人
        // 内奸可以看到队友（如果有多个内奸）
        // 这里需要通过 SendCustomGameEventToPlayer 发送私有信息，
        // 或者使用 NetTable 但要注意键值混淆防止作弊
    }

    // 内奸宣战逻辑
    public TraitorDeclareWar(playerID: PlayerID) {
        const hero = PlayerResource.GetSelectedHeroEntity(playerID);
        if (hero) {
            hero.SetTeam(DotaTeam.BADGUYS); // 加入怪物阵营(夜魇)
            // 给予永久敌对Buff
        }
    }
}
