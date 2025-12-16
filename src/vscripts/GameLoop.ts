import { reloadable } from "./lib/tstl-utils";
import { RoleManager } from "./components/RoleManager";
import { DayNightCycle } from "./components/DayNightCycle";

declare global {
    interface CDOTAGamerules {
        Addon: GameLoop;
    }
}

@reloadable
export class GameLoop {
    public static instance: GameLoop;

    public roleManager: RoleManager;
    public dayNightCycle: DayNightCycle;

    private gameStarted: boolean = false;

    constructor() {
        GameLoop.instance = this;
        this.roleManager = new RoleManager();
        this.dayNightCycle = new DayNightCycle();

        // 监听游戏状态变化
        ListenToGameEvent("game_rules_state_change", () => this.OnStateChange(), undefined);
    }

    public OnStateChange(): void {
        const state = GameRules.State_Get();

        if (state == GameState.GAME_IN_PROGRESS) {
            // 游戏正式开始
            if (!this.gameStarted) {
                this.gameStarted = true;
                this.StartGameSequence();
            }
        }
    }

    private StartGameSequence() {
        print("[SacredFlame] Game Started. Waiting for hero selection...");

        // 30秒选人缓冲已经在PreGame阶段完成，这里是进入地图后的逻辑
        // 延迟 5秒 给予玩家准备时间，然后分配身份
        Timers.CreateTimer(5, () => {
            print("[SacredFlame] Assigning Roles...");
            this.roleManager.AssignRoles();

            // 开启昼夜循环
            this.dayNightCycle.StartCycle();
            return undefined;
        });
    }
}
