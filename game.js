const canvas=document.getElementById('canvas');
const ctx=canvas.getContext('2d');
const imageNames=['bird','fire','stone','dino'];

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
  timer:null
};
game.bgm1.loop=true;

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
      init();
    }
  }
}

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
}

function start(){
  game.state='gaming';
  game.bgm1.play();
  game.timer=setInterval(ticker,30);
}

function ticker(){
  //画面クリア
  ctx.clearRect(0,0,canvas.width,canvas.height);

  //背景
  moveBackGrounds();
  drawBackGrounds();
  
  //敵キャラクターの生成
  createEnemys();

  //キャラクターの移動
  moveDino(); //恐竜の移動
  moveEnemys(); //敵キャラクタの移動
  moveFire();

  //描画
  drawEnemys(); //敵キャラクタの描画
  drawDino(); //恐竜の描画
  drawScore(); //スコアの描画
  drawFire();

  //あたり判定
  hitCheck();

  //カウンターの更新
  if(game.counter%6===0){
    game.score+=1;
  }
  game.counter=(game.counter+1)%1000000;
  game.enemyCountdown-=1;
}

function createDino(){
  game.dino={
    x:75,
    y:canvas.height-game.image.dino.height/2,
    moveY:0,
    width:game.image.dino.width,
    height:game.image.dino.height,
    image:game.image.dino,
    jumpCount:0
  }
}

function createBackGround(){
  if(game.backGrounds.length===0){
    for(let x=0;x<=canvas.width;x+=200){
      game.backGrounds.push({
        x:x,
        y:canvas.height,
        width:200,
        moveX:-20-Math.floor(game.score/300)
      });
    }
  }
}

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

function createBird(delay=0){
  setTimeout(()=>{
  const birdY=Math.random()*(canvas.height-game.image.bird.height-200)+250;
  game.enemys.push({
    x:canvas.width+game.image.bird.width/2,
    y:birdY,
    width:game.image.bird.width,
    height:game.image.bird.height,
    moveX:-15-Math.floor(game.score/200),
    moveY:(Math.random()>0.5?1:-1)*(4+Math.floor(game.score/200)),
    image:game.image.bird
  });
 },delay);
}

function createEnemys(){
  if(game.enemyCountdown<=0){
    game.enemyCountdown=Math.max(10,50-Math.floor(game.score/30));
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

function createFire(bird){
  game.fire.push({
    x:bird.x-bird.width/2,
    y:bird.y,
    width:game.image.fire.width,
    height:game.image.fire.height,
    moveX:-20-Math.floor(game.score/100),
    moveY:0,
    image:game.image.fire
  });
}

function moveBackGrounds(){
  for(const backGround of game.backGrounds){
    backGround.x+=backGround.moveX;
    if(backGround.x+backGround.width<=0) {
      backGround.x=canvas.width; //背景が画面外に出たら元の位置に戻す
    }
  }
}

function moveDino(){
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

function moveFire(){
  for(const fire of game.fire){
    fire.x+=fire.moveX;
    fire.y+=fire.moveY;
    fire.moveY+=0.3;
  }
  game.fire=game.fire.filter(fire=>fire.x>-fire.width);
}

function drawBackGrounds(){
  ctx.fillStyle='rgb(91, 181, 255)';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='rgb(217, 189, 121)';
  for(const backGround of game.backGrounds){
    ctx.fillRect(backGround.x,backGround.y-15,backGround.width,15);
    ctx.fillRect(backGround.x+20,backGround.y-20,backGround.width-40,5);
    ctx.fillRect(backGround.x+50,backGround.y-25,backGround.width-100,5);
  }
}

function drawDino(){
  ctx.drawImage(game.image.dino,game.dino.x-game.dino.width/2,game.dino.y-game.dino.height/2);
}

function drawEnemys(){
  for(const enemy of game.enemys){
    ctx.drawImage(enemy.image,enemy.x-enemy.width/2,enemy.y-enemy.height/2);
  }
}

function drawFire(){
  for(const fire of game.fire){
    ctx.drawImage(fire.image,fire.x-fire.width/2,fire.y-fire.height/2);
  }
}

function drawScore(){
  ctx.fillStyle='black';
  ctx.font='24px serif';
  ctx.fillText(`score:${game.score}`,10,30);
}

function hitCheck(){
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
};