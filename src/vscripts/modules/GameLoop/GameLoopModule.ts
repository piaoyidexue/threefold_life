import { BaseModule } from "../../core/BaseModule";
import {EventBus} from "../../core/GameEvents";

export class GameLoopModule extends BaseModule {
    private day: number = 1;
    private timer: number = 0;
    private isDay: boolean = true;

    constructor() { super("GameLoop"); }

    public Precache(context: CScriptPrecacheContext) {}

    public Init() {
        // 初始化时间设置
    }

    public OnGameStart() {
        this.StartTimer();
    }

    private StartTimer() {
        Timers.CreateTimer(1, () => {
            this.OnThink();
            return 1;
        });
    }

    private OnThink() {
        this.timer--;
        // ... 处理 UI 时间同步 ...

        if (this.timer <= 0) {
            this.TogglePhase();
        }
    }

    private TogglePhase() {
        this.isDay = !this.isDay;

        if (this.isDay) {
            this.day++;
            // 【关键】只发送信号，不直接调用 Spawner
            this.Log(`Day ${this.day} Started`);
            EventBus.Emit("rpg_day_start", { day: this.day });
            GameRules.SetTimeOfDay(0.25);
        } else {
            this.Log(`Night ${this.day} Started`);
            EventBus.Emit("rpg_night_start", { day: this.day });
            GameRules.SetTimeOfDay(0.75);
        }
    }
}
