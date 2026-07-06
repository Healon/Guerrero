// ============================================================
// 雜兵：幽靈（穿牆追蹤）、食屍鬼（巡邏）、跳跳骷髏頭
// ============================================================
import Phaser from 'phaser';
import { ENEMIES } from '../config.js';
import { sfx } from '../audio/sfx.js';

class BaseEnemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, key, cfg) {
    super(scene, x, y, key);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.cfg = cfg;
    this.hp = cfg.hp;
    this.dmg = cfg.dmg;
    this.alive = true;
    this.lastSwing = -1;
    this.setDepth(8);
  }

  /** 回傳是否實際造成傷害（刀氣靠此決定要不要消失） */
  hitByScythe(swingId, fromX) {
    if (!this.alive || this.lastSwing === swingId) return false;
    this.lastSwing = swingId;
    this.hp -= 1;
    sfx.hit();
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(70, () => { if (this.alive) this.clearTint(); });
    if (this.body && !this.body.immovable) {
      this.body.velocity.x = Math.sign(this.x - fromX) * 80;
    }
    this.scene.cameras.main.shake(40, 0.002);
    if (this.hp <= 0) this.die();
    return true;
  }

  die() {
    if (!this.alive) return;
    this.alive = false;
    this.scene.burst(this.x, this.y, this.deathColor || 0xf2ead8, 10);
    if (Math.random() < this.cfg.dropChance) {
      this.scene.spawnPickup(this.x, this.y - 6, 'skull');
    }
    this.body.enable = false;
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleY: 0.4,
      duration: 160,
      onComplete: () => this.destroy()
    });
  }
}

export class Ghost extends BaseEnemy {
  constructor(scene, x, y) {
    super(scene, x, y, 'ghost_0', ENEMIES.ghost);
    this.body.setAllowGravity(false);
    this.body.setSize(11, 11);
    this.aggroed = false;
    this.t0 = Math.random() * Math.PI * 2;
    this.homeX = x;
    this.homeY = y;
    this.deathColor = 0x9df2dc;
    this.setAlpha(0.9);
    this.play('ghost_anim');
  }

  update(time, player) {
    if (!this.alive) return;
    const d = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    if (!this.aggroed && d < this.cfg.aggroR) this.aggroed = true;
    if (this.aggroed && d > this.cfg.dropR) this.aggroed = false;

    const t = time / 1000;
    if (this.aggroed && !player.dead) {
      const ang = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y - 6);
      this.body.setVelocity(
        Math.cos(ang) * this.cfg.speed,
        Math.sin(ang) * this.cfg.speed + Math.sin(t * this.cfg.bobHz * Math.PI) * this.cfg.bobAmp
      );
      this.setFlipX(player.x < this.x);
    } else {
      this.body.setVelocity(
        Math.cos(t * 0.7 + this.t0) * 9,
        Math.sin(t * this.cfg.bobHz + this.t0) * this.cfg.bobAmp
      );
    }
    this.setAlpha(0.8 + 0.15 * Math.sin(t * 3 + this.t0));
  }
}

export class Ghoul extends BaseEnemy {
  constructor(scene, x, y, minX, maxX) {
    super(scene, x, y, 'ghoul_0', ENEMIES.ghoul);
    this.body.setSize(10, 18);
    this.body.setOffset(3, 2);
    this.minX = minX;
    this.maxX = maxX;
    this.dir = 1;
    this.deathColor = 0x7f5ea8;
    this.play('ghoul_anim');
  }

  update() {
    if (!this.alive) return;
    if (this.x >= this.maxX || this.body.blocked.right) this.dir = -1;
    else if (this.x <= this.minX || this.body.blocked.left) this.dir = 1;
    this.body.setVelocityX(this.dir * this.cfg.speed);
    this.setFlipX(this.dir < 0);
  }
}

export class Hopper extends BaseEnemy {
  constructor(scene, x, y, minX, maxX) {
    super(scene, x, y, 'hopper', ENEMIES.hopper);
    this.body.setSize(10, 8);
    this.body.setBounce(0, 0);
    this.minX = minX;
    this.maxX = maxX;
    this.nextHopAt = 0;
    this.patrolDir = 1;
    this.deathColor = 0xf2ead8;
  }

  update(time, player) {
    if (!this.alive) return;
    const grounded = this.body.blocked.down;
    if (grounded) {
      this.body.setVelocityX(0);
      if (this.scaleY !== 1) this.setScale(1, 1);
      if (time > this.nextHopAt) {
        this.nextHopAt = time + this.cfg.hopEveryMs;
        const d = Math.abs(player.x - this.x);
        let dir;
        if (d < this.cfg.aggroR && !player.dead) {
          dir = Math.sign(player.x - this.x) || 1;
        } else {
          if (this.x >= this.maxX) this.patrolDir = -1;
          if (this.x <= this.minX) this.patrolDir = 1;
          dir = this.patrolDir;
        }
        this.body.setVelocity(dir * this.cfg.hopVx, this.cfg.hopVy);
        this.setFlipX(dir < 0);
        this.setScale(0.9, 1.15);
      }
    }
  }
}
