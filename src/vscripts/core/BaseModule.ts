// src/vscripts/core/BaseModule.ts
export abstract class BaseModule {
    protected moduleName: string;

    constructor(name: string) {
        this.moduleName = name;
        print(`[System] Loading Module: ${this.moduleName}...`);
    }

    /** 游戏预加载阶段 (Precache) */
    public abstract Precache(context: CScriptPrecacheContext): void;

    /** 游戏初始化阶段 (Activate) */
    public abstract Init(): void;

    /** 游戏开始阶段 (0:00) */
    public abstract OnGameStart(): void;

    protected Log(msg: string) {
        print(`[${this.moduleName}] ${msg}`);
    }
}
