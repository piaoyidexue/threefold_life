import {GAME_SETTINGS} from "../settings";
import {RadianceSystem} from "./RadianceSystem";
import {RoleManager} from "./RoleManager";

enum VoteState {
    IDLE,
    VOTING,
    EXECUTING
}

export class JudgmentSystem {
    private static currentState: VoteState = VoteState.IDLE;
    private static currentInitiator: PlayerID = -1;
    private static currentTarget: PlayerID = -1;
    private static votes: Map<PlayerID, boolean> = new Map(); // true=同意, false=反对
    private static voteTimer: string | null = null; // 计时器ID

    public static Init() {
        // 注册事件监听
        CustomGameEventManager.RegisterListener("c2s_start_vote", (_, args) => this.OnStartVoteRequest(args));
        CustomGameEventManager.RegisterListener("c2s_cast_vote", (_, args) => this.OnCastVote(args));
    }

    /**
     * 处理发起投票请求
     */
    private static OnStartVoteRequest(args: { PlayerID: PlayerID; target_index: EntityIndex }) {
        const initiatorID = args.PlayerID;
        const targetEnt = EntIndexToHScript(args.target_index) as CDOTA_BaseNPC_Hero;

        if (this.currentState !== VoteState.IDLE) {
            this.SendError(initiatorID, "当前正在进行一场审判！");
            return;
        }

        // 1. 检查资源 (光辉 >= 25)
        if (RadianceSystem.GetRadiance() < GAME_SETTINGS.VOTE_COST) {
            this.SendError(initiatorID, "光辉不足，无法开启审判台！");
            return;
        }

        // 2. 扣除资源
        RadianceSystem.ModifyRadiance(-GAME_SETTINGS.VOTE_COST);

        // 3. 开启投票
        this.StartVote(initiatorID, targetEnt.GetPlayerID());
    }

    private static StartVote(initiator: PlayerID, target: PlayerID) {
        this.currentState = VoteState.VOTING;
        this.currentInitiator = initiator;
        this.currentTarget = target;
        this.votes.clear();

        // 自动投发起者一票
        this.votes.set(initiator, true);

        // 通知所有客户端打开 UI
        CustomGameEventManager.Send_ServerToAllClients("s2c_vote_started", {
            initiator: initiator,
            target: target,
            duration: GAME_SETTINGS.VOTE_DURATION
        });

        // 启动倒计时
        this.voteTimer = Timers.CreateTimer(GAME_SETTINGS.VOTE_DURATION, () => {
            this.FinalizeVote();
        });

        print(`[Judgment] Vote Started: Player ${initiator} wants to execute Player ${target}`);
    }

    /**
     * 处理玩家投票
     */
    private static OnCastVote(args: { PlayerID: PlayerID; vote_result: 0 | 1 }) {
        if (this.currentState !== VoteState.VOTING) return;

        // 记录投票
        this.votes.set(args.PlayerID, !!args.vote_result);

        // 更新网表供前端显示实时票型 (可选)
        // this.UpdateVoteNetTable();

        // 检查是否所有存活玩家都投了，如果是，提前结束
        // (简单起见，这里先不写提前结束逻辑，等时间到)
    }

    /**
     * 结算投票
     */
    private static FinalizeVote() {
        this.currentState = VoteState.EXECUTING;

        let agreeCount = 0;
        let totalAlive = 0;

        // 统计票数
        for (let i = 0; i < PlayerResource.GetPlayerCount(); i++) {
            const pid = i as PlayerID;
            if (PlayerResource.IsValidPlayerID(pid)) {
                const hero = PlayerResource.GetSelectedHeroEntity(pid);
                if (hero && hero.IsAlive()) {
                    totalAlive++;
                    if (this.votes.get(pid) === true) {
                        agreeCount++;
                    }
                }
            }
        }

        print(`[Judgment] Result: ${agreeCount} Agree / ${totalAlive} Alive`);

        // 判定：需要 > 50% 存活玩家同意
        if (agreeCount > totalAlive / 2) {
            this.ExecuteTarget();
        } else {
            GameRules.SendCustomMessage("审判驳回！票数不足。", 0, 0);
            CustomGameEventManager.Send_ServerToAllClients("s2c_vote_ended", {
                result: "failed",
                target: this.currentTarget
            });
            this.Reset();
        }
    }

