// ============================================================
// Boss：THE REAPER — 漂浮、突進斬、飛天落斬、（P2）迴旋鐮刀
// ============================================================
import Phaser from 'phaser';
import { BOSS } from '../config.js';
import { sfx } from '../audio/sfx.js';

const GROUND_STAND_Y = 200; // 身體底部貼 arena 地面（222）時的 sprite y
const HOVER_Y = 150;

export default class Reaper extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'reaper_float_0');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setAllowGravity(false);
    this.body.setSize(24, 40);
    this.body.setOffset(12, 10);
    this.setDepth(9);

    this.hp = BOSS.hp;
    this.phase = 1;
    this.alive = true;
    this.state = 'intro';
    this.stateUntil = 0;
    this.lastSwing = -1;
    this.attackIdx = 0;
    this.aimX = 0;
    this.thrown = false;

    this.play('reaper_float_anim');

    // 亡靈綠光暈
    this.glow = scene.add.image(x, y, 'glow_g')
      .setBlendMode(Phaser.BlendModes.ADD).setScale(1.7).setAlpha(0.55).setDepth(8);

    // 進場：自上方飄落（用 Clock 驅動，不依賴 tween，避免分頁凍結類問題）
    this.setAlpha(0);
    this.y = 40;
    this.introDurMs = 1400;
    this.introUntil = scene.time.now + this.introDurMs;
  }

  speedMul() {
    return this.phase === 2 ? BOSS.p2SpeedMul : 1;
  }

  /** 回傳是否實際造成傷害（刀氣靠此決定要不要消失） */
  hitByScythe(swingId) {
    if (!this.alive || this.lastSwing === swingId || this.state === 'intro') return false;
    this.lastSwing = swingId;
    this.hp -= 1;
    this.scene.registry.set('bossHp', Math.max(0, this.hp));
    sfx.bossHit();
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(80, () => { if (this.alive) this.clearTint(); });

    if (this.hp <= 0) {
      this.die();
      return true;
    }
    if (this.phase === 1 && this.hp <= BOSS.phase2At) {
      this.phase = 2;
      sfx.bossRoar();
      this.scene.cameras.main.shake(300, 0.006);
      this.scene.burst(this.x, this.y, 0x8a4df2, 18);
    }
    return true;
  }

  pickAttack(time) {
    const rota = this.phase === 2
      ? ['swoop', 'throw', 'slam', 'throw']
      : ['swoop', 'slam'];
    const atk = rota[this.attackIdx % rota.length];
    this.attackIdx += 1;

    if (atk === 'swoop') {
      this.state = 'swoopTele';
      this.stateUntil = time + BOSS.swoopTelegraphMs;
      this.setTexture('reaper_windup');
      this.body.setVelocity(0, 0);
    } else if (atk === 'slam') {
      this.state = 'slamTele';
      this.stateUntil = time + 260;
      this.body.setVelocity(0, 0);
      this.scene.tweens.add({ targets: this, alpha: 0.15, duration: 200 });
    } else {
      this.state = 'throwCast';
      this.stateUntil = time + 450;
      this.thrown = false;
      this.setTexture('reaper_cast');
      this.body.setVelocity(0, 0);
    }
  }

  update(time, player) {
    if (this.glow?.active) {
      this.glow.setPosition(this.x, this.y - 4).setAlpha((0.4 + 0.15 * Math.sin(time / 220)) * this.alpha);
    }
    if (!this.alive) return;
    const b = this.body;

    switch (this.state) {
      case 'intro': {
        const k = Phaser.Math.Clamp(1 - (this.introUntil - time) / this.introDurMs, 0, 1);
        const e = Math.sin((k * Math.PI) / 2); // easeOut
        this.setAlpha(e);
        this.y = 40 + (HOVER_Y - 40) * e;
        if (time >= this.introUntil) {
          this.state = 'hover';
          this.stateUntil = time + BOSS.hoverMs;
        }
        break;
      }

      case 'hover': {
        this.play('reaper_float_anim', true);
        this.setFlipX(player.x > this.x);
        const dx = player.x - this.x;
        b.setVelocityX(Phaser.Math.Clamp(dx, -60, 60) * (BOSS.hoverSpeed / 60) * this.speedMul());
        b.setVelocityY(Math.sin(time / 300) * 18);
        if (this.y > HOVER_Y + 8) this.y = Phaser.Math.Linear(this.y, HOVER_Y, 0.04);
        if (time > this.stateUntil) this.pickAttack(time);
        break;
      }

      case 'swoopTele': {
        // 蓄力震動預告
        this.x += Math.sin(time / 24) * 0.7;
        this.setFlipX(player.x > this.x);
        if (time > this.stateUntil) {
          this.state = 'swoop';
          this.stateUntil = time + 1200;
          this.aimX = player.x;
          const dir = Math.sign(player.x - this.x) || 1;
          this.setTexture('reaper_swing');
          b.setVelocity(
            dir * BOSS.swoopSpeed * this.speedMul(),
            Phaser.Math.Clamp((player.y - 10 - this.y) * 1.6, -90, 90)
          );
          sfx.swing();
        }
        break;
      }

      case 'swoop': {
        const dir = Math.sign(b.velocity.x);
        const passed = dir > 0 ? this.x > this.aimX + 46 : this.x < this.aimX - 46;
        if (passed || time > this.stateUntil || b.blocked.left || b.blocked.right) {
          this.state = 'hover';
          this.stateUntil = time + BOSS.hoverMs / this.speedMul();
          this.setTexture('reaper_float_0');
        }
        break;
      }

      case 'slamTele': {
        if (time > this.stateUntil) {
          this.setPosition(player.x, 58);
          this.setAlpha(1);
          this.setTexture('reaper_windup');
          this.state = 'slamHang';
          this.stateUntil = time + BOSS.slamHangMs / this.speedMul();
          b.setVelocity(0, 0);
        }
        break;
      }

      case 'slamHang': {
        this.x += Math.sin(time / 30) * 0.5;
        if (time > this.stateUntil) {
          this.state = 'slamFall';
          this.stateUntil = time + 2500; // 保險絲：任何原因卡住都會強制落地
          this.setTexture('reaper_swing');
          b.setVelocity(0, BOSS.slamFallVy);
        }
        break;
      }

      case 'slamFall': {
        if (this.y >= GROUND_STAND_Y || time > this.stateUntil) {
          this.y = GROUND_STAND_Y;
          b.setVelocity(0, 0);
          sfx.bossSlam();
          this.scene.cameras.main.shake(220, 0.008);
          this.scene.burst(this.x - 20, this.y + 20, 0x6f6a8a, 8);
          this.scene.burst(this.x + 20, this.y + 20, 0x6f6a8a, 8);
          if (
            player.body.blocked.down &&
            Math.abs(player.x - this.x) < BOSS.slamRadius &&
            !player.dead
          ) {
            player.takeDamage(BOSS.slamDmg, this.x);
          }
          this.state = 'recover';
          this.stateUntil = time + BOSS.recoverMs / this.speedMul();
        }
        break;
      }

      case 'recover': {
        // 落地硬直：最佳輸出窗口
        if (time > this.stateUntil) {
          this.state = 'hover';
          this.stateUntil = time + (BOSS.hoverMs * 0.7) / this.speedMul();
          this.play('reaper_float_anim', true);
        }
        break;
      }

      case 'throwCast': {
        this.setFlipX(player.x > this.x);
        if (!this.thrown && time > this.stateUntil - 220) {
          this.thrown = true;
          sfx.bossThrow();
          this.scene.spawnBossProjectile(this.x, this.y - 6, player);
        }
        if (time > this.stateUntil) {
          this.state = 'hover';
          this.stateUntil = time + (BOSS.hoverMs * 0.8) / this.speedMul();
          this.play('reaper_float_anim', true);
        }
        break;
      }
    }
  }

  die() {
    if (!this.alive) return;
    this.alive = false;
    this.state = 'dying';
    this.body.enable = false;
    this.scene.registry.set('bossHp', 0);
    sfx.bossDie();

    const sc = this.scene;
    sc.cameras.main.shake(500, 0.006);
    // 連鎖小爆 → 大爆 → 消失
    for (let i = 0; i < 6; i++) {
      sc.time.delayedCall(i * 200, () => {
        if (!sc.scene.isActive()) return;
        sc.burst(
          this.x + Phaser.Math.Between(-20, 20),
          this.y + Phaser.Math.Between(-24, 24),
          i % 2 ? 0x8a4df2 : 0xf2ead8,
          10
        );
        this.setAlpha(1 - i * 0.13);
      });
    }
    sc.time.delayedCall(1300, () => {
      if (!sc.scene.isActive()) return;
      sc.burst(this.x, this.y, 0x8df23c, 26);
      sc.onBossDefeated(this.x, this.y);
      this.glow?.destroy();
      this.destroy();
    });
  }
}
