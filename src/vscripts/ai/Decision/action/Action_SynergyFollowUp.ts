import { ActionBase } from "../ActionBase";
import { IBotUnit } from "../../core/IBotUnit";
import { HeroConfig } from "../../AIConfig";
import { Blackboard } from "../../core/Blackboard";
import { ComboDatabase, TargetType } from "../../core/ComboRegistry";
import { DebugSystem } from "../../DebugSystem";

export class Action_SynergyFollowUp extends ActionBase {

    constructor(owner: IBotUnit, name: string, config: HeroConfig) {
        super(owner, name, config);
    }

    evaluate(): number {
        const blackboard = Blackboard.Instance;

        // 1. 检查是否有活跃信号
        if (!blackboard.isSignalActive(2.0)) return 0; // 信号有效期2秒

        const signal = blackboard.activeSignal!;
        const triggerName = signal.triggerName;

        // 2. 查表：这个信号跟我是不是有关？
        // 检查 ComboDatabase 中是否有针对 triggerName 的条目
        const responses = ComboDatabase[triggerName];
        if (!responses) return 0;

        // 3. 筛选：有没有我要做的事？
        const myName = this.owner.getName(); // e.g., "npc_dota_hero_invoker"
        const myTask = responses.find(r => r.responderName === myName);

        if (!myTask) return 0;

        // 4. 检查我的技能是否就绪
        const abilityData = this.owner.getAbilityData(myTask.abilityName);
        if (!abilityData || !abilityData.isReady) return 0;

        // 5. 距离检查
        const targetPos = signal.location;
        if (myTask.targetType !== TargetType.NO_TARGET) {
            const dist = ((this.owner.getPosition() - targetPos) as Vector).Length2D();
            if (dist > abilityData.range + 200) return 0; // 太远接不上
        }

        // 6. 延迟处理 (Delay)
        // 如果信号刚发出，时间还没到 delay，则返回 0 (或者返回极低分以保持 Idle)
        // 这里为了简单，假设 evaluate 通过后，在 execute 里做 delay，
        // 但更好的做法是：如果时间未到，返回一个 "Waiting" 的高分动作但不施法
        const timeSinceSignal = GameRules.GetGameTime() - signal.timestamp;
        if (timeSinceSignal < myTask.delay) {
            return 0; // 还没到时间，先继续平A
        }

        // 缓存任务以便执行
        this.pendingTask = myTask;
        this.signalContext = signal;

        return myTask.minScore; // 返回配置里的高分 (通常 > 0.8)
    }

    private pendingTask: any = null;
    private signalContext: any = null;

    execute(): void {
        if (!this.pendingTask || !this.signalContext) return;

        const task = this.pendingTask;
        const signal = this.signalContext;

        // 执行施法
        switch (task.targetType) {
            case TargetType.POINT_TARGET:
                this.owner.castPoint(task.abilityName, signal.location);
                break;
            case TargetType.UNIT_TARGET:
                // 如果信号里有主目标就对他放，没有就找最近的
                const target = signal.mainTarget || this.findNearestEnemy(signal.location);
                if (target) this.owner.castTarget(task.abilityName, target);
                break;
            case TargetType.NO_TARGET:
                this.owner.castNoTarget(task.abilityName);
                break;
        }

        DebugSystem.DrawThinking(
            this.owner,
            `COMBO: ${task.abilityName}`,
            1.0,
            undefined,
            signal.location
        );

        // 清理任务，防止重复执行
        // 实际项目中可能需要标记 Blackboard 该信号已被我响应
        this.pendingTask = null;
    }

    private findNearestEnemy(pos: Vector): IBotUnit | null {
        // 简易实现：调用 SensorSystem (略)
        return null;
    }
}
