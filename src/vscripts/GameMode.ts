import {reloadable} from "./lib/tstl-utils";
import {GAME_SETTINGS} from "./settings";
import {GameLoopInstance} from "./manager/GameLoop";
import {RadianceSystem} from "./manager/RadianceSystem";
import {XPFilter} from "./filters/XPFilter";
import {DamageFilter} from "./filters/DamageFilter";


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
}
