import { IBotUnit } from "../core/IBotUnit";
import { Blackboard } from "../core/Blackboard";

export enum SquadState {
    IDLE,
    ROAMING, // 游走
    PUSHING, // 推进
    DEFENDING // 防守
}

/**
 * 小队类：管理一组 Bot 执行特定任务
 */
export class Squad {
    public id: number;
    public members: IBotUnit[] = [];
    public state: SquadState = SquadState.IDLE;
    public targetLocation: Vector | null = null;

    constructor(id: number, members: IBotUnit[]) {
        this.id = id;
        this.members = members;
    }

    /**
     * 更新小队逻辑
     */
    public update() {
        if (this.members.length === 0) return;

        // 剔除死掉的成员
        this.members = this.members.filter(m => m.isValid() && m.isAlive());

        switch (this.state) {
            case SquadState.ROAMING:
                this.updateRoaming();
                break;
            case SquadState.PUSHING:
                // Pushing logic...
                break;
        }
    }

    private updateRoaming() {
        if (!this.targetLocation) return;

        // 计算小队中心
        let center = Vector(0,0,0);
        this.members.forEach(m => center = (center + m.getPosition()) as Vector);
        center = (center / this.members.length) as Vector;

        // 简单的抱团逻辑：
        // 如果成员距离中心太远，等待；否则向目标移动
        for (const member of this.members) {
            const distToCenter = ((member.getPosition() - center) as Vector).Length2D();
            const distToTarget = ((member.getPosition() - this.targetLocation) as Vector).Length2D();

            if (distToTarget < 500) {
                // 到达目标点，任务完成，解散或切换状态
                this.state = SquadState.IDLE;
                return;
            }

            // 如果有人掉队 (> 800码)，其他人停下来等
            // 这里我们通过修改 Blackboard 来影响 member 的个体决策
            // 更好的做法是给 member 发送 "Regroup" 指令

            // 此处简化：直接利用 Blackboard 的 TeamRallyPoint
            // 在实际工程中，Blackboard 应该支持 map<SquadID, Vector>
        }
    }
}

/**
 * 工厂类：用于 Director 创建小队
 */
export class SquadManager {
    private squads: Squad[] = [];
    private nextId = 1;

    public createSquad(units: IBotUnit[]): Squad {
        const squad = new Squad(this.nextId++, units);
        this.squads.push(squad);
        return squad;
    }

    public updateAllSquads() {
        this.squads.forEach(s => s.update());
        // 清理空小队
        this.squads = this.squads.filter(s => s.members.length > 0);
    }
}
