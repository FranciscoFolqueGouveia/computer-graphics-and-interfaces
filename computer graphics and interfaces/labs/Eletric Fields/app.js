import * as UTILS from '../../libs/utils.js';
import * as MV from '../../libs/MV.js'

/** @type {WebGLRenderingContext} */
let gl;
const table_width = 3.0;
let table_height;
let grid_spacing = 0.05;
let grid;
let charges;
let gridData = [];
let gridOD = [];
let chargesData = [];
const MAX_CHARGES = 30;
let space = true;

function animate(time)
{
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(grid);

    const gridBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gridBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, gridData.length*MV.sizeof["vec2"] + gridOD.length*4, gl.STATIC_DRAW);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, MV.flatten(gridData));
    gl.bufferSubData(gl.ARRAY_BUFFER, gridData.length*MV.sizeof["vec2"], MV.flatten(gridOD));

    const vGridPos = gl.getAttribLocation(grid, "vPosition");
    gl.vertexAttribPointer(vGridPos, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vGridPos);

    const vGridMove = gl.getAttribLocation(grid, "vMove");
    gl.vertexAttribPointer(vGridMove, 1, gl.FLOAT, false, 0, gridData.length*MV.sizeof["vec2"]);
    gl.enableVertexAttribArray(vGridMove);

    const uWidth = gl.getUniformLocation(grid,"uTable_width");
    const uHeight = gl.getUniformLocation(grid, "uTable_height");
    gl.uniform1f(uWidth, table_width);
    gl.uniform1f(uHeight, table_height);
    
    let counter = 0;
    for(let i=0; i<chargesData.length; i+=3) {
        let cv = chargesData[i+2];
        const uPosition = gl.getUniformLocation(grid, "uPosition[" + counter + "]");
        gl.uniform2fv(uPosition, MV.flatten(MV.vec2(chargesData[i], chargesData[i+1])));
        const uCharge = gl.getUniformLocation(grid, "uCharge[" + counter + "]");
        gl.uniform1f(uCharge, cv);
        counter++;
    }

    gl.drawArrays(gl.LINES, 0, gridData.length);

    if(space){
        gl.useProgram(charges);

        const chargesBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, chargesBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, MV.flatten(chargesData), gl.STATIC_DRAW);

        const vChargePos = gl.getAttribLocation(charges, "vPosition");
        gl.vertexAttribPointer(vChargePos, 2, gl.FLOAT, false, 12, 0);
        gl.enableVertexAttribArray(vChargePos);

        const vChargeValue = gl.getAttribLocation(charges, "vValue");
        gl.vertexAttribPointer(vChargeValue, 1, gl.FLOAT, false, 12, 8);
        gl.enableVertexAttribArray(vChargeValue);

        const uChargeWidth = gl.getUniformLocation(charges,"uTable_width");
        const uChargeHeight = gl.getUniformLocation(charges, "uTable_height");
        gl.uniform1f(uChargeWidth, table_width);
        gl.uniform1f(uChargeHeight, table_height);
        gl.drawArrays(gl.POINTS, 0, chargesData.length/3);
    }

    for(let i =0; i<chargesData.length; i+=3){
        let auxX = chargesData[i];
        let auxY = chargesData[i+1];
        let theta = 0.01;
       
        if(chargesData[i+2] > 0.0) {
            chargesData[i] =  Math.cos(theta) * auxX - Math.sin(theta) * auxY;
            chargesData[i+1] =  (Math.sin(theta) * auxX + Math.cos(theta) * auxY);
        } else {     
            chargesData[i] = Math.cos(theta) * auxX + Math.sin(theta) * auxY;
            chargesData[i+1] =  (Math.cos(theta) * auxY - Math.sin(theta) * auxX);
        }
    }

    window.requestAnimationFrame(animate);
}

function setup(shaders)
{
    const canvas = document.getElementById("gl-canvas");
    gl = UTILS.setupWebGL(canvas);

    grid = UTILS.buildProgramFromSources(gl, shaders["shader1.vert"], shaders["shader1.frag"]);
    charges = UTILS.buildProgramFromSources(gl, shaders["charges.vert"], shaders["charges.frag"]);

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    table_height = canvas.height*table_width/canvas.width;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    
    for(let x = -table_width/2.0; x <= table_width/2.0; x += grid_spacing) {
        for(let y = -table_height/2.0; y <= table_height/2.0; y += grid_spacing) {
            let r = Math.random() * grid_spacing;
            gridData.push(MV.vec2(x + r, y + r));
            gridOD.push(0.0);
            gridData.push(MV.vec2(x + r, y +r));
            gridOD.push(1.0);
        }
    }

    window.addEventListener("resize", function (event) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        table_height = (canvas.height*table_width)/canvas.width;
        gl.viewport(0, 0, canvas.width, canvas.height);
    });

    window.addEventListener("click", function(event) {
        
        const x = (event.offsetX/canvas.width*table_width)-table_width/2.0;
        const y = (-event.offsetY/canvas.height*table_height)+table_height/2.0;

        if(chargesData.length/3 < MAX_CHARGES){  
            if(event.shiftKey){
                chargesData.push(x); 
                chargesData.push(y);
                chargesData.push(-1.0); 
            }else{
                chargesData.push(x); 
                chargesData.push(y);
                chargesData.push(1.0);  
            }
        }else{alert("Limite maximo de cargas!")}
    });
    window.addEventListener("keydown", function(event) {  
        if( event.keyCode == 32){
            if(space){
                space = false;
            } else space = true;
        }
    });
    window.requestAnimationFrame(animate);
}

UTILS.loadShadersFromURLS(["shader1.vert", "shader1.frag", "charges.vert", "charges.frag"]).then(s => setup(s));