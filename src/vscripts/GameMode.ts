import {reloadable} from "./lib/tstl-utils";
import {GAME_SETTINGS} from "./settings";
import {GameLoopInstance} from "./manager/GameLoop";
import {RadianceSystem} from "./manager/RadianceSystem";
import {XPFilter} from "./filters/XPFilter";
import {DamageFilter} from "./filters/DamageFilter";
import {JudgmentSystem} from "./manager/JudgmentSystem";


declare global {
    interface CDOTAGameRules {
        Addon: GameMode;
    }
}

@reloadable
export class GameMode {
    private static instance: GameMode;

    public static Precache(this: void, context: CScriptPrecacheContext) {
        PrecacheResource("particle", "particles/units/heroes/hero_meepo/meepo_earthbind_projectile_fx.vpcf", context);
        PrecacheResource("soundfile", "soundevents/game_sounds_heroes/game_sounds_meepo.vsndevts", context);
    }

    public static Activate(this: void) {
        // When the addon activates, create a new instance of this GameMode class.
        GameRules.Addon = new GameMode();
    }


    constructor() {
        this.ConfigureGameRules();
        this.RegisterFilters(); // 新增注册过滤器
        this.RegisterEvents();

        RadianceSystem.Init(); // 初始化光辉
        JudgmentSystem.Init(); // 初始化事件监听

    }


    private RegisterFilters() {
        const mode = GameRules.GetGameModeEntity();

        // 注册经验过滤器
        mode.SetModifyExperienceFilter((event) => XPFilter(event), this);
        // 注册伤害过滤器
        mode.SetDamageFilter((event) => DamageFilter(event), this);

        print("[GameMode] Filters Registered");
    }

    private StartGame(): void {
        print("Game starting!");

        // Do some stuff here
    }

    // Called on script_reload
    public Reload() {
        print("Script reloaded!");

        // Do some stuff here
    }

    private ConfigureGameRules() {
        const rules = GameRules;
        rules.SetPreGameTime(GAME_SETTINGS.PRE_GAME_TIME);
        rules.SetStrategyTime(10);
        rules.SetShowcaseTime(0);
        rules.SetHeroSelectionTime(30);
        rules.SetGoldPerTick(0); // 关闭默认工资
        rules.SetStartingGold(GAME_SETTINGS.INITIAL_GOLD);

        const mode = GameRules.GetGameModeEntity();
        mode.SetFogOfWarDisabled(false); // 启用迷雾

        // GDD: 视野限制机制在 Filter 中或通过 Modifier 控制
        // mode.SetDamageFilter(...)
        // mode.SetExperienceFilter(...)

        print("[GameMode] Rules Configured");
    }

    private RegisterEvents() {
        ListenToGameEvent("game_rules_state_change", () => this.OnStateChange(), undefined);
        ListenToGameEvent("npc_spawned", (event) => this.OnNPCSpawned(event), undefined);
        ListenToGameEvent("entity_killed", (event) => this.OnEntityKilled(event), undefined);
    }

    private OnStateChange() {
        const state = GameRules.State_Get();
        if (state === GameState.GAME_IN_PROGRESS) {
            // 游戏正式开始 (0:00)
            GameLoopInstance.StartGame();
        }
    }

    private OnNPCSpawned(event: NpcSpawnedEvent) {
        const npc = EntIndexToHScript(event.entindex) as CDOTA_BaseNPC;
        if (npc.IsHero()) {
            // 可以在这里处理英雄重生逻辑
        }
    }

    private OnEntityKilled(event: EntityKilledEvent) {
        const killed = EntIndexToHScript(event.entindex_killed) as CDOTA_BaseNPC;

        // 只有杀怪才加光辉
        if (killed.GetTeamNumber() === DotaTeam.BADGUYS) {
            let amount = 0.5; // 普通怪

            if (killed.GetUnitName() === "npc_boss_final") {
                amount = 100; // Boss 死了直接满或者胜利
                GameRules.SetGameWinner(DotaTeam.GOODGUYS); // 简单的胜利判定
            }
            // 可以判断是否是精英怪

            RadianceSystem.ModifyRadiance(amount);
        }

        // GDD: 圣焰被毁，游戏失败
        if (killed.GetUnitName() === "npc_sacred_flame") {
            GameRules.SetGameWinner(DotaTeam.BADGUYS);
        }
    }

}
