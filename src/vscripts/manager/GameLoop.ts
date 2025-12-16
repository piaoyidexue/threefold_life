import { GAME_SETTINGS } from "../settings";
import { RoleManager } from "./RoleManager";
import {RadianceSystem} from "./RadianceSystem";

export class GameLoop {
    public currentDay: number = 1;
    public isDayTime: boolean = true;
    public isGameEnded: boolean = false;
    private timer: number = 0;

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
}

// 导出单例
export const GameLoopInstance = new GameLoop();
