import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from "../../libs/utils.js";
import { lookAt, flatten, scale, normalMatrix, perspective, vec3 } from "../../libs/MV.js";
import { modelView, loadMatrix, multScale, multTranslation, pushMatrix, popMatrix} from "../../libs/stack.js";

import * as CUBE from '../../libs/cube.js';
import * as SPHERE from '../../libs/sphere.js';
import * as TORUS from '../../libs/torus.js';
import * as PYRAMID from '../../libs/pyramid.js';
import * as CYLINDER from '../../libs/cylinder.js';
import * as DAT from '../../libs/dat.gui.module.js';


const MAX_LIGHTS = 3; 

function setup(shaders)
{
    const canvas = document.getElementById("gl-canvas");
    const gl = setupWebGL(canvas);

    const program = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);
    const programLights = buildProgramFromSources(gl, shaders["shader2.vert"], shaders["shader2.frag"]);

    SPHERE.init(gl);
    CUBE.init(gl);
    TORUS.init(gl);
    PYRAMID.init(gl);
    CYLINDER.init(gl);

    let lights = [];

    let materialInfo = {
        obj: "Sphere",
        Ka: [0, 25, 0],
        Kd: [0, 100, 0],
        Ks: [255, 255, 255],
        shininess: 50
    }

    let options = {
        backfaceCulling: true,
        depthTest: true,
        showLights: true
    }

    let camera = {
        eye: vec3(2,2,5),//1,2,5
        at: vec3(0,0,0),
        up: vec3(0,1,0),
        fovy: 45,
        aspect: 1,
        near: 0.1,
        far: 20.0
    }
    
    const gui = new DAT.GUI();
    
    const optionsGui = gui.addFolder("options");
    optionsGui.add(options, "backfaceCulling").name("backface culling");
    optionsGui.add(options, "depthTest").name("depth test");
    optionsGui.add(options, "showLights").name("show lights");

    
    const cameraGui = gui.addFolder("camera");
    cameraGui.add(camera, "fovy").min(1).max(100).step(1).listen();
    cameraGui.add(camera, "aspect").min(0).max(10).step(0.1).listen().domElement.style.pointerEvents = "none";
    cameraGui.add(camera, "near").min(0.1).max(20).step(0.1).listen().onChange(function(v){
        camera.near = Math.min(camera.far - 0.5, v);
    });
    cameraGui.add(camera, "far").min(0.1).max(20).step(0.1).listen().onChange(function(v){
        camera.far = Math.max(camera.near + 0.5, v);
    });
    
    const eye = cameraGui.addFolder("eye");
    eye.add(camera.eye, 0).name("x").step(0.05).listen();
    eye.add(camera.eye, 1).name("y").step(0.05).listen();
    eye.add(camera.eye, 2).name("z").step(0.05).listen();
    const at = cameraGui.addFolder("at");
    at.add(camera.at, 0).name("x").step(0.05).listen();
    at.add(camera.at, 1).name("y").step(0.05).listen();
    at.add(camera.at, 2).name("z").step(0.05).listen();
    const up = cameraGui.addFolder("up");
    up.add(camera.up, 0).name("x").step(0.05).listen();
    up.add(camera.up, 1).name("y").step(0.05).listen();
    up.add(camera.up, 2).name("z").step(0.05).listen();
    
    const Lights = new DAT.GUI();
    const lightsGui = Lights.addFolder("lights");
    for (let i = 0; i < MAX_LIGHTS; i++){

        lights[i] = {
            pos: randomPos(),
            Ia: vec3(255, 255, 255),
            Id:vec3(255, 255, 255),
            Is: vec3(255, 255, 255),
            isDirectional: true,
            isActive: true
        };

        const light = lightsGui.addFolder("light " + i);
        const position = light.addFolder("position");
        position.add(lights[i].pos, 0).name("x").step(0.1).listen();
        position.add(lights[i].pos, 1).name("y").step(0.1).listen();
        position.add(lights[i].pos, 2).name("z").step(0.1).listen();

        light.addColor(lights[i], "Ia").name("ambient");
        light.addColor(lights[i], "Id").name("difuse");
        light.addColor(lights[i], "Is").name("spectacular");

        light.add(lights[i], "isDirectional").name("directional");
        light.add(lights[i], "isActive").name("active");
    }

    const gui2 = new DAT.GUI();
    const objGui = gui2.addFolder("object info");
    objGui.add(materialInfo, "obj", ["Cube", "Sphere", "Torus", "Pyramid", "Cylinder"]).name("object");
    const matGui = objGui.addFolder("material");
    matGui.addColor(materialInfo, "Ka");
    matGui.addColor(materialInfo, "Ks");
    matGui.addColor(materialInfo, "Kd");
    matGui.add(materialInfo, "shininess");

    let mView, mProjection;

    gl.clearColor(0.150, 0.144, 0.144, 1.0);

    gl.enable(gl.DEPTH_TEST);

    resizeCanvasToFullWindow();

    window.addEventListener('resize', resizeCanvasToFullWindow);

    window.addEventListener('wheel', function(event) {
        const factor = 1 - event.deltaY/1000;
        camera.fovy = Math.max(1, Math.min(100, camera.fovy * factor)); 
    });

    window.requestAnimationFrame(render);

    function resizeCanvasToFullWindow()
    {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        camera.aspect = canvas.width / canvas.height;

        gl.viewport(0,0,canvas.width, canvas.height);
    }

    function uploadModelView()
    {
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mModelView"), false, flatten(modelView()));
    }

    function uploadModelViewLights()
    {
        gl.uniformMatrix4fv(gl.getUniformLocation(programLights, "mModelView"), false, flatten(modelView()));
    }

    function randomPos()
    {
        return vec3(2 * Math.random() - 1, Math.random() + 0.5, 2 * Math.random() - 1);
    }

    function optionsUpdate()
    {
        if(options.backfaceCulling){
            gl.enable(gl.CULL_FACE);
            gl.cullFace(gl.BACK);
        }
        else
            gl.disable(gl.CULL_FACE);

        if(options.depthTest)
            gl.enable(gl.DEPTH_TEST);
        else
            gl.disable(gl.DEPTH_TEST);
    }

    function drawFloor()
    {
        pushMatrix();
            multTranslation([0, -0.55, 0]);
            multScale([3.0, 0.1, 3.0]);
            uploadModelView();
            CUBE.draw(gl, program, gl.TRIANGLES);
        popMatrix();
    }

    function drawObject()
    {
        pushMatrix();
            switch(materialInfo.obj) {
                case 'Cube':
                    CUBE.draw(gl, program, gl.TRIANGLES);
                    break;
                case 'Sphere':
                    SPHERE.draw(gl, program, gl.TRIANGLES);
                    break;
                case 'Torus':
                    TORUS.draw(gl, program, gl.TRIANGLES);
                    break;
                case 'Pyramid':
                    PYRAMID.draw(gl, program, gl.TRIANGLES);
                    break;
                case 'Cylinder':
                    CYLINDER.draw(gl, program, gl.TRIANGLES);
                    break;
            }
        popMatrix();
    }

    function drawLights()
    {
        for(let i = 0; i < lights.length; i++){
            pushMatrix();
            if(lights[i].isActive) {
                
                gl.uniform3fv(gl.getUniformLocation(programLights, "Is"), scale(1/255.0,lights[i].Is));
                
                multTranslation(lights[i].pos);
                multScale([0.1, 0.1, 0.1]);
                uploadModelViewLights();
                SPHERE.draw(gl, programLights, gl.LINES);
            }
            popMatrix();           
        }
    }

    function updateLightsInfo()
    {
       
        for(let i = 0; i < lights.length; i++){

            if(lights[i].isActive)
               
                
                gl.uniform3fv(gl.getUniformLocation(program, "uLight[" + i + "].pos"), lights[i].pos);
                gl.uniform3fv(gl.getUniformLocation(program, "uLight[" + i + "].Ia"), scale(1/255,(lights[i].Ia)));
                gl.uniform3fv(gl.getUniformLocation(program, "uLight[" + i + "].Id"), scale(1/255,(lights[i].Id)));
                gl.uniform3fv(gl.getUniformLocation(program, "uLight[" + i + "].Is"), scale(1/255,(lights[i].Is)));
                gl.uniform1i(gl.getUniformLocation(program, "uLight[" + i + "].isDirectional"), lights[i].isDirectional); 
                gl.uniform1i(gl.getUniformLocation(program, "uLight[" + i + "].isActive"), lights[i].isActive);
        }
    }

    function updateObjectMaterialInfo()
    {
        const uKa = gl.getUniformLocation(program, "uMaterial.Ka");
        const uKd = gl.getUniformLocation(program, "uMaterial.Kd");
        const uKs = gl.getUniformLocation(program, "uMaterial.Ks");
        const uShininess = gl.getUniformLocation(program, "uMaterial.shininess");
        
        gl.uniform3fv(uKa, scale(1/255,materialInfo.Ka));
        gl.uniform3fv(uKd, scale(1/255,materialInfo.Kd));
        gl.uniform3fv(uKs, scale(1/255,materialInfo.Ks));
        gl.uniform1f(uShininess, materialInfo.shininess);
    }

    function updateFloorMaterialInfo()
    {
        const uKa = gl.getUniformLocation(program, "uMaterial.Ka");
        const uKd = gl.getUniformLocation(program, "uMaterial.Kd");
        const uKs = gl.getUniformLocation(program, "uMaterial.Ks");
        const uShininess = gl.getUniformLocation(program, "uMaterial.shininess");
        
        gl.uniform3fv(uKa, scale(1/255, [0,0,0]));
        gl.uniform3fv(uKd, scale(1/255, [50,50,150]));
        gl.uniform3fv(uKs, scale(1/255, materialInfo.Ks));
        gl.uniform1f(uShininess, materialInfo.shininess);
    }

    function render()
    {
        window.requestAnimationFrame(render);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        gl.useProgram(program);

        mView = lookAt(camera.eye, camera.at, camera.up);
        loadMatrix(mView);
        
        mProjection = perspective(camera.fovy, camera.aspect, camera.near, camera.far);
        
        uploadModelView();
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mNormals"), false, flatten(normalMatrix(modelView())));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mView"), false, flatten(mView));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mViewNormals"), false, flatten(normalMatrix(mView)));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mProjection"), false, flatten(mProjection));

        
        updateLightsInfo();
        
        updateObjectMaterialInfo();
        drawObject();
        updateFloorMaterialInfo();
        drawFloor();

        gl.useProgram(programLights);
        uploadModelViewLights();
        gl.uniformMatrix4fv(gl.getUniformLocation(programLights, "mProjection"), false, flatten(mProjection));
        if(options.showLights){
            drawLights();
        }
        
        optionsUpdate();
    }
}

const urls = ["shader.vert", "shader.frag", "shader2.vert", "shader2.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders))