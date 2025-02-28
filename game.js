const canvas=document.getElementById('canvas');
const ctx=canvas.getContext('2d');
const imageNames=['bird','fire','stone','dino'];

//ゲーム状態を管理するオブジェクト
const game={
  counter:0,
  backGrounds:[],
  bgm1:new Audio('bgm/fieldSong.mp3'),
  bgm2:new Audio('bgm/jump.mp3'),
  enemys:[],
  enemyCountdown:0,
  image:{},
  score:0,
  state:'loading',
  timer:null,
  //バリア
  barrierActive:false,
  barrierCooldown:false,
  barrierDuration:5000,
  barrierCooldownTime:10000
};
game.bgm1.loop=true;
game.bgm1.volume=0.3;
game.bgm2.volume=0.3;

//ジャンプホールド設定
game.jumpHoldActive=false; //スキル発動中か
game.jumpHoldCooldown=false; //クールタイム中か
game.jumpHoldDuration=1000; //静止時間（ミリ秒）
game.jumpHoldCooldownTime=10000; //クールタイム

//複数画像読み込み
let imageLoadCounter=0;
for (const imageName of imageNames){
  const imagePath=`./image/${imageName}.png`;
  game.image[imageName]=new Image();
  game.image[imageName].src=imagePath;
  game.image[imageName].onload=()=>{
    imageLoadCounter+=1;
    if(imageLoadCounter===imageNames.length){
      console.log('画像のロードが完了しました。');
      init(); //ゲームの初期化
    }
  }
}

//ゲームの初期化
function init(){
  game.counter=0;
  game.enemys=[];
  game.fire=[];
  game.enemyCountdown=0;
  game.score=0;
  game.state='init';
  ctx.clearRect(0,0,canvas.width,canvas.height);
  createDino();
  drawDino();
  createBackGround();
  drawBackGrounds();
  ctx.fillStyle='black';
  ctx.font='bold 80px serif';
  ctx.textBaseline='top';
  ctx.fillText(`Press Space key`,84,150);
  ctx.fillText(`to start.`,84,230)

  //ルール説明
  ctx.font='24px serif';
  ctx.fillText(`『ルール』`,50,350);
  ctx.fillText(`Spaceキーでジャンプ（2段ジャンプ可能）`,50,380);
  ctx.fillText(`障害物（岩や鳥や炎）に当たるとゲームオーバー`,50,410);
  ctx.fillText(`Shiftキーでバリア発動（5秒間無敵）`,50,440);
  ctx.fillText(`↑キーでジャンプホールド（1秒間静止）`,50,470);
}

//ゲーム開始
function start(){
  game.state='gaming';
  game.bgm1.play();
  game.timer=setInterval(ticker,30);
}

//ゲームループ処理
function ticker(){
  ctx.clearRect(0,0,canvas.width,canvas.height); //画面クリア
  moveBackGrounds();
  drawBackGrounds();
  createEnemys();
  moveDino(); 
  moveEnemys();
  moveFire();
  drawEnemys();
  drawDino();
  drawScore();
  drawFire();
  drawBarrier();
  drawBarrierCooldown();
  drawSkillStatus();
  hitCheck();
  //カウンターの更新
  if(game.counter%6===0){
    game.score+=1;
  }
  game.counter=(game.counter+1)%1000000;
  game.enemyCountdown-=1;
}

//恐竜の生成
function createDino(){
  game.dino={
    x:75,
    y:canvas.height-game.image.dino.height/2,
    moveY:0,
    width:game.image.dino.width,
    height:game.image.dino.height,
    image:game.image.dino,
    jumpCount:0 //ジャンプ回数（2回まで）
  }
}

//背景の生成
function createBackGround(){
  if(game.backGrounds.length===0){
    for(let x=0;x<=canvas.width;x+=200){
      game.backGrounds.push({
        x:x,
        y:canvas.height,
        width:200,
        moveX:-20-Math.floor(game.score/300) //スコアに応じて背景速度を変更
      });
    }
  }
}

//岩の生成
function createStone(createX){
  game.enemys.push({
    x:createX,
    y:canvas.height-game.image.stone.height/2,
    width:game.image.stone.width,
    height:game.image.stone.height,
    moveX:-12-Math.floor(game.score/100),
    image:game.image.stone
  });
}

//鳥の生成
function createBird(delay=0){
  setTimeout(()=>{
   const minY=300;
   const maxY=canvas.height-250;
  const birdY=Math.random()*(maxY-minY)+minY;
  game.enemys.push({
    x:canvas.width+game.image.bird.width/2,
    y:birdY,
    width:game.image.bird.width,
    height:game.image.bird.height,
    moveX:-12-Math.floor(game.score/200),
    moveY:(Math.random()>0.5?1:-1)*(4+Math.floor(game.score/200)),
    image:game.image.bird
  });
 },delay);
}

