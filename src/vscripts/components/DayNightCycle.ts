// components/DayNightCycle.ts
export class DayNightCycle {
    public isDay: boolean = true;

    public StartCycle() {
        // 开启循环计时器
        Timers.CreateTimer(() => {
            this.ToggleDayNight();
            return 300; // 5分钟一个昼夜
        });
    }

    private ToggleDayNight() {
        this.isDay = !this.isDay;
        GameRules.SetTimeOfDay(this.isDay ? 0.25 : 0.75); // 0.25=白天, 0.75=晚上

        if (!this.isDay) {
            this.StartMonsterInvasion();
            // 传送所有玩家回城
            this.RecallPlayersToBase();
        } else {
            // 结算夜晚奖励，刷新野区
        }
    }

    private StartMonsterInvasion() {
        // 在地图边缘刷怪，向圣焰（基地）进攻
        // CreateUnitByName(...)
        // unit.MoveToPositionAggressive(sacredFlamePos);
    }
}
