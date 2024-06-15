import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from "../../libs/utils.js";
import { ortho, lookAt, flatten, scale, rotate, inverse, normalMatrix, mult, vec4 } from "../../libs/MV.js";
import {modelView, loadMatrix, multMatrix, multRotationY, multScale, multTranslation, pushMatrix, popMatrix, multRotationZ, multRotationX} from "../../libs/stack.js";

import * as CUBE from '../../libs/cube.js';
import * as SPHERE from '../../libs/sphere.js';
import * as CYLINDER from '../../libs/cylinder.js';
import * as TORUS from '../../libs/torus.js';

/** @type WebGLRenderingContext */
let gl;

let time;
let mode;               
let uColor;
let gunMovement = 0.0;
let topBodyMovement = 0.0;
let movement = 0.0;
let wc;
let shoots = [];
let matrix;

let view = lookAt([3, 3, 3], [0, 0, 0], [0, 1, 0]);
let VP_DISTANCE = 10;

//camara
const CAMARA_IN_OUT = 0.5;

//floor
let floor_color1 = [1.0, 1.0, 1.0, 1.0];
let floor_color2 = [0.8, 0.8, 0.8, 1.0];


//largura de cada cubo do chao
const FLOOR_WIDTH = 1.0;
//altura de cada cubo do chao
const FLOOR_HEIGHT = 0.1;

const FLOOR_SIZE = 20;

//tank
//se quiser aumentar o tanque, aumente a escala
const TANK_SCALE = 0.5;
const NWHEELS = 10;
//posiçao do lado direito dos pneus
const TANK_RIGHT = 0.18 * NWHEELS * TANK_SCALE;
//posiçao do lado esquerdo dos pneus
const TANK_LEFT = -0.18 * NWHEELS * TANK_SCALE;

const TANK_MOVEMENT = 0.1;


//tires
const TIRES_SCALE = TANK_SCALE;
//altura do centro dos pneus (para saber quando precisamos de subir para ficar em cima do solo)
const TIRES_CENTER = TIRES_SCALE * 0.7;
//distancia entre pneus em fila
const TIRES_DISTANCE = TIRES_SCALE * 1.6;


//rims
const RIMS_LENGHT = TIRES_SCALE;
const RIMS_HEIGHT = TIRES_SCALE;
const RIMS_WIDTH = TIRES_SCALE / 2.0;

//rimsDir1
const RIMSDIR1_LENGHT = TIRES_SCALE;
const RIMSDIR1_HEIGHT = TIRES_SCALE / 3.0;
const RIMSDIR1_WIDTH = TIRES_SCALE / 3.0;
const RIMS_EXTRA_WIDTH = TIRES_SCALE / 10.0;

//rimsDir2
const RIMSDIR2_LENGHT = TIRES_SCALE / 3.0;
const RIMSDIR2_HEIGHT = TIRES_SCALE;
const RIMSDIR2_WIDTH = TIRES_SCALE / 3.0;

//axles
const AXLES_LENGHT = TIRES_SCALE / 1.5;
const AXLES_HEIGHT = TIRES_SCALE / 1.5;
const AXLES_WIDTH = TANK_RIGHT - TANK_LEFT;
const AXLES_CENTER = TANK_LEFT;


//escala do corpo do tanque
const BODY_SCALE = TANK_SCALE * 1.2;

//bot_body
const BOT_BODY_LENGTH = (NWHEELS / 2.0) * TIRES_DISTANCE;
const BOT_BODY_HEIGHT = TANK_SCALE * 1.2;
const BOT_BODY_WIDTH = AXLES_WIDTH * 0.85;
const BOT_BODY_START = TIRES_CENTER + AXLES_HEIGHT / 2.0;