//敵キャラクターの生成
function createEnemys(){
  if(game.enemyCountdown<=0){
    game.enemyCountdown=Math.max(20,60-Math.floor(game.score/40));
    switch(Math.floor(Math.random()*3)){
      case 0:
        createStone(canvas.width+game.image.stone.width/2);
        break;
      case 1:
        createStone(canvas.width+game.image.stone.width/2);
        createStone(canvas.width+game.image.stone.width*3/2);
        break;
      case 2:
        createBird();
        if(Math.random()<0.5){
          createBird(300);
        }
        break;
    }
  }
}

//火の生成
function createFire(bird){
  game.fire.push({
    x:bird.x-bird.width/2,
    y:bird.y,
    width:game.image.fire.width,
    height:game.image.fire.height,
    moveX:-20-Math.floor(game.score/100),
    moveY:Math.random()*7+2,
    image:game.image.fire
  });
}

//バリア発動
function activateBarrier(){
  if(!game.barrierActive&&!game.barrierCooldown){
    console.log("バリア発動！"); //デバッグログ
    game.barrierActive=true;
    game.barrierCooldown=true;

    const now=Date.now();
    game.barrierEndTime=now+game.barrierDuration; //バリア終了時間
    game.barrierCooldownEndTime=now+game.barrierCooldownTime; //クールダウン終了時間

    setTimeout(()=>{
      game.barrierActive=false; //5秒後解除
      console.log("バリア解除"); //デバッグログ
    },game.barrierDuration);

    setTimeout(()=>{
      game.barrierCooldown=false; //５秒後クールダウン解除
      console.log("バリアクールダウン解除"); //デバッグログ
    },game.barrierCooldownTime);
  }else{
    console.log("バリアはクールダウン中または既に発動中"); //デバッグログ
  }
}

//背景の移動
function moveBackGrounds(){
  for(const backGround of game.backGrounds){
    backGround.x+=backGround.moveX;
    if(backGround.x+backGround.width<=0) {
      backGround.x=canvas.width; //背景が画面外に出たら元の位置に戻す
    }
  }
}

//恐竜の移動
function moveDino(){
  if(game.jumpHoldActive)return;

  if(game.dino.y<game.image.dino.height/2){
    game.dino.y=game.image.dino.height/2;
    game.dino.moveY=0;
  }
  game.dino.y+=game.dino.moveY;
  if(game.dino.y>=canvas.height-game.dino.height/2){
    game.dino.y=canvas.height-game.dino.height/2;
    game.dino.moveY=0;
    game.dino.jumpCount=0;
  }else{
    game.dino.moveY+=3;
  }
}

//敵キャラクターの移動
function moveEnemys(){
  for(const enemy of game.enemys){
    enemy.x+=enemy.moveX;
    if(enemy.image===game.image.bird){
    enemy.y+=enemy.moveY;
    const minY=200;
    const maxY=canvas.height-250;
    if(enemy.y<minY){
      enemy.y=minY;
      enemy.moveY=Math.abs(enemy.moveY);
    }
    if(enemy.y>maxY){
      enemy.moveY=-Math.abs(enemy.moveY)
    }
    if(Math.random()<0.05){
      createFire(enemy);
    }
   }
  }
  //画面の外に出たキャラクターを配列から削除
  game.enemys=game.enemys.filter(enemy=>enemy.x>-enemy.width);
}

//火の移動
function moveFire(){
  for(const fire of game.fire){
    fire.x+=fire.moveX;
    fire.y+=fire.moveY;
  }
  game.fire=game.fire.filter(fire=>fire.x>-fire.width);
}

//背景の描画
function drawBackGrounds(){
  ctx.fillStyle='rgb(91, 181, 255)'; //空の色
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='rgb(217, 189, 121)'; //地面の色
  for(const backGround of game.backGrounds){
    ctx.fillRect(backGround.x,backGround.y-15,backGround.width,15);
    ctx.fillRect(backGround.x+20,backGround.y-20,backGround.width-40,5);
    ctx.fillRect(backGround.x+50,backGround.y-25,backGround.width-100,5);
  }
}

//恐竜の描画
function drawDino(){
  ctx.drawImage(game.image.dino,game.dino.x-game.dino.width/2,game.dino.y-game.dino.height/2);
}