    /**
     * 执行处决逻辑 (GDD 核心博弈)
     */
    private static ExecuteTarget() {
        const targetHero = PlayerResource.GetSelectedHeroEntity(this.currentTarget);
        const initiatorHero = PlayerResource.GetSelectedHeroEntity(this.currentInitiator);

        if (!targetHero) return;

        const isTraitor = RoleManager.IsTraitor(targetHero);

        if (isTraitor) {
            // === 情况 A: 投对了 (杀的是内奸) ===
            GameRules.SendCustomMessage("<font color='#00FF00'>正义执行！叛徒已被处决！</font>", 0, 0);

            // 1. 处死内奸 (复活时间极长)
            targetHero.Kill(undefined, initiatorHero);
            targetHero.SetTimeUntilRespawn(999);

            // 2. 返还被窃取的经验 (GDD)
            this.RefundStolenXP();

        } else {
            // === 情况 B: 投错了 (杀的是好人) ===
            GameRules.SendCustomMessage("<font color='#FF0000'>误判！圣坛染上了无辜者的鲜血！</font>", 0, 0);

            // 1. 处死目标
            targetHero.Kill(undefined, initiatorHero);

            // 2. 发起者直接暴毙 (GDD)
            if (initiatorHero && initiatorHero.IsAlive()) {
                initiatorHero.Kill(undefined, targetHero);
            }

            // 3. 扣除光辉 (GDD)
            RadianceSystem.ModifyRadiance(-GAME_SETTINGS.VOTE_PENALTY);

            // 4. TODO: 给内奸加 Buff (魔神降临)
        }

        CustomGameEventManager.Send_ServerToAllClients("s2c_vote_ended", {
            result: "passed",
            target: this.currentTarget
        });
        this.Reset();
    }

    private static RefundStolenXP() {
        const stolenXP = RoleManager.GetStolenXP();
        if (stolenXP <= 0) return;

        // 找到所有存活的守护者
        const guardians: CDOTA_BaseNPC_Hero[] = [];
        for (let i = 0; i < PlayerResource.GetPlayerCount(); i++) {
            const pid = i as PlayerID;
            if (PlayerResource.IsValidPlayerID(pid)) {
                const hero = PlayerResource.GetSelectedHeroEntity(pid);
                if (hero && hero.IsAlive() && RoleManager.IsGuardian(hero)) {
                    guardians.push(hero);
                }
            }
        }

        if (guardians.length > 0) {
            const share = stolenXP / guardians.length;
            guardians.forEach(hero => {
                hero.AddExperience(share, 0, false, false);
                SendOverheadEventMessage(undefined, OverheadAlert.XP, hero, share, undefined);
            });
            GameRules.SendCustomMessage(`能量回归！每位守护者获得了 ${Math.floor(share)} 经验值。`, 0, 0);
        }

        RoleManager.ResetStolenXP();
    }

    private static Reset() {
        this.currentState = VoteState.IDLE;
        this.currentInitiator = -1;
        this.currentTarget = -1;
        this.votes.clear();
    }

    // src/vscripts/classes/JudgmentSystem.ts

    private static SendError(pid: PlayerID, msg: string) {
        // 1. 获取 PlayerController
        const player = PlayerResource.GetPlayer(pid);

        // 2. 进行空值检查 (类型守卫)
        if (player) {
            // 在这个 if 分支内，player 的类型被自动收窄为 CDOTAPlayerController，不再包含 undefined
            CustomGameEventManager.Send_ServerToPlayer(player, "create_error_message", {message: msg});
        } else {
            print(`[Judgment] Warning: Could not send error message, player ${pid} is undefined.`);
        }
    }
}