//mid_body
const MID_BODY_LENGTH = BOT_BODY_LENGTH * 1.2;
const MID_BODY_HEIGHT = TANK_SCALE * 1.2;
const MID_BODY_WIDTH = AXLES_WIDTH * 1.2;
const MID_BODY_START = BOT_BODY_START + BOT_BODY_HEIGHT / 2.0 + MID_BODY_HEIGHT / 2.0;

//board
const BOARD_LENGTH = BOT_BODY_LENGTH / 20.0;
const BOARD_HEIGHT = MID_BODY_HEIGHT * 0.95;
const BOARD_WIDTH = MID_BODY_WIDTH * 0.95; 

//top body base
const TOP_BODY_BASE_LENGTH = BOT_BODY_LENGTH / 2.0;
const TOP_BODY_BASE_HEIGHT = BODY_SCALE * 0.75;
const TOP_BODY_BASE_WIDTH = AXLES_WIDTH;
const TOP_BODY_BASE_START = MID_BODY_START + MID_BODY_HEIGHT/ 2.0 + TOP_BODY_BASE_HEIGHT/ 2.0;

//top body
const TOP_BODY_LENGTH = TOP_BODY_BASE_LENGTH;
const TOP_BODY_HEIGHT = TOP_BODY_BASE_LENGTH;
const TOP_BODY_WIDTH = TOP_BODY_BASE_WIDTH;
const TOP_BODY_START = TOP_BODY_BASE_START + TOP_BODY_BASE_HEIGHT / 2.0;

const TOP_BODY_MOVEMENT = 3.0;

//gun support
const GUN_SUPPORT_RADIUS = TOP_BODY_LENGTH * 1.1;
const GUN_SUPPORT_WIDTH = TOP_BODY_WIDTH * 0.4;

//gun
const GUN_LENGHT = MID_BODY_LENGTH * 0.7;
const GUN_HEIGHT = BODY_SCALE / 1.5;
const GUN_WIDTH = BODY_SCALE / 1.5;

const GUN_MOVEMENT = 5.0;

// gun tip
const GUN_TIP_SCALE = GUN_WIDTH * 1.2;

//projectil
const PROJECTIL_RADIUS = (GUN_WIDTH ) * 0.9;
const SPEED = vec4(0.0, -10.0, 0.0, 0.0);
const HOMO_COORD = [0, 0, 0, 1];


