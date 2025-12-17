import {GAME_SETTINGS} from "../settings";
import {RoleManager} from "./RoleManager";
import {RadianceSystem} from "./RadianceSystem";
import {Spawner} from "./Spawner";

export class GameLoop {
    public currentDay: number = 1;
    public isDayTime: boolean = true;
    public isGameEnded: boolean = false;
    private timer: number = 0;
    public static sacredFlameEntity: CDOTA_BaseNPC | null = null;

    constructor() {
        print("[GameLoop] Initialized");
    }

    public StartGame() {
        print("[GameLoop] Game Started!");
        this.currentDay = 1;
        this.StartDayPhase();

        // 分配身份
        RoleManager.AssignRoles();

        // 开启主计时器
        Timers.CreateTimer(1, () => {
            this.OnThink();
            return 1;
        });
        this.SpawnBase();
        Spawner.Init(); // 初始化寻找基地
    }


    private SpawnBase() {
        const basePos = Vector(0, 0, 0); // 或者 Entities.FindByName(..., "sacred_flame_pos")
        const baseUnit = CreateUnitByName("npc_sacred_flame", basePos, true, undefined, undefined, DotaTeam.GOODGUYS);
        // 移除无敌 buff (有些塔默认无敌)
        baseUnit.RemoveModifierByName("modifier_invulnerable");
        // 赋值给静态变量
        GameLoop.sacredFlameEntity = baseUnit;

        print("[GameLoop] Base Entity Created and Cached.");
    }

    private OnThink() {
        if (this.isGameEnded) return;

        this.timer--;

        RadianceSystem.OnThink(this.isDayTime);
        // 更新客户端顶部UI的时间显示
        CustomGameEventManager.Send_ServerToAllClients("s2c_update_timer", {
            time: this.timer,
            is_day: this.isDayTime,
            day_count: this.currentDay
        });

        // 阶段结束检测
        if (this.timer <= 0) {
            if (this.currentDay >= GAME_SETTINGS.MAX_DAYS) {
                // 第15天进入决战，不再切换昼夜，直到BOSS死亡或基地爆炸
                return;
            }
            // 如果是第14天结束，进入第15天
            if (!this.isDayTime && this.currentDay === GAME_SETTINGS.MAX_DAYS - 1) {
                this.currentDay++;
                this.StartFinalBattle();
                return;
            }
            if (this.isDayTime) {
                this.StartNightPhase();
            } else {
                this.currentDay++; // 只有度过夜晚才算新的一天
                this.StartDayPhase();
            }
        }
    }

    private StartDayPhase() {
        print(`[GameLoop] Day ${this.currentDay} Started`);
        this.isDayTime = true;
        this.timer = GAME_SETTINGS.DAY_DURATION;

        // 设置 Dota 原生白天
        GameRules.SetTimeOfDay(0.25); // 0.25 是早晨
        Spawner.StopWave(); // 停止刷怪
        // GDD: 开启审判台，野区刷新
        // TODO: EnableShrines();
        // TODO: EnableTribunal();
    }

    private StartNightPhase() {
        print(`[GameLoop] Night ${this.currentDay} Started`);
        this.isDayTime = false;
        this.timer = GAME_SETTINGS.NIGHT_DURATION;

        // 设置 Dota 原生黑夜
        GameRules.SetTimeOfDay(0.75); // 0.75 是夜晚

        // GDD: 强制回城，关闭审判台，刷怪
        this.TeleportAllToBase();
        // TODO: SpawnWave(this.currentDay);
        // TODO: DisableTribunal();
        if (this.currentDay < GAME_SETTINGS.MAX_DAYS) {
            Spawner.StartNightWave(this.currentDay);
        }
    }

    private TeleportAllToBase() {
        // 假设基地坐标是 (0,0,0)，实际请填入你的 info_player_start 坐标
        const basePos = Vector(0, 0, 0);

        for (let i = 0; i < PlayerResource.GetPlayerCount(); i++) {
            const playerID = i as PlayerID;
            if (PlayerResource.IsValidPlayerID(playerID)) {
                const hero = PlayerResource.GetSelectedHeroEntity(playerID);
                if (hero && hero.IsAlive()) {
                    hero.SetAbsOrigin(basePos);
                    FindClearSpaceForUnit(hero, basePos, true);
                    // 镜头居中
                    PlayerResource.SetCameraTarget(playerID, hero);
                    Timers.CreateTimer(0.5, () => PlayerResource.SetCameraTarget(playerID, undefined));
                }
            }
        }
    }

    private StartFinalBattle() {
        print("[GameLoop] FINAL BATTLE STARTED");
        this.isDayTime = false; // 决战通常是黑夜或特殊天气
        GameRules.SetTimeOfDay(0.75);

        Spawner.StopWave(); // 清理旧循环
        Spawner.SpawnFinalBoss();

        // UI 通知
        CustomGameEventManager.Send_ServerToAllClients("s2c_update_timer", {
            time: 9999, // 不限时
            is_day: false,
            day_count: 15
        });
    }
}

// 导出单例
export const GameLoopInstance = new GameLoop();
