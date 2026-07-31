// ======================
// MINE CLICKER V2
// ======================

// Canvas
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// HUD
const coinAmount = document.getElementById("coinAmount");
const toolName = document.getElementById("toolName");
const worldName = document.getElementById("worldName");
const healthFill = document.getElementById("healthFill");

// Game Data
let coins = 0;

let currentPickaxe = 0;

const worldsUnlocked = {

    Overworld: true,
    Nether: false,
    End: false

};


const BLOCK_SIZE = 256;
const PIXEL_SIZE = 16;

const BLOCK_X = (canvas.width - BLOCK_SIZE) / 2;
const BLOCK_Y = (canvas.height - BLOCK_SIZE) / 2;

const pickaxes = [


    
    
   
{
name:"Hands",
damage:1,
cost:0
},

{
name:"Wooden",
damage:2,
cost:50
},

{
name:"Stone",
damage:3,
cost:150
},

{
name:"Iron",
damage:5,
cost:500
},

{
name:"Gold",
damage:8,
cost:2000
},

{
name:"Diamond",
damage:12,
cost:10000
}

];

const blocks = [

    {
        name:"Dirt",
        hp:2,
        coins:1,
        color:"#8B5A2B",
        chance:40
    },

    {
        name:"Stone",
        hp:4,
        coins:2,
        color:"#808080",
        chance:30
    },

    {
        name:"Coal Ore",
        hp:6,
        coins:4,
        color:"#3B3B3B",
        chance:15
    },

    {
        name:"Iron Ore",
        hp:8,
        coins:8,
        color:"#D8D8D8",
        chance:8
    },

    {
        name:"Gold Ore",
        hp:12,
        coins:16,
        color:"#FFD700",
        chance:5
    },

    {
        name:"Diamond Ore",
        hp:18,
        coins:30,
        color:"#42E8F5",
        chance:2
    },

    {
    name:"Netherrack",
    hp:22,
    coins:40,
    color:"#8B2F2F",
    chance:70
},

{
    name:"Quartz Ore",
    hp:28,
    coins:60,
    color:"#F5F5F5",
    chance:25
},

{
    name:"Ancient Debris",
    hp:40,
    coins:150,
    color:"#5A3A22",
    chance:5
},

];

let currentBlock;
let blockHP;

// Inventory
const inventory = {};

const collection = {

    "Dirt": false,
    "Stone": false,
    "Coal Ore": false,
    "Iron Ore": false,
    "Gold Ore": false,
    "Diamond Ore": false,

    "Netherrack": false,
    "Quartz Ore": false,
    "Ancient Debris": false

};

function createShop(){

    const shop=document.getElementById("shop");

    shop.innerHTML="";

    pickaxes.forEach((tool,index)=>{

        if(index==0) return;

        const btn=document.createElement("button");

        btn.innerHTML=
        tool.name+
        "<br>"+
        tool.cost+" Coins";

        btn.onclick=function(){

            if(coins>=tool.cost && currentPickaxe<index){

                coins-=tool.cost;

                currentPickaxe=index;

                draw();

                saveGame();

            }

        };

        shop.appendChild(btn);

    });

}

function saveGame(){

    localStorage.setItem(

        "mineclickerv2",

        JSON.stringify({

            coins,
            inventory,
            collection,
            currentPickaxe,
            worldsUnlocked

        })

    );

}

function loadGame(){

    const save = JSON.parse(
        localStorage.getItem("mineclickerv2")
    );

    if(!save) return;

    coins = save.coins || 0;

    currentPickaxe = save.currentPickaxe || 0;

    Object.assign(inventory, save.inventory || {});

    Object.assign(collection, save.collection || {});

    Object.assign(worldsUnlocked, save.worldsUnlocked || {});

    if(worldsUnlocked.Nether){

    document.getElementById("netherBtn").textContent =
        "🔥 Nether";

}

    updateInventory();
    updateCollection();

}

// ----------------------
// Spawn Block
// ----------------------

function spawnBlock(){

    const worldBlocks = blocks.filter(block =>
        worlds[currentWorld].includes(block.name)
    );

    let totalChance = 0;

    for(const block of worldBlocks){
        totalChance += block.chance;
    }

    let roll = Math.random() * totalChance;
    let running = 0;

    for(const block of worldBlocks){

        running += block.chance;

        if(roll <= running){

            currentBlock = block;
            blockHP = block.hp;

            draw();
            return;

        }

    }

}

// ----------------------
// Draw
// ----------------------