//敵キャラクターの描画
function drawEnemys(){
  for(const enemy of game.enemys){
    ctx.drawImage(enemy.image,enemy.x-enemy.width/2,enemy.y-enemy.height/2);
  }
}

//火の描画
function drawFire(){
  for(const fire of game.fire){
    ctx.drawImage(fire.image,fire.x-fire.width/2,fire.y-fire.height/2);
  }
}

//スコアの描画
function drawScore(){
  ctx.fillStyle='black';
  ctx.font='24px serif';
  ctx.fillText(`score:${game.score}`,20,30);
}

//スキルの発動可能表示
function drawSkillStatus(){
  ctx.fillStyle='black';
  ctx.font='40px serif';

// ジャンプスキルのステータス表示
  const now=Date.now();
  if(game.jumpHoldActive){
    ctx.fillText(`Skill Active`,canvas.width-240,30);
  }else if(game.jumpHoldCooldown){
    const remaining=Math.max(0,Math.ceil((game.jumpHoldCooldownEndTime-now)/1000));
    ctx.fillText(`Skill CD:${remaining}s`,canvas.width-250,30);
  }else{
    ctx.fillText(`Skill Ready!`,canvas.width-250,30);
  }
}

//バリアの半円
function drawBarrier(){
  if(game.barrierActive){
    ctx.beginPath();
    ctx.arc(
      game.dino.x,
      game.dino.y,
      Math.max(game.dino.width,game.dino.height)*0.6,
      0,Math.PI*2,true
    );
    ctx.fillStyle='rgba(202, 237, 255, 0.4)';
    ctx.fill();
  }
}

//バリアのクールダウン表示
function drawBarrierCooldown(){
  ctx.font='30px serif';
  const now=Date.now();
  if(game.barrierActive){
    ctx.fillText(`Barrier Active`,canvas.width-250,70);
  }else if(game.barrierCooldown){
    const remaining=Math.max(0,Math.ceil((game.barrierCooldownEndTime-now)/1000));
    ctx.fillText(`Barrier CD:${remaining}s`,canvas.width-250,70);
  }else{
    ctx.fillText(`Barrier Ready!`,canvas.width-250,70);
  }
}

//ジャンプスキル
function activateJumpHold(){
  if(!game.jumpHoldActive&&!game.jumpHoldCooldown){
    game.jumpHoldActive=true;
    game.jumpHoldCooldown=true;

    const now=Date.now();
    game.jumpHoldEndTime=now+game.jumpHoldDuration;
    game.jumpHoldCooldownEndTime=now+game.jumpHoldCooldownTime;

    game.dino.moveY=0; //落下停止

    setTimeout(()=>{
      game.jumpHoldActive=false; //停止解除
      game.dino.jumpCount=0; //停止解除ジャンプ回数リセット
    },game.jumpHoldDuration);

    // クールタイム解除
    setTimeout(()=>{
      game.jumpHoldCooldown=false; //10秒後クールタイム解除
    },game.jumpHoldCooldownTime);
  }
}

//あたり判定
function hitCheck(){
  if(game.barrierActive)return;

  for(const enemy of game.enemys){
    if(
      Math.abs(game.dino.x-enemy.x)<game.dino.width*0.7/2+enemy.width*0.7/2&&
      Math.abs(game.dino.y-enemy.y)<game.dino.height*0.7/2+enemy.height*0.7/2
    ){
      game.state='gameover';
      game.bgm1.pause();
      ctx.fillStyle='black';
      ctx.font='bold 100px serif';
      ctx.fillText(`Game Over!`,95,200);
      clearInterval(game.timer);
    }
  }
  for(const fire of game.fire){
    if(
      Math.abs(game.dino.x-fire.x)<game.dino.width*0.7/2+fire.width*0.7/2&&
      Math.abs(game.dino.y-fire.y)<game.dino.height*0.7/2+fire.height*0.7/2
    ){
      game.state='gameover';
      game.bgm1.pause();
      ctx.fillStyle='black';
      ctx.font='bold 100px serif';
      ctx.fillText(`Game Over!`,95,200);
      clearInterval(game.timer);
    }
  }
}

//キーボード処理
document.onkeydown=(e)=>{
  if(e.code==='Space'&&game.state==='init'){
    start();
  }
  if(e.code==='Space'&&game.dino.jumpCount<2){
    game.dino.moveY=-41;
    game.bgm2.play();
    game.dino.jumpCount++;
  }
  if(e.code==='Enter'&&game.state==='gameover'){
    init();
  }
  if(e.code==='ShiftLeft'||e.code==='ShiftRight'){
    activateBarrier();
  }
  if(e.code==='ArrowUp'){
    activateJumpHold();
  }
};