function setup(shaders)
{
    let canvas = document.getElementById("gl-canvas");
    let aspect = canvas.width / canvas.height;

    gl = setupWebGL(canvas);

    let program = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);

    let mProjection = ortho(-VP_DISTANCE*aspect,VP_DISTANCE*aspect, -VP_DISTANCE, VP_DISTANCE,-3*VP_DISTANCE,3*VP_DISTANCE);

    mode = gl.TRIANGLES;

    uColor = gl.getUniformLocation(program, "uColor");

    resize_canvas();
    window.addEventListener("resize", resize_canvas);

    document.onkeydown = function(event) {
        switch(event.key) {
            case 'w':
                if(gunMovement <  37.0 * 5.0)
                    gunMovement += GUN_MOVEMENT;
                break;
            case 'W':
                mode = gl.LINES;
                break;
            case 's':
                if(gunMovement > -5.0 )
                    gunMovement -= GUN_MOVEMENT;
                break;
            case 'S':
                mode = gl.TRIANGLES;
                break;
            case 'a':
                topBodyMovement += TOP_BODY_MOVEMENT;
                break;
            case 'd':
                topBodyMovement -= TOP_BODY_MOVEMENT;
                break;
            case ' ':
                shoot();
                break;
            case 'ArrowUp':
                if(movement + BOT_BODY_LENGTH * 0.7 < 10.0)
                    movement += TANK_MOVEMENT;        
                break;
            case 'ArrowDown':
                if(movement - BOT_BODY_LENGTH * 0.7 > -10.0)
                    movement -= TANK_MOVEMENT;  
                break;
            case '1':
                view = lookAt([0, 1, 6], [0, 1, 0], [0, 1, 0]);
                break;
            case '2':
                view = lookAt([0, 3, 0], [0, 0, 0], [1, 0, 0]);
                break;
            case '3':
                view = lookAt([-3, 1, 0], [0, 1, 0], [0, 1, 0]);
                break;
            case '4':
                view = lookAt([3, 3, 3], [0, 0, 0], [0, 1, 0]);
                break;
            case '+':
                if (VP_DISTANCE > 3.5)
                    VP_DISTANCE -= CAMARA_IN_OUT;
                break;
            case '-':
                if (VP_DISTANCE < 8.0)
                    VP_DISTANCE += CAMARA_IN_OUT;
                break;
        }
    }

    gl.clearColor(0.543, 0.786, 0.890, 1.0);
    SPHERE.init(gl);
    CUBE.init(gl);
    CYLINDER.init(gl);
    TORUS.init(gl);

    gl.enable(gl.DEPTH_TEST);   // Enables Z-buffer depth test
    
    window.requestAnimationFrame(render);

    
    function resize_canvas(event)
    {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        aspect = canvas.width / canvas.height;

        gl.viewport(0,0,canvas.width, canvas.height);
        mProjection = ortho(-VP_DISTANCE * aspect,VP_DISTANCE * aspect, -VP_DISTANCE, VP_DISTANCE,-3 * VP_DISTANCE,3 * VP_DISTANCE);
    }

    function uploadModelView()
    {
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mModelView"), false, flatten(modelView()));
    }

    function drawFloor()
    {
        for(let x = -FLOOR_SIZE / 2; x <= FLOOR_SIZE / 2; x++){
            for(let z = -FLOOR_SIZE / 2; z <= FLOOR_SIZE / 2; z++){
                pushMatrix();
                    multTranslation([x, -FLOOR_HEIGHT / 2, z]);   
                    multScale([FLOOR_WIDTH, FLOOR_HEIGHT, FLOOR_WIDTH]);
       
                    uploadModelView();
                    if((z+x) % 2 == 0)
                        gl.uniform4fv(uColor, floor_color1);
                    else
                        gl.uniform4fv(uColor, floor_color2);
                    
                    CUBE.draw(gl, program, mode);
                popMatrix();
            }
        }
    }

    function tires()
    {                 
        multScale([TIRES_SCALE, TIRES_SCALE, TIRES_SCALE]);
        multRotationY(90);
        multRotationZ(90);
        uploadModelView();
        gl.uniform4fv(uColor, [0.189, 0.190, 0.188, 1.0]);
        TORUS.draw(gl, program, mode);           
    }

    function rims()
    {
        multScale([RIMS_LENGHT, RIMS_HEIGHT, RIMS_WIDTH]);
        multRotationY(90);
        multRotationZ(90);
        uploadModelView();
        gl.uniform4fv(uColor, [0.0,0.0,0.0, 1.0]);
        CYLINDER.draw(gl, program, mode);   
    }

    function rimsDir1()
    {
        multScale([RIMSDIR1_LENGHT , RIMSDIR1_HEIGHT, RIMSDIR1_WIDTH]);
        multRotationY(90); 
        multRotationZ(90);     
        uploadModelView();
        gl.uniform4fv(uColor, [0.630, 0.660, 0.607, 1.0]);
        CYLINDER.draw(gl, program, mode);
    }

    function rimsDir2()
    {
        multScale([RIMSDIR2_LENGHT , RIMSDIR2_HEIGHT, RIMSDIR2_WIDTH]);
        multRotationY(90); 
        multRotationZ(90);     
        uploadModelView();
        gl.uniform4fv(uColor, [0.630, 0.660, 0.607, 1.0]);
        CYLINDER.draw(gl, program, mode);
    }

    function steeringAxles()
    {             
        multScale([AXLES_LENGHT, AXLES_HEIGHT,  AXLES_WIDTH]);
        multRotationY(90);
        multRotationZ(90);
        uploadModelView();
        gl.uniform4fv(uColor, [0.0, 0.0, 0.0, 1.0]);
        CYLINDER.draw(gl, program, mode); 
    }

    function wheels()
    {
        for(let n = 0; n < NWHEELS; n++){
            pushMatrix();
                if(n < NWHEELS/2)
                    multTranslation([TIRES_DISTANCE * (n - NWHEELS / 5) , TIRES_CENTER, TANK_RIGHT]);
                else 
                    multTranslation([TIRES_DISTANCE * (n - NWHEELS * 0.7) , TIRES_CENTER, TANK_LEFT]);

                multRotationZ(- movement * 90);
        
                pushMatrix();
                    tires();
                popMatrix();
                pushMatrix();
                    rims();
                popMatrix();
                if(n < NWHEELS/2)
                    multTranslation([0.0,0.0,RIMS_EXTRA_WIDTH]);
                else 
                    multTranslation([0.0,0.0,-RIMS_EXTRA_WIDTH]);
                pushMatrix();
                    rimsDir1();
                popMatrix();
                rimsDir2();
            popMatrix();
        }
    }

    function axles_and_wheels()
    {
        pushMatrix();
            wheels();
        popMatrix();   

        for(let n = 0; n < NWHEELS/2; n++){
            pushMatrix();
                multTranslation([TIRES_DISTANCE * (n - NWHEELS/5), TIRES_CENTER,TANK_RIGHT]);     
                multTranslation([0.0,0.0, AXLES_CENTER]);
                multRotationZ(- movement * 90);
                steeringAxles();
            popMatrix();
        }
    }

    function botBody()
    {
        multScale([BOT_BODY_LENGTH, BOT_BODY_HEIGHT, BOT_BODY_WIDTH]);
        uploadModelView();
        gl.uniform4fv(uColor, [0.157, 0.250, 0.0850, 1.0]);
        CUBE.draw(gl, program, mode);
    }

    function midBody()
    {
        multScale([MID_BODY_LENGTH, MID_BODY_HEIGHT, MID_BODY_WIDTH]);
        uploadModelView();
        gl.uniform4fv(uColor, [0.157, 0.250, 0.0850, 1.0]);
        CUBE.draw(gl, program, mode);
    }

    function board()
    {
        multScale([BOARD_LENGTH, BOARD_HEIGHT, BOARD_WIDTH ]);
        uploadModelView();
        gl.uniform4fv(uColor, [0.0, 0.0, 0.0, 1.0]);
        CUBE.draw(gl, program, mode);
    }

    function topBody_base()
    {
        multScale([TOP_BODY_BASE_LENGTH, TOP_BODY_BASE_HEIGHT, TOP_BODY_BASE_WIDTH]);
        uploadModelView();
        gl.uniform4fv(uColor,  [0.0854, 0.220, 0.0616, 1.0]);
        CYLINDER.draw(gl, program, mode);
    }

    function topBody()
    {
        multScale([TOP_BODY_LENGTH, TOP_BODY_HEIGHT, TOP_BODY_WIDTH]);
        uploadModelView();
        gl.uniform4fv(uColor,  [0.0854, 0.220, 0.0616, 1.0]);
        SPHERE.draw(gl, program, mode);
    }

    function gunSupport()
    {
        multScale([GUN_SUPPORT_RADIUS, GUN_SUPPORT_RADIUS, GUN_SUPPORT_WIDTH]);
        uploadModelView();
        gl.uniform4fv(uColor,  [0.0649, 0.110, 0.0657, 1.0]);
        SPHERE.draw(gl, program, mode);
    }

    function gun()
    {    
        multScale([GUN_LENGHT, GUN_HEIGHT, GUN_WIDTH]);
        multRotationZ(90);
        uploadModelView();
        gl.uniform4fv(uColor, [0.0, 0.0, 0.0, 1.0]);
        CYLINDER.draw(gl, program, mode);
    }

    function gunTip()
    {
        multTranslation([GUN_LENGHT/2, GUN_HEIGHT - GUN_TIP_SCALE * 0.8, 0]);
        multRotationZ(90);
        multScale([GUN_TIP_SCALE, GUN_TIP_SCALE, GUN_TIP_SCALE]);
        uploadModelView();
        gl.uniform4fv(uColor, [0.630, 0.660, 0.607, 1.0]);
        TORUS.draw(gl, program, mode);
    }

    function bodywork()
    {                
        pushMatrix();
            multTranslation([0.0, BOT_BODY_START ,0.0]);
            botBody();
        popMatrix();

        pushMatrix();
            multTranslation([0.0, MID_BODY_START ,0.0]);
            pushMatrix();
                midBody();
            popMatrix();
            pushMatrix();
                multTranslation([MID_BODY_LENGTH / 2.0, 0.0 , 0.0 ]);
                board();
            popMatrix();
            multTranslation([-MID_BODY_LENGTH / 2.0, 0.0 , 0.0 ]);
            board();
        popMatrix();

        multRotationY(topBodyMovement);
        pushMatrix();
            multTranslation([0.0, TOP_BODY_BASE_START, 0.0]);
            topBody_base();
        popMatrix();
    
        multTranslation([0.0, TOP_BODY_START, 0.0]);
        pushMatrix();
            topBody();
        popMatrix();
        
        multRotationZ(gunMovement);
        pushMatrix();
            gunSupport();
        popMatrix();
        multTranslation([GUN_SUPPORT_RADIUS,0.0,0.0]);
        pushMatrix();
        gun();
        popMatrix();
        gunTip();
        matrix = modelView();
    }

    function projectil()
    {
        multScale([PROJECTIL_RADIUS, PROJECTIL_RADIUS, PROJECTIL_RADIUS]);
        uploadModelView();
        gl.uniform4fv(uColor, [1.0, 0.0, 0.0, 1.0]);
        SPHERE.draw(gl, program, mode);
    }

    function shoot()
    {
        wc = mult(inverse(view), matrix);
        let v0 = mult(normalMatrix(wc), SPEED);
        let p0 = mult(wc, HOMO_COORD);
        shoots.push({v: v0, pos0: p0, pos: p0, t0: Date.now()});
    }
    
    function projectilTragectory(time)
    {
        let t, x, y, z;
        for(let i = 0; i < shoots.length; i++){
            x = shoots[i].pos[0];
            y = shoots[i].pos[1];
            z = shoots[i].pos[2];
            t = (time - shoots[i].t0) / 1000;
            

            x = shoots[i].pos0[0] + shoots[i].v[0] * t;
            y = shoots[i].pos0[1] + shoots[i].v[1] * t - (0.5 * 9.8 * Math.pow(t, 2));
            z = shoots[i].pos0[2] + shoots[i].v[2] * t;

            if(y <= 0)
                shoots.splice(i, 1);
            else{
                pushMatrix();
                    multTranslation([x, y, z]);
                    projectil();
                popMatrix();
            }
        }
    }

    function render()
    {
        window.requestAnimationFrame(render);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        gl.useProgram(program);

        mProjection = ortho(-VP_DISTANCE*aspect,VP_DISTANCE*aspect, -VP_DISTANCE, VP_DISTANCE,-3*VP_DISTANCE,3*VP_DISTANCE);
        
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mProjection"), false, flatten(mProjection));
    
        loadMatrix(view);

        uColor = gl.getUniformLocation(program, "uColor"); 

        pushMatrix();
            drawFloor();
        popMatrix();
        pushMatrix();
            multTranslation([movement,0.0,0.0]);
            pushMatrix();
                axles_and_wheels();
            popMatrix();
            bodywork();
        popMatrix();
        projectilTragectory(Date.now());
    }
}

const urls = ["shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders))