function drawTexture(block){

    const BLOCK_SIZE = 256;

const x = BLOCK_X;
const y = BLOCK_Y;
const pixel = PIXEL_SIZE;

    // Texture maps (16x16 pixels)
    const textures = {

        "Dirt":[
"BBBBBBBBBBBBBBBB",
"BDBBBBBBDBBBBBBB",
"BBBBDBBBBBBBBBDB",
"BBDBBBBBBBBBDBBB",
"BBBBBBBBDBBBBBBB",
"BDBBBBBBBBBBBBDB",
"BBBBDBBBBBDBBBBB",
"BBBBBBBBBBBBBBBB",
"BBDBBBBBDBBBBBBB",
"BBBBBBBBBBBBDBBB",
"BDBBBBBBBBBBBBBB",
"BBBBDBBBBBBBBBBB",
"BBBBBBBBDBBBBBBB",
"BBDBBBBBBBBBBBBB",
"BBBBBBBBBBBBDBBB",
"BBBBBBBBBBBBBBBB"
],
          

        "Stone":[
            "SSSSSSSSSSSSSSSS",
            "SLSSSSSSLSSSSSSS",
            "SSSSSLSSSSSSSLSS",
            "SSSLSSSSSSSLSSSS",
            "SSSSSSSSSSSSSSSS",
            "SLSSSSSSSSSSSSLS",
            "SSSSSLSSSSSSSSSS",
            "SSSSSSSSSLSSSSSS",
            "SSSLSSSSSSSSSSSS",
            "SSSSSSSLSSSSSSSS",
            "SSSSSSSSSSSLSSSS",
            "SLSSSSSSSSSSSSSS",
            "SSSSSLSSSSSSSLSS",
            "SSSSSSSSSSSSSSSS",
            "SSSLSSSSSSSSSSSS",
            "SSSSSSSSSSSSSSSS"
        ],
    
"Coal Ore":[
"SSSSSSSSSSSSSSSS",
"SSSCSSSSSSSSCSSS",
"SSSSSSSLSSSSSSSS",
"SSSSCSSSSSCSSSSS",
"SSSLSSSSSSSSSLSS",
"SSSSSSCSSSSSSSSS",
"SCSSSSSSSSCSSSSS",
"SSSSSLSSSSSSSSSS",
"SSSSSSSSSCSSSSSS",
"SSCSSSSSSSSSLSSS",
"SSSSSSSCSSSSSSSS",
"SSSLSSSSSSSSSCSS",
"SSSSSCSSSSSSSSSS",
"SSSSSSSSSLSSSSSS",
"SCSSSSSSSSSSCSSS",
"SSSSSSSSSSSSSSSS"
],

"Iron Ore":[
"SSSSSSSSSSSSSSSS",
"SSSISSSSSSSSISSS",
"SSSSSSSLSSSSSSSS",
"SSSSISSSSSISSSSS",
"SSSLSSSSSSSSSLSS",
"SSSSSSISSSSSSSSS",
"SISSSSSSSSISSSSS",
"SSSSSLSSSSSSSSSS",
"SSSSSSSSSISSSSSS",
"SSISSSSSSSSSSLSS",
"SSSSSSSISSSSSSSS",
"SSSLSSSSSSSSSISS",
"SSSSISSSSSSSSSSS",
"SSSSSSSSSLSSSSSS",
"SISSSSSSSSSSISSS",
"SSSSSSSSSSSSSSSS"
],

"Gold Ore":[
"SSSSSSSSSSSSSSSS",
"SSSGSSSSSSSSGSSS",
"SSSSSSSLSSSSSSSS",
"SSSSGSSSSSGSSSSS",
"SSSLSSSSSSSSSLSS",
"SSSSSSGSSSSSSSSS",
"SGSSSSSSSSGSSSSS",
"SSSSSLSSSSSSSSSS",
"SSSSSSSSSGSSSSSS",
"SSGSSSSSSSSSSLSS",
"SSSSSSSGSSSSSSSS",
"SSSLSSSSSSSSSGSS",
"SSSSSGSSSSSSSSSS",
"SSSSSSSSSLSSSSSS",
"SGSSSSSSSSSSGSSS",
"SSSSSSSSSSSSSSSS"
],

"Diamond Ore":[
"SSSSSSSSSSSSSSSS",
"SSSXSSSSSSSSXSSS",
"SSSSSSSLSSSSSSSS",
"SSSSXSSSSSXSSSSS",
"SSSLSSSSSSSSSLSS",
"SSSSSSXSSSSSSSSS",
"SXSSSSSSSSXSSSSS",
"SSSSSLSSSSSSSSSS",
"SSSSSSSSSXSSSSSS",
"SSXSSSSSSSSSSLSS",
"SSSSSSSXSSSSSSSS",
"SSSLSSSSSSSSSXSS",
"SSSSSXSSSSSSSSSS",
"SSSSSSSSSLSSSSSS",
"SXSSSSSSSSSSXSSS",
"SSSSSSSSSSSSSSSS"
],


    };

   const colors = {

    // Dirt
    B:"#8B5A2B",
    D:"#6E431F",

    // Stone
    S:"#9A9A9A",
    L:"#777777",

    // Coal
    C:"#1E1E1E",

    // Iron
    I:"#C9A47A",

    // Gold
    G:"#FFD23F",

    // Diamond
    X:"#47E5FF"

};

    const texture = textures[block.name];

    if(!texture){
        ctx.fillStyle = block.color;
        ctx.fillRect(x,y,256,256);
        return;
    }

    for(let row=0; row<16; row++){

        for(let col=0; col<16; col++){

            ctx.fillStyle = colors[texture[row][col]];

            ctx.fillRect(
                x + col*pixel,
                y + row*pixel,
                pixel,
                pixel
            );

        }

    }

}

