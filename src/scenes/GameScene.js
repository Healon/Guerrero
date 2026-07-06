// ============================================================
// 遊戲主場景：墓園之夜
// ============================================================
import Phaser from 'phaser';
import { GAME_W, GAME_H, TILE, PHYS, PLAYER, COMBAT, BOSS, WEAPON } from '../config.js';
import { LEVEL, worldW, tx, ky, groundHAt } from '../level/graveyard.js';
import Player from '../entities/Player.js';
import { Ghost, Ghoul, Hopper } from '../entities/enemies.js';
import Reaper from '../entities/Reaper.js';
import { sfx, startBgm, stopBgm } from '../audio/sfx.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  init() {
    this.registry.set('hp', PLAYER.maxHp);
    this.registry.set('maxHp', PLAYER.maxHp);
    this.registry.set('lives', PLAYER.lives);
    this.registry.set('skulls', 0);
    this.registry.set('bossHp', null);
    this.registry.set('bossMax', null);
    this.registry.set('paused', false);
    this.registry.set('weaponLv', 1); // 升級跨死亡保留，新一輪重置

    this.bossStarted = false;
    this.boss = null;
    this.transitioning = false;
    this.enemyList = [];
    this.vpadPrev = { jump: false, attack: false };
  }

  // ---------------------------------------------------------- create
  create() {
    this.physics.world.gravity.y = PHYS.gravity;
    this.physics.world.setBounds(0, -80, worldW, GAME_H + 200);

    this.buildParallax();
    this.buildTerrain();
    this.buildDecor();

    // 主角
    const startH = groundHAt(LEVEL.playerStartT) ?? 3;
    this.checkpoint = { x: tx(LEVEL.playerStartT), y: ky(startH) - 12 };
    this.player = new Player(this, this.checkpoint.x, this.checkpoint.y);

    this.buildPickupsAndCrates();
    this.buildEnemies();
    this.buildBossTrigger();

    // ---- 碰撞 ----
    const solids = [this.terrain, this.crates, this.gateGroup];
    solids.forEach((g) => this.physics.add.collider(this.player, g));
    this.physics.add.collider(this.player, this.planks);
    this.physics.add.collider(this.groundEnemies, this.terrain);
    this.physics.add.collider(this.groundEnemies, this.planks);
    this.physics.add.collider(this.groundEnemies, this.crates);
    this.physics.add.collider(this.pickups, this.terrain);
    this.physics.add.collider(this.pickups, this.planks);
    this.physics.add.collider(this.pickups, this.crates);

    // ---- 判定 ----
    const hitEnemy = (hb, e) => e.hitByScythe(this.player.swingId, this.player.x);
    this.physics.add.overlap(this.player.hitbox, this.airEnemies, hitEnemy);
    this.physics.add.overlap(this.player.hitbox, this.groundEnemies, hitEnemy);
    this.physics.add.overlap(this.player.hitbox, this.crates, (hb, c) => this.breakCrate(c));

    const contact = (p, e) => { if (e.alive) p.takeDamage(e.dmg, e.x); };
    this.physics.add.overlap(this.player, this.airEnemies, contact);
    this.physics.add.overlap(this.player, this.groundEnemies, contact);

    this.physics.add.overlap(this.player, this.spikes, () => {
      const p = this.player;
      const fromX = p.x + (Math.sign(p.body.velocity.x) || p.facing) * 6;
      if (p.takeDamage(COMBAT.spikeDmg, fromX)) {
        sfx.spike();
        if (!p.dead) p.body.setVelocityY(-230);
      }
    });

    this.physics.add.overlap(this.player, this.pickups, (p, item) => this.collect(item));

    this.lanternZones.forEach((zone) => {
      this.physics.add.overlap(this.player, zone, () => this.activateCheckpoint(zone));
    });

    // 刀氣判定：沿用近戰的 swingId 去重 → 同一揮不會近戰＋刀氣雙倍傷害
    const waveHit = (w, e) => {
      if (!w.active || !e.alive) return;
      if (e.hitByScythe(w.swingId, w.x)) this.destroyWave(w);
    };
    this.physics.add.overlap(this.waves, this.airEnemies, waveHit);
    this.physics.add.overlap(this.waves, this.groundEnemies, waveHit);
    this.physics.add.overlap(this.waves, this.crates, (w, c) => {
      if (!w.active || !c.active) return;
      this.breakCrate(c);
      this.destroyWave(w);
    });
    this.physics.add.overlap(this.waves, this.terrain, (w) => this.destroyWave(w));
    this.physics.add.overlap(this.waves, this.gateGroup, (w) => this.destroyWave(w));

    // ---- 鏡頭 ----
    const cam = this.cameras.main;
    cam.setBounds(0, 0, worldW, GAME_H);
    cam.startFollow(this.player, true, 0.14, 0.16);
    cam.setDeadzone(46, 160);
    cam.setFollowOffset(-18, 10);
    cam.fadeIn(350, 6, 5, 12);

    // ---- 輸入 ----
    this.keys = this.input.keyboard.addKeys(
      'LEFT,RIGHT,UP,DOWN,A,D,W,Z,X,J,K,SPACE,P,ESC'
    );
    if (!this.registry.get('vpad')) {
      this.registry.set('vpad', { left: false, right: false, jump: false, attack: false });
    }

    // ---- 事件 ----
    // scene.restart() 沿用同一實例且不清空自訂事件監聽，先 off 防累積
    this.events.off('mort-died');
    this.events.once('shutdown', () => stopBgm());
    this.events.on('mort-died', () => this.onPlayerDied());

    // ---- UI ----
    if (this.scene.isActive('UI')) this.scene.stop('UI');
    this.scene.launch('UI');

    startBgm('level');

    // ---- 測試/除錯掛鉤 ----
    const params = new URLSearchParams(location.search);
    if (params.get('debug') === '1') {
      window.__DBG = {
        scene: this,
        player: this.player,
        warp: (t) => {
          const h = groundHAt(t) ?? 3;
          this.player.setPosition(tx(t), ky(h) - 14);
        },
        hurtBoss: (n = 1) => {
          for (let i = 0; i < n; i++) this.boss?.hitByScythe(-1000 - Math.random(), this.player.x);
        },
        god: () => { this.player.iframesUntil = Number.MAX_SAFE_INTEGER; }
      };
    }
  }

  // ---------------------------------------------------------- 地形
  buildTerrain() {
    this.terrain = this.physics.add.staticGroup();
    this.planks = this.physics.add.staticGroup();
    this.spikes = this.physics.add.staticGroup();
    this.gateGroup = this.physics.add.staticGroup();

    const solidRect = (group, x, y, w, h) => {
      const r = this.add.rectangle(x, y, w, h).setOrigin(0, 0).setVisible(false);
      group.add(r);
      return r;
    };

    // 地面段：合併碰撞體 + 逐磚視覺
    for (const [x0, x1, h] of LEVEL.grounds) {
      const topY = GAME_H - h * TILE;
      solidRect(this.terrain, x0 * TILE, topY, (x1 - x0 + 1) * TILE, h * TILE);
      for (let t = x0; t <= x1; t++) {
        const stone = t >= LEVEL.stoneFromT;
        for (let k = 1; k <= h; k++) {
          const yTop = GAME_H - k * TILE;
          const key = stone ? 'tile_stone' : (k === h ? 'tile_grass' : 'tile_dirt');
          this.add.image(t * TILE + 8, yTop + 8, key).setDepth(0);
        }
      }
    }

    // 石台（實心）
    for (const [x0, x1, k] of LEVEL.ledges) {
      const topY = ky(k);
      solidRect(this.terrain, x0 * TILE, topY, (x1 - x0 + 1) * TILE, TILE);
      for (let t = x0; t <= x1; t++) {
        this.add.image(t * TILE + 8, topY + 8, 'tile_stone').setDepth(0);
      }
    }

    // 單向木板
    for (const [x0, x1, k] of LEVEL.planks) {
      const topY = ky(k);
      const r = solidRect(this.planks, x0 * TILE, topY, (x1 - x0 + 1) * TILE, 6);
      r.body.checkCollision.down = false;
      r.body.checkCollision.left = false;
      r.body.checkCollision.right = false;
      for (let t = x0; t <= x1; t++) {
        this.add.image(t * TILE + 8, topY + 8, 'tile_plank').setDepth(0);
      }
    }

    // 尖刺（非實心，觸碰傷害）
    for (const [x0, x1, k] of LEVEL.spikes) {
      const topY = ky(k);
      const zone = this.add.rectangle(x0 * TILE, topY + 6, (x1 - x0 + 1) * TILE, 10)
        .setOrigin(0, 0).setVisible(false);
      this.spikes.add(zone);
      for (let t = x0; t <= x1; t++) {
        this.add.image(t * TILE + 8, topY + 8, 'tile_spike').setDepth(1);
      }
    }

    // 世界左右牆
    solidRect(this.terrain, -14, 0, 14, GAME_H);
    solidRect(this.terrain, worldW, 0, 14, GAME_H);
  }

  // ---------------------------------------------------------- 背景
  buildParallax() {
    this.add.image(GAME_W / 2, GAME_H / 2, 'sky')
      .setDisplaySize(GAME_W, GAME_H).setScrollFactor(0).setDepth(-100);
    this.pxStars = this.add.tileSprite(GAME_W / 2, 56, GAME_W, 90, 'stars')
      .setScrollFactor(0).setDepth(-95);
    this.add.image(404, 52, 'moon').setScrollFactor(0).setDepth(-94);
    this.add.image(404, 52, 'glow_g').setScrollFactor(0)
      .setBlendMode(Phaser.BlendModes.ADD).setScale(2.2).setAlpha(0.45).setDepth(-94);
    this.pxHills = this.add.tileSprite(GAME_W / 2, 196, GAME_W, 70, 'farhills')
      .setScrollFactor(0).setDepth(-90);
    this.pxMist = this.add.tileSprite(GAME_W / 2, 216, GAME_W, 22, 'mist')
      .setScrollFactor(0).setDepth(-40).setAlpha(0.75);
  }

  // ---------------------------------------------------------- 裝飾
  buildDecor() {
    for (const t of LEVEL.trees) {
      const h = groundHAt(t) ?? 3;
      this.add.image(tx(t), ky(h) - 26, 'tree').setDepth(-55).setAlpha(0.92);
    }
    for (const [x0, x1] of LEVEL.fences) {
      const h = groundHAt(x0) ?? 3;
      this.add.tileSprite(
        ((x0 + x1 + 1) / 2) * TILE, ky(h) - 10, (x1 - x0 + 1) * TILE, 20, 'fence'
      ).setDepth(-50).setAlpha(0.8);
    }
    for (const { t, kind } of LEVEL.graves) {
      const h = groundHAt(t) ?? 3;
      const key = kind === 2 ? 'grave2' : 'grave1';
      const img = this.add.image(tx(t), 0, key).setDepth(-20);
      img.y = ky(h) - img.height / 2 + 1;
      if (t % 3 === 0) img.setFlipX(true);
    }

    // 檢查點燈籠
    this.lanternZones = [];
    for (const t of LEVEL.lanterns) {
      const h = groundHAt(t) ?? 3;
      const baseY = ky(h);
      const lantern = this.add.image(tx(t), baseY - 13, 'lantern').setDepth(-10);
      const zone = this.add.zone(tx(t), baseY - 20, 30, 60);
      this.physics.add.existing(zone, true);
      zone.lanternImg = lantern;
      zone.activated = false;
      zone.t = t;
      this.lanternZones.push(zone);
    }
  }

  activateCheckpoint(zone) {
    if (zone.activated || this.player.dead) return;
    zone.activated = true;
    const x = zone.x, y = zone.y;
    this.checkpoint = { x, y: y + 8 };
    this.registry.set('hp', this.registry.get('maxHp'));
    sfx.checkpoint();

    const flame = this.add.sprite(x, zone.lanternImg.y - 8, 'flame_0').setDepth(-9);
    flame.play('flame_anim');
    this.add.image(x, zone.lanternImg.y - 6, 'glow_y')
      .setBlendMode(Phaser.BlendModes.ADD).setDepth(-9);

    const txt = this.add.text(x, y - 46, 'CHECKPOINT', {
      fontFamily: 'monospace', fontSize: '9px', color: '#ffd94c'
    }).setOrigin(0.5).setDepth(50);
    this.tweens.add({
      targets: txt, y: y - 60, alpha: 0, duration: 1100,
      onComplete: () => txt.destroy()
    });
  }

  // ---------------------------------------------------------- 物件
  buildPickupsAndCrates() {
    this.pickups = this.physics.add.group();
    this.crates = this.physics.add.staticGroup();

    for (const { t, k } of LEVEL.crates) {
      const c = this.crates.create(tx(t), ky(k) - 8, 'crate');
      c.setDepth(5);
      c.refreshBody();
    }
    for (const { t, k } of LEVEL.skulls) {
      this.spawnStaticSkull(tx(t), ky(k) - 8);
    }

    // 武器升級道具
    for (const pu of LEVEL.powerups || []) {
      const x = tx(pu.t);
      const y = ky(pu.k) - 7;
      const glow = this.add.image(x, y, 'glow_c')
        .setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.6).setDepth(5);
      const item = this.pickups.create(x, y, 'item_wave_0');
      item.kind = pu.kind;
      item.setDepth(6);
      item.body.setAllowGravity(false);
      item.body.setSize(12, 12);
      item.glowImg = glow;
      item.play('item_wave_anim');
    }

    // 刀氣
    this.waves = this.physics.add.group({ allowGravity: false });
  }

  spawnStaticSkull(x, y) {
    const s = this.pickups.create(x, y, 'skullp_0');
    s.kind = 'skull';
    s.body.setAllowGravity(false);
    s.body.setSize(7, 7);
    s.play('skullp_anim');
    this.tweens.add({
      targets: s, y: y - 4, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });
  }

  spawnPickup(x, y, kind, vx = null) {
    const key = kind === 'heart' ? 'heart' : 'skullp_0';
    const item = this.pickups.create(x, y, key);
    item.kind = kind;
    item.setDepth(6);
    item.body.setSize(7, 7);
    item.setBounce(0.4);
    item.setDrag(26, 0);
    item.setVelocity(vx ?? Phaser.Math.Between(-70, 70), Phaser.Math.Between(-170, -100));
    if (kind === 'skull') item.play('skullp_anim');

    this.time.delayedCall(COMBAT.pickupLifeMs - 1600, () => {
      if (item.active) {
        this.tweens.add({ targets: item, alpha: 0.2, duration: 160, yoyo: true, repeat: 8 });
      }
    });
    this.time.delayedCall(COMBAT.pickupLifeMs, () => { if (item.active) item.destroy(); });
    return item;
  }

  collect(item) {
    if (!item.active || this.player.dead) return;
    if (item.kind === 'wave') {
      this.registry.set('weaponLv', 2);
      sfx.powerup();
      this.burst(item.x, item.y, 0x9df2ff, 16);
      this.cameras.main.flash(180, 40, 120, 120);
      const txt = this.add.text(item.x, item.y - 14, 'SPIRIT BLADE!', {
        fontFamily: 'monospace', fontSize: '11px', fontStyle: 'bold',
        color: '#9df2ff', stroke: '#12101c', strokeThickness: 3
      }).setOrigin(0.5).setDepth(60);
      const sub = this.add.text(item.x, item.y - 2, 'SCYTHE NOW FIRES WAVES', {
        fontFamily: 'monospace', fontSize: '7px', color: '#8df23c'
      }).setOrigin(0.5).setDepth(60);
      this.tweens.add({
        targets: [txt, sub], y: '-=18', alpha: 0, duration: 1800,
        onComplete: () => { txt.destroy(); sub.destroy(); }
      });
      item.glowImg?.destroy();
      item.destroy();
      return;
    }
    if (item.kind === 'heart') {
      const max = this.registry.get('maxHp');
      this.registry.set('hp', Math.min(max, this.registry.get('hp') + COMBAT.heartHeal));
      sfx.heart();
    } else {
      this.registry.set('skulls', this.registry.get('skulls') + 1);
      sfx.pickup();
    }
    this.burst(item.x, item.y, 0xffffff, 4);
    item.destroy();
  }

  breakCrate(crate) {
    if (!crate.active) return;
    sfx.crate();
    this.burst(crate.x, crate.y, 0x7a5a34, 12);
    this.cameras.main.shake(50, 0.002);

    const n = Phaser.Math.Between(COMBAT.crateSkullMin, COMBAT.crateSkullMax);
    for (let i = 0; i < n; i++) {
      this.spawnPickup(crate.x, crate.y - 6, 'skull', Phaser.Math.Between(-80, 80));
    }
    if (Math.random() < COMBAT.heartChance) {
      this.spawnPickup(crate.x, crate.y - 10, 'heart', Phaser.Math.Between(-40, 40));
    }
    crate.destroy();
  }

  // ---------------------------------------------------------- 敵人
  buildEnemies() {
    this.airEnemies = this.physics.add.group();
    this.groundEnemies = this.physics.add.group();

    for (const e of LEVEL.enemies) {
      if (e.t === 'ghost') {
        const g = new Ghost(this, tx(e.x), e.y);
        this.airEnemies.add(g, false);
        g.body.setAllowGravity(false);
        this.enemyList.push(g);
      } else if (e.t === 'ghoul') {
        const h = groundHAt(e.x) ?? 3;
        const g = new Ghoul(this, tx(e.x), ky(h) - 11, tx(e.r[0]), tx(e.r[1]));
        this.groundEnemies.add(g, false);
        this.enemyList.push(g);
      } else if (e.t === 'hopper') {
        const h = groundHAt(e.x) ?? 3;
        const g = new Hopper(this, tx(e.x), ky(h) - 6, tx(e.r[0]), tx(e.r[1]));
        this.groundEnemies.add(g, false);
        this.enemyList.push(g);
      }
    }
  }

  // ---------------------------------------------------------- Boss
  buildBossTrigger() {
    this.projs = this.physics.add.group();
    this.physics.add.overlap(this.player, this.projs, (p, proj) => {
      if (proj.active) p.takeDamage(BOSS.projDmg, proj.x);
    });

    const trigger = this.add.zone(tx(LEVEL.boss.triggerT), GAME_H - 90, 24, 180);
    this.physics.add.existing(trigger, true);
    this.physics.add.overlap(this.player, trigger, () => this.startBossFight());
  }

  startBossFight() {
    if (this.bossStarted) return;
    this.bossStarted = true;

    // 封門
    const gT = LEVEL.boss.gateT;
    const gateRect = this.add.rectangle(gT * TILE, GAME_H - 8 * TILE, TILE, 5 * TILE)
      .setOrigin(0, 0).setVisible(false);
    this.gateGroup.add(gateRect);
    for (let k = 4; k <= 8; k++) {
      const img = this.add.image(gT * TILE + 8, GAME_H - k * TILE + 8, 'tile_stone')
        .setDepth(2).setTint(0x9a8fd0);
      img.setAlpha(0);
      this.tweens.add({ targets: img, alpha: 1, duration: 300, delay: (8 - k) * 70 });
    }
    this.cameras.main.shake(250, 0.005);
    sfx.bossRoar();

    // 鏡頭鎖進競技場
    this.cameras.main.setBounds(gT * TILE, 0, worldW - gT * TILE, GAME_H);

    this.boss = new Reaper(this, tx(LEVEL.boss.spawnT), 40);
    this.physics.add.overlap(this.player, this.boss, (p, b) => {
      if (b.alive && b.state !== 'intro') p.takeDamage(BOSS.contactDmg, b.x);
    });
    this.physics.add.overlap(this.player.hitbox, this.boss, () => {
      this.boss.hitByScythe(this.player.swingId);
    });
    this.physics.add.overlap(this.boss, this.waves, (b, w) => {
      if (this.boss?.alive && w.active && this.boss.hitByScythe(w.swingId)) {
        this.destroyWave(w);
      }
    });

    this.registry.set('bossMax', BOSS.hp);
    this.registry.set('bossHp', BOSS.hp);
    startBgm('boss');
  }

  spawnBossProjectile(x, y, player) {
    const proj = this.projs.create(x, y, 'proj_scythe');
    proj.setDepth(9);
    proj.body.setAllowGravity(false);
    proj.body.setCircle(6, 2, 2);
    proj.born = this.time.now;
    proj.returning = false;
    const ang = Phaser.Math.Angle.Between(x, y, player.x, player.y - 4);
    proj.setVelocity(Math.cos(ang) * BOSS.throwSpeed, Math.sin(ang) * BOSS.throwSpeed);
  }

  onBossDefeated(x, y) {
    this.boss = null; // Reaper 隨後 destroy，殘留引用會讓 update 每幀摸到已銷毀物件
    this.registry.set('bossMax', null);
    this.registry.set('bossHp', null);
    stopBgm();

    // 骷髏頭獎勵飛向玩家
    for (let i = 0; i < BOSS.skullReward; i++) {
      const img = this.add.image(
        x + Phaser.Math.Between(-30, 30),
        y + Phaser.Math.Between(-30, 20),
        'skullp_0'
      ).setDepth(20);
      this.tweens.add({
        targets: img,
        x: () => this.player.x,
        y: () => this.player.y - 6,
        delay: 300 + i * 90,
        duration: 420,
        ease: 'Cubic.easeIn',
        onComplete: () => {
          this.registry.set('skulls', this.registry.get('skulls') + 1);
          if (i % 2 === 0) sfx.pickup();
          img.destroy();
        }
      });
    }

    this.time.delayedCall(2600, () => {
      sfx.clear();
      this.scene.pause();
      this.scene.launch('Clear', { skulls: this.registry.get('skulls') });
    });
  }

  // ---------------------------------------------------------- 死亡與重生
  onPlayerDied() {
    if (this.transitioning) return;
    this.transitioning = true;
    this.burst(this.player.x, this.player.y, 0xf2ead8, 14);

    const lives = this.registry.get('lives') - 1;
    this.registry.set('lives', lives);

    this.time.delayedCall(1100, () => {
      if (lives > 0) {
        this.cameras.main.fadeOut(250, 6, 5, 12);
        this.time.delayedCall(300, () => {
          this.registry.set('hp', this.registry.get('maxHp'));
          this.player.reviveAt(this.checkpoint.x, this.checkpoint.y);
          this.cameras.main.fadeIn(250, 6, 5, 12);
          this.transitioning = false;
        });
      } else {
        stopBgm();
        this.scene.pause();
        this.scene.launch('Over');
      }
    });
  }

  // ---------------------------------------------------------- 刀氣
  spawnWave(player) {
    const w = this.waves.create(player.x + player.facing * 14, player.y - 4, 'wave_0');
    w.setDepth(11);
    w.swingId = player.swingId;
    w.bornX = w.x;
    w.bornAt = this.time.now;
    w.setFlipX(player.facing < 0);
    w.body.setAllowGravity(false);
    w.body.setSize(9, 14);
    w.setVelocityX(player.facing * WEAPON.waveSpeed);
    w.play('wave_anim');
    sfx.wave();
  }

  destroyWave(w, fx = true) {
    if (!w.active) return;
    if (fx) this.burst(w.x, w.y, 0x9df2ff, 4);
    w.destroy();
  }

  // ---------------------------------------------------------- 特效
  burst(x, y, tint, n = 10) {
    const em = this.add.particles(x, y, 'px2', {
      speed: { min: 40, max: 140 },
      angle: { min: 0, max: 360 },
      lifespan: { min: 240, max: 600 },
      scale: { start: 1.4, end: 0 },
      gravityY: 320,
      tint,
      emitting: false
    }).setDepth(30);
    em.explode(n);
    this.time.delayedCall(900, () => em.destroy());
  }

  // ---------------------------------------------------------- update
  update(time) {
    const k = this.keys;
    const vpad = this.registry.get('vpad');

    // 暫停
    if (Phaser.Input.Keyboard.JustDown(k.P) || Phaser.Input.Keyboard.JustDown(k.ESC)) {
      this.registry.set('paused', true);
      this.scene.pause();
      return;
    }

    const jumpHeld = k.Z.isDown || k.SPACE.isDown || k.UP.isDown || k.W.isDown || vpad.jump;
    const jumpPressed =
      Phaser.Input.Keyboard.JustDown(k.Z) ||
      Phaser.Input.Keyboard.JustDown(k.SPACE) ||
      Phaser.Input.Keyboard.JustDown(k.UP) ||
      Phaser.Input.Keyboard.JustDown(k.W) ||
      (vpad.jump && !this.vpadPrev.jump);
    const attackPressed =
      Phaser.Input.Keyboard.JustDown(k.X) ||
      Phaser.Input.Keyboard.JustDown(k.J) ||
      Phaser.Input.Keyboard.JustDown(k.K) ||
      (vpad.attack && !this.vpadPrev.attack);
    this.vpadPrev.jump = vpad.jump;
    this.vpadPrev.attack = vpad.attack;

    this.player.update({
      left: k.LEFT.isDown || k.A.isDown || vpad.left,
      right: k.RIGHT.isDown || k.D.isDown || vpad.right,
      jumpHeld,
      jumpPressed,
      attackPressed
    }, time);

    // 深淵墜落
    if (!this.player.dead && this.player.y > GAME_H + 70 && !this.transitioning) {
      this.player.dead = true;
      sfx.die();
      this.events.emit('mort-died');
    }

    // 敵人
    for (const e of this.enemyList) {
      if (e.active && e.alive) e.update(time, this.player);
    }
    if (this.boss) this.boss.update(time, this.player);

    // Boss 迴旋鐮刀
    for (const proj of this.projs.getChildren()) {
      if (!proj.active) continue;
      proj.rotation += 0.32;
      if (!proj.returning && time > proj.born + BOSS.throwBoomerangMs) {
        proj.returning = true;
        const target = this.boss?.alive ? this.boss : this.player;
        const ang = Phaser.Math.Angle.Between(proj.x, proj.y, target.x, target.y - 30);
        proj.setVelocity(Math.cos(ang) * BOSS.throwSpeed * 1.25, Math.sin(ang) * BOSS.throwSpeed * 1.25);
      }
      const expired = time > proj.born + 3000;
      const backHome = proj.returning && this.boss?.alive &&
        Phaser.Math.Distance.Between(proj.x, proj.y, this.boss.x, this.boss.y) < 24;
      if (expired || backHome) proj.destroy();
    }

    // 刀氣：射程與壽命
    for (const w of this.waves.getChildren()) {
      if (!w.active) continue;
      if (Math.abs(w.x - w.bornX) > WEAPON.waveMaxDist || time > w.bornAt + WEAPON.waveLifeMs) {
        this.destroyWave(w, false);
      }
    }

    // 視差
    const sx = this.cameras.main.scrollX;
    this.pxStars.tilePositionX = sx * 0.06;
    this.pxHills.tilePositionX = sx * 0.18;
    this.pxMist.tilePositionX = sx * 0.5 + time * 0.004;
  }
}
