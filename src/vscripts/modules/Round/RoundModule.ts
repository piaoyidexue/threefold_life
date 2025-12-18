import { BaseModule } from "../../core/BaseModule";
import {EventBus} from "../../core/GameEvents";

export class RoundModule extends BaseModule {
    constructor() { super("RoundManager"); }

    public Precache(context: CScriptPrecacheContext) {
        // 预载入怪物模型
    }

    public Init() {
        // 监听自定义事件 (假设我们实现了一个 EventBus.Subscribe)
        EventBus.Subscribe("rpg_night_start", (data) => this.StartWave(data.day));
        EventBus.Subscribe("rpg_day_start", () => this.StopWave());
    }

    public OnGameStart() {
        // 生成基地
    }

    private StartWave(day: number) {
        this.Log(`Spawning creeps for Day ${day}...`);
        // 具体的刷怪逻辑移到这里
    }

    private StopWave() {
        this.Log("Stopping spawn.");
        // 清理逻辑
    }
}
