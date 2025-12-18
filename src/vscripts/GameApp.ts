// src/vscripts/GameApp.ts
import { BaseModule } from "./core/BaseModule";
import { GameLoopModule } from "./modules/GameLoop/GameLoopModule";
import { RoleModule } from "./modules/Role/RoleModule";
import { RoundModule } from "./modules/Round/RoundModule";
import { EconomyModule } from "./modules/Economy/EconomyModule";
// ... 导入其他模块

export class GameApp {
    private static instance: GameApp;
    private modules: BaseModule[] = [];

    public static GetInstance(): GameApp {
        if (!this.instance) this.instance = new GameApp();
        return this.instance;
    }

    constructor() {
        // 1. 注册所有模块
        this.RegisterModule(new GameLoopModule());
        this.RegisterModule(new RoleModule());
        this.RegisterModule(new RoundModule());
        this.RegisterModule(new EconomyModule());

        // 2. 监听游戏状态变更
        ListenToGameEvent("game_rules_state_change", () => this.OnStateChange(), undefined);
    }

    private RegisterModule(module: BaseModule) {
        this.modules.push(module);
    }

    public Init() {
        // 配置 GameRules
        GameRules.SetPreGameTime(60);
        // ... 其他通用设置

        // 初始化所有模块
        this.modules.forEach(m => m.Init());
    }

    public Precache(context: CScriptPrecacheContext) {
        this.modules.forEach(m => m.Precache(context));
    }

    private OnStateChange() {
        const state = GameRules.State_Get();
        if (state === DOTA_GAMERULES_STATE.GAME_IN_PROGRESS) {
            this.modules.forEach(m => m.OnGameStart());
        }
    }
}