function draw(){

    ctx.clearRect(0,0,512,512);

    ctx.fillStyle = "#87CEEB";
    ctx.fillRect(0,0,512,512);

    drawTexture(currentBlock);

    let damage = 1 - (blockHP / currentBlock.hp);


    ctx.fillStyle = "white";
    ctx.font = "40px Arial";
    ctx.textAlign = "center";

    ctx.fillText(currentBlock.name,256,240);

    ctx.font = "26px Arial";

    ctx.fillText(
        blockHP + "/" + currentBlock.hp + " HP",
        256,
        290
    );

    healthFill.style.width =
        (blockHP/currentBlock.hp)*100 + "%";

    coinAmount.textContent=coins;

toolName.textContent=
pickaxes[currentPickaxe].name;
}

// ----------------------
// Mine
// ----------------------

canvas.onclick = function(){

    blockHP-=pickaxes[currentPickaxe].damage;

    if(blockHP<=0){

        coins += currentBlock.coins;

        if(!inventory[currentBlock.name])
            inventory[currentBlock.name]=0;

       inventory[currentBlock.name]++;

collection[currentBlock.name] = true;

updateInventory();

updateCollection();

saveGame();

spawnBlock();
    }else{

        draw();

    }

};

// ----------------------
// Inventory
// ----------------------



function updateInventory(){

    const list =
        document.getElementById("inventoryList");

    list.innerHTML="";

    for(const item in inventory){

        const li=document.createElement("li");

        li.textContent =
            item + " : " + inventory[item];

        list.appendChild(li);

    }

}

function updateCollection(){

    const list = document.getElementById("collectionList");

    list.innerHTML = "";

    let found = 0;
    const totalBlocks = Object.keys(collection).length;

    for(const block in collection){

        const li = document.createElement("li");

        li.style.marginBottom = "8px";

        if(collection[block]){

            found++;

            const mined = inventory[block] || 0;

            li.innerHTML = `
                <span style="color:lime;">✅ ${block}</span><br>
                <small style="color:#ccc;">(${mined} mined)</small>
            `;

        }else{

            li.innerHTML = `
                <span style="color:red;">❌ ???</span>
            `;

        }

        list.appendChild(li);

    }

    const percent = Math.floor((found / totalBlocks) * 100);

    const hr = document.createElement("hr");
    hr.style.margin = "15px 0";
    list.appendChild(hr);

    const progress = document.createElement("li");
    progress.style.listStyle = "none";
    progress.style.fontWeight = "bold";
    progress.innerHTML = `
        📚 Found: ${found} / ${totalBlocks}<br>
        ⭐ ${percent}% Complete
    `;

    list.appendChild(progress);

}

    
function goToOverworld(){

    currentWorld = "Overworld";

    worldName.textContent = currentWorld;

    spawnBlock();

}

function unlockNether(){

    if(worldsUnlocked.Nether){

        currentWorld = "Nether";

        worldName.textContent = currentWorld;

        spawnBlock();

        return;

    }

    if(
        (inventory["Stone"] || 0) >= 100 &&
        (inventory["Coal Ore"] || 0) >= 50 &&
        (inventory["Iron Ore"] || 0) >= 25 &&
        (inventory["Gold Ore"] || 0) >= 10
    ){

        inventory["Stone"] -= 100;
        inventory["Coal Ore"] -= 50;
        inventory["Iron Ore"] -= 25;
        inventory["Gold Ore"] -= 10;

        worldsUnlocked.Nether = true;

        currentWorld = "Nether";

        worldName.textContent = currentWorld;

        document.getElementById("netherBtn").textContent =
            "🔥 Nether";

        updateInventory();

        saveGame();

        spawnBlock();

    }else{

        alert(
`You need:

100 Stone
50 Coal Ore
25 Iron Ore
10 Gold Ore`
        );

    }

}
 

// ----------------------
// Start
// ----------------------

loadGame();

updateCollection();

createShop();

spawnBlock();

draw();