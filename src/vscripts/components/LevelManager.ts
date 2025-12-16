// components/LevelManager.ts
export class LevelManager {
    private currentGlobalXP: number = 0;
    private currentGlobalLevel: number = 1;
    private xpPerLevel: number[] = [0, 100, 250]; // 升级经验表

    constructor() {
        // 监听单位死亡
        ListenToGameEvent("entity_killed", (event) => this.OnEntityKilled(event), undefined);
    }

    private OnEntityKilled(event: EntityKilledEvent) {
        // 判断死者是否为野怪，杀手是否为好人阵营
        // add xp...

        if (this.currentGlobalXP >= this.xpPerLevel[this.currentGlobalLevel]) {
            this.LevelUpAllPlayers();
        }
    }

    private LevelUpAllPlayers() {
        this.currentGlobalLevel++;
        // 遍历所有好人玩家
        // hero.HeroLevelUp(true);
    }
}
