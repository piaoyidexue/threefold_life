export class Spawner {
    private static spawnTimer: string | null = null;
    private static baseEntity: CDOTA_BaseNPC | null = null;

    // 刷怪点名称列表 (需要在 Hammer 地图中放置 info_target 实体并命名)
    private static spawnPointNames: string[] = ["spawner_1", "spawner_2", "spawner_3", "spawner_4"];

    /**
     * 初始化：寻找基地实体
     */
    public static Init() {
        // 查找所有建筑类型的实体
        const ent = Entities.FindByName(undefined, "npc_dota_building");

        if (ent) {
            // =========================================================
            // 修复点：强制转换为 CDOTA_BaseNPC 才能调用 GetUnitName
            // =========================================================
            const unit = ent as CDOTA_BaseNPC;
            if (unit.GetUnitName() === "npc_sacred_flame") {
                this.baseEntity = unit;
                print("[Spawner] Sacred Flame found!");
            }
        }

        if (!this.baseEntity) {
            print("[Spawner] WARNING: Sacred Flame NOT found! Creeps will stay idle.");
        }
    }

    /**
     * 开始夜晚刷怪 (循环)
     * @param day 当前天数
     */
    public static StartNightWave(day: number) {
        print(`[Spawner] Starting Night Wave for Day ${day}`);

        // 难度系数：每天增加血量和攻击力
        const difficultyMult = 1 + (day * 0.2);

        // 每次刷新的间隔 (秒)
        const interval = 5.0;

        this.spawnTimer = Timers.CreateTimer(0, () => {
            // 每次从所有刷怪点刷一只
            for (const spawnerName of this.spawnPointNames) {
                const spawnerEnt = Entities.FindByName(undefined, spawnerName);
                if (spawnerEnt) {
                    this.SpawnUnit("npc_creep_melee", spawnerEnt.GetAbsOrigin(), difficultyMult);
                }
            }
            return interval;
        });
    }

    /**
     * 停止刷怪 (天亮了)
     */
    public static StopWave() {
        if (this.spawnTimer) {
            Timers.RemoveTimer(this.spawnTimer);
            this.spawnTimer = null;
        }
        print("[Spawner] Wave Stopped");
    }

    /**
     * 召唤最终 BOSS
     */
    public static SpawnFinalBoss() {
        print("[Spawner] SPAWNING FINAL BOSS");

        // 假设 Boss 出现在 spawner_1
        const spawnerEnt = Entities.FindByName(undefined, this.spawnPointNames[0]);
        if (spawnerEnt) {
            const boss = this.SpawnUnit("npc_boss_final", spawnerEnt.GetAbsOrigin(), 1);

            // 全球通告
            GameRules.SendCustomMessage("<font color='#FF0000'>魔王降临！圣焰危在旦夕！</font>", 0, 0);
            EmitGlobalSound("Game.BossSpawn"); // 记得换成有效音效
        }
    }

    /**
     * 内部方法：生成单位并发布攻击指令
     */
    private static SpawnUnit(unitName: string, position: Vector, multiplier: number): CDOTA_BaseNPC {
        const unit = CreateUnitByName(unitName, position, true, undefined, undefined, DotaTeam.BADGUYS);

        // 应用难度强化
        if (multiplier > 1) {
            const hp = unit.GetMaxHealth() * multiplier;
            unit.SetMaxHealth(hp);
            unit.SetBaseMaxHealth(hp);
            unit.SetHealth(hp);

            const dmgMin = unit.GetBaseDamageMin() * multiplier;
            const dmgMax = unit.GetBaseDamageMax() * multiplier;
            unit.SetBaseDamageMin(dmgMin);
            unit.SetBaseDamageMax(dmgMax);
        }

        // 命令进攻基地
        if (this.baseEntity && this.baseEntity.IsAlive()) {
            ExecuteOrderFromTable({
                UnitIndex: unit.entindex(),
                OrderType: UnitOrder.ATTACK_MOVE,
                Position: this.baseEntity.GetAbsOrigin(),
                Queue: false,
            });
        }

        return unit;
    }
}
