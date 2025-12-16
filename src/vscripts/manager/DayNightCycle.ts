import { reloadable } from "../lib/tstl-utils";

@reloadable
export class DayNightCycle {
    private dayDuration: number = 180; // 3分钟
    private nightDuration: number = 120; // 2分钟
    private isDay: boolean = true;
    private waveCount: number = 0;

    // 圣焰基地位置 (需要在Hammer地图里放一个 entity name="sacred_flame_base")
    private baseEntity: CDOTA_BaseNPC | undefined;

    constructor() {}

    public StartCycle() {
        this.SetDay();
    }

    private SetDay() {
        this.isDay = true;
        GameRules.SetTimeOfDay(0.25); // 白天
        GameRules.SendCustomMessage("天亮了，抓紧时间搜集资源！", 0, 0);

        // 停止刷怪定时器...

        Timers.CreateTimer(this.dayDuration, () => {
            this.SetNight();
        });
    }

    private SetNight() {
        this.isDay = false;
        GameRules.SetTimeOfDay(0.75); // 黑夜
        GameRules.SendCustomMessage("黑夜降临，怪物正在逼近圣焰！", 0, 0);

        // 1. 传送所有好人回城
        this.RecallPlayers();

        // 2. 开启刷怪
        this.waveCount++;
        this.StartMonsterWave(this.waveCount);

        Timers.CreateTimer(this.nightDuration, () => {
            this.SetDay();
        });
    }

    private RecallPlayers() {
        const basePos = this.GetBasePosition();
        const heroes = HeroList.GetAllHeroes();

        heroes.forEach(hero => {
            if (hero.IsRealHero() && hero.GetTeam() === DotaTeam.GOODGUYS) {
                FindClearSpaceForUnit(hero, basePos, true);
                hero.AddNewModifier(hero, undefined, "modifier_phased", { duration: 2.0 }); // 防止卡住
                PlayerResource.SetCameraTarget(hero.GetPlayerOwnerID(), hero);
                Timers.CreateTimer(1.0, () => PlayerResource.SetCameraTarget(hero.GetPlayerOwnerID(), undefined));
            }
        });
    }

    private StartMonsterWave(round: number) {
        // 简易刷怪逻辑：在地图四个角生成怪物，攻击基地
        const spawnPoints = ["spawn_1", "spawn_2", "spawn_3", "spawn_4"];

        let monstersSpawned = 0;
        const maxMonsters = 10 + round * 5; // 每波递增

        Timers.CreateTimer(0, () => {
            if (monstersSpawned >= maxMonsters) return undefined;

            const spawnPointName = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
            const spawnEnt = Entities.FindByName(undefined, spawnPointName);

            if (spawnEnt) {
                const unitName = "npc_dota_creature_gnoll_assassin"; // 替换为自定义单位
                const monster = CreateUnitByName(unitName, spawnEnt.GetAbsOrigin(), true, undefined, undefined, DotaTeam.BADGUYS);

                // 设置AI进攻目标
                monster.SetForceAttackTarget(this.GetBaseEntity());
            }

            monstersSpawned++;
            return 1.0; // 每秒刷一只
        });
    }

    private GetBaseEntity(): CDOTA_BaseNPC {
        if (!this.baseEntity || this.baseEntity.IsNull()) {
            this.baseEntity = Entities.FindByName(undefined, "sacred_flame_base") as CDOTA_BaseNPC;
        }
        return this.baseEntity;
    }

    private GetBasePosition(): Vector {
        const ent = this.GetBaseEntity();
        return ent ? ent.GetAbsOrigin() : Vector(0, 0, 0);
    }
}
