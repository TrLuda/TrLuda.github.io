function addScript(src) {
    let script = document.createElement('script');
    script.src = src;
    script.async = false;
    document.head.appendChild(script);
}

let section, sectionMain, elements, script;
let nav = document.querySelector('nav');

let listener = function(event) {
    elements = document.getElementsByTagName('section');
    for (let i = 0; i < elements.length; i++) {
        if (elements[i].getElementsByClassName != 'visibility') {
            elements[i].classList.add('visibility');
        }        
    }
    section = document.getElementById(event.target.innerHTML);
    section.classList.remove('visibility');    
    
    if (event.target.innerHTML === 'play') {  
        if (section.childElementCount) {
            section.removeChild('canvas');
        } 
        play();
        return;        
    }      
}  

nav.addEventListener('click', listener);

function play() {
    const game = new Phaser.Game(
        1000,
        600,
        Phaser.AUTO,
        'play',
        {
            preload: preload,
            create: create,
            update: update
        }
    );

    function preload() {
        game.load.image('space', './img/space.jpg');
        game.load.image('player', './img/spaceship.png');
        game.load.image('bullet', './img/bullet.png');
        game.load.image('enemyBullet', './img/bullet-UFO.png');
        game.load.image('health', './img/health.png');
        game.load.spritesheet('enemy', './img/ufo.png', 70, 35);
        game.load.spritesheet('explosion', './img/explosion.png', 65, 45);
        game.load.audio('music', "./audio/space.mp3"); 
    }

    let background, player, enemies , bullet, bullets, enemyBullets, cursors, lives, explosions, shootButton, music; 
    let score = 0, bulletTime = 0, firingTimer = 0;
    let scoreText, stateText, scoreString = '';
    let livingEnemies = [];
    
    function create() {
        game.physics.startSystem(Phaser.Physics.ARCADE);

        music = game.add.audio('music');        
        music.play();
    
        background = game.add.tileSprite(0, 0, 1000, 600, 'space');
         
        player = game.add.sprite(500, 550, 'player');
        player.anchor.setTo(0.5, 0.5);
        player.enableBody = true;
        game.physics.enable(player, Phaser.Physics.ARCADE);

        cursors = game.input.keyboard.createCursorKeys();
        shootButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    
        enemies = game.add.group();
        enemies.enableBody = true;
        enemies.physicsBodyType = Phaser.Physics.ARCADE;
        createEnemies();

        bullets = game.add.group();
        bullets.enableBody = true;
        bullets.physicsBodyType = Phaser.Physics.ARCADE;
        bullets.createMultiple(30, 'bullet');
        bullets.setAll('anchor.x', 0.5);
        bullets.setAll('anchor.y', 0.5);
        bullets.setAll('outOfBoundsKill', true);
        bullets.setAll('checkWorldBounds', true);

        enemyBullets = game.add.group();
        enemyBullets.enableBody = true;
        enemyBullets.physicsBodyType = Phaser.Physics.ARCADE;
        enemyBullets.createMultiple(30, 'enemyBullet');
        enemyBullets.setAll('anchor.x', 0.5);
        enemyBullets.setAll('anchor.y', 0.5);
        enemyBullets.setAll('outOfBoundsKill', true);
        enemyBullets.setAll('checkWorldBounds', true);

        explosions = game.add.group();
        explosions.createMultiple(30, 'explosion');
        explosions.forEach(setupExplosion, this);

        scoreString = 'score : ';
        scoreText = game.add.text(16, 16, scoreString + score, { font: '32px', fill: '#c4ddee' });
    
        lives = game.add.group();
        game.add.text(game.world.width - 200, 10, 'lives : ', { font: '32px', fill: '#c4ddee' });
       
        for (let i = 0; i < 3; i++) {
            let health = lives.create(game.world.width - 100 + (40 * i), 30, 'health');
            health.anchor.setTo(0.5, 0.5);
        }
    
        stateText = game.add.text(game.world.centerX, game.world.centerY,' ', { font: '60px', fill: '#a1d4e0' });
        stateText.anchor.setTo(0.5, 0.5);
        stateText.visible = false;      
    }

    function createEnemies() {  
       for (let y = 0; y < 3; y++) {
            for (let x = 0; x < 12; x++) {
               let enemy = enemies.create(x * 73 + 100, y * 60 + 70, 'enemy', 3);
               enemy.anchor.setTo(0.5, 0.5);
               let tween = game.add.tween(enemy).to( { x: x * 73 + 100 + Math.random()*70, y: y * 60 + 70 + Math.random()*50 }, 2000, Phaser.Easing.Linear.None, true, 0, 1000, true);
               tween.onLoop.add(descend, this);
            }
        }    
    }

    function descend() {        
        enemies.y += 5;    
    }

    function setupExplosion (explosion) {        
        explosion.anchor.x = 0;
        explosion.anchor.y = 0.5;
        explosion.animations.add('explosion');        
    }

    function update() { 
        background.tilePosition.y += 1;

        if (player.alive) {       
            player.body.velocity.setTo(0, 0);
    
            if (cursors.left.isDown) {
                player.body.velocity.x = -250;
            }
            else if (cursors.right.isDown) {
                player.body.velocity.x = 250;
            }    
            if (shootButton.isDown) {
                fireBullet();
            }    
            if (game.time.now > firingTimer) {
                enemyFires();
            }   
            game.physics.arcade.overlap(bullets, enemies, collisionHandler, null, this);
            game.physics.arcade.overlap(enemyBullets, player, enemyHitsPlayer, null, this);          
        }  
    }

    function fireBullet () {
        if (game.time.now > bulletTime) {        
            let bullet = bullets.getFirstExists(false);    
            if (bullet) {
                bullet.reset(player.x, player.y + 10);
                bullet.body.velocity.y = -500;
                bulletTime = game.time.now + 300;
            }
        }    
    }

    function enemyFires () {        
     enemyBullet = enemyBullets.getFirstExists(false);        
        livingEnemies.length = 0;   

        enemies.forEachAlive( function(enemy) {
            livingEnemies.push(enemy);
        });
    
        if (enemyBullet && livingEnemies.length > 0) {            
            let random = game.rnd.integerInRange(0, livingEnemies.length-1);
            let shooter = livingEnemies[random];
            enemyBullet.reset(shooter.body.x, shooter.body.y);
    
            game.physics.arcade.moveToObject(enemyBullet, player, 200);
            firingTimer = game.time.now + 500;
        }    
    }

    function collisionHandler (bullet, enemy) {     
        bullet.kill();
        enemy.kill();
   
        score += 10;
        scoreText.text = scoreString + score;
 
        let explosion = explosions.getFirstExists(false);
        explosion.reset(enemy.body.x, enemy.body.y);
        explosion.play('explosion', 35, false, true);
    
        if (enemies.countLiving() == 0) {
            score += 1000;
            scoreText.text = scoreString + score;
    
            enemyBullets.callAll('kill',this);
            stateText.text = " You won!!!!! \n Click to restart";
            stateText.visible = true;
    
            game.input.onTap.addOnce(restart,this);
        }    
    }

    function enemyHitsPlayer (player, bullet) {        
        bullet.kill();    
        let live = lives.getFirstAlive();
    
        if (live) {
            live.kill();
        }
    
        let explosion = explosions.getFirstExists(false);
        explosion.reset(player.body.x, player.body.y);
        explosion.play('explosion', 35, false, true);
    
        if (lives.countLiving() < 1) {
            player.kill();
            enemyBullets.callAll('kill');
    
            stateText.text=" GAME OVER \n Click to restart";
            stateText.visible = true;
    
            game.input.onTap.addOnce(restart,this);
        }    
    }   
        
    function resetBullet (bullet) {
        bullet.kill();    
    }
    
    function restart () {
        lives.callAll('revive');
        enemies.removeAll();

        createEnemies();

        player.revive();
        stateText.visible = false;   
    }
}




