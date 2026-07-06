// ============================================================
// 主角 Mort：跑、跳（可變高度＋coyote＋緩衝）、鐮刀攻擊、受擊
// ============================================================
import Phaser from 'phaser';
import { PLAYER } from '../config.js';
import { MORT_W, MORT_H } from '../art/sprites.js';
import { sfx } from '../audio/sfx.js';

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'mort_idle_0');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setSize(PLAYER.bodyW, PLAYER.bodyH);
    this.body.setOffset((MORT_W - PLAYER.bodyW) / 2, MORT_H - PLAYER.bodyH);
    this.body.setMaxVelocityY(430);
    this.setDepth(10);

    this.facing = 1;
    this.dead = false;
    this.coyoteUntil = 0;
    this.bufferUntil = 0;
    this.attackUntil = 0;
    this.activeFrom = 0;
    this.activeTo = 0;
    this.cooldownUntil = 0;
    this.iframesUntil = 0;
    this.hurtLockUntil = 0;
    this.swingId = 0;
    this.prevJumpHeld = false;

    // 鐮刀判定框（隱形物理體，攻擊窗內啟用）
    this.hitbox = scene.physics.add.image(x, y, 'px2').setVisible(false);
    this.hitbox.body.setAllowGravity(false);
    this.hitbox.body.setSize(PLAYER.hitboxW, PLAYER.hitboxH);
    this.hitbox.body.enable = false;
    this.hitbox.owner = this;
  }

  get attacking() {
    return this.scene.time.now < this.attackUntil;
  }

  get invulnerable() {
    return this.scene.time.now < this.iframesUntil;
  }

  update(controls, time) {
    if (this.dead) return;
    const b = this.body;
    const grounded = b.blocked.down;

    if (grounded) this.coyoteUntil = time + PLAYER.coyoteMs;

    // --- 水平移動 ---
    const locked = time < this.hurtLockUntil;
    if (!locked) {
      let dir = 0;
      if (controls.left) dir -= 1;
      if (controls.right) dir += 1;
      const factor = this.attacking && grounded ? PLAYER.attackMoveFactor : 1;
      const target = dir * PLAYER.runSpeed * factor;
      b.setVelocityX(Phaser.Math.Linear(b.velocity.x, target, PLAYER.accelLerp));
      if (dir !== 0) {
        this.facing = dir;
        this.setFlipX(dir < 0);
      }

      // --- 跳躍 ---
      if (controls.jumpPressed) this.bufferUntil = time + PLAYER.bufferMs;
      if (this.bufferUntil > time && this.coyoteUntil > time) {
        b.setVelocityY(PLAYER.jumpVel);
        this.bufferUntil = 0;
        this.coyoteUntil = 0;
        sfx.jump();
      }
      // 放開跳躍鍵 → 截斷上升（可變跳高）
      if (!controls.jumpHeld && this.prevJumpHeld && b.velocity.y < PLAYER.jumpCutVel) {
        b.setVelocityY(PLAYER.jumpCutVel);
      }

      // --- 攻擊 ---
      if (controls.attackPressed && time > this.cooldownUntil && !this.attacking) {
        this.startAttack(time);
      }
    }
    this.prevJumpHeld = controls.jumpHeld;

    // --- 判定框跟隨與開關 ---
    const active = time >= this.activeFrom && time <= this.activeTo;
    this.hitbox.body.enable = active;
    this.hitbox.setPosition(this.x + this.facing * PLAYER.hitboxDX, this.y - 2);

    // --- 動畫 ---
    if (this.attacking) {
      this.play('mort_atk', true);
    } else if (time < this.hurtLockUntil) {
      this.setTexture('mort_hurt_0');
    } else if (!grounded) {
      this.play(b.velocity.y < 0 ? 'mort_jump' : 'mort_fall', true);
    } else if (Math.abs(b.velocity.x) > 12) {
      this.play('mort_run', true);
    } else {
      this.play('mort_idle', true);
    }
  }

  startAttack(time) {
    this.attackUntil = time + PLAYER.attackTotalMs;
    this.activeFrom = time + PLAYER.attackActiveFromMs;
    this.activeTo = time + PLAYER.attackActiveToMs;
    this.cooldownUntil = this.attackUntil + PLAYER.attackCooldownMs;
    this.swingId += 1;
    this.play('mort_atk');
    sfx.swing();

    // 揮刀殘影＋（升級後）刀氣
    this.scene.time.delayedCall(PLAYER.attackActiveFromMs, () => {
      if (this.dead) return;
      const upgraded = this.scene.registry.get('weaponLv') >= 2;
      const s = this.scene.add.image(this.x + this.facing * 15, this.y - 2, 'slash')
        .setFlipX(this.facing < 0)
        .setAlpha(0.85)
        .setDepth(11)
        .setAngle(this.facing * -18);
      if (upgraded) s.setTint(0x9df2ff);
      this.scene.tweens.add({
        targets: s,
        alpha: 0,
        angle: this.facing * 24,
        scaleX: 1.2,
        duration: 130,
        onComplete: () => s.destroy()
      });
      if (upgraded) this.scene.spawnWave(this);
    });
  }

  takeDamage(dmg, fromX) {
    const time = this.scene.time.now;
    if (this.dead || this.invulnerable) return false;

    const hp = Math.max(0, this.scene.registry.get('hp') - dmg);
    this.scene.registry.set('hp', hp);

    if (hp <= 0) {
      this.die();
      return true;
    }

    sfx.hurt();
    this.iframesUntil = time + PLAYER.iframesMs;
    this.hurtLockUntil = time + PLAYER.hurtLockMs;
    const dir = Math.sign(this.x - fromX) || -this.facing;
    this.body.setVelocity(dir * PLAYER.knockX, PLAYER.knockY);
    this.scene.cameras.main.shake(90, 0.004);

    // 無敵閃爍
    this.scene.tweens.add({
      targets: this,
      alpha: 0.25,
      duration: 70,
      yoyo: true,
      repeat: Math.floor(PLAYER.iframesMs / 140),
      onComplete: () => this.setAlpha(1)
    });
    return true;
  }

  die() {
    if (this.dead) return;
    this.dead = true;
    sfx.die();
    this.hitbox.body.enable = false;
    this.body.checkCollision.none = true;
    this.body.setVelocity(-this.facing * 50, -260);
    this.scene.tweens.add({ targets: this, angle: this.facing * 180, duration: 800 });
    this.scene.events.emit('mort-died');
  }

  reviveAt(x, y) {
    this.dead = false;
    this.setPosition(x, y);
    this.setAngle(0);
    this.setAlpha(1);
    this.body.checkCollision.none = false;
    this.body.setVelocity(0, 0);
    this.iframesUntil = this.scene.time.now + 1200;
    this.hurtLockUntil = 0;
    this.attackUntil = 0;
  }
}
