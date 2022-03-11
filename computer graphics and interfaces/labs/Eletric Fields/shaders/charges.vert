precision highp float;
attribute vec4 vPosition;
attribute float vValue;
uniform float uTable_width, uTable_height;
varying vec4 fColor;


void main()
{
    gl_Position = vec4(vPosition.x * 2.0/uTable_width, vPosition.y * 2.0/uTable_height, vPosition.z, vPosition.w);
    gl_PointSize = 25.0; 
    if(vValue > 0.0){
        fColor = vec4(0.0, 1.0, 0.0, 1.0);
    }else{
        fColor = vec4(1.0, 0.0, 0.0, 1.0);
    }

}